import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askAiAssistant, AiProviderError, isProviderCreditExhausted } from '@/lib/ai-assistant';
import {
  answerAiDatabaseQuestion,
  answerDateTimeQuestion,
  getAiDatabaseContext,
} from '@/lib/ai-database-context';
import { answerVillageProfileQuestion } from '@/lib/desa-config';

function isDatabaseAnswer(sources: string | null) {
  if (!sources) return false;

  try {
    const parsed: unknown = JSON.parse(sources);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'source' in parsed &&
      typeof parsed.source === 'string' &&
      parsed.source.startsWith('Database DesaSmart ·')
    );
  } catch (error) {
    console.error('Invalid AI message source metadata:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ conversations: [], authenticated: false });
    }

    if (new URL(req.url).searchParams.get('context') === '1') {
      return NextResponse.json({
        authenticated: true,
        user: {
          name: user.name,
          roleDisplayName: user.roleDisplayName,
          villageName: user.village?.name ?? null,
        },
      });
    }

    const conversationId = new URL(req.url).searchParams.get('conversationId');
    if (conversationId) {
      const conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: user.id },
        select: { id: true },
      });
      if (!conversation) {
        return NextResponse.json({ error: 'Percakapan tidak ditemukan.' }, { status: 404 });
      }

      const messages = await prisma.aiMessage.findMany({
        where: { conversationId, role: { in: ['user', 'assistant'] } },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, role: true, content: true, sources: true, createdAt: true },
      });

      return NextResponse.json({
        conversationId,
        messages: messages.reverse().flatMap((message) => {
          if (message.role !== 'user' && message.role !== 'assistant') return [];
          let source: string | undefined;
          if (message.sources) {
            try {
              const parsed = JSON.parse(message.sources);
              source = typeof parsed.source === 'string' ? parsed.source : undefined;
            } catch (error) {
              console.error('Invalid AI message source metadata:', error);
            }
          }
          return [{
            id: message.id,
            role: message.role,
            content: message.content,
            source,
            time: message.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          }];
        }),
      });
    }

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({
      conversations,
      authenticated: true,
      user: {
        name: user.name,
        roleDisplayName: user.roleDisplayName,
        villageName: user.village?.name ?? null,
      },
    });
  } catch (error) {
    console.error('Fetch AI conversations error:', error);
    return NextResponse.json({ error: 'Gagal memuat riwayat percakapan.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const requestedConversationId =
      typeof body.conversationId === 'string' ? body.conversationId : null;

    if (!message) {
      return NextResponse.json({ error: 'Pesan pertanyaan tidak boleh kosong.' }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: 'Pesan maksimal 4.000 karakter.' }, { status: 400 });
    }

    const user = await getCurrentUser();
    let convId: string | null = null;
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // If user is logged in and has conversationId or needs new conversation
    if (user) {
      if (requestedConversationId) {
        const conversation = await prisma.aiConversation.findFirst({
          where: { id: requestedConversationId, userId: user.id },
          select: { id: true },
        });
        if (!conversation) {
          return NextResponse.json({ error: 'Percakapan tidak ditemukan.' }, { status: 404 });
        }
        convId = conversation.id;
      } else {
        convId = null;
      }

      if (convId) {
        const previousMessages = await prisma.aiMessage.findMany({
          where: { conversationId: convId, role: { in: ['user', 'assistant'] } },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: { role: true, content: true, sources: true },
        });
        const ordered = previousMessages.reverse();
        const builtHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
        for (const item of ordered) {
          if (item.role !== 'user' && item.role !== 'assistant') continue;
          if (item.role === 'assistant' && isDatabaseAnswer(item.sources)) {
            if (
              builtHistory.length > 0 &&
              builtHistory[builtHistory.length - 1].role === 'user'
            ) {
              builtHistory.pop();
            }
            continue;
          }
          builtHistory.push({ role: item.role, content: item.content });
        }
        conversationHistory = builtHistory;
      }
    } else if (Array.isArray(body.history)) {
      const suppliedHistory: unknown[] = body.history;
      conversationHistory = suppliedHistory.flatMap<{
        role: 'user' | 'assistant';
        content: string;
      }>((item) => {
        if (typeof item !== 'object' || item === null) return [];
        const role = 'role' in item ? item.role : undefined;
        const content = 'content' in item ? item.content : undefined;
        if (
          (role !== 'user' && role !== 'assistant') ||
          typeof content !== 'string' ||
          content.length === 0 ||
          content.length > 4000
        ) {
          return [];
        }
        return [{ role, content }];
      }).slice(-12);
    }

    let databaseContext: Awaited<ReturnType<typeof getAiDatabaseContext>> | null = null;
    try {
      databaseContext = user ? await getAiDatabaseContext(user) : null;
    } catch (error) {
      console.warn('Read AI database context error (fallback to general AI context):', error);
      databaseContext = null;
    }
    const databaseAnswer = answerAiDatabaseQuestion(message, databaseContext);
    const localAnswer =
      databaseAnswer ?? answerVillageProfileQuestion(message) ?? answerDateTimeQuestion(message);
    const aiResponse =
      localAnswer ??
      (await askAiAssistant(
        message,
        conversationHistory,
        user
          ? {
              name: user.name,
              roleDisplayName: user.roleDisplayName,
              villageName: user.village?.name ?? null,
            }
          : undefined,
        databaseContext
      ));

    if (user) {
      if (!convId) {
        const newConversation = await prisma.aiConversation.create({
          data: {
            userId: user.id,
            title: message.substring(0, 35) + (message.length > 35 ? '...' : ''),
          },
          select: { id: true },
        });
        convId = newConversation.id;
      }

      await prisma.$transaction([
        prisma.aiMessage.create({
          data: {
            conversationId: convId,
            role: 'user',
            content: message,
          },
        }),
        prisma.aiMessage.create({
          data: {
            conversationId: convId,
            role: 'assistant',
            content: aiResponse.reply,
            sources: JSON.stringify({ source: aiResponse.source }),
          },
        }),
        prisma.aiConversation.update({
          where: { id: convId },
          data: { updatedAt: new Date() },
        }),
      ]);
    }

    return NextResponse.json({
      reply: aiResponse.reply,
      source: aiResponse.source,
      conversationId: convId,
    });
  } catch (error) {
    console.error('AI Chatbot error:', error);
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Penyedia AI membutuhkan waktu terlalu lama untuk menjawab. Silakan coba lagi.' },
        { status: 504 }
      );
    }
    if (error instanceof AiProviderError) {
      if (isProviderCreditExhausted(error)) {
        // Detail penyedia untuk kasus ini sering berupa pesan kuota dalam bahasa
        // asing / kode mentah, jadi cukup pesan lokal yang jelas.
        return NextResponse.json(
          { error: 'Saldo atau kuota API key pada penyedia ini habis. Isi ulang saldo di dashboard penyedia, atau klik profil API key lain (mis. GroqCloud / OpenRouter / Gemini) pada panel Pengaturan AI.' },
          { status: 502 }
        );
      }
      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          { error: `Penyedia AI menolak API key (${error.status}). ${error.detail || 'Perbarui konfigurasi pada panel Pengaturan AI di dashboard staf/superadmin.'}` },
          { status: 502 }
        );
      }
      if (error.status === 400 || error.status === 404) {
        return NextResponse.json(
          { error: `Model atau base URL AI tidak dikenali oleh penyedia. ${error.detail || ''} Periksa nama model pada panel Pengaturan AI (gunakan tombol "Ambil Daftar Model").` },
          { status: 502 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Batas permintaan penyedia AI tercapai. Tunggu sebentar, lalu coba kirim lagi.' },
          { status: 429 }
        );
      }
      if (error.status >= 500) {
        return NextResponse.json(
          { error: 'Layanan penyedia AI sedang padat. Coba kirim pesan lagi sebentar lagi.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Penyedia AI membalas HTTP ${error.status}. ${error.detail || 'Silakan coba lagi.'}`.trim() },
        { status: 502 }
      );
    }
    if (error instanceof Error && error.message === 'Layanan AI belum dikonfigurasi.') {
      return NextResponse.json(
        { error: 'Chatbot AI belum dikonfigurasi. Isi API key pada panel Pengaturan AI di dashboard staf/superadmin.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'AI sedang tidak dapat menjawab. Silakan coba lagi beberapa saat.' },
      { status: 502 }
    );
  }
}
