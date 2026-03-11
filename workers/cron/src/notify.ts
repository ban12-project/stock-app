import { eq } from "drizzle-orm";
import webpush from "web-push";
import * as schema from "./db/schema";

export async function notifyUserById(
  db: any,
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
  },
  vapidPrivateKey?: string,
  vapidPublicKey?: string,
) {
  if (vapidPrivateKey && vapidPublicKey) {
    webpush.setVapidDetails(
      "mailto:coda@ban12.com",
      vapidPublicKey,
      vapidPrivateKey,
    );
  }

  const subscriptions = await db.query.pushSubscription.findMany({
    where: eq(schema.pushSubscription.userId, userId),
  });

  const expiredEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        if (
          error instanceof webpush.WebPushError &&
          [404, 410].includes(error.statusCode)
        ) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  if (expiredEndpoints.length > 0) {
    for (const endpoint of expiredEndpoints) {
      await db
        .delete(schema.pushSubscription)
        .where(eq(schema.pushSubscription.endpoint, endpoint));
    }
  }
}
