import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const PLAN_LABEL = {
  FREE: "Free", STARTER: "Essential", GROWTH: "Business", PRO: "Pro", ACCOUNTANT_PRO: "Accountant Pro",
};

export default function CommissionPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE}/api/public/commission/${token}`)
      .then(r => setData(r.data))
      .catch(() => setError("Invalid or expired link."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Link not found</p>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const currency = data.recentPayments?.[0]?.currency || "NGN";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Lumi<span className="text-blue-600">Ledger</span>
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Business Manager Earnings</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            data.active
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${data.active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {data.active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">{data.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{data.email}</p>
              {data.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{data.phone}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Referral Code</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono tracking-wider">{data.referralCode}</p>
              <p className="text-xs text-slate-400 mt-0.5">{(data.commissionRate * 100).toFixed(1)}% commission rate</p>
            </div>
          </div>
        </div>

        {/* Earnings summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: data.totalClients, mono: false, color: "text-slate-900 dark:text-white" },
            { label: "Revenue Generated", value: `${currency} ${fmt(data.totalRevenue)}`, mono: true, color: "text-slate-900 dark:text-white" },
            { label: "Commission Earned", value: `${currency} ${fmt(data.totalCommissionEarned)}`, mono: true, color: "text-blue-600 dark:text-blue-400" },
            { label: "Pending Payout", value: `${currency} ${fmt(data.totalCommissionPending)}`, mono: true, color: data.totalCommissionPending > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400" },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{card.label}</p>
              <p className={`text-xl font-bold ${card.color} ${card.mono ? "font-mono tabular-nums" : ""} leading-tight`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Referred clients */}
        {data.clients?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Referred Clients ({data.clients.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organisation</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Signed Up</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commission</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.clients.map(c => (
                    <tr key={c.orgId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{c.orgName}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {PLAN_LABEL[c.plan] || c.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{fmtDate(c.signedUpAt)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">{fmt(c.totalRevenue)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{fmt(c.totalCommission)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          c.hasActiveSub
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${c.hasActiveSub ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {c.hasActiveSub ? "Active" : "Free"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent payments */}
        {data.recentPayments?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Commission Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/40">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commission</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.recentPayments.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{r.orgName}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{PLAN_LABEL[r.plan] || r.plan}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{fmtDate(r.paymentDate)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">{r.currency} {fmt(r.paymentAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{r.currency} {fmt(r.commissionAmount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          r.payoutStatus === "PAID"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        }`}>
                          {r.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.clients?.length === 0 && data.recentPayments?.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-6 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No referred clients yet.</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Share your referral link: <span className="font-mono font-semibold text-blue-600">?ref={data.referralCode}</span></p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-4">
          Powered by LumiLedger &mdash; lumitechsystems.com
        </p>
      </div>
    </div>
  );
}
