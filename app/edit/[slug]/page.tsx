'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { Profile } from '@/lib/types';
import { QRCode } from '@/components/QRCode';
import { ICONS } from '@/components/Icons';

const inp = 'w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] placeholder-[#445] focus:border-[#ff4757]/30 outline-none';

const PLATFORMS = [
  { icon: 'x', label: 'X / Twitter' }, { icon: 'email', label: 'Email' },
  { icon: 'linkedin', label: 'LinkedIn' }, { icon: 'instagram', label: 'Instagram' },
  { icon: 'telegram', label: 'Telegram' }, { icon: 'phone', label: 'Phone' },
  { icon: 'github', label: 'GitHub' }, { icon: 'whatsapp', label: 'WhatsApp' },
  { icon: 'facebook', label: 'Facebook' }, { icon: 'youtube', label: 'YouTube' },
  { icon: 'tiktok', label: 'TikTok' }, { icon: 'bluesky', label: 'Bluesky' },
  { icon: 'wechat', label: 'WeChat' }, { icon: 'discord', label: 'Discord' },
  { icon: 'clapper', label: 'Clapper' }, { icon: 'threads', label: 'Threads' },
  { icon: 'reddit', label: 'Reddit' }, { icon: 'snapchat', label: 'Snapchat' },
  { icon: 'onlyfans', label: 'OnlyFans' }, { icon: 'medium', label: 'Medium' },
  { icon: 'website', label: 'Website' },
];

const LOOKING_EMOJIS = ['\uD83C\uDFAF', '\uD83D\uDDA5\uFE0F', '\uD83E\uDD1D', '\uD83D\uDE80', '\uD83D\uDCB0', '\uD83D\uDD27', '\uD83D\uDCE1', '\uD83E\uDDE0', '\uD83C\uDFE2', '\uD83D\uDC65', '\uD83D\uDCE6', '\uD83C\uDF10'];

