import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, PiggyBank } from "lucide-react";

function CapitalCard() {
  return (
    <div className="relative bg-white/5 rounded-2xl shadow-xl border border-white/10 overflow-hidden max-w-sm w-full">
      <div className="px-5 py-4 border-b border-white/8 bg-white/4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Owner Capital Tracker</p>
          <p className="text-xs text-slate-500 mt-0.5">Money you've put into this business</p>
        </div>
        <div className="p-2 bg-blue-600 rounded-lg">
          <PiggyBank className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "You Put In",  value: "₦850,000", color: "text-blue-400" },
            { label: "Recovered",   value: "₦520,000", color: "text-emerald-400" },
            { label: "Still Owed",  value: "₦330,000", color: "text-rose-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/8">
              <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Capital recovery progress</span>
            <span className="font-bold text-blue-400">61% recovered</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "61%" }} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Capital history</p>
          {[
            { date: "Jan 10, 2026", amount: "₦500,000", note: "Initial capital injection" },
            { date: "Mar 5, 2026",  amount: "₦350,000", note: "Equipment purchase" },
          ].map(p => (
            <div key={p.date} className="flex items-center justify-between bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
              <div>
                <p className="text-xs font-semibold text-slate-200">{p.note}</p>
                <p className="text-xs text-slate-500">{p.date}</p>
              </div>
              <span className="text-xs font-bold text-blue-400">{p.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CapitalSection() {
  return (
    <section className="py-24 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5">
              Finally know{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                what your business owes you
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              You've put money into your business — maybe a lot of it. LumiLedger lets you track every amount you've put in and watch how much comes back as revenue grows. No guesswork. No spreadsheets. Just one clear number.
            </p>
            <div className="space-y-4 mb-8">
              {[
                "Record every amount you put in — any time, any size",
                "See your recovery grow as money comes in from clients",
                "One clear number: what your business still owes you today",
              ].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0"><CheckCircle className="w-4 h-4 text-emerald-400" /></div>
                  <p className="text-slate-300 text-sm leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg shadow-white/10 hover:bg-slate-100 transition-all w-full sm:w-auto">
              Start Tracking Today <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-6 lg:mt-0 flex justify-center">
            <CapitalCard />
          </div>
        </div>
      </div>
    </section>
  );
}
