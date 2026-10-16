// DateRangeFilter — shared preset + custom date-range picker. Keys match the backend's
// DateRangeParams.resolve() presets exactly (today/yesterday/last7/last30/thisMonth/lastMonth/custom)
// so callers can pass `range` straight through as a query param instead of computing from/to
// themselves. No equivalent shared component existed before this — every report page previously
// reimplemented its own from/to handling (see ProfitLoss.jsx, TaxReport.jsx for the prior pattern).
import { useState } from "react";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
];

const isoToday = () => new Date().toISOString().slice(0, 10);

/** onChange receives { range, from, to } — `from`/`to` are only meaningful when range === "custom". */
export default function DateRangeFilter({ value, onChange }) {
  const range = value?.range || "last30";
  const [customFrom, setCustomFrom] = useState(value?.from || isoToday());
  const [customTo, setCustomTo] = useState(value?.to || isoToday());

  const pick = (key) => onChange({ range: key });
  const applyCustom = () => onChange({ range: "custom", from: customFrom, to: customTo });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.key} onClick={() => pick(p.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              range === p.key
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300"
            }`}>
            {p.label}
          </button>
        ))}
        <button onClick={() => pick("custom")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            range === "custom"
              ? "bg-blue-600 border-blue-600 text-white"
              : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300"
          }`}>
          Custom range
        </button>
      </div>

      {range === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">From</label>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">To</label>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
          </div>
          <button onClick={applyCustom}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
