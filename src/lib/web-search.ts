// Pencarian web ringan tanpa API key memakai Wikipedia (bahasa Indonesia lalu fallback Inggris).
// Dipakai untuk men-ground jawaban AI dengan informasi terkini dari internet.

export interface WebSearchResult {
  snippet: string;
  source: string;
  title: string;
}

// Hanya jalankan pencarian untuk pertanyaan informatif/faktual, bukan permintaan menulis/menerjemah.
export function looksLikeFactualQuestion(question: string): boolean {
  const q = question.toLowerCase();
  const creative =
    /\b(?:tulis|menulis|karang|buatkan|buat\s|bantu\s+saya\s+buat|terjemah|translation|ringkas|parafrase|ide|saran|email|surat\s+untuk|caption|puis)\b/i.test(
      q
    );
  const factual =
    /\b(?:siapa|apakah|apa\s|apa itu|kapan|di\s+mana|dimana|bagaimana|berapa|jelaskan|profil|biografi|berita|terbaru|saat\s+ini|sekarang|presiden|gubernur|bupati|walikota|menteri|ibu\s+kota|ibukota|mata\s+uang|pahlawan|penemu|harga|jumlah|definisi|artinya|kemenangan|hasil|pemenang|wakil)\b/i.test(
      q
    ) ||
    /\b(?:20\d{2})\b/.test(q) ||
    q.includes('?');
  return factual && !creative;
}

async function queryWikipedia(lang: 'id' | 'en', search: string): Promise<WebSearchResult | null> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
    `&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(search)}` +
    `&prop=extracts&exintro=1&explaintext=1&exchars=1600&redirects=1&origin=*`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'DesaSmart-AI/1.0' },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const first = Object.values(pages as Record<string, any>)[0];
  const extract: string = (first?.extract || '').replace(/\s+/g, ' ').trim();
  const title: string = first?.title || '';
  if (extract.length < 20) return null;

  return {
    snippet: extract.slice(0, 1600),
    title,
    source: `Wikipedia ${lang === 'id' ? 'Indonesia' : 'Inggris'}`,
  };
}

export async function searchWebContext(question: string): Promise<WebSearchResult | null> {
  const search = question.replace(/[?!.]+$/g, '').trim();
  if (search.length < 3) return null;

  try {
    const idResult = await queryWikipedia('id', search);
    if (idResult) return idResult;
    const enResult = await queryWikipedia('en', search);
    return enResult;
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}
