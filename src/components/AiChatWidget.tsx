'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  Cpu,
  Loader2,
  Pencil,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  time: string;
  isError?: boolean;
  retryText?: string;
}

interface AiModelProfile {
  id: string;
  providerName: string;
  model: string;
  maskedKey: string;
  isActive: boolean;
}

interface AiUser {
  name: string;
  roleDisplayName: string;
  villageName: string | null;
}

function createWelcomeMessage(user: AiUser | null = null, provider = 'AI'): ChatMessage {
  const greeting = user
    ? `Halo ${user.name}! Saya AI DesaSmart. Saya siap membantu Anda sebagai ${user.roleDisplayName}${user.villageName ? ` di ${user.villageName}` : ''}. Saya bisa membantu belajar, menulis, menerjemahkan, mencari ide, menjawab pertanyaan umum, dan memberi panduan layanan desa. Apa yang ingin Anda bahas?`
    : 'Halo! Saya AI DesaSmart. Saya bisa membantu belajar, menulis, menerjemahkan, mencari ide, menjawab pertanyaan umum, dan memberi panduan layanan desa. Apa yang ingin Anda bahas?';

  return {
    id: 'welcome',
    role: 'assistant',
    content: greeting,
    source: `${provider} · Asisten DesaSmart`,
    time: 'Baru saja',
  };
}

const SUGGESTIONS = [
  { title: 'Bantu saya belajar', prompt: 'Bantu saya memahami topik baru dengan penjelasan yang mudah.' },
  { title: 'Tulis sesuatu', prompt: 'Bantu saya menulis pesan yang sopan dan jelas.' },
  { title: 'Cari ide', prompt: 'Beri saya beberapa ide kegiatan atau usaha sederhana.' },
  { title: 'Panduan layanan desa', prompt: 'Apa saja persyaratan umum untuk mengajukan SKTM?' },
  { title: 'Kenali akun saya', prompt: 'Siapa saya dan terdaftar sebagai apa?' },
  { title: 'Data warga', prompt: 'Berapa jumlah warga yang tercatat di database desa?' },
];

