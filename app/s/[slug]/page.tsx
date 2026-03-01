import { createClient } from '@/lib/supabase-server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CardView from '@/components/CardView';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, title, tagline')
    .eq('slug', params.slug)
    .single();

  if (!profile) return { title: 'Card not found' };

  return {
    title: profile.name + ' \u2014 ' + (profile.title || 'CardOS'),
    description: profile.tagline || profile.name + "'s digital business card",
    openGraph: {
      title: profile.name + ' \u2014 ' + (profile.title || 'CardOS'),
      description: profile.tagline || profile.name + "'s digital business card",
      siteName: 'CardOS',
      url: 'https://cardos.ai/' + params.slug,
    },
  };
}

export default async function CardPage({ params }: Props) {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Record view (fire and forget)
  supabase.from('views').insert({ profile_id: profile.id }).then(() => {});

  return <CardView profile={profile} editToken={profile.edit_token} />;
}
