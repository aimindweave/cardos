'use client';

import { useState, useEffect, useRef } from 'react';
import type { Profile } from '@/lib/types';
import { ICONS, UI } from './Icons';
import { QRCode } from './QRCode';

function downloadVCard(profile: Profile, cardUrl: string) {
  // Use hidden iframe to trigger iOS contacts without leaving the page
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = '/api/vcard/' + profile.slug;
  document.body.appendChild(iframe);
  setTimeout(() => document.body.removeChild(iframe), 5000);
}

function parseVcf(t: string) {
  const find = (p: RegExp) => { const m = t.match(p); return m ? m[1].trim() : ''; };
  return {
    name: find(/^FN[;:](.+)$/im),
    email: find(/EMAIL[^:]*:(.+)/im),
    phone: find(/TEL[^:]*:(.+)/im),
    company: find(/ORG[^:]*:(.+)/im).replace(/;/g, ' '),
    linkedin: find(/URL[^:]*:(.+linkedin.+)/im),
  };
}

function NeuralBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!; let id: number;
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      c.width = c.offsetWidth * d;
      c.height = c.offsetHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const nodes = Array.from({ length: 35 }, () => ({
      x: Math.random() * c.offsetWidth,
      y: Math.random() * c.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5
    }));
    const loop = () => {
      const w = c.offsetWidth, h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283);
        ctx.fillStyle = 'rgba(118,185,0,0.2)'; ctx.fill();
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(118,185,0,' + String(0.06 * (1 - d / 110)) + ')';
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(loop);
    };
    loop(); window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

interface CardViewProps {
  profile: Profile;
  editToken?: string | null;
}

