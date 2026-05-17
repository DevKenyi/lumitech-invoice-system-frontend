import useInView from "../../hooks/useInView";
import useCountUp from "../../hooks/useCountUp";

function CountStat({ target, suffix = "", prefix = "", label, start }) {
  const value = useCountUp(target, 1800, start);
  return (
    <div className="text-center">
      <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
        {prefix}{value.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function SocialProofBar() {
  const [ref, inView] = useInView();

  return (
    <section ref={ref} className="border-y border-white/8 bg-white/3 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-0 flex-wrap">

          <CountStat target={100} suffix="+" label="Businesses on LumiLedger" start={inView} />

          <div className="hidden sm:block w-px h-10 bg-white/10 mx-12" />

          <CountStat target={50} prefix="₦" suffix="M+" label="Tracked through the platform" start={inView} />

          <div className="hidden sm:block w-px h-10 bg-white/10 mx-12" />

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">🇳🇬 🇬🇭 🇿🇦</p>
            <p className="text-xs text-slate-500 mt-1">Nigeria · Ghana · South Africa</p>
          </div>

          <div className="hidden sm:block w-px h-10 bg-white/10 mx-12" />

          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-white">30 days</p>
            <p className="text-xs text-slate-500 mt-1">Free trial · No card required</p>
          </div>

        </div>
      </div>
    </section>
  );
}
