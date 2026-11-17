import { prisma } from '@/lib/prisma';

const SETTINGS_ID = 'singleton';

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const DEFAULT_AI_MODEL = 'openai/gpt-oss-120b';

export interface ActiveAiConfig {
  apiKey: string | null;
  baseUrl: string;
  model: string;
  providerName: string;
  source: 'DATABASE' | 'ENV' | 'NONE';
  credentialId?: string;
}

async function getAiSettingRow() {
  return prisma.aiSetting.findUnique({ where: { id: SETTINGS_ID } });
}

/** Hilangkan spasi & slash di akhir agar aman saat disambung /chat/completions */
export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Konfigurasi AI aktif: profil API key terpilih di database (AiCredential,
 * atau nilai warisan AiSetting.apiKey) lebih diprioritaskan dibanding environment.
 * Fallback env: AI_API_KEY/AI_BASE_URL/AI_MODEL (umum), lalu GROQ_API_KEY/GROQ_MODEL.
 */
export async function getActiveAiConfig(): Promise<ActiveAiConfig> {
  const row = await getAiSettingRow();

  if (row?.activeCredentialId) {
    const credential = await prisma.aiCredential.findUnique({
      where: { id: row.activeCredentialId },
    });
    if (credential) {
      return {
        apiKey: credential.apiKey,
        baseUrl: normalizeBaseUrl(credential.baseUrl || GROQ_BASE_URL),
        model: credential.model || DEFAULT_AI_MODEL,
        providerName: credential.providerName,
        source: 'DATABASE',
        credentialId: credential.id,
      };
    }
  }

  if (row?.apiKey) {
    return {
      apiKey: row.apiKey,
      baseUrl: normalizeBaseUrl(row.baseUrl || GROQ_BASE_URL),
      model: row.model || DEFAULT_AI_MODEL,
      providerName: row.providerName || 'AI Kustom',
      source: 'DATABASE',
    };
  }

  if (process.env.AI_API_KEY) {
    return {
      apiKey: process.env.AI_API_KEY,
      baseUrl: normalizeBaseUrl(process.env.AI_BASE_URL || 'https://api.openai.com/v1'),
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      providerName: process.env.AI_PROVIDER || 'Provider ENV',
      source: 'ENV',
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: GROQ_BASE_URL,
      model: process.env.GROQ_MODEL || DEFAULT_AI_MODEL,
      providerName: 'GroqCloud',
      source: 'ENV',
    };
  }

  return { apiKey: null, baseUrl: GROQ_BASE_URL, model: DEFAULT_AI_MODEL, providerName: '-', source: 'NONE' };
}

export interface AiConfigInput {
  providerName: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export async function saveAiConfig(config: AiConfigInput, actor: { id: string; name: string }) {
  const baseUrl = normalizeBaseUrl(config.baseUrl || GROQ_BASE_URL);
  const model = config.model || DEFAULT_AI_MODEL;
  // Simpan sebagai profil key (upsert per provider+model) lalu aktifkan.
  const credential = await prisma.aiCredential.upsert({
    where: { providerName_model: { providerName: config.providerName, model } },
    create: {
      providerName: config.providerName,
      baseUrl,
      model,
      apiKey: config.apiKey,
    },
    update: {
      baseUrl,
      apiKey: config.apiKey,
    },
  });
  await prisma.aiSetting.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      providerName: config.providerName,
      baseUrl,
      model,
      apiKey: config.apiKey,
      activeCredentialId: credential.id,
      updatedById: actor.id,
      updatedByName: actor.name,
    },
    update: {
      providerName: config.providerName,
      baseUrl,
      model,
      apiKey: config.apiKey,
      activeCredentialId: credential.id,
      updatedById: actor.id,
      updatedByName: actor.name,
    },
  });
  return credential;
}

export interface AiCredentialSummary {
  id: string;
  providerName: string;
  baseUrl: string;
  model: string;
  maskedKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listAiCredentials(): Promise<AiCredentialSummary[]> {
  const [row, credentials] = await Promise.all([
    getAiSettingRow(),
    prisma.aiCredential.findMany({ orderBy: { updatedAt: 'desc' } }),
  ]);
  return credentials.map((credential) => ({
    id: credential.id,
    providerName: credential.providerName,
    baseUrl: credential.baseUrl,
    model: credential.model,
    maskedKey: maskApiKey(credential.apiKey),
    isActive: row?.activeCredentialId === credential.id,
    createdAt: credential.createdAt.toISOString(),
    updatedAt: credential.updatedAt.toISOString(),
  }));
}

export async function activateAiCredential(credentialId: string, actor: { id: string; name: string }) {
  const credential = await prisma.aiCredential.findUnique({ where: { id: credentialId } });
  if (!credential) return null;
  await prisma.aiSetting.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      providerName: credential.providerName,
      baseUrl: credential.baseUrl,
      model: credential.model,
      activeCredentialId: credential.id,
      updatedById: actor.id,
      updatedByName: actor.name,
    },
    update: {
      providerName: credential.providerName,
      baseUrl: credential.baseUrl,
      model: credential.model,
      activeCredentialId: credential.id,
      apiKey: credential.apiKey,
      updatedById: actor.id,
      updatedByName: actor.name,
    },
  });
  return credential;
}

