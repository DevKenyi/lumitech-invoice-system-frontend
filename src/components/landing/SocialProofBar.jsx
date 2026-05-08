export default function SocialProofBar() {
  return (
    <section className="border-y border-slate-100 bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 flex-wrap">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-slate-900">100+</p>
            <p className="text-sm text-slate-500 mt-0.5">Businesses using LumiLedger</p>
          </div>
          <div className="hidden sm:block w-px h-10 bg-slate-100" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-slate-900">₦50M+</p>
            <p className="text-sm text-slate-500 mt-0.5">Tracked through the platform</p>
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
  );
}
