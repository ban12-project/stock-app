import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db/queries";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [
    nextCookies(),
    passkey(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: "Stock Monitor <noreply@ban12.com>",
          to: email,
          subject: "Sign in to Stock Monitor",
          html: `
							<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
								<h2 style="color: #171717; margin-bottom: 24px;">Sign in to Stock Monitor</h2>
								<p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
									Click the button below to sign in to your account. This link will expire in 5 minutes.
								</p>
								<a href="${url}" 
									style="display: inline-block; background: #171717; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
									Sign In
								</a>
								<p style="color: #999; font-size: 12px; margin-top: 32px;">
									If you didn't request this email, you can safely ignore it.
								</p>
							</div>
						`,
        });
      },
      expiresIn: 300,
    }),
  ],
});
