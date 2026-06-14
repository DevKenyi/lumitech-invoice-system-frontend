// ClientList.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  Users, Plus, Trash2, Mail, Phone, MapPin, MoreVertical,
  AlertCircle, CheckCircle, Download, Bell, BellOff, X, Settings2, Upload, FileText,
} from "lucide-react";
import { useOrg } from "../context/OrgContext";

const exportCsv = async (endpoint, filename) => {
  const res = await api.get(endpoint, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [reminderClient, setReminderClient] = useState(null);
  const [reminderForm, setReminderForm] = useState({ remindersEnabled: true, reminderDaysBefore: 3, reminderFrequencyDays: 0 });
  const [savingReminder, setSavingReminder] = useState(false);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 20;
  const navigate = useNavigate();
  const { fmt } = useOrg();
  const user = getUserFromToken();
  const isAdmin = user && (user.role === "ADMIN" || (Array.isArray(user.roles) && user.roles.includes("ADMIN")));

  useEffect(() => {
    fetchClients(page);
  }, [page]);

  const fetchClients = async (currentPage) => {
    try {
      setLoading(true);
      const res = await api.get("/api/clients", { params: { page: currentPage, size: PAGE_SIZE } });
      setClients(res.data.content);
      setTotalElements(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Fetch clients error:", err);
      setToast({ visible: true, message: "Failed to load clients", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", importFile);
      const res = await api.post("/api/clients/import", form, { headers: { "Content-Type": "multipart/form-data" } });
      setImportResult(res.data);
      setImportFile(null);
      fetchClients(0);
      setPage(0);
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || "Import failed. Please check your file and try again." });
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csv = "name,email,phone,address\nAcme Ltd,acme@example.com,+234 800 000 0001,\"12 Lagos Street, Lagos\"\nBeta Corp,beta@example.com,+234 800 000 0002,\"5 Accra Road, Accra\"";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sample-clients.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const openReminderSettings = (e, client) => {
    e.stopPropagation();
    setReminderClient(client);
    setReminderForm({
      remindersEnabled: client.remindersEnabled ?? true,
      reminderDaysBefore: client.reminderDaysBefore ?? 3,
      reminderFrequencyDays: client.reminderFrequencyDays ?? 0,
    });
  };

  const saveReminderSettings = async () => {
    setSavingReminder(true);
    try {
      const res = await api.patch(`/api/clients/${reminderClient.id}/reminders`, reminderForm);
      setClients(prev => prev.map(c => c.id === reminderClient.id ? { ...c, ...res.data } : c));
      setToast({ visible: true, message: "Reminder settings saved", type: "success" });
      setReminderClient(null);
    } catch {
      setToast({ visible: true, message: "Failed to save reminder settings", type: "error" });
    } finally { setSavingReminder(false); }
  };

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/clients/${selectedClient.id}`);
      setToast({ visible: true, message: "Client deleted successfully", type: "success" });
      fetchClients(page);
    } catch (err) {
      console.error("Delete client error:", err);
      setToast({ visible: true, message: "Failed to delete client", type: "error" });
    }
    finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSelectedClient(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Customers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your client list</p>
        </div>
        <Link
          to="/clients/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] transition-all duration-200 w-full sm:w-auto"
        >
          <Plus size={18} />
          Add Customer
        </Link>
      </div>

      {/* Clients Table */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">All Customers</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hidden sm:inline text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              {clients.length} of {totalElements}
            </span>
            {isAdmin && (
              <button
                onClick={() => { setShowImport(true); setImportResult(null); setImportFile(null); }}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition text-sm"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
            )}
            <button
              onClick={async () => {
                setExporting(true);
                try { await exportCsv("/api/export/clients", "clients.csv"); }
                catch { /* silent */ }
                finally { setExporting(false); }
              }}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export CSV"}</span>
              <span className="sm:hidden">{exporting ? "..." : "CSV"}</span>
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center gap-4 max-w-xs mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No customers yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Add your first customer before creating an invoice. You can import a list or add them one by one.
              </p>
            </div>
            <Link
              to="/clients/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/25 hover:scale-[1.02] transition-all"
            >
              <Plus size={16} />
              Add Your First Customer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="hidden sm:table-cell px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {clients.map((client) => (
                  <tr key={client.id} onClick={() => navigate(`/clients/${client.id}`)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-900 dark:text-white font-medium text-sm sm:text-base">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-none">{client.email || "—"}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        {client.phone || "—"}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        <span className="truncate max-w-xs">{client.address || "—"}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-right">
                      {client.outstandingBalance > 0 ? (
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{fmt(client.outstandingBalance)}</span>
                      ) : (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => openReminderSettings(e, client)}
                          className="p-2 rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Reminder settings"
                        >
                          {client.remindersEnabled === false
                            ? <BellOff size={16} className="text-slate-400" />
                            : <Bell size={16} className="text-blue-500" />}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(client); }}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            title="Delete client"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page + 1 >= totalPages}
                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
      {/* Reminder Settings Modal */}
      {reminderClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell size={16} className="text-blue-500" /> Reminder Settings
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{reminderClient.name}</p>
              </div>
              <button onClick={() => setReminderClient(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Email reminders</p>
                  <p className="text-xs text-slate-400 mt-0.5">Send automatic invoice reminders to this client</p>
                </div>
                <button
                  onClick={() => setReminderForm(f => ({ ...f, remindersEnabled: !f.remindersEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 ${reminderForm.remindersEnabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${reminderForm.remindersEnabled ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {reminderForm.remindersEnabled && (
                <>
                  {/* Days before */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Send reminder <span className="text-blue-600 font-bold">{reminderForm.reminderDaysBefore}</span> day{reminderForm.reminderDaysBefore !== 1 ? "s" : ""} before due date
                    </label>
                    <input type="range" min="1" max="14" step="1"
                      value={reminderForm.reminderDaysBefore}
                      onChange={e => setReminderForm(f => ({ ...f, reminderDaysBefore: Number(e.target.value) }))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>1 day</span><span>7 days</span><span>14 days</span>
                    </div>
                  </div>

                  {/* Repeat frequency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Repeat overdue reminder
                    </label>
                    <select
                      value={reminderForm.reminderFrequencyDays}
                      onChange={e => setReminderForm(f => ({ ...f, reminderFrequencyDays: Number(e.target.value) }))}
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value={0}>Once only (no repeat)</option>
                      <option value={3}>Every 3 days</option>
                      <option value={7}>Every week</option>
                      <option value={14}>Every 2 weeks</option>
                      <option value={30}>Every month</option>
                    </select>
                    <p className="text-xs text-slate-400">After an invoice is overdue, how often to keep reminding</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setReminderClient(null)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                Cancel
              </button>
              <button onClick={saveReminderSettings} disabled={savingReminder}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow shadow-blue-600/25 hover:scale-[1.02] transition-all disabled:opacity-50">
                {savingReminder ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Customer"
        message={`Are you sure you want to delete "${selectedClient?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={isDeleting}
      />

      {/* CSV Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Import Customers from CSV</h2>
              </div>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {!importResult ? (
              <>
                <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 mb-4 text-sm text-slate-600 dark:text-slate-300">
                  <p className="font-medium mb-1">Required column: <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">name</code></p>
                  <p>Optional: <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">email</code>, <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">phone</code>, <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">address</code></p>
                </div>

                <button onClick={downloadSampleCsv} className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4">
                  <FileText className="w-4 h-4" /> Download sample CSV
                </button>

                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition mb-4 ${importFile ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"}`}>
                  <input type="file" accept=".csv" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
                  {importFile ? (
                    <div className="text-center">
                      <FileText className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{importFile.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Click to choose a CSV file</p>
                    </div>
                  )}
                </label>

                <div className="flex items-center gap-3 justify-end">
                  <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {importing ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import</>}
                  </button>
                </div>
              </>
            ) : importResult.error ? (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-4">{importResult.error}</p>
                <button onClick={() => setImportResult(null)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-600 dark:text-slate-300">Try again</button>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{importResult.imported} customers imported</p>
                {importResult.skipped > 0 && <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">{importResult.skipped} rows skipped</p>}
                {importResult.errors?.length > 0 && (
                  <ul className="text-xs text-slate-500 dark:text-slate-400 text-left bg-slate-50 dark:bg-slate-700/40 rounded-lg p-3 mb-3 max-h-28 overflow-y-auto">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
                <button onClick={() => setShowImport(false)} className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientList;
