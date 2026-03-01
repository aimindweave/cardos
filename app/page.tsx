import Link from 'next/link';

const features = [
  { emoji: '⚡', title: '60 seconds to create', desc: 'Fill in your info, pick your sections, get a unique link. No app download needed.' },
  { emoji: '🤝', title: 'Two-way exchange', desc: 'Visitors save your contact AND leave theirs. Import via vCard or quick form.' },
  { emoji: '📊', title: 'Track everything', desc: 'See who exchanged info, follow up from your dashboard. Export to CSV.' },
  { emoji: '🔨', title: 'Show what you build', desc: 'Showcase your companies, AI projects, tool stack, and philosophy.' },
  { emoji: '📱', title: 'Mobile-first', desc: 'Designed for conference hallways. Opens instantly in any browser.' },
  { emoji: '🎨', title: 'AI-native design', desc: 'Neural network background, dark theme, tech-forward aesthetics.' },
];

const steps = [
  { n: '1', title: 'Create your card', desc: 'Fill in your name, title, social links, AI projects, and philosophy.' },
  { n: '2', title: 'Get your link', desc: 'Your card lives at cardos.ai/yourname. Open it on your phone.' },
  { n: '3', title: 'Share at events', desc: 'Show your QR code. They scan, see your profile, save or exchange contacts.' },
  { n: '4', title: 'Follow up smarter', desc: 'See all your contacts, add notes, and export to CSV from your card\u2019s edit page.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#060b14] text-[#d0d8e4]">

      {/* Nav */}
      <nav className="flex justify-between items-center max-w-5xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff4757] to-[#ff6b81] flex items-center justify-center">
            <span className="text-xs font-extrabold text-white">C</span>
          </div>
          <span className="text-base font-bold text-[#f0f4f8]">CardOS</span>
        </div>
        <Link href="/create" className="px-5 py-2 rounded-xl text-sm font-semibold text-[#d0d8e4] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          Create Card
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-[#76b900]/10 border border-[#76b900]/20 rounded-full px-3.5 py-1 text-xs font-semibold text-[#76b900] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-[blink_2s_infinite]" />
            Launching at GTC 2026
          </div>
          <h1 className="text-[clamp(32px,5vw,48px)] font-extrabold leading-[1.1] tracking-tight text-[#f0f4f8] mb-5">
            Your digital card
            <br />
            <span className="bg-gradient-to-r from-[#ff4757] to-[#ff6b81] bg-clip-text text-transparent">for tech events</span>
          </h1>
          <p className="text-lg text-[#7a8a9a] leading-relaxed mb-8 max-w-md">
            Create an AI-native business card in 60 seconds. Share via QR code at any conference. Collect contacts, track exchanges, follow up smarter.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/create" className="px-8 py-3.5 rounded-2xl text-white font-bold bg-gradient-to-br from-[#ff4757] to-[#e8364a] shadow-lg shadow-[#ff4757]/20 hover:shadow-[#ff4757]/30 hover:-translate-y-0.5 transition-all">
              Create Your Card — Free
            </Link>
            <a href="#how" className="flex items-center gap-1.5 px-5 py-3.5 text-[#8a9aaa] font-medium hover:text-[#d0d8e4] transition-colors">
              See how it works ↓
            </a>
          </div>
          <div className="flex gap-10 mt-10">
            {[['60s', 'to create'], ['0', 'downloads'], ['∞', 'exchanges']].map(([n, l]) => (
              <div key={l} className="text-center">
                <p className="text-xl font-extrabold text-[#f0f4f8]">{n}</p>
                <p className="text-xs text-[#5a6a7a] mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-extrabold text-[#f0f4f8] text-center mb-3 tracking-tight">Why CardOS?</h2>
        <p className="text-sm text-[#6a7a8a] text-center max-w-sm mx-auto mb-10">Built for people who build with AI.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="text-base font-bold text-[#f0f4f8] mt-3 mb-2">{f.title}</h3>
              <p className="text-sm text-[#7a8a9a] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div id="how" className="max-w-lg mx-auto px-6 pb-20">
        <h2 className="text-2xl font-extrabold text-[#f0f4f8] text-center mb-10 tracking-tight">How it works</h2>
        <div className="flex flex-col gap-7">
          {steps.map(s => (
            <div key={s.n} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff4757] to-[#ff475766] flex items-center justify-center text-sm font-bold text-white shrink-0">{s.n}</div>
              <div>
                <h4 className="text-sm font-bold text-[#f0f4f8] mb-1">{s.title}</h4>
                <p className="text-sm text-[#7a8a9a] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center px-6 pb-24">
        <div className="max-w-md mx-auto bg-[#ff4757]/[0.06] border border-[#ff4757]/[0.15] rounded-3xl p-12">
          <h2 className="text-2xl font-extrabold text-[#f0f4f8] mb-3">Ready for your next event?</h2>
          <p className="text-sm text-[#7a8a9a] mb-7">Free to create. Free to share. Free to use.</p>
          <Link href="/create" className="inline-block px-8 py-3.5 rounded-2xl text-white font-bold bg-gradient-to-br from-[#ff4757] to-[#e8364a] shadow-lg shadow-[#ff4757]/20">
            Create Your Card
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/[0.04]">
        <p className="text-xs text-[#334]">CardOS · AI-native digital business cards</p>
      </footer>
    </div>
  );
}
