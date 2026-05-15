import { useState, useCallback } from "react";
import api from "../services/api";
import {
  TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const AmountCell = ({ value, bold = false, fmt }) => {
  const positive = (value ?? 0) >= 0;
  return (
    <span
      className={`flex items-center justify-end gap-1 ${bold ? "font-bold" : "font-semibold"} ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {fmt(value)}
    </span>
  );
};

const SectionCard = ({ title, inflow, outflow, net, colorAccent, fmt }) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden`}
  >
    <div className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 ${colorAccent}`}>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
    </div>
    <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
      {[
        { label: "Inflow", value: inflow },
        { label: "Outflow", value: outflow },
        { label: "Net", value: net },
      ].map(({ label, value }) => (
        <div key={label} className="p-4">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <AmountCell value={value} bold={label === "Net"} fmt={fmt} />
        </div>
      ))}
    </div>
  </div>
);

const CATEGORIES_ORDER = ["Operating", "Investing", "Financing"];

export default function CashFlowStatement() {
  const { fmt } = useOrg();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "error") =>
    setToast({ visible: true, message, type });

  const generate = useCallback(async () => {
    if (!from || !to) {
      notify("Please select both a start and end date.", "error");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const res = await api.get(
        `/api/accounting/reports/cash-flow?from=${from}&to=${to}`
      );
      setReport(res.data);
      // Default: all categories collapsed
      const cats = [
        ...new Set((res.data.lines || []).map((l) => l.category)),
      ];
      setExpandedCategories(Object.fromEntries(cats.map((c) => [c, false])));
    } catch (err) {
      notify(
        err.response?.data?.message || "Failed to generate cash flow statement.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const toggleCategory = (cat) =>
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // Group lines by category preserving a canonical order
  const groupedLines = report
    ? (() => {
        const map = {};
        (report.lines || []).forEach((line) => {
          if (!map[line.category]) map[line.category] = [];
          map[line.category].push(line);
        });
        // Return in canonical order then any extras
        const orderedKeys = [
          ...CATEGORIES_ORDER.filter((c) => map[c]),
          ...Object.keys(map).filter((c) => !CATEGORIES_ORDER.includes(c)),
        ];
        return orderedKeys.map((cat) => ({ cat, lines: map[cat] }));
      })()
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Cash Flow Statement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Operating, investing, and financing cash movements for a period
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <RefreshCw size={18} className="animate-spin" /> Generating report…
        </div>
      )}

      {/* Empty state */}
      {!loading && !report && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <TrendingUp size={40} className="opacity-20" />
          <p className="text-sm">Select a date range and click Generate to view the cash flow statement.</p>
        </div>
      )}

      {/* Report */}
      {!loading && report && (
        <div className="space-y-4">
          {/* Period label */}
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
            Period: {report.from} — {report.to}
          </p>

          {/* Section cards */}
          <div className="grid grid-cols-1 gap-4">
            <SectionCard title="Operating Activities" inflow={report.operatingInflow} outflow={report.operatingOutflow} net={report.operatingNet} colorAccent="bg-emerald-50 dark:bg-emerald-900/10" fmt={fmt} />
            <SectionCard title="Investing Activities" inflow={report.investingInflow} outflow={report.investingOutflow} net={report.investingNet} colorAccent="bg-blue-50 dark:bg-blue-900/10" fmt={fmt} />
            <SectionCard title="Financing Activities" inflow={report.financingInflow} outflow={report.financingOutflow} net={report.financingNet} colorAccent="bg-violet-50 dark:bg-violet-900/10" fmt={fmt} />
          </div>

          {/* Summary row */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Cash Summary
              </h3>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
              {[
                { label: "Opening Cash", value: report.openingCash },
                { label: "Net Cash Change", value: report.netCashChange },
                { label: "Closing Cash", value: report.closingCash },
              ].map(({ label, value }) => (
                <div key={label} className="p-4">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <AmountCell value={value} bold fmt={fmt} />
                </div>
              ))}
            </div>
          </div>

          {/* Detail table */}
          {groupedLines.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Line Detail
                </h3>
              </div>

              {groupedLines.map(({ cat, lines }) => {
                const isOpen = !!expandedCategories[cat];
                return (
                  <div key={cat} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                    {/* Category header row */}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition text-left"
                    >
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {cat} Activities
                      </span>
                      <span className="text-slate-400">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>

                    {/* Lines */}
                    {isOpen && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs text-slate-400 uppercase tracking-wider">
                              <th className="px-5 py-2.5">Account Code</th>
                              <th className="px-4 py-2.5">Account Name</th>
                              <th className="px-4 py-2.5 text-right">Inflow</th>
                              <th className="px-4 py-2.5 text-right">Outflow</th>
                              <th className="px-4 py-2.5 text-right">Net</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {lines.map((line, i) => (
                              <tr
                                key={i}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
                              >
                                <td className="px-5 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                                  {line.accountCode}
                                </td>
                                <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                                  {line.accountName}
                                </td>
                                <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                  {fmt(line.inflow)}
                                </td>
                                <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400 font-medium">
                                  {fmt(line.outflow)}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <AmountCell value={line.net} fmt={fmt} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
