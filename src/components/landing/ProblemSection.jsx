import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import useInView from "../../hooks/useInView";

const BEFORE = [
  "Chasing clients for payment over WhatsApp — for weeks",
  "No idea if your business is actually making money",
  "Tax time = panic, missing receipts, guesswork",
  "Spreadsheets that are always wrong or out of date",
];

const AFTER = [
  "Clients pay via payment link in seconds — Paystack & Flutterwave built in",
  "Real-time P&L dashboard — see your profit the moment it's made",
  "VAT auto-calculated. One-click reports, any time",
  "Books that update themselves. Always correct",
];

export default function ProblemSection() {
  const [ref, inView] = useInView();
  return (
    <section className="py-24 bg-[#0a0a0f]">
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/6 border border-white/10 text-slate-300 text-xs font-semibold rounded-full mb-6">
            Sound familiar?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            You built the business.<br />Why don't you know if it's profitable?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Most African founders manage money on WhatsApp notes and gut feeling. There's a better way.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Before */}
          <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-6 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-32px)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">❌</span>
              <span className="text-sm font-bold text-rose-400 uppercase tracking-widest">Before LumiLedger</span>
            </div>
            <ul className="space-y-3">
              {BEFORE.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border border-rose-500/40 bg-rose-500/10 flex items-center justify-center text-[10px] text-rose-400">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 transition-all duration-500 delay-150"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(32px)", transitionDelay: "150ms" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">✅</span>
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">With LumiLedger</span>
            </div>
            <ul className="space-y-3">
              {AFTER.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/register"
            onClick={() => window.fbq && window.fbq('track', 'Lead', { content_name: 'problem_cta' })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 text-white text-base font-bold rounded-xl hover:from-blue-400 hover:via-indigo-400 hover:to-violet-500 transition-all shadow-xl shadow-indigo-500/50 hover:shadow-indigo-500/70 hover:scale-[1.02]"
          >
            Yes, show me my numbers — Free <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-600">No credit card · 30-day free trial · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}
