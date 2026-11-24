'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Save,
  PlugZap,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Info,
  Globe,
  Cpu,
  BadgeCheck,
  PlusCircle,
  ListChecks,
} from 'lucide-react';

interface CredentialInfo {
  id: string;
  providerName: string;
  baseUrl: string;
  model: string;
  maskedKey: string;
  isActive: boolean;
  updatedAt: string;
}

interface AiSettingsStatus {
  configured: boolean;
  source: 'DATABASE' | 'ENV' | 'NONE';
  maskedKey: string | null;
  providerName: string;
  baseUrl: string;
  model: string;
  activeCredentialId: string | null;
  credentials: CredentialInfo[];
  updatedByName: string | null;
  updatedAt: string | null;
}

interface Feedback {
  type: 'success' | 'error';
  text: string;
}

const PROVIDER_PRESETS: {
  name: string;
  baseUrl: string;
  models: string[];
  keyHint: string;
}[] = [
  {
    // Aggregator: satu key bisa memakai model OpenAI, DeepSeek, Claude, Gemini, Qwen.
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'openai/gpt-5.6-luna',
      'openai/gpt-5.4-mini',
      'openai/gpt-4o-mini',
      'deepseek/deepseek-v4-flash',
      'deepseek/deepseek-v4-pro',
      'anthropic/claude-sonnet-5.5',
      'google/gemini-3.5-flash',
      'qwen/qwen3.8-27b',
    ],
    keyHint: 'sk-or-... (openrouter.ai/keys). Satu key ini bisa memanggil model OpenAI, DeepSeek, Claude, Gemini. Tekan "Ambil Daftar Model" untuk 400+ model lain.',
  },
  {
    name: 'GroqCloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    keyHint: 'gsk_... (console.groq.com/keys)',
  },
  {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'],
    keyHint: 'AIza... (aistudio.google.com/apikey)',
  },
  {
    name: 'Lainnya (kompatibel OpenAI)',
    baseUrl: '',
    models: [],
    keyHint: 'API key penyedia lain (Ollama lokal, vLLM, dll). Untuk lokal cukup isi apa saja.',
  },
];

const CUSTOM_PRESET = PROVIDER_PRESETS[PROVIDER_PRESETS.length - 1];
const CUSTOM_MODEL_VALUE = '__ketik_sendiri__';

/**
 * Cari preset untuk konfigurasi tersimpan. Nama bisa berbeda karena preset
 * pernah diganti, jadi base URL dipakai sebagai pencocokan cadangan.
 */
function findPreset(providerName: string, baseUrl?: string | null) {
  const normalize = (value: string) => value.trim().replace(/\/+$/, '');
  return (
    PROVIDER_PRESETS.find((preset) => preset.name === providerName) ||
    PROVIDER_PRESETS.find(
      (preset) => preset.baseUrl && normalize(preset.baseUrl) === normalize(baseUrl || '')
    ) ||
    null
  );
}

const ACCENTS = {
  emerald: {
    iconChip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    focus: 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10',
    primaryBtn: 'bg-slate-900 hover:bg-emerald-700',
    statusOk: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeRing: 'border-emerald-300 bg-emerald-50/60',
  },
  violet: {
    iconChip: 'border-violet-200 bg-violet-50 text-violet-700',
    focus: 'focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10',
    primaryBtn: 'bg-slate-900 hover:bg-violet-700',
    statusOk: 'bg-violet-50 text-violet-700 border-violet-200',
    activeRing: 'border-violet-300 bg-violet-50/60',
  },
} as const;

