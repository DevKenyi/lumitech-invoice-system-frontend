// SuperAdmin.jsx — Platform Admin Dashboard (PLATFORM_ADMIN only)
import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  ShieldCheck, Building2, Users, FileText, CheckCircle, XCircle,
  ChevronDown, AlertTriangle, X, Trash2, UserCircle,
  CreditCard, Save, TrendingUp, Activity, Bell,
  PhoneCall, Mail, Search, RefreshCw, Download, Copy, Link2, MessageSquare, RotateCcw,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

// ── Constants ─────────────────────────────────────────────────────────────────
const PLANS = ["FREE", "STARTER", "GROWTH", "PRO", "ACCOUNTANT_PRO"];
const PLAN_LABEL = { FREE: "Free", STARTER: "Essential", GROWTH: "Business", PRO: "Pro", ACCOUNTANT_PRO: "Accountant Pro" };
const PLAN_STYLE = {
  FREE:           "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  STARTER:        "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  GROWTH:         "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  PRO:            "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
  ACCOUNTANT_PRO: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
};
const PLAN_COLORS = { FREE: "#94a3b8", STARTER: "#3b82f6", GROWTH: "#10b981", PRO: "#6366f1", ACCOUNTANT_PRO: "#a855f7" };
const COUNTRY_FLAG = { NG: "🇳🇬", GH: "🇬🇭", ZA: "🇿🇦", US: "🇺🇸", GB: "🇬🇧" };
const COUNTRY_NAME = { NG: "Nigeria", GH: "Ghana", ZA: "South Africa", US: "United States", GB: "United Kingdom" };

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const fmtDateShort = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const trialStatus = (trialEndsAt, suspended) => {
  if (!trialEndsAt) return null;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0 || suspended) return { label: "Expired", color: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" };
  if (daysLeft <= 3)  return { label: `${daysLeft}d left`, color: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" };
  if (daysLeft <= 7)  return { label: `${daysLeft}d left`, color: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" };
  return { label: `${daysLeft}d left`, color: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" };
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function Spinner({ size = 6 }) {
  return <div className={`animate-spin rounded-full h-${size} w-${size} border-4 border-slate-200 border-t-blue-600`} />;
}

function StatCard({ label, value, icon: Icon, color, sub, badge }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value ?? "—"}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, loading, height = 200 }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</p>
      {loading ? (
        <div style={{ height }} className="flex items-center justify-center">
          <Spinner />
        </div>
      ) : children}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = {
    HIGH:   "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    MEDIUM: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    LOW:    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cfg[priority] ?? cfg.LOW}`}>
      {priority}
    </span>
  );
}

// ── Suspend modal ─────────────────────────────────────────────────────────────
function SuspendModal({ org, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState("");
  if (!org) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Suspend Organisation</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Suspending <span className="font-semibold text-slate-900 dark:text-white">{org.name}</span> will immediately revoke access for all their users.
        </p>
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Reason <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g., Payment overdue, Terms violation…"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none transition"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition disabled:opacity-60">
            {loading ? "Suspending…" : "Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Org row (All Organisations table) ─────────────────────────────────────────
function OrgRow({ org, isOwnOrg, onSuspend, onUnsuspend, onDelete, onPlanChange }) {
  const [expanded, setExpanded] = useState(false);
  const [users, setUsers]       = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const toggleUsers = async () => {
    if (!expanded && users === null) {
      setLoadingUsers(true);
      try {
        const res = await api.get(`/api/superadmin/organisations/${org.id}/users`);
        setUsers(res.data);
      } finally { setLoadingUsers(false); }
    }
    setExpanded(e => !e);
  };

  const isSuspended = org.suspended === true;

  return (
    <>
      <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isSuspended ? "opacity-60" : ""}`}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {org.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{org.name}</p>
              {org.email && <p className="text-xs text-slate-400">{org.email}</p>}
              {org.ownerPhone && <p className="text-xs text-slate-400">{org.ownerPhone}</p>}
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
          {COUNTRY_FLAG[org.country] ?? "🌍"} {COUNTRY_NAME[org.country] ?? org.country ?? "—"}
        </td>
        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
          {fmtDate(org.createdAt)}
        </td>
        <td className="px-4 py-4">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isSuspended ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"}`}>
            {isSuspended ? <XCircle size={11} /> : <CheckCircle size={11} />}
            {isSuspended ? "Suspended" : "Active"}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="relative inline-block">
            <select
              value={org.plan ?? "FREE"}
              onChange={e => onPlanChange(org.id, e.target.value)}
              className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer ${PLAN_STYLE[org.plan] ?? PLAN_STYLE.FREE}`}
            >
              {PLANS.map(p => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
          </div>
        </td>
        <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300 hidden md:table-cell">{org.userCount ?? "—"}</td>
        <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300 hidden lg:table-cell">{org.clientCount ?? "—"}</td>
        <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-300 hidden lg:table-cell">{org.invoiceCount ?? "—"}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            <button onClick={toggleUsers} title="View users" className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
              <Users size={12} />{expanded ? "Hide" : "Users"}
            </button>
            {isOwnOrg || org.platformAdminOrg ? (
              <span className="text-xs text-slate-400 italic px-2">{org.platformAdminOrg ? "Platform Admin" : "Your org"}</span>
            ) : isSuspended ? (
              <>
                <button onClick={() => onUnsuspend(org)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 transition">
                  <CheckCircle size={12} />Restore
                </button>
                <button onClick={() => onDelete(org)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-lg hover:bg-rose-100 transition">
                  <Trash2 size={12} />Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onSuspend(org)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 transition">
                  <XCircle size={12} />Suspend
                </button>
                <button onClick={() => onDelete(org)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-lg hover:bg-rose-100 transition">
                  <Trash2 size={12} />Delete
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70 dark:bg-slate-700/30">
          <td colSpan={9} className="px-6 py-3">
            {loadingUsers ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2"><Spinner size={3.5} /> Loading users…</div>
            ) : users?.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No users in this organisation.</p>
            ) : (
              <div className="flex flex-wrap gap-2 py-1">
                {users?.map(u => (
                  <div key={u.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs">
                    <UserCircle size={13} className="text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{u.username}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${u.role === "SUPER_ADMIN" || u.role === "ADMIN" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Tab navigation ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",      label: "Overview",       icon: Activity },
  { id: "followup",      label: "Follow-up",      icon: Bell },
  { id: "crm",           label: "CRM",            icon: MessageSquare },
  { id: "organisations", label: "Organisations",  icon: Building2 },
  { id: "suspicious",    label: "Suspicious",     icon: AlertTriangle },
  { id: "pricing",       label: "Pricing",        icon: CreditCard },
];

const FOLLOWUP_STATUS_LABEL = {
  CALLED:           "Called",
  INTERESTED:       "Interested",
  NOT_INTERESTED:   "Not Interested",
  NO_ANSWER:        "No Answer",
  CONVERTED:        "Converted",
  FOLLOW_UP_LATER:  "Follow Up Later",
};
const FOLLOWUP_STATUS_COLOR = {
  CALLED:           "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  INTERESTED:       "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  NOT_INTERESTED:   "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
  NO_ANSWER:        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  CONVERTED:        "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  FOLLOW_UP_LATER:  "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
};

// ── Main ───────────────────────────────────────────────────────────────────────
function SuperAdmin() {
  const user = getUserFromToken();
  const isPlatformAdmin =
    user?.role === "PLATFORM_ADMIN" ||
    (Array.isArray(user?.roles) && user.roles.includes("PLATFORM_ADMIN"));

  const [tab, setTab]           = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [orgs, setOrgs]         = useState([]);
  const [pricingRows, setPricingRows] = useState([]);
  const [pricingEdits, setPricingEdits] = useState({});
  const [suspicious, setSuspicious] = useState([]);
  const [followupOrgs, setFollowupOrgs] = useState([]);
  const [boardToken, setBoardToken]     = useState(null);
  const [crmSearch, setCrmSearch]       = useState("");
  const [showExcluded, setShowExcluded] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspending, setSuspending]       = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [currentOrgId, setCurrentOrgId]  = useState(null);
  const [orgSearch, setOrgSearch]        = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const fetchAll = () => {
    setLoading(true);
    api.get("/api/org").then(res => setCurrentOrgId(res.data.id ?? null)).catch(() => {});
    Promise.all([
      api.get("/api/superadmin/dashboard"),
      api.get("/api/superadmin/organisations"),
      api.get("/api/superadmin/billing/pricing").catch(() => ({ data: [] })),
      api.get("/api/superadmin/suspicious-registrations").catch(() => ({ data: [] })),
      api.get("/api/superadmin/followup/list").catch(() => ({ data: [] })),
      api.get("/api/superadmin/followup/board-token").catch(() => ({ data: {} })),
    ])
      .then(([dashRes, orgsRes, pricingRes, suspiciousRes, followupRes, boardRes]) => {
        setDashboard(dashRes.data);
        setOrgs(orgsRes.data.content ?? orgsRes.data ?? []);
        const rows = pricingRes.data ?? [];
        setPricingRows(rows);
        const edits = {};
        rows.forEach(r => { edits[`${r.country}-${r.plan}`] = String(r.amount); });
        setPricingEdits(edits);
        setSuspicious(suspiciousRes.data ?? []);
        setFollowupOrgs(followupRes.data ?? []);
        setBoardToken(boardRes.data?.boardToken ?? null);
      })
      .catch(() => showToast("Failed to load platform data", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  if (!isPlatformAdmin) return <Navigate to="/dashboard" replace />;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const changePlan = async (orgId, plan) => {
    try {
      await api.put(`/api/superadmin/organisations/${orgId}/plan`, { plan });
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan } : o));
      showToast(`Plan updated to ${PLAN_LABEL[plan] ?? plan}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update plan.", "error");
    }
  };

  const doSuspend = async (reason) => {
    setSuspending(true);
    try {
      await api.post(`/api/superadmin/organisations/${suspendTarget.id}/suspend`, { reason });
      setOrgs(prev => prev.map(o => o.id === suspendTarget.id ? { ...o, suspended: true } : o));
      showToast(`${suspendTarget.name} suspended`);
      setSuspendTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to suspend.", "error");
    } finally { setSuspending(false); }
  };

  const doUnsuspend = async (org) => {
    try {
      await api.post(`/api/superadmin/organisations/${org.id}/unsuspend`);
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, suspended: false } : o));
      showToast(`${org.name} restored`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to restore.", "error");
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/superadmin/organisations/${deleteTarget.id}`);
      setOrgs(prev => prev.filter(o => o.id !== deleteTarget.id));
      showToast(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete.", "error");
    } finally { setDeleting(false); }
  };

  const savePricingRow = async (row) => {
    const key = `${row.country}-${row.plan}`;
    const newAmount = pricingEdits[key];
    if (!newAmount || isNaN(Number(newAmount))) return;
    setSavingPricing(true);
    try {
      await api.put("/api/superadmin/billing/pricing", {
        country: row.country, plan: row.plan,
        amount: Number(newAmount), currency: row.currency,
      });
      showToast(`${row.country} ${row.plan} pricing updated`);
    } catch {
      showToast("Failed to save pricing", "error");
    } finally { setSavingPricing(false); }
  };

  // ── Derived chart data ───────────────────────────────────────────────────────
  const planChartData = dashboard ? PLANS.map(p => ({
    name: PLAN_LABEL[p],
    value: { FREE: dashboard.freeOrgs, STARTER: dashboard.starterOrgs, GROWTH: dashboard.growthOrgs, PRO: dashboard.proOrgs, ACCOUNTANT_PRO: dashboard.accountantProOrgs }[p] ?? 0,
    fill: PLAN_COLORS[p],
  })) : [];

  const countryChartData = (dashboard?.countryDistribution ?? []).map(c => ({
    name: `${COUNTRY_FLAG[c.country] ?? "🌍"} ${COUNTRY_NAME[c.country] ?? c.country}`,
    value: c.count,
    fill: { NG: "#10b981", GH: "#3b82f6", ZA: "#f59e0b" }[c.country] ?? "#94a3b8",
  }));

  const donutData = dashboard ? [
    { name: "Active",    value: dashboard.activeOrganisations,    fill: "#10b981" },
    { name: "Suspended", value: dashboard.suspendedOrganisations, fill: "#f43f5e" },
  ] : [];

  const filteredOrgs = useMemo(() => {
    const q = orgSearch.toLowerCase();
    if (!q) return orgs;
    return orgs.filter(o =>
      o.name?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.ownerPhone?.includes(q)
    );
  }, [orgs, orgSearch]);

  const followUp = dashboard?.followUpList ?? [];
  const highCount = followUp.filter(f => f.priority === "HIGH").length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Platform Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">LumiLedger — {dashboard?.totalOrganisations ?? "…"} organisations</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={14} />
              {t.label}
              {t.id === "followup" && highCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {highCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <StatCard label="Total Orgs"     value={dashboard?.totalOrganisations}  icon={Building2}   color="bg-gradient-to-br from-blue-600 to-indigo-600" />
            <StatCard label="Active"         value={dashboard?.activeOrganisations} icon={CheckCircle} color="bg-gradient-to-br from-emerald-500 to-teal-500" />
            <StatCard label="Suspended"      value={dashboard?.suspendedOrganisations} icon={XCircle} color="bg-gradient-to-br from-rose-500 to-pink-500" />
            <StatCard label="Total Users"    value={dashboard?.totalUsers}          icon={Users}       color="bg-gradient-to-br from-violet-500 to-purple-600" />
            <StatCard label="Total Invoices" value={dashboard?.totalInvoices}       icon={FileText}    color="bg-gradient-to-br from-amber-500 to-orange-500" sub={`+${dashboard?.invoicesThisMonth ?? 0} this month`} />
            <StatCard label="New This Week"  value={dashboard?.newOrgsThisWeek}     icon={TrendingUp}  color="bg-gradient-to-br from-sky-500 to-cyan-500" />
            <StatCard label="New This Month" value={dashboard?.newOrgsThisMonth}    icon={Bell}        color="bg-gradient-to-br from-pink-500 to-rose-500" />
            <StatCard label="Active Orgs (30d)" value={dashboard?.activeOrgsThisMonth} icon={Activity} color="bg-gradient-to-br from-teal-500 to-emerald-600" sub="created ≥1 invoice" />
          </div>

          {/* Activity charts — registration + invoice trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Daily Registrations — Last 30 Days" loading={loading}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dashboard?.dailyRegistrations ?? []} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="Sign-ups" stroke="#3b82f6" strokeWidth={2} fill="url(#regGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Invoice Activity — Last 30 Days" loading={loading}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dashboard?.dailyInvoices ?? []} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="Invoices created" stroke="#10b981" strokeWidth={2} fill="url(#invGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Plan + Country + Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Plan Distribution" loading={loading}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={planChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="value" name="Orgs" radius={[6, 6, 0, 0]}>
                    {planChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Country Breakdown" loading={loading}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={countryChartData} cx="50%" cy="44%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value">
                    {countryChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Org Status" loading={loading}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="44%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Monthly signup trend */}
          <ChartCard title="Monthly Sign-ups — Last 6 Months" loading={loading}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dashboard?.signupsByMonth ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" name="Sign-ups" stroke="#6366f1" strokeWidth={2} fill="url(#signupGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Recent registrations */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Registrations</h2>
              <span className="ml-auto text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">Last 10</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organisation</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Country</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Trial</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Users</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center"><Spinner /></td></tr>
                  ) : (dashboard?.recentRegistrations ?? []).map(org => {
                    const trial = trialStatus(org.trialEndsAt, org.suspended);
                    return (
                    <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {org.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white text-xs">{org.name}</p>
                            {org.email && <p className="text-xs text-slate-400">{org.email}</p>}
                            {org.ownerPhone && <p className="text-xs text-slate-400">{org.ownerPhone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {COUNTRY_FLAG[org.country] ?? "🌍"} {COUNTRY_NAME[org.country] ?? org.country ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(org.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_STYLE[org.plan] ?? PLAN_STYLE.FREE}`}>
                          {PLAN_LABEL[org.plan] ?? "Free"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {trial ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${trial.color}`}>
                            {trial.label}
                          </span>
                        ) : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-600 dark:text-slate-300">{org.userCount}</td>
                      <td className="px-4 py-3 text-center text-xs">
                        <span className={org.invoiceCount === 0 ? "text-rose-500 font-semibold" : "text-slate-600 dark:text-slate-300"}>
                          {org.invoiceCount}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UP TAB ────────────────────────────────────────────────────── */}
      {tab === "followup" && (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Traction alert — {followUp.length} organisations need follow-up</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                These businesses signed up but aren't getting full value. A personal outreach significantly improves activation.
              </p>
            </div>
          </div>

          {/* Priority summary pills */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "HIGH — Never used", count: followUp.filter(f => f.priority === "HIGH").length,   color: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700" },
              { label: "MEDIUM — Low engagement", count: followUp.filter(f => f.priority === "MEDIUM").length, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700" },
              { label: "LOW — Gone cold",  count: followUp.filter(f => f.priority === "LOW").length,    color: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600" },
            ].map(p => (
              <div key={p.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${p.color}`}>
                <span className="text-base font-bold">{p.count}</span> {p.label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={8} /></div>
          ) : followUp.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              All organisations are active — great traction!
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organisation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Country</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Reason</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoices</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Days old</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {followUp.map(org => (
                      <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${org.priority === "HIGH" ? "bg-gradient-to-br from-rose-500 to-pink-600" : org.priority === "MEDIUM" ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-slate-400 to-slate-500"}`}>
                              {org.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{org.name}</p>
                              {org.email && <p className="text-xs text-slate-400">{org.email}</p>}
                              {org.ownerPhone && <p className="text-xs text-slate-400">{org.ownerPhone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                          {COUNTRY_FLAG[org.country] ?? "🌍"} {COUNTRY_NAME[org.country] ?? org.country ?? "—"}
                        </td>
                        <td className="px-4 py-4"><PriorityBadge priority={org.priority} /></td>
                        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs hidden md:table-cell">{org.reason}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-sm font-bold ${org.invoiceCount === 0 ? "text-rose-500" : "text-slate-700 dark:text-slate-200"}`}>
                            {org.invoiceCount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400">{org.daysSinceRegistration}d</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_STYLE[org.plan] ?? PLAN_STYLE.FREE}`}>
                            {PLAN_LABEL[org.plan] ?? "Free"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 justify-end flex-wrap">
                            {org.email && (
                              <a
                                href={`mailto:${org.email}?subject=Your%20LumiLedger%20account&body=Hi%2C%0A%0AJust%20checking%20in%20on%20your%20LumiLedger%20account%20for%20${encodeURIComponent(org.name)}.%20Can%20we%20help%20you%20get%20started%3F%0A%0ABest%2C%0AThe%20LumiLedger%20Team`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 transition"
                              >
                                <Mail size={12} /> Email
                              </a>
                            )}
                            {org.ownerPhone && (
                              <a
                                href={`https://wa.me/${org.ownerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! Just checking in on your LumiLedger account for ${org.name}. Can we help you get set up?`)}`}
                                target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 transition"
                              >
                                <PhoneCall size={12} /> WhatsApp
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORGANISATIONS TAB ────────────────────────────────────────────────── */}
      {tab === "organisations" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone…"
                value={orgSearch}
                onChange={e => setOrgSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              {filteredOrgs.length} / {orgs.length}
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner size={8} /></div>
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">No organisations match your search.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organisation</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Country</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Users</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Clients</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Invoices</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredOrgs.map(org => (
                      <OrgRow
                        key={org.id}
                        org={org}
                        isOwnOrg={currentOrgId && org.id === currentOrgId}
                        onSuspend={setSuspendTarget}
                        onUnsuspend={doUnsuspend}
                        onDelete={setDeleteTarget}
                        onPlanChange={changePlan}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CRM / FOLLOWUP TAB ──────────────────────────────────────────────── */}
      {tab === "crm" && (() => {
        const excludedCount = followupOrgs.filter(o => o.followupExcluded).length;
        const crmFiltered = followupOrgs.filter(o => {
          const q = crmSearch.toLowerCase();
          const matchSearch = !q || o.orgName?.toLowerCase().includes(q) || o.orgEmail?.toLowerCase().includes(q) || o.ownerPhone?.includes(q);
          const matchHide = showExcluded ? o.followupExcluded : !o.followupExcluded;
          return matchSearch && matchHide;
        });
        const activeFiltered = followupOrgs.filter(o => {
          const q = crmSearch.toLowerCase();
          return (!o.followupExcluded) && (!q || o.orgName?.toLowerCase().includes(q) || o.orgEmail?.toLowerCase().includes(q) || o.ownerPhone?.includes(q));
        });
        const rows = showExcluded ? crmFiltered : activeFiltered;

        const toggleExclude = async (o) => {
          try {
            const res = await api.post(`/api/superadmin/followup/organisations/${o.orgId}/toggle-exclude`);
            setFollowupOrgs(prev => prev.map(x => x.orgId === o.orgId ? { ...x, followupExcluded: res.data.followupExcluded } : x));
            showToast(res.data.followupExcluded ? `${o.orgName} excluded from followup` : `${o.orgName} added back to followup`);
          } catch { showToast("Failed to update.", "error"); }
        };

        return (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or phone…"
                value={crmSearch}
                onChange={e => setCrmSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
            </div>
            {boardToken && (
              <a href={`/followup-board/${boardToken}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                <Link2 className="w-4 h-4" /> Open Board
              </a>
            )}
            {boardToken && (
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/followup-board/${boardToken}`); showToast("Board link copied!"); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition">
                <Copy className="w-4 h-4" /> Copy Board Link
              </button>
            )}
            <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              onClick={e => { e.preventDefault(); import("../services/api").then(({ default: a }) => { a.get("/api/superadmin/followup/export.csv", { responseType: "blob" }).then(res => { const url = URL.createObjectURL(res.data); const link = document.createElement("a"); link.href = url; link.download = `followup-export-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(url); }); }); }}>
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>

          {/* View toggle strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              <button
                onClick={() => setShowExcluded(false)}
                className={`px-4 py-2 text-sm font-semibold transition ${!showExcluded ? "bg-blue-600 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              >
                Active ({followupOrgs.filter(o => !o.followupExcluded).length})
              </button>
              <button
                onClick={() => setShowExcluded(true)}
                className={`px-4 py-2 text-sm font-semibold transition border-l border-slate-200 dark:border-slate-700 ${showExcluded ? "bg-slate-600 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              >
                Excluded ({excludedCount})
              </button>
            </div>
            {showExcluded && excludedCount > 0 && (
              <p className="text-xs text-slate-400">Tick the checkbox on any row to move it back to Active.</p>
            )}
          </div>

          {/* Table */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                      {showExcluded ? "Re-add" : "Active"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organisation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoices</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Followup Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rows.map(o => (
                    <tr key={o.orgId} className={`transition-colors ${showExcluded ? "bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-700/30" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!o.followupExcluded}
                          title={o.followupExcluded ? "Click to move back to Active" : "Click to exclude from followup"}
                          onChange={() => toggleExclude(o)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${showExcluded ? "bg-slate-400" : "bg-gradient-to-br from-blue-500 to-indigo-600"}`}>
                            {o.orgName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-medium ${showExcluded ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>{o.orgName}</p>
                            {o.orgEmail && <p className="text-xs text-slate-400">{o.orgEmail}</p>}
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs ${showExcluded ? "text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>{o.ownerPhone ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${showExcluded ? "bg-slate-100 dark:bg-slate-700 text-slate-400" : (PLAN_STYLE[o.plan] ?? "")}`}>
                          {PLAN_LABEL[o.plan] ?? o.plan}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${showExcluded ? "text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>{o.invoiceCount}</td>
                      <td className="px-4 py-3">
                        {o.noteCount > 0
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                              <MessageSquare className="w-3 h-3" /> {o.noteCount}
                            </span>
                          : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {o.latestStatus
                          ? <span className={`px-2 py-0.5 rounded text-xs font-semibold ${FOLLOWUP_STATUS_COLOR[o.latestStatus] ?? ""}`}>
                              {FOLLOWUP_STATUS_LABEL[o.latestStatus] ?? o.latestStatus}
                            </span>
                          : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {!showExcluded && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={o.followupLink} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition">
                              <Link2 className="w-3 h-3" /> Open
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(o.followupLink); showToast("Link copied!"); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition">
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Regenerate link for ${o.orgName}? The old link will stop working.`)) return;
                                try {
                                  const res = await api.post(`/api/superadmin/followup/organisations/${o.orgId}/regenerate-token`);
                                  const newToken = res.data.followupToken;
                                  const newLink = `${window.location.origin}/followup/${newToken}`;
                                  setFollowupOrgs(prev => prev.map(x => x.orgId === o.orgId ? { ...x, followupToken: newToken, followupLink: newLink } : x));
                                  showToast("New link generated!");
                                } catch { showToast("Failed to regenerate link.", "error"); }
                              }}
                              title="Regenerate link — invalidates old URL"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium transition">
                              <RotateCcw className="w-3 h-3" /> Regen
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">
                    {showExcluded ? "No excluded organisations." : "No active organisations found."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── SUSPICIOUS TAB ───────────────────────────────────────────────────── */}
      {tab === "suspicious" && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Suspicious Registrations</h2>
            <span className="text-xs text-slate-400 ml-1">— accounts sharing a phone number (possible trial abuse)</span>
            {suspicious.length > 0 && (
              <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                {suspicious.length}
              </span>
            )}
          </div>
          {suspicious.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No suspicious registrations detected.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organisation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {suspicious.map((s, i) => (
                    <tr key={i} className="hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{s.orgName}</p>
                        {s.orgEmail && <p className="text-xs text-slate-400">{s.orgEmail}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{s.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {COUNTRY_FLAG[s.country] ?? ""} {COUNTRY_NAME[s.country] ?? s.country ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PLAN_STYLE[s.plan] ?? ""}`}>
                          {PLAN_LABEL[s.plan] ?? s.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.suspended
                          ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">Suspended</span>
                          : <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">Active</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                          {s.reason?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PRICING TAB ──────────────────────────────────────────────────────── */}
      {tab === "pricing" && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Plan Pricing by Country</h2>
            <span className="text-xs text-slate-400 ml-1">— edit price per month, then save each row</span>
          </div>
          {pricingRows.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">No pricing configured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount / month</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[...pricingRows]
                    .sort((a, b) => a.country.localeCompare(b.country) || a.plan.localeCompare(b.plan))
                    .map(row => {
                      const key = `${row.country}-${row.plan}`;
                      return (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-200">
                            {COUNTRY_FLAG[row.country] ?? ""} {row.country}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PLAN_STYLE[row.plan] ?? ""}`}>{PLAN_LABEL[row.plan] ?? row.plan}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{row.currency}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number" min="0" step="1"
                              value={pricingEdits[key] ?? row.amount}
                              onChange={e => setPricingEdits(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-32 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => savePricingRow(row)} disabled={savingPricing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">
                              <Save size={12} /> Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals & toasts */}
      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
      <SuspendModal org={suspendTarget} onConfirm={doSuspend} onCancel={() => setSuspendTarget(null)} loading={suspending} />
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Organisation"
        message={`Permanently delete "${deleteTarget?.name}"? This will remove all users, invoices, clients, and data. This cannot be undone.`}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

export default SuperAdmin;
