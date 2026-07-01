import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Shield, Clock, Layers, Globe } from "lucide-react";
import useCountry, { COUNTRY_CONFIG } from "../../hooks/useCountry";

export default function PricingSection() {
  const { countryCode, config, setCountry } = useCountry();
  const { plans } = config;
  const [annual, setAnnual] = useState(false);

  const price = (plan) => annual ? plan.annual : plan.price;

  return (
    <section id="pricing" className="py-24 bg-[#0a0a0f] border-y border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Simple pricing. Start free.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">Every plan includes a full 14-day free trial — no credit card, no restrictions. Pick a plan, try everything, then decide.</p>
        </div>

        {/* Country switcher */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Pricing for:</span>
          {Object.values(COUNTRY_CONFIG).map(c => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                countryCode === c.code
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white/6 text-slate-300 border-white/10 hover:border-white/20"
              }`}
            >
              {c.name} ({c.symbol})
            </button>
          ))}
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${annual ? "bg-blue-600" : "bg-white/15"}`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${annual ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? "text-white" : "text-slate-500"}`}>
            Annual
          </span>
          {annual && (
            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/25 animate-pulse">
              2 months free 🎉
            </span>
          )}
        </div>

        {/* Free trial banner */}
        <div className="flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-4 mb-10 flex-wrap text-center">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
          <p className="text-emerald-300 font-semibold text-sm">Every plan below starts with a <strong>14-day free trial</strong> — full access, no card required. You only pay after day 14.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {/* ESSENTIAL */}
          <div className="bg-white/5 rounded-2xl border-2 border-white/10 p-6 flex flex-col transition-all duration-300">
            <div className="inline-flex items-center px-3 py-1 bg-white/8 text-slate-300 text-xs font-bold rounded-full mb-5 self-start border border-white/10 tracking-widest uppercase">Essential</div>
            <div className="mb-1 flex items-end gap-1">
              <span className="text-3xl font-extrabold text-white transition-all duration-300">{price(plans.essential)}</span>
              <span className="text-slate-500 text-sm mb-1">/mo</span>
              {annual && (
                <span className="text-xs text-emerald-400 font-semibold mb-1 ml-1">Save {plans.essential.save}/yr</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-5">For business owners managing their finances</p>
            <ul className="space-y-2.5 mb-6 flex-1">
              {["Invoicing & payments", "Financial reports", "Capital tracking", "Up to 50 clients", "Email reminders"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition text-sm">
                Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-slate-500 mt-2">{plans.essential.sub}</p>
            </div>
          </div>

          {/* BUSINESS — Most Popular */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 pt-8 shadow-2xl shadow-blue-600/40 flex flex-col sm:-mt-4 sm:-mb-4 transition-all duration-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs font-extrabold rounded-full shadow-lg border border-blue-100">⭐ Most Popular</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-5 self-start tracking-widest uppercase">Business</div>
            <div className="mb-1 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-white transition-all duration-300">{price(plans.business)}</span>
              <span className="text-blue-200 text-sm mb-1">/mo</span>
              {annual && (
                <span className="text-xs text-emerald-300 font-semibold mb-1 ml-1">Save {plans.business.save}/yr</span>
              )}
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
                Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-blue-300 mt-2">{plans.business.sub}</p>
            </div>
          </div>

          {/* ACCOUNTANT PRO */}
          <div className="bg-white/5 rounded-2xl border-2 border-violet-500/30 p-6 flex flex-col transition-all duration-300">
            <div className="inline-flex items-center px-3 py-1 bg-violet-500/15 text-violet-400 text-xs font-bold rounded-full mb-5 self-start border border-violet-500/25 tracking-widest uppercase">Accountant Pro</div>
            <div className="mb-1 flex items-end gap-1">
              <span className="text-3xl font-extrabold text-white transition-all duration-300">{price(plans.accountantPro)}</span>
              <span className="text-slate-500 text-sm mb-1">/mo</span>
              {annual && (
                <span className="text-xs text-emerald-400 font-semibold mb-1 ml-1">Save {plans.accountantPro.save}/yr</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-5">For accountants managing multiple clients</p>
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
                <li key={f} className={`flex items-start gap-2 text-sm ${f.startsWith("✦") ? "text-violet-300 font-semibold" : "text-slate-300"}`}>
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.startsWith("✦") ? "text-violet-400" : "text-violet-500"}`} />
                  {f.replace("✦ ", "")}
                </li>
              ))}
            </ul>
            <p className="text-xs text-violet-400 font-semibold italic mb-4">Built for accountants managing multiple clients</p>
            <div className="mt-auto">
              <Link to="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition shadow-lg text-sm">
                Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-xs text-slate-500 mt-2">{plans.accountantPro.sub}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-10">
          {[
            { icon: <Shield className="w-4 h-4 text-emerald-400" />,      text: "No hidden fees" },
            { icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, text: "Cancel anytime" },
            { icon: <Clock className="w-4 h-4 text-emerald-400" />,       text: "Set up in under 2 minutes" },
            { icon: <Layers className="w-4 h-4 text-emerald-400" />,      text: "Your data is always preserved" },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-2 text-sm text-slate-400">{t.icon}{t.text}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
