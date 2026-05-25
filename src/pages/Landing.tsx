import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QRCode } from 'react-qr-code';
import { Logo } from '../components/Logo';

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="bg-white min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#FFFFFF', borderBottom: '1px solid #E4E3DF', height: '64px' }}>
        <Logo color="#1C1C1E" size={24} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signin')}
            className="text-sm text-secondary hover:text-primary transition-colors duration-150 px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/signup')}
            className="text-sm font-medium bg-amber text-primary px-5 py-2.5 rounded-lg hover:bg-amber-dark transition-colors duration-150"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-page pb-16 md:pb-24 px-6 md:px-10" style={{ paddingTop: '128px' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif-italic text-primary opacity-0 animate-stagger-1 text-4xl md:text-[56px]" style={{ lineHeight: 1.1 }}>
            Your event. Signed, sealed, delivered.
          </h1>
          <p className="text-secondary text-base md:text-lg mt-4 max-w-[520px] mx-auto opacity-0 animate-stagger-2">
            Generate beautiful branded passes with scannable QR codes. No design skills needed.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 opacity-0 animate-stagger-3">
            <button
              onClick={() => navigate(user ? '/create-event' : '/signup')}
              className="text-sm font-medium bg-amber text-primary px-6 py-3 rounded-lg hover:bg-amber-dark transition-colors duration-150"
            >
              Create Your First Event
            </button>
            <button
              onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-6 py-3 rounded-lg hover:bg-row-hover transition-colors duration-150"
            >
              See How It Works
            </button>
          </div>

          {/* Demo Pass */}
          <div className="mt-12 flex justify-center opacity-0 animate-stagger-4">
            <div className="bg-white overflow-hidden max-w-[560px] w-full" style={{ borderRadius: '12px', border: '1px solid #E4E3DF' }}>
              <div className="flex flex-row">
                <div className="flex flex-col" style={{ width: '60%' }}>
                  <div className="bg-primary px-5 py-[14px]">
                    <p className="font-serif-italic text-white text-left" style={{ fontSize: '17px' }}>Lagos Tech Meetup Vol. 3</p>
                  </div>
                  <div className="px-5 py-5 flex flex-col gap-1">
                    <p className="text-left" style={{ fontSize: '13px', color: '#6B6B6B' }}>May 30, 2026 &middot; 4:00 PM</p>
                    <p className="text-left" style={{ fontSize: '13px', color: '#6B6B6B' }}>The Hive, Victoria Island</p>
                    <p className="text-left mb-4" style={{ fontSize: '12px', color: '#9A9A9A' }}>TechHub Lagos</p>
                    <div className="flex flex-row items-center gap-2">
                      <p className="font-medium text-left" style={{ fontSize: '16px', color: '#1C1C1E' }}>Temi Adeyemi</p>
                      <span className="inline-flex items-center font-medium" style={{ fontSize: '12px', background: '#E8A020', color: '#1C1C1E', padding: '3px 10px', borderRadius: '100px' }}>VIP</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center" style={{ width: '40%', borderLeft: '1px dashed #E4E3DF', padding: '24px' }}>
                  <div style={{ border: '2px solid #E8A020', padding: '4px', borderRadius: '4px' }}>
                    <QRCode value="demo-pass-0001" size={80} level="M" />
                  </div>
                  <p className="text-center mt-2" style={{ fontSize: '11px', color: '#9A9A9A' }}>#0001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-tertiary font-medium text-[11px] tracking-[2px] text-center">PROCESS</p>
          <h2 className="text-primary font-medium text-2xl md:text-3xl text-center mt-2 mb-12">
            Three steps to a professional pass
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[
              { num: '01', title: 'Create your event', desc: 'Add your event details, pick your brand color, and choose a pass template.' },
              { num: '02', title: 'Add your attendees', desc: 'Upload a CSV file or add names one by one. Each attendee gets their own unique pass.' },
              { num: '03', title: 'Generate and share', desc: 'Download passes as PNG or PDF. Email them directly or share via link.' },
            ].map(step => (
              <div key={step.num}>
                <p className="text-tertiary font-medium text-[13px] mb-3">{step.num}</p>
                <h3 className="font-medium text-lg text-primary mb-2">{step.title}</h3>
                <p className="text-secondary text-[15px] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="bg-page py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-tertiary font-medium text-[11px] tracking-[2px] text-center">TEMPLATES</p>
          <h2 className="text-primary font-medium text-2xl md:text-3xl text-center mt-2 mb-12">
            Three templates. One beautiful result.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Boarding Pass', desc: 'Horizontal layout with info on the left and QR on the right, separated by a dashed divider.' },
              { name: 'Minimal Stripe', desc: 'Vertical layout with a bold color stripe header and clean white body. Info stacked with QR at bottom.' },
              { name: 'Bold Banner', desc: 'Vertical layout with top half filled with brand color and event name, bottom half white with QR and info.' },
            ].map((tmpl, i) => (
              <div key={tmpl.name} className="bg-white border border-border rounded-xl p-6 hover:border-primary transition-colors duration-150 flex flex-col">
                <p className="font-medium text-sm text-primary">{tmpl.name}</p>
                <p className="text-[13px] text-secondary mt-1 mb-4">{tmpl.desc}</p>
                <div className="mt-auto"><TemplatePreview index={i} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-nav py-16 md:py-20 px-6 md:px-10 text-center">
        <h2 className="font-serif-italic text-white text-3xl md:text-4xl mb-6">
          Ready to make your event feel real?
        </h2>
        <button
          onClick={() => navigate(user ? '/create-event' : '/signup')}
          className="text-sm font-medium text-white border-[1.5px] border-white px-8 py-3 rounded-lg hover:bg-white/10 transition-colors duration-150"
        >
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-nav border-t border-nav-hover px-6 md:px-10 py-6 flex items-center justify-between">
        <Logo color="#FFFFFF" size={20} showText />
        <p className="text-secondary text-[13px]">Built for organisers who care.</p>
      </footer>
    </div>
  );
}

function TemplatePreview({ index }: { index: number }) {
  const color = '#1C1C1E';
  if (index === 0) {
    return (
      <div className="bg-white border border-border rounded-lg overflow-hidden w-full" style={{ height: '56px' }}>
        <div className="flex h-full">
          <div className="flex-1">
            <div className="px-2 py-1" style={{ backgroundColor: color, height: '18px' }}><div className="bg-white/30 h-1.5 w-12 rounded-sm" /></div>
            <div className="px-2 py-1 space-y-0.5"><div className="bg-page h-1 w-10 rounded-sm" /><div className="bg-page h-1 w-8 rounded-sm" /></div>
          </div>
          <div className="flex items-center justify-center px-2 border-l border-dashed border-border"><div className="bg-page w-6 h-6 rounded-sm" /></div>
        </div>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="bg-white border border-border rounded-lg overflow-hidden w-full" style={{ height: '56px' }}>
        <div style={{ backgroundColor: color, height: '6px' }} />
        <div className="px-2 py-1 space-y-0.5"><div className="bg-page h-1.5 w-14 rounded-sm" /><div className="bg-page h-1 w-10 rounded-sm" /></div>
        <div className="flex justify-center mt-1"><div className="bg-page w-5 h-5 rounded-sm" /></div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden w-full" style={{ height: '56px' }}>
      <div className="px-2 py-2" style={{ backgroundColor: color, height: '30px' }}><div className="bg-white/30 h-1.5 w-12 rounded-sm" /></div>
      <div className="px-2 py-1 flex items-center gap-1"><div className="bg-page h-1 w-8 rounded-sm" /><div className="flex justify-center flex-1"><div className="bg-page h-4 w-4 rounded-sm" /></div></div>
    </div>
  );
}
