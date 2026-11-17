import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import {
  activateAiCredential,
  clearAiConfig,
  deleteAiCredential,
  fetchAiModels,
  getActiveAiConfig,
  listAiCredentials,
  maskApiKey,
  normalizeBaseUrl,
  saveAiConfig,
  testAiConnection,
} from '@/lib/ai-settings';
import { prisma } from '@/lib/prisma';

const ADMIN_ONLY = ['STAFF', 'SUPERADMIN'];

async function requireConfigurator() {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 }) };
  }
  if (!ADMIN_ONLY.includes(user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Pengaturan AI hanya dapat diakses staf dan superadmin.' },
        { status: 403 }
      ),
    };
  }
  return { user };
}

async function buildStatus() {
  const config = await getActiveAiConfig();
  return {
    configured: config.apiKey !== null,
    source: config.source,
    maskedKey: config.apiKey ? maskApiKey(config.apiKey) : null,
    providerName: config.providerName,
    baseUrl: config.baseUrl,
    model: config.model,
    activeCredentialId: config.credentialId ?? null,
  };
}

function parseBaseUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return normalizeBaseUrl(value);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const access = await requireConfigurator();
    if ('response' in access) return access.response;

    const status = await buildStatus();
    const [row, credentials] = await Promise.all([
      prisma.aiSetting.findUnique({ where: { id: 'singleton' } }),
      listAiCredentials(),
    ]);

    return NextResponse.json({
      ...status,
      credentials,
      updatedByName: row?.apiKey ? row.updatedByName : null,
      updatedAt: row?.apiKey ? row.updatedAt : null,
    });
  } catch (error) {
    console.error('Fetch AI settings error:', error);
    return NextResponse.json({ error: 'Gagal memuat pengaturan AI.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const access = await requireConfigurator();
    if ('response' in access) return access.response;

    const body = await req.json().catch(() => null);
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Data pengaturan tidak valid.' }, { status: 400 });
    }

    const { clear, apiKey, providerName, baseUrl, model, credentialId } = body as Record<string, unknown>;

    // Aktifkan profil API key yang sudah tersimpan tanpa salin-tempel.
    if (typeof credentialId === 'string' && credentialId) {
      const activated = await activateAiCredential(credentialId, {
        id: access.user.id,
        name: access.user.name,
      });
      if (!activated) {
        return NextResponse.json({ error: 'Profil API key tidak ditemukan.' }, { status: 404 });
      }
      await logAudit({
        userId: access.user.id,
        userEmail: access.user.email,
        userRole: access.user.role,
        action: 'UPDATE_AI_SETTINGS',
        entity: 'System',
        entityId: activated.id,
        details: { change: 'ACTIVATE_AI_CREDENTIAL', providerName: activated.providerName, model: activated.model },
      });
      const status = await buildStatus();
      return NextResponse.json({
        success: true,
        message: `AI aktif diganti ke ${activated.providerName} · ${activated.model}.`,
        ...status,
      });
    }

    if (clear === true) {
      await clearAiConfig({ id: access.user.id, name: access.user.name });
      await logAudit({
        userId: access.user.id,
        userEmail: access.user.email,
        userRole: access.user.role,
        action: 'UPDATE_AI_SETTINGS',
        entity: 'System',
        details: { change: 'CLEAR_AI_CONFIG' },
      });
      const status = await buildStatus();
      return NextResponse.json({
        success: true,
        message: 'Konfigurasi AI dari dashboard dihapus. Chatbot kembali memakai API key dari environment (.env).',
        ...status,
      });
    }

    const keyInput = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (keyInput.length > 300 || /\s/.test(keyInput)) {
      return NextResponse.json(
        { error: 'API key tidak valid (maks 300 karakter, tanpa spasi).' },
        { status: 400 }
      );
    }
    // Key boleh dikosongkan bila sudah ada kunci tersimpan di dashboard,
    // agar provider/base URL/model bisa diganti tanpa mengetik ulang kunci.
    const active = await getActiveAiConfig();
    const finalKey = keyInput || (active.source === 'DATABASE' ? active.apiKey : null);
    if (!finalKey) {
      return NextResponse.json(
        { error: 'API key tidak boleh kosong — isi kunci atau pilih profil key tersimpan.' },
        { status: 400 }
      );
    }

    const trimmedProvider =
      typeof providerName === 'string' && providerName.trim()
        ? providerName.trim().slice(0, 60)
        : 'AI Kustom';

    let trimmedBase = '';
    if (typeof baseUrl === 'string' && baseUrl.trim()) {
      const parsed = parseBaseUrl(baseUrl);
      if (!parsed) {
        return NextResponse.json(
          { error: 'Base URL tidak valid. Gunakan alamat http(s) penuh, contoh https://api.openai.com/v1.' },
          { status: 400 }
        );
      }
      trimmedBase = parsed;
    }

    const trimmedModel = typeof model === 'string' ? model.trim().slice(0, 120) : '';

    await saveAiConfig(
      {
        providerName: trimmedProvider,
        baseUrl: trimmedBase,
        model: trimmedModel,
        apiKey: finalKey,
      },
      { id: access.user.id, name: access.user.name }
    );
    await logAudit({
      userId: access.user.id,
      userEmail: access.user.email,
      userRole: access.user.role,
      action: 'UPDATE_AI_SETTINGS',
      entity: 'System',
      details: {
        change: 'SET_AI_CONFIG',
        providerName: trimmedProvider,
        baseUrl: trimmedBase || '(default groq)',
        model: trimmedModel || '(default)',
        maskedKey: maskApiKey(finalKey),
        keyRotated: keyInput.length > 0,
      },
    });

    const status = await buildStatus();
    return NextResponse.json({
      success: true,
      message: `Konfigurasi ${status.providerName} tersimpan sebagai profil API key dan langsung dipakai chatbot.`,
      ...status,
    });
  } catch (error) {
    console.error('Update AI settings error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan AI.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const access = await requireConfigurator();
    if ('response' in access) return access.response;

    const credentialId = new URL(req.url).searchParams.get('credentialId');
    if (!credentialId) {
      return NextResponse.json({ error: 'Parameter credentialId wajib diisi.' }, { status: 400 });
    }

    const existing = await prisma.aiCredential.findUnique({ where: { id: credentialId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profil API key tidak ditemukan.' }, { status: 404 });
    }

    await deleteAiCredential(credentialId);
    await logAudit({
      userId: access.user.id,
      userEmail: access.user.email,
      userRole: access.user.role,
      action: 'UPDATE_AI_SETTINGS',
      entity: 'System',
      entityId: credentialId,
      details: {
        change: 'DELETE_AI_CREDENTIAL',
        providerName: existing.providerName,
        model: existing.model,
      },
    });

    const status = await buildStatus();
    return NextResponse.json({
      success: true,
      message: `Profil ${existing.providerName} · ${existing.model} dihapus.`,
      ...status,
    });
  } catch (error) {
    console.error('Delete AI credential error:', error);
    return NextResponse.json({ error: 'Gagal menghapus profil API key.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await requireConfigurator();
    if ('response' in access) return access.response;

    const body = await req.json().catch(() => null);
    const candidate =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const active = await getActiveAiConfig();
    const apiKey =
      typeof candidate.apiKey === 'string' && candidate.apiKey.trim()
        ? candidate.apiKey.trim()
        : active.apiKey;
    const baseUrl =
      typeof candidate.baseUrl === 'string' && candidate.baseUrl.trim()
        ? candidate.baseUrl.trim()
        : active.baseUrl;
    const model =
      typeof candidate.model === 'string' && candidate.model.trim()
        ? candidate.model.trim()
        : active.model;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: 'Belum ada API key untuk diuji. Isi kunci terlebih dahulu.' },
        { status: 200 }
      );
    }

    // Aksi khusus: ambil daftar model asli yang tersedia untuk key ini (endpoint /models).
    if (candidate.action === 'listModels') {
      const result = await fetchAiModels(baseUrl, apiKey);
      if (!result.ok) {
        return NextResponse.json({ ok: false, authFailed: result.authFailed, message: result.message });
      }
      return NextResponse.json({ ok: true, models: result.models });
    }

    const result = await testAiConnection({ baseUrl, apiKey, model });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Test AI settings error:', error);
    return NextResponse.json({ ok: false, message: 'Gagal menguji koneksi ke penyedia AI.' }, { status: 500 });
  }
}
