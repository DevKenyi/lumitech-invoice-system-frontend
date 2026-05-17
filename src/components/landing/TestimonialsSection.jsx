import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "I finally know how much my business owes me. I had put in over ₦800,000 and had no idea how much was coming back. LumiLedger showed me everything on day one.",
    name: "Amara O.", role: "Business Owner, Lagos", initials: "AO",
    gradient: "from-blue-500 to-indigo-600", metric: "₦800K tracked",
  },
  {
    quote: "As an accountant managing 6 businesses, this is the only tool that gives me the full picture — journal entries, balance sheet, and capital tracking all in one place.",
    name: "Chidi N.", role: "Accountant, Abuja", initials: "CN",
    gradient: "from-emerald-500 to-teal-600", metric: "6 clients managed",
  },
  {
    quote: "Set up in 5 minutes. My dashboard now shows revenue, expenses, profit — and how much my business owes me personally. I've never had this clarity before.",
    name: "Funmilayo B.", role: "Branding Consultant, Ibadan", initials: "FB",
    gradient: "from-violet-500 to-purple-600", metric: "Set up in 5 min",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by 100+ businesses
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">₦50M+ tracked. Real businesses. Real clarity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name}
              className="bg-white/4 rounded-2xl p-6 border border-white/8 hover:border-white/14 transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {t.metric}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 italic flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
