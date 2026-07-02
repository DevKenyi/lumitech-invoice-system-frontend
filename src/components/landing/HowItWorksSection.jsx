import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck, ArrowRightLeft, FileInput } from "lucide-react";
import useInView from "../../hooks/useInView";

const STEPS = [
  {
    number: "01",
    emoji: "⚡",
    title: "Send your first invoice in 60 seconds",
    desc: "Add your client, type what you sold, hit send. They get a professional invoice by email instantly — with your logo, your amount, and a payment button.",
    detail: "No training. No setup calls. You'll be sending your first invoice before this page finishes loading.",
    accent: "from-blue-500 to-indigo-500",
    badge: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  {
    number: "02",
    emoji: "💳",
    title: "Your client pays — you get notified instantly",
    desc: "They click the link. Pay by card, bank transfer, or mobile money — whichever works for them. The moment money moves, you get a notification.",
    detail: "Paystack and Flutterwave built in. No chasing. No 'I'll pay you later'. Just a paid invoice.",
    accent: "from-emerald-500 to-teal-500",
    badge: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    number: "03",
    emoji: "📊",
    title: "Your books update themselves",
    desc: "Every payment automatically hits your P&L, cash flow, and capital recovery tracker. You open your dashboard and the numbers are already there.",
    detail: "No data entry. No spreadsheets. No accountant needed for day-to-day tracking. Just clarity.",
    accent: "from-violet-500 to-purple-500",
    badge: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  },
];

export default function HowItWorksSection() {
  const [ref, inView] = useInView();
  return (
    <section id="how-it-works" className="py-24 bg-[#0a0a0f]">
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/6 border border-white/10 text-slate-300 text-xs font-semibold rounded-full mb-5">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            From zero to paid in three steps
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
            If you can send a WhatsApp message, you can use LumiLedger.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {STEPS.map((s, i) => (
            <div key={s.number}
              className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 transition-all duration-500"
              style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)", transitionDelay: `${i * 120}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.accent} flex items-center justify-center mb-5 shadow-lg`}>
                <span className="text-2xl">{s.emoji}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 ${s.badge} mb-3 inline-block`}>
                Step {s.number}
              </span>
              <h3 className="font-extrabold text-white text-base mb-3 leading-snug">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">{s.desc}</p>
              <p className={`text-xs leading-relaxed border rounded-xl px-3 py-2 ${s.badge}`}>{s.detail}</p>
            </div>
          ))}
        </div>

        {/* ── We never hold your money ─────────────────────────────────────── */}
        <div className="mb-10 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-0.5">We never touch your money</h3>
              <p className="text-xs text-emerald-400/80 font-medium">100% of every payment goes directly to your account</p>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-slate-300">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Payments flow <strong className="text-white">directly from your customer to your bank account</strong> — via Paystack or Flutterwave. LumiLedger never pools, holds, or has custody of any funds.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Paystack and Flutterwave are <strong className="text-white">fully licensed, regulated payment processors</strong>. LumiLedger is software that sits on top — we don't need a banking licence because we don't move money.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>LumiLedger only <strong className="text-white">records and organises</strong> what happened. Think of us as your bookkeeper, not your bank.</span>
            </li>
          </ul>
        </div>

        {/* ── Migration reassurance ─────────────────────────────────────────── */}
        <div className="mb-14 flex items-start gap-4 bg-white/4 border border-white/8 rounded-2xl px-6 py-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
            <FileInput className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Already on Excel, notebooks, or WhatsApp? Bring everything with you.</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              You don't start from zero. Our team helps you import your existing records — clients, invoices, outstanding balances — so your history moves with you. No data lost, no clean-slate panic.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition shadow-lg shadow-white/10 text-base"
          >
            Try It Free — 14 Days <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-600">No credit card. No setup fee. Ready in under 2 minutes.</p>
        </div>
      </div>
    </section>
  );
}
