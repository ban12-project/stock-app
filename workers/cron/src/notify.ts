import { eq, inArray } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import webpush from "web-push";
import * as schema from "./db/schema";

type DB = NeonHttpDatabase<typeof schema>;

/**
 * Send a push notification to all subscriptions for a given user.
 * VAPID details must be configured before calling this function.
 * Automatically cleans up expired/invalid subscriptions.
 */
export async function notifyUserById(
  db: DB,
  userId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
  },
) {
  const subscriptions = await db.query.pushSubscription.findMany({
    where: eq(schema.pushSubscription.userId, userId),
  });

  if (subscriptions.length === 0) return;

  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
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

  // Batch delete all expired subscriptions in one query
  if (expiredEndpoints.length > 0) {
    await db
      .delete(schema.pushSubscription)
      .where(inArray(schema.pushSubscription.endpoint, expiredEndpoints));
  }
}
