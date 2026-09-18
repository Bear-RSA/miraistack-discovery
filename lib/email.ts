import 'server-only';
import { Resend } from 'resend';

/* ============================================================
   EMAIL (Resend)
   Without RESEND_API_KEY the message is logged instead of sent, so
   local development works without an account.
=========================================================== */

export const FROM_SYSTEM = 'Mirai Stack Discovery <system@mail.miraistack.co.za>';
// Every team email (new submission and consultation request) goes to all of these.
export const TO_TEAM = ['support@miraistack.co.za', 'accounts@miraistack.co.za'];

interface Message { subject: string; html?: string; text?: string; from?: string; to?: string | string[] }

export async function sendTeamEmail(msg: Message): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email skipped — no RESEND_API_KEY] ${msg.subject}`);
    return;
  }
  const resend = new Resend(key);
  await resend.emails.send({
    from: msg.from ?? FROM_SYSTEM,
    to: msg.to ?? TO_TEAM,
    subject: msg.subject,
    ...(msg.html ? { html: msg.html } : { text: msg.text ?? '' }),
  });
}
