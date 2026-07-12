import { useState, useEffect } from "react";
import { Banknote, RefreshCw, Search } from "lucide-react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";

const STATUS_STYLES = {
  PAID:         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  OVERPAID:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function MonnifyTransactions() {
  const { fmt, fmtDate } = useOrg();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/monnify/transactions");
      setTransactions(res.data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase();
    return (
      (tx.customerName || "").toLowerCase().includes(q) ||
      (tx.customerEmail || "").toLowerCase().includes(q) ||
      (tx.paymentReference || "").toLowerCase().includes(q) ||
      (tx.paymentDescription || "").toLowerCase().includes(q)
    );
  });

  const total = filtered.reduce((sum, tx) => sum + (tx.amountPaid || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Monnify Transactions</h1>
            <p className="text-xs text-slate-400">Payments received on your Moniepoint account — auto-recorded</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search + summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or reference…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
          />
        </div>
        {filtered.length > 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} · <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(total)}</span> total
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-4 border-slate-200 dark:border-slate-600 border-t-green-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Banknote className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {search ? "No transactions match your search." : "No Monnify transactions recorded yet."}
            </p>
            {!search && (
              <p className="text-xs text-slate-400">
                Connect your Monnify account in Settings → Payment Settings to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{tx.customerName || "—"}</p>
                      {tx.customerEmail && (
                        <p className="text-xs text-slate-400 mt-0.5">{tx.customerEmail}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">{tx.paymentReference}</code>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="text-slate-600 dark:text-slate-300 text-xs truncate">{tx.paymentDescription || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {tx.paidOn ? fmtDate(tx.paidOn) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tx.paymentStatus] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(tx.amountPaid)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