function formatMessageTime(date = new Date()) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AiUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [providerName, setProviderName] = useState('AI');
  const [modelName, setModelName] = useState('');
  const [modelProfiles, setModelProfiles] = useState<AiModelProfile[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [modelNote, setModelNote] = useState('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageSequence = useRef(0);

  const nextMessageId = () => `message-${++messageSequence.current}`;

  // Provider/model AI aktif + daftar profil AI tersimpan untuk pemilih model.
  // Diambil ulang setiap widget dibuka agar badge ikut berubah saat model diganti.
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;

    void fetch('/api/ai/provider')
      .then((response) => response.json())
      .then((data) => {
        if (!isCurrent) return;
        const provider =
          typeof data.providerName === 'string' && data.providerName ? data.providerName : null;
        const model = typeof data.model === 'string' ? data.model : '';
        setModelName(model);
        if (!provider) return;
        setProviderName(provider);
        setMessages((previous) =>
          previous.length === 1 && previous[0].id === 'welcome'
            ? [{ ...previous[0], source: `${provider} · Asisten DesaSmart` }]
            : previous
        );
      })
      .catch(() => {
        /* badge tetap memakai label default AI */
      });

    void fetch('/api/ai/models')
      .then(async (response) => {
        if (!response.ok) {
          // Peran tanpa hak pilih model (atau belum login): sembunyikan pemilih.
          if (isCurrent) setModelProfiles([]);
          return;
        }
        const data = await response.json();
        if (isCurrent && Array.isArray(data.profiles)) setModelProfiles(data.profiles);
      })
      .catch(() => {
        if (isCurrent) setModelProfiles([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  const switchModel = async (profile: AiModelProfile) => {
    if (profile.isActive || switchingId) return;
    setSwitchingId(profile.id);
    setModelNote('');
    try {
      const response = await fetch('/api/ai/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: profile.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setModelNote(data.error || 'Gagal mengganti model AI.');
        return;
      }
      setModelProfiles((previous) =>
        previous.map((item) => ({ ...item, isActive: item.id === profile.id }))
      );
      setProviderName(profile.providerName);
      setModelName(profile.model);
      setModelNote(`Model AI diganti ke ${profile.providerName} · ${profile.model}.`);
      setPickerOpen(false);
    } catch {
      setModelNote('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSwitchingId(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    void fetch('/api/ai/chat?context=1')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Gagal memeriksa sesi akun.');
        }

        if (!isCurrent) return;
        const user =
          data.authenticated &&
            typeof data.user?.name === 'string' &&
            typeof data.user?.roleDisplayName === 'string'
            ? {
              name: data.user.name,
              roleDisplayName: data.user.roleDisplayName,
              villageName:
                typeof data.user.villageName === 'string'
                  ? data.user.villageName
                  : null,
            }
            : null;

        setCurrentUser(user);
        setMessages((previous) =>
          previous.length === 1 && previous[0].id === 'welcome'
            ? [createWelcomeMessage(user, providerName)]
            : previous
        );
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return;
        console.error('Load AI user context error:', loadError);
        setError('Profil akun belum dapat dimuat. AI tetap bisa digunakan.');
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, providerName]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (isOpen && container) container.scrollTop = container.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = input ? `${Math.min(textarea.scrollHeight, 64)}px` : '36px';
  }, [input]);

  const startNewChat = () => {
    if (loading) return;
    setConversationId(null);
    setMessages([createWelcomeMessage(currentUser, providerName)]);
    setPickerOpen(false);
    setInput('');
    setError('');
    textareaRef.current?.focus();
  };

  const handleSend = async (textToSend?: string, historyBase?: ChatMessage[]) => {
    const text = (textToSend ?? input).trim();
    if (!text || loading || text.length > 4000) return;

    const baseMessages = historyBase ?? messages;
    const currentHistory = baseMessages
      .filter((message) => message.id !== 'welcome' && !message.isError)
      .map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      content: text,
      time: formatMessageTime(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setPickerOpen(false);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          history: currentHistory,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI gagal memproses pesan.');
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((previous) => [
        ...previous,
        {
          id: nextMessageId(),
          role: 'assistant',
          content: data.reply,
          source: data.source || 'DesaSmart AI',
          time: formatMessageTime(),
        },
      ]);
    } catch (sendError) {
      const errorMessage = sendError instanceof Error
        ? sendError.message
        : 'Koneksi ke asisten AI terganggu. Silakan coba lagi.';
      setError(errorMessage);
      setMessages((previous) => [
        ...previous,
        {
          id: nextMessageId(),
          role: 'assistant',
          content: errorMessage,
          time: formatMessageTime(),
          isError: true,
          retryText: text,
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const beginEdit = (message: ChatMessage) => {
    if (loading) return;
    setEditingId(message.id);
    setEditText(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (messageId: string) => {
    const newText = editText.trim();
    if (!newText || loading) return;
    const index = messages.findIndex((message) => message.id === messageId);
    if (index === -1) return;
    const kept = messages.slice(0, index);
    setMessages(kept);
    setEditingId(null);
    setEditText('');
    setError('');
    await handleSend(newText, kept);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          id="open-ai-chat-btn"
          type="button"
          onClick={() => {
            setError('');
            setIsOpen(true);
          }}
          className="group neu-btn-primary flex items-center gap-2.5 !rounded-full !px-5 !py-3.5 shadow-xl transition-all hover:-translate-y-1 cursor-pointer dark:!bg-gradient-to-r dark:!from-emerald-700 dark:!via-teal-700 dark:!to-emerald-800 dark:!text-white dark:border dark:border-emerald-400/30 dark:shadow-2xl dark:shadow-emerald-950/80"
          aria-label="Buka AI Assistant"
        >
          <span className="relative">
            <Bot className="h-5 w-5 text-white transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          </span>
          <span className="text-sm font-bold tracking-wide text-white">Tanya AI Desa</span>
          <Sparkles className="h-4 w-4 text-emerald-200 transition-transform group-hover:rotate-12" />
        </button>
      )}

      {isOpen && (
        <section className="fixed bottom-4 right-4 z-50 flex h-[min(34rem,75dvh)] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden neu-raised bg-[var(--bg)] text-[var(--ink)] shadow-2xl">
          <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg)]">
            <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-[var(--shadow-dark)]/20 bg-[var(--bg)] px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="neu-circle-inset-sm !h-8 !w-8 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <span className="truncate text-sm font-extrabold tracking-tight text-[var(--ink)]">DesaSmart AI</span>
                {modelProfiles.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModelNote('');
                      setPickerOpen((value) => !value);
                    }}
                    aria-expanded={pickerOpen}
                    aria-haspopup="listbox"
                    title="Pilih model AI tersimpan sebelum bertanya"
                    className="inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-full neu-inset-sm px-2 py-1 text-[10px] font-bold text-[var(--accent)] transition-colors"
                  >
                    <Cpu className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {providerName.toUpperCase()}
                      {modelName ? ` · ${modelName}` : ''}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 shrink-0 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <span className="hidden rounded-full neu-inset-sm px-2 py-1 text-[10px] font-bold text-[var(--accent)] sm:inline-flex">
                    ✦ {providerName.toUpperCase()}
                    {modelName ? ` · ${modelName}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={loading}
                  title="Reset percakapan ini. Riwayat tersimpan tidak dihapus."
                  className="neu-raised-sm flex h-9 w-9 items-center justify-center text-[var(--muted)] cursor-pointer active:shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Reset chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="neu-raised-sm flex h-9 w-9 items-center justify-center text-[var(--muted)] hover:text-rose-600 transition-colors cursor-pointer active:shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]"
                  aria-label="Tutup AI"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {pickerOpen && modelProfiles.length > 0 && (
              <div
                role="listbox"
                aria-label="Pilih model AI"
                className="absolute inset-x-2 top-16 z-20 max-h-[65%] overflow-y-auto rounded-2xl border border-[var(--shadow-dark)]/30 bg-[var(--bg)] p-2 shadow-2xl neu-raised backdrop-blur-xl"
              >
                <p className="px-1.5 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Pilih model AI sebelum bertanya
                </p>
                {modelProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    role="option"
                    aria-selected={profile.isActive}
                    disabled={switchingId !== null}
                    onClick={() => void switchModel(profile)}
                    className={`flex w-full cursor-pointer items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${profile.isActive
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15'
                      : 'border-[var(--shadow-dark)]/20 bg-[var(--bg)] hover:border-[var(--accent)]/30 neu-raised-sm'
                      }`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {switchingId === profile.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                      ) : profile.isActive ? (
                        <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold text-[var(--ink)]">
                        {profile.providerName}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-[var(--accent)]">
                        {profile.model}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-[var(--muted)]">
                        {profile.maskedKey}
                      </span>
                    </span>
                    {profile.isActive && (
                      <span className="shrink-0 rounded-full bg-[var(--accent)]/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[var(--accent)]">
                        Aktif
                      </span>
                    )}
                  </button>
                ))}
                <p className="px-1.5 pb-1 pt-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
                  Kunci baru ditambahkan lewat panel Pengaturan AI di dashboard staf/superadmin.
                </p>
              </div>
            )}

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div
                ref={messagesContainerRef}
                tabIndex={0}
                aria-label="Riwayat pesan AI"
                className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
              >
                {messages.length === 1 && messages[0].id === 'welcome' ? (
                  <div className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-4 pb-6 pt-6 sm:px-5">
                    <div className="mb-5 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-lg shadow-emerald-950/20 transition-transform hover:rotate-0 hover:scale-105">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full neu-pill-inset px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--accent)]">
                        Asisten DesaSmart
                      </span>
                      <h1 className="text-xl font-black tracking-tight text-[var(--ink)] sm:text-2xl">
                        Ada yang bisa saya bantu?
                      </h1>
                      <p className="mt-1.5 text-xs text-[var(--muted)] font-medium">
                        Pilih topik atau tanyakan langsung kepada AI DesaSmart.
                      </p>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.title}
                          type="button"
                          onClick={() => void handleSend(suggestion.prompt)}
                          className="group neu-raised-sm p-3.5 text-left border border-[var(--shadow-dark)]/25 bg-[var(--bg)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md cursor-pointer active:shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]"
                        >
                          <span className="block text-xs font-extrabold text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                            {suggestion.title}
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-[var(--muted)] font-medium">
                            {suggestion.prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-3 py-5 sm:px-4">
                    {messages.filter((message) => message.id !== 'welcome').map((message) => (
                      <article
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[88%] ${message.role === 'user'
                            ? 'relative rounded-2xl rounded-br-sm neu-btn-primary !p-3.5 text-[var(--accent-ink)] shadow-md sm:max-w-[78%]'
                            : `min-w-0 flex-1 rounded-2xl p-4 neu-raised-sm border border-[var(--shadow-dark)]/25 bg-[var(--bg)] ${message.isError
                              ? 'border-amber-400/50 bg-amber-500/10 text-amber-900 dark:text-amber-100'
                              : 'text-[var(--ink)]'
                            }`
                            }`}
                        >
                          <p className={`whitespace-pre-wrap break-words text-sm leading-6 ${message.role === 'user'
                            ? 'text-[var(--accent-ink)]'
                            : message.isError
                              ? 'text-amber-900 dark:text-amber-100'
                              : 'text-[var(--ink)]'
                            }`}>
                            {message.content}
                          </p>
                          {message.role === 'user' && editingId === message.id && (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={editText}
                                onChange={(event) => setEditText(event.target.value)}
                                rows={3}
                                maxLength={4000}
                                className="w-full resize-none rounded-lg border border-white/30 bg-black/20 px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/70"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void saveEdit(message.id)}
                                  disabled={loading || !editText.trim()}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/30 disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" /> Kirim ulang
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors hover:text-white"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                          {message.role === 'user' && editingId !== message.id && (
                            <button
                              type="button"
                              onClick={() => beginEdit(message)}
                              disabled={loading}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-ink)]/80 transition-colors hover:text-[var(--accent-ink)] disabled:opacity-40"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                          )}
                          {message.source && (
                            <p className={`mt-2 text-[10px] font-medium ${message.role === 'user' ? 'text-[var(--accent-ink)]/80' : 'text-[var(--muted)]'}`}>
                              {message.source}
                            </p>
                          )}
                          {message.isError && (
                            <button
                              type="button"
                              onClick={() => message.retryText && void handleSend(message.retryText)}
                              disabled={loading}
                              className="mt-2 rounded-lg border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 transition-colors hover:bg-amber-400/25 disabled:opacity-50"
                            >
                              Coba lagi
                            </button>
                          )}
                          {message.role === 'assistant' && (
                            <div className="mt-1 text-[10px] font-medium text-[var(--muted)]">{message.time}</div>
                          )}
                        </div>
                      </article>
                    ))}
                    {loading && (
                      <div className="flex gap-3 items-center text-sm font-semibold text-[var(--accent)]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md">
                          <Sparkles className="h-4 w-4 animate-pulse" />
                        </div>
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                          Sedang menyiapkan jawaban...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-[var(--shadow-dark)]/20 bg-[var(--bg)] px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-2">
                <div className="mx-auto max-w-xl">
                  {modelNote && (
                    <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-xs text-[var(--accent)]">
                      <span>{modelNote}</span>
                      <button type="button" onClick={() => setModelNote('')} aria-label="Tutup info model" className="shrink-0 text-[var(--accent)] hover:opacity-75">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {error && (
                    <div role="alert" className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                      <span>{error}</span>
                      <button type="button" onClick={() => setError('')} aria-label="Tutup pesan" className="shrink-0 text-rose-700 dark:text-rose-300 hover:opacity-75">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <form
                    onSubmit={handleSubmit}
                    className="neu-inset p-2 flex items-center gap-2"
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Kirim pesan ke DesaSmart..."
                      maxLength={4000}
                      rows={1}
                      disabled={loading}
                      className="max-h-16 min-h-9 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3 py-1.5 text-sm leading-5 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:ring-0 disabled:opacity-60"
                      aria-label="Pesan untuk AI DesaSmart"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || input.length > 4000 || loading}
                      title="Kirim pesan"
                      className="neu-btn-primary flex h-10 w-10 shrink-0 items-center justify-center !p-0 !rounded-full cursor-pointer disabled:opacity-40 dark:!bg-emerald-600 dark:hover:!bg-emerald-500"
                      aria-label="Kirim pesan"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Send className="h-4 w-4 text-white" strokeWidth={2.5} />
                      )}
                    </button>
                  </form>
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-[var(--muted)]">
                    AI dapat keliru. Jangan bagikan kata sandi, API key, atau data pribadi sensitif.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
