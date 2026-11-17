import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { activateAiCredential, listAiCredentials } from '@/lib/ai-settings';

const PICKER_ROLES = ['STAFF', 'SUPERADMIN', 'KEPALA_DESA'];

/**
 * Daftar profil AI tersimpan untuk pemilih model di widget chat.
 * Hanya nama provider, model, dan kunci yang disamarkan — kunci asli tidak pernah keluar.
 */
async function requirePicker() {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Silakan login kembali.' }, { status: 401 }) };
  }
  if (!PICKER_ROLES.includes(user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Pemilihan model AI hanya untuk petugas desa.' },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function GET() {
  try {
    const access = await requirePicker();
    if ('response' in access) return access.response;

    const credentials = await listAiCredentials();
    return NextResponse.json({
      profiles: credentials.map((credential) => ({
        id: credential.id,
        providerName: credential.providerName,
        model: credential.model,
        maskedKey: credential.maskedKey,
        isActive: credential.isActive,
      })),
    });
  } catch (error) {
    console.error('Fetch AI model profiles error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar model AI.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const access = await requirePicker();
    if ('response' in access) return access.response;

    const body = await req.json().catch(() => null);
    const credentialId =
      typeof body === 'object' && body !== null && typeof (body as Record<string, unknown>).credentialId === 'string'
        ? ((body as Record<string, unknown>).credentialId as string)
        : '';
    if (!credentialId) {
      return NextResponse.json({ error: 'credentialId wajib diisi.' }, { status: 400 });
    }

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
      details: {
        change: 'ACTIVATE_AI_CREDENTIAL',
        via: 'CHAT_WIDGET',
        providerName: activated.providerName,
        model: activated.model,
      },
    });

    return NextResponse.json({
      success: true,
      providerName: activated.providerName,
      model: activated.model,
      message: `AI aktif: ${activated.providerName} · ${activated.model}.`,
    });
  } catch (error) {
    console.error('Activate AI model profile error:', error);
    return NextResponse.json({ error: 'Gagal mengganti model AI.' }, { status: 500 });
  }
}
