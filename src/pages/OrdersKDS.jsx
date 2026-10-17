import { useEffect, useState, useCallback, useRef } from "react";
import api, { getUserFromToken } from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";
import {
  RefreshCw, X, Clock, Loader2, ChevronDown, Store, Wifi,
  Hash, ShoppingBag, RotateCcw, ChevronUp, Settings, Save, CheckCircle,
  ShieldAlert, Mail,
} from "lucide-react";

const fmt = (val, currency) =>
  currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CONFIG = {
  received:  { label: "Active",    classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  completed: { label: "Completed", classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

function RestaurantSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [poolSize, setPoolSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get("/api/restaurant-settings")
      .then(res => setPoolSize(String(res.data.standPoolSize ?? 30)))
      .catch(() => {});
  }, [open]);

  async function save() {
    const n = parseInt(poolSize, 10);
    if (isNaN(n) || n < 1 || n > 200) return;
    setSaving(true);
    try {
      await api.put("/api/restaurant-settings", { standPoolSize: n });
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    } catch (e) {
      alert(e.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        title="Restaurant Settings"
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-600 px-2.5 py-1.5 rounded-lg transition-colors">
        <Settings size={13} /> Settings
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 p-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-3">Restaurant Settings</h3>
          <label className="block text-xs text-slate-500 mb-1">Stand Pool Size (1–200)</label>
          <input
            type="number" min="1" max="200"
            value={poolSize}
            onChange={e => setPoolSize(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1 mb-4">
            The total number of physical stands your restaurant owns. Dine-in orders are assigned a stand from this pool.
          </p>
          <button onClick={save} disabled={saving || saved}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

function StandGrid({ onStandReturned }) {
  const [stands, setStands] = useState([]);
  const [loadingStands, setLoadingStands] = useState(true);
  const [returningStand, setReturningStand] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const fetchStands = useCallback(async () => {
    try {
      const res = await api.get("/api/restaurant-settings/stands");
      setStands(res.data);
    } catch {
      // silently ignore — stand grid is non-critical
    } finally {
      setLoadingStands(false);
    }
  }, []);

  useEffect(() => {
    fetchStands();
    const interval = setInterval(fetchStands, 30000);
    return () => clearInterval(interval);
  }, [fetchStands]);

  async function returnStand(number) {
    setReturningStand(number);
    try {
      await api.post(`/api/restaurant-settings/stands/${number}/return`);
      setStands(prev => prev.map(s => s.number === number ? { ...s, inUse: false } : s));
      onStandReturned?.();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to return stand");
    } finally {
      setReturningStand(null);
    }
  }

  const inUseCount = stands.filter(s => s.inUse).length;

  return (
    <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-blue-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Stand Pool</span>
          {!loadingStands && (
            <span className="text-xs text-slate-400">
              {inUseCount} in use · {stands.length - inUseCount} free
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronUp size={16} className="text-slate-400" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          {loadingStands ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : stands.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No stands configured. Set pool size in Restaurant Settings.</p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3">
                Tap a <span className="text-red-600 font-medium">red stand</span> to mark it returned when the customer leaves.
              </p>
              <div className="flex flex-wrap gap-2">
                {stands.map(stand => (
                  <button
                    key={stand.number}
                    onClick={() => stand.inUse && returnStand(stand.number)}
                    disabled={!stand.inUse || returningStand === stand.number}
                    title={stand.inUse ? `Table ${stand.number} — tap to return` : `Table ${stand.number} — free`}
                    className={`w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all
                      ${stand.inUse
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-md cursor-pointer"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                      }
                      ${returningStand === stand.number ? "opacity-50" : ""}
                    `}>
                    {returningStand === stand.number
                      ? <Loader2 size={12} className="animate-spin" />
                      : stand.number}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-red-500" /> In use (tap to return)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-900/50" /> Free
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersKDS() {
  const { currency } = useOrg();
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const isStaff = role === "STAFF" || role === "STAFF_EXPENSE";
  const isOwner = role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("received");
  const [channelFilter, setChannelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(null);

  // ── Void requests (owner-approval for cancelling an already-completed order) ──
  const [voidModalOrder, setVoidModalOrder] = useState(null); // order being requested
  const [voidReason, setVoidReason] = useState("");
  const [requestingVoid, setRequestingVoid] = useState(false);
  const [pendingVoidRequests, setPendingVoidRequests] = useState([]);
  const [showVoidPanel, setShowVoidPanel] = useState(false);
  const [decidingVoidId, setDecidingVoidId] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const loadPendingVoidRequests = async () => {
    try {
      const res = await api.get("/api/orders/void-requests/pending");
      setPendingVoidRequests(res.data || []);
    } catch { /* non-critical — panel just stays empty */ }
  };

  useEffect(() => {
    if (!isOwner) return;
    loadPendingVoidRequests();
    const interval = setInterval(loadPendingVoidRequests, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submitVoidRequest = async () => {
    if (!voidModalOrder || !voidReason.trim()) return;
    setRequestingVoid(true);
    try {
      await api.post(`/api/orders/${voidModalOrder.id}/void-request`, { reason: voidReason.trim() });
      showToast(`Void request sent — ${voidModalOrder.orderNumber} is pending owner approval`);
      setVoidModalOrder(null);
      setVoidReason("");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to submit void request", "error");
    } finally { setRequestingVoid(false); }
  };

  const decideVoidRequest = async (req, approve) => {
    setDecidingVoidId(req.id);
    try {
      await api.post(`/api/orders/void-requests/${req.id}/${approve ? "approve" : "reject"}`, {});
      showToast(approve ? `${req.orderNumber} voided` : `Void request for ${req.orderNumber} rejected`);
      setPendingVoidRequests(prev => prev.filter(r => r.id !== req.id));
      if (approve) refreshWindow(orders.length);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to record decision", "error");
    } finally { setDecidingVoidId(null); }
  };

  const PAGE_SIZE = 50;
  const ordersRef = useRef([]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // Read via a ref (not closed-over state) so the long-lived 30s interval below always builds
  // the query against the CURRENT filter, not whatever it was when the interval was created.
  const filtersRef = useRef({ status: statusFilter, channel: channelFilter, type: typeFilter });
  useEffect(() => {
    filtersRef.current = { status: statusFilter, channel: channelFilter, type: typeFilter };
  }, [statusFilter, channelFilter, typeFilter]);

  const buildQuery = useCallback((page, size) => {
    const f = filtersRef.current;
    const params = new URLSearchParams({ page, size });
    if (f.status !== "all") params.set("status", f.status);
    if (f.channel !== "all") params.set("channel", f.channel);
    if (f.type !== "all") params.set("orderType", f.type);
    return params.toString();
  }, []);

  // Re-fetches exactly as many orders as are already loaded (at least PAGE_SIZE), against the
  // currently active filter, so a background refresh — the 30s poll, or releasing a stand —
  // never discards pages the user already pulled in via "Load More." Only the very first load
  // shows the full-page spinner; every refresh after that is silent (no component unmount,
  // nothing visually resets).
  const refreshWindow = useCallback(async (count) => {
    setRefreshing(true);
    try {
      const size = Math.max(PAGE_SIZE, count);
      const res = await api.get(`/api/orders?${buildQuery(0, size)}`);
      const data = res.data;
      const content = data.content || [];
      setOrders(content);
      setHasMore(!data.last);
      setPage(Math.ceil(content.length / PAGE_SIZE));
    } catch { showToast("Failed to refresh orders", "error"); }
    finally { setRefreshing(false); }
  }, [buildQuery]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    await refreshWindow(0);
    setLoading(false);
  }, [refreshWindow]);

  const loadMore = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/api/orders?${buildQuery(page, PAGE_SIZE)}`);
      const data = res.data;
      const content = data.content || [];
      setOrders(prev => [...prev, ...content]);
      setHasMore(!data.last);
      setPage(p => p + 1);
    } catch { showToast("Failed to load more orders", "error"); }
    finally { setRefreshing(false); }
  }, [page, buildQuery]);

  useEffect(() => {
    loadInitial();
    const interval = setInterval(() => refreshWindow(ordersRef.current.length), 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A filter change makes the previously loaded window meaningless (it was fetched for the old
  // filter) — start over from page 0 under the new one. Skipped on the very first render since
  // loadInitial above already covers it.
  const didMountFilters = useRef(false);
  useEffect(() => {
    if (!didMountFilters.current) { didMountFilters.current = true; return; }
    refreshWindow(0);
  }, [statusFilter, channelFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function completeOrder(id) {
    setCompleteLoading(id);
    try {
      const res = await api.patch(`/api/orders/${id}/complete`);
      setOrders(prev => prev.map(o => o.id === id ? res.data : o));
      showToast("Order completed");
    } catch (e) { showToast(e.response?.data?.message || "Failed to complete order", "error"); }
    finally { setCompleteLoading(null); }
  }

  async function cancelOrder(id) {
    setCancelLoading(id);
    try {
      const res = await api.patch(`/api/orders/${id}/cancel`);
      setOrders(prev => prev.map(o => o.id === id ? res.data : o));
      showToast("Order cancelled");
    } catch (e) { showToast(e.response?.data?.message || "Failed to cancel order", "error"); }
    finally { setCancelLoading(null); }
  }

  // Filtering now happens server-side (status/channel/orderType query params), so pagination
  // reflects exactly what's displayed — no client-side re-filtering needed here.
  const filtered = orders;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Order Fulfillment</h1>
        <div className="flex items-center gap-2">
          {!isStaff && <RestaurantSettingsPanel />}
          {isOwner && (
            <button onClick={() => setShowVoidPanel(v => !v)}
              className={`relative flex items-center gap-2 text-sm border px-3 py-1.5 rounded-lg transition-colors ${
                pendingVoidRequests.length > 0
                  ? "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                  : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:text-amber-600"
              }`}>
              <ShieldAlert size={14} />
              Void Requests
              {pendingVoidRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingVoidRequests.length}
                </span>
              )}
            </button>
          )}
          <button onClick={() => refreshWindow(orders.length)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Pending Void Requests panel (owner only) */}
      {isOwner && showVoidPanel && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 flex items-center justify-between">
            <span className="font-semibold text-amber-800 dark:text-amber-400 text-sm flex items-center gap-2">
              <ShieldAlert size={16} /> Pending Void Requests
            </span>
            <button onClick={() => setShowVoidPanel(false)} className="text-amber-700 dark:text-amber-400">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {pendingVoidRequests.length === 0 ? (
              <p className="text-xs text-slate-400">No pending void requests.</p>
            ) : (
              pendingVoidRequests.map(req => (
                <div key={req.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{req.orderNumber} — {fmt(req.orderTotal, currency)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Requested by {req.requestedBy} · {timeAgo(req.requestedAt)}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 italic">"{req.reason}"</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => decideVoidRequest(req, true)} disabled={decidingVoidId === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50">
                        {decidingVoidId === req.id ? <Loader2 size={12} className="animate-spin" /> : null}
                        Approve Void
                      </button>
                      <button onClick={() => decideVoidRequest(req, false)} disabled={decidingVoidId === req.id}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stand Pool Grid */}
      <StandGrid onStandReturned={() => refreshWindow(orders.length)} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-xs text-slate-500 mr-1">Status:</span>
          {[
            { val: "received",  label: "Active" },
            { val: "all",       label: "All" },
            { val: "completed", label: "Completed" },
            { val: "cancelled", label: "Cancelled" },
          ].map(f => (
            <button key={f.val} onClick={() => setStatusFilter(f.val)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                statusFilter === f.val
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-xs text-slate-500 mr-1">Type:</span>
          {[
            { val: "all", label: "All" },
            { val: "DINE_IN", label: "Dine In" },
            { val: "TAKEAWAY", label: "Takeaway" },
          ].map(f => (
            <button key={f.val} onClick={() => setTypeFilter(f.val)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                typeFilter === f.val
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-xs text-slate-500 mr-1">Channel:</span>
          {[
            { val: "all", label: "All" },
            { val: "IN_STORE", label: "In Store" },
            { val: "ONLINE", label: "Online" },
          ].map(f => (
            <button key={f.val} onClick={() => setChannelFilter(f.val)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                channelFilter === f.val
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 self-center ml-auto">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Clock size={40} className="mx-auto mb-2 opacity-30" />
          <p>No orders match the selected filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
            const isReceived = order.status === "received";
            const isDineIn = order.orderType === "DINE_IN";

            return (
              <div key={order.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm p-4 flex flex-col gap-3 transition-opacity ${
                  !isReceived ? "opacity-75" : ""
                } ${isDineIn ? "border-blue-200 dark:border-blue-800" : "border-orange-200 dark:border-orange-800"}`}>

                {/* Order header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isDineIn && order.standNumber ? (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center shadow leading-none">
                        <span className="text-[8px] font-semibold uppercase opacity-80 tracking-wide">Tbl</span>
                        <span className="text-sm font-bold">{order.standNumber}</span>
                      </div>
                    ) : !isDineIn ? (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                        <ShoppingBag size={18} />
                      </div>
                    ) : null}
                    <div>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {timeAgo(order.createdAt)}
                        {order.createdBy && ` · ${order.createdBy}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.classes}`}>
                      {statusCfg.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                      order.channel === "ONLINE"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}>
                      {order.channel === "ONLINE" ? <Wifi size={10} /> : <Store size={10} />}
                      {order.channel === "ONLINE" ? "Online" : "In Store"}
                    </span>
                    {order.standReturned && (
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        <RotateCcw size={9} /> Stand returned
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                {(() => {
                  const hasMixed = (order.items || []).some(i => i.toGo);
                  return (
                    <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-700 pt-2">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="text-sm">
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-700 dark:text-slate-200">
                                <span className="font-medium">{item.qty}×</span> {item.name}
                              </span>
                              {hasMixed && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                                  item.toGo
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                }`}>
                                  {item.toGo ? "PACK" : "SERVE"}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-xs shrink-0">{fmt(item.subtotal, currency)}</span>
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <p className="text-xs text-slate-400 pl-4">
                              {item.modifiers.map(m => m.qty > 1 ? `${m.name} ×${m.qty}` : m.name).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Total + payment */}
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2">
                  <span className="text-xs text-slate-400">{order.paymentMethod?.replace("_", " ")}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{fmt(order.total, currency)}</span>
                </div>

                {/* Notes */}
                {order.notes && (
                  <p className="text-xs text-slate-500 italic border-t border-slate-100 dark:border-slate-700 pt-2">
                    {order.notes}
                  </p>
                )}

                {/* Actions */}
                {isReceived && (
                  <div className="flex gap-2 pt-1">
                    {!isDineIn && (
                      <button
                        onClick={() => completeOrder(order.id)}
                        disabled={!!completeLoading || !!cancelLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50">
                        {completeLoading === order.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CheckCircle size={14} />}
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={!!cancelLoading || !!completeLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm disabled:opacity-50">
                      {cancelLoading === order.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <X size={14} />}
                      {isDineIn ? "Cancel" : ""}
                    </button>
                  </div>
                )}
                {order.status === "completed" && (
                  pendingVoidRequests.some(r => r.orderId === order.id) ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
                      <ShieldAlert size={12} /> Void request pending owner approval
                    </div>
                  ) : (
                    <button onClick={() => { setVoidModalOrder(order); setVoidReason(""); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:border-rose-200 text-xs font-medium transition">
                      <ShieldAlert size={12} /> Request Void (customer didn't pay, etc.)
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={loadMore} disabled={refreshing}
            className="flex items-center gap-2 px-6 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronDown size={16} /> Load More
          </button>
        </div>
      )}

      {/* Request Void Modal */}
      {voidModalOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Request Void</h3>
              </div>
              <button onClick={() => setVoidModalOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
              <span className="font-semibold text-slate-900 dark:text-white">{voidModalOrder.orderNumber}</span> — {fmt(voidModalOrder.total, currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
              <Mail size={12} /> The business owner will be emailed this request. Nothing changes until they approve it.
            </p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Reason <span className="text-slate-400 font-normal">(required)</span>
              </label>
              <textarea
                rows={3}
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="e.g., Customer left without paying"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none transition"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setVoidModalOrder(null)} disabled={requestingVoid} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
              <button onClick={submitVoidRequest} disabled={requestingVoid || !voidReason.trim()} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition disabled:opacity-40 flex items-center gap-2">
                {requestingVoid && <Loader2 size={14} className="animate-spin" />}
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
