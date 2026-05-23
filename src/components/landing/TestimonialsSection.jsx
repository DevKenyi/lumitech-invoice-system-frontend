import { Star } from "lucide-react";
import useInView from "../../hooks/useInView";

const testimonials = [
  {
    quote: "I finally know how much my business owes me. I had put in over ₦800,000 and had no idea how much was coming back. LumiLedger showed me everything on day one.",
    name: "Amara O.", role: "Business Owner, Lagos 🇳🇬", initials: "AO",
    gradient: "from-blue-500 to-indigo-600", metric: "₦800K tracked",
  },
  {
    quote: "I used to chase clients on WhatsApp for weeks. Now I send a payment link with every invoice and most clients pay within 24 hours. My cash flow has completely changed.",
    name: "Kwame A.", role: "Logistics Founder, Accra 🇬🇭", initials: "KA",
    gradient: "from-emerald-500 to-teal-600", metric: "Paid in 24hrs",
  },
  {
    quote: "As a small agency in Johannesburg, we had no idea if we were actually profitable month to month. LumiLedger's live P&L dashboard changed everything — set up took under 10 minutes.",
    name: "Thabo M.", role: "Creative Agency, Johannesburg 🇿🇦", initials: "TM",
    gradient: "from-violet-500 to-purple-600", metric: "Live P&L in 10 min",
  },
];

export default function TestimonialsSection() {
  const [ref, inView] = useInView();
  return (
    <section className="py-24 bg-[#0a0a0f]">
      <div ref={ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-1 mb-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by 100+ businesses
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">Nigeria · Ghana · South Africa — real businesses, real clarity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={t.name}
              className="bg-white/4 rounded-2xl p-6 border border-white/8 hover:border-white/14 transition-all duration-500 flex flex-col"
              style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)", transitionDelay: `${i * 120}ms` }}>
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
