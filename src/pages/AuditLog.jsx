import { useEffect, useState } from "react";
import api from "../services/api";
import { ShieldCheck, Filter, RefreshCw } from "lucide-react";

const ACTION_COLORS = {
  CREATE:           "bg-emerald-100 text-emerald-700",
  UPDATE:           "bg-blue-100 text-blue-700",
  DELETE:           "bg-rose-100 text-rose-700",
  PAYMENT_RECORDED: "bg-violet-100 text-violet-700",
  SENT:             "bg-amber-100 text-amber-700",
};

const ENTITY_TYPES = ["ALL", "INVOICE", "CLIENT", "PAYMENT", "EXPENSE", "FEE_RATE"];

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-NG", { day:"2-digit", month:"short", year:"numeric" });
}

export default function AuditLog() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter]     = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (p = 0, type = filter, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const params = { page: p, size: 30 };
      if (type !== "ALL") params.type = type;
      const res = await api.get("/api/audit", { params });
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLogs(0, filter); }, [filter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" /> Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">A complete log of every action in your account</p>
        </div>
        <button onClick={() => fetchLogs(page, filter, true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        {ENTITY_TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              filter === t
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No activity yet</p>
            <p className="text-sm mt-1">Actions will appear here as your team uses the platform</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                {/* Action badge */}
                <span className={`shrink-0 mt-0.5 px-2 py-0.5 text-xs font-bold rounded-md ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600"}`}>
                  {log.action}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug">{log.description}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">{log.entityType}</span>
                    {log.username && (
                      <span className="text-xs text-slate-400">by <span className="font-medium text-slate-600 dark:text-slate-300">{log.username}</span></span>
                    )}
                  </div>
                </div>

                <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap mt-0.5">
                  {timeAgo(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => fetchLogs(page - 1)} disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition">
            Previous
          </button>
          <span className="text-sm text-slate-400">Page {page + 1} of {totalPages}</span>
          <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
