import useInView from "../../hooks/useInView";

export default function JoyFace() {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <section className="py-24 bg-[#0a0a0f] overflow-hidden">
      <div
        ref={ref}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Section label */}
        <div
          className="flex justify-center mb-12"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease" }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/6 border border-white/10 text-slate-400 text-xs font-semibold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real businesses. Real results.
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-0 items-stretch rounded-3xl overflow-hidden border border-white/8">

          {/* Photo — left half */}
          <div
            className="relative min-h-[420px] lg:min-h-[520px] overflow-hidden"
            style={{ opacity: inView ? 1 : 0, transition: "opacity 0.8s ease 0.1s" }}
          >
            <img
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&h=700&q=80"
              alt="Happy business owner"
              className="w-full h-full object-cover object-top"
              style={{ transform: inView ? "scale(1)" : "scale(1.06)", transition: "transform 1s ease 0.1s" }}
            />
            {/* Subtle dark overlay on right edge so it bleeds into text side */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0d0d14] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-transparent pointer-events-none lg:hidden" />
          </div>

          {/* Quote — right half */}
          <div
            className="flex flex-col justify-center bg-[#0d0d14] px-8 sm:px-12 py-12"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(40px)",
              transition: "all 0.8s ease 0.25s",
            }}
          >
            {/* Big opening quote mark */}
            <div className="text-7xl leading-none font-serif text-blue-500/40 mb-4 select-none">"</div>

            <p className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-6">
              I used to dread checking my books. Now I open my dashboard every morning with a{" "}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                big smile.
              </span>
            </p>

            <p className="text-slate-400 text-base leading-relaxed">
              For the first time I know exactly what my business owes me, which invoices are outstanding,
              and whether I'm actually making a profit. LumiLedger gave me the clarity I never had with spreadsheets.
            </p>

            {/* CTA nudge */}
            <div className="mt-10 pt-8 border-t border-white/8">
              <p className="text-xs text-slate-600 mb-3 uppercase tracking-widest font-semibold">Want the same clarity?</p>
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-100 transition shadow-lg shadow-white/10"
              >
                Start free — 30 days →
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
