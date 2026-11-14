import { useEffect, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import { useSubsidiaryView } from "../context/SubsidiaryViewContext";
import { formatCurrency } from "../utils/currencies";
import {
  GitBranch, Plus, X, Eye, Pause, Play, Unlink, Settings,
  Clock, Loader2, Printer, Link2, Inbox, Check, Ban,
} from "lucide-react";
import Toast from "../components/Toast";

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const PRESETS = [
  { value: "SALES_ONLY", label: "Sales Only", desc: "Invoicing only — nothing else" },
  { value: "STANDARD", label: "Standard", desc: "Invoicing, expenses, inventory, reports" },
  { value: "FULL", label: "Full", desc: "Everything, including staff & chart of accounts" },
];

const FEATURE_LABELS = {
  invoicing: "Invoicing",
  expenses: "Expenses",
  inventory: "Inventory",
  reports: "Reports",
  userManagement: "Staff Management",
  chartOfAccountsEdit: "Chart of Accounts (edit)",
  bankConnections: "Bank Connections",
};

const STATUS_STYLE = {
  ACTIVE: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  SUSPENDED: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

export default function Subsidiaries() {
  const { org } = useOrg();
  const currency = org?.baseCurrency || "NGN";
  const { startViewingChild } = useSubsidiaryView();

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const [subsidiaries, setSubsidiaries] = useState([]);
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", managerEmail: "", countryCode: "NG", currency: "", address: "", preset: "STANDARD" });
  const [creating, setCreating] = useState(false);

  const [permissionsModal, setPermissionsModal] = useState(null); // the subsidiary being edited
  const [permForm, setPermForm] = useState(null);
  const [savingPerms, setSavingPerms] = useState(false);

  const [actingId, setActingId] = useState(null);

  const [tab, setTab] = useState("overview");
  const [terminals, setTerminals] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [terminalsLoaded, setTerminalsLoaded] = useState(false);

  const [registerModal, setRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ terminalId: "", serialNumber: "", label: "" });
  const [registering, setRegistering] = useState(false);

  const [assignModal, setAssignModal] = useState(null); // terminal being assigned
  const [assignTarget, setAssignTarget] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [resolvingUnassignedId, setResolvingUnassignedId] = useState(null);
  const [assignUnassignedTarget, setAssignUnassignedTarget] = useState({});

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === "terminals" && !terminalsLoaded) loadTerminals();
  }, [tab, terminalsLoaded]);

  const loadTerminals = async () => {
    try {
      const [termRes, unassignedRes] = await Promise.all([
        api.get("/api/subsidiaries/terminals"),
        api.get("/api/subsidiaries/terminals/unassigned-transactions"),
      ]);
      setTerminals(termRes.data);
      setUnassigned(unassignedRes.data);
      setTerminalsLoaded(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load terminals.", "error");
    }
  };

  const registerTerminal = async (e) => {
    e.preventDefault();
    if (!registerForm.terminalId.trim() || !registerForm.serialNumber.trim()) {
      showToast("Terminal ID and serial number are required.", "error");
      return;
    }
    setRegistering(true);
    try {
      await api.post("/api/subsidiaries/terminals", registerForm);
      setRegisterModal(false);
      setRegisterForm({ terminalId: "", serialNumber: "", label: "" });
      showToast("Terminal registered.");
      loadTerminals();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to register terminal.", "error");
    } finally {
      setRegistering(false);
    }
  };

  const assignTerminal = async (e) => {
    e.preventDefault();
    if (!assignTarget) {
      showToast("Choose a subsidiary to assign this terminal to.", "error");
      return;
    }
    setAssigning(true);
    try {
      await api.post(`/api/subsidiaries/terminals/${assignModal.id}/assign`, { childOrgId: assignTarget });
      setAssignModal(null);
      setAssignTarget("");
      showToast("Terminal assigned.");
      loadTerminals();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to assign terminal.", "error");
    } finally {
      setAssigning(false);
    }
  };

  const resolveUnassigned = async (txId) => {
    const childOrgId = assignUnassignedTarget[txId];
    if (!childOrgId) {
      showToast("Choose a subsidiary first.", "error");
      return;
    }
    setResolvingUnassignedId(txId);
    try {
      await api.post(`/api/subsidiaries/terminals/unassigned-transactions/${txId}/assign`, { childOrgId });
      showToast("Transaction posted to subsidiary.");
      loadTerminals();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to assign transaction.", "error");
    } finally {
      setResolvingUnassignedId(null);
    }
  };

  const ignoreUnassigned = async (txId) => {
    setResolvingUnassignedId(txId);
    try {
      await api.post(`/api/subsidiaries/terminals/unassigned-transactions/${txId}/ignore`);
      showToast("Transaction ignored.");
      loadTerminals();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to ignore transaction.", "error");
    } finally {
      setResolvingUnassignedId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, dashRes] = await Promise.all([
        api.get("/api/subsidiaries"),
        api.get("/api/subsidiaries/dashboard"),
      ]);
      setSubsidiaries(listRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load subsidiaries.", "error");
    } finally {
      setLoading(false);
    }
  };

  const dashboardFor = (childOrgId) => dashboard.find(d => d.childOrgId === childOrgId);

  const createChild = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.managerEmail.trim()) {
      showToast("Business name and manager email are required.", "error");
      return;
    }
    setCreating(true);
    try {
      await api.post("/api/subsidiaries", createForm);
      setCreateModal(false);
      setCreateForm({ name: "", managerEmail: "", countryCode: "NG", currency: "", address: "", preset: "STANDARD" });
      showToast("Subsidiary created — the manager will get a welcome email to set their password.");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create subsidiary.", "error");
    } finally {
      setCreating(false);
    }
  };

  const openPermissions = (sub) => {
    setPermForm({
      preset: sub.preset || "STANDARD",
      invoicing: sub.invoicing, expenses: sub.expenses, inventory: sub.inventory, reports: sub.reports,
      userManagement: sub.userManagement, chartOfAccountsEdit: sub.chartOfAccountsEdit, bankConnections: sub.bankConnections,
    });
    setPermissionsModal(sub);
  };

  const applyPresetLocally = (preset) => {
    const base = {
      SALES_ONLY: { invoicing: true, expenses: false, inventory: false, reports: false, userManagement: false, chartOfAccountsEdit: false, bankConnections: false },
      STANDARD: { invoicing: true, expenses: true, inventory: true, reports: true, userManagement: false, chartOfAccountsEdit: false, bankConnections: false },
      FULL: { invoicing: true, expenses: true, inventory: true, reports: true, userManagement: true, chartOfAccountsEdit: true, bankConnections: true },
    }[preset];
    setPermForm(f => ({ ...f, preset, ...base }));
  };

  const saveProns = async (e) => {
    e.preventDefault();
    setSavingPerms(true);
    try {
      await api.put(`/api/subsidiaries/${permissionsModal.childOrgId}/permissions`, permForm);
      setPermissionsModal(null);
      showToast("Permissions updated.");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update permissions.", "error");
    } finally {
      setSavingPerms(false);
    }
  };

  const suspend = async (sub) => {
    setActingId(sub.childOrgId);
    try {
      await api.post(`/api/subsidiaries/${sub.childOrgId}/suspend`);
      showToast(`${sub.childOrgName} suspended.`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to suspend.", "error");
    } finally {
      setActingId(null);
    }
  };

  const reactivate = async (sub) => {
    setActingId(sub.childOrgId);
    try {
      await api.post(`/api/subsidiaries/${sub.childOrgId}/reactivate`);
      showToast(`${sub.childOrgName} reactivated.`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reactivate.", "error");
    } finally {
      setActingId(null);
    }
  };

  const unlink = async (sub) => {
    if (!window.confirm(`Unlink "${sub.childOrgName}"? This removes your access to it — it keeps running independently.`)) return;
    setActingId(sub.childOrgId);
    try {
      await api.post(`/api/subsidiaries/${sub.childOrgId}/unlink`);
      showToast(`${sub.childOrgName} unlinked.`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unlink.", "error");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Subsidiaries</h2>
            <p className="text-xs text-slate-400">Create and manage businesses under your account.</p>
          </div>
        </div>
        {tab === "overview" ? (
          <button onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">
            <Plus size={15} />Add Subsidiary
          </button>
        ) : (
          <button onClick={() => setRegisterModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition">
            <Plus size={15} />Register Terminal
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setTab("overview")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === "overview" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
          Overview
        </button>
        <button onClick={() => setTab("terminals")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition ${tab === "terminals" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}>
          POS Terminals {unassigned.length > 0 && <span className="ml-1 inline-flex items-center justify-center text-[10px] font-semibold w-4 h-4 rounded-full bg-rose-500 text-white">{unassigned.length}</span>}
        </button>
      </div>

      {tab === "overview" && (subsidiaries.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <p className="text-sm text-slate-400">No subsidiaries yet — add your first one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subsidiaries.map(sub => {
            const d = dashboardFor(sub.childOrgId);
            return (
              <div key={sub.childOrgId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{sub.childOrgName}</p>
                    <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[sub.status] || "bg-slate-100 text-slate-500"}`}>
                      {sub.status}
                    </span>
                  </div>
                  <button onClick={() => openPermissions(sub)} title="Manage permissions"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><Settings size={15} /></button>
                </div>

                {d && (
                  <div className="space-y-1.5 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Invoiced today</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(d.invoicedToday, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Invoiced this week</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(d.invoicedThisWeek, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">POS this week</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(d.posVolumeThisWeek, currency)} ({d.posCountThisWeek})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expenses this week</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(d.expensesThisWeek, currency)}</span>
                    </div>
                    {d.lastActivityAt && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 pt-1"><Clock size={11} />Last activity {new Date(d.lastActivityAt).toLocaleString()}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => startViewingChild({ id: sub.childOrgId, name: sub.childOrgName })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition">
                    <Eye size={13} />View
                  </button>
                  {sub.status === "ACTIVE" ? (
                    <button onClick={() => suspend(sub)} disabled={actingId === sub.childOrgId}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition disabled:opacity-60">
                      <Pause size={13} />Suspend
                    </button>
                  ) : (
                    <button onClick={() => reactivate(sub)} disabled={actingId === sub.childOrgId}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition disabled:opacity-60">
                      <Play size={13} />Reactivate
                    </button>
                  )}
                  <button onClick={() => unlink(sub)} disabled={actingId === sub.childOrgId}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition disabled:opacity-60 ml-auto">
                    {actingId === sub.childOrgId ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}Unlink
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tab === "terminals" && (
        <div className="space-y-6">
          {unassigned.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
                <Inbox size={15} className="text-amber-600" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Unassigned transactions — assign these to a subsidiary to post them</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {unassigned.map(tx => (
                  <div key={tx.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-[160px]">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatCurrency(tx.amount, currency)}</p>
                      <p className="text-xs text-slate-400">Terminal {tx.terminalSerial} · {new Date(tx.transactionTime).toLocaleString()}</p>
                    </div>
                    <select value={assignUnassignedTarget[tx.id] || ""} onChange={e => setAssignUnassignedTarget(m => ({ ...m, [tx.id]: e.target.value }))}
                      className={inputCls + " max-w-[220px]"}>
                      <option value="">Choose subsidiary…</option>
                      {subsidiaries.map(s => <option key={s.childOrgId} value={s.childOrgId}>{s.childOrgName}</option>)}
                    </select>
                    <button onClick={() => resolveUnassigned(tx.id)} disabled={resolvingUnassignedId === tx.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition disabled:opacity-60">
                      <Check size={13} />Assign
                    </button>
                    <button onClick={() => ignoreUnassigned(tx.id)} disabled={resolvingUnassignedId === tx.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-60">
                      <Ban size={13} />Ignore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {terminals.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center">
              <p className="text-sm text-slate-400">No Moniepoint terminals registered yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {terminals.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Printer size={15} className="text-slate-500" /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.label || t.terminalId}</p>
                      <p className="text-xs text-slate-400">{t.terminalId} · {t.serialNumber}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    {t.currentChildOrgName
                      ? <>Assigned to <span className="font-medium text-slate-600 dark:text-slate-300">{t.currentChildOrgName}</span></>
                      : <span className="text-amber-600">Not assigned to any subsidiary</span>}
                  </p>
                  <button onClick={() => { setAssignModal(t); setAssignTarget(""); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition">
                    <Link2 size={13} />{t.currentChildOrgName ? "Reassign" : "Assign"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add Subsidiary</h3>
              <button onClick={() => setCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={createChild} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Business Name</label>
                <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Manager Email</label>
                <input type="email" value={createForm.managerEmail} onChange={e => setCreateForm(f => ({ ...f, managerEmail: e.target.value }))} className={inputCls} placeholder="manager@business.com" />
                <p className="text-xs text-slate-400 mt-1">They'll get a welcome email to set their password.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Country</label>
                  <select value={createForm.countryCode} onChange={e => setCreateForm(f => ({ ...f, countryCode: e.target.value }))} className={inputCls}>
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="ZA">South Africa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Currency <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input value={createForm.currency} onChange={e => setCreateForm(f => ({ ...f, currency: e.target.value }))} className={inputCls} placeholder="NGN" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Address <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={createForm.address} onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Starting Permissions</label>
                <select value={createForm.preset} onChange={e => setCreateForm(f => ({ ...f, preset: e.target.value }))} className={inputCls}>
                  {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{creating ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {permissionsModal && permForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{permissionsModal.childOrgName} — Permissions</h3>
              <button onClick={() => setPermissionsModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={saveProns} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Preset</label>
                <div className="grid grid-cols-1 gap-2">
                  {PRESETS.map(p => (
                    <button type="button" key={p.value} onClick={() => applyPresetLocally(p.value)}
                      className={`text-left px-3 py-2 rounded-xl border transition ${permForm.preset === p.value ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700" : "border-slate-200 dark:border-slate-600"}`}>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.label}</p>
                      <p className="text-xs text-slate-400">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Individual features</p>
                <div className="space-y-2">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                      {label}
                      <input type="checkbox" checked={Boolean(permForm[key])}
                        onChange={e => setPermForm(f => ({ ...f, [key]: e.target.checked, preset: "CUSTOM" }))}
                        className="rounded" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setPermissionsModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={savingPerms} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{savingPerms ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register terminal modal */}
      {registerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Register Moniepoint Terminal</h3>
              <button onClick={() => setRegisterModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={registerTerminal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Terminal ID</label>
                <input value={registerForm.terminalId} onChange={e => setRegisterForm(f => ({ ...f, terminalId: e.target.value }))} className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Serial Number</label>
                <input value={registerForm.serialNumber} onChange={e => setRegisterForm(f => ({ ...f, serialNumber: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Label <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={registerForm.label} onChange={e => setRegisterForm(f => ({ ...f, label: e.target.value }))} className={inputCls} placeholder="e.g. Front counter" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setRegisterModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={registering} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{registering ? "Registering…" : "Register"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign terminal modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Assign {assignModal.label || assignModal.terminalId}</h3>
              <button onClick={() => setAssignModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={assignTerminal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Subsidiary</label>
                <select value={assignTarget} onChange={e => setAssignTarget(e.target.value)} className={inputCls} autoFocus>
                  <option value="">Choose subsidiary…</option>
                  {subsidiaries.map(s => <option key={s.childOrgId} value={s.childOrgId}>{s.childOrgName}</option>)}
                </select>
                {assignModal.currentChildOrgName && (
                  <p className="text-xs text-slate-400 mt-1">Reassigning will close the current assignment to {assignModal.currentChildOrgName}.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={assigning} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{assigning ? "Assigning…" : "Assign"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
