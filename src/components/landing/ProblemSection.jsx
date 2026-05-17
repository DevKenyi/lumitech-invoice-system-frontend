import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import useInView from "../../hooks/useInView";

const BEFORE = [
  "Spreadsheets that never add up",
  "Chasing clients for payment over WhatsApp",
  "No idea if you're actually profitable",
  "Tax season = panic and guesswork",
  "Not knowing how much your business owes you",
  "Manually entering everything twice",
];

const AFTER = [
  "Books that update themselves automatically",
  "Clients pay via payment links in seconds",
  "Real-time P&L and cash flow dashboard",
  "VAT calculated, reports one click away",
  "Capital tracker shows exactly what you're owed",
  "One platform — invoices, payroll, expenses",
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
            Stop running your business in the dark
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Most African founders manage money on WhatsApp notes and gut feeling. LumiLedger fixes that.
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
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition shadow-lg shadow-white/10"
          >
            Get started free <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
