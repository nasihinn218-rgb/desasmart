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
          className="group flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-dark)] px-4 py-3 font-medium text-[var(--accent-mint)] shadow-xl shadow-black/25 transition-all hover:-translate-y-1 hover:bg-[#26332f] hover:shadow-2xl hover:shadow-black/35"
          aria-label="Buka AI Assistant"
        >
          <span className="relative">
            <Bot className="h-5 w-5 text-[var(--accent-mint)] transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          </span>
          <span className="text-sm font-semibold tracking-wide">Tanya AI Desa</span>
          <Sparkles className="h-4 w-4 text-[var(--accent-peach)] transition-transform group-hover:rotate-12" />
        </button>
      )}

      {isOpen && (
        <section className="fixed bottom-4 right-4 z-50 flex h-[min(30rem,70dvh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-dark)] text-white shadow-2xl shadow-black/40">
          <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-[#111817] via-[#1d2825] to-[#26332f]">
            <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-teal-300/10 blur-3xl" />
            <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#111817]/80 px-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="truncate text-sm font-extrabold tracking-tight text-white">DesaSmart AI</span>
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
                    className="inline-flex max-w-[10rem] shrink-0 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold text-emerald-300 transition-colors hover:border-emerald-200/50 hover:bg-emerald-300/20"
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
                  <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-bold text-emerald-300 sm:inline-flex">
                    ✦ {providerName.toUpperCase()}
                    {modelName ? ` · ${modelName}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={loading}
                  title="Reset percakapan ini. Riwayat tersimpan tidak dihapus."
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Reset chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-rose-400/10 hover:text-rose-300"
                  aria-label="Tutup AI"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {pickerOpen && modelProfiles.length > 0 && (
              <div
                role="listbox"
                aria-label="Pilih model AI"
                className="absolute inset-x-2 top-16 z-20 max-h-[65%] overflow-y-auto rounded-2xl border border-white/15 bg-[#141d1b]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
              >
                <p className="px-1.5 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
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
                    className={`flex w-full cursor-pointer items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      profile.isActive
                        ? 'border-emerald-300/40 bg-emerald-400/15'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]'
                    }`}
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                      {switchingId === profile.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-200" />
                      ) : profile.isActive ? (
                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold text-white">
                        {profile.providerName}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-emerald-100/80">
                        {profile.model}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-slate-400">
                        {profile.maskedKey}
                      </span>
                    </span>
                    {profile.isActive && (
                      <span className="shrink-0 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-200">
                        Aktif
                      </span>
                    )}
                  </button>
                ))}
                <p className="px-1.5 pb-1 pt-1.5 text-[10px] leading-relaxed text-slate-400">
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
                      <div className="mx-auto mb-3 flex h-12 w-12 rotate-3 items-center justify-center rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/30 transition-transform hover:rotate-0 hover:scale-105">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <span className="mb-3 inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200">
                        Asisten DesaSmart
                      </span>
                      <h1 className="bg-gradient-to-r from-emerald-200 via-white to-amber-100 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
                        Ada yang bisa saya bantu?
                      </h1>
                      <p className="mt-2 text-xs text-slate-300">
                        Pilih topik atau tanyakan langsung kepada AI DesaSmart.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.title}
                          type="button"
                          onClick={() => void handleSend(suggestion.prompt)}
                          className="group rounded-xl border border-emerald-300/25 bg-emerald-400/[0.08] p-3 text-left shadow-lg shadow-emerald-950/20 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200/60 hover:bg-emerald-400/[0.14] hover:shadow-xl hover:shadow-emerald-500/10"
                        >
                          <span className="block text-xs font-extrabold text-white transition-colors group-hover:text-emerald-100">{suggestion.title}</span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-slate-300">{suggestion.prompt}</span>
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
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-950/30">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[88%] ${
                            message.role === 'user'
                              ? 'relative rounded-3xl rounded-br-md border border-violet-300/30 bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 px-4 py-3 text-white shadow-lg shadow-violet-950/30 before:absolute before:-right-1.5 before:top-4 before:h-3 before:w-3 before:rotate-45 before:border-r before:border-t before:border-violet-300/30 before:bg-violet-600 sm:max-w-[78%]'
                              : `min-w-0 flex-1 rounded-2xl border px-4 py-3 ${
                                  message.isError
                                    ? 'relative rounded-tl-md border-amber-300/40 bg-amber-400/15 shadow-lg shadow-amber-950/20'
                                    : 'relative rounded-tl-md border-white/15 bg-gradient-to-br from-[#2a3531] via-[#232d2a] to-[#1d2624] shadow-lg shadow-black/25 before:absolute before:-left-1.5 before:top-4 before:h-3 before:w-3 before:-rotate-45 before:border-l before:border-t before:border-white/15 before:bg-[#232d2a]'
                                }`
                          }`}
                        >
                          <p className={`whitespace-pre-wrap break-words text-sm leading-6 ${
                            message.role === 'user' || !message.isError ? 'text-white' : 'text-amber-50'
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
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 transition-colors hover:text-white disabled:opacity-40"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                          )}
                          {message.source && (
                            <p className="mt-2 text-[10px] font-medium text-white/75">{message.source}</p>
                          )}
                          {message.isError && (
                            <button
                              type="button"
                              onClick={() => message.retryText && void handleSend(message.retryText)}
                              disabled={loading}
                              className="mt-2 rounded-lg border border-amber-200/40 bg-amber-200/10 px-2.5 py-1 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-200/20 disabled:opacity-50"
                            >
                              Coba lagi
                            </button>
                          )}
                          {message.role === 'assistant' && (
                            <div className="mt-1 text-[10px] font-medium text-white/75">{message.time}</div>
                          )}
                        </div>
                      </article>
                    ))}
                    {loading && (
                      <div className="flex gap-3 items-center text-sm font-medium text-emerald-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-950/30">
                          <Sparkles className="h-4 w-4 animate-pulse" />
                        </div>
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sedang menyiapkan jawaban...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-[#111817]/95 via-[#1d2825]/95 to-[#26332f]/90 px-3 pb-2 pt-2 backdrop-blur-xl sm:px-6 sm:pb-3 sm:pt-2">
                <div className="mx-auto max-w-xl">
                  {modelNote && (
                    <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
                      <span>{modelNote}</span>
                      <button type="button" onClick={() => setModelNote('')} aria-label="Tutup info model" className="shrink-0 text-emerald-200 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {error && (
                    <div role="alert" className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                      <span>{error}</span>
                      <button type="button" onClick={() => setError('')} aria-label="Tutup pesan" className="shrink-0 text-amber-200 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-emerald-300/25 bg-[#1d2624]/95 p-1.5 shadow-xl shadow-black/30 transition-all focus-within:border-emerald-300/70 focus-within:shadow-black/40"
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
                      className="max-h-16 min-h-9 w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-1.5 text-sm leading-5 text-white outline-none placeholder:text-slate-400 focus:ring-0 disabled:opacity-60"
                      aria-label="Pesan untuk AI DesaSmart"
                    />
                    <div className="flex items-center justify-between px-1 pb-0.5">
                      {messages.length === 1 && messages[0].id === 'welcome' && (
                        <span className="hidden pl-2 text-[10px] text-slate-400 sm:inline">
                          Enter untuk kirim · Shift+Enter untuk baris baru
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={!input.trim() || input.length > 4000 || loading}
                        title="Kirim pesan"
                        className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:from-emerald-900 disabled:via-emerald-900 disabled:to-teal-900 disabled:text-white disabled:opacity-100"
                        aria-label="Kirim pesan"
                      >
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </form>
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-slate-400">
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
