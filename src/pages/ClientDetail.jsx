// ClientDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Link2,
  Copy,
  CheckCircle,
  Trash2,
  Edit2,
  X,
  Save,
  FolderOpen,
  Send,
  Plus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { getUserFromToken } from "../services/api";
import { useOrg } from "../context/OrgContext";

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fmt } = useOrg();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const user = getUserFromToken();
  const isAdmin =
    user &&
    (user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN" ||
      user.role === "PLATFORM_ADMIN" ||
      (Array.isArray(user.roles) &&
        (user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN") || user.roles.includes("PLATFORM_ADMIN"))));
  const isSuperAdmin =
    user &&
    (user.role === "SUPER_ADMIN" ||
      user.role === "PLATFORM_ADMIN" ||
      (Array.isArray(user.roles) && (user.roles.includes("SUPER_ADMIN") || user.roles.includes("PLATFORM_ADMIN"))));

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [editCcList, setEditCcList] = useState([]);
  const [editCcInput, setEditCcInput] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Send statement state
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [ccInput, setCcInput] = useState("");
  const [ccList, setCcList] = useState([]);
  const [isSendingStatement, setIsSendingStatement] = useState(false);

  // View statement state
  const [showViewStatement, setShowViewStatement] = useState(false);
  const [statement, setStatement] = useState(null);
  const [stmtFrom, setStmtFrom] = useState(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [stmtTo, setStmtTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [stmtLoading, setStmtLoading] = useState(false);

  useEffect(() => {
    api
      .get(`/api/clients/${id}`)
      .then((res) => setClient(res.data))
      .catch(() =>
        setToast({ visible: true, message: "Failed to load client", type: "error" })
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== "projects") return;
    setProjectsLoading(true);
    api.get(`/api/projects/client/${id}`)
      .then(res => setProjects(res.data.content ?? res.data ?? []))
      .catch(() => setToast({ visible: true, message: "Failed to load projects", type: "error" }))
      .finally(() => setProjectsLoading(false));
  }, [activeTab, id]);

  const openEditModal = () => {
    setEditForm({ name: client.name || "", email: client.email || "", phone: client.phone || "", address: client.address || "" });
    setEditCcList(client.ccEmails || []);
    setEditCcInput("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSavingEdit(true);
      const res = await api.put(`/api/clients/${id}`, { ...editForm, ccEmails: editCcList });
      setClient(res.data);
      setShowEditModal(false);
      setToast({ visible: true, message: "Client updated successfully", type: "success" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update client.";
      setToast({ visible: true, message: msg, type: "error" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const addCc = () => {
    const email = ccInput.trim();
    if (email && !ccList.includes(email)) setCcList([...ccList, email]);
    setCcInput("");
  };

  const loadStatement = async () => {
    setStmtLoading(true);
    try {
      const res = await api.get(`/api/clients/${id}/statement?from=${stmtFrom}&to=${stmtTo}`);
      setStatement(res.data);
    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || "Failed to load statement", type: "error" });
    } finally {
      setStmtLoading(false);
    }
  };

  const handleSendStatement = async () => {
    try {
      setIsSendingStatement(true);
      await api.post(`/api/clients/${id}/send-statement`, { cc: ccList });
      setShowStatementModal(false);
      setCcList([]);
      setCcInput("");
      setToast({ visible: true, message: "Statement sent to client's email", type: "success" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send statement.";
      setToast({ visible: true, message: msg, type: "error" });
    } finally {
      setIsSendingStatement(false);
    }
  };

  const deleteClient = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/api/clients/${id}`);
      navigate("/clients");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete client.";
      setToast({ visible: true, message: msg, type: "error" });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyPortalLink = () => {
    navigator.clipboard.writeText(client.portalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRefreshPortalToken = async () => {
    setRefreshing(true);
    try {
      const res = await api.post(`/api/clients/${id}/refresh-portal-token`);
      setClient(prev => ({ ...prev, portalUrl: res.data.portalUrl }));
      setConfirmRefresh(false);
      setToast({ visible: true, message: "Portal link refreshed — old link is now invalid", type: "success" });
    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || "Failed to refresh link", type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setStatement(null); setShowViewStatement(true); loadStatement(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition shadow-sm text-sm font-medium"
          >
            <RefreshCw size={16} />
            View Statement
          </button>
          {client?.email && (
            <button
              onClick={() => { setCcList(client?.ccEmails || []); setCcInput(""); setShowStatementModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all text-sm font-medium"
            >
              <Send size={16} />
              Send Statement
            </button>
          )}
          {isAdmin && (
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 transition shadow-sm text-sm font-medium"
            >
              <Edit2 size={16} />
              Edit
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition shadow-sm text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete Client
            </button>
          )}
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{client.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Client details</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-wrap gap-6">
          {client.email && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              {client.email}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              {client.phone}
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              {client.address}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {[
          { key: "details", label: "Details" },
          { key: "projects", label: "Projects", icon: FolderOpen },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon && <tab.icon size={15} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {projectsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-slate-200 border-t-blue-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <FolderOpen className="mx-auto w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No projects for this client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contract Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {projects.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.category ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          { ACTIVE: "bg-emerald-100 text-emerald-700", ON_HOLD: "bg-amber-100 text-amber-700", SUSPENDED: "bg-orange-100 text-orange-700", CANCELLED: "bg-rose-100 text-rose-700", COMPLETED: "bg-blue-100 text-blue-700" }[p.status] ?? "bg-slate-100 text-slate-600"
                        }`}>
                          {p.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        {fmt(p.revisedContractValue ?? p.contractValue ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Portal Link Section */}
      {activeTab === "details" && client.portalUrl && (
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Client Portal Link</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Share this link with the client to let them view and pay their invoices online.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={client.portalUrl}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm focus:outline-none truncate"
            />
            <div className="flex gap-2">
              <button
                onClick={copyPortalLink}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  copied
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={() => setConfirmRefresh(true)}
                title="Generate a new link — old link becomes invalid"
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
              >
                <RefreshCw size={15} />
                <span className="hidden sm:inline">Refresh Link</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            If the link is expired or shared with the wrong person, refresh it to generate a new one. The old link will stop working immediately.
          </p>
        </div>
      )}

      {/* Confirm Refresh Portal Link Dialog */}
      {confirmRefresh && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Refresh Portal Link?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              A new link will be generated for <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>. The current link will stop working immediately — you'll need to share the new one with the client.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRefresh(false)}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRefreshPortalToken}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition disabled:opacity-60"
              >
                {refreshing ? "Refreshing…" : "Yes, Refresh Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/80 dark:border-slate-700 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Client
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Name", field: "name", type: "text", icon: <Edit2 className="w-4 h-4 text-slate-400" /> },
                { label: "Email", field: "email", type: "email", icon: <Mail className="w-4 h-4 text-slate-400" /> },
                { label: "Phone", field: "phone", type: "text", icon: <Phone className="w-4 h-4 text-slate-400" /> },
                { label: "Address", field: "address", type: "text", icon: <MapPin className="w-4 h-4 text-slate-400" /> },
              ].map(({ label, field, type, icon }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
                    <input
                      type={type}
                      value={editForm[field]}
                      onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      placeholder={label}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* CC Emails */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">CC Emails <span className="text-slate-400 font-normal">(optional)</span></label>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">These addresses are automatically CC'd on every invoice and statement sent to this client.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={editCcInput}
                  onChange={e => setEditCcInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === ",") && editCcInput.trim()) {
                      e.preventDefault();
                      const email = editCcInput.trim();
                      if (!editCcList.includes(email)) setEditCcList([...editCcList, email]);
                      setEditCcInput("");
                    }
                  }}
                  placeholder="cc@example.com"
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    const email = editCcInput.trim();
                    if (email && !editCcList.includes(email)) setEditCcList([...editCcList, email]);
                    setEditCcInput("");
                  }}
                  disabled={!editCcInput.trim()}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
                >Add</button>
              </div>
              {editCcList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editCcList.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
                      {email}
                      <button type="button" onClick={() => setEditCcList(editCcList.filter(e => e !== email))} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editForm.name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
              >
                <Save size={15} />
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Statement Modal */}
      {showStatementModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/80 dark:border-slate-700 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Send Statement
              </h3>
              <button onClick={() => setShowStatementModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              An email with all outstanding invoices and payment links will be sent to{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{client.email}</span>.
            </p>

            {/* CC Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                CC (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={ccInput}
                  onChange={e => setCcInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCc(); } }}
                  placeholder="colleague@example.com"
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={addCc}
                  disabled={!ccInput.trim()}
                  className="inline-flex items-center gap-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition text-sm disabled:opacity-40"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
              {ccList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {ccList.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-xs text-blue-700 dark:text-blue-300 font-medium">
                      {email}
                      <button type="button" onClick={() => setCcList(ccList.filter(e => e !== email))} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowStatementModal(false)} disabled={isSendingStatement} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                Cancel
              </button>
              <button
                onClick={handleSendStatement}
                disabled={isSendingStatement}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60"
              >
                {isSendingStatement
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                  : <><Send size={15} />Send Statement</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />

      {/* View Statement Modal */}
      {showViewStatement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="font-semibold text-slate-900 dark:text-white">Account Statement — {client?.name}</h2>
              <button onClick={() => setShowViewStatement(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Date filters */}
            <div className="flex flex-col gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-slate-500 dark:text-slate-400 whitespace-nowrap">From</label>
                  <input type="date" value={stmtFrom} onChange={e => setStmtFrom(e.target.value)}
                    className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-slate-500 dark:text-slate-400 whitespace-nowrap">To</label>
                  <input type="date" value={stmtTo} onChange={e => setStmtTo(e.target.value)}
                    className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                </div>
              </div>
              <button onClick={loadStatement}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <RefreshCw size={13} className={stmtLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {stmtLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                  <RefreshCw size={18} className="animate-spin" /> Loading statement…
                </div>
              ) : !statement ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No data</div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Opening Balance", value: statement.openingBalance, color: "text-slate-700 dark:text-slate-300" },
                      { label: "Total Charged",   value: statement.totalCharged,   color: "text-rose-600 dark:text-rose-400" },
                      { label: "Total Paid",      value: statement.totalPaid,      color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Closing Balance", value: statement.closingBalance, color: statement.closingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400" },
                    ].map(card => (
                      <div key={card.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                        <p className={`text-sm font-bold ${card.color}`}>
                          {fmt(card.value || 0)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Transactions table */}
                  {statement.transactions?.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-8">No transactions in this period</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Type</th>
                            <th className="px-4 py-2.5">Reference</th>
                            <th className="px-4 py-2.5 text-right">Debit</th>
                            <th className="px-4 py-2.5 text-right">Credit</th>
                            <th className="px-4 py-2.5 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {statement.transactions.map((tx, i) => {
                            const typeCls = tx.type === "INVOICE" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                              : tx.type === "PAYMENT" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
                            const f = (v) => v > 0 ? fmt(v) : "—";
                            return (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.date}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeCls}`}>
                                    {tx.type.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{tx.reference}</td>
                                <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">{f(tx.debit)}</td>
                                <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{f(tx.credit)}</td>
                                <td className={`px-4 py-2.5 text-right font-semibold ${tx.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
                                  {fmt(tx.balance || 0)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Client"
        message={`Are you sure you want to delete "${client.name}"? This cannot be undone. Clients with existing invoices cannot be deleted.`}
        onConfirm={deleteClient}
        onCancel={() => setShowDeleteModal(false)}
        loading={isDeleting}
      />
    </div>
  );
}

export default ClientDetail;