export default function EditPage({ params }: { params: { slug: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [data, setData] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [tab, setTab] = useState<'edit' | 'contacts' | 'qr'>('edit');
  const avatarRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [savingQr, setSavingQr] = useState(false);
  const [qrImage, setQrImage] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: p } = await supabase.from('profiles').select('*').eq('slug', params.slug).single();
      if (!p) { setLoading(false); return; }
      setProfile(p);
      // Ensure looking_for exists in data
      setData({ ...p, looking_for: p.looking_for || [] });

      const storedKey = localStorage.getItem('cardos_edit_' + params.slug);
      if (storedKey && storedKey === p.edit_token) {
        setAuthorized(true);
        const { data: ex } = await supabase.from('exchanges').select('*').eq('profile_id', p.id).order('created_at', { ascending: false });
        setExchanges(ex || []);
      }
      setLoading(false);
    };
    load();
  }, [params.slug]);

  const updEdit = (field: string, value: any) => setData((prev: any) => ({ ...prev, [field]: value }));
  const updEditArr = (key: string, idx: number, field: string, val: string) => {
    setData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[key][idx][field] = val;
      return next;
    });
  };
  const moveItem = (key: string, idx: number, dir: number) => {
    setData((prev: any) => {
      const arr = [...prev[key]];
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return prev;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return { ...prev, [key]: arr };
    });
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!data || !profile) return;
    setSaving(true); setSaveMsg('');
    const supabase = createClient();

    let finalAvatarUrl = data.avatar_url;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const path = params.slug + '/avatar.' + ext;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('profiles').update({
      name: data.name, title: data.title, tagline: data.tagline,
      avatar_url: finalAvatarUrl, location: data.location,
      links: data.links, companies: data.companies, builds: data.builds,
      ai_stack: data.ai_stack, philosophy: data.philosophy,
      looking_for: (data.looking_for || []).filter((item: any) => item.title),
      event: data.event,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);

    if (error) { setSaveMsg('Error: ' + error.message); }
    else { setSaveMsg('Saved!'); setAvatarFile(null); setAvatarPreview(''); setTimeout(() => setSaveMsg(''), 2000); }
    setSaving(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Note', 'Date'];
    const rows = exchanges.map((e: any) => [e.name, e.email, e.phone || '', e.company || '', e.note || '', new Date(e.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.map((c: string) => '"' + c + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'contacts_' + params.slug + '.csv';
    a.click();
  };

  if (loading) return <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] flex items-center justify-center"><p className="text-sm text-[#556]">Loading...</p></div>;
  if (!profile) return <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] flex items-center justify-center"><p className="text-sm text-[#ff4757]">Card not found</p></div>;
  if (!authorized) return (
    <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-3">{"\uD83D\uDD12"}</div>
        <h2 className="text-lg font-bold text-[#f0f4f8] mb-2">Not authorized</h2>
        <p className="text-sm text-[#7a8a9a] mb-4">Open your personal QR code link to access editing.</p>
        <a href={'/' + params.slug} className="text-xs text-[#76b900] font-medium">{'View card \u2192'}</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060b14] text-[#d0d8e4]">
      <div className="border-b border-white/[0.06] px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#ff4757] to-[#ff6b81] flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white">C</span>
          </div>
          <span className="text-sm font-bold text-[#f0f4f8]">CardOS</span>
          <span className="text-xs text-[#556]">/ Edit</span>
        </div>
        <a href={'/' + params.slug} className="text-xs text-[#76b900] font-medium">{'View card \u2192'}</a>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-6">
          <button type="button" onClick={() => setTab('edit')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: tab === 'edit' ? 'rgba(255,71,87,0.12)' : 'rgba(255,255,255,0.02)', color: tab === 'edit' ? '#ff4757' : '#556' }}>{"\u270F\uFE0F Edit Card"}</button>
          <button type="button" onClick={() => setTab('contacts')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: tab === 'contacts' ? 'rgba(255,71,87,0.12)' : 'rgba(255,255,255,0.02)', color: tab === 'contacts' ? '#ff4757' : '#556' }}>{"\uD83D\uDCE8 Contacts"} ({exchanges.length})</button>
          <button type="button" onClick={() => setTab('qr')} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: tab === 'qr' ? 'rgba(255,71,87,0.12)' : 'rgba(255,255,255,0.02)', color: tab === 'qr' ? '#ff4757' : '#556' }}>{"\uD83D\uDCF1 My QR"}</button>
        </div>

        {tab === 'edit' && data && (
          <div className="space-y-5">
            <input id="edit-avatar-upload" ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

            {/* Basic Info */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#f0f4f8]">Basic Info</h3>
              <div className="flex items-center gap-4">
                <label htmlFor="edit-avatar-upload" className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden cursor-pointer shrink-0">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    : data.avatar_url ? <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl text-[#445]">{"\uD83D\uDCF7"}</span>}
                </label>
                <div className="flex-1">
                  <label htmlFor="edit-avatar-upload" className="inline-block px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#8a9aaa] cursor-pointer">Change photo</label>
                  <input className={inp + ' mt-2 !py-1.5 !text-xs'} placeholder="Or paste URL" value={data.avatar_url || ''} onChange={e => { updEdit('avatar_url', e.target.value); setAvatarFile(null); setAvatarPreview(''); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-[#667] mb-1 block">Name</label><input className={inp} value={data.name} onChange={e => updEdit('name', e.target.value)} /></div>
                <div><label className="text-[10px] text-[#667] mb-1 block">Title</label><input className={inp} value={data.title || ''} onChange={e => updEdit('title', e.target.value)} /></div>
              </div>
              <div><label className="text-[10px] text-[#667] mb-1 block">Tagline</label><input className={inp} value={data.tagline || ''} onChange={e => updEdit('tagline', e.target.value)} /></div>
              <div><label className="text-[10px] text-[#667] mb-1 block">Location</label><input className={inp} value={data.location || ''} onChange={e => updEdit('location', e.target.value)} /></div>
            </div>

            {/* Links */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#f0f4f8]">Links</h3>
                <button type="button" onClick={() => updEdit('links', [...data.links, { icon: 'website', label: '', url: '', color: '#8a9aaa' }])} className="text-[10px] text-[#76b900] font-semibold">+ Add</button>
              </div>
              {data.links.map((l: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex flex-col shrink-0">
                    <button type="button" onClick={() => moveItem('links', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                    <button type="button" onClick={() => moveItem('links', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === data.links.length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                  </div>
                  <select value={l.icon} onChange={e => updEditArr('links', i, 'icon', e.target.value)} className={inp + ' !w-24 !py-1.5 !text-xs'}>
                    {PLATFORMS.map(p => <option key={p.icon} value={p.icon}>{p.label}</option>)}
                  </select>
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Label" value={l.label} onChange={e => updEditArr('links', i, 'label', e.target.value)} />
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="URL" value={l.url} onChange={e => updEditArr('links', i, 'url', e.target.value)} />
                  <button type="button" onClick={() => updEdit('links', data.links.filter((_: any, j: number) => j !== i))} className="text-[#ff4757]/40 text-sm shrink-0">{"\u00D7"}</button>
                </div>
              ))}
            </div>

            {/* Companies */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#f0f4f8]">Companies</h3>
                <button type="button" onClick={() => updEdit('companies', [...data.companies, { name: '', role: '', color: '#3498db', url: '', desc: '' }])} className="text-[10px] text-[#76b900] font-semibold">+ Add</button>
              </div>
              {data.companies.map((c: any, i: number) => (
                <div key={i} className="space-y-2 p-3 bg-white/[0.02] rounded-lg">
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveItem('companies', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                      <button type="button" onClick={() => moveItem('companies', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === data.companies.length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                    </div>
                    <input className={inp + ' !py-1.5 !text-xs'} placeholder="Name" value={c.name} onChange={e => updEditArr('companies', i, 'name', e.target.value)} />
                    <input className={inp + ' !py-1.5 !text-xs'} placeholder="Role" value={c.role} onChange={e => updEditArr('companies', i, 'role', e.target.value)} />
                    <input type="color" value={c.color} onChange={e => updEditArr('companies', i, 'color', e.target.value)} className="w-7 h-7 rounded border-none cursor-pointer shrink-0" />
                    <button type="button" onClick={() => updEdit('companies', data.companies.filter((_: any, j: number) => j !== i))} className="text-[#ff4757]/40 text-sm shrink-0">{"\u00D7"}</button>
                  </div>
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="URL" value={c.url} onChange={e => updEditArr('companies', i, 'url', e.target.value)} />
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Description" value={c.desc} onChange={e => updEditArr('companies', i, 'desc', e.target.value)} />
                </div>
              ))}
            </div>

            {/* Builds */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#f0f4f8]">Building in Public</h3>
                <button type="button" onClick={() => updEdit('builds', [...(data.builds || []), { name: '', emoji: '\uD83D\uDD27', desc: '', url: '', urlLabel: '' }])} className="text-[10px] text-[#76b900] font-semibold">+ Add</button>
              </div>
              {(data.builds || []).map((b: any, i: number) => (
                <div key={i} className="space-y-2 p-3 bg-white/[0.02] rounded-lg">
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveItem('builds', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                      <button type="button" onClick={() => moveItem('builds', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === (data.builds || []).length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {['\uD83D\uDCE1','\uD83D\uDCC8','\uD83D\uDDA5\uFE0F','\uD83E\uDD16','\uD83E\uDDE0','\uD83C\uDFA8','\uD83D\uDD2C','\uD83C\uDFAE','\uD83D\uDCF1','\uD83C\uDF10','\u26A1','\uD83D\uDD27','\uD83D\uDCA1','\uD83D\uDE80'].map(e => (
                        <button type="button" key={e} onClick={() => updEditArr('builds', i, 'emoji', e)} className="p-0.5 rounded text-sm" style={{ background: b.emoji === e ? 'rgba(118,185,0,0.15)' : 'none', border: b.emoji === e ? '1px solid rgba(118,185,0,0.3)' : '1px solid transparent' }}>{e}</button>
                      ))}
                    </div>
                    <input className={inp + ' !py-1.5 !text-xs'} placeholder="Project name" value={b.name} onChange={e => updEditArr('builds', i, 'name', e.target.value)} />
                    <button type="button" onClick={() => updEdit('builds', data.builds.filter((_: any, j: number) => j !== i))} className="text-[#ff4757]/40 text-sm shrink-0">{"\u00D7"}</button>
                  </div>
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Description" value={b.desc} onChange={e => updEditArr('builds', i, 'desc', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inp + ' !py-1.5 !text-xs'} placeholder="Link URL" value={b.url} onChange={e => updEditArr('builds', i, 'url', e.target.value)} />
                    <input className={inp + ' !py-1.5 !text-xs'} placeholder="Button text" value={b.urlLabel || ''} onChange={e => updEditArr('builds', i, 'urlLabel', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Stack */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#f0f4f8]">AI Stack</h3>
                <button type="button" onClick={() => updEdit('ai_stack', [...(data.ai_stack || []), { name: '', note: '' }])} className="text-[10px] text-[#76b900] font-semibold">+ Add</button>
              </div>
              {(data.ai_stack || []).map((t: any, i: number) => (
                <div key={i} className="grid grid-cols-[24px_1fr_2fr_30px] gap-2 items-center">
                  <div className="flex flex-col shrink-0">
                    <button type="button" onClick={() => moveItem('ai_stack', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                    <button type="button" onClick={() => moveItem('ai_stack', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === (data.ai_stack || []).length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                  </div>
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Tool" value={t.name} onChange={e => updEditArr('ai_stack', i, 'name', e.target.value)} />
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Why you use it" value={t.note} onChange={e => updEditArr('ai_stack', i, 'note', e.target.value)} />
                  <button type="button" onClick={() => updEdit('ai_stack', data.ai_stack.filter((_: any, j: number) => j !== i))} className="text-[#ff4757]/40 text-sm">{"\u00D7"}</button>
                </div>
              ))}
            </div>

            {/* Looking For */}
            <div className="bg-white/[0.02] border border-[#ff4757]/[0.15] rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#ff4757]">{"\uD83C\uDFAF"} Looking For</h3>
                <button type="button" onClick={() => updEdit('looking_for', [...(data.looking_for || []), { title: '', desc: '', emoji: '\uD83C\uDFAF' }])} className="text-[10px] text-[#ff4757] font-semibold">+ Add</button>
              </div>
              <p className="text-[10px] text-[#556]">What are you looking for at this event? Helps people know if there{"'"}s a match.</p>
              {(data.looking_for || []).map((item: any, i: number) => (
                <div key={i} className="space-y-2 p-3 bg-[#ff4757]/[0.03] border border-[#ff4757]/[0.08] rounded-lg">
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveItem('looking_for', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                      <button type="button" onClick={() => moveItem('looking_for', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === (data.looking_for || []).length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {LOOKING_EMOJIS.map(e => (
                        <button type="button" key={e} onClick={() => updEditArr('looking_for', i, 'emoji', e)} className="p-0.5 rounded text-sm" style={{ background: item.emoji === e ? 'rgba(255,71,87,0.15)' : 'none', border: item.emoji === e ? '1px solid rgba(255,71,87,0.3)' : '1px solid transparent' }}>{e}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => updEdit('looking_for', (data.looking_for || []).filter((_: any, j: number) => j !== i))} className="text-[#ff4757]/40 text-sm shrink-0 ml-auto">{"\u00D7"}</button>
                  </div>
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="What are you looking for?" value={item.title} onChange={e => updEditArr('looking_for', i, 'title', e.target.value)} />
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Brief description (optional)" value={item.desc} onChange={e => updEditArr('looking_for', i, 'desc', e.target.value)} />
                </div>
              ))}
            </div>

            {/* Philosophy */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#f0f4f8]">AI Philosophy</h3>
                <button type="button" onClick={() => updEdit('philosophy', [...(data.philosophy || []), ''])} className="text-[10px] text-[#76b900] font-semibold">+ Add</button>
              </div>
              {(data.philosophy || []).map((q: string, i: number) => (
                <div key={i} className="grid grid-cols-[1fr_30px] gap-2 items-center">
                  <input className={inp + ' !py-1.5 !text-xs'} placeholder="Your AI belief..." value={q} onChange={e => {
                    const next = [...data.philosophy];
                    next[i] = e.target.value;
                    updEdit('philosophy', next);
                  }} />
                  <button type="button" onClick={() => updEdit('philosophy', data.philosophy.filter((_: any, j: number) => j !== i))} className="text-[#ff4757]/40 text-sm">{"\u00D7"}</button>
                </div>
              ))}
            </div>

            {/* Event Badge */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#f0f4f8]">Event Badge</h3>
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="Event name" value={data.event?.name || ''} onChange={e => updEdit('event', { ...data.event, name: e.target.value, color: data.event?.color || '#76b900' })} />
                <input className={inp} placeholder="Date" value={data.event?.date || ''} onChange={e => updEdit('event', { ...data.event, date: e.target.value })} />
              </div>
            </div>

            <div className="h-20" />
          </div>
        )}

        {/* Sticky save bar */}
        {tab === 'edit' && (
          <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#060b14]/95 backdrop-blur-lg border-t border-white/[0.06] px-6 py-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <a href={'/' + profile.slug} className="text-xs text-[#76b900] font-medium no-underline">{'\u2190 Back to card'}</a>
              <div className="flex items-center gap-3">
                {saveMsg && <span className="text-xs font-semibold" style={{ color: saveMsg.startsWith('Error') ? '#ff4757' : '#76b900' }}>{saveMsg}</span>}
                <button type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#ff4757,#e8364a)', boxShadow: '0 4px 20px rgba(255,71,87,0.2)' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contacts tab */}
        {tab === 'contacts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-[#8a9aaa]">{exchanges.length + ' contact' + (exchanges.length !== 1 ? 's' : '')}</p>
              {exchanges.length > 0 && <button type="button" onClick={exportCSV} className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-[#8a9aaa]">Export CSV</button>}
            </div>
            {exchanges.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <div className="text-4xl mb-3">{"\uD83D\uDCED"}</div>
                <p className="text-sm text-[#7a8a9a]">No exchanges yet. Share your card to start!</p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                {exchanges.map((e: any, i: number) => (
                  <div key={e.id} className={'p-4' + (i > 0 ? ' border-t border-white/[0.04]' : '')}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#e8edf3]">{e.name}</span>
                      {e.company && <span className="text-[10px] text-[#667]">{'@ ' + e.company}</span>}
                    </div>
                    <p className="text-xs text-[#7a8a9a]">{e.email}{e.phone ? ' \u00B7 ' + e.phone : ''}</p>
                    {e.note && <p className="text-xs text-[#556] mt-1 italic">{'"' + e.note + '"'}</p>}
                    <p className="text-[10px] text-[#334] mt-1">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* QR tab */}
        {tab === 'qr' && profile && (
          <div className="text-center">
            <div ref={qrRef} className="bg-[#0d1520] rounded-2xl p-6 inline-block border border-white/[0.06]">
              <div className="mb-4">
                <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white overflow-hidden border-2 border-white/10" style={{ background: 'linear-gradient(135deg,' + (profile.companies?.[0]?.color || '#ff4757') + ',' + (profile.companies?.[0]?.color || '#ff4757') + '88)' }}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : profile.name.split(' ').map((n: string) => n?.[0] || '').join('').slice(0, 2)}
                </div>
                <p className="text-lg font-bold text-[#f0f4f8]">{profile.name}</p>
                {profile.title && <p className="text-xs text-[#8a9aaa] mt-0.5">{profile.title}</p>}
              </div>
              {profile.event && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold mb-4" style={{ background: profile.event.color + '14', border: '1px solid ' + profile.event.color + '30', color: profile.event.color }}>
                  {profile.event.name + ' \u00B7 ' + profile.event.date}
                </span>
              )}
              <div className="block" />
              <div className="inline-block p-3 bg-white rounded-xl my-3 leading-[0]">
                <QRCode data={'https://cardos.ai/' + profile.slug} size={200} />
              </div>
              <p className="text-[11px] text-[#76b900] font-semibold">{'cardos.ai/' + profile.slug}</p>
              <p className="text-[10px] text-[#556] mt-1">Scan to exchange contacts</p>
            </div>
            <div className="flex gap-2 justify-center mt-4">
              <button type="button" onClick={async () => {
                if (!profile) return;
                setSavingQr(true);
                try {
                  const W = 600, H = 820;
                  const canvas = document.createElement('canvas');
                  canvas.width = W; canvas.height = H;
                  const ctx = canvas.getContext('2d')!;

                  ctx.fillStyle = '#0d1520';
                  ctx.beginPath();
                  ctx.roundRect(0, 0, W, H, 32);
                  ctx.fill();

                  const color = profile.companies?.[0]?.color || '#ff4757';
                  let avatarDrawn = false;
                  if (profile.avatar_url) {
                    try {
                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = profile.avatar_url!; });
                      ctx.save();
                      ctx.beginPath();
                      ctx.arc(W / 2, 100, 50, 0, Math.PI * 2);
                      ctx.closePath();
                      ctx.clip();
                      ctx.drawImage(img, W / 2 - 50, 50, 100, 100);
                      ctx.restore();
                      ctx.beginPath();
                      ctx.arc(W / 2, 100, 51, 0, Math.PI * 2);
                      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                      ctx.lineWidth = 2;
                      ctx.stroke();
                      avatarDrawn = true;
                    } catch {}
                  }
                  if (!avatarDrawn) {
                    ctx.beginPath();
                    ctx.arc(W / 2, 100, 50, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 28px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2), W / 2, 112);
                  }

                  ctx.fillStyle = '#f0f4f8';
                  ctx.font = 'bold 26px -apple-system, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(profile.name, W / 2, 185);

                  if (profile.title) {
                    ctx.fillStyle = '#8a9aaa';
                    ctx.font = '16px -apple-system, sans-serif';
                    ctx.fillText(profile.title, W / 2, 210);
                  }

                  let badgeY = 240;
                  if (profile.event) {
                    const text = profile.event.name + ' \u00B7 ' + profile.event.date;
                    ctx.font = 'bold 13px -apple-system, sans-serif';
                    const tw = ctx.measureText(text).width;
                    ctx.fillStyle = profile.event.color + '22';
                    ctx.beginPath();
                    ctx.roundRect(W / 2 - tw / 2 - 16, badgeY - 12, tw + 32, 28, 14);
                    ctx.fill();
                    ctx.strokeStyle = profile.event.color + '44';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.fillStyle = profile.event.color;
                    ctx.fillText(text, W / 2, badgeY + 5);
                    badgeY += 40;
                  }

                  const svgEl = qrRef.current?.querySelector('svg');
                  if (svgEl) {
                    const svgData = new XMLSerializer().serializeToString(svgEl);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    const qrImg = new Image();
                    await new Promise<void>((res) => { qrImg.onload = () => res(); qrImg.src = svgUrl; });

                    const qrSize = 280;
                    const qrX = W / 2 - qrSize / 2 - 16;
                    const qrY = badgeY + 10;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.roundRect(qrX, qrY, qrSize + 32, qrSize + 32, 16);
                    ctx.fill();
                    ctx.drawImage(qrImg, qrX + 16, qrY + 16, qrSize, qrSize);
                    URL.revokeObjectURL(svgUrl);

                    const urlY = qrY + qrSize + 60;
                    ctx.fillStyle = '#76b900';
                    ctx.font = 'bold 14px -apple-system, sans-serif';
                    ctx.fillText('cardos.ai/' + profile.slug, W / 2, urlY);

                    ctx.fillStyle = '#556';
                    ctx.font = '12px -apple-system, sans-serif';
                    ctx.fillText('Scan to exchange contacts', W / 2, urlY + 20);
                  }

                  setQrImage(canvas.toDataURL('image/png'));
                } catch (e) { console.error(e); }
                setSavingQr(false);
              }} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#ff4757,#e8364a)', boxShadow: '0 4px 20px rgba(255,71,87,0.2)' }}>
                {savingQr ? 'Generating...' : '\uD83D\uDCF7 Generate Image'}
              </button>
              <button type="button" onClick={() => navigator.clipboard.writeText('https://cardos.ai/' + profile.slug)} className="px-4 py-2.5 rounded-xl border border-white/10 text-xs text-[#889]">Copy link</button>
              <button type="button" onClick={() => { if (navigator.share) navigator.share({ title: profile.name, url: 'https://cardos.ai/' + profile.slug }); }} className="px-4 py-2.5 rounded-xl bg-[#76b900]/10 border border-[#76b900]/20 text-xs text-[#76b900] font-semibold">Share</button>
            </div>
            {qrImage && (
              <div className="mt-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <p className="text-xs text-[#76b900] font-semibold mb-3">{"\uD83D\uDC47 Long press the image to save to Photos"}</p>
                <img src={qrImage} alt="QR Card" className="w-full max-w-[300px] mx-auto rounded-xl" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
