import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Users, TrendingUp, Clock, CheckCircle, Gift, Copy, Share2, Link2,
  ChevronDown, ChevronUp, AlertCircle, ArrowRight,
} from "lucide-react";

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

const STATUS_STYLE = {
  ACTIVE:    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  EXPIRED:   "bg-slate-100 dark:bg-slate-700 text-slate-500",
  SUSPENDED: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  PENDING:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  PAID:      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  APPROVED:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  REJECTED:  "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};

function Badge({ status }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status] || STATUS_STYLE.PENDING}`}>
      {status}
    </span>
  );
}

const MIN_PAYOUT = 5000;

export default function ReferralDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("referrals");
  const [copied, setCopied] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    api.get("/api/referrals/dashboard")
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(data.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `Join LumiLedger — the smart accounting app for Nigerian businesses.\n\nSign up with my referral link and get started free:\n${data.referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Try LumiLedger — Smart Accounting for Your Business");
    const body = encodeURIComponent(
      `Hi,\n\nI've been using LumiLedger for my business accounting and thought you'd find it useful.\n\nSign up free using my referral link:\n${data.referralLink}\n\nBest regards`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const requestPayout = async () => {
    setPayoutError("");
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount < MIN_PAYOUT) {
      setPayoutError(`Minimum withdrawal is ₦${MIN_PAYOUT.toLocaleString()}`);
      return;
    }
    const available = parseFloat(data.availableBalance ?? 0);
    if (amount > available) {
      setPayoutError(`Amount exceeds available balance of ₦${fmt(available)}`);
      return;
    }
    setPayoutLoading(true);
    try {
      await api.post("/api/referrals/payout/request", { amount, notes: payoutNotes || null });
      setPayoutSuccess(true);
      setPayoutAmount("");
      setPayoutNotes("");
      // Refresh dashboard
      const r = await api.get("/api/referrals/dashboard");
      setData(r.data);
      setTimeout(() => setPayoutSuccess(false), 4000);
    } catch (e) {
      setPayoutError(e.response?.data?.message || "Failed to submit payout request.");
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const TABS = [
    { id: "referrals",   label: "Referrals",         count: data.referrals?.length },
    { id: "commissions", label: "Commission History", count: data.recentCommissions?.length },
    { id: "payouts",     label: "Payout History",     count: data.payoutHistory?.length },
    { id: "withdraw",    label: "Request Payout" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-blue-600" />
          Referral Programme
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Earn {data ? `${(data.commissionRate * 100).toFixed(0)}%` : "—"} commission for every business you refer that subscribes — for up to 12 months.
        </p>
      </div>

      {/* Referral link card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">Your Referral Link</p>
        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 mb-4">
          <Link2 size={14} className="text-blue-200 flex-shrink-0" />
          <p className="flex-1 text-sm font-mono truncate text-white">{data.referralLink}</p>
          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full text-blue-100">
            {data.referralCode}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 text-sm font-semibold hover:bg-blue-50 transition"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={shareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <Share2 size={14} />
            WhatsApp
          </button>
          <button
            onClick={shareEmail}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition"
          >
            <Share2 size={14} />
            Email
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users}       label="Total Referrals"    value={data.totalReferrals}    color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Active Referrals"   value={data.activeReferrals}   color="bg-emerald-500" />
        <StatCard icon={TrendingUp}  label="Total Earned"       value={`₦${fmt(data.totalEarnings)}`}       color="bg-indigo-500" />
        <StatCard icon={Clock}       label="Pending Payout"     value={`₦${fmt(data.pendingEarnings)}`}     color="bg-amber-500" />
        <StatCard icon={CheckCircle} label="Paid Out"           value={`₦${fmt(data.paidEarnings)}`}        color="bg-green-600" />
        <StatCard icon={Gift}        label="This Month"         value={`₦${fmt(data.earningsThisMonth)}`}   color="bg-violet-500" />
      </div>

      {/* Available balance highlight */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Available for Withdrawal</p>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
            ₦{fmt(data.availableBalance)}
          </p>
        </div>
        <button
          onClick={() => setActiveTab("withdraw")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Withdraw <ArrowRight size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === t.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Referrals tab ──────────────────────────────────────────────────── */}
      {activeTab === "referrals" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {data.referrals.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No referrals yet.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Share your link above to start earning.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Referred On</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Commission Until</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.referrals.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900 dark:text-white">{r.orgName}</p>
                        <p className="text-xs text-slate-400">{r.orgEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{fmtDate(r.referralDate)}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{fmtDate(r.commissionEndDate)}</td>
                      <td className="px-5 py-3.5"><Badge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Commission History tab ─────────────────────────────────────────── */}
      {activeTab === "commissions" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {data.recentCommissions.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingUp className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No commissions earned yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Commission ({data ? `${(data.commissionRate * 100).toFixed(0)}%` : ""})</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.recentCommissions.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{c.orgName}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{fmtDate(c.paymentDate)}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">₦{fmt(c.paymentAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">₦{fmt(c.commissionAmount)}</td>
                      <td className="px-5 py-3.5 text-center"><Badge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Payout History tab ─────────────────────────────────────────────── */}
      {activeTab === "payouts" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {data.payoutHistory.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No payouts yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Requested</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid On</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.payoutHistory.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{fmtDate(p.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">₦{fmt(p.amount)}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{fmtDate(p.payoutDate)}</td>
                      <td className="px-5 py-3.5 text-center"><Badge status={p.payoutStatus} /></td>
                      <td className="px-5 py-3.5 text-slate-400 dark:text-slate-500 text-xs">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Request Payout tab ─────────────────────────────────────────────── */}
      {activeTab === "withdraw" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Request Payout</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Available: <span className="font-semibold text-emerald-600 dark:text-emerald-400">₦{fmt(data.availableBalance)}</span> · Minimum: ₦5,000
          </p>

          {payoutSuccess && (
            <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              Payout request submitted. Our team will process it within 2 business days.
            </div>
          )}

          {payoutError && (
            <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {payoutError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Amount (₦)</label>
              <input
                type="number"
                min={MIN_PAYOUT}
                step="100"
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Bank Details / Notes <span className="text-slate-400">(optional)</span></label>
              <textarea
                rows={3}
                value={payoutNotes}
                onChange={e => setPayoutNotes(e.target.value)}
                placeholder="Bank name, account number, account name…"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              onClick={requestPayout}
              disabled={payoutLoading}
              className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {payoutLoading ? "Submitting…" : "Submit Payout Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
