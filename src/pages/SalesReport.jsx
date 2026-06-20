// SalesReport.jsx — Sales analytics and history
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  TrendingUp, ShoppingBag, Users, BarChart2,
  RefreshCw, ChevronRight, Receipt, UtensilsCrossed,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
];

const TABS = [
  { key: "retail", label: "Retail / POS", icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "food",   label: "Food POS",     icon: <UtensilsCrossed className="w-4 h-4" /> },
];

export default function SalesReport() {
  const { fmt } = useOrg();
  const [tab, setTab]         = useState("retail");
  const [period, setPeriod]   = useState("month");
  const [report, setReport]   = useState(null);
  const [sales, setSales]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast]     = useState({ visible: false, message: "", type: "info" });

  const load = async (p = 0, per = period, t = tab) => {
    setLoading(true);
    try {
      if (t === "retail") {
        const [reportRes, salesRes] = await Promise.all([
          api.get(`/api/inventory/sales/report?period=${per}`),
          api.get(`/api/inventory/sales?page=${p}&size=20`),
        ]);
        setReport(reportRes.data);
        setSales(salesRes.data.content || []);
        setTotalPages(salesRes.data.totalPages || 1);
      } else {
        const [reportRes, salesRes] = await Promise.all([
          api.get(`/api/orders/report?period=${per}`),
          api.get(`/api/orders/by-period?period=${per}&page=${p}&size=20`),
        ]);
        setReport(reportRes.data);
        setSales(salesRes.data.content || []);
        setTotalPages(salesRes.data.totalPages || 1);
      }
    } catch { setToast({ visible: true, message: "Failed to load sales data", type: "error" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(0, period, tab); setPage(0); }, [period, tab]);
  useEffect(() => { load(page, period, tab); }, [page]);

  const statCards = report ? [
    { label: "Total Revenue",  value: fmt(report.totalRevenue),      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Transactions",   value: report.totalTransactions,      icon: <ShoppingBag className="w-5 h-5 text-blue-600" />,   bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Avg Order",      value: fmt(report.averageOrderValue), icon: <BarChart2 className="w-5 h-5 text-indigo-600" />,   bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Staff",          value: report.staffBreakdown?.length || 0, icon: <Users className="w-5 h-5 text-violet-600" />, bg: "bg-violet-50 dark:bg-violet-900/20" },
  ] : [];

  const chartData = report?.staffBreakdown?.map(s => ({
    name: s.staffName,
    revenue: parseFloat(s.revenue),
    transactions: s.transactions,
  })) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" /> Sales Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Track revenue, transactions, and staff performance</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => { setPeriod(p.key); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                period === p.key
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setPage(0); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white/60`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                  {s.icon}
                </div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Staff leaderboard */}
          {report?.staffBreakdown?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h2 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" /> Staff Performance
              </h2>
              <div className="space-y-3">
                {report.staffBreakdown.map((s, i) => (
                  <div key={s.staffId} className="flex items-center gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700"
                      : i === 1 ? "bg-slate-100 text-slate-600"
                      : "bg-orange-50 text-orange-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{s.staffName}</p>
                        <p className="text-sm font-bold text-blue-600">{fmt(s.revenue)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${Math.min(100, (s.revenue / report.totalRevenue) * 100)}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 w-20 text-right">{s.transactions} {tab === "food" ? "orders" : "sales"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {chartData.length > 0 && (
                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} width={70} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Sales/Orders history table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                {tab === "food" ? "Food Orders" : "Recent Sales"}
              </h2>
            </div>
            {sales.length === 0 ? (
              <p className="text-center py-10 text-slate-400 text-sm">
                No {tab === "food" ? "orders" : "sales"} recorded for this period
              </p>
            ) : tab === "retail" ? (
              <RetailTable sales={sales} fmt={fmt} />
            ) : (
              <FoodTable orders={sales} fmt={fmt} />
            )}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t border-slate-100 dark:border-slate-700">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50 transition">Prev</button>
                <span className="px-3 py-1.5 text-sm text-slate-500">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50 transition">Next</button>
              </div>
            )}
          </div>
        </>
      )}

      <Toast {...toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}

function RetailTable({ sales, fmt }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            {["Receipt", "Customer", "Items", "Total", "Payment", "Staff", "Date"].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
          {sales.map(s => (
            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{s.receiptNumber}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.customerName || "Walk-in"}</td>
              <td className="px-4 py-3 text-slate-500">{s.items?.length || 0} item(s)</td>
              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{fmt(s.total)}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                  {s.paymentMethod?.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{s.soldBy || "—"}</td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {new Date(s.saleDate).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FoodTable({ orders, fmt }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            {["Order #", "Type", "Items", "Total", "Payment", "Staff", "Date"].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
          {orders.map(o => (
            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{o.orderNumber}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  o.orderType === "TAKEAWAY"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-blue-50 text-blue-600"
                }`}>
                  {o.orderType === "TAKEAWAY" ? "Takeaway" : `Dine-in${o.standNumber ? ` #${o.standNumber}` : ""}`}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{o.items?.length || 0} item(s)</td>
              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{fmt(o.total)}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                  {o.paymentMethod?.replace("_", " ") || "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{o.createdBy || "—"}</td>
              <td className="px-4 py-3 text-slate-400 text-xs">
                {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
