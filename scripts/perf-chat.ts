// Temporary: ukur komponen waktu jawab chatbot.
import { PrismaClient } from '@prisma/client';
import { looksLikeFactualQuestion, searchWebContext } from '@/lib/web-search';

const BASE = 'http://localhost:3000';
const prisma = new PrismaClient();

const CASES: Array<{ label: string; message: string }> = [
  { label: 'deterministik (profil desa)', message: 'berapa jumlah rw di desa ini?' },
  { label: 'LLM singkat', message: 'halo, kamu bisa bantu apa saja?' },
  { label: 'LLM + web search', message: 'siapa presiden indonesia saat ini?' },
  { label: 'LLM panjang', message: 'jelaskan alur pengajuan sktm di aplikasi ini secara lengkap' },
];

const ms = (t: [number, number]) => Math.round(Number(t[0]) * 1e3 + t[1] / 1e6);
function start(diff?: [number, number]) { return process.hrtime(diff); }

async function main() {
  let cookie = '';
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@desa.test', password: 'Password123!' }),
  });
  login.headers.getSetCookie().forEach((c) => {
    if (c.includes('desasmart_session')) cookie = c.split(';')[0];
  });

  const cred = await prisma.aiCredential.findFirst({
    where: { id: (await prisma.aiSetting.findFirst({ select: { activeCredentialId: true } }))?.activeCredentialId ?? '' },
  });
  console.log('AKTIF:', cred ? `${cred.providerName} / ${cred.model}` : '(tidak ada)');

  for (const c of CASES) {
    const t = start();
    const res = await fetch(`${BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ message: c.message }),
      signal: AbortSignal.timeout(120000),
    });
    const data = (await res.json()) as { reply?: string; source?: string; error?: string };
    console.log(
      `${c.label.padEnd(26)} ${String(ms(start(t))).padStart(6)}ms  http=${res.status}  chars=${(data.reply ?? data.error ?? '').length}  src=${data.source ?? '-'}`
    );
  }

  // Komponen: web search saja.
  for (const q of ['siapa presiden indonesia saat ini?', 'apa itu sktm?', 'ibu kota jawa barat']) {
    if (!looksLikeFactualQuestion(q)) { console.log('web  -> tidak faktual:', q); continue; }
    const t = start();
    const w = await searchWebContext(q);
    console.log(`wikipedia ${String(ms(start(t))).padStart(6)}ms  ${w ? `${w.source} :: ${w.snippet.length} char` : 'NULL'}`);
  }

  // Komponen: panggilan model mentah, prompt kecil vs prompt besar.
  if (cred) {
    const big = 'X'.repeat(9000); // kira-kira seukuran system prompt saat ini
    for (const [label, sys] of [['prompt kecil', 'Jawab singkat bahasa Indonesia.'], ['prompt besar (~9k char)', `Jawab singkat. ${big}`]] as const) {
      const t = start();
      const res = await fetch(`${cred.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cred.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cred.model,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: 'Sebutkan 3 buah.' }],
          max_tokens: 120,
        }),
        signal: AbortSignal.timeout(120000),
      });
      const j = await res.json();
      console.log(`${label.padEnd(22)} ${String(ms(start(t))).padStart(6)}ms  http=${res.status}  tokens=${j?.usage?.prompt_tokens ?? '?'}->${j?.usage?.completion_tokens ?? '?'}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
