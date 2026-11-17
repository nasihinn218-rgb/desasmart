import { NextResponse } from 'next/server';
import { getActiveAiConfig } from '@/lib/ai-settings';

/**
 * Info penyedia AI aktif untuk widget chat (publik).
 * Hanya nama provider & model — tidak pernah menyentuh API key.
 */
export async function GET() {
  try {
    const config = await getActiveAiConfig();
    return NextResponse.json({
      providerName: config.source === 'NONE' ? 'AI' : config.providerName,
      model: config.model,
    });
  } catch (error) {
    console.error('Fetch AI provider info error:', error);
    return NextResponse.json({ providerName: 'AI', model: '' });
  }
}