export default function AiSettingsPanel({ accent = 'emerald' }: { accent?: 'emerald' | 'violet' }) {
  const styles = ACCENTS[accent];
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<AiSettingsStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [providerName, setProviderName] = useState<string>(PROVIDER_PRESETS[0].name);
  const [baseUrl, setBaseUrl] = useState<string>(PROVIDER_PRESETS[0].baseUrl);
  const [modelChoice, setModelChoice] = useState<string>(PROVIDER_PRESETS[0].models[0]);
  const [customModel, setCustomModel] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [fetchedModels, setFetchedModels] = useState<string[] | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/settings');
      if (res.ok) {
        const data: AiSettingsStatus = await res.json();
        setStatus(data);
        if (data.source === 'DATABASE') {
          const preset = findPreset(data.providerName, data.baseUrl);
          setProviderName(preset ? preset.name : CUSTOM_PRESET.name);
          setBaseUrl(data.baseUrl || '');
          if (preset && preset.models.includes(data.model)) {
            setModelChoice(data.model);
          } else {
            setModelChoice(CUSTOM_MODEL_VALUE);
            setCustomModel(data.model || '');
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const activePreset = PROVIDER_PRESETS.find((p) => p.name === providerName) || CUSTOM_PRESET;

  const applyPreset = (name: string) => {
    setProviderName(name);
    setFetchedModels(null);
    const preset = PROVIDER_PRESETS.find((p) => p.name === name);
    if (preset && preset.name !== CUSTOM_PRESET.name) {
      setBaseUrl(preset.baseUrl);
      setModelChoice(preset.models[0]);
    }
    setFeedback(null);
  };

  const resolvedModel = modelChoice === CUSTOM_MODEL_VALUE ? customModel.trim() : modelChoice;
  // Daftar model dinamis dari penyedia mengalahkan preset statis.
  const modelOptions = fetchedModels ?? activePreset.models;

  const pullModelList = async () => {
    if (!baseUrl.trim()) {
      setFeedback({ type: 'error', text: 'Isi Base URL terlebih dahulu.' });
      return;
    }
    if (!apiKeyInput.trim()) {
      setFeedback({
        type: 'error',
        text: 'Isi API key penyedia ini terlebih dahulu — daftar model diambil memakai kunci yang diketik, bukan kunci profil aktif.',
      });
      return;
    }
    setFetchingModels(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listModels',
          baseUrl: baseUrl.trim(),
          apiKey: apiKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.models)) {
        setFetchedModels(null);
        setFeedback({ type: 'error', text: data.message || 'Gagal mengambil daftar model.' });
        return;
      }
      setFetchedModels(data.models);
      setModelChoice(data.models.includes(resolvedModel) ? resolvedModel : data.models[0]);
      setFeedback({
        type: 'success',
        text: `Dapat ${data.models.length} model asli dari penyedia. Daftar dropdown kini mengikuti key Anda.`,
      });
    } catch (e) {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setFetchingModels(false);
    }
  };

  const buildPayload = () => ({
    providerName:
      providerName === CUSTOM_PRESET.name ? 'AI Kustom (OpenAI-compatible)' : providerName,
    baseUrl: baseUrl.trim(),
    model: resolvedModel,
  });

  const applyStatus = (data: Partial<AiSettingsStatus>) => {
    setStatus((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const saveConfig = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed && status?.source !== 'DATABASE') {
      setFeedback({ type: 'error', text: 'Isi API key terlebih dahulu.' });
      return;
    }
    if (providerName === CUSTOM_PRESET.name && !baseUrl.trim()) {
      setFeedback({ type: 'error', text: 'Provider custom wajib mengisi Base URL.' });
      return;
    }
    if (!resolvedModel) {
      setFeedback({ type: 'error', text: 'Pilih atau isi nama model AI.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), ...(trimmed ? { apiKey: trimmed } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal menyimpan konfigurasi AI.' });
        return;
      }
      setFeedback({ type: 'success', text: data.message });
      setApiKeyInput('');
      setShowKey(false);
      applyStatus(data);
      void fetchStatus(); // segarkan daftar profil key tersimpan
    } catch (e) {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  const activateCredential = async (credentialId: string) => {
    setActivatingId(credentialId);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal memakai profil API key.' });
        return;
      }
      setFeedback({ type: 'success', text: data.message });
      await fetchStatus();
    } catch (e) {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setActivatingId(null);
    }
  };

  const deleteCredential = async (credentialId: string) => {
    setDeletingId(credentialId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/ai/settings?credentialId=${encodeURIComponent(credentialId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal menghapus profil API key.' });
        return;
      }
      setFeedback({ type: 'success', text: data.message });
      await fetchStatus();
    } catch (e) {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setDeletingId(null);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          apiKey: apiKeyInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      setFeedback({ type: data.ok ? 'success' : 'error', text: data.message });
    } catch (e) {
      setFeedback({ type: 'error', text: 'Gagal menghubungi server. Coba lagi.' });
    } finally {
      setTesting(false);
    }
  };

  const clearConfig = async () => {
    setClearing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Gagal menghapus konfigurasi AI.' });
        return;
      }
      setFeedback({ type: 'success', text: data.message });
      applyStatus(data);
      void fetchStatus();
    } catch (e) {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setClearing(false);
    }
  };

  const sourceBadge = () => {
    if (!status) return null;
    if (status.source === 'DATABASE') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles.statusOk}`}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Aktif — {status.providerName} · {status.model}
        </span>
      );
    }
    if (status.source === 'ENV') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
          <Info className="h-3.5 w-3.5" /> Aktif — {status.providerName} (ENV/.env)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
        <XCircle className="h-3.5 w-3.5" /> Belum dikonfigurasi
      </span>
    );
  };

  const labelCls = 'mb-1.5 flex items-center gap-2 text-xs font-bold text-[var(--ink)]';
  const inputCls = `w-full rounded-xl neu-inset bg-transparent py-2.5 px-3.5 text-sm text-[var(--ink)] outline-none transition`;
  const credentials = status?.credentials ?? [];

  return (
    <section id="pengaturan-ai" className="overflow-hidden neu-raised bg-[var(--bg)] text-[var(--ink)] scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-[var(--shadow-dark)]/15 bg-transparent p-4 sm:p-6 text-left transition hover:bg-[var(--shadow-dark)]/5"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl neu-inset-sm ${styles.iconChip}`}>
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">Pengaturan AI Chatbot</h3>
            <p className="text-xs text-[var(--muted)]">
              Ganti atau simpan API key (Groq, OpenRouter, Gemini, OpenAI) untuk asisten AI
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!loadingStatus && sourceBadge()}
          {open ? (
            <ChevronUp className="h-5 w-5 text-[var(--muted)]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[var(--muted)]" />
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-5 p-4 sm:p-6">
          {loadingStatus ? (
            <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat pengaturan AI...
            </div>
          ) : (
            <>
              {/* Profil API key tersimpan */}
              {credentials.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                    <BadgeCheck className="h-4 w-4 text-[var(--accent)]" /> API Key Tersimpan — klik untuk memakai
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {credentials.map((credential) => (
                      <div
                        key={credential.id}
                        className={`rounded-2xl p-3.5 transition ${
                          credential.isActive
                            ? 'border-2 border-[var(--accent)] neu-raised-sm bg-[var(--accent)]/10'
                            : 'neu-raised-sm border border-[var(--shadow-dark)]/15 bg-[var(--bg)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[var(--ink)]">{credential.providerName}</p>
                            <p className="truncate font-mono text-xs text-[var(--muted)]">{credential.model}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]/80">{credential.maskedKey}</p>
                          </div>
                          {credential.isActive && (
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles.statusOk}`}>
                              AKTIF
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          {!credential.isActive && (
                            <button
                              type="button"
                              onClick={() => activateCredential(credential.id)}
                              disabled={activatingId === credential.id}
                              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${styles.primaryBtn}`}
                            >
                              {activatingId === credential.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Gunakan
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteCredential(credential.id)}
                            disabled={deletingId === credential.id}
                            aria-label={`Hapus profil ${credential.providerName} ${credential.model}`}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === credential.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form konfigurasi baru */}
              <div className="space-y-4 rounded-2xl neu-inset p-4 sm:p-5">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  <PlusCircle className="h-4 w-4" /> Tambah / Ganti Konfigurasi AI
                </p>
                <div>
                  <label className={labelCls}>
                    <Cpu className="h-4 w-4 text-slate-500" /> Penyedia AI
                  </label>
                  <select
                    value={providerName}
                    onChange={(e) => applyPreset(e.target.value)}
                    className={inputCls}
                  >
                    {PROVIDER_PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>
                      <Globe className="h-4 w-4 text-slate-500" /> Base URL (kompatibel OpenAI)
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      <Cpu className="h-4 w-4 text-slate-500" /> Model AI
                      <button
                        type="button"
                        onClick={pullModelList}
                        disabled={fetchingModels}
                        title="Ambil daftar model asli langsung dari penyedia sesuai API key (endpoint /models)"
                        className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {fetchingModels ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ListChecks className="h-3 w-3" />
                        )}
                        Ambil Daftar Model
                      </button>
                    </label>
                    <select
                      value={modelChoice}
                      onChange={(e) => setModelChoice(e.target.value)}
                      className={inputCls}
                    >
                      {modelOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value={CUSTOM_MODEL_VALUE}>Ketik nama model sendiri…</option>
                    </select>
                    {fetchedModels && (
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Daftar di atas adalah model asli yang tersedia untuk API key ini di penyedia.
                      </p>
                    )}
                    {modelChoice === CUSTOM_MODEL_VALUE && (
                      <input
                        type="text"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder="contoh: gpt-4o-mini-2024-07-18"
                        className={`${inputCls} mt-2`}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    <KeyRound className="h-4 w-4 text-slate-500" /> API Key
                    <span className="font-medium text-slate-500">
                      {status?.source === 'DATABASE' ? '(kosongkan jika tidak berubah)' : ''}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={activePreset.keyHint}
                      className={`${inputCls} py-3 pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      aria-label={showKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-slate-800"
                    >
                      {showKey ? (
                        <EyeOff className="h-5 w-5" strokeWidth={2.25} />
                      ) : (
                        <Eye className="h-5 w-5" strokeWidth={2.25} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Setiap key tersimpan sebagai profil sesuai provider + modelnya — bisa dipakai ulang
                    cukup dengan klik, tanpa salin-tempel lagi. Manual tempel tetap bisa.
                  </p>
                </div>

                {/* Aksi */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={saveConfig}
                    disabled={saving || (!apiKeyInput.trim() && status?.source !== 'DATABASE')}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${styles.primaryBtn}`}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan &amp; Pakai
                  </button>
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={testing || (!apiKeyInput.trim() && !status?.configured)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                    Uji Koneksi
                  </button>
                  {status?.source === 'DATABASE' && (
                    <button
                      type="button"
                      onClick={clearConfig}
                      disabled={clearing}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />}
                      Matikan &amp; Kembali ke .env
                    </button>
                  )}
                </div>
              </div>

              {/* Umpan balik */}
              {feedback && (
                <div
                  role="alert"
                  className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                    feedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                      : 'border-rose-200 bg-rose-50/60 text-rose-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {feedback.text}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
