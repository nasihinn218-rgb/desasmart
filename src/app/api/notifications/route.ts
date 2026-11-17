import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Gagal memuat notifikasi.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai dibaca.' });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai dibaca.' });
    }

    return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui notifikasi.' }, { status: 500 });
  }
}
