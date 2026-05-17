import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle, XCircle, ArrowRight, ChevronDown, FileText,
  Zap, Shield, Clock, AlertTriangle, CreditCard, Layers, ChevronRight,
} from "lucide-react";
import LandingNav from "../components/landing/LandingNav";
import LandingFooter from "../components/landing/LandingFooter";

/* ─── Plan comparison data ─────────────────────────────────────────── */
const PLANS = ["Free Trial", "Essential", "Business", "Accountant Pro"];
const PRICES = ["₦0", "₦9,900/mo", "₦24,900/mo", "₦59,900/mo"];

const features = [
  {
    category: "Core",
    rows: [
      { label: "Invoicing & payments",          values: [true,  true,  true,  true]  },
      { label: "Client management",              values: ["5 clients", "50 clients", "Unlimited", "Unlimited"] },
      { label: "Projects",                       values: ["2 projects", "10 projects", "Unlimited", "Unlimited"] },
      { label: "Capital tracking",               values: [true,  true,  true,  true]  },
      { label: "Financial reports (Aging, P&L)", values: [true,  true,  true,  true]  },
      { label: "Email payment reminders",        values: [true,  true,  true,  true]  },
      { label: "Paystack online payments",       values: [true,  true,  true,  true]  },
      { label: "Client payment portal",          values: [true,  true,  true,  true]  },
    ],
  },
  {
    category: "Advanced Accounting",
    rows: [
      { label: "Chart of Accounts",             values: [true,  false, true,  true]  },
      { label: "Journal Entries",               values: [true,  false, true,  true]  },
      { label: "Trial Balance",                 values: [true,  false, true,  true]  },
      { label: "Balance Sheet",                 values: [true,  false, true,  true]  },
      { label: "Bank statement import",         values: [true,  false, true,  true]  },
    ],
  },
  {
    category: "Expense Reporting",
    rows: [
      { label: "Expense claims & approvals",    values: [false, false, false, true]  },
      { label: "Receipt upload & storage",      values: [false, false, false, true]  },
      { label: "Staff expense roles",           values: [false, false, false, true]  },
      { label: "Auto journal on approval",      values: [false, false, false, true]  },
    ],
  },
  {
    category: "Compliance & Audit",
    rows: [
      { label: "Audit Trail (full activity log)", values: [false, false, false, true]  },
      { label: "VAT & WHT tracking (FIRS)",       values: [false, false, false, true]  },
    ],
  },
  {
    category: "Team & Access",
    rows: [
      { label: "Team members (users)",            values: ["2 users", "5 users", "Unlimited", "Unlimited"] },
      { label: "Team roles (Admin / Staff)",      values: [false, false, true,  true]  },
      { label: "Multi-business management",       values: [false, false, false, true]  },
      { label: "Priority support",                values: [false, false, false, true]  },
    ],
  },
];

/* ─── FAQ data ─────────────────────────────────────────────────────── */
const faqs = [
  {
    q: "What happens when my 30-day trial ends?",
    a: "If you haven't subscribed, your account is suspended the next morning. You can't create invoices or access your data until you pick a plan. Nothing is deleted — subscribing instantly restores full access to everything you had.",
  },
  {
    q: "Do I need a credit card to start the trial?",
    a: "No. Sign up with just your email and business name. No card, no commitment. You only enter payment details when you decide to subscribe.",
  },
  {
    q: "Can I use Advanced Accounting (Chart of Accounts, Journal Entries) during the trial?",
    a: "Yes — the free trial unlocks everything, including Chart of Accounts, Journal Entries, Balance Sheet, and Bank Statement Import. After the trial, those features require the Business or Accountant Pro plan.",
  },
  {
    q: "What's the difference between Business Owner mode and Accountant mode?",
    a: "Same data, different experience. Business Owner mode uses plain language — 'Collections', 'Capital you've put in', 'Business owes you'. Accountant mode uses standard accounting terminology and gives full access to all journal and reporting tools.",
  },
  {
    q: "Why does the Essential plan not include Chart of Accounts?",
    a: "Most small business owners don't need double-entry bookkeeping — they need invoicing, cash flow visibility, and to know what their business owes them. Advanced accounting tools are available on Business and Accountant Pro for those who need them.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade at any time from the Billing page inside your account. Downgrading is handled by cancelling your current subscription through Paystack.",
  },
  {
    q: "Will my data be deleted if my trial expires?",
    a: "No. Your invoices, clients, and all records are preserved. Suspension only blocks access — it doesn't delete anything. Subscribe and pick up exactly where you left off.",
  },
  {
    q: "I'm an accountant managing multiple businesses. Which plan is for me?",
    a: "Accountant Pro. It gives you unlimited client organisations, full double-entry accounting, team roles, and priority support. Register as an Accountant and you'll get the accountant-focused experience from day one.",
  },
];

