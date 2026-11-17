import { prisma } from './prisma';
import { sendWhatsAppNotification } from './whatsapp';

export interface NotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'REJECTED';
  linkUrl?: string;
  phone?: string | null;
}

export async function createNotification(params: NotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        linkUrl: params.linkUrl || null,
      },
    });

    try {
      let phone = params.phone;
      if (phone === undefined) {
        const recipient = await prisma.user.findUnique({
          where: { id: params.userId },
          select: {
            phone: true,
            citizen: { select: { phone: true } },
          },
        });
        phone = recipient?.phone || recipient?.citizen?.phone;
      }

      if (!phone) {
        console.warn(`WhatsApp notification skipped: user ${params.userId} has no phone number.`);
        return { notification, whatsappStatus: 'NO_PHONE' as const };
      }

      await sendWhatsAppNotification(phone, `${params.title}\n\n${params.message}`);
      return { notification, whatsappStatus: 'SENT' as const };
    } catch (error) {
      console.error(`Failed to send WhatsApp notification to user ${params.userId}:`, error);
      return { notification, whatsappStatus: 'FAILED' as const };
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
