import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, CheckCircle, TrendingUp, ArrowRight,
  Star, Briefcase, Download, Receipt, Users,
} from "lucide-react";

const TAX_ROWS = [
  { inv: "INV-003", desc: "Web Design Services",  client: "Apex Ventures",    vat: "₦7,500", wht: "—",      total: "₦107,500" },
  { inv: "INV-002", desc: "Consulting — Q2",      client: "Crestfield Agency", vat: "₦3,000", wht: "₦2,000", total: "₦43,000"  },
  { inv: "INV-004", desc: "Construction Works",   client: "Nova Build Co.",    vat: "—",      wht: "—",      total: "₦50,000"  },
];

function MockDashboard() {
  return (
    <div className="relative w-full max-w-lg mx-auto overflow-hidden">
      <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/10 rounded-3xl blur-3xl" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-slate-400 font-medium">LumiLedger — Dashboard</span>
        </div>
        <div className="mx-4 mt-4 mb-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Your Capital Overview</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "You Put In",        value: "₦850,000", color: "text-blue-700" },
              { label: "You've Got Back",   value: "₦520,000", color: "text-emerald-700" },
              { label: "Business Owes You", value: "₦330,000", color: "text-rose-700" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: "Phoenix Plus — Web Redesign",  amount: "₦550,000", status: "Paid",    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "TechCorp — API Integration",   amount: "₦280,000", status: "Partial", color: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "Nova Agency — Brand Identity", amount: "₦190,000", status: "Unpaid",  color: "text-rose-600 bg-rose-50 border-rose-200" },
          ].map(inv => (
            <div key={inv.label} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs text-slate-700 font-medium truncate">{inv.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold text-slate-900">{inv.amount}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${inv.color}`}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Capital recovery rate</span>
            <span className="text-xs font-bold text-blue-600">61%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "61%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVisual() {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      <div className="absolute -inset-10 bg-gradient-to-br from-blue-400/30 via-violet-400/20 to-rose-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/25" style={{ aspectRatio: "4/5" }}>
          {!imgError ? (
            <img
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=700&q=85&auto=format&fit=crop&crop=faces"
              alt="African business owner delighted by LumiLedger"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 flex items-center justify-center">
              <div className="text-center text-white/80 px-8">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-10 h-10 text-white" />
                </div>
                <p className="text-lg font-bold">Your finances,<br />finally clear.</p>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-900/50 to-transparent" />
        </div>
        <div className="absolute -right-4 sm:-right-8 top-8 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 z-10 min-w-[155px]">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">This month</p>
          <p className="text-xl font-extrabold text-slate-900">₦840,000</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="text-[10px] text-emerald-600 font-bold">+23% vs last month</span>
          </div>
        </div>
        <div className="absolute -left-4 sm:-left-8 bottom-20 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 z-10 max-w-[195px]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Expense claim approved</p>
              <p className="text-sm font-extrabold text-slate-900">₦125,000 ✓</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] text-slate-500">Just now · January 2026</span>
          </div>
        </div>
        <div className="absolute -right-2 sm:-right-6 bottom-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-3.5 z-10">
          <div className="flex items-center gap-0.5 mb-1">
            {Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-3 h-3 text-amber-300 fill-amber-300" />)}
          </div>
          <p className="text-[10px] text-blue-200 font-medium">100+ businesses</p>
          <p className="text-xs text-white font-extrabold">trust LumiLedger</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 mb-4">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              30-Day Free Trial · No credit card required
            </div>
            {/* Countries flag strip */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-6">
              <span className="text-xs text-slate-400 font-medium mr-1">Live in</span>
              {[
                { flag: "🇬🇭", name: "Ghana" },
                { flag: "🇿🇦", name: "South Africa" },
              ].map(c => (
                <span key={c.name} title={c.name}
                  className="text-lg leading-none hover:scale-125 transition-transform cursor-default select-none">{c.flag}</span>
              ))}
              <span className="ml-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Ghana &amp; South Africa</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5 sm:mb-6">
              Know exactly{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                what your business owes you
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Track invoices, expenses, and the money you've put into your business — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-5 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-[1.02] transition-all text-base">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm text-base">
                See How It Works
              </a>
            </div>
            <p className="text-slate-400 text-sm text-center lg:text-left mb-5">
              See what your business owes you in under 2 minutes
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />No credit card required</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Set up in under 2 minutes</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Cancel anytime</div>
            </div>
          </div>
          <div className="hidden lg:block">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
