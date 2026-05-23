import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const MARQUEE_ROW_1 = [
  { id: "INV-2026-0042", client: "Araba Mensah & Co",     amount: "₵12,400",    status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0007", client: "Chinonso Foods Ltd",    amount: "₦485,000",   status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0091", client: "Cape Town Creatives",   amount: "R32,500",    status: "Sent",    color: "text-blue-400" },
  { id: "INV-2026-0018", client: "Accra Digital Hub",     amount: "₵8,750",     status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0033", client: "Lagos Style House",     amount: "₦1,200,000", status: "Overdue", color: "text-rose-400" },
  { id: "INV-2026-0055", client: "Pretoria Services",     amount: "R18,200",    status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0063", client: "Kumasi Crafts Ltd",     amount: "₵6,200",     status: "Paid",    color: "text-emerald-400" },
];

const MARQUEE_ROW_2 = [
  { id: "INV-2026-0024", client: "Abuja Tech Solutions",  amount: "₦750,000",   status: "Sent",    color: "text-blue-400" },
  { id: "INV-2026-0079", client: "Durban Maritime Co",    amount: "R45,000",    status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0038", client: "Tema Logistics",        amount: "₵22,100",    status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0049", client: "Port Harcourt Oil",     amount: "₦2,800,000", status: "Overdue", color: "text-rose-400" },
  { id: "INV-2026-0086", client: "Sandton Consulting",    amount: "R92,000",    status: "Paid",    color: "text-emerald-400" },
  { id: "INV-2026-0014", client: "Takoradi Ship Co",      amount: "₵31,500",    status: "Sent",    color: "text-blue-400" },
  { id: "INV-2026-0071", client: "Enugu Power Supply",    amount: "₦320,000",   status: "Paid",    color: "text-emerald-400" },
];

function InvoiceCard({ id, client, amount, status, color }) {
  return (
    <div className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-xl p-4 mx-3 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-default">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-slate-500">{id}</span>
        <span className={`text-[10px] font-bold ${color}`}>{status}</span>
      </div>
      <p className="text-xs font-semibold text-white truncate mb-1">{client}</p>
      <p className="text-base font-extrabold text-white">{amount}</p>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0f] pt-16 pb-0">
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-20 -left-32 w-72 h-72 bg-indigo-600/15 rounded-full blur-[90px]" />
      <div className="pointer-events-none absolute top-32 -right-32 w-72 h-72 bg-violet-600/15 rounded-full blur-[90px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Social proof pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/12 rounded-full text-xs text-slate-300 font-medium mb-8">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          100+ businesses across Africa trust LumiLedger
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold text-white leading-[1.08] tracking-tight mb-6">
          Stop chasing clients.{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Start getting paid.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto">
          Send professional invoices in 60 seconds, collect payment instantly, and finally know
          if your business is actually profitable — built for Nigeria, Ghana &amp; South Africa.
        </p>

        {/* Feature bullets */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm text-slate-300">
          <span>🌍 NGN · GHS · ZAR · USD</span>
          <span className="text-white/20">·</span>
          <span>💱 Auto VAT &amp; tax reports</span>
          <span className="text-white/20">·</span>
          <span>⚡ Invoice out in 60 seconds</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <div className="relative group">
            {/* Pulse ring behind button */}
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-60 blur-md scale-105 group-hover:opacity-80 group-hover:scale-110 transition-all duration-300 animate-pulse" />
            <Link
              to="/register"
              className="relative inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl hover:from-blue-400 hover:via-indigo-400 hover:to-violet-500 transition-all shadow-xl shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-[1.03]"
            >
              Get Paid Faster — Start Free <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/8 border border-white/12 text-white text-sm font-semibold rounded-xl hover:bg-white/12 transition"
          >
            See how it works
          </a>
        </div>

        <p className="text-xs text-slate-600 mb-16">No credit card required · Set up in under 2 minutes · Cancel anytime</p>
      </div>

      {/* Marquee rows */}
      <style>{`
        @keyframes marquee-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .marquee-left  { animation: marquee-left  60s linear infinite; }
        .marquee-right { animation: marquee-right 54s linear infinite; }
        .marquee-wrap:hover .marquee-left,
        .marquee-wrap:hover .marquee-right { animation-play-state: paused; }
      `}</style>

      <div className="relative marquee-wrap">
        {/* Left/right fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-[#0a0a0f] to-transparent" />

        {/* Row 1 — scrolls left */}
        <div className="flex overflow-hidden mb-3">
          <div className="marquee-left flex">
            {[...MARQUEE_ROW_1, ...MARQUEE_ROW_1].map((c, i) => (
              <InvoiceCard key={i} {...c} />
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="flex overflow-hidden mb-0">
          <div className="marquee-right flex">
            {[...MARQUEE_ROW_2, ...MARQUEE_ROW_2].map((c, i) => (
              <InvoiceCard key={i} {...c} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="h-24 bg-gradient-to-b from-transparent to-[#0a0a0f]" />
    </section>
  );
}
