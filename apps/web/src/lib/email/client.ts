/**
 * Email sender backed by Resend. No-op when RESEND_API_KEY isn't set so
 * dev environments don't have to plumb a key through to make the rest
 * of the app work.
 */

interface SendInput {
  to: string;
  subject: string;
  html: string;
  /** Optional reply-to (e.g. the message sender). */
  replyTo?: string;
}

export async function sendEmail(input: SendInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info('[email] RESEND_API_KEY not set — skipping send to', input.to);
    return;
  }
  const from = process.env.RESEND_FROM ?? 'Hikaya <no-reply@hikaya.sa>';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[email] Resend error:', res.status, body);
    }
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}
