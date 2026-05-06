// Inventory.jsx — Product management + Restock Orders + Stock Movements
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Plus, Search, Edit2, Trash2, Package, AlertTriangle, X, Check,
  Barcode, Tag, RefreshCw, ChevronDown, ChevronUp, History, TrendingDown,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const UNITS = ["unit", "piece", "kg", "litre", "pack", "carton", "dozen", "bottle", "bag", "box"];
const CATS  = ["Electronics", "Food & Drinks", "Clothing", "Beauty", "Health", "Office", "Household", "Automotive", "Stationery", "Other"];

const emptyForm = () => ({
  name: "", sku: "", barcode: "", description: "", price: "",
  costPrice: "", quantityInStock: 0, lowStockThreshold: 5, category: "", unit: "unit",
  incomeAccountId: "", directCostAccountId: "",
});

const emptyRestockForm = () => ({
  supplierName: "", supplierReference: "", orderDate: new Date().toISOString().slice(0, 10), notes: "",
  items: [{ productId: "", quantity: 1, unitCost: "" }],
});

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const TABS = ["Products", "Restock Orders", "Stock Movements"];

function RestockStatusBadge({ status }) {
  const styles = {
    DRAFT:      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
    RECEIVED:   "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700",
    CANCELLED:  "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  );
}

function MovementTypeBadge({ type }) {
  const styles = {
    RESTOCK:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700",
    SALE:       "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
    ADJUSTMENT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
    RETURN:     "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {type}
    </span>
  );
}

export default function Inventory() {
  const { fmt, fmtDate, currencySymbol } = useOrg();

  const [activeTab, setActiveTab] = useState("Products");
  const [toast, setToast]        = useState({ visible: false, message: "", type: "info" });
  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const [products, setProducts]   = useState([]);
  const [lowStock, setLowStock]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [saving, setSaving]       = useState(false);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [accounts, setAccounts]   = useState([]);

  const [restockOrders, setRestockOrders]   = useState([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [expandedOrder, setExpandedOrder]   = useState(null);
  const [showRestockForm, setShowRestockForm] = useState(false);
  const [restockForm, setRestockForm]       = useState(emptyRestockForm());
  const [savingRestock, setSavingRestock]   = useState(false);

  const [movements, setMovements]         = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementFilter, setMovementFilter]     = useState("All");

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const [prodRes, lowRes] = await Promise.all([
        api.get(`/api/inventory/products?page=${p}&size=30`),
        api.get("/api/inventory/products/low-stock"),
      ]);
      setProducts(prodRes.data.content || []);
      setTotalPages(prodRes.data.totalPages || 1);
      setLowStock(lowRes.data || []);
    } catch { notify("Failed to load inventory", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const doSearch = async (q) => {
    if (!q.trim()) { load(0); return; }
    try {
      const res = await api.get(`/api/inventory/products/search?q=${encodeURIComponent(q)}`);
      setProducts(res.data || []);
      setTotalPages(1);
    } catch { notify("Search failed", "error"); }
  };

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadAccounts = async () => {
    if (accounts.length > 0) return;
    try {
      const res = await api.get("/api/accounting/accounts");
      setAccounts(res.data || []);
    } catch { /* silently ignore — accounts are optional */ }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm()); loadAccounts(); setShowForm(true); };
  const openEdit   = (p)  => {
    setEditing(p.id);
    setForm({
      name: p.name || "", sku: p.sku || "", barcode: p.barcode || "",
      description: p.description || "", price: p.price || "",
      costPrice: p.costPrice || "", quantityInStock: p.quantityInStock,
      lowStockThreshold: p.lowStockThreshold, category: p.category || "", unit: p.unit || "unit",
      incomeAccountId: p.incomeAccountId || "", directCostAccountId: p.directCostAccountId || "",
    });
    loadAccounts();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { notify("Name and price are required", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), costPrice: form.costPrice ? parseFloat(form.costPrice) : null };
      if (editing) {
        await api.put(`/api/inventory/products/${editing}`, payload);
        notify("Product updated");
      } else {
        await api.post("/api/inventory/products", payload);
        notify("Product added");
      }
      setShowForm(false);
      load(page);
    } catch (e) {
      notify(e.response?.data?.message || "Failed to save product", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from inventory?`)) return;
    try {
      await api.delete(`/api/inventory/products/${id}`);
      notify("Product removed");
      load(page);
    } catch { notify("Failed to remove product", "error"); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadRestockOrders = async () => {
    setRestockLoading(true);
    try {
      const res = await api.get("/api/inventory/restock");
      setRestockOrders(res.data || []);
    } catch { notify("Failed to load restock orders", "error"); }
    finally { setRestockLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "Restock Orders") loadRestockOrders();
  }, [activeTab]);

  const handleReceiveOrder = async (id) => {
    if (!window.confirm("Mark this order as received? This will increment stock levels.")) return;
    try {
      await api.put(`/api/inventory/restock/${id}/receive`);
      notify("Order marked as received — stock updated");
      loadRestockOrders();
      load(page);
    } catch (e) { notify(e.response?.data?.message || "Failed to receive order", "error"); }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm("Cancel this restock order?")) return;
    try {
      await api.put(`/api/inventory/restock/${id}/cancel`);
      notify("Order cancelled");
      loadRestockOrders();
    } catch (e) { notify(e.response?.data?.message || "Failed to cancel order", "error"); }
  };

  const setRF = (k, v) => setRestockForm(f => ({ ...f, [k]: v }));
  const addRestockItem = () =>
    setRestockForm(f => ({ ...f, items: [...f.items, { productId: "", quantity: 1, unitCost: "" }] }));
  const removeRestockItem = (idx) =>
    setRestockForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const setRestockItem = (idx, k, v) =>
    setRestockForm(f => {
      const items = f.items.map((item, i) => i === idx ? { ...item, [k]: v } : item);
      return { ...f, items };
    });

  const restockTotal = restockForm.items.reduce((sum, item) => {
    return sum + (parseInt(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
  }, 0);

  const handleCreateRestock = async () => {
    if (!restockForm.supplierName.trim()) { notify("Supplier name is required", "error"); return; }
    if (restockForm.items.some(it => !it.productId)) { notify("All items must have a product selected", "error"); return; }
    if (restockForm.items.some(it => !it.quantity || parseInt(it.quantity) < 1)) { notify("All items must have a quantity ≥ 1", "error"); return; }
    setSavingRestock(true);
    try {
      const payload = {
        supplierName: restockForm.supplierName.trim(),
        supplierReference: restockForm.supplierReference.trim() || null,
        orderDate: restockForm.orderDate,
        notes: restockForm.notes.trim() || null,
        items: restockForm.items.map(it => ({
          productId: it.productId,
          quantity: parseInt(it.quantity),
          unitCost: parseFloat(it.unitCost) || 0,
        })),
      };
      await api.post("/api/inventory/restock", payload);
      notify("Restock order created");
      setShowRestockForm(false);
      setRestockForm(emptyRestockForm());
      loadRestockOrders();
    } catch (e) {
      notify(e.response?.data?.message || "Failed to create restock order", "error");
    } finally { setSavingRestock(false); }
  };

  const loadMovements = async () => {
    setMovementsLoading(true);
    try {
      const res = await api.get("/api/inventory/restock/movements");
      setMovements(res.data || []);
    } catch { notify("Failed to load stock movements", "error"); }
    finally { setMovementsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "Stock Movements") loadMovements();
  }, [activeTab]);

  const filteredMovements = movementFilter === "All"
    ? movements
    : movements.filter(m => m.movementType === movementFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Toast {...toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" /> Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your products, restock orders and stock movements</p>
        </div>
        {activeTab === "Products" && (
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
        {activeTab === "Restock Orders" && (
          <button onClick={() => { setRestockForm(emptyRestockForm()); setShowRestockForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> New Restock Order
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            {tab === "Restock Orders" && <RefreshCw className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {tab === "Stock Movements" && <History className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {tab === "Products" && <Package className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === "Products" && (
        <>
          {lowStock.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low on stock
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {lowStock.map(p => `${p.name} (${p.quantityInStock} left)`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SKU or barcode…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
          </div>
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No products yet. Add your first product to get started.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                    <tr>
                      {["Product", "SKU / Barcode", "Price", "Cost", "Stock", "Category", "Linked Accounts", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-white">{p.name}</p>
                          {p.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-xs">{p.sku || "—"}</span>
                          {p.barcode && <span className="block font-mono text-xs text-slate-400">{p.barcode}</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{fmt(p.price)}</td>
                        <td className="px-4 py-3 text-slate-500">{p.costPrice ? fmt(p.costPrice) : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            p.lowStock ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {p.lowStock && <AlertTriangle className="w-3 h-3" />}
                            {p.quantityInStock} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{p.category || "—"}</td>
                        <td className="px-4 py-3">
                          {p.incomeAccountName || p.directCostAccountName ? (
                            <div className="space-y-0.5">
                              {p.incomeAccountName && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                  <span className="text-slate-400">Income: </span>{p.incomeAccountName}
                                </p>
                              )}
                              {p.directCostAccountName && (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  <span className="text-slate-400">COGS: </span>{p.directCostAccountName}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50 transition">Prev</button>
                  <span className="px-3 py-1.5 text-sm text-slate-500">{page + 1} / {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50 transition">Next</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* RESTOCK ORDERS TAB */}
      {activeTab === "Restock Orders" && (
        <>
          {restockLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : restockOrders.length === 0 ? (
            <div className="text-center py-16">
              <RefreshCw className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No restock orders yet. Create one to replenish stock.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {restockOrders.map((order, idx) => (
                <div key={order.id} className={idx > 0 ? "border-t border-slate-100 dark:border-slate-700" : ""}>
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition cursor-pointer"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button className="p-1 rounded text-slate-400 flex-shrink-0">
                        {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{order.orderNumber || `#${order.id}`}</p>
                        <p className="text-xs text-slate-500">{order.supplierName}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pl-8 sm:pl-0 text-xs text-slate-500">
                      <span>{fmtDate(order.orderDate)}</span>
                      {order.supplierReference && <span className="font-mono text-slate-400">Ref: {order.supplierReference}</span>}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(order.totalCost)}</span>
                      <RestockStatusBadge status={order.status} />
                      {order.status === "DRAFT" && (
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleReceiveOrder(order.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition">
                            <Check className="w-3 h-3" /> Receive
                          </button>
                          <button onClick={() => handleCancelOrder(order.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700">
                      {order.notes && <p className="text-xs text-slate-500 py-2 italic">Note: {order.notes}</p>}
                      <table className="w-full text-xs mt-2">
                        <thead>
                          <tr className="text-slate-400 uppercase tracking-wide">
                            <th className="text-left py-1.5 pr-4 font-semibold">Product</th>
                            <th className="text-right py-1.5 pr-4 font-semibold">Qty</th>
                            <th className="text-right py-1.5 pr-4 font-semibold">Unit Cost</th>
                            <th className="text-right py-1.5 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {(order.items || []).map((item, i) => (
                            <tr key={i}>
                              <td className="py-2 pr-4 text-slate-700 dark:text-slate-300 font-medium">{item.productName}</td>
                              <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                              <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{fmt(item.unitCost)}</td>
                              <td className="py-2 text-right text-slate-800 dark:text-white font-semibold">{fmt(item.totalCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* STOCK MOVEMENTS TAB */}
      {activeTab === "Stock Movements" && (
        <>
          <div className="flex flex-wrap gap-2">
            {["All", "RESTOCK", "SALE", "ADJUSTMENT", "RETURN"].map(type => (
              <button key={type} onClick={() => setMovementFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  movementFilter === type
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}>
                {type}
              </button>
            ))}
            {!movementsLoading && (
              <button onClick={loadMovements}
                className="ml-auto p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          {movementsLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No stock movements found{movementFilter !== "All" ? ` for type "${movementFilter}"` : ""}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    {["Date", "Product", "SKU", "Type", "Qty", "Unit Cost", "Total", "Reference"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredMovements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{fmtDate(m.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-white">{m.productName}</p>
                        {m.notes && <p className="text-xs text-slate-400 truncate max-w-[160px]">{m.notes}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.productSku || "—"}</td>
                      <td className="px-4 py-3"><MovementTypeBadge type={m.movementType} /></td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold tabular-nums ${m.quantity >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {m.quantity >= 0 ? `+${m.quantity}` : `−${Math.abs(m.quantity)}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.unitCost ? fmt(m.unitCost) : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{m.totalCost ? fmt(m.totalCost) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.reference || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Product Name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Indomie Noodles" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Selling Price ({currencySymbol}) *</label>
                  <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" min="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Cost Price ({currencySymbol})</label>
                  <input type="number" value={form.costPrice} onChange={e => set("costPrice", e.target.value)} placeholder="Optional" min="0" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity in Stock</label>
                  <input type="number" value={form.quantityInStock} onChange={e => set("quantityInStock", parseInt(e.target.value) || 0)} min="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Low Stock Alert Below</label>
                  <input type="number" value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", parseInt(e.target.value) || 0)} min="0" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">SKU</label>
                  <input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. IND-001" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Barcode</label>
                  <input value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="e.g. 6001234567890" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                    <option value="">Select category</option>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => set("unit", e.target.value)} className={inputCls}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {accounts.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Income Account</label>
                      <select value={form.incomeAccountId} onChange={e => set("incomeAccountId", e.target.value)} className={inputCls}>
                        <option value="">None</option>
                        {accounts.filter(a => a.type === "INCOME").map(a => (
                          <option key={a.id} value={a.id}>{a.code ? `${a.code} · ` : ""}{a.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-0.5">Revenue account for sales of this item</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Direct Cost Account</label>
                      <select value={form.directCostAccountId} onChange={e => set("directCostAccountId", e.target.value)} className={inputCls}>
                        <option value="">None</option>
                        {accounts.filter(a => a.type === "EXPENSE" && a.subType === "DIRECT_COST").map(a => (
                          <option key={a.id} value={a.id}>{a.code ? `${a.code} · ` : ""}{a.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-0.5">COGS account for cost of this item</p>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={2} placeholder="Optional short description" className={inputCls + " resize-none"} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editing ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Restock Order Modal */}
      {showRestockForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" /> New Restock Order
              </h2>
              <button onClick={() => setShowRestockForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Name *</label>
                  <input value={restockForm.supplierName} onChange={e => setRF("supplierName", e.target.value)}
                    placeholder="e.g. ABC Distributors" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Reference</label>
                  <input value={restockForm.supplierReference} onChange={e => setRF("supplierReference", e.target.value)}
                    placeholder="Optional PO / invoice ref" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Order Date</label>
                  <input type="date" value={restockForm.orderDate} onChange={e => setRF("orderDate", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                  <input value={restockForm.notes} onChange={e => setRF("notes", e.target.value)} placeholder="Optional notes" className={inputCls} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</label>
                  <button onClick={addRestockItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition border border-blue-200">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_28px] gap-2 px-1">
                    <span className="text-xs font-semibold text-slate-400">Product</span>
                    <span className="text-xs font-semibold text-slate-400">Qty</span>
                    <span className="text-xs font-semibold text-slate-400">Unit Cost ({currencySymbol})</span>
                    <span />
                  </div>
                  {restockForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_28px] gap-2 items-center">
                      <select value={item.productId} onChange={e => setRestockItem(idx, "productId", e.target.value)} className={inputCls}>
                        <option value="">Select product…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>
                        ))}
                      </select>
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => setRestockItem(idx, "quantity", e.target.value)} placeholder="Qty" className={inputCls} />
                      <input type="number" min="0" step="0.01" value={item.unitCost}
                        onChange={e => setRestockItem(idx, "unitCost", e.target.value)} placeholder="0.00" className={inputCls} />
                      <button onClick={() => removeRestockItem(idx)} disabled={restockForm.items.length === 1}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 disabled:opacity-20 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estimated Total</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{fmt(restockTotal)}</span>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setShowRestockForm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleCreateRestock} disabled={savingRestock}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {savingRestock ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
