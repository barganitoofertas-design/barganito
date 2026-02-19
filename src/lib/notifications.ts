import { prisma } from './prisma';
import { Resend } from 'resend';
import webpush from 'web-push';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Configure VAPID keys for Web Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contato@barganito.com.br',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: 'alert' | 'system' | 'promo';
}

export async function sendNotification(payload: NotificationPayload) {
  const { userId, title, message, link, type = 'alert' } = payload;

  // 1. Get user preferences and push subscriptions
  const [user, config, pushSubscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    }),
    prisma.notificationConfig.findFirst({
      where: { userId }
    }),
    prisma.pushSubscription.findMany({
      where: { userId }
    })
  ]);

  if (!user) return;

  const userConfig = config || { notifyInternal: true, notifyEmail: true, notifyPush: true };

  const results = {
    internal: false,
    email: false,
    push: false,
  };

  // 2. Internal Notification
  if (userConfig.notifyInternal) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          link: link || null,
          type,
        }
      });
      results.internal = true;
    } catch (error) {
      console.error('Error creating internal notification:', error);
    }
  }

  // 3. Email Notification
  if (userConfig.notifyEmail && user.email && resend) {
    try {
      await resend.emails.send({
        from: 'Barganito <alertas@barganito.com.br>',
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #ff5a1f;">${title}</h2>
            <p>${message}</p>
            ${link ? `<a href="${process.env.NEXTAUTH_URL}${link}" style="display: inline-block; padding: 10px 20px; background-color: #ff5a1f; color: #fff; text-decoration: none; border-radius: 5px;">Ver Oferta</a>` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Você recebeu este e-mail porque configurou um alerta no Barganito.</p>
          </div>
        `,
      });
      results.email = true;
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // 4. Web Push Notification
  if (userConfig.notifyPush && pushSubscriptions.length > 0) {
    const pushPayload = JSON.stringify({
      title,
      body: message,
      url: link ? `${process.env.NEXTAUTH_URL}${link}` : undefined,
    });

    const pushPromises = pushSubscriptions.map((sub: any) => 
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        pushPayload
      ).catch((error: any) => {
        console.error('Push notification failed for endpoint:', sub.endpoint, error);
        // Delete invalid subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          return prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint }
          }).catch(() => {});
        }
      })
    );

    await Promise.all(pushPromises);
    results.push = true;
  }

  return results;
}
