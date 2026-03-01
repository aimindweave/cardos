'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { Exchange, Profile } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  new: '#76b900',
  contacted: '#3b82f6',
  following: '#f59e0b',
  closed: '#6b7280',
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/create'; return; }
      setUser(user);

      // Check if there's a draft to publish
      const draft = localStorage.getItem('cardos_draft');
      if (draft) {
        const d = JSON.parse(draft);
        const { error } = await supabase.from('profiles').upsert({
          user_id: user.id,
          slug: d.slug,
          name: d.name,
          title: d.title || null,
          tagline: d.tagline || null,
          avatar_url: d.avatar_url || null,
          location: d.location || null,
          links: d.links.filter((l: any) => l.url),
          companies: d.companies.filter((c: any) => c.name),
          builds: d.builds.filter((b: any) => b.name),
          ai_stack: d.ai_stack.filter((t: any) => t.name),
          philosophy: d.philosophy.filter(Boolean),
          event: d.event?.name ? d.event : null,
        }, { onConflict: 'user_id' });
        if (!error) localStorage.removeItem('cardos_draft');
      }

      // Get profile
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(p);

      // Get exchanges
      if (p) {
        const { data: ex } = await supabase
          .from('exchanges')
          .select('*')
          .eq('profile_id', p.id)
          .order('created_at', { ascending: false });
        setExchanges(ex || []);
      }

      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from('exchanges').update({ status }).eq('id', id);
    setExchanges(prev => prev.map(e => e.id === id ? { ...e, status: status as any } : e));
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'LinkedIn', 'Note', 'Status', 'Date'];
    const rows = exchanges.map(e => [e.name, e.email, e.phone || '', e.company || '', e.linkedin || '', e.note || '', e.status, new Date(e.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `cardos_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] flex items-center justify-center">
        <p className="text-sm text-[#556]">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f0f4f8] mb-2">No card yet</h2>
          <p className="text-sm text-[#7a8a9a] mb-6">Create your card first, then come back here to see your contacts.</p>
          <a href="/create" className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-[#ff4757] to-[#e8364a]">Create Card</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-[#d0d8e4]">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#ff4757] to-[#ff6b81] flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white">C</span>
          </div>
          <span className="text-sm font-bold text-[#f0f4f8]">CardOS</span>
          <span className="text-xs text-[#556]">/ Dashboard</span>
        </div>
        <a href={`/s/${profile.slug}`} target="_blank" className="text-xs text-[#76b900] font-medium hover:underline">
          View my card →
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 text-center">
            <p className="text-2xl font-extrabold text-[#f0f4f8]">{exchanges.length}</p>
            <p className="text-xs text-[#5a6a7a] mt-1">Exchanges</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 text-center">
            <p className="text-2xl font-extrabold text-[#f0f4f8]">{exchanges.filter(e => e.status === 'new').length}</p>
            <p className="text-xs text-[#5a6a7a] mt-1">New</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 text-center">
            <p className="text-2xl font-extrabold text-[#f0f4f8]">{exchanges.filter(e => e.status === 'contacted').length}</p>
            <p className="text-xs text-[#5a6a7a] mt-1">Contacted</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#f0f4f8]">Contacts</h2>
          {exchanges.length > 0 && (
            <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-[#8a9aaa] hover:text-[#d0d8e4]">
              Export CSV
            </button>
          )}
        </div>

        {/* Table */}
        {exchanges.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-[#7a8a9a]">No exchanges yet. Share your card to start collecting contacts!</p>
            <p className="text-xs text-[#445] mt-2">cardos.vercel.app/s/{profile.slug}</p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            {exchanges.map((e, i) => (
              <div key={e.id} className={`flex items-start gap-4 p-4 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff4757]/20 to-[#ff4757]/5 flex items-center justify-center text-xs font-bold text-[#ff4757] shrink-0">
                  {e.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-[#e8edf3]">{e.name}</span>
                    {e.company && <span className="text-[10px] text-[#667]">@ {e.company}</span>}
                  </div>
                  <p className="text-xs text-[#7a8a9a]">{e.email}</p>
                  {e.note && <p className="text-xs text-[#556] mt-1 italic">"{e.note}"</p>}
                  <p className="text-[10px] text-[#334] mt-1">{new Date(e.created_at).toLocaleString()}</p>
                </div>
                <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value)} className="text-[10px] font-semibold px-2 py-1 rounded-full border-none cursor-pointer" style={{ background: `${STATUS_COLORS[e.status]}20`, color: STATUS_COLORS[e.status] }}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="following">Following</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
