import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";
import {
  RefreshCw, CheckCircle, X, Clock, Loader2, ChevronDown, Store, Wifi,
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
  received:  { label: "Received",  classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  completed: { label: "Completed", classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export default function OrdersKDS() {
  const { currency } = useOrg();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const loadOrders = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setPage(0); }
    else setRefreshing(true);
    try {
      const p = reset ? 0 : page;
      const res = await api.get(`/api/orders?page=${p}&size=50`);
      const data = res.data;
      const content = data.content || [];
      if (reset) {
        setOrders(content);
      } else {
        setOrders(prev => [...prev, ...content]);
      }
      setHasMore(!data.last);
      if (!reset) setPage(p + 1);
    } catch { showToast("Failed to load orders", "error"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page]);

  useEffect(() => {
    loadOrders(true);
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  async function completeOrder(id) {
    setActionLoading(id + "-complete");
    try {
      const res = await api.patch(`/api/orders/${id}/complete`);
      setOrders(prev => prev.map(o => o.id === id ? res.data : o));
      showToast("Order completed");
    } catch (e) { showToast(e.response?.data?.message || "Failed to complete order", "error"); }
    finally { setActionLoading(null); }
  }

  async function cancelOrder(id) {
    setActionLoading(id + "-cancel");
    try {
      const res = await api.patch(`/api/orders/${id}/cancel`);
      setOrders(prev => prev.map(o => o.id === id ? res.data : o));
      showToast("Order cancelled");
    } catch (e) { showToast(e.response?.data?.message || "Failed to cancel order", "error"); }
    finally { setActionLoading(null); }
  }

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchChannel = channelFilter === "all"
      || (channelFilter === "IN_STORE" && o.channel === "IN_STORE")
      || (channelFilter === "ONLINE" && o.channel === "ONLINE");
    return matchStatus && matchChannel;
  });

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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Orders / Kitchen</h1>
        <button onClick={() => loadOrders(true)} disabled={refreshing}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs text-slate-500 self-center mr-1">Status:</span>
          {[
            { val: "all", label: "All" },
            { val: "received", label: "Received" },
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
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs text-slate-500 self-center mr-1">Channel:</span>
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

            return (
              <div key={order.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm p-4 flex flex-col gap-3 transition-opacity ${
                  !isReceived ? "opacity-75" : ""
                } border-slate-200 dark:border-slate-700`}>

                {/* Order header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{order.orderNumber}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(order.createdAt)}
                      {order.createdBy && ` · ${order.createdBy}`}
                    </p>
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
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 border-t border-slate-100 dark:border-slate-700 pt-2">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-700 dark:text-slate-200">
                          <span className="font-medium">{item.qty}×</span> {item.name}
                        </span>
                        <span className="text-slate-500 text-xs">{fmt(item.subtotal, currency)}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-xs text-slate-400 pl-4">
                          {item.modifiers.map(m => m.name).join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

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
                    <button
                      onClick={() => completeOrder(order.id)}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50">
                      {actionLoading === order.id + "-complete"
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CheckCircle size={14} />}
                      Complete
                    </button>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      disabled={!!actionLoading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm disabled:opacity-50">
                      {actionLoading === order.id + "-cancel"
                        ? <Loader2 size={14} className="animate-spin" />
                        : <X size={14} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={() => loadOrders(false)} disabled={refreshing}
            className="flex items-center gap-2 px-6 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronDown size={16} /> Load More
          </button>
        </div>
      )}
    </div>
  );
}
