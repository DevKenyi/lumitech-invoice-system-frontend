import { Link } from "react-router-dom";
import {
  CheckCircle, ArrowRight, BookOpen, Globe, Shield, Clock,
  Layers, Users, BarChart2, FileText, Zap, ChevronRight,
} from "lucide-react";
import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";
import useCountry, { COUNTRY_CONFIG } from "../hooks/useCountry";

const FEATURES = [
  {
    icon: BookOpen,
    color: "from-violet-500 to-purple-600",
    title: "Full double-entry accounting",
    desc: "Journal entries, chart of accounts, opening balances, reconciliation — all standard. Nothing missing.",
  },
  {
    icon: BarChart2,
    color: "from-blue-500 to-indigo-600",
    title: "Trial balance, P&L, Balance Sheet",
    desc: "One click. Real-time. Export to Excel or PDF for your client files.",
  },
  {
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    title: "Multi-business management",
    desc: "Switch between client dashboards instantly. No separate logins. One master account.",
  },
  {
    icon: Shield,
    color: "from-amber-500 to-orange-500",
    title: "Audit trail (full activity log)",
    desc: "See who changed what and when. Essential for client trust and compliance sign-off.",
  },
  {
    icon: FileText,
    color: "from-rose-500 to-pink-500",
    title: "VAT & WHT tracking (FIRS/GRA/SARS)",
    desc: "Correct rates applied automatically per country. One-click export ready for tax filing.",
  },
  {
    icon: Zap,
    color: "from-sky-500 to-cyan-500",
    title: "Payroll & statutory deductions",
    desc: "PAYE, SSNIT (Ghana), UIF/SDL (South Africa), NHF, Pension — calculated and journalised on approval.",
  },
  {
    icon: Globe,
    color: "from-indigo-500 to-blue-600",
    title: "Multi-currency (13 currencies)",
    desc: "Invoice in USD, EUR, GBP, GHS, ZAR, NGN, and more. Exchange rates tracked per transaction.",
  },
  {
    icon: Layers,
    color: "from-teal-500 to-emerald-600",
    title: "Budget vs Actual & Cash Flow Forecast",
    desc: "Help clients plan and compare performance. Show liquidity position weeks ahead.",
  },
  {
    icon: CheckCircle,
    color: "from-slate-500 to-slate-700",
    title: "Client access controls & team roles",
    desc: "Let clients view their dashboard. Give junior staff limited access — data entry only.",
  },
];

const COUNTRIES = [
  {
    flag: "🇳🇬",
    name: "Nigeria",
    currency: "₦ Naira",
    vat: "7.5%",
    authority: "FIRS",
    deductions: "PAYE, Pension, NHF",
    color: "border-green-200 bg-green-50",
    badge: "bg-green-100 text-green-700",
  },
  {
    flag: "🇬🇭",
    name: "Ghana",
    currency: "₵ Cedi",
    vat: "15%",
    authority: "GRA",
    deductions: "PAYE, SSNIT",
    color: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    flag: "🇿🇦",
    name: "South Africa",
    currency: "R Rand",
    vat: "15%",
    authority: "SARS",
    deductions: "PAYE, UIF, SDL",
    color: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
  },
];

const TESTIMONIALS = [
  {
    quote: "As an accountant managing 6 businesses, this is the only tool that gives me the full picture — journal entries, balance sheet, and capital tracking all in one place.",
    name: "Chidi N.",
    location: "Abuja, Nigeria",
    initials: "CN",
    color: "from-blue-600 to-indigo-600",
  },
  {
    quote: "I switched three clients from QuickBooks to LumiLedger. The multi-currency and local VAT compliance alone saved me hours per month.",
    name: "Adwoa M.",
    location: "Accra, Ghana",
    initials: "AM",
    color: "from-emerald-500 to-teal-600",
  },
];

const PLAN_FEATURES = {
  essential: ["Invoicing & payments", "Expense tracking", "Financial reports", "Capital tracking", "Up to 50 clients", "Email reminders"],
  business: ["Everything in Essential", "Unlimited clients", "Multi-user access", "Chart of accounts & journal entries", "Bank reconciliation", "Fixed assets & depreciation"],
  accountantPro: [
    "Everything in Business",
    "Payroll & PAYE (all 3 countries)",
    "Multi-currency (13 currencies)",
    "Budget vs Actual & Cash Flow Forecast",
    "Expense reporting & claims",
    "Full audit trail",
    "VAT & WHT tracking (FIRS/GRA/SARS)",
    "Multi-business management",
    "Priority support",
  ],
};

