import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

async function sendExchangeEmail(toEmail: string, toName: string, profile: any, cardUrl: string) {
  // Use Supabase Edge Function or simple fetch to a mail API
  // For now, use Supabase's built-in email via Auth (workaround) or a simple SMTP relay
  // We'll use a serverless-friendly approach: Resend / Mailgun / or fallback to no-op

  // Build email HTML
  const emailLink = profile.links?.find((l: any) => l.icon === 'email');
  const xLink = profile.links?.find((l: any) => l.icon === 'x');
  const linkedinLink = profile.links?.find((l: any) => l.icon === 'linkedin');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#060b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#ff4757,#ff6b81);line-height:32px;color:white;font-weight:800;font-size:14px;">C</div>
    <span style="font-size:18px;font-weight:700;color:#f0f4f8;margin-left:8px;vertical-align:middle;">CardOS</span>
  </div>

  <div style="background:#0d1520;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:28px;margin-bottom:16px;">
    <p style="color:#76b900;font-size:13px;font-weight:600;margin:0 0 8px;">Nice meeting you, ${toName}! 🤝</p>
    <p style="color:#8a9aaa;font-size:13px;margin:0 0 20px;line-height:1.5;">
      Here's the contact info for <strong style="color:#f0f4f8">${profile.name}</strong> that you exchanged at ${profile.event?.name || 'a recent event'}.
    </p>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:16px;">
      <p style="color:#f0f4f8;font-size:16px;font-weight:700;margin:0 0 4px;">${profile.name}</p>
      ${profile.title ? `<p style="color:#8a9aaa;font-size:13px;margin:0 0 8px;">${profile.title}</p>` : ''}
      ${emailLink ? `<p style="margin:4px 0;"><span style="color:#667;font-size:12px;">Email:</span> <a href="mailto:${emailLink.url.replace('mailto:', '')}" style="color:#ff4757;font-size:13px;text-decoration:none;">${emailLink.url.replace('mailto:', '')}</a></p>` : ''}
      ${xLink ? `<p style="margin:4px 0;"><span style="color:#667;font-size:12px;">X:</span> <a href="${xLink.url}" style="color:#ff4757;font-size:13px;text-decoration:none;">${xLink.label || xLink.url}</a></p>` : ''}
      ${linkedinLink ? `<p style="margin:4px 0;"><span style="color:#667;font-size:12px;">LinkedIn:</span> <a href="${linkedinLink.url}" style="color:#ff4757;font-size:13px;text-decoration:none;">${linkedinLink.label || 'Profile'}</a></p>` : ''}
      <p style="margin:8px 0 0;"><a href="${cardUrl}" style="color:#76b900;font-size:12px;font-weight:600;text-decoration:none;">View full card →</a></p>
    </div>
  </div>

  <div style="background:rgba(255,71,87,0.06);border:1px solid rgba(255,71,87,0.12);border-radius:16px;padding:24px;text-align:center;">
    <p style="color:#f0f4f8;font-size:15px;font-weight:700;margin:0 0 6px;">Create your own CardOS</p>
    <p style="color:#8a9aaa;font-size:12px;margin:0 0 16px;line-height:1.5;">
      Your digital business card for tech events.<br>Share via QR · Collect contacts · Export CSV
    </p>
    <a href="https://cardos.ai/create" style="display:inline-block;padding:12px 32px;border-radius:12px;background:linear-gradient(135deg,#ff4757,#e8364a);color:white;font-weight:700;font-size:14px;text-decoration:none;">
      Create Your Card — Free
    </a>
    <p style="color:#556;font-size:11px;margin:12px 0 0;">60 seconds · No signup needed</p>
  </div>

  <p style="color:#334;font-size:10px;text-align:center;margin:20px 0 0;">
    Sent via <a href="https://cardos.ai" style="color:#556;text-decoration:none;">CardOS</a> · AI-native digital business cards
  </p>
</div>
</body>
</html>`;

  // Try to send via Resend API if available, otherwise skip silently
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log('RESEND_API_KEY not set, skipping email to', toEmail);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CardOS <noreply@cardos.ai>',
        to: [toEmail],
        subject: `${profile.name}'s contact info — CardOS`,
        html,
      }),
    });
    if (!res.ok) console.error('Email send failed:', await res.text());
  } catch (e) {
    console.error('Email error:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_slug, name, email, phone, company, linkedin, note, source } = body;

    if (!profile_slug || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    // Look up profile by slug (need full data for email)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, title, tagline, links, event, slug')
      .eq('slug', profile_slug)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Insert exchange
    const { error } = await supabase.from('exchanges').insert({
      profile_id: profile.id,
      name,
      email,
      phone: phone || null,
      company: company || null,
      linkedin: linkedin || null,
      note: note || null,
      source: source || 'manual',
    });

    if (error) {
      console.error('Exchange insert error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Send email to exchanger (fire and forget)
    const cardUrl = 'https://cardos.ai/' + profile.slug;
    sendExchangeEmail(email, name, profile, cardUrl).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Exchange API error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
