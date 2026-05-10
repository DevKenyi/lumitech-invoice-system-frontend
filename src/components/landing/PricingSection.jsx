import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Shield, Clock, Layers, Globe } from "lucide-react";
import useCountry, { COUNTRY_CONFIG } from "../../hooks/useCountry";

export default function PricingSection() {
  const { countryCode, config, setCountry } = useCountry();
  const { plans } = config;

  return (
    <section id="pricing" className="py-24 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Simple pricing. Start free.
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">Every plan includes a full 30-day free trial — no credit card, no restrictions. Pick a plan, try everything, then decide.</p>
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

        {/* Free trial banner */}
        <div className="flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mb-10 flex-wrap text-center">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
          <p className="text-emerald-800 font-semibold text-sm">Every plan below starts with a <strong>30-day free trial</strong> — full access, no card required. You only pay after day 30.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {/* ESSENTIAL */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 flex flex-col">
            <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full mb-5 self-start border border-slate-200 tracking-widest uppercase">Essential</div>
            <div className="mb-1">
              <span className="text-3xl font-extrabold text-slate-900">{plans.essential.price}</span>
              <span className="text-slate-400 text-sm ml-1">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-5">For business owners managing their finances</p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {["Invoicing & payments", "Expense tracking", "Financial reports", "Capital tracking", "Up to 50 clients", "Email reminders"].map(f => (
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

          {/* BUSINESS — Most Popular */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 pt-8 shadow-2xl shadow-blue-600/40 flex flex-col sm:-mt-4 sm:-mb-4">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs font-extrabold rounded-full shadow-lg border border-blue-100">⭐ Most Popular</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-5 self-start tracking-widest uppercase">Business</div>
            <div className="mb-1">
              <span className="text-4xl font-extrabold text-white">{plans.business.price}</span>
              <span className="text-blue-200 text-sm ml-1">/month</span>
            </div>
            <p className="text-blue-200 text-sm mb-5">For growing businesses that need more</p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {["Everything in Essential", "Unlimited clients", "Multi-user access", "Advanced reports", "Chart of Accounts & Ledger", "Journal Entries", "Bank reconciliation", "Fixed assets & depreciation"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white">
                  <CheckCircle className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-700 font-extrabold rounded-xl hover:bg-blue-50 transition shadow-lg text-sm">
                Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-blue-300 mt-2">{plans.business.sub}</p>
            </div>
          </div>

          {/* ACCOUNTANT PRO */}
          <div className="bg-white rounded-2xl border-2 border-violet-200 p-6 flex flex-col">
            <div className="inline-flex items-center px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full mb-5 self-start border border-violet-200 tracking-widest uppercase">Accountant Pro</div>
            <div className="mb-1">
              <span className="text-3xl font-extrabold text-slate-900">{plans.accountantPro.price}</span>
              <span className="text-slate-400 text-sm ml-1">/month</span>
            </div>
            <p className="text-slate-500 text-sm mb-5">For accountants managing multiple clients</p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {[
                "Everything in Business",
                `✦ Payroll & ${config.taxBody === "GRA" ? "SSNIT/PAYE" : config.taxBody === "SARS" ? "PAYE/UIF/SDL" : "PAYE/Pension/NHF"}`,
                "✦ Multi-currency (13 currencies)",
                "✦ Budget vs Actual",
                "✦ Cash Flow Forecast",
                "Expense reporting & claims",
                "Audit Trail (full activity log)",
                `${config.vatLabel} & WHT tracking (${config.taxBody})`,
                "Multi-business management",
                "Priority support",
              ].map(f => (
                <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("✦") ? "text-violet-700 font-semibold" : "text-slate-600"}`}>
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.startsWith("✦") ? "text-violet-500" : "text-violet-400"}`} />
                  {f.replace("✦ ", "")}
                </li>
              ))}
            </ul>
            <p className="text-xs text-violet-600 font-semibold italic mb-4">Built for accountants managing multiple clients</p>
            <div className="mt-auto">
              <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition shadow-lg text-sm">
                Start 30-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-slate-400 mt-2">{plans.accountantPro.sub}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-10">
          {[
            { icon: <Shield className="w-4 h-4 text-emerald-600" />,      text: "No hidden fees" },
            { icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, text: "Cancel anytime" },
            { icon: <Clock className="w-4 h-4 text-emerald-600" />,       text: "Set up in under 2 minutes" },
            { icon: <Layers className="w-4 h-4 text-emerald-600" />,      text: "Your data is always preserved" },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-2 text-sm text-slate-600">{t.icon}{t.text}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
