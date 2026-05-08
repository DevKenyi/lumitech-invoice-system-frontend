// ProjectList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FolderOpen,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";
import NumericInput from "../components/NumericInput";

const CATEGORIES = [
  "CONSTRUCTION", "SOFTWARE", "CONSULTING", "CREATIVE",
  "RETAIL", "LEGAL", "MEDICAL", "EVENTS", "OTHER",
];

const STATUSES = ["ACTIVE", "ON_HOLD", "SUSPENDED", "CANCELLED", "COMPLETED"];

const STATUS_STYLE = {
  ACTIVE:    "bg-emerald-100 text-emerald-700",
  ON_HOLD:   "bg-amber-100 text-amber-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};



const PAGE_SIZE = 10;

function ProjectList() {
  const { fmt, currencySymbol } = useOrg();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [showCreate, setShowCreate] = useState(false);
  const [clients, setClients] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", clientId: "", category: "", contractValue: "",
    description: "", status: "ACTIVE",
  });

  const fetchProjects = () => {
    setLoading(true);
    api.get("/api/projects", { params: { page: 0, size: 1000 } })
      .then(res => setProjects(res.data.content ?? res.data))
      .catch(() => setToast({ visible: true, message: "Failed to load projects", type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
    api.get("/api/clients", { params: { page: 0, size: 100 } })
      .then(res => setClients(res.data.content ?? res.data))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const visible = projects.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setForm({ name: "", clientId: "", category: "", contractValue: "", description: "", status: "ACTIVE" });
    setShowCreate(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post("/api/projects", {
        ...form,
        contractValue: Number(form.contractValue),
      });
      setShowCreate(false);
      fetchProjects();
      setToast({ visible: true, message: "Project created", type: "success" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create project.";
      setToast({ visible: true, message: msg, type: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            Projects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center gap-4 max-w-xs mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-2xl flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No projects yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Group invoices under a project to track what you've billed per client engagement.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contract Value</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-36">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {visible.map(p => {
                    const paidPct = Math.min(100, Math.max(0, p.percentagePaid ?? 0));
                    const invoicedPct = Math.min(100, Math.max(0, p.percentageInvoiced ?? 0));
                    const outstandingPct = Math.max(0, invoicedPct - paidPct);
                    const remainingPct = Math.max(0, 100 - invoicedPct);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.clientName ?? p.client?.name ?? "—"}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.category ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {p.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                          {fmt(p.revisedContractValue ?? p.contractValue ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 w-full">
                            <div className="bg-emerald-500 h-full" style={{ width: `${paidPct}%` }} />
                            <div className="bg-amber-400 h-full" style={{ width: `${outstandingPct}%` }} />
                            <div className="bg-slate-200 dark:bg-slate-600 h-full" style={{ width: `${remainingPct}%` }} />
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{Math.round(paidPct)}% paid</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, projects.length)} of {projects.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition text-slate-600 dark:text-slate-300"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition text-slate-600 dark:text-slate-300"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/80 dark:border-slate-700 rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                New Project
              </h3>
              <button onClick={() => setShowCreate(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Project Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. HQ Renovation Phase 1"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Client *</label>
                <select
                  required
                  value={form.clientId}
                  onChange={e => setForm({ ...form, clientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="">Select a client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="">Select</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Contract Value (₦) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">₦</span>
                  <NumericInput
                    required
                    value={form.contractValue}
                    onChange={e => setForm({ ...form, contractValue: e.target.value })}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief project description..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
                >
                  <Plus size={15} />
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

export default ProjectList;
