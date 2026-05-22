// TrialBanner.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AlertTriangle, X, ArrowRight, XCircle } from "lucide-react";

function TrialBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get("/api/billing/status")
      .then(res => {
        setStatus(res.data);
        // Hard-lock immediately — don't wait for the nightly suspension job
        if (res.data?.trialExpired && !res.data?.hasActiveSubscription) {
          window.dispatchEvent(new CustomEvent("trial-expired"));
        }
      })
      .catch(() => {});
  }, []);

  if (!status || dismissed) return null;

  const { currentPlan, hasActiveSubscription, trialExpired, daysLeftInTrial } = status;

  if (hasActiveSubscription || trialExpired) return null;

  let variant = null;

  if (currentPlan === "FREE" && typeof daysLeftInTrial === "number" && daysLeftInTrial <= 7) {
    variant = {
      type: daysLeftInTrial <= 2 ? "error" : "warning",
      message: daysLeftInTrial === 0
        ? "Your free trial expires today."
        : `Your free trial expires in ${daysLeftInTrial} day${daysLeftInTrial === 1 ? "" : "s"}.`,
      cta: "Upgrade Now",
    };
  } else if ((currentPlan === "STARTER" || currentPlan === "PRO") && !hasActiveSubscription) {
    variant = {
      type: "warning",
      message: "Your subscription is no longer active.",
      cta: "Renew Now",
    };
  }

  if (!variant) return null;

  const isError = variant.type === "error";

  return (
    <div className={`mx-4 md:mx-6 mt-4 rounded-2xl border px-4 py-3 flex items-center gap-3 ${
      isError
        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
        : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
    }`}>
      {isError
        ? <XCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
        : <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />}

      <p className={`text-sm flex-1 font-medium ${
        isError ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"
      }`}>
        {variant.message}
      </p>

      <Link
        to="/settings/billing"
        className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap hover:underline transition ${
          isError ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"
        }`}
      >
        {variant.cta} <ArrowRight size={12} />
      </Link>

      <button
        onClick={() => setDismissed(true)}
        className={`p-1 rounded-lg transition flex-shrink-0 ${
          isError
            ? "text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50"
            : "text-amber-400 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50"
        }`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default TrialBanner;
