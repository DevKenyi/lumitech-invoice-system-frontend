// Team.jsx — Team Management (SUPER_ADMIN / ADMIN only)
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  Users, UserPlus, Trash2, CheckCircle, XCircle, X, Eye, EyeOff,
  ShieldCheck, User,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

const ROLE_STYLE = {
  SUPER_ADMIN:   "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  ADMIN:         "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  STAFF:         "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  STAFF_EXPENSE: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
};

const ROLE_LABEL = {
  SUPER_ADMIN:   "Super Admin",
  ADMIN:         "Admin",
  STAFF:         "Staff",
  STAFF_EXPENSE: "Staff (Expense)",
};

// ── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({ roleToCreate, onClose, onSuccess }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const endpoint = roleToCreate === "ADMIN" ? "/api/auth/admin"
      : roleToCreate === "STAFF_EXPENSE" ? "/api/auth/staff-expense"
      : "/api/auth/staff";
    try {
      await api.post(endpoint, { username: form.username, password: form.password, email: form.email || null });
      onSuccess(`${roleToCreate} "${form.username}" created successfully${form.email ? " — welcome email sent" : ""}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add {roleToCreate}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <X size={16} />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl text-rose-600 dark:text-rose-300 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              placeholder="e.g. john_doe"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
              Email <span className="text-slate-400 font-normal">(optional — sends welcome email with login link)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="staff@example.com"
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 pr-11 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
                placeholder="Re-enter password"
                className={`w-full px-4 py-2.5 pr-11 border rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 transition ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 dark:border-slate-600 focus:ring-blue-500/20 focus:border-blue-500"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60">
              {loading ? "Creating…" : `Add ${roleToCreate}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function Team() {
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const isSuperAdmin = role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN";
  const isAdmin = role === "ADMIN" || isSuperAdmin;
  const canAccess = isAdmin;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addRole, setAddRole] = useState(null); // "ADMIN" | "STAFF" | null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const fetchMembers = () => {
    setLoading(true);
    api.get("/api/auth/users")
      .then(res => setMembers(res.data.content ?? res.data ?? []))
      .catch(() => showToast("Failed to load team members", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!canAccess) return; fetchMembers(); }, []);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/auth/users/${deleteTarget.username}`);
      setMembers(prev => prev.filter(m => m.username !== deleteTarget.username));
      showToast(`${deleteTarget.username} removed`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Team
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage who has access to your organisation.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button onClick={() => setAddRole("STAFF_EXPENSE")} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
              <UserPlus size={16} />Add Staff (Expense)
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setAddRole("STAFF")} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
              <UserPlus size={16} />Add Staff
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={() => setAddRole("ADMIN")} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all">
              <UserPlus size={16} />Add Admin
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Team Members</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">{members.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4"><Users className="w-8 h-8 text-slate-400" /></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">No team members yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {members.map(member => {
                  const isSelf = member.username === user?.username;
                  const isProtected = member.role === "SUPER_ADMIN";
                  const RoleIcon = (member.role === "STAFF" || member.role === "STAFF_EXPENSE") ? User : ShieldCheck;
                  return (
                    <tr key={member.id ?? member.username} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {member.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {member.username}
                              {isSelf && <span className="ml-2 text-xs text-slate-400 font-normal">(you)</span>}
                            </p>
                            {member.email && (
                              <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLE[member.role] ?? ROLE_STYLE.STAFF}`}>
                          <RoleIcon size={11} />
                          {ROLE_LABEL[member.role] ?? member.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {member.verified
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle size={14} />Yes</span>
                          : <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium"><XCircle size={14} />No</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {member.suspended
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"><XCircle size={11} />Suspended</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"><CheckCircle size={11} />Active</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(member)}
                          disabled={isProtected || isSelf}
                          title={isProtected ? "Cannot remove SUPER_ADMIN" : isSelf ? "Cannot remove yourself" : `Remove ${member.username}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} />Remove
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

      {/* Add Modal */}
      {addRole && (
        <AddMemberModal
          roleToCreate={addRole}
          onClose={() => setAddRole(null)}
          onSuccess={(msg) => { showToast(msg); fetchMembers(); }}
        />
      )}

      <ConfirmModal
        visible={!!deleteTarget}
        title="Remove Member"
        message={`Remove ${deleteTarget?.username}? They will lose access immediately.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

export default Team;
