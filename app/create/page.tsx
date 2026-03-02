'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { ICONS } from '@/components/Icons';

const PLATFORMS = [
  { icon: 'x', label: 'X / Twitter', ph: 'https://x.com/handle' },
  { icon: 'email', label: 'Email', ph: 'you@company.com' },
  { icon: 'linkedin', label: 'LinkedIn', ph: 'https://linkedin.com/in/handle' },
  { icon: 'instagram', label: 'Instagram', ph: 'https://instagram.com/handle' },
  { icon: 'telegram', label: 'Telegram', ph: 'https://t.me/handle' },
  { icon: 'phone', label: 'Phone', ph: '+1-xxx-xxx-xxxx' },
  { icon: 'github', label: 'GitHub', ph: 'https://github.com/handle' },
  { icon: 'whatsapp', label: 'WhatsApp', ph: 'https://wa.me/number' },
  { icon: 'facebook', label: 'Facebook', ph: 'https://facebook.com/handle' },
  { icon: 'youtube', label: 'YouTube', ph: 'https://youtube.com/@channel' },
  { icon: 'tiktok', label: 'TikTok', ph: 'https://tiktok.com/@handle' },
  { icon: 'bluesky', label: 'Bluesky', ph: 'https://bsky.app/profile/handle' },
  { icon: 'wechat', label: 'WeChat', ph: 'Your WeChat ID' },
  { icon: 'discord', label: 'Discord', ph: 'invite link or username' },
  { icon: 'clapper', label: 'Clapper', ph: 'https://clapper.com/handle' },
  { icon: 'threads', label: 'Threads', ph: 'https://threads.net/@handle' },
  { icon: 'reddit', label: 'Reddit', ph: 'https://reddit.com/u/handle' },
  { icon: 'snapchat', label: 'Snapchat', ph: 'https://snapchat.com/add/handle' },
  { icon: 'onlyfans', label: 'OnlyFans', ph: 'https://onlyfans.com/handle' },
  { icon: 'medium', label: 'Medium', ph: 'https://medium.com/@handle' },
  { icon: 'website', label: 'Website', ph: 'https://yoursite.com' },
];

const EMOJIS = ['\uD83D\uDCE1', '\uD83D\uDCC8', '\uD83D\uDDA5\uFE0F', '\uD83E\uDD16', '\uD83E\uDDE0', '\uD83C\uDFA8', '\uD83D\uDD2C', '\uD83C\uDFAE', '\uD83D\uDCF1', '\uD83C\uDF10', '\u26A1', '\uD83D\uDD27', '\uD83D\uDCA1', '\uD83D\uDE80'];

const LOOKING_EMOJIS = ['\uD83C\uDFAF', '\uD83D\uDDA5\uFE0F', '\uD83E\uDD1D', '\uD83D\uDE80', '\uD83D\uDCB0', '\uD83D\uDD27', '\uD83D\uDCE1', '\uD83E\uDDE0', '\uD83C\uDFE2', '\uD83D\uDC65', '\uD83D\uDCE6', '\uD83C\uDF10'];

const inp = 'w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] placeholder-[#445] focus:border-[#ff4757]/30 outline-none';

function generateToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function CreatePage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ slug: string; token: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState({
    name: '', title: '', tagline: '', avatar_url: '', location: '', slug: '',
    links: [{ icon: 'x', label: '', url: '' }, { icon: 'email', label: '', url: '' }],
    companies: [{ name: '', role: '', color: '#ff4757', url: '', desc: '' }],
    builds: [{ name: '', emoji: '\uD83D\uDD27', desc: '', url: '', urlLabel: '' }],
    ai_stack: [{ name: '', note: '' }],
    philosophy: [''],
    looking_for: [{ title: '', desc: '', emoji: '\uD83C\uDFAF' }],
    event: { name: 'GTC 2026', date: 'March 2026', color: '#76b900' },
    pin: '',
  });

  const steps = ['Basic', 'Links', 'Companies', 'Projects', 'AI Stack', 'Looking For', 'Publish'];

  const updArr = (key: string, idx: number, field: string, val: string) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[key][idx][field] = val;
      return next;
    });
  };

  const addItem = (key: string, tmpl: any) => setData(prev => ({ ...prev, [key]: [...(prev as any)[key], { ...tmpl }] }));
  const removeItem = (key: string, idx: number) => setData(prev => ({ ...prev, [key]: (prev as any)[key].filter((_: any, i: number) => i !== idx) }));
  const moveItem = (key: string, idx: number, dir: number) => {
    setData(prev => {
      const arr = [...(prev as any)[key]];
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

  const publish = async () => {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!data.name || !slug) { setError('Name and slug are required'); return; }
    if (!data.pin || data.pin.length !== 4 || !/^\d{4}$/.test(data.pin)) { setError('Please set a 4-digit PIN'); return; }

    setSaving(true); setError('');
    const supabase = createClient();

    const { data: existing } = await supabase.from('profiles').select('id').eq('slug', slug).single();
    if (existing) { setError('This URL is already taken. Choose a different one.'); setSaving(false); return; }

    let finalAvatarUrl = data.avatar_url;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const path = slug + '/avatar.' + ext;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }
    }

    const processedLinks = data.links.filter(l => l.url).map(l => {
      if (!l.label && l.icon === 'email') return { ...l, label: l.url, url: 'mailto:' + l.url, color: '#ea4335' };
      if (!l.label && l.icon === 'x') { const h = l.url.replace(/https?:\/\/(x|twitter)\.com\//i, ''); return { ...l, label: '@' + h, color: '#fff' }; }
      if (!l.label && l.icon === 'linkedin') return { ...l, label: 'LinkedIn', color: '#0077b5' };
      if (!l.label && l.icon === 'telegram') return { ...l, label: 'Telegram', color: '#26a5e4' };
      if (!l.label && l.icon === 'github') return { ...l, label: 'GitHub', color: '#fff' };
      if (!l.label && l.icon === 'phone') return { ...l, label: l.url, url: 'tel:' + l.url, color: '#2ecc71' };
      if (!l.label) return { ...l, label: l.url, color: '#8a9aaa' };
      return l;
    });

    const editToken = generateToken();

    const { error: insertErr } = await supabase.from('profiles').insert({
      slug,
      name: data.name,
      title: data.title || null,
      tagline: data.tagline || null,
      avatar_url: finalAvatarUrl || null,
      location: data.location || null,
      links: processedLinks,
      companies: data.companies.filter(c => c.name),
      builds: data.builds.filter(b => b.name),
      ai_stack: data.ai_stack.filter(t => t.name),
      philosophy: data.philosophy.filter(Boolean),
      looking_for: data.looking_for.filter(item => item.title),
      event: data.event.name ? data.event : null,
      edit_token: editToken,
      pin: data.pin,
    });

    if (insertErr) { setError('Save error: ' + insertErr.message); setSaving(false); return; }

    localStorage.setItem('cardos_edit_' + slug, editToken);
    setDone({ slug, token: editToken });
    setSaving(false);
  };

  if (done) {
    const cardUrl = 'https://cardos.ai/' + done.slug;
    return (
      <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">{"\uD83C\uDF89"}</div>
          <h2 className="text-xl font-bold text-[#f0f4f8] mb-2">Your card is live!</h2>

          <div className="bg-[#76b900]/[0.06] border border-[#76b900]/[0.15] rounded-2xl p-5 mt-6 mb-4">
            <p className="text-[11px] font-bold text-[#76b900] uppercase tracking-wider mb-2">{"\uD83D\uDD10 Remember your PIN"}</p>
            <p className="text-3xl font-extrabold text-[#f0f4f8] tracking-[0.3em] my-3">{data.pin}</p>
            <p className="text-[11px] text-[#778]">{"You'll need this PIN to edit your card later"}</p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
            <p className="text-[11px] font-bold text-[#8a9aaa] uppercase tracking-wider mb-2">{"\uD83C\uDF10 Your card link"}</p>
            <p className="text-sm text-[#d0d8e4] font-semibold mb-3">{cardUrl}</p>
            <button onClick={() => navigator.clipboard.writeText(cardUrl)} className="px-4 py-2 rounded-lg border border-white/10 text-xs text-[#889]">Copy link</button>
          </div>

          <a href={'/' + done.slug} className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#ff4757,#e8364a)', boxShadow: '0 4px 20px rgba(255,71,87,0.2)' }}>
            {'View Your Card \u2192'}
          </a>
          <p className="text-[10px] text-[#445] mt-4">{"Open your card \u2192 tap 'Edit card' at the bottom \u2192 enter your PIN to edit anytime"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-[#d0d8e4]">
      <div className="border-b border-white/[0.06] px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#ff4757] to-[#ff6b81] flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-white">C</span>
          </div>
          <span className="text-sm font-bold text-[#f0f4f8]">CardOS</span>
          <span className="text-xs text-[#556]">/ Create</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-8">
          {steps.map((s, i) => (
            <button key={s} onClick={() => setStep(i)} className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all" style={{ background: i === step ? 'rgba(255,71,87,0.12)' : 'rgba(255,255,255,0.02)', color: i === step ? '#ff4757' : '#556' }}>{s}</button>
          ))}
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#f0f4f8]">Basic Info</h3>
            <div><label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Name *</label><input className={inp} placeholder="Your name" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Title *</label><input className={inp} placeholder="CFO @ Clapper" value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} /></div>
            <div><label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Tagline</label><input className={inp} placeholder="AI builder \u00B7 Creator economy" value={data.tagline} onChange={e => setData(p => ({ ...p, tagline: e.target.value }))} /></div>
            <div><label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Location</label><input className={inp} placeholder="Bay Area, CA" value={data.location} onChange={e => setData(p => ({ ...p, location: e.target.value }))} /></div>
            <div>
              <label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Avatar</label>
              <input id="avatar-upload" ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
              <div className="flex items-center gap-4">
                <label htmlFor="avatar-upload" className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden cursor-pointer shrink-0">
                  {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    : data.avatar_url ? <img src={data.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-2xl text-[#445]">{"\uD83D\uDCF7"}</span>}
                </label>
                <div className="flex-1">
                  <label htmlFor="avatar-upload" className="inline-block px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[#8a9aaa] font-medium cursor-pointer">Upload photo</label>
                  <p className="text-[10px] text-[#445] mt-1">Or paste a URL below</p>
                  <input className={inp + ' mt-1 !py-1.5 !text-xs'} placeholder="https://example.com/photo.jpg" value={data.avatar_url} onChange={e => { setData(p => ({ ...p, avatar_url: e.target.value })); setAvatarFile(null); setAvatarPreview(''); }} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Event Badge</label>
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="GTC 2026" value={data.event.name} onChange={e => setData(p => ({ ...p, event: { ...p.event, name: e.target.value } }))} />
                <input className={inp} placeholder="March 2026" value={data.event.date} onChange={e => setData(p => ({ ...p, event: { ...p.event, date: e.target.value } }))} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#f0f4f8]">Social & Contact Links</h3>
              <button type="button" onClick={() => addItem('links', { icon: 'website', label: '', url: '' })} className="px-3 py-1 rounded-lg bg-[#76b900]/10 border border-[#76b900]/20 text-[11px] font-semibold text-[#76b900]">+ Add</button>
            </div>
            <p className="text-[11px] text-[#556]">Visitors will see these as tappable buttons on your card.</p>
            {data.links.map((l, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveItem('links', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                      <button type="button" onClick={() => moveItem('links', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === data.links.length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                    </div>
                    <span className="text-[#8a9aaa]">{ICONS[l.icon] || ICONS.website}</span>
                    <select value={l.icon} onChange={e => updArr('links', i, 'icon', e.target.value)} className={inp + ' !w-auto !py-1.5 !text-xs'}>
                      {PLATFORMS.map(p => <option key={p.icon} value={p.icon}>{p.label}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => removeItem('links', i)} className="text-[11px] text-[#ff4757]/60 hover:text-[#ff4757]">Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Display label" value={l.label} onChange={e => updArr('links', i, 'label', e.target.value)} />
                  <input className={inp} placeholder={PLATFORMS.find(p => p.icon === l.icon)?.ph || 'URL'} value={l.url} onChange={e => updArr('links', i, 'url', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#f0f4f8]">Companies & Roles</h3>
              <button type="button" onClick={() => addItem('companies', { name: '', role: '', color: '#76b900', url: '', desc: '' })} className="px-3 py-1 rounded-lg bg-[#76b900]/10 border border-[#76b900]/20 text-[11px] font-semibold text-[#76b900]">+ Add</button>
            </div>
            {data.companies.map((c, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveItem('companies', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                      <button type="button" onClick={() => moveItem('companies', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === data.companies.length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                    </div>
                    <input type="color" value={c.color} onChange={e => updArr('companies', i, 'color', e.target.value)} className="w-7 h-7 rounded border-none cursor-pointer" /><span className="text-[11px] text-[#667]">Brand color</span>
                  </div>
                  {data.companies.length > 1 && <button type="button" onClick={() => removeItem('companies', i)} className="text-[11px] text-[#ff4757]/60">Remove</button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Company name" value={c.name} onChange={e => updArr('companies', i, 'name', e.target.value)} />
                  <input className={inp} placeholder="Your role" value={c.role} onChange={e => updArr('companies', i, 'role', e.target.value)} />
                </div>
                <input className={inp} placeholder="Website URL" value={c.url} onChange={e => updArr('companies', i, 'url', e.target.value)} />
                <input className={inp} placeholder="One-line description" value={c.desc} onChange={e => updArr('companies', i, 'desc', e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#f0f4f8]">Building in Public</h3>
              <button type="button" onClick={() => addItem('builds', { name: '', emoji: '\uD83D\uDD27', desc: '', url: '', urlLabel: '' })} className="px-3 py-1 rounded-lg bg-[#76b900]/10 border border-[#76b900]/20 text-[11px] font-semibold text-[#76b900]">+ Add</button>
            </div>
            <p className="text-[11px] text-[#556]">{"Side projects, open-source, bots, tools \u2014 anything you're building."}</p>
            {data.builds.map((b, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col shrink-0">
                      <button type="button" onClick={() => moveItem('builds', i, -1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === 0 ? 0.2 : 1 }}>{"\u25B2"}</button>
                      <button type="button" onClick={() => moveItem('builds', i, 1)} className="text-[10px] text-[#556] hover:text-[#aaa] leading-none" style={{ opacity: i === data.builds.length - 1 ? 0.2 : 1 }}>{"\u25BC"}</button>
                    </div>
                    <div className="flex gap-1 flex-wrap">{EMOJIS.map(e => <button key={e} type="button" onClick={() => updArr('builds', i, 'emoji', e)} className="p-0.5 rounded text-sm" style={{ background: b.emoji === e ? 'rgba(118,185,0,0.15)' : 'none', border: b.emoji === e ? '1px solid rgba(118,185,0,0.3)' : '1px solid transparent' }}>{e}</button>)}</div>
                  </div>
                  {data.builds.length > 1 && <button type="button" onClick={() => removeItem('builds', i)} className="text-[11px] text-[#ff4757]/60 ml-2">Remove</button>}
                </div>
                <input className={inp} placeholder="Project name" value={b.name} onChange={e => updArr('builds', i, 'name', e.target.value)} />
                <input className={inp} placeholder="Short description" value={b.desc} onChange={e => updArr('builds', i, 'desc', e.target.value)} />
                <div className="grid grid-cols-[2fr_1fr] gap-2">
                  <input className={inp} placeholder="Link (GitHub, Telegram...)" value={b.url} onChange={e => updArr('builds', i, 'url', e.target.value)} />
                  <input className={inp} placeholder="Button text" value={b.urlLabel} onChange={e => updArr('builds', i, 'urlLabel', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#f0f4f8]">AI Stack</h3>
                <button type="button" onClick={() => addItem('ai_stack', { name: '', note: '' })} className="px-3 py-1 rounded-lg bg-[#76b900]/10 border border-[#76b900]/20 text-[11px] font-semibold text-[#76b900]">+ Add</button>
              </div>
              <p className="text-[11px] text-[#556]">What AI tools do you use? Great conversation starter.</p>
              {data.ai_stack.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_32px] gap-2 items-center">
                  <input className={inp} placeholder="Tool" value={t.name} onChange={e => updArr('ai_stack', i, 'name', e.target.value)} />
                  <input className={inp} placeholder="Why you use it" value={t.note} onChange={e => updArr('ai_stack', i, 'note', e.target.value)} />
                  <button type="button" onClick={() => removeItem('ai_stack', i)} className="text-[#ff4757]/40 text-lg">{"\u00D7"}</button>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#f0f4f8]">AI Philosophy</h3>
                <button type="button" onClick={() => setData(p => ({ ...p, philosophy: [...p.philosophy, ''] }))} className="px-3 py-1 rounded-lg bg-[#76b900]/10 border border-[#76b900]/20 text-[11px] font-semibold text-[#76b900]">+ Add</button>
              </div>
              <p className="text-[11px] text-[#556]">Your hot takes on AI. Makes you memorable.</p>
              {data.philosophy.map((q, i) => (
                <div key={i} className="grid grid-cols-[1fr_32px] gap-2 items-center">
                  <input className={inp} placeholder="Your AI belief..." value={q} onChange={e => { const next = [...data.philosophy]; next[i] = e.target.value; setData(p => ({ ...p, philosophy: next })); }} />
                  <button type="button" onClick={() => setData(p => ({ ...p, philosophy: p.philosophy.filter((_, j) => j !== i) }))} className="text-[#ff4757]/40 text-lg">{"\u00D7"}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#f0f4f8]">Looking For at This Event</h3>
              <button type="button" onClick={() => addItem('looking_for', { title: '', desc: '', emoji: '\uD83C\uDFAF' })} className="px-3 py-1 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/20 text-[11px] font-semibold text-[#ff4757]">+ Add</button>
            </div>
            <p className="text-[11px] text-[#556]">Tell people what you{"'"}re looking for — partnerships, products, talent. Makes matching instant.</p>
            {data.looking_for.map((item, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 flex-wrap">
                    {LOOKING_EMOJIS.map(e => (
                      <button type="button" key={e} onClick={() => updArr('looking_for', i, 'emoji', e)} className="p-0.5 rounded text-sm" style={{ background: item.emoji === e ? 'rgba(255,71,87,0.15)' : 'none', border: item.emoji === e ? '1px solid rgba(255,71,87,0.3)' : '1px solid transparent' }}>{e}</button>
                    ))}
                  </div>
                  {data.looking_for.length > 1 && <button type="button" onClick={() => removeItem('looking_for', i)} className="text-[11px] text-[#ff4757]/60 ml-2">Remove</button>}
                </div>
                <input className={inp} placeholder="What are you looking for?" value={item.title} onChange={e => updArr('looking_for', i, 'title', e.target.value)} />
                <input className={inp} placeholder="Brief description (optional)" value={item.desc} onChange={e => updArr('looking_for', i, 'desc', e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-[#f0f4f8]">Publish Your Card</h3>
            <div>
              <label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Your card URL</label>
              <div className="flex">
                <span className="px-3 py-2.5 rounded-l-lg bg-white/[0.02] border border-r-0 border-white/[0.08] text-sm text-[#556]">cardos.ai/</span>
                <input className={inp + ' !rounded-l-none'} placeholder={data.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourname'} value={data.slug} onChange={e => setData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              </div>
            </div>
            <div className="bg-[#76b900]/[0.06] border border-[#76b900]/[0.15] rounded-xl p-5">
              <p className="text-sm font-semibold text-[#76b900] mb-1.5">Ready to go live?</p>
              <p className="text-[11px] text-[#7a8a9a] leading-relaxed mb-4">{"Your card will be instantly available. You'll get a personal QR code to edit it anytime."}</p>
              <div className="mb-4">
                <label className="text-[11px] font-semibold text-[#8a9aaa] mb-1.5 block">Set a 4-digit PIN *</label>
                <input type="tel" maxLength={4} className={inp + ' !tracking-[0.5em] !text-center !text-lg !font-bold'} placeholder="\u2022\u2022\u2022\u2022" value={data.pin} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setData(p => ({ ...p, pin: v })); }} />
                <p className="text-[10px] text-[#556] mt-1">{"Remember this PIN \u2014 you'll need it to edit your card"}</p>
              </div>
              <button type="button" onClick={publish} disabled={saving || !data.name || !data.title} className="w-full py-3.5 rounded-xl text-sm font-bold transition-all" style={{ background: data.name && data.title ? 'linear-gradient(135deg,#ff4757,#e8364a)' : 'rgba(255,255,255,0.04)', color: data.name && data.title ? '#fff' : '#445', boxShadow: data.name && data.title ? '0 4px 20px rgba(255,71,87,0.2)' : 'none', cursor: data.name && data.title ? 'pointer' : 'default' }}>
                {saving ? 'Publishing...' : data.name && data.title ? 'Publish Card \u2192' : 'Fill in name & title first'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="px-5 py-2.5 rounded-lg border border-white/[0.08] text-sm" style={{ color: step === 0 ? '#334' : '#8a9aaa', cursor: step === 0 ? 'default' : 'pointer' }}>{"\u2190 Back"}</button>
          {step < steps.length - 1 && (
            <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/20 text-sm font-semibold text-[#ff4757] cursor-pointer">{"Next \u2192"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