export default function ForAccountants() {
  const { countryCode, config, setCountry } = useCountry();
  const { plans } = config;

  return (
    <div className="min-h-screen bg-white font-sans antialiased" style={{ overflowX: "clip" }}>
      <LandingNav />

      {/* ── HERO ── */}
      <section className="pt-20 pb-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full border border-violet-100 mb-6">
              Built for professional accountants
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Manage multiple businesses.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                One dashboard.
              </span>{" "}
              Full control.
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 max-w-2xl mx-auto">
              You don't just do bookkeeping. You deliver clarity, compliance, and peace of mind.
              LumiLedger gives you journal entries, trial balance, audit trails, and multi-business
              management — without the bloat or international pricing.
            </p>
            <p className="text-sm font-semibold text-slate-700 mb-8">
              Built for Nigerian, Ghanaian, and South African accountants.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:scale-[1.02] transition-all text-sm"
              >
                Start 30-Day Free Trial <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-slate-400">No credit card · Full access · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">100+</p>
              <p className="text-sm text-slate-500 mt-0.5">Businesses on the platform</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-100" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">3</p>
              <p className="text-sm text-slate-500 mt-0.5">Countries supported</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-100" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">🇳🇬 🇬🇭 🇿🇦</p>
              <p className="text-sm text-slate-500 mt-0.5">Nigeria · Ghana · South Africa</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-100" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">30 days</p>
              <p className="text-sm text-slate-500 mt-0.5">Free trial · No card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Trusted by accountants managing 100+ businesses across West &amp; Southern Africa
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-slate-600 text-sm leading-relaxed italic mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to serve your clients professionally
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
              All the tools a serious accountant expects — local tax compliance, full double-entry,
              payroll, and multi-business management — built into one platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COUNTRIES ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Country-adaptive compliance — no manual rate changes
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              LumiLedger automatically applies the correct VAT rate, currency symbol, and tax report
              format based on each client's registered country.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {COUNTRIES.map(c => (
              <div key={c.name} className={`rounded-2xl border-2 ${c.color} p-6`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl">{c.flag}</span>
                  <div>
                    <p className="font-extrabold text-slate-900 text-lg">{c.name}</p>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${c.badge}`}>{c.authority}</span>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currency</span>
                    <span className="font-semibold text-slate-800">{c.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VAT Rate</span>
                    <span className="font-semibold text-slate-800">{c.vat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deductions</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[60%]">{c.deductions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-6">Kenya, Rwanda, and more coming soon.</p>
        </div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How LumiLedger saves you hours every week
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4">Before LumiLedger</p>
              <ul className="space-y-3">
                {[
                  "Spreadsheets everywhere",
                  "WhatsApp receipts from clients",
                  "Manual journal entries",
                  "Separate payroll tool",
                  "Client asks for trial balance → you email PDFs",
                  "They lose them → you re-send",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-rose-800">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-rose-200 flex items-center justify-center text-rose-600 font-bold text-xs">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">With LumiLedger</p>
              <ul className="space-y-3">
                {[
                  "Client transactions recorded automatically",
                  "Journal entries posted on invoice/payment",
                  "One click to trial balance or P&L",
                  "Client logs in and sees live data",
                  "Payroll runs and journals in one step",
                  "You focus on advisory, not data entry",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for scale — from solo practitioner to firm
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every plan includes a 30-day free trial. No credit card required. Cancel anytime.</p>
          </div>

          {/* Country switcher */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Pricing for:</span>
            {Object.values(COUNTRY_CONFIG).map(c => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  countryCode === c.code
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {c.name} ({c.symbol})
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-10 flex-wrap text-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
            <p className="text-emerald-800 font-semibold text-sm">Every plan starts with a <strong>30-day free trial</strong> — full access, no card required.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
            {/* ESSENTIAL */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col">
              <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-5 self-start border border-slate-200 tracking-widest uppercase">Essential</div>
              <div className="mb-1">
                <span className="text-3xl font-extrabold text-slate-900">{plans.essential.price}</span>
                <span className="text-slate-400 text-sm ml-1">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-5">Up to 50 clients. Invoicing, expenses, capital tracking, financial reports.</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {PLAN_FEATURES.essential.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition text-sm">
                  Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-slate-400 mt-2">{plans.essential.sub}</p>
              </div>
            </div>

            {/* BUSINESS */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col">
              <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-5 self-start border border-slate-200 tracking-widest uppercase">Business</div>
              <div className="mb-1">
                <span className="text-3xl font-extrabold text-slate-900">{plans.business.price}</span>
                <span className="text-slate-400 text-sm ml-1">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-5">Unlimited clients, multi-user access, full accounting suite.</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {PLAN_FEATURES.business.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition text-sm">
                  Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-slate-400 mt-2">{plans.business.sub}</p>
              </div>
            </div>

            {/* ACCOUNTANT PRO — highlighted */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 pt-8 shadow-2xl shadow-blue-600/40 flex flex-col sm:-mt-4 sm:-mb-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs font-extrabold rounded-full shadow-lg border border-blue-100">⭐ Best for Accountants</span>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-5 self-start tracking-widest uppercase">Accountant Pro</div>
              <div className="mb-1">
                <span className="text-4xl font-extrabold text-white">{plans.accountantPro.price}</span>
                <span className="text-blue-200 text-sm ml-1">/month</span>
              </div>
              <p className="text-blue-200 text-sm mb-5">Everything your firm needs to serve multiple clients professionally.</p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {PLAN_FEATURES.accountantPro.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white">
                    <CheckCircle className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-700 font-extrabold rounded-xl hover:bg-blue-50 transition shadow-lg text-sm">
                  Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-blue-300 mt-2">{plans.accountantPro.sub}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA MIGRATION ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Import from spreadsheets or other software</h2>
            <p className="text-slate-500 mb-6 leading-relaxed">
              Coming from Excel, QuickBooks, or another platform? We help you migrate client data
              free of charge during your trial.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-7">
              {["Opening balances", "Chart of accounts", "Customer/supplier lists", "Historical transactions (last 12 months)"].map(item => (
                <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />{item}
                </span>
              ))}
            </div>
            <a
              href="mailto:support@lumitechsystems.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition text-sm"
            >
              Contact support to schedule migration <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
            Join 100+ businesses (and their accountants) already using LumiLedger
          </h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Your clients get clarity on what their business owes them. You get professional-grade
            tools without paying international prices.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-extrabold rounded-2xl shadow-xl hover:bg-blue-50 hover:scale-[1.02] transition-all text-base"
          >
            Start 30-Day Free Trial — Free <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: <Shield className="w-4 h-4 text-blue-200" />, text: "No credit card" },
              { icon: <CheckCircle className="w-4 h-4 text-blue-200" />, text: "Full access from day 1" },
              { icon: <Clock className="w-4 h-4 text-blue-200" />, text: "Set up in under 2 minutes" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2 text-sm text-blue-100">{t.icon}{t.text}</div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
