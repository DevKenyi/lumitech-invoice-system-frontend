export default function SocialProofBar() {
  return (
    <section className="border-y border-white/8 bg-white/3 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-0 flex-wrap">

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">100+</p>
            <p className="text-xs text-slate-500 mt-1">Businesses on LumiLedger</p>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/10 mx-12" />

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">₦50M+</p>
            <p className="text-xs text-slate-500 mt-1">Tracked through the platform</p>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/10 mx-12" />

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">🇳🇬 🇬🇭 🇿🇦</p>
            <p className="text-xs text-slate-500 mt-1">Nigeria · Ghana · South Africa</p>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/10 mx-12" />

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">14 days</p>
            <p className="text-xs text-slate-500 mt-1">Free trial · No card required</p>
          </div>

        </div>
      </div>
    </section>
  );
}
