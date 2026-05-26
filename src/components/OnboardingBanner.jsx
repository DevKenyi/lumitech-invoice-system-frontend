// OnboardingBanner.jsx
import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { CheckCircle, ChevronRight, X, AlertCircle, Circle } from "lucide-react";

const STEPS = [
  {
    key: "orgProfileComplete",
    label: "Complete your org profile",
    description: "Add your company name, email, address, and bank details.",
    to: "/settings/org",
    cta: "Go to Settings",
  },
  {
    key: "firstClientCreated",
    label: "Add your first client",
    description: "Create a client you can invoice.",
    to: "/clients/create",
    cta: "Add Client",
  },
  {
    key: "firstInvoiceCreated",
    label: "Create your first invoice",
    description: "Send your first invoice and get paid.",
    to: "/create",
    cta: "Create Invoice",
  },
];

const FALLBACK = { onboardingCompleted: false, percentComplete: 0 };

function OnboardingBanner() {
  const location = useLocation();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = useCallback(() => {
    api.get("/api/onboarding/status")
      .then(res => { setStatus(res.data); setApiError(false); })
      .catch(err => {
        const code = err.response?.status;
        if (code === 404 || code === 501) { setDismissed(true); return; }
        setStatus(FALLBACK);
        setApiError(true);
      });
  }, []);

  useEffect(() => {
    if (dismissed) return;
    fetchStatus();
  }, [location.pathname, dismissed, fetchStatus]);

  const handleDismiss = async () => {
    setDismissing(true);
    try { await api.post("/api/onboarding/dismiss"); } catch {}
    finally { setDismissed(true); setDismissing(false); }
  };

  if (dismissed || !status || status.onboardingCompleted) return null;

  const doneCount = STEPS.filter(s => !!status[s.key]).length;
  const activeStep = STEPS.find(s => !status[s.key]);
  if (!activeStep) return null;

  const activeIndex = STEPS.indexOf(activeStep);
  const percent = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="mx-3 sm:mx-6 mt-4 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/60 rounded-2xl shadow-sm overflow-hidden">

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Header row — always visible */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Step progress dots — desktop only */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {STEPS.map((s, i) => (
            <div key={i} className={`rounded-full transition-all ${
              !!status[s.key] ? "w-2 h-2 bg-emerald-500" :
              i === activeIndex ? "w-3 h-2 bg-blue-500" : "w-2 h-2 bg-slate-200 dark:bg-slate-600"
            }`} />
          ))}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-medium">
            {doneCount} of {STEPS.length} steps complete
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
            {activeStep.label}
          </p>
        </div>

        {/* CTA — desktop */}
        <Link
          to={activeStep.to}
          className="hidden sm:inline-flex shrink-0 items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all"
        >
          {activeStep.cta}
          <ChevronRight size={12} />
        </Link>

        {/* Expand toggle — mobile only */}
        <button
          onClick={() => setExpanded(o => !o)}
          className="sm:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          aria-label="Show all steps"
        >
          <ChevronRight size={16} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="shrink-0 p-1.5 text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          title="Skip for now"
        >
          <X size={14} />
        </button>
      </div>

      {/* Mobile expanded: all steps listed */}
      {expanded && (
        <div className="sm:hidden border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-3">
          {STEPS.map((step, i) => {
            const done = !!status[step.key];
            const isActive = i === activeIndex;
            return (
              <div
                key={step.key}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40"
                    : done
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                {/* Icon */}
                <div className={`mt-0.5 shrink-0 ${done ? "text-emerald-500" : isActive ? "text-blue-500" : "text-slate-300 dark:text-slate-600"}`}>
                  {done
                    ? <CheckCircle size={18} />
                    : <Circle size={18} />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${done ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"}`}>
                    {step.label}
                  </p>
                  {!done && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</p>
                  )}
                </div>

                {/* CTA for active step */}
                {isActive && (
                  <Link
                    to={step.to}
                    onClick={() => setExpanded(false)}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    {step.cta}
                    <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {apiError && (
        <div className="px-4 pb-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle size={11} /> Status sync unavailable — complete steps manually
        </div>
      )}
    </div>
  );
}

export default OnboardingBanner;
