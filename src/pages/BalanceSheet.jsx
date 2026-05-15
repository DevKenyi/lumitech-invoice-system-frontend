// BalanceSheet.jsx — Accounting > Reports > Balance Sheet
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { LayoutList, CheckCircle, AlertTriangle, RefreshCw, Download, Info } from "lucide-react";
import { useOrg } from "../context/OrgContext";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
};

const today = () => new Date().toISOString().slice(0, 10);

function SubSection({ label, rows, total, totalLabel, accentColor }) {
  const { fmt } = useOrg();
  if (!rows || rows.length === 0) return null;
  return (
    <div className="mb-1">
      <p className={`px-6 py-2 text-xs font-semibold uppercase tracking-wider ${accentColor} border-b border-slate-100 dark:border-slate-700/60`}>
        {label}
      </p>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {rows.map((row) => (
            <tr key={row.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
              <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 w-24">{row.code}</td>
              <td className="px-6 py-3 text-slate-800 dark:text-slate-100">{row.name}</td>
              <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">{fmt(row.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 dark:border-slate-600">
            <td colSpan={2} className="px-6 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{totalLabel}</td>
            <td className="px-6 py-2.5 text-right text-sm font-bold text-slate-700 dark:text-slate-200">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}

function SectionCard({ title, headerStyle, children, total, totalLabel, totalStyle }) {
  const { fmt } = useOrg();
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700 ${headerStyle}`}>
        <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
      </div>
      {children}
      <div className={`flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-600 ${totalStyle}`}>
        <span className="text-xs font-bold uppercase tracking-wide">{totalLabel}</span>
        <span className="text-base font-bold">{fmt(total)}</span>
      </div>
    </div>
  );
}

function BalanceSheet() {
  const { fmt } = useOrg();
  const [asOf, setAsOf] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  const exportReport = async (format) => {
    setDownloading(format);
    try {
      const res = await api.get(`/api/accounting/reports/balance-sheet/export?format=${format}&asOf=${asOf}`, { responseType: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(res.data);
      link.download = `balance-sheet.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setDownloading(null);
    }
  };

  const fetchReport = useCallback((date) => {
    setLoading(true);
    setError("");
    api.get(`/api/accounting/reports/balance-sheet?asOf=${date}`)
      .then(res => setData(res.data))
      .catch(() => setError("Failed to load report. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReport(asOf); }, []);

  const handleDateChange = (e) => {
    setAsOf(e.target.value);
    fetchReport(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutList className="w-6 h-6 text-blue-600" />
            Balance Sheet
          </h1>
          {data?.asOf && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              As of <span className="font-medium text-slate-700 dark:text-slate-300">{fmtDate(data.asOf)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReport("pdf")}
            disabled={!data || downloading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-50"
          >
            {downloading === "pdf"
              ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              : <Download size={14} />}
            PDF
          </button>
          <button
            onClick={() => exportReport("csv")}
            disabled={!data || downloading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-50"
          >
            {downloading === "csv"
              ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              : <Download size={14} />}
            CSV
          </button>
          <button
            onClick={() => fetchReport(asOf)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 rounded-xl">
        <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          A snapshot of your financial position at a point in time. <strong>Assets = Liabilities + Equity.</strong> Change the date to see the balance sheet as of any past date.
        </p>
      </div>

      {/* As-of date picker */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="sm:w-64">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">As of Date</label>
            <input
              type="date"
              value={asOf}
              onChange={handleDateChange}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 pb-2.5">Report updates automatically when you change the date.</p>
        </div>
      </div>

      {/* Balance status */}
      {data && (
        data.balanced ? (
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Balanced — Total Assets equals Total Liabilities + Equity.</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">Out of Balance — Assets do not equal Liabilities + Equity.</span>
          </div>
        )
      )}

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

      {/* Report sections */}
      {!loading && data && (
        <>
          {/* ASSETS */}
          <SectionCard
            title="Assets"
            headerStyle="bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300"
            total={data.totalAssets}
            totalLabel="Total Assets"
            totalStyle="bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300"
          >
            <SubSection
              label="Non-Current Assets"
              rows={data.nonCurrentAssetRows}
              total={data.totalNonCurrentAssets}
              totalLabel="Total Non-Current Assets"
              accentColor="text-emerald-600 dark:text-emerald-400"
            />
            <SubSection
              label="Current Assets"
              rows={data.currentAssetRows}
              total={data.totalCurrentAssets}
              totalLabel="Total Current Assets"
              accentColor="text-emerald-600 dark:text-emerald-400"
            />
          </SectionCard>

          {/* LIABILITIES */}
          <SectionCard
            title="Liabilities"
            headerStyle="bg-rose-50/60 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300"
            total={data.totalLiabilities}
            totalLabel="Total Liabilities"
            totalStyle="bg-rose-50/60 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300"
          >
            <SubSection
              label="Non-Current Liabilities"
              rows={data.nonCurrentLiabilityRows}
              total={data.totalNonCurrentLiabilities}
              totalLabel="Total Non-Current Liabilities"
              accentColor="text-rose-600 dark:text-rose-400"
            />
            <SubSection
              label="Current Liabilities"
              rows={data.currentLiabilityRows}
              total={data.totalCurrentLiabilities}
              totalLabel="Total Current Liabilities"
              accentColor="text-rose-600 dark:text-rose-400"
            />
          </SectionCard>

          {/* EQUITY */}
          <SectionCard
            title="Equity"
            headerStyle="bg-purple-50/60 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300"
            total={data.totalEquity}
            totalLabel="Total Equity"
            totalStyle="bg-purple-50/60 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300"
          >
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {(data.equityRows ?? []).map((row) => (
                  <tr key={row.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 w-24">{row.code}</td>
                    <td className="px-6 py-3 text-slate-800 dark:text-slate-100">{row.name}</td>
                    <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">{fmt(row.amount)}</td>
                  </tr>
                ))}
                {data.retainedEarnings != null && (
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">—</td>
                    <td className="px-6 py-3 text-slate-800 dark:text-slate-100 italic">Retained Earnings</td>
                    <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">{fmt(data.retainedEarnings)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </SectionCard>

          {/* Summary */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Summary</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Assets</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmt(data.totalAssets)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Liabilities</span>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">{fmt(data.totalLiabilities)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Equity</span>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{fmt(data.totalEquity)}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Liabilities + Equity</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{fmt(data.totalLiabilitiesAndEquity)}</span>
              </div>
              <div className={`flex items-center justify-between px-6 py-5 ${data.balanced ? "bg-emerald-50/60 dark:bg-emerald-900/10" : "bg-rose-50/60 dark:bg-rose-900/10"}`}>
                <div className="flex items-center gap-2">
                  {data.balanced
                    ? <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    : <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                  <span className={`text-sm font-bold ${data.balanced ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                    {data.balanced ? "Balanced" : "Out of Balance"}
                  </span>
                </div>
                {!data.balanced && (
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    Difference: {fmt(Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BalanceSheet;
