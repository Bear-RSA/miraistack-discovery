import { NextRequest, NextResponse } from 'next/server';
import { recordLead, type NewLead } from '@/lib/referral';
import { sendTeamEmail } from '@/lib/email';

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const box = (title: string, items: string) => `
  <div style="background:#161618; padding:20px; border-radius:8px; margin:20px 0; border: 1px solid #333;">
    <h3 style="color:#C6A15B; margin-top:0;">${title}</h3>
    <ul style="color:#ddd; line-height:1.6;">${items}</ul>
  </div>`;

export async function POST(req: NextRequest) {
  let payload: NewLead & { refCode?: string };
  try { payload = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!payload?.service || !payload.answers || !payload.client || !payload.referenceId) {
    return NextResponse.json({ success: false, error: 'Invalid payload structure' }, { status: 400 });
  }

  try {
    const { referenceId, service, client, answers, scoring } = payload;

    // Persist lead + attribution. Never throws.
    const lead = await recordLead(req, payload);

    const formattedAnswers = Object.entries(answers)
      .map(([key, val]) => `<li><strong>${esc(key)}:</strong> ${esc(Array.isArray(val) ? val.join(', ') : val)}</li>`)
      .join('');

    const attribution = lead.refCode
      ? `<li><strong>Referred by:</strong> ${esc(lead.refCode)}${lead.verified ? '' : ' (unverified — database not configured)'}</li>`
      : `<li><strong>Referred by:</strong> — (organic)</li>`;
    const flag = lead.flagged
      ? `<li><strong style="color:#e08a8a;">Flagged:</strong> ${esc(lead.flagReason)} — not credited to promoter</li>`
      : '';

    const html = `
      <div style="background:#0A0A0C; padding:40px; font-family:sans-serif; color:#fff;">
        <h2 style="color:#C6A15B;">New Submission: ${esc(client.businessName || client.contactName)}</h2>
        <p><strong>Service:</strong> ${esc(service)}</p>
        ${box('Client Details', `
          <li><strong>Name:</strong> ${esc(client.contactName)}</li>
          <li><strong>Email:</strong> ${esc(client.email)}</li>
          <li><strong>Business:</strong> ${esc(client.businessName || 'N/A')}</li>
          <li><strong>Industry:</strong> ${esc(client.industry || 'N/A')}</li>`)}
        ${box('Attribution', attribution + flag)}
        ${box('Scoring & Recommendation', `
          <li><strong>Raw Score:</strong> ${esc(scoring?.rawScore)}</li>
          <li><strong>Recommended Tier:</strong> ${esc(scoring?.tierDetails?.name || 'N/A')}</li>`)}
        ${box('Raw Answers', formattedAnswers)}
      </div>`;

    await sendTeamEmail({
      subject: `🔔 New Submission: ${client.businessName || client.contactName} [${referenceId}]${lead.refCode ? ` via ${lead.refCode}` : ''}`,
      html,
    });

    return NextResponse.json({ success: true, referenceId, status: 'completed' });
  } catch (err) {
    console.error('Submission Error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
