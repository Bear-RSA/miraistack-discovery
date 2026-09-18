import { NextRequest, NextResponse } from 'next/server';
import { markBooked } from '@/lib/referral';
import { sendTeamEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; referenceId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body?.email || !body.name) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { name, email, referenceId } = body;

    // Automatic half of the conversion trigger; "attended" is set in /admin.
    const refCode = await markBooked(referenceId);

    const refLine = referenceId ? ` Reference ${referenceId}.` : '';
    const attribution = refCode ? ` Referred by promoter ${refCode}.` : '';

    await sendTeamEmail({
      from: 'system@mail.miraistack.co.za',
      subject: `Consultation Request: ${name}${referenceId ? ` [${referenceId}]` : ''}`,
      text: `${name} (${email}) would like to set a consultation meeting. Please contact them on this email.${refLine}${attribution}`,
    });

    return NextResponse.json({ success: true, status: 'completed' });
  } catch (err) {
    console.error('Consultation API Error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
