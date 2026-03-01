export interface Profile {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  title: string | null;
  tagline: string | null;
  avatar_url: string | null;
  location: string | null;
  links: LinkItem[];
  companies: CompanyItem[];
  builds: BuildItem[];
  ai_stack: ToolItem[];
  philosophy: string[];
  event: EventItem | null;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface LinkItem {
  icon: string;
  label: string;
  url: string;
  color?: string;
}

export interface CompanyItem {
  name: string;
  role: string;
  color: string;
  url: string;
  desc: string;
}

export interface BuildItem {
  name: string;
  emoji: string;
  desc: string;
  url: string;
  urlLabel?: string;
}

export interface ToolItem {
  name: string;
  note: string;
}

export interface EventItem {
  name: string;
  date: string;
  color: string;
}

export interface Exchange {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedin: string | null;
  note: string | null;
  source: string;
  status: 'new' | 'contacted' | 'following' | 'closed';
  created_at: string;
}