export async function deleteAiCredential(credentialId: string) {
  const [row] = await Promise.all([
    getAiSettingRow(),
    prisma.aiCredential.delete({ where: { id: credentialId } }),
  ]);
  if (row?.activeCredentialId === credentialId) {
    await prisma.aiSetting.update({
      where: { id: SETTINGS_ID },
      data: { activeCredentialId: null, apiKey: null },
    });
  }
}

export async function clearAiConfig(actor: { id: string; name: string }) {
  await prisma.aiSetting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, updatedById: actor.id, updatedByName: actor.name },
    update: {
      providerName: null,
      baseUrl: null,
      model: null,
      apiKey: null,
      activeCredentialId: null,
      updatedById: actor.id,
      updatedByName: actor.name,
    },
  });
}

/** Sembunyikan sebagian besar kunci, sisakan awalan & akhiran saja. */
export function maskApiKey(key: string): string {
  if (key.length <= 10) return `${key.slice(0, 2)}••••`;
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}

export interface AiConnectionTestResult {
  ok: boolean;
  status?: number;
  message: string;
}

/** Ambil pesan error terstruktur body jawaban penyedia AI (format OpenAI). */
export function extractProviderErrorDetail(text: string): string {
  if (!text) return '';
  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string; code?: string; type?: string } | string;
    };
    const err = parsed?.error;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      // Kode error (mis. insufficient_user_quota) sering lebih informatif
      // daripada pesan mentah yang bisa berada dalam bahasa lain.
      const parts = [err.message, err.code].filter((v): v is string => Boolean(v));
      if (parts.length) return parts.join(' · ');
    }
  } catch {
    /* body bukan JSON */
  }
  return text;
}

/**
 * Sebagian penyedia aggregator membalas 403 dengan kode khusus saat
 * kuota/saldo akun habis — bukan karena API key salah. Bedakan dari error auth.
 */
export function isInsufficientCreditError(status: number, detail: string): boolean {
  if (status === 402) return true;
  return /insufficient[_\s-]*(user[_\s-]*)?(quota|balance|credit|fund)|quota[_\s-]*exceeded|balance.*(insufficient|zero)|out of (funds|credit)|\u4f59\u989d\u4e0d\u8db3|\u989d\u5ea6\u4e0d\u8db3/i.test(
    detail || ''
  );
}

/**
 * Ambil daftar model asli yang tersedia untuk API key di sebuah penyedia
 * (endpoint /models kompatibel OpenAI). Membedakan key ditolak vs endpoint
 * memang tidak menyediakan daftar model, agar pesan UI tidak menyesatkan.
 */
export type AiModelListResult =
  | { ok: true; models: string[] }
  | { ok: false; authFailed: boolean; message: string };

export async function fetchAiModels(
  baseUrl: string,
  apiKey: string
): Promise<AiModelListResult> {
  const base = normalizeBaseUrl(baseUrl);
  let res: Response;
  try {
    res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      ok: false,
      authFailed: false,
      message: timedOut
        ? 'Endpoint daftar model mengalami timeout. Periksa base URL dan koneksi internet server.'
        : 'Tidak dapat menghubungi endpoint daftar model penyedia AI.',
    };
  }

  if (res.status === 401 || res.status === 403) {
    const detail = extractProviderErrorDetail((await res.text().catch(() => '')).slice(0, 200));
    if (isInsufficientCreditError(res.status, detail)) {
      return {
        ok: false,
        authFailed: false,
        message: 'Saldo/kuota API key pada penyedia ini habis. Isi ulang saldo atau ganti API key.',
      };
    }
    return {
      ok: false,
      authFailed: true,
      message: `Penyedia AI menolak API key ini (${res.status}) sehingga daftar model tidak dapat diambil. ${detail || ''}`.trim(),
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      authFailed: false,
      message: `Penyedia AI tidak menyediakan endpoint daftar model (HTTP ${res.status}). Gunakan Uji Koneksi atau ketik nama model manual.`,
    };
  }

  try {
    const data = (await res.json()) as { data?: unknown };
    const raw = Array.isArray(data?.data) ? data.data : [];
    const ids = raw
      .map((item) =>
        typeof item === 'string'
          ? item
          : typeof (item as { id?: unknown })?.id === 'string'
            ? ((item as { id: string }).id)
            : typeof (item as { name?: unknown })?.name === 'string'
              ? ((item as { name: string }).name)
              : ''
      )
      .filter((id): id is string => Boolean(id));
    if (!ids.length) {
      return {
        ok: false,
        authFailed: false,
        message: 'Penyedia membalas daftar model kosong. Ketik nama model manual atau gunakan Uji Koneksi.',
      };
    }
    return { ok: true, models: ids.sort((a, b) => a.localeCompare(b)) };
  } catch {
    return {
      ok: false,
      authFailed: false,
      message: 'Balasan endpoint daftar model tidak dapat dibaca. Ketik nama model manual.',
    };
  }
}

