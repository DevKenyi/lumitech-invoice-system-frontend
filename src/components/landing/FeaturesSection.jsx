import { useState } from "react";
import {
  FileText, TrendingUp, UserCog, Receipt, BookOpen, Globe, Sparkles, ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Send an invoice. Get paid. Done.",
    desc: "Create a professional invoice in seconds and send it with a payment link attached. Clients pay by card, bank transfer, or mobile money — you get notified the moment they do.",
  },
  {
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "See if you're actually making money",
    desc: "Your P&L, cash flow, and capital recovery tracker update in real time. Open your dashboard and know exactly where your business stands — no spreadsheet, no guessing.",
  },
  {
    icon: BookOpen,
    color: "from-violet-500 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    title: "Your books are always correct — automatically",
    desc: "Every invoice, payment, and expense posts the right journal entries behind the scenes. Your Balance Sheet and accounts stay balanced without you touching them.",
  },
  {
    icon: UserCog,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    title: "Pay your team without the headache",
    desc: "Run payroll in one click. PAYE, SSNIT (Ghana), and UIF/SDL (South Africa) calculated automatically. Payslips sent, books updated — all in under a minute.",
  },
  {
    icon: Receipt,
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 dark:bg-rose-900/20",
    title: "Never worry about tax season again",
    desc: "VAT calculated on every invoice at the right rate for your country. When tax time comes, your GRA or SARS report is one click away — already filled out.",
  },
  {
    icon: Globe,
    color: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    title: "Invoice anyone, anywhere, in their currency",
    desc: "Send invoices in GHS, NGN, ZAR, USD, EUR and more. Exchange rates tracked per transaction so your books stay accurate no matter where your clients are.",
  },
];

function AiAccountantCard() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    if (email.trim()) setJoined(true);
  };

  return (
    <div className="group relative bg-gradient-to-br from-[#0f0c29] via-[#1a1060] to-[#24243e] rounded-2xl p-6 border border-violet-500/30 shadow-xl shadow-violet-900/40 overflow-hidden">
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/20 blur-2xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-indigo-500/20 blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />
      <div className="relative">
        <div className="relative w-14 h-14 mb-5">
          <span className="absolute inset-0 rounded-2xl bg-violet-500/30 animate-ping" style={{ animationDuration: "2s" }} />
          <span className="absolute inset-0 rounded-2xl bg-violet-500/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.4s" }} />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
            <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
        </div>
        <h3 className="font-extrabold text-white text-base mb-2 flex items-center gap-2">
          AI Accountant ✨
        </h3>
        <p className="text-sm text-violet-300/90 leading-relaxed mb-4">
          Your personal AI that reads your books, flags risks, and gives professional accounting advice — like a CFO on call 24/7.
        </p>
        {joined ? (
          <div className="bg-violet-500/20 border border-violet-400/30 rounded-xl px-4 py-3 text-center">
            <p className="text-violet-200 text-sm font-semibold">🎉 You're on the list!</p>
            <p className="text-violet-400 text-xs mt-0.5">We'll email you the moment it launches.</p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-violet-400/30 rounded-xl text-white text-xs placeholder:text-violet-400/60 focus:outline-none focus:border-violet-400 transition"
            />
            <button
              type="submit"
              className="flex-shrink-0 px-3 py-2 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:scale-[1.05] transition-all"
            >
              <ArrowRight size={14} />
            </button>
          </form>
        )}
        {!joined && <p className="text-[10px] text-violet-500 mt-2">Join the waitlist — be first when it launches.</p>}
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-100 dark:border-blue-800 mb-5">
            Everything included · No add-ons
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need to run your business finances
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
            Stop juggling spreadsheets, WhatsApp receipts, and guesswork. LumiLedger replaces all of it — and your books stay correct automatically.
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

          <AiAccountantCard />
        </div>
      </div>
    </section>
  );
}