export default function CardView({ profile, editToken }: CardViewProps) {
  const cardUrl = 'https://cardos.vercel.app/s/' + profile.slug;
  const mainColor = profile.companies?.[0]?.color || '#ff4757';

  const [view, setView] = useState<'card' | 'exchange'>('card');
  const [expBuild, setExpBuild] = useState<number | null>(null);
  const [actTool, setActTool] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(-1);
  const [ready, setReady] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', note: '', linkedin: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [manageToken, setManageToken] = useState('');
  const [manageErr, setManageErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);

    // Check if owner via URL param or localStorage
    const params = new URLSearchParams(window.location.search);
    const keyParam = params.get('key');
    const storedKey = localStorage.getItem('cardos_edit_' + profile.slug);

    if (editToken && (keyParam === editToken || storedKey === editToken)) {
      setIsOwner(true);
      // Save to localStorage so they don't need the key next time
      if (keyParam === editToken) {
        localStorage.setItem('cardos_edit_' + profile.slug, editToken);
        // Clean up URL
        window.history.replaceState({}, '', '/s/' + profile.slug);
      }
    }

    return () => clearTimeout(t);
  }, [profile.slug, editToken]);

  const copy = async () => { try { await navigator.clipboard.writeText(cardUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: profile.name, url: cardUrl }); } catch {}
    } else copy();
  };
  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setSending(true);
    try {
      await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_slug: profile.slug, ...form, source: 'manual' }),
      });
      setSent(true);
      setTimeout(() => { downloadVCard(profile, cardUrl); }, 1500);
    } catch (e) {
      alert('Failed to send, please try again');
    }
    setSending(false);
  };

  const onVcf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setParsing(true);
    const r = new FileReader();
    r.onload = (ev) => {
      const p = parseVcf((ev.target?.result as string) || '');
      setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v)) }));
      setParsing(false);
    };
    r.onerror = () => setParsing(false);
    r.readAsText(f); e.target.value = '';
  };

  const gl = 'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-2xl';
  const ok = form.name && form.email;
  const firstName = profile.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#060b14] text-[#d0d8e4] relative overflow-hidden">
      <NeuralBg />
      <div className="relative z-[1] max-w-[440px] mx-auto px-4 py-5 pb-10" style={{ opacity: ready ? 1 : 0, transform: ready ? 'none' : 'translateY(16px)', transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4 px-1">
          {profile.event ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-wide" style={{ background: profile.event.color + '14', border: '1px solid ' + profile.event.color + '30', color: profile.event.color }}>
              <span className="w-1.5 h-1.5 rounded-full animate-[blink_2s_infinite]" style={{ background: profile.event.color, boxShadow: '0 0 6px ' + profile.event.color + '80' }} />
              {profile.event.name + ' \u00B7 ' + profile.event.date}
            </span>
          ) : <span />}
          <div className="flex gap-1">
            <button onClick={share} aria-label="Share" className="p-2 rounded-lg bg-white/5 border border-white/[0.08] text-[#667]">{UI.sh}</button>
            <button onClick={() => setQrOpen(!qrOpen)} aria-label="QR" className="p-2 rounded-lg border" style={{ background: qrOpen ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.05)', borderColor: qrOpen ? 'rgba(118,185,0,0.3)' : 'rgba(255,255,255,0.08)', color: qrOpen ? '#76b900' : '#667' }}>{UI.qr}</button>
          </div>
        </div>

        {/* QR Popover */}
        {qrOpen && <>
          <div onClick={() => setQrOpen(false)} className="fixed inset-0 z-[90]" />
          <div className="absolute right-4 top-14 z-[100] w-[220px] text-center bg-[rgba(12,18,30,0.96)] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-[fadeUp_0.25s_ease]">
            <div className="inline-block p-3 bg-white rounded-xl mb-3 leading-[0]">
              <QRCode data={cardUrl} size={160} />
            </div>
            <p className="text-[11px] text-[#778] mb-2.5">Scan to open this card</p>
            <button onClick={(e) => { e.stopPropagation(); copy(); }} className="w-full py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium flex items-center justify-center gap-1.5" style={{ color: copied ? '#76b900' : '#889' }}>
              {copied ? <>{UI.ok} Copied!</> : <>{UI.cp} Copy link</>}
            </button>
          </div>
        </>}

        {/* Exchange View */}
        {view === 'exchange' && (
          <div className={gl + ' p-5 mb-3 animate-[fadeUp_0.4s_ease]'}>
            <input ref={fileRef} type="file" accept=".vcf,.vcard" className="hidden" onChange={onVcf} />
            {sent ? (
              <div className="text-center py-5">
                <div className="text-4xl mb-2.5">{"\uD83E\uDD1D"}</div>
                <p className="text-[15px] font-semibold text-[#76b900]">Nice meeting you!</p>
                <p className="text-xs text-[#778] mt-2">{"Adding " + firstName + "'s contact to your phone..."}</p>

                <div className="mt-4 p-3 rounded-xl bg-[#76b900]/[0.06] border border-[#76b900]/[0.15]">
                  <p className="text-[11px] text-[#76b900] font-semibold">{"\u2709\uFE0F Check your email"}</p>
                  <p className="text-[10px] text-[#778] mt-1">{firstName + "'s contact info has been sent to your inbox"}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <button onClick={() => downloadVCard(profile, cardUrl)} className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,' + mainColor + ',' + mainColor + 'cc)' }}>
                    {UI.dl}{' Save ' + firstName + "'s Contact Again"}
                  </button>
                </div>

                {/* Big CTA: Create your own CardOS */}
                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                  <div className="bg-gradient-to-br from-[#ff4757]/[0.08] to-[#ff6b81]/[0.04] border border-[#ff4757]/[0.15] rounded-2xl p-5">
                    <p className="text-3xl mb-2">{"\u26A1"}</p>
                    <p className="text-[14px] font-bold text-[#f0f4f8] mb-1">{"Want your own card?"}</p>
                    <p className="text-[11px] text-[#8a9aaa] leading-relaxed mb-4">{"Create a free digital business card like " + firstName + "'s. Share at events via QR code. Collect contacts automatically."}</p>
                    <a href="/create" className="inline-block w-full py-3 rounded-xl text-sm font-bold text-white no-underline text-center" style={{ background: 'linear-gradient(135deg,#ff4757,#e8364a)', boxShadow: '0 4px 20px rgba(255,71,87,0.25)' }}>
                      {"Create Your Card \u2014 60 seconds, free"}
                    </a>
                    <div className="flex justify-center gap-3 mt-3">
                      <span className="text-[10px] text-[#667]">{"\uD83D\uDCF1 No app needed"}</span>
                      <span className="text-[10px] text-[#667]">{"\uD83E\uDD1D Two-way exchange"}</span>
                      <span className="text-[10px] text-[#667]">{"\uD83D\uDCCA Export CSV"}</span>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', company: '', note: '', linkedin: '' }); }} className="mt-3 px-5 py-2 rounded-lg border border-white/10 text-xs text-[#889]">Exchange another</button>
              </div>
            ) : <>
              <h3 className="text-[15px] font-semibold text-[#e8edf3] mb-1">{"Exchange with " + firstName}</h3>
              <p className="text-xs text-[#778] mb-4">{"Share your info \u2014 you'll get " + firstName + "'s contact card in return"}</p>
              <div className="mb-4">
                <button onClick={() => fileRef.current?.click()} className={gl + ' w-full p-4 flex items-center gap-3 cursor-pointer'}>
                  <span className="text-2xl">{parsing ? '\u23F3' : '\uD83D\uDCC7'}</span>
                  <div className="text-left">
                    <span className="text-xs font-semibold block">Import vCard</span>
                    <span className="text-[10px] text-[#667]">Upload .vcf file to auto-fill</span>
                  </div>
                </button>
              </div>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-[#556] font-medium tracking-wider">OR FILL IN</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Your name *" value={form.name} onChange={e=>upd('name',e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] focus:border-[#76b900]/30 outline-none placeholder-[#445]" />
                  <input type="text" placeholder="Company" value={form.company} onChange={e=>upd('company',e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] focus:border-[#76b900]/30 outline-none placeholder-[#445]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="email" placeholder="Your email *" value={form.email} onChange={e=>upd('email',e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] focus:border-[#76b900]/30 outline-none placeholder-[#445]" />
                  <input type="tel" placeholder="Phone" value={form.phone} onChange={e=>upd('phone',e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] focus:border-[#76b900]/30 outline-none placeholder-[#445]" />
                </div>
                <input type="url" placeholder="LinkedIn (optional)" value={form.linkedin} onChange={e=>upd('linkedin',e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] focus:border-[#76b900]/30 outline-none placeholder-[#445]" />
                <input type="text" placeholder="What should we chat about?" value={form.note} onChange={e=>upd('note',e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-[#d0d8e4] focus:border-[#76b900]/30 outline-none placeholder-[#445]" />
                <button onClick={submit} disabled={!ok || sending} className="py-3.5 rounded-xl text-sm font-semibold transition-all" style={{ background: ok ? 'linear-gradient(135deg,' + mainColor + ',' + mainColor + 'cc)' : 'rgba(255,255,255,0.04)', color: ok ? '#fff' : '#445', boxShadow: ok ? '0 3px 14px ' + mainColor + '33' : 'none', cursor: ok ? 'pointer' : 'default' }}>
                  {sending ? 'Exchanging...' : ok ? 'Exchange \u2192 Get ' + firstName + "'s Contact" : 'Fill in name & email to exchange'}
                </button>
              </div>
            </>}
          </div>
        )}

        {/* Card View */}
        {view === 'card' && <>
          {/* Hero */}
          <div className={gl + ' p-7 mb-3'}>
            <div className="w-[72px] h-[72px] rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white overflow-hidden border-2 border-white/10" style={{ background: 'linear-gradient(135deg,' + mainColor + ',' + mainColor + '88)', boxShadow: '0 4px 24px ' + mainColor + '30' }}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" /> : profile.name.split(' ').map(n => n?.[0] || '').join('').slice(0, 2)}
            </div>
            <div className="text-center">
              <h1 className="text-[26px] font-bold text-[#f0f4f8] tracking-tight">{profile.name}</h1>
              {profile.title && <p className="text-sm text-[#8a9aaa] mt-1.5 font-medium">{profile.title}</p>}
              {profile.tagline && <p className="text-[13px] text-[#6a7a8a] leading-relaxed mt-2.5 max-w-[320px] mx-auto">{profile.tagline}</p>}
              {profile.location && <div className="inline-flex items-center gap-1 text-xs text-[#5a6a7a] mt-2">{UI.loc} {profile.location}</div>}
            </div>
          </div>

          {/* Links */}
          {profile.links.length > 0 && (
            <div className={'grid gap-2 mb-3 ' + (profile.links.length >= 2 ? 'grid-cols-2' : 'grid-cols-1')}>
              {profile.links.map((l, i) => {
                const isUrl = l.url.startsWith('http') || l.url.startsWith('mailto:') || l.url.startsWith('tel:');
                if (isUrl) return (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={gl + ' flex items-center gap-2.5 px-3.5 py-3 no-underline text-[#a0aab4] text-xs font-medium'}>
                    <span className="shrink-0" style={{ color: l.color || '#8a9aaa' }}>{ICONS[l.icon as keyof typeof ICONS] || ICONS.website}</span>
                    <span className="truncate">{l.label}</span>
                  </a>
                );
                return (
                  <button key={i} onClick={() => { navigator.clipboard.writeText(l.url); setCopiedLink(i); setTimeout(() => setCopiedLink(-1), 2000); }} className={gl + ' flex items-center gap-2.5 px-3.5 py-3 text-[#a0aab4] text-xs font-medium text-left border-0 cursor-pointer w-full'}>
                    <span className="shrink-0" style={{ color: copiedLink === i ? '#76b900' : (l.color || '#8a9aaa') }}>{ICONS[l.icon as keyof typeof ICONS] || ICONS.website}</span>
                    <span className="truncate">{copiedLink === i ? '\u2705 Copied: ' + l.url : l.label + ' \u00B7 Tap to copy'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Companies */}
          {profile.companies.length > 0 && (
            <div className={gl + ' p-5 mb-2.5'}>
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#76b900] mb-3">{"\uD83C\uDFE2 Companies"}</h2>
              <div className="flex flex-col gap-2">
                {profile.companies.map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 no-underline">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: c.color + '15', border: '1px solid ' + c.color + '25', color: c.color }}>{c.name.slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-[#e8edf3]">{c.name}</span><span className="text-[10px] font-medium" style={{ color: c.color }}>{c.role}</span></div>
                      <p className="text-[11px] text-[#6a7a8a] mt-0.5 leading-snug">{c.desc}</p>
                    </div>
                    <span className="text-[#556] shrink-0">{UI.ln}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Builds */}
          {profile.builds.length > 0 && (
            <div className={gl + ' p-5 mb-2.5'}>
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#76b900] mb-3">{"\uD83D\uDD28 Building in Public"}</h2>
              <div className="flex flex-col gap-1.5">
                {profile.builds.map((b, i) => (
                  <div key={i} onClick={() => setExpBuild(expBuild === i ? null : i)} className="rounded-xl p-3 cursor-pointer transition-all" style={{ background: expBuild === i ? 'rgba(118,185,0,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (expBuild === i ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.04)') }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{b.emoji}</span>
                      <span className="text-[13px] font-semibold text-[#e8edf3] flex-1">{b.name}</span>
                      <span className="text-[10px] text-[#556] transition-transform" style={{ transform: expBuild === i ? 'rotate(180deg)' : 'none' }}>{"\u25BE"}</span>
                    </div>
                    <div className="overflow-hidden transition-all" style={{ maxHeight: expBuild === i ? 120 : 0 }}>
                      <p className="text-xs text-[#7a8a9a] mt-2 leading-relaxed">{b.desc}</p>
                      {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-[#8ab4f8] no-underline font-medium">{b.urlLabel || 'Check it out'} {UI.ln}</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Stack */}
          {profile.ai_stack.length > 0 && (
            <div className={gl + ' p-5 mb-2.5'}>
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#76b900] mb-3">{"\uD83E\uDDF0 AI Stack"}</h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.ai_stack.map((t, i) => (
                  <span key={i} onClick={() => setActTool(actTool === i ? null : i)} className="text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-all select-none" style={{ background: actTool === i ? 'rgba(118,185,0,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (actTool === i ? 'rgba(118,185,0,0.25)' : 'rgba(255,255,255,0.06)'), color: actTool === i ? '#76b900' : '#9aaaba' }}>{t.name}</span>
                ))}
              </div>
              {actTool !== null && profile.ai_stack[actTool] && (
                <div className="mt-2.5 px-3.5 py-2 rounded-lg bg-[#76b900]/[0.06] border border-[#76b900]/[0.12] text-xs text-[#9aaa8a] animate-[fadeUp_0.2s_ease]">
                  <span className="font-semibold text-[#76b900]">{profile.ai_stack[actTool].name}</span>{' \u2014 '}{profile.ai_stack[actTool].note}
                </div>
              )}
            </div>
          )}

          {/* Philosophy */}
          {profile.philosophy.length > 0 && (
            <div className={gl + ' p-5 mb-3'}>
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#76b900] mb-3">{"\uD83D\uDCA1 AI Philosophy"}</h2>
              <div className="flex flex-col gap-2.5">
                {profile.philosophy.map((q, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="w-[3px] min-h-[16px] rounded-sm shrink-0 mt-0.5" style={{ background: 'hsl(' + String(80 + i * 30) + ',70%,45%)' }} />
                    <p className="text-[13px] text-[#b0bcc8] italic leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single CTA: Exchange Contact */}
          <button onClick={() => setView('exchange')} className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mb-2 transition-all" style={{ background: 'linear-gradient(135deg,' + mainColor + ',' + mainColor + 'cc)', boxShadow: '0 3px 14px ' + mainColor + '33' }}>
            {UI.ex} {'Exchange Contact with ' + firstName}
          </button>
        </>}

        {view === 'exchange' && (
          <button onClick={() => setView('card')} className="w-full py-3 rounded-xl text-sm font-medium text-[#8a9aaa] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center gap-1.5 mb-2">
            {UI.bk} Back to card
          </button>
        )}

        <div className="flex items-center justify-center gap-3 mt-4">
          <a href="/create" className="text-[10px] text-[#445] no-underline">Create your own card {"\u2192"} <span className="font-semibold text-[#76b900]">CardOS</span></a>
          <span className="text-[10px] text-[#223]">{"\u00B7"}</span>
          {isOwner ? (
            <a href={'/edit/' + profile.slug} className="text-[10px] text-[#ff4757] font-semibold no-underline">Edit card</a>
          ) : (
            <button onClick={() => setShowManage(true)} className="text-[10px] text-[#445] font-medium bg-transparent border-none cursor-pointer p-0">Is this yours?</button>
          )}
        </div>

        {/* PIN verification modal */}
        {showManage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-6" onClick={() => { setShowManage(false); setManageErr(''); setManageToken(''); }}>
            <div className="w-full max-w-xs bg-[#0d1520] border border-white/10 rounded-2xl p-5" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-[#f0f4f8] mb-1">Verify ownership</h3>
              <p className="text-[10px] text-[#667] mb-3">Enter the 4-digit PIN you set when creating this card</p>
              <input type="tel" maxLength={4} placeholder="PIN" value={manageToken} onChange={e => setManageToken(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-3.5 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-lg font-bold text-[#d0d8e4] placeholder-[#445] focus:border-[#ff4757]/30 outline-none text-center tracking-[0.5em] mb-2" />
              {manageErr && <p className="text-[10px] text-[#ff4757] mb-2">{manageErr}</p>}
              <button onClick={async () => {
                const supabase = (await import('@/lib/supabase-browser')).createClient();
                const { data: p } = await supabase.from('profiles').select('edit_token, pin').eq('slug', profile.slug).single();
                if (p && p.pin === manageToken) {
                  localStorage.setItem('cardos_edit_' + profile.slug, p.edit_token);
                  setIsOwner(true);
                  setShowManage(false);
                  setManageErr('');
                } else {
                  setManageErr('Wrong PIN');
                }
              }} disabled={manageToken.length !== 4} className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all" style={{ background: manageToken.length === 4 ? 'linear-gradient(135deg,#ff4757,#e8364a)' : 'rgba(255,255,255,0.04)', color: manageToken.length === 4 ? '#fff' : '#445' }}>Verify</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
