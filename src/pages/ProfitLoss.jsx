// ProfitLoss.jsx — Accounting > Reports > Profit & Loss
import { useState } from "react";
import api from "../services/api";
import { TrendingUp, TrendingDown, RefreshCw, AlertTriangle, Download, Info } from "lucide-react";
import { useOrg } from "../context/OrgContext";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
};

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

function AccountTable({ rows, emptyText }) {
  const { fmt } = useOrg();
  if (!rows || rows.length === 0) {
    return <p className="px-6 py-6 text-sm text-slate-400 text-center">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Name</th>
          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
        {rows.map((row) => (
          <tr key={row.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
            <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{row.code}</td>
            <td className="px-6 py-3 text-slate-800 dark:text-slate-100 font-medium">{row.name}</td>
            <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">{fmt(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function ProfitLoss() {
  const { fmt } = useOrg();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  const exportReport = async (format) => {
    setDownloading(format);
    try {
      const res = await api.get(`/api/accounting/reports/profit-loss/export?format=${format}&from=${from}&to=${to}`, { responseType: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(res.data);
      link.download = `profit-loss.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setDownloading(null);
    }
  };

  const generate = () => {
    setError("");
    setLoading(true);
    api.get(`/api/accounting/reports/profit-loss?from=${from}&to=${to}`)
      .then(res => setData(res.data))
      .catch(() => setError("Failed to load report. Please try again."))
      .finally(() => setLoading(false));
  };

  const isProfit = data && data.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Profit &amp; Loss
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Income vs expenses over a selected period.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 rounded-xl">
        <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Shows all income and expenses over a period. <strong>Net Profit = Total Income − Total Expenses.</strong> Income accounts are credit-normal; expense accounts are debit-normal.
        </p>
      </div>

      {/* Date range + generate */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-col gap-4">
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "This Month", fn: () => { const d = new Date(); setFrom(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`); setTo(today()); } },
              { label: "This Year",  fn: () => { setFrom(`${new Date().getFullYear()}-01-01`); setTo(today()); } },
              { label: "Last Year",  fn: () => { const y = new Date().getFullYear()-1; setFrom(`${y}-01-01`); setTo(`${y}-12-31`); } },
              { label: "All Time",   fn: () => { setFrom("2000-01-01"); setTo(today()); } },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition">
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data && (
              <>
                <button
                  onClick={() => exportReport("pdf")}
                  disabled={downloading !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm disabled:opacity-50"
                >
                  {downloading === "pdf"
                    ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    : <Download size={14} />}
                  PDF
                </button>
                <button
                  onClick={() => exportReport("csv")}
                  disabled={downloading !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm disabled:opacity-50"
                >
                  {downloading === "csv"
                    ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    : <Download size={14} />}
                  CSV
                </button>
              </>
            )}
            <button
              onClick={generate}
              disabled={loading || !from || !to}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span className="text-sm text-rose-700 dark:text-rose-300">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
        </div>
      )}

      {/* Report */}
      {!loading && data && (
        <>
          {/* Period label */}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing results from{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">{fmtDate(data.from)}</span>
            {" "}to{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">{fmtDate(data.to)}</span>
          </p>

          {/* Income */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/60 dark:bg-emerald-900/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Income</h2>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmt(data.totalIncome)}</span>
            </div>
            <AccountTable rows={data.incomeRows} emptyText="No income recorded for this period." />
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Income</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(data.totalIncome)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-rose-50/60 dark:bg-rose-900/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Expenses</h2>
              </div>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{fmt(data.totalExpenses)}</span>
            </div>
            <AccountTable rows={data.expenseRows} emptyText="No expenses recorded for this period." />
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Expenses</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{fmt(data.totalExpenses)}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Summary</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Income</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(data.totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Expenses</span>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">({fmt(data.totalExpenses)})</span>
              </div>
              <div className={`flex items-center justify-between px-6 py-5 ${isProfit ? "bg-emerald-50/60 dark:bg-emerald-900/10" : "bg-rose-50/60 dark:bg-rose-900/10"}`}>
                <div className="flex items-center gap-2">
                  {isProfit
                    ? <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    : <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                  <span className={`text-base font-bold ${isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                    {isProfit ? "Net Profit" : "Net Loss"}
                  </span>
                </div>
                <span className={`text-xl font-bold ${isProfit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                  {fmt(Math.abs(data.netProfit))}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state before first generate */}
      {!loading && !data && !error && (
        <div className="text-center py-20">
          <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Select a date range and click <span className="font-medium">Generate Report</span>.</p>
        </div>
      )}
    </div>
  );
}

export default ProfitLoss;
