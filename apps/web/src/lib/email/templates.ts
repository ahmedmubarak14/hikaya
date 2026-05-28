/**
 * Plain HTML email templates. Keep them inline and minimal — no MJML/JSX
 * runtime — so they render the same on every email client.
 */

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #18012b;
  background: #f1ede4;
  padding: 32px;
`;

const cardStyle = `
  background: #fff;
  border: 1px solid #e0dcd2;
  border-radius: 12px;
  padding: 24px;
  max-width: 560px;
  margin: 0 auto;
`;

const ctaStyle = `
  display: inline-block;
  background: #18012b;
  color: #f1ede4;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 600;
  margin-top: 16px;
`;

function wrap(inner: string, footer: string): string {
  return `<!doctype html><html><body style="${baseStyle}">
    <div style="${cardStyle}">
      ${inner}
      <hr style="border:0;border-top:1px solid #e0dcd2;margin:24px 0" />
      <p style="font-size:12px;color:#5d4f6a;margin:0">${footer}</p>
    </div>
  </body></html>`;
}

export function newInquiryEmail(input: {
  recipientName: string;
  clientName: string;
  discipline: string;
  city: string;
  description: string;
  threadUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const subject = `New inquiry from ${input.clientName} — ${input.discipline}`;
  const html = wrap(
    `
    <h2 style="margin:0 0 12px;font-size:20px">Hi ${input.recipientName},</h2>
    <p style="margin:0 0 8px">You've received a new inquiry on Hikaya.</p>
    <p style="margin:0 0 4px"><strong>From:</strong> ${input.clientName}</p>
    <p style="margin:0 0 4px"><strong>Discipline:</strong> ${input.discipline}</p>
    <p style="margin:0 0 4px"><strong>City:</strong> ${input.city}</p>
    <p style="margin:12px 0 4px"><strong>Brief:</strong></p>
    <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.description)}</p>
    <a href="${input.threadUrl}" style="${ctaStyle}">Reply on Hikaya</a>
  `,
    `Don't want these? <a href="${input.unsubscribeUrl}" style="color:#5d4f6a">Unsubscribe from inquiry emails</a>.`,
  );
  return { subject, html };
}

export function newMessageEmail(input: {
  recipientName: string;
  senderName: string;
  preview: string;
  threadUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const subject = `${input.senderName} sent you a message`;
  const html = wrap(
    `
    <h2 style="margin:0 0 12px;font-size:20px">Hi ${input.recipientName},</h2>
    <p style="margin:0 0 8px"><strong>${input.senderName}</strong> just sent you a message:</p>
    <blockquote style="margin:12px 0;padding:12px 16px;background:#f6f3ec;border-radius:8px;color:#3d2f4a">
      ${escapeHtml(input.preview)}
    </blockquote>
    <a href="${input.threadUrl}" style="${ctaStyle}">Open conversation</a>
  `,
    `Don't want these? <a href="${input.unsubscribeUrl}" style="color:#5d4f6a">Unsubscribe from message emails</a>.`,
  );
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
