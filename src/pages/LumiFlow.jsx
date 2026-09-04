import { useEffect, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import { useVaultAccess } from "../hooks/useVaultAccess";
import { formatCurrency } from "../utils/currencies";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Lock, Plus, Trash2, Edit2, X, KeyRound, PiggyBank, Wallet, Banknote,
  Pause, Play, History, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import Toast from "../components/Toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";
const pinInputCls = "w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const FREQUENCIES = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Biweekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "CUSTOM", label: "Custom (every N days)" },
];
const FREQUENCY_LABEL = Object.fromEntries(FREQUENCIES.map(f => [f.value, f.label]));

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#ef4444", "#84cc16"];

export default function LumiFlow() {
  const { org } = useOrg();
  const currency = org?.baseCurrency || "NGN";

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const {
    loading, hasPin, vaultToken, vaultHeaders, lock, handleVaultAuthError,
    setupPin, setSetupPin, setupConfirm, setSetupConfirm, settingUp, doSetup,
    unlockPin, setUnlockPin, unlocking, doUnlock,
    showForgot, setShowForgot, forgotPassword, setForgotPassword, forgotNewPin, setForgotNewPin, resetting, doResetPin,
    showChangePin, setShowChangePin, currentPinInput, setCurrentPinInput, newPinInput, setNewPinInput, changingPin, doChangePin,
  } = useVaultAccess(showToast);

  // Dashboard data
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [flows, setFlows] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [salaryVault, setSalaryVault] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastAllocation, setLastAllocation] = useState(null);

  // Rule modal
  const [ruleModal, setRuleModal] = useState(null); // null | { mode, rule? }
  const [ruleForm, setRuleForm] = useState({ categoryId: "", mode: "PERCENTAGE", value: "" });
  const [savingRule, setSavingRule] = useState(false);

  // Deposit modal
  const [depositModal, setDepositModal] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: "", source: "", receivedDate: today(), note: "" });
  const [savingDeposit, setSavingDeposit] = useState(false);

  // Flow modal
  const [flowModal, setFlowModal] = useState(null); // null | { mode, flow? }
  const [flowForm, setFlowForm] = useState({
    name: "", categoryId: "", amount: "", frequency: "WEEKLY", intervalDays: "",
    startDate: today(), endDate: "", destinationLabel: "", maxOccurrences: "", rolloverUnused: false,
  });
  const [showFlowAdvanced, setShowFlowAdvanced] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);

  // Payout history modal
  const [payoutHistoryModal, setPayoutHistoryModal] = useState(null); // null | { flow, payouts }

  const [expandedDepositId, setExpandedDepositId] = useState(null);

  // ── Load dashboard data whenever unlocked ────────────────────────────────
  useEffect(() => {
    if (!vaultToken) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultToken]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [catRes, ruleRes, depRes, flowRes, dashRes, vaultRes] = await Promise.all([
        api.get("/api/vault/categories", vaultHeaders()),
        api.get("/api/vault/salary/rules", vaultHeaders()),
        api.get("/api/vault/salary/deposits", vaultHeaders()),
        api.get("/api/vault/salary/flows", vaultHeaders()),
        api.get("/api/vault/salary/dashboard", vaultHeaders()),
        api.get("/api/vault/salary/vault", vaultHeaders()),
      ]);
      setCategories(catRes.data);
      setRules(ruleRes.data);
      setDeposits(depRes.data);
      setFlows(flowRes.data);
      setDashboard(dashRes.data);
      setSalaryVault(vaultRes.data);
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to load LumiFlow data.", "error");
    } finally {
      setDataLoading(false);
    }
  };

  // ── Allocation rules ──────────────────────────────────────────────────────

  const openRuleModal = (rule) => {
    setRuleForm(rule
      ? { categoryId: rule.categoryId, mode: rule.mode, value: rule.value }
      : { categoryId: "", mode: "PERCENTAGE", value: "" });
    setRuleModal({ mode: rule ? "edit" : "create", rule });
  };

  const saveRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.categoryId) { showToast("Select a category.", "error"); return; }
    if (!ruleForm.value || Number(ruleForm.value) <= 0) { showToast("Enter a valid value.", "error"); return; }
    setSavingRule(true);
    try {
      const body = { categoryId: ruleForm.categoryId, mode: ruleForm.mode, value: Number(ruleForm.value) };
      if (ruleModal.mode === "edit") {
        await api.put(`/api/vault/salary/rules/${ruleModal.rule.id}`, body, vaultHeaders());
      } else {
        await api.post("/api/vault/salary/rules", body, vaultHeaders());
      }
      setRuleModal(null);
      showToast(ruleModal.mode === "edit" ? "Rule updated." : "Rule added.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to save rule.", "error");
    } finally { setSavingRule(false); }
  };

  const toggleRule = async (rule) => {
    try {
      await api.patch(`/api/vault/salary/rules/${rule.id}/${rule.active ? "pause" : "resume"}`, {}, vaultHeaders());
      showToast(rule.active ? "Rule paused." : "Rule resumed.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to update rule.", "error");
    }
  };

  const deleteRule = async (rule) => {
    if (!window.confirm(`Delete the ${rule.categoryName} allocation rule?`)) return;
    try {
      await api.delete(`/api/vault/salary/rules/${rule.id}`, vaultHeaders());
      showToast("Rule deleted.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to delete rule.", "error");
    }
  };

  // ── Salary deposits ───────────────────────────────────────────────────────

  const saveDeposit = async (e) => {
    e.preventDefault();
    if (!depositForm.amount || Number(depositForm.amount) <= 0) { showToast("Enter a valid amount.", "error"); return; }
    setSavingDeposit(true);
    try {
      const body = {
        amount: Number(depositForm.amount),
        source: depositForm.source || null,
        receivedDate: depositForm.receivedDate,
        note: depositForm.note || null,
      };
      const res = await api.post("/api/vault/salary/deposits", body, vaultHeaders());
      setDepositModal(false);
      setDepositForm({ amount: "", source: "", receivedDate: today(), note: "" });
      setLastAllocation(res.data);
      showToast("Salary recorded — allocated across your categories.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to record salary.", "error");
    } finally { setSavingDeposit(false); }
  };

  const toggleDepositExpanded = async (deposit) => {
    if (expandedDepositId === deposit.id) { setExpandedDepositId(null); return; }
    setExpandedDepositId(deposit.id);
    if (deposit.allocations?.length) return; // already loaded (e.g. just recorded)
    try {
      const res = await api.get(`/api/vault/salary/deposits/${deposit.id}`, vaultHeaders());
      setDeposits(ds => ds.map(d => d.id === deposit.id ? res.data : d));
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to load allocation breakdown.", "error");
    }
  };

  // ── LumiFlows ──────────────────────────────────────────────────────────────

  const openFlowModal = (flow) => {
    setFlowForm(flow
      ? {
          name: flow.name, categoryId: flow.categoryId, amount: flow.amount, frequency: flow.frequency,
          intervalDays: flow.intervalDays ?? "", startDate: flow.startDate, endDate: flow.endDate || "",
          destinationLabel: flow.destinationLabel, maxOccurrences: flow.maxOccurrences ?? "", rolloverUnused: flow.rolloverUnused,
        }
      : { name: "", categoryId: "", amount: "", frequency: "WEEKLY", intervalDays: "", startDate: today(), endDate: "", destinationLabel: "", maxOccurrences: "", rolloverUnused: false });
    setShowFlowAdvanced(Boolean(flow?.endDate || flow?.maxOccurrences || flow?.rolloverUnused));
    setFlowModal({ mode: flow ? "edit" : "create", flow });
  };

  const saveFlow = async (e) => {
    e.preventDefault();
    if (!flowForm.name.trim()) { showToast("Name is required.", "error"); return; }
    if (!flowForm.categoryId) { showToast("Select a category.", "error"); return; }
    if (!flowForm.amount || Number(flowForm.amount) <= 0) { showToast("Enter a valid amount.", "error"); return; }
    if (flowForm.frequency === "CUSTOM" && (!flowForm.intervalDays || Number(flowForm.intervalDays) < 1)) {
      showToast("Enter the number of days between payouts.", "error"); return;
    }
    if (!flowForm.destinationLabel.trim()) { showToast("Destination is required.", "error"); return; }
    setSavingFlow(true);
    try {
      const body = {
        name: flowForm.name.trim(),
        categoryId: flowForm.categoryId,
        amount: Number(flowForm.amount),
        frequency: flowForm.frequency,
        intervalDays: flowForm.frequency === "CUSTOM" ? Number(flowForm.intervalDays) : null,
        startDate: flowForm.startDate,
        endDate: flowForm.endDate || null,
        destinationLabel: flowForm.destinationLabel.trim(),
        maxOccurrences: flowForm.maxOccurrences === "" ? null : Number(flowForm.maxOccurrences),
        rolloverUnused: flowForm.rolloverUnused,
      };
      if (flowModal.mode === "edit") {
        await api.put(`/api/vault/salary/flows/${flowModal.flow.id}`, body, vaultHeaders());
      } else {
        await api.post("/api/vault/salary/flows", body, vaultHeaders());
      }
      setFlowModal(null);
      showToast(flowModal.mode === "edit" ? "LumiFlow updated." : "LumiFlow created.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to save LumiFlow.", "error");
    } finally { setSavingFlow(false); }
  };

  const toggleFlow = async (flow) => {
    try {
      await api.patch(`/api/vault/salary/flows/${flow.id}/${flow.active ? "pause" : "resume"}`, {}, vaultHeaders());
      showToast(flow.active ? "LumiFlow paused." : "LumiFlow resumed.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to update LumiFlow.", "error");
    }
  };

  const deleteFlow = async (flow) => {
    if (!window.confirm(`Delete "${flow.name}"? This won't remove its past payout history.`)) return;
    try {
      await api.delete(`/api/vault/salary/flows/${flow.id}`, vaultHeaders());
      showToast("LumiFlow deleted.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to delete LumiFlow.", "error");
    }
  };

  const openPayoutHistory = async (flow) => {
    setPayoutHistoryModal({ flow, payouts: null });
    try {
      const res = await api.get(`/api/vault/salary/flows/${flow.id}/payouts`, vaultHeaders());
      setPayoutHistoryModal({ flow, payouts: res.data });
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to load payout history.", "error");
      setPayoutHistoryModal(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading…</div>;
  }

  if (!hasPin) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Set up your Vault</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            LumiFlow lives inside your private, PIN-locked Vault — the same space as your personal budget. Set a PIN to get started.
          </p>
          <form onSubmit={doSetup} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Choose a PIN (4–8 digits)</label>
              <input type="password" inputMode="numeric" maxLength={8} value={setupPin}
                onChange={e => setSetupPin(e.target.value.replace(/\D/g, ""))} className={pinInputCls} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Confirm PIN</label>
              <input type="password" inputMode="numeric" maxLength={8} value={setupConfirm}
                onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, ""))} className={pinInputCls} />
            </div>
            <button type="submit" disabled={settingUp}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
              {settingUp ? "Setting up…" : "Set Up Vault"}
            </button>
          </form>
        </div>
        <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
      </div>
    );
  }

  if (!vaultToken) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Vault Locked</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter your PIN to continue.</p>

          {!showForgot ? (
            <form onSubmit={doUnlock} className="space-y-3 text-left">
              <input type="password" inputMode="numeric" maxLength={8} value={unlockPin}
                onChange={e => setUnlockPin(e.target.value.replace(/\D/g, ""))} className={pinInputCls} autoFocus placeholder="••••" />
              <button type="submit" disabled={unlocking}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {unlocking ? "Unlocking…" : "Unlock"}
              </button>
              <button type="button" onClick={() => setShowForgot(true)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                Forgot PIN?
              </button>
            </form>
          ) : (
            <form onSubmit={doResetPin} className="space-y-3 text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400">Confirm your account password to reset your vault PIN.</p>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Account password</label>
                <input type="password" value={forgotPassword} onChange={e => setForgotPassword(e.target.value)} className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New PIN (4–8 digits)</label>
                <input type="password" inputMode="numeric" maxLength={8} value={forgotNewPin}
                  onChange={e => setForgotNewPin(e.target.value.replace(/\D/g, ""))} className={pinInputCls} />
              </div>
              <button type="submit" disabled={resetting}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {resetting ? "Resetting…" : "Reset PIN"}
              </button>
              <button type="button" onClick={() => setShowForgot(false)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                Back to unlock
              </button>
            </form>
          )}
        </div>
        <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
      </div>
    );
  }

  // ── Unlocked dashboard ─────────────────────────────────────────────────

  const percentCommitted = rules
    .filter(r => r.active && r.mode === "PERCENTAGE")
    .reduce((sum, r) => sum + Number(r.value), 0);

  const chartData = (salaryVault?.categories || [])
    .filter(c => Number(c.balance) > 0)
    .map(c => ({ name: c.categoryName, value: Number(c.balance) }));

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">LumiFlow</h2>
          <p className="text-xs text-slate-400">Get paid once. Live from it gradually.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChangePin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
            <KeyRound size={13} />Change PIN
          </button>
          <button onClick={lock}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
            <Lock size={13} />Lock
          </button>
        </div>
      </div>

      {/* Dashboard summary cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-400 mb-1">Last Salary</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              {dashboard.lastSalaryAmount != null ? formatCurrency(dashboard.lastSalaryAmount, currency) : "—"}
            </p>
            {dashboard.lastSalaryDate && <p className="text-xs text-slate-400 mt-1">{dashboard.lastSalaryDate}</p>}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-400 mb-1">Allocated</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(dashboard.totalAllocated || 0, currency)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-400 mb-1">Available for Distribution</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(dashboard.availableForDistribution || 0, currency)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-medium text-slate-400 mb-1">Next LumiFlow</p>
            {dashboard.nextPayout ? (
              <>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(dashboard.nextPayout.amount, currency)}</p>
                <p className="text-xs text-slate-400 mt-1">{dashboard.nextPayout.name} · {dashboard.nextPayout.date}</p>
              </>
            ) : <p className="text-sm text-slate-400">No active LumiFlows</p>}
          </div>
        </div>
      )}

      {/* Salary Vault + breakdown chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-3">
            <Wallet size={16} /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Salary Vault</h3>
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">{formatCurrency(salaryVault?.balance || 0, currency)}</p>
          {salaryVault?.categories?.length > 0 && (
            <div className="space-y-2 mb-4">
              {salaryVault.categories.map(c => (
                <div key={c.categoryId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{c.categoryName}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(c.balance, currency)}</span>
                </div>
              ))}
            </div>
          )}
          {salaryVault?.upcomingDistributions?.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-400 mb-2">Upcoming distributions</p>
              <div className="flex flex-wrap gap-2">
                {salaryVault.upcomingDistributions.map((u, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    {formatCurrency(u.amount, currency)} — {u.date}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Where it's going</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Record a salary to see the breakdown.</p>
          ) : (
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Allocation Rules */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Allocation Rules</h3>
          <button onClick={() => openRuleModal(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition">
            <Plus size={13} />Add Rule
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">{percentCommitted}% of salary committed by percentage rules</p>
        {rules.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No allocation rules yet — decide how your salary splits, e.g. 20% Savings, ₦50,000 Family.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rules.map(rule => (
              <div key={rule.id} className={`flex items-center justify-between py-2.5 ${!rule.active ? "opacity-50" : ""}`}>
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{rule.categoryName}</p>
                  <p className="text-xs text-slate-400">{!rule.active && "Paused · "}{rule.mode === "PERCENTAGE" ? `${rule.value}%` : formatCurrency(rule.value, currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRule(rule)} title={rule.active ? "Pause" : "Resume"}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition">{rule.active ? <Pause size={14} /> : <Play size={14} />}</button>
                  <button onClick={() => openRuleModal(rule)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><Edit2 size={13} /></button>
                  <button onClick={() => deleteRule(rule)} className="p-1 text-slate-400 hover:text-rose-600 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LumiFlows */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">My LumiFlows</h3>
          <button onClick={() => openFlowModal(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition">
            <Plus size={13} />New LumiFlow
          </button>
        </div>
        {flows.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No LumiFlows yet — e.g. ₦20,000 every Monday for spending.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flows.map(flow => (
              <div key={flow.id} className={`border border-slate-100 dark:border-slate-700 rounded-xl p-4 ${!flow.active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{flow.name}</p>
                    <p className="text-xs text-slate-400">{flow.categoryName} → {flow.destinationLabel}</p>
                  </div>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">{formatCurrency(flow.amount, currency)}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">
                  {flow.frequency === "CUSTOM" ? `Every ${flow.intervalDays} days` : FREQUENCY_LABEL[flow.frequency]}
                  {flow.active ? ` · Next: ${flow.nextPayoutDate}` : " · Paused"}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Category balance: {formatCurrency(flow.categoryBalance, currency)} · Distributed: {formatCurrency(flow.totalDistributed, currency)}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => openPayoutHistory(flow)} title="Payout history"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition"><History size={14} /></button>
                  <button onClick={() => toggleFlow(flow)} title={flow.active ? "Pause" : "Resume"}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition">{flow.active ? <Pause size={14} /> : <Play size={14} />}</button>
                  <button onClick={() => openFlowModal(flow)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><Edit2 size={13} /></button>
                  <button onClick={() => deleteFlow(flow)} className="p-1.5 text-slate-400 hover:text-rose-600 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary deposits */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Salary History</h3>
          <button onClick={() => setDepositModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
            <Banknote size={13} />Record Salary
          </button>
        </div>

        {lastAllocation && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{formatCurrency(lastAllocation.amount, currency)} allocated</p>
              <button onClick={() => setLastAllocation(null)} className="text-emerald-600 dark:text-emerald-400"><X size={14} /></button>
            </div>
            <div className="space-y-1">
              {(lastAllocation.allocations || []).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                  <span>{a.categoryName}{a.shortFunded && " (partially funded)"}</span>
                  <span>{formatCurrency(a.allocated, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dataLoading ? (
          <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>
        ) : deposits.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No salary recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {deposits.map(dep => (
              <div key={dep.id}>
                <button onClick={() => toggleDepositExpanded(dep)} className="w-full flex items-center justify-between py-2.5 text-left">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{dep.source || "Salary"}</p>
                    <p className="text-xs text-slate-400">{dep.receivedDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatCurrency(dep.amount, currency)}</span>
                    {expandedDepositId === dep.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </button>
                {expandedDepositId === dep.id && (
                  <div className="pb-3 pl-2 space-y-1">
                    {(dep.allocations || []).map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><ArrowRight size={11} />{a.categoryName}</span>
                        <span>{formatCurrency(a.allocated, currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rule modal */}
      {ruleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{ruleModal.mode === "edit" ? "Edit Rule" : "Add Allocation Rule"}</h3>
              <button onClick={() => setRuleModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={saveRule} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                <select value={ruleForm.categoryId} onChange={e => setRuleForm(f => ({ ...f, categoryId: e.target.value }))} className={inputCls} autoFocus>
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRuleForm(f => ({ ...f, mode: "PERCENTAGE" }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${ruleForm.mode === "PERCENTAGE" ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"}`}>
                  Percentage
                </button>
                <button type="button" onClick={() => setRuleForm(f => ({ ...f, mode: "FIXED" }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${ruleForm.mode === "FIXED" ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300" : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"}`}>
                  Fixed Amount
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{ruleForm.mode === "PERCENTAGE" ? "Percentage (%)" : "Amount"}</label>
                <input type="number" min="0" step={ruleForm.mode === "PERCENTAGE" ? "0.01" : "1"} max={ruleForm.mode === "PERCENTAGE" ? "100" : undefined}
                  value={ruleForm.value} onChange={e => setRuleForm(f => ({ ...f, value: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setRuleModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={savingRule} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{savingRule ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit modal */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Record Salary</h3>
              <button onClick={() => setDepositModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={saveDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount</label>
                <input type="number" min="0" step="0.01" value={depositForm.amount} onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date received</label>
                <input type="date" value={depositForm.receivedDate} onChange={e => setDepositForm(f => ({ ...f, receivedDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Source <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={depositForm.source} onChange={e => setDepositForm(f => ({ ...f, source: e.target.value }))} className={inputCls} placeholder="e.g. Company Ltd salary account" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={depositForm.note} onChange={e => setDepositForm(f => ({ ...f, note: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setDepositModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={savingDeposit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{savingDeposit ? "Recording…" : "Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flow modal */}
      {flowModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{flowModal.mode === "edit" ? "Edit LumiFlow" : "New LumiFlow"}</h3>
              <button onClick={() => setFlowModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={saveFlow} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                <input value={flowForm.name} onChange={e => setFlowForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Weekly Spending" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category (funding pot)</label>
                <select value={flowForm.categoryId} onChange={e => setFlowForm(f => ({ ...f, categoryId: e.target.value }))} className={inputCls}>
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount</label>
                <input type="number" min="0" step="0.01" value={flowForm.amount} onChange={e => setFlowForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Frequency</label>
                  <select value={flowForm.frequency} onChange={e => setFlowForm(f => ({ ...f, frequency: e.target.value }))} className={inputCls}>
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start date</label>
                  <input type="date" value={flowForm.startDate} onChange={e => setFlowForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              {flowForm.frequency === "CUSTOM" && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Every how many days?</label>
                  <input type="number" min="1" value={flowForm.intervalDays} onChange={e => setFlowForm(f => ({ ...f, intervalDays: e.target.value }))} className={inputCls} placeholder="e.g. 90" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Destination</label>
                <input value={flowForm.destinationLabel} onChange={e => setFlowForm(f => ({ ...f, destinationLabel: e.target.value }))} className={inputCls} placeholder="e.g. Spending Account" />
              </div>

              <button type="button" onClick={() => setShowFlowAdvanced(v => !v)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                {showFlowAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}Advanced options
              </button>
              {showFlowAdvanced && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End date <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input type="date" value={flowForm.endDate} onChange={e => setFlowForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max payouts <span className="text-slate-400 font-normal">(optional)</span></label>
                      <input type="number" min="1" value={flowForm.maxOccurrences} onChange={e => setFlowForm(f => ({ ...f, maxOccurrences: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <input type="checkbox" checked={flowForm.rolloverUnused} onChange={e => setFlowForm(f => ({ ...f, rolloverUnused: e.target.checked }))} className="rounded" />
                    Roll over a skipped payout's amount into the next one
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setFlowModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={savingFlow} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{savingFlow ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout history modal */}
      {payoutHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{payoutHistoryModal.flow.name} — History</h3>
              <button onClick={() => setPayoutHistoryModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            {payoutHistoryModal.payouts === null ? (
              <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>
            ) : payoutHistoryModal.payouts.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No payouts yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {payoutHistoryModal.payouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      {p.status === "PAID" ? <CheckCircle2 size={15} className="text-emerald-500" /> : <AlertCircle size={15} className="text-amber-500" />}
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{p.scheduledDate}</p>
                        {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatCurrency(p.amount, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change PIN modal */}
      {showChangePin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Change PIN</h3>
              <button onClick={() => setShowChangePin(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={doChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current PIN</label>
                <input type="password" inputMode="numeric" maxLength={8} value={currentPinInput} onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, ""))} className={pinInputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New PIN (4–8 digits)</label>
                <input type="password" inputMode="numeric" maxLength={8} value={newPinInput} onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ""))} className={pinInputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowChangePin(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={changingPin} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{changingPin ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