/**
 * Uji koneksi ke penyedia AI mana pun yang kompatibel OpenAI.
 * Coba GET {base}/models; bila endpoint tidak tersedia, fallback ke
 * chat completion sangat kecil untuk memverifikasi key + model.
 */
export async function testAiConnection(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<AiConnectionTestResult> {
  const base = normalizeBaseUrl(params.baseUrl);
  const headers = { Authorization: `Bearer ${params.apiKey}`, 'Content-Type': 'application/json' };

  try {
    const res = await fetch(`${base}/models`, { headers, signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      return { ok: true, status: res.status, message: 'Koneksi berhasil dan API key valid.' };
    }
    if (res.status === 401) {
      return { ok: false, status: res.status, message: 'Penyedia AI menolak API key tersebut. Pastikan kunci benar.' };
    }
    if (res.status === 402) {
      return { ok: false, status: res.status, message: 'Saldo/kuota API key pada penyedia ini habis. Isi ulang saldo atau ganti API key.' };
    }
    if (res.status === 429) {
      return { ok: true, status: res.status, message: 'API key valid, namun batas permintaan sedang tercapai.' };
    }
    // 403 sering berarti endpoint /models tidak diizinkan (mis. organisasi
    // OpenAI belum terverifikasi) padahal key tetap valid untuk chat completion.
    if (res.status !== 403 && res.status !== 404 && res.status !== 405 && res.status !== 501) {
      return { ok: false, status: res.status, message: `Penyedia AI membalas HTTP ${res.status}. Coba lagi beberapa saat.` };
    }
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      ok: false,
      message: timedOut
        ? 'Koneksi ke penyedia AI mengalami timeout (15 detik). Periksa base URL dan koneksi internet server.'
        : 'Tidak dapat menghubungi penyedia AI. Periksa base URL dan koneksi internet server.',
    };
  }

  // Endpoint /models tidak tersedia: verifikasi lewat chat completion kecil.
  if (!params.model) {
    return { ok: false, message: 'Endpoint tidak mendukung daftar model. Isi nama model untuk uji koneksi.' };
  }
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: params.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      return { ok: true, status: res.status, message: 'Koneksi berhasil: API key dan model dikenali.' };
    }
    if (res.status === 401 || res.status === 403) {
      const probeDetail = extractProviderErrorDetail((await res.text().catch(() => '')).slice(0, 200));
      if (isInsufficientCreditError(res.status, probeDetail)) {
        return { ok: false, status: res.status, message: 'Saldo/kuota API key pada penyedia ini habis. Isi ulang saldo atau ganti API key.' };
      }
      return { ok: false, status: res.status, message: 'Penyedia AI menolak API key tersebut. Pastikan kunci benar.' };
    }
    if (res.status === 402) {
      return { ok: false, status: res.status, message: 'Saldo/kuota API key pada penyedia ini habis. Isi ulang saldo atau ganti API key.' };
    }
    if (res.status === 404) {
      return { ok: false, status: res.status, message: `Model "${params.model}" tidak ditemukan di penyedia ini.` };
    }
    if (res.status === 429) {
      return { ok: true, status: res.status, message: 'API key valid, namun batas permintaan sedang tercapai.' };
    }
    const detail = extractProviderErrorDetail((await res.text().catch(() => '')).slice(0, 200));
    return { ok: false, status: res.status, message: `Penyedia AI membalas HTTP ${res.status}. ${detail}` };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      ok: false,
      message: timedOut
        ? 'Uji chat completion mengalami timeout. Periksa base URL dan koneksi internet server.'
        : 'Gagal menghubungi endpoint chat completion penyedia AI.',
    };
  }
}
