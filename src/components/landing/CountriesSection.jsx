import { Globe, Receipt, Users } from "lucide-react";
import { Link } from "react-router-dom";

const COUNTRIES = [
  {
    flag: "🇬🇭", country: "Ghana",        currency: "GHS — Cedi",
    tax: "VAT 15% · GRA",  payroll: "PAYE · SSNIT",
    accent: "from-yellow-500/20 to-red-500/10", border: "border-yellow-500/30",
  },
  {
    flag: "🇿🇦", country: "South Africa", currency: "ZAR — Rand",
    tax: "VAT 15% · SARS", payroll: "PAYE · UIF · SDL",
    accent: "from-green-500/20 to-yellow-500/10", border: "border-green-500/30",
  },
];

export default function CountriesSection() {
  return (
    <section id="countries" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20 mb-6">
            <Globe className="w-3.5 h-3.5" /> Built for West &amp; Southern Africa
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Launching in{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Ghana &amp; South Africa
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            LumiLedger is purpose-built for your country — correct currency, local VAT rate,
            and the right tax authority. Register and be compliant from day one.
          </p>
        </div>

        {/* Country cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          {COUNTRIES.map(c => (
            <div key={c.country}
              className={`bg-gradient-to-br ${c.accent} backdrop-blur-sm rounded-2xl p-7 border ${c.border} hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-5">
                <span className="text-5xl leading-none">{c.flag}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{c.country}</h3>
              <p className="text-slate-400 text-sm mb-4">{c.currency}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Receipt className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /> {c.tax}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /> {c.payroll}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /> Multi-currency invoicing
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What "adaptive" means */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-10">
          <h3 className="text-white font-bold text-lg mb-5 text-center">What "country-adaptive" actually means</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: "💱", title: "Correct currency", desc: "Ghana → every page shows ₵. South Africa → R. No settings needed — it just works." },
              { icon: "📊", title: "Right VAT rate", desc: "Ghana uses 15% GRA. South Africa uses 15% SARS. Applied automatically to every invoice you send." },
              { icon: "🏛️", title: "Local compliance", desc: "Tax reports formatted for your authority — GRA for Ghana, SARS for South Africa — ready to file." },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{f.title}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-6">More African markets coming soon — Nigeria, Kenya, and beyond.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-xl shadow-amber-500/30 hover:scale-[1.02] transition-all">
            Start Free in Your Country
          </Link>
        </div>
      </div>
    </section>
  );
}
