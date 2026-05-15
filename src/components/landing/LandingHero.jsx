import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, CheckCircle, TrendingUp, ArrowRight,
  Star,
} from "lucide-react";

function MockDashboard() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Window chrome */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-slate-400 font-medium">LumiLedger — Dashboard</span>
        </div>
        {/* Summary strip */}
        <div className="mx-4 mt-4 mb-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Your Business Overview</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Invoiced",      value: "₵85,000",  color: "text-blue-700" },
              { label: "Collected",     value: "₵52,000",  color: "text-emerald-700" },
              { label: "Outstanding",   value: "₵33,000",  color: "text-rose-700" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Invoice rows */}
        <div className="divide-y divide-slate-50">
          {[
            { label: "Mensah & Co — Branding",    amount: "₵28,000", status: "Paid",    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Accra Tech Hub — Design",   amount: "₵18,500", status: "Partial", color: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "Kofi Ventures — Audit",     amount: "₵14,000", status: "Unpaid",  color: "text-rose-600 bg-rose-50 border-rose-200" },
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
        {/* Footer bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-bold">+31% vs last month</span>
          </div>
          <span className="text-xs text-slate-400">May 2026</span>
        </div>
      </div>

      {/* Floating badge — payment received */}
      <div className="absolute -right-4 sm:-right-8 top-6 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-10 min-w-[150px]">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-[10px] text-slate-500 font-medium">Payment received</p>
        </div>
        <p className="text-base font-extrabold text-slate-900">₵28,000 ✓</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-400">Just now · Paystack</span>
        </div>
      </div>

      {/* Floating badge — VAT ready */}
      <div className="absolute -left-4 sm:-left-8 bottom-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl p-3 z-10 min-w-[140px]">
        <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wide mb-1">VAT Report</p>
        <p className="text-sm text-white font-extrabold">GRA-ready ✓</p>
        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />)}
        </div>
      </div>
    </div>
  );
}

function HeroCapitalWidget() {
  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      <div className="absolute -inset-6 bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-violet-400/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Window chrome */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-slate-400 font-medium">LumiLedger — Capital Tracker</span>
        </div>
        {/* Stats */}
        <div className="p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Your business owes you</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "You Put In",  value: "₦850,000", color: "text-blue-700",    bg: "bg-blue-50 border-blue-100" },
              { label: "Recovered",   value: "₦520,000", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
              { label: "Still Owed",  value: "₦330,000", color: "text-rose-600",    bg: "bg-rose-50 border-rose-100" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
                <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Capital recovery</span>
              <span className="font-bold text-blue-600">61% recovered</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: "61%" }} />
            </div>
          </div>
          {/* Recent entries */}
          <div className="space-y-2">
            {[
              { note: "Initial capital injection", date: "Jan 10, 2026", amount: "₦500,000" },
              { note: "Equipment purchase",        date: "Mar 5, 2026",  amount: "₦350,000" },
            ].map(p => (
              <div key={p.date} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{p.note}</p>
                  <p className="text-xs text-slate-400">{p.date}</p>
                </div>
                <span className="text-xs font-bold text-blue-600">{p.amount}</span>
              </div>
            ))}
          </div>
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
            {/* Countries flag strip */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 mb-5">
              <span className="text-xs text-slate-400 font-medium mr-1">Built for</span>
              {[
                { flag: "🇳🇬", name: "Nigeria" },
                { flag: "🇬🇭", name: "Ghana" },
                { flag: "🇿🇦", name: "South Africa" },
              ].map(c => (
                <span key={c.name} title={c.name}
                  className="text-lg leading-none hover:scale-125 transition-transform cursor-default select-none">{c.flag}</span>
              ))}
              <span className="ml-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Nigeria · Ghana · South Africa</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5 sm:mb-6">
              Does your business{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                owe you money?
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              You started this business with your own money. Most founders never know if they've actually paid themselves back. LumiLedger shows you exactly where you stand — in real time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:scale-[1.02] transition-all text-base">
                Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm text-base">
                See How It Works
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />No credit card required</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Set up in under 2 minutes</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Cancel anytime</div>
            </div>
          </div>
          <div className="hidden lg:block">
            <HeroCapitalWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
