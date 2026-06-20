import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  Receipt, Plus, Clock, CheckCircle, XCircle, TrendingUp,
  ChevronRight, FolderOpen, AlertCircle, ShoppingCart,
  UtensilsCrossed, ClipboardList, Hash,
} from "lucide-react";
import { useOrg } from "../context/OrgContext";

const STATUS_CFG = {
  PENDING:  { label: "Pending",  cls: "bg-amber-100 text-amber-700",    icon: Clock },
  APPROVED: { label: "Approved", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-700",      icon: XCircle },
};

const CAT_LABEL = (c) =>
  (c || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

function getEnabledFeatures() {
  const raw = localStorage.getItem("staffFeatures");
  const ALL = ["pos", "food_pos", "orders_kds", "expenses", "manage_expenses"];
  if (!raw) return new Set(ALL);
  return new Set(raw.split(",").map(s => s.trim()).filter(Boolean));
}

export default function StaffHome() {
  const { fmt } = useOrg();
  const user = getUserFromToken();
  const enabled = getEnabledFeatures();

  const showExpenses     = enabled.has("expenses") || enabled.has("manage_expenses");
  const showFoodPOS      = enabled.has("food_pos");
  const showOrdersKDS    = enabled.has("orders_kds");
  const showPos          = enabled.has("pos");

  // Expenses data
  const [expenses, setExpenses]   = useState([]);
  const [reports, setReports]     = useState([]);
  const [loadingExp, setLoadingExp] = useState(showExpenses);

  // Active orders count for KDS widget
  const [activeOrders, setActiveOrders]   = useState(null);
  const [inUseStands, setInUseStands]     = useState(null);

  useEffect(() => {
    const calls = [];
    if (showExpenses) {
      calls.push(
        Promise.all([
          api.get("/api/expenses", { params: { page: 0, size: 50 } }),
          api.get("/api/expense-reports"),
        ]).then(([expRes, repRes]) => {
          setExpenses(expRes.data.content || []);
          setReports(repRes.data || []);
        }).finally(() => setLoadingExp(false))
      );
    }
    if (showOrdersKDS) {
      calls.push(
        api.get("/api/orders?page=0&size=100").then(res => {
          const received = (res.data.content || []).filter(o => o.status === "received");
          setActiveOrders(received.length);
        }).catch(() => setActiveOrders(0))
      );
      calls.push(
        api.get("/api/restaurant-settings/stands").then(res => {
          setInUseStands(res.data.filter(s => s.inUse).length);
        }).catch(() => {})
      );
    }
    Promise.all(calls).catch(() => {});
  }, []);

  const thisMonth     = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter(e => e.expenseDate?.startsWith(thisMonth));
  const monthTotal    = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const pendingCount  = expenses.filter(e => e.status === "PENDING").length;
  const approvedTotal = expenses.filter(e => e.status === "APPROVED").reduce((s, e) => s + Number(e.amount), 0);
  const rejectedCount = expenses.filter(e => e.status === "REJECTED").length;
  const recent        = [...expenses]
    .sort((a, b) => new Date(b.createdAt || b.expenseDate) - new Date(a.createdAt || a.expenseDate))
    .slice(0, 5);
  const activeReports = reports.filter(r => r.status === "DRAFT" || r.status === "SUBMITTED").length;

  // Build welcome subtitle based on what's enabled
  const subtitle = showFoodPOS
    ? "Take food orders and manage your station."
    : showPos
    ? "Process sales and manage your shift."
    : showExpenses
    ? "Track and submit your expenses for approval."
    : "Welcome to your dashboard.";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
        <p className="text-blue-200 text-sm font-medium mb-1">Welcome back</p>
        <h1 className="text-2xl font-bold mb-1">{user?.username || user?.sub || "Staff"}</h1>
        {user?.email && <p className="text-blue-200 text-xs mb-1">{user.email}</p>}
        <p className="text-blue-200 text-sm mb-5">{subtitle}</p>

        <div className="flex flex-wrap gap-3">
          {showFoodPOS && (
            <Link to="/pos/food"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-xl shadow hover:bg-blue-50 transition">
              <UtensilsCrossed size={15} /> Food POS
            </Link>
          )}
          {showPos && (
            <Link to="/pos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-xl shadow hover:bg-blue-50 transition">
              <ShoppingCart size={15} /> Make a Sale
            </Link>
          )}
          {showOrdersKDS && (
            <Link to="/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition">
              <ClipboardList size={15} /> Orders / KDS
            </Link>
          )}
          {showExpenses && enabled.has("expenses") && (
            <Link to="/expenses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition">
              <Plus size={15} /> Record Expense
            </Link>
          )}
        </div>
      </div>

      {/* Food / Orders widgets */}
      {(showFoodPOS || showOrdersKDS) && (
        <div className={`grid gap-4 ${showFoodPOS && showOrdersKDS ? "grid-cols-2" : "grid-cols-1"}`}>
          {showFoodPOS && (
            <Link to="/pos/food"
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition">
                <UtensilsCrossed size={22} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white">Food POS</p>
                <p className="text-xs text-slate-400 mt-0.5">Take orders and print receipts</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition shrink-0" />
            </Link>
          )}
          {showOrdersKDS && (
            <Link to="/orders"
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4 hover:border-orange-300 dark:hover:border-orange-700 transition group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition">
                <ClipboardList size={22} className="text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-white">Orders / KDS</p>
                {activeOrders !== null ? (
                  <p className="text-xs text-slate-400 mt-0.5">
                    <span className="font-semibold text-orange-500">{activeOrders}</span> active order{activeOrders !== 1 ? "s" : ""}
                    {inUseStands !== null && ` · `}
                    {inUseStands !== null && <><span className="font-semibold text-red-500">{inUseStands}</span> stand{inUseStands !== 1 ? "s" : ""} in use</>}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">View active orders and manage stands</p>
                )}
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-orange-500 transition shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* POS widget (standalone) */}
      {showPos && !showFoodPOS && (
        <Link to="/pos"
          className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <ShoppingCart size={22} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 dark:text-white">Point of Sale</p>
            <p className="text-xs text-slate-400 mt-0.5">Sell products and process payments</p>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition" />
        </Link>
      )}

      {/* Expense section */}
      {showExpenses && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "This Month",    value: loadingExp ? "—" : fmt(monthTotal),   sub: `${monthExpenses.length} expense${monthExpenses.length !== 1 ? "s" : ""}`, icon: TrendingUp,  cls: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Pending Review",value: loadingExp ? "—" : pendingCount,      sub: "awaiting approval",         icon: Clock,       cls: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20" },
              { label: "Approved",      value: loadingExp ? "—" : fmt(approvedTotal),sub: "total reimbursed",           icon: CheckCircle, cls: "text-emerald-600",bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "Needs Action",  value: loadingExp ? "—" : rejectedCount,     sub: "rejected — edit & resubmit", icon: XCircle,     cls: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-900/20" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon size={18} className={s.cls} />
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Active claims banner */}
          {!loadingExp && activeReports > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <FolderOpen size={16} className="text-blue-600 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                You have <span className="font-semibold">{activeReports}</span> active expense claim{activeReports !== 1 ? "s" : ""}.
              </p>
              <Link to="/expenses/manage"
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0">
                View <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {/* Rejected banner */}
          {!loadingExp && rejectedCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <p className="text-sm text-rose-700 dark:text-rose-300 flex-1">
                <span className="font-semibold">{rejectedCount}</span> expense{rejectedCount !== 1 ? "s were" : " was"} rejected — review and resubmit.
              </p>
              <Link to="/expenses"
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 shrink-0">
                Review <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {/* Recent expenses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">Recent Expenses</h2>
              {enabled.has("expenses") && (
                <Link to="/expenses" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View all <ChevronRight size={13} />
                </Link>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {loadingExp ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : recent.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Receipt className="w-9 h-9 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No expenses yet</p>
                  {enabled.has("expenses") && (
                    <Link to="/expenses"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition">
                      <Plus size={13} /> Record Expense
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {recent.map(exp => {
                    const cfg = STATUS_CFG[exp.status] || STATUS_CFG.PENDING;
                    return (
                      <div key={exp.id}
                        className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <Receipt size={14} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                            {exp.vendorName || CAT_LABEL(exp.category)}
                          </p>
                          <p className="text-xs text-slate-400">{exp.expenseDate} · {CAT_LABEL(exp.category)}</p>
                          {exp.status === "REJECTED" && exp.rejectionReason && (
                            <p className="text-xs text-rose-500 mt-0.5 truncate">↩ {exp.rejectionReason}</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{fmt(exp.amount)}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${cfg.cls}`}>
                          <cfg.icon size={10} /> {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state — no features enabled */}
      {!showExpenses && !showFoodPOS && !showPos && !showOrdersKDS && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-sm">No features are currently enabled for your account.</p>
          <p className="text-xs mt-1">Contact your admin to enable access.</p>
        </div>
      )}
    </div>
  );
}
