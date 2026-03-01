import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, title, tagline, links, slug')
    .eq('slug', params.slug)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const emailLink = (profile.links as any[])?.find((l: any) => l.icon === 'email');
  const xLink = (profile.links as any[])?.find((l: any) => l.icon === 'x');
  const phoneLink = (profile.links as any[])?.find((l: any) => l.icon === 'phone');
  const cardUrl = 'https://cardos.ai/' + profile.slug;

  const vc = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:' + profile.name,
    profile.title ? 'TITLE:' + profile.title : '',
    emailLink ? 'EMAIL;TYPE=WORK:' + emailLink.url.replace('mailto:', '') : '',
    phoneLink ? 'TEL;TYPE=CELL:' + phoneLink.url.replace('tel:', '') : '',
    'URL:' + cardUrl,
    profile.tagline ? 'NOTE:' + profile.tagline : '',
    xLink ? 'X-SOCIALPROFILE;TYPE=twitter:' + xLink.url : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n');

  return new NextResponse(vc, {
    headers: {
      'Content-Type': 'text/x-vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="' + profile.name.replace(/\s+/g, '_') + '.vcf"',
    },
  });
}
