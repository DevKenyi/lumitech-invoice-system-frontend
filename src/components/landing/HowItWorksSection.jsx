import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    emoji: "⚡",
    title: "Send your first invoice in 60 seconds",
    desc: "Add your client, type what you sold, hit send. They get a professional invoice by email instantly — with your logo, your amount, and a payment button.",
    detail: "No training. No setup calls. You'll be sending your first invoice before this page finishes loading.",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
    num_color: "text-blue-600",
    connector: "bg-gradient-to-r from-blue-200 to-indigo-200",
  },
  {
    number: "02",
    emoji: "💳",
    title: "Your client pays — you get notified instantly",
    desc: "They click the link. Pay by card, bank transfer, or mobile money — whichever works for them. The moment money moves, you get a notification.",
    detail: "Paystack and Flutterwave built in. No chasing. No 'I'll pay you later'. Just a paid invoice.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    num_color: "text-emerald-600",
    connector: "bg-gradient-to-r from-indigo-200 to-violet-200",
  },
  {
    number: "03",
    emoji: "📊",
    title: "Your books update themselves",
    desc: "Every payment automatically hits your P&L, cash flow, and capital recovery tracker. You open your dashboard and the numbers are already there.",
    detail: "No data entry. No spreadsheets. No accountant needed for day-to-day tracking. Just clarity.",
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
    num_color: "text-violet-600",
    connector: null,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 mb-5">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            From zero to paid in three steps
          </h2>
          <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
            If you can send a WhatsApp message, you can use LumiLedger. No accountant required.
          </p>
        </div>

        {/* Desktop: horizontal with connectors */}
        <div className="hidden md:grid md:grid-cols-3 gap-0 relative mb-14">
          {/* Connector lines */}
          <div className="absolute top-10 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 z-0" />

          {STEPS.map((s) => (
            <div key={s.number} className="relative flex flex-col items-center text-center px-6 z-10">
              {/* Step number bubble */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-xl mb-5`}>
                <span className="text-3xl">{s.emoji}</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${s.num_color} mb-2`}>Step {s.number}</span>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3 leading-snug">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">{s.desc}</p>
              <p className={`text-xs ${s.num_color} font-medium leading-relaxed bg-white border ${s.border} rounded-xl px-3 py-2`}>{s.detail}</p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical stacked */}
        <div className="md:hidden space-y-6 mb-14">
          {STEPS.map((s, i) => (
            <div key={s.number} className="relative">
              <div className={`${s.bg} border ${s.border} rounded-2xl p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-2xl">{s.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-bold uppercase tracking-widest ${s.num_color}`}>Step {s.number}</span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1 mb-2 leading-snug">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                <p className={`mt-4 text-xs ${s.num_color} font-medium leading-relaxed bg-white border ${s.border} rounded-xl px-3 py-2`}>{s.detail}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-slate-200 to-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-[1.02] transition-all text-base"
          >
            Try It Free — 30 Days <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-400">No credit card. No setup fee. Ready in under 2 minutes.</p>
        </div>

      </div>
    </section>
  );
}
