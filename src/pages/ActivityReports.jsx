import { useEffect, useMemo, useState } from "react";
import api, { getUserFromToken } from "../services/api";
import {
  ClipboardList, Save, Download, ChevronDown, ChevronRight, Lock, X,
} from "lucide-react";
import Toast from "../components/Toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIELDS = [
  { key: "customersContacted", label: "Customers Contacted", type: "number" },
  { key: "followUpCalls",      label: "Follow-up Calls",     type: "number" },
  { key: "issuesResolved",     label: "Issues Resolved",     type: "number" },
  { key: "outstandingIssues",  label: "Outstanding Issues",  type: "number" },
  { key: "customerFeedback",   label: "Customer Feedback",   type: "text" },
  { key: "featureRequests",    label: "Feature Requests",    type: "text" },
  { key: "bugsIdentified",     label: "Bugs Identified",     type: "text" },
  { key: "atRiskCustomers",    label: "At-Risk Customers",   type: "text" },
  { key: "recommendations",    label: "Recommendations",     type: "text" },
];

const emptyForm = () => ({
  customersContacted: "", followUpCalls: "", issuesResolved: "", outstandingIssues: "",
  customerFeedback: "", featureRequests: "", bugsIdentified: "", atRiskCustomers: "", recommendations: "",
});

const weekRangeLabel = (weekStartDate) => {
  if (!weekStartDate) return "";
  const start = new Date(weekStartDate + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const csvEscape = (v) => {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function downloadCsv(rows) {
  const header = ["Staff", "Week", ...FIELDS.map(f => f.label)];
  const lines = [header.map(csvEscape).join(",")];
  rows.forEach(r => {
    lines.push([
      r.submittedByName, weekRangeLabel(r.weekStartDate),
      ...FIELDS.map(f => r[f.key]),
    ].map(csvEscape).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ActivityReports({ view }) {
  const userInfo = getUserFromToken();
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  if (view === "manage") return <ManageView showToast={showToast} toast={toast} setToast={setToast} />;
  return <SubmitView userInfo={userInfo} showToast={showToast} toast={toast} setToast={setToast} />;
}

// ── Staff: submit weekly report ────────────────────────────────────────────────

function SubmitView({ showToast, toast, setToast }) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [current, setCurrent]   = useState(null);
  const [form, setForm]         = useState(emptyForm());
  const [history, setHistory]   = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchCurrent();
    fetchHistory();
  }, []);

  const fetchCurrent = async () => {
    try {
      setLoading(true);
      const r = await api.get("/api/activity-reports/current");
      setCurrent(r.data);
      setForm({
        customersContacted: r.data.customersContacted ?? "",
        followUpCalls: r.data.followUpCalls ?? "",
        issuesResolved: r.data.issuesResolved ?? "",
        outstandingIssues: r.data.outstandingIssues ?? "",
        customerFeedback: r.data.customerFeedback || "",
        featureRequests: r.data.featureRequests || "",
        bugsIdentified: r.data.bugsIdentified || "",
        atRiskCustomers: r.data.atRiskCustomers || "",
        recommendations: r.data.recommendations || "",
      });
    } catch {
      showToast("Failed to load this week's report", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const r = await api.get("/api/activity-reports");
      setHistory((r.data || []).filter(rep => !rep.editable));
    } catch {}
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const body = {
        ...form,
        customersContacted: Number(form.customersContacted) || 0,
        followUpCalls: Number(form.followUpCalls) || 0,
        issuesResolved: Number(form.issuesResolved) || 0,
        outstandingIssues: Number(form.outstandingIssues) || 0,
      };
      const r = await api.put("/api/activity-reports/current", body);
      setCurrent(r.data);
      showToast("Weekly report saved");
    } catch {
      showToast("Failed to save report", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Toast {...toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Weekly Activity Report
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Week of {weekRangeLabel(current?.weekStartDate)}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.filter(f => f.type === "number").map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{f.label}</label>
              <input
                type="number" min="0" inputMode="numeric"
                value={form[f.key]}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {FIELDS.filter(f => f.type === "text").map(f => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{f.label}</label>
            <textarea
              rows={2}
              value={form[f.key]}
              onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
              className={inputCls}
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow shadow-blue-600/25 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:hover:scale-100"
        >
          <Save size={14} /> {saving ? "Saving..." : "Save Report"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Past Reports</h2>
          {history.map(rep => (
            <div key={rep.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === rep.id ? null : rep.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Lock size={12} className="text-slate-400" /> Week of {weekRangeLabel(rep.weekStartDate)}
                </span>
                {expanded === rep.id ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
              </button>
              {expanded === rep.id && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                  {FIELDS.map(f => (
                    <div key={f.key} className="text-sm">
                      <span className="text-slate-400">{f.label}: </span>
                      <span className="text-slate-700 dark:text-slate-200">{rep[f.key] ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin: review all staff reports ────────────────────────────────────────────

function ManageView({ showToast, toast, setToast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState("");
  const [weekFilter, setWeekFilter]   = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const r = await api.get("/api/activity-reports");
      setReports(r.data || []);
    } catch {
      showToast("Failed to load activity reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const staffOptions = useMemo(() => (
    [...new Map(reports.map(r => [r.submittedById, r.submittedByName])).entries()]
  ), [reports]);

  const weekOptions = useMemo(() => (
    [...new Set(reports.map(r => r.weekStartDate))].sort().reverse()
  ), [reports]);

  const filtered = reports.filter(r =>
    (!staffFilter || r.submittedById === staffFilter) &&
    (!weekFilter || r.weekStartDate === weekFilter)
  );

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" /> Team Activity Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Weekly reports submitted by your team</p>
        </div>
        <button
          onClick={() => downloadCsv(filtered)}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All staff</option>
          {staffOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All weeks</option>
          {weekOptions.map(w => <option key={w} value={w}>{weekRangeLabel(w)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-25" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">No activity reports yet</p>
          <p className="text-sm mt-1">Reports your team submits each week will show up here.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 whitespace-nowrap">Staff</th>
                <th className="px-4 py-3 whitespace-nowrap">Week</th>
                {FIELDS.map(f => (
                  <th key={f.key} className="px-4 py-3 whitespace-nowrap max-w-[180px]">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setDetail(r)}
                  className="border-b border-slate-100 dark:border-slate-700/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.submittedByName}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{weekRangeLabel(r.weekStartDate)}</td>
                  {FIELDS.map(f => (
                    <td key={f.key} className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={String(r[f.key] ?? "")}>
                      {f.type === "number" ? r[f.key] : (r[f.key] || "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setDetail(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{detail.submittedByName}</h3>
                <p className="text-xs text-slate-400">Week of {weekRangeLabel(detail.weekStartDate)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            {FIELDS.map(f => (
              <div key={f.key} className="text-sm">
                <p className="text-xs font-medium text-slate-400 mb-0.5">{f.label}</p>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{detail[f.key] ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
