import {
  FileText, TrendingUp, UserCog, Receipt, BookOpen, Globe, Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Invoice & get paid online",
    desc: "Create professional invoices in seconds. Clients pay via Paystack, Flutterwave, bank transfer, or cash. Payment links sent automatically.",
  },
  {
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Know your numbers instantly",
    desc: "P&L, Balance Sheet, Cash Flow, and Aging Report — all updated in real time as you invoice and record payments. No spreadsheets.",
  },
  {
    icon: BookOpen,
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    title: "Full double-entry accounting",
    desc: "Every invoice and payment automatically posts journal entries. Chart of accounts, reconciliation, and opening balances included.",
  },
  {
    icon: UserCog,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    title: "Payroll & PAYE in one click",
    desc: "Run monthly payroll for your team. PAYE, SSNIT (Ghana) and UIF/SDL (South Africa) calculated automatically. Journal entries posted on approval.",
  },
  {
    icon: Receipt,
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    title: "VAT compliance built in",
    desc: "VAT calculated on every invoice at the correct rate for your country. One-click export ready for GRA (Ghana) or SARS (South Africa).",
  },
  {
    icon: Globe,
    color: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    title: "Multi-currency invoicing",
    desc: "Invoice in GHS, ZAR, USD, EUR and more. Exchange rates tracked per transaction. Your books stay accurate automatically.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-100 dark:border-blue-800 mb-5">
            Everything included · No add-ons
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            One platform. Everything you need.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
            Stop juggling spreadsheets, WhatsApp receipts, and separate payroll tools. LumiLedger puts your entire business in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}

          {/* AI Accountant — Coming Soon */}
          <div className="group relative bg-gradient-to-br from-violet-950 to-indigo-950 rounded-2xl p-6 border border-violet-700/40 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/5 pointer-events-none" />
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full uppercase tracking-wide">
                ✦ Coming Soon
              </span>
            </div>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white text-base mb-2 leading-snug">AI Accountant</h3>
              <p className="text-sm text-violet-300 leading-relaxed">
                Your personal AI that reads your books, summarises your finances, flags risks, and gives you professional accounting advice — like having a CFO on call 24/7.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
