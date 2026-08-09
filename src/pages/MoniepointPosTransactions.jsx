import { useState, useEffect, useMemo } from "react";
import { CreditCard, RefreshCw, Search, ArrowUpRight, CheckCircle2, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";

const STATUS_STYLES = {
  SUCCESSFUL: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  APPROVED:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PENDING:    "bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400",
  FAILED:     "bg-rose-100    text-rose-700    dark:bg-rose-900/30    dark:text-rose-400",
};

export default function MoniepointPosTransactions() {
  const { fmt, fmtDate } = useOrg();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing]     = useState(false);
  const [toast, setToast]               = useState({ visible: false, message: "", type: "info" });

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get("/api/moniepoint-pos/transactions");
      setTransactions(res.data || []);
    } catch {
      setToast({ visible: true, message: "Failed to load transactions.", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const statusFilters = useMemo(
    () => ["ALL", ...new Set(transactions.map(tx => tx.transactionStatus).filter(Boolean))],
    [transactions]
  );

  const filtered = transactions.filter(tx => {
    const matchesStatus = statusFilter === "ALL" || tx.transactionStatus === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      (tx.transactionReference || "").toLowerCase().includes(q) ||
      (tx.merchantReference    || "").toLowerCase().includes(q) ||
      (tx.terminalSerial       || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalReceived = transactions.reduce((s, tx) => s + (tx.amount || 0), 0);
  const successCount   = transactions.filter(tx => ["SUCCESSFUL", "APPROVED"].includes(tx.transactionStatus)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Moniepoint POS Sales</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Sales taken on your Moniepoint POS terminal — auto-recorded
            </p>
          </div>
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 px-3 py-2 rounded-xl transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Stat cards */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/40 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/40 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">Total Received</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{fmt(totalReceived)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Successful</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{successCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference or terminal…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
          />
        </div>

        {statusFilters.length > 1 && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-1">
            {statusFilters.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} ·{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {fmt(filtered.reduce((s, tx) => s + (tx.amount || 0), 0))}
            </span>
          </p>
        )}
      </div>

      {/* Main table card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-slate-600 border-t-green-500" />
          </div>

        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-green-400 dark:text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Moniepoint POS sales yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                Connect your Moniepoint POS webhook to start recording terminal sales automatically.
              </p>
            </div>
            <Link
              to="/settings/org"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Go to Payment Settings
            </Link>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No transactions match your filters.</p>
            <button
              onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
              className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline"
            >
              Clear filters
            </button>
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Terminal</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Reference</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20 transition">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800 dark:text-slate-100 leading-tight">
                        {tx.terminalSerial || "Unknown"}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <code className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                        {tx.transactionReference || "—"}
                      </code>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tx.transactionType || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {tx.transactionTime ? fmtDate(tx.transactionTime) : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[tx.transactionStatus] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                        {tx.transactionStatus || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{fmt(tx.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
