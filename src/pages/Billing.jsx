// Billing.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import { CreditCard, CheckCircle, Clock, ArrowRight, Zap, Calculator, Shield, Lock, Building2 } from "lucide-react";
import Toast from "../components/Toast";
import { setUserType, setRegisteredAs, USER_TYPES } from "../utils/userType";
import { useOrg } from "../context/OrgContext";

function Billing() {
  const { country, fmt, currencySymbol } = useOrg();
  const [billing, setBilling] = useState(null);
  const [planPricing, setPlanPricing] = useState({}); // { STARTER: {amount, currency}, ... }
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  useEffect(() => {
    Promise.all([
      api.get("/api/billing/status"),
      api.get("/api/billing/plans").catch(() => ({ data: [] })),
    ]).then(([statusRes, plansRes]) => {
      setBilling(statusRes.data);
      if (statusRes.data?.currentPlan === "ACCOUNTANT_PRO") {
        setRegisteredAs(USER_TYPES.ACCOUNTANT);
        setUserType(USER_TYPES.ACCOUNTANT);
      }
      // Build a plan → {amount, currency} lookup
      const pricing = {};
      (plansRes.data || []).forEach(p => { pricing[p.plan] = { amount: p.amount, currency: p.currency }; });
      setPlanPricing(pricing);
    })
    .catch(() => setToast({ visible: true, message: "Failed to load billing info", type: "error" }))
    .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planKey) => {
    try {
      setUpgrading(planKey);
      const res = await api.post("/api/billing/subscribe", { plan: planKey });
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        setToast({ visible: true, message: "Subscription updated!", type: "success" });
        setBilling(prev => ({ ...prev, plan: planKey, status: "ACTIVE" }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start subscription.";
      setToast({ visible: true, message: msg, type: "error" });
    } finally {
      setUpgrading(null);
    }
  };

  const handlePayManually = async (planKey) => {
    try {
      setUpgrading(planKey + "_manual");
      const res = await api.post("/api/billing/pay", { plan: planKey });
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to initialize payment.";
      setToast({ visible: true, message: msg, type: "error" });
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await api.post("/api/billing/cancel");
      setToast({ visible: true, message: "Subscription cancelled. You've been moved to the Free plan.", type: "success" });
      setBilling(prev => ({ ...prev, currentPlan: "FREE", subscriptionStatus: "CANCELLED", hasActiveSubscription: false }));
      setShowCancelConfirm(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cancel subscription.";
      setToast({ visible: true, message: msg, type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  const currentPlan = billing?.currentPlan ?? "FREE";
  const trialExpired = billing?.trialExpired ?? false;
  const currentStatus = trialExpired
    ? "EXPIRED"
    : (billing?.subscriptionStatus ?? (currentPlan === "FREE" ? "TRIAL" : "ACTIVE"));
  const isTrial = currentPlan === "FREE" && !trialExpired;

  const fmtPrice = (planKey) => {
    const p = planPricing[planKey];
    if (!p) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency: p.currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(p.amount);
    } catch {
      return `${p.currency} ${p.amount}`;
    }
  };

  const PLAN_DISPLAY = {
    FREE:           "Free Trial",
    STARTER:        "Essential",
    GROWTH:         "Business",
    PRO:            "Pro",
    ACCOUNTANT_PRO: "Accountant Pro",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          Billing & Subscription
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your plan and subscription.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : (
        <>
          {/* Current plan status banner */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{PLAN_DISPLAY[currentPlan] ?? currentPlan}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      currentStatus === "ACTIVE"  ? "bg-emerald-100 text-emerald-700" :
                      currentStatus === "TRIAL"   ? "bg-amber-100 text-amber-700" :
                      currentStatus === "EXPIRED" ? "bg-rose-100 text-rose-700" :
                                                    "bg-slate-100 text-slate-600"
                    }`}>
                      {currentStatus === "TRIAL" ? "Free Trial" : currentStatus === "EXPIRED" ? "Expired" : currentStatus}
                    </span>
                  </div>
                  {billing?.trialEndsAt && isTrial && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Trial ends {new Date(billing.trialEndsAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                  {billing?.trialEndsAt && !isTrial && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Renews {new Date(billing.trialEndsAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              {isTrial && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
                  <Zap size={15} />
                  Subscribe to keep access after your trial
                </div>
              )}
            </div>
          </div>

          {/* Cancel subscription — only shown for active paid plans */}
          {!isTrial && billing?.hasActiveSubscription && (
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
              <div>
                <p className="text-sm font-medium text-rose-800">Cancel subscription</p>
                <p className="text-xs text-rose-500 mt-0.5">You'll keep access until the end of your billing period, then move to the Free plan.</p>
              </div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="ml-4 shrink-0 px-4 py-2 text-sm font-medium text-rose-700 bg-white border border-rose-300 rounded-xl hover:bg-rose-50 transition-all"
              >
                Cancel plan
              </button>
            </div>
          )}

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">

            {/* FREE Trial */}
            <div className={`bg-white rounded-2xl border-2 border-dashed p-6 flex flex-col transition-all ${
              currentPlan === "FREE" ? "border-blue-400 ring-2 ring-blue-500/20" : "border-slate-200"
            }`}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-5 self-start border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Free Trial
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{currencySymbol}0</p>
              <p className="text-slate-500 text-sm mb-2">for 30 days</p>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Full access to every feature. No restrictions. No card needed.
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "All features unlocked",
                  "Unlimited invoices & clients",
                  "Owner capital tracking",
                  "Client payment portal",
                  "PDF export",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {currentPlan === "FREE" ? (
                  <div className="w-full text-center py-2.5 text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                    Current Plan
                  </div>
                ) : (
                  <div className="w-full text-center py-2.5 text-sm font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-xl">
                    Trial period
                  </div>
                )}
                <p className="text-center text-xs text-slate-400 mt-2">
                  Locks after 30 days
                </p>
              </div>
            </div>

            {/* STARTER → Essential */}
            <div className={`relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 shadow-2xl shadow-blue-600/40 flex flex-col ${
              currentPlan === "STARTER" ? "ring-4 ring-white/50" : ""
            }`}>
              <div className="inline-flex items-center px-3 py-1 bg-white/15 text-white text-xs font-bold rounded-full mb-5 self-start tracking-widest uppercase">
                Essential
              </div>
              <div className="mb-2 flex items-baseline flex-wrap gap-1">
                <span className="text-3xl font-extrabold text-white">{fmtPrice("STARTER") ?? "—"}</span>
                <span className="text-blue-200 text-sm">/month</span>
              </div>
              <p className="text-blue-200 text-xs mb-5">
                Best for small businesses and solo operators
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Invoicing & payments",
                  "Financial reports",
                  "Capital tracking",
                  "Up to 50 clients",
                  "Email reminders",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-200 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {currentPlan === "STARTER" ? (
                  <div className="w-full text-center py-2.5 text-sm font-semibold text-blue-700 bg-white rounded-xl">
                    Current Plan
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpgrade("STARTER")}
                      disabled={!!upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm disabled:opacity-50"
                    >
                      {upgrading === "STARTER" ? "Processing..." : <><CreditCard className="w-4 h-4" /> Card (auto-renew)</>}
                    </button>
                    <button
                      onClick={() => handlePayManually("STARTER")}
                      disabled={!!upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 text-white border border-white/30 font-medium rounded-xl hover:bg-white/30 transition-all text-sm disabled:opacity-50"
                    >
                      {upgrading === "STARTER_manual" ? "Processing..." : <><Building2 className="w-4 h-4" /> Pay by transfer</>}
                    </button>
                  </div>
                )}
                <p className="text-center text-xs text-blue-300 mt-2">Cancel anytime.</p>
              </div>
            </div>

            {/* GROWTH → Business */}
            <div className={`relative bg-slate-900 rounded-2xl border-2 p-6 flex flex-col transition-all mt-5 md:mt-6 ${
              currentPlan === "GROWTH" ? "border-indigo-400 ring-2 ring-indigo-500/30" : "border-slate-700"
            }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-900 text-xs font-bold rounded-full shadow-lg">
                  ⭐ Most Popular
                </span>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full mb-5 self-start border border-indigo-500/30 tracking-widest uppercase">
                Business
              </div>
              <div className="mb-2 flex items-baseline flex-wrap gap-1">
                <span className="text-3xl font-extrabold text-white">{fmtPrice("GROWTH") ?? "—"}</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-slate-400 text-xs mb-5">
                For growing businesses that need team collaboration
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Everything in Essential",
                  "Unlimited clients",
                  "Multi-user access",
                  "Advanced reports",
                  "Chart of Accounts",
                  "Journal Entries",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {currentPlan === "GROWTH" ? (
                  <div className="w-full text-center py-2.5 text-sm font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
                    Current Plan
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpgrade("GROWTH")}
                      disabled={!!upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm disabled:opacity-50"
                    >
                      {upgrading === "GROWTH" ? "Processing..." : <><CreditCard className="w-4 h-4" /> Card (auto-renew)</>}
                    </button>
                    <button
                      onClick={() => handlePayManually("GROWTH")}
                      disabled={!!upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 border border-slate-600 font-medium rounded-xl hover:bg-slate-700 transition-all text-sm disabled:opacity-50"
                    >
                      {upgrading === "GROWTH_manual" ? "Processing..." : <><Building2 className="w-4 h-4" /> Pay by transfer</>}
                    </button>
                  </div>
                )}
                <p className="text-center text-xs text-slate-500 mt-2">Cancel anytime.</p>
              </div>
            </div>

            {/* ACCOUNTANT_PRO — new */}
            <div className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-all ${
              currentPlan === "ACCOUNTANT_PRO" ? "border-violet-500 ring-2 ring-violet-500/20" : "border-violet-200"
            }`}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 text-xs font-bold rounded-full mb-5 self-start border border-violet-200 tracking-widest uppercase">
                <Calculator size={11} />
                Accountant Pro
              </div>
              <div className="mb-2 flex items-baseline flex-wrap gap-1">
                <span className="text-3xl font-extrabold text-slate-900">{fmtPrice("ACCOUNTANT_PRO") ?? "—"}</span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>
              <p className="text-slate-500 text-xs mb-5">
                Built for accountants managing multiple clients
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Everything in Business",
                  "✦ Expense reporting & claims",
                  "Receipt upload & approval flow",
                  "Audit Trail (full activity log)",
                  "VAT & WHT tracking (NRS)",
                  "Multi-business management",
                  "Team roles & permissions",
                  "Priority support",
                ].map(f => (
                  <li key={f} className={`flex items-start gap-2 text-xs ${f.startsWith("✦") ? "text-violet-700 font-semibold" : "text-slate-600"}`}>
                    <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${f.startsWith("✦") ? "text-violet-500" : "text-violet-400"}`} />
                    {f.replace("✦ ", "")}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {currentPlan === "ACCOUNTANT_PRO" ? (
                  <div className="w-full text-center py-2.5 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl">
                    Current Plan
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpgrade("ACCOUNTANT_PRO")}
                      disabled={!!upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 text-sm disabled:opacity-50"
                    >
                      {upgrading === "ACCOUNTANT_PRO" ? "Processing..." : <><CreditCard className="w-4 h-4" /> Card (auto-renew)</>}
                    </button>
                    <button
                      onClick={() => handlePayManually("ACCOUNTANT_PRO")}
                      disabled={!!upgrading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 font-medium rounded-xl hover:bg-violet-100 transition-all text-sm disabled:opacity-50"
                    >
                      {upgrading === "ACCOUNTANT_PRO_manual" ? "Processing..." : <><Building2 className="w-4 h-4" /> Pay by transfer</>}
                    </button>
                  </div>
                )}
                <p className="text-center text-xs text-slate-400 mt-2">Cancel anytime.</p>
              </div>
            </div>
          </div>

          {/* Flutterwave security trust line */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Secured by <span className="font-semibold text-slate-700">Flutterwave</span> — trusted payment platform
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Pay by card, bank transfer, or USSD
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
              Cancel anytime — no questions asked
            </div>
          </div>

          {/* Urgency + trust */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <span className="font-semibold text-amber-900">
                {billing?.daysLeftInTrial > 0
                  ? `Your trial ends in ${billing.daysLeftInTrial} day${billing.daysLeftInTrial === 1 ? "" : "s"}`
                  : "Your trial has ended"}
              </span> — continue only if it's valuable to you. Nothing is deleted. Subscribe and pick up exactly where you left off.
            </p>
          </div>

          <p className="text-center text-sm text-slate-400 font-medium tracking-wide pb-4">
            LumiLedger — Your business finances, simplified.
          </p>
        </>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Cancel your subscription?</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your plan will stay active until the end of the current billing period. After that, your account will move to the Free plan and some features will be restricted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Keep plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

export default Billing;
