// ChartOfAccounts.jsx — Accounting > Chart of Accounts
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import { BookOpen, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useOrg } from "../context/OrgContext";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const SUB_TYPE_OPTIONS = {
  ASSET:     ["CURRENT_ASSET", "NON_CURRENT_ASSET"],
  LIABILITY: ["CURRENT_LIABILITY", "NON_CURRENT_LIABILITY"],
  EQUITY:    [],
  INCOME:    [],
  EXPENSE:   [],
};

const SUB_TYPE_LABEL = {
  CURRENT_ASSET:          "Current Asset",
  NON_CURRENT_ASSET:      "Non-Current Asset",
  CURRENT_LIABILITY:      "Current Liability",
  NON_CURRENT_LIABILITY:  "Non-Current Liability",
};

const TYPE_STYLE = {
  ASSET:     "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  LIABILITY: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  EQUITY:    "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  INCOME:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  EXPENSE:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

const TYPE_HEADER = {
  ASSET:     "border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
  LIABILITY: "border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300",
  EQUITY:    "border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
  INCOME:    "border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  EXPENSE:   "border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
};

const EMPTY = { code: "", name: "", type: "ASSET", subType: "CURRENT_ASSET", description: "" };

function AccountModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial?.id;

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    // reset subType when type changes
    if (k === "type") {
      const opts = SUB_TYPE_OPTIONS[v] ?? [];
      updated.subType = opts.length > 0 ? opts[0] : "";
    }
    return updated;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.code.trim() || !form.name.trim()) { setError("Code and Name are required."); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/api/accounting/accounts/${initial.id}`, form);
        onSaved(data, "edit");
      } else {
        const { data } = await api.post("/api/accounting/accounts", form);
        onSaved(data, "add");
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isEdit ? "Edit Account" : "New Account"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl text-rose-600 dark:text-rose-300 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Account Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => set("code", e.target.value)}
                required
                placeholder="e.g. 1000"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Account Type *</label>
              <select
                value={form.type}
                onChange={e => set("type", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {(SUB_TYPE_OPTIONS[form.type]?.length > 0) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Classification</label>
              <select
                value={form.subType ?? ""}
                onChange={e => set("subType", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                {SUB_TYPE_OPTIONS[form.type].map(st => (
                  <option key={st} value={st}>{SUB_TYPE_LABEL[st]}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Account Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              required
              placeholder="e.g. Cash and Cash Equivalents"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={2}
              placeholder="Optional description..."
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60">
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccountRows({ accounts, type, canEdit, onEdit, onDelete }) {
  const { fmt } = useOrg();
  if (accounts.length === 0) return null;
  return accounts.map(acc => (
    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-6 py-4">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${TYPE_STYLE[type]}`}>
          {acc.code}
        </span>
      </td>
      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{acc.name}</td>
      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{acc.description || "—"}</td>
      <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-200">{fmt(acc.balance)}</td>
      {canEdit && (
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => onEdit(acc)} disabled={acc.isDefault}
              title={acc.isDefault ? "System account — cannot edit" : "Edit"}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(acc)} disabled={acc.isDefault}
              title={acc.isDefault ? "System account — cannot delete" : "Delete"}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      )}
    </tr>
  ));
}

function AccountGroup({ type, accounts, canEdit, onEdit, onDelete }) {
  const { fmt } = useOrg();
  const [open, setOpen] = useState(true);
  const total = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);

  const cogsAccounts = type === "EXPENSE" ? accounts.filter(a => a.subType === "DIRECT_COST") : [];
  const opexAccounts = type === "EXPENSE" ? accounts.filter(a => a.subType !== "DIRECT_COST") : accounts;

  const colSpan = canEdit ? 5 : 4;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 border-b ${TYPE_HEADER[type]} transition`}
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-semibold text-sm tracking-wide">{type}</span>
          <span className="text-xs opacity-70 bg-white/30 px-2 py-0.5 rounded-full">{accounts.length}</span>
        </div>
        <span className="text-sm font-semibold">{fmt(total)}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balance</th>
                {canEdit && <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {type === "EXPENSE" ? (
                <>
                  {cogsAccounts.length > 0 && (
                    <>
                      <tr className="bg-orange-50/60 dark:bg-orange-900/10">
                        <td colSpan={colSpan} className="px-6 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                          Cost of Goods Sold (COGS)
                        </td>
                      </tr>
                      <AccountRows accounts={cogsAccounts} type={type} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
                    </>
                  )}
                  {cogsAccounts.length > 0 && opexAccounts.length > 0 && (
                    <tr className="bg-amber-50/60 dark:bg-amber-900/10">
                      <td colSpan={colSpan} className="px-6 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Operating Expenses
                      </td>
                    </tr>
                  )}
                  {opexAccounts.length > 0 ? (
                    <AccountRows accounts={opexAccounts} type={type} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
                  ) : accounts.length === 0 ? (
                    <tr>
                      <td colSpan={colSpan} className="px-6 py-8 text-center text-sm text-slate-400">
                        No expense accounts yet.
                      </td>
                    </tr>
                  ) : null}
                </>
              ) : (
                accounts.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-6 py-8 text-center text-sm text-slate-400">
                      No {type.toLowerCase()} accounts yet.
                    </td>
                  </tr>
                ) : (
                  <AccountRows accounts={accounts} type={type} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChartOfAccounts() {
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const canEdit = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(role);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | account object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  useEffect(() => {
    api.get("/api/accounting/accounts")
      .then(res => setAccounts(res.data?.content ?? res.data ?? []))
      .catch(() => showToast("Failed to load accounts", "error"))
      .finally(() => setLoading(false));
  }, []);

  const grouped = ACCOUNT_TYPES.reduce((acc, t) => {
    acc[t] = accounts.filter(a => a.type === t);
    return acc;
  }, {});

  const handleSaved = (account, mode) => {
    if (mode === "edit") {
      setAccounts(prev => prev.map(a => a.id === account.id ? account : a));
      showToast("Account updated");
    } else {
      setAccounts(prev => [...prev, account]);
      showToast("Account created");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/accounting/accounts/${deleteTarget.id}`);
      setAccounts(prev => prev.filter(a => a.id !== deleteTarget.id));
      showToast(`Account "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete account.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Chart of Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your organisation's general ledger accounts.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModal("add")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus size={16} />New Account
          </button>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ACCOUNT_TYPES.map(t => (
          <div key={t} className={`rounded-xl px-4 py-3 border ${TYPE_HEADER[t]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">{t}</p>
            <p className="text-lg font-bold">{grouped[t].length}</p>
          </div>
        ))}
      </div>

      {/* Account groups */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {ACCOUNT_TYPES.map(t => (
            <AccountGroup
              key={t}
              type={t}
              accounts={grouped[t]}
              canEdit={canEdit}
              onEdit={(acc) => setModal(acc)}
              onDelete={(acc) => setDeleteTarget(acc)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <AccountModal
          initial={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Account"
        message={`Delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

export default ChartOfAccounts;
