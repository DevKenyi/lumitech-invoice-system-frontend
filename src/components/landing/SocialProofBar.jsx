import { Star } from "lucide-react";

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
            <p className="text-xl sm:text-3xl font-extrabold text-slate-900">SMEs + Accountants</p>
            <p className="text-sm text-slate-500 mt-0.5">Two modes, one platform</p>
          </div>
          <div className="hidden sm:block w-px h-10 bg-slate-100" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            <span className="ml-2 text-sm font-semibold text-slate-700">4.9 / 5</span>
          </div>
        </div>
      </div>
    </section>
  );
}
