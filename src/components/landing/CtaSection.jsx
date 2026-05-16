import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl px-5 sm:px-8 py-14 sm:py-20 shadow-2xl shadow-blue-600/30 overflow-hidden text-center">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Urgency pill */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-7 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wide">Free trial — no card needed · Spots filling fast</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
            Your business may owe you thousands. In 2 minutes, you'll know exactly how much — and watch that number shrink every month.
          </p>

          {/* Trust bullets */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {[
              "30-day free trial",
              "No credit card required",
              "Set up in under 2 minutes",
              "Cancel anytime",
            ].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-blue-200 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-extrabold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-base"
            >
              Start My Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-base backdrop-blur-sm"
            >
              See How It Works
            </a>
          </div>

          <p className="mt-6 text-blue-400/80 text-xs font-medium tracking-wide">
            LumiLedger — Built for African founders who deserve clarity over their money.
          </p>
        </div>
      </div>
    </section>
  );
}