/* ─── Components ───────────────────────────────────────────────────── */
function CheckCell({ value }) {
  if (value === true)  return <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />;
  if (value === false) return <XCircle    className="w-5 h-5 text-white/15 mx-auto" />;
  return <span className="text-xs font-medium text-slate-400 text-center block">{value}</span>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-white/20" : "border-white/8"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/4 hover:bg-white/7 transition"
      >
        <span className="font-semibold text-white text-sm pr-4">{q}</span>
        <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white/3 border-t border-white/8">
          <p className="text-sm text-slate-400 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans antialiased" style={{ overflowX: "clip" }}>
      <LandingNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/6 border border-white/10 text-slate-300 text-xs font-semibold rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-blue-400" /> 30-Day Free Trial — No Card Required
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Simple pricing.{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Transparent, no surprises.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
            Start free. Use everything for 30 days. Pick a plan when you're ready — or walk away, no hard feelings.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-900 font-bold rounded-xl shadow-lg shadow-white/10 hover:bg-slate-100 transition">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-600">No credit card. No commitment. Cancel anytime.</p>
        </div>
      </section>

      {/* ── HOW THE TRIAL WORKS ── */}
      <section className="py-20 border-y border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How the trial works</h2>
            <p className="text-slate-400 max-w-lg mx-auto">No hidden limits. No bait-and-switch features. Here's exactly what happens.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">

            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/25">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 text-lg font-extrabold">1</div>
              <h3 className="font-bold text-lg mb-2">Sign up — get everything</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Create your account in under 2 minutes. Every feature is immediately available — invoicing, capital tracking, Chart of Accounts, reports, bank import, everything.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["No card", "Full access", "Instant setup"].map(t => (
                  <span key={t} className="px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-lg font-extrabold text-white">2</div>
              <h3 className="font-bold text-lg text-white mb-2">Use it for 30 days</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Run your business. Create invoices, record capital, generate reports. Your dashboard shows exactly how many days remain. We'll email you a reminder before it ends.
              </p>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">Trial countdown starts from the day you register.</p>
              </div>
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 text-lg font-extrabold text-white">3</div>
              <h3 className="font-bold text-lg text-white mb-2">Pick a plan or leave</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Subscribe before day 30 and continue uninterrupted. If you don't subscribe, your account is suspended — but <strong className="text-white">nothing is deleted</strong>. Subscribe anytime to restore full access instantly.
              </p>
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">Suspension locks access — it doesn't delete your data.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Choose your plan</h2>
            <p className="text-slate-400 max-w-lg mx-auto">All plans start with a 30-day free trial. Subscribe when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5 items-stretch">

            {/* FREE */}
            <div className="bg-white/4 rounded-2xl border-2 border-dashed border-white/12 p-6 flex flex-col">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-full mb-4 self-start border border-emerald-500/25">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Free Trial
              </div>
              <p className="text-3xl font-extrabold text-white mb-0.5">₦0</p>
              <p className="text-sm text-slate-500 mb-4">for 30 days</p>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">Full access to every feature. No restrictions whatsoever.</p>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-sm transition hover:bg-slate-100">
                  Start Free Trial
                </Link>
                <p className="text-center text-xs text-slate-600 mt-2">No card. No commitment.</p>
              </div>
            </div>

            {/* ESSENTIAL */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 shadow-2xl shadow-blue-600/35 flex flex-col md:-mt-3 md:-mb-3">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-700 text-xs font-extrabold rounded-full shadow border border-blue-100">⭐ Most Popular</span>
              </div>
              <div className="inline-flex px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-4 self-start tracking-widest uppercase">Essential</div>
              <p className="text-4xl font-extrabold text-white mb-0.5">₦9,900</p>
              <p className="text-sm text-blue-200 mb-4">/month</p>
              <p className="text-xs text-blue-200 mb-5 leading-relaxed">For business owners managing their finances simply.</p>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-700 font-extrabold rounded-xl text-sm hover:bg-blue-50 transition shadow-lg">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-blue-300 mt-2">Then ₦9,900/month.</p>
              </div>
            </div>

            {/* BUSINESS */}
            <div className="bg-white/5 rounded-2xl border-2 border-white/10 p-6 flex flex-col">
              <div className="inline-flex px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full mb-4 self-start border border-indigo-500/30 tracking-widest uppercase">Business</div>
              <p className="text-3xl font-extrabold text-white mb-0.5">₦24,900</p>
              <p className="text-sm text-slate-500 mb-4">/month</p>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">For growing businesses that need accounting tools and team access.</p>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-slate-500 mt-2">Then ₦24,900/month.</p>
              </div>
            </div>

            {/* ACCOUNTANT PRO */}
            <div className="bg-white/5 rounded-2xl border-2 border-violet-500/30 p-6 flex flex-col">
              <div className="inline-flex px-3 py-1 bg-violet-500/15 text-violet-400 text-xs font-bold rounded-full mb-4 self-start border border-violet-500/25 tracking-widest uppercase">Accountant Pro</div>
              <p className="text-3xl font-extrabold text-white mb-0.5">₦59,900</p>
              <p className="text-sm text-slate-500 mb-4">/month</p>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">For accountants managing multiple client businesses.</p>
              <div className="mt-auto">
                <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition shadow-lg">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-xs text-slate-500 mt-2">Then ₦59,900/month.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURE TABLE ── */}
      <section className="py-20 border-y border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">What's included in each plan</h2>
            <p className="text-slate-400">Every plan starts with a full 30-day free trial.</p>
          </div>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 bg-white/5 border-b border-white/10">
              <div className="px-5 py-4 col-span-1" />
              {PLANS.map((plan, i) => (
                <div key={plan} className={`px-3 py-4 text-center ${i === 1 ? "bg-blue-600" : ""}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${i === 1 ? "text-blue-200" : "text-slate-500"}`}>{plan}</p>
                  <p className={`text-sm font-extrabold ${i === 1 ? "text-white" : "text-white"}`}>{PRICES[i]}</p>
                </div>
              ))}
            </div>
            {features.map((section) => (
              <div key={section.category}>
                <div className="px-5 py-2.5 bg-white/4 border-y border-white/8">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{section.category}</p>
                </div>
                {section.rows.map((row, ri) => (
                  <div key={row.label}
                    className={`grid grid-cols-5 border-b border-white/6 last:border-0 ${ri % 2 === 0 ? "bg-transparent" : "bg-white/3"}`}
                  >
                    <div className="px-5 py-3.5 col-span-1">
                      <p className="text-sm text-slate-300">{row.label}</p>
                    </div>
                    {row.values.map((val, vi) => (
                      <div key={vi} className={`px-3 py-3.5 flex items-center justify-center ${vi === 1 ? "bg-blue-600/10" : ""}`}>
                        <CheckCell value={val} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-4">
            * Free trial unlocks everything — including Advanced Accounting. Feature access adjusts to your plan after the trial.
          </p>
        </div>
      </section>

      {/* ── BUSINESS OWNER vs ACCOUNTANT ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">One platform. Two experiences.</h2>
            <p className="text-slate-400 max-w-lg mx-auto">LumiLedger adapts to how you work. Choose your mode when you register.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Business Owner</h3>
                  <p className="text-xs text-slate-500">Plain language. No accounting jargon.</p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  ["Invoices", "Standard invoicing"],
                  ["Collections", "Payments received from clients"],
                  ["Capital", "Money you've put in / what the business owes you"],
                  ["Customers", "Your client list"],
                ].map(([term, desc]) => (
                  <div key={term} className="flex items-start gap-3">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-2.5 py-1 flex-shrink-0 mt-0.5 min-w-[90px] text-center">{term}</span>
                    <p className="text-sm text-slate-300 leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-xs text-amber-300 font-medium">Business Owner mode is permanent — registered SME users do not switch to Accountant mode.</p>
              </div>
            </div>

            <div className="bg-white/4 border border-indigo-500/30 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-indigo-500/15 rounded-xl border border-indigo-500/20">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Accountant</h3>
                  <p className="text-xs text-slate-500">Standard accounting terminology. Full control.</p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  ["Payments", "Same as Collections — standard terminology"],
                  ["Capital Injection", "Owner capital recorded formally"],
                  ["Journal Entries", "Double-entry bookkeeping"],
                  ["Chart of Accounts", "Full account structure (assets, liabilities, equity…)"],
                ].map(([term, desc]) => (
                  <div key={term} className="flex items-start gap-3">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 rounded-lg px-2.5 py-1 flex-shrink-0 mt-0.5 min-w-[90px] text-center">{term}</span>
                    <p className="text-sm text-slate-300 leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-300 font-medium">Accountants can toggle between Accountant and Business Owner view at any time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Frequently asked questions</h2>
            <p className="text-slate-400">Straight answers. No marketing fluff.</p>
          </div>
          <div className="space-y-3">
            {faqs.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-white/8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-slate-400">
            {[
              { icon: <Shield className="w-4 h-4 text-emerald-400" />,   text: "No hidden fees" },
              { icon: <Clock  className="w-4 h-4 text-emerald-400" />,   text: "Cancel anytime" },
              { icon: <CreditCard className="w-4 h-4 text-emerald-400" />, text: "No card for trial" },
              { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: "Your data is safe" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2">{t.icon}{t.text}</div>
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">30 days free. Full access. No credit card.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-extrabold rounded-xl shadow-lg shadow-white/10 hover:bg-slate-100 transition text-base">
            Start Free Trial <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
