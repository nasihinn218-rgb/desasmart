import { NextRequest, NextResponse } from 'next/server';
import { checkApplicationDataWithAi } from '@/lib/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const analysis = checkApplicationDataWithAi({
      nik: body.nik || '',
      noKk: body.noKk || '',
      fullName: body.fullName || '',
      monthlyIncome: Number(body.monthlyIncome) || 0,
      familyMembersCount: Number(body.familyMembersCount) || 1,
      purposeCategory: body.purposeCategory || '',
      purposeDescription: body.purposeDescription || '',
      documents: body.documents || [],
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('AI Check form error:', error);
    return NextResponse.json(
      { error: 'Gagal menjalankan pemeriksaan data AI.' },
      { status: 500 }
    );
  }
}
