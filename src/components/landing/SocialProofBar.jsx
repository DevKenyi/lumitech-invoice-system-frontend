const STATS = [
  { value: "100+",      label: "Businesses on LumiLedger" },
  { value: "₦50M+",    label: "Tracked through the platform" },
  { value: "🇳🇬 🇬🇭 🇿🇦", label: "Nigeria · Ghana · South Africa" },
  { value: "30 days",  label: "Free trial · No card required" },
];

export default function SocialProofBar() {
  return (
    <section className="border-y border-white/8 bg-white/3 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 flex-wrap">
          {STATS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-8 sm:gap-12">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
              {i < STATS.length - 1 && (
                <div className="hidden sm:block w-px h-10 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
