// Inventory.jsx — Product management + Restock Orders + Stock Movements + Batch Tracking
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Plus, Search, Edit2, Trash2, Package, AlertTriangle, X, Check,
  Barcode, Tag, RefreshCw, ChevronDown, ChevronUp, History, TrendingDown, Camera,
  Layers, SlidersHorizontal, FlaskConical, CalendarClock,
} from "lucide-react";
import Toast from "../components/Toast";
import BarcodeScanner from "../components/BarcodeScanner";
import { useOrg } from "../context/OrgContext";

const UNITS = ["unit", "piece", "kg", "litre", "pack", "carton", "dozen", "bottle", "bag", "box"];
const CATS  = ["Electronics", "Food & Drinks", "Clothing", "Beauty", "Health", "Office", "Household", "Automotive", "Stationery", "Other"];

const emptyForm = () => ({
  name: "", sku: "", barcode: "", description: "", price: "",
  costPrice: "", wholesalePrice: "", wholesaleMinQty: null, quantityInStock: 0, lowStockThreshold: 5,
  category: "", unit: "unit", incomeAccountId: "", directCostAccountId: "",
  hasVariants: false, nafdacNumber: "", drugCategory: "NONE",
});

const emptyVariant = () => ({
  sku: "", barcode: "", size: "", color: "", customLabel: "", customValue: "",
  sellingPrice: "", wholesalePrice: "", costPrice: "", stockQty: 0, lowStockThreshold: 5,
});

const emptyRestockForm = () => ({
  supplierName: "", supplierReference: "", orderDate: new Date().toISOString().slice(0, 10), notes: "",
  items: [{ productId: "", quantity: 1, unitCost: "" }],
});

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const NAV_ITEMS_LS_KEY = "lumi_hidden_nav_items";
const getBatchTabVisible = () => {
  try {
    const hidden = new Set((localStorage.getItem(NAV_ITEMS_LS_KEY) || "").split(",").filter(Boolean));
    return !hidden.has("nav_batches");
  } catch { return true; }
};

const TABS_BASE = ["Products", "Restock Orders", "Stock Movements"];

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
  const [variants, setVariants]   = useState([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeScanTarget, setBarcodeScanTarget] = useState(null); // null = main, number = variant idx
  const [saving, setSaving]       = useState(false);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [accounts, setAccounts]   = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [productVariants, setProductVariants] = useState({});
  const [adjustTarget, setAdjustTarget] = useState(null); // { type: 'product'|'variant', id, name }
  const [adjustQty, setAdjustQty]       = useState("");
  const [adjustNotes, setAdjustNotes]   = useState("");
  const [adjusting, setAdjusting]       = useState(false);
  const [productImage, setProductImage] = useState(null);   // current image URL for the open form
  const [uploadingImage, setUploadingImage] = useState(false);

  const [restockOrders, setRestockOrders]   = useState([]);
  const [restockLoading, setRestockLoading] = useState(false);
  const [expandedOrder, setExpandedOrder]   = useState(null);
  const [showRestockForm, setShowRestockForm] = useState(false);
  const [restockForm, setRestockForm]       = useState(emptyRestockForm());
  const [savingRestock, setSavingRestock]   = useState(false);

  const [movements, setMovements]         = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementFilter, setMovementFilter]     = useState("All");

  const [batchTabVisible, setBatchTabVisible] = useState(getBatchTabVisible);
  const [batches, setBatches]               = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchFilter, setBatchFilter]       = useState("All"); // All | FRESH | EXPIRING_SOON | EXPIRED
  const [showBatchForm, setShowBatchForm]   = useState(false);
  const [batchFormProductId, setBatchFormProductId] = useState(null);
  const [batchForm, setBatchForm]           = useState({ batchNumber: "", expiryDate: "", quantity: 0, notes: "" });
  const [savingBatch, setSavingBatch]       = useState(false);
  const [editingBatch, setEditingBatch]     = useState(null);
  const [productBatches, setProductBatches] = useState({}); // productId -> batches[]

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
    } catch { /* silently ignore */ }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setVariants([]);
    setProductImage(null);
    loadAccounts();
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || "", sku: p.sku || "", barcode: p.barcode || "",
      description: p.description || "", price: p.price || "",
      costPrice: p.costPrice || "", wholesalePrice: p.wholesalePrice || "", wholesaleMinQty: p.wholesaleMinQty || null,
      quantityInStock: p.quantityInStock, lowStockThreshold: p.lowStockThreshold,
      category: p.category || "", unit: p.unit || "unit",
      incomeAccountId: p.incomeAccountId || "", directCostAccountId: p.directCostAccountId || "",
      hasVariants: p.hasVariants || false,
      nafdacNumber: p.nafdacNumber || "", drugCategory: p.drugCategory || "NONE",
    });
    setProductImage(p.imageUrl || null);
    setVariants(p.variants ? p.variants.map(v => ({
      id: v.id,
      sku: v.sku || "", barcode: v.barcode || "",
      size: v.size || "", color: v.color || "",
      customLabel: v.customLabel || "", customValue: v.customValue || "",
      sellingPrice: v.sellingPrice || "", wholesalePrice: v.wholesalePrice || "",
      costPrice: v.costPrice || "", stockQty: v.stockQty || 0, lowStockThreshold: v.lowStockThreshold || 5,
    })) : []);
    loadAccounts();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { notify("Name and price are required", "error"); return; }
    if (form.hasVariants && variants.length === 0) { notify("Add at least one variant", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : null,
        wholesaleMinQty: form.wholesaleMinQty || null,
      };
      let savedProductId = editing;
      if (editing) {
        await api.put(`/api/inventory/products/${editing}`, payload);
        notify("Product updated");
      } else {
        const res = await api.post("/api/inventory/products", payload);
        savedProductId = res.data.id;
        notify("Product added");
      }
      if (form.hasVariants && savedProductId) {
        const variantPayload = variants.map(v => ({
          sku: v.sku || null, barcode: v.barcode || null,
          size: v.size || null, color: v.color || null,
          customLabel: v.customLabel || null, customValue: v.customValue || null,
          sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : null,
          wholesalePrice: v.wholesalePrice ? parseFloat(v.wholesalePrice) : null,
          costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
          stockQty: parseInt(v.stockQty) || 0,
          lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
        }));
        await api.put(`/api/inventory/products/${savedProductId}/variants`, variantPayload);
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

  const addVariant = () => setVariants(prev => [...prev, emptyVariant()]);
  const removeVariant = (idx) => setVariants(prev => prev.filter((_, i) => i !== idx));
  const setVariantField = (idx, k, v) =>
    setVariants(prev => prev.map((vr, i) => i === idx ? { ...vr, [k]: v } : vr));

  const loadVariants = async (productId) => {
    if (productVariants[productId]) return;
    try {
      const res = await api.get(`/api/inventory/products/${productId}/variants`);
      setProductVariants(prev => ({ ...prev, [productId]: res.data || [] }));
    } catch { /* ignore */ }
  };

  const toggleProductExpand = (p) => {
    if (expandedProduct === p.id) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(p.id);
      if (p.hasVariants) loadVariants(p.id);
      if (batchTabVisible) loadProductBatches(p.id);
    }
  };

  const openAdjust = (type, id, name) => {
    setAdjustTarget({ type, id, name });
    setAdjustQty("");
    setAdjustNotes("");
  };

  const handleImageUpload = async (file) => {
    if (!editing) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/api/inventory/products/${editing}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProductImage(res.data.imageUrl);
      setProducts(prev => prev.map(p => p.id === editing ? { ...p, imageUrl: res.data.imageUrl } : p));
      notify("Image uploaded");
    } catch { notify("Failed to upload image", "error"); }
    finally { setUploadingImage(false); }
  };

  const handleImageDelete = async () => {
    if (!editing) return;
    try {
      await api.delete(`/api/inventory/products/${editing}/image`);
      setProductImage(null);
      setProducts(prev => prev.map(p => p.id === editing ? { ...p, imageUrl: null } : p));
      notify("Image removed");
    } catch { notify("Failed to remove image", "error"); }
  };

  const handleAdjust = async () => {
    const qty = parseInt(adjustQty);
    if (!qty || isNaN(qty)) { notify("Enter a non-zero quantity", "error"); return; }
    setAdjusting(true);
    try {
      if (adjustTarget.type === "variant") {
        await api.post(`/api/inventory/variants/${adjustTarget.id}/adjust`, { quantity: qty, notes: adjustNotes });
        setProductVariants(prev => {
          const updated = { ...prev };
          for (const pid of Object.keys(updated)) {
            updated[pid] = updated[pid].map(v =>
              v.id === adjustTarget.id ? { ...v, stockQty: v.stockQty + qty } : v
            );
          }
          return updated;
        });
      } else {
        await api.post(`/api/inventory/products/${adjustTarget.id}/adjust`, { quantity: qty, notes: adjustNotes });
      }
      notify(`Stock adjusted by ${qty > 0 ? "+" : ""}${qty}`);
      setAdjustTarget(null);
      load(page);
    } catch (e) {
      notify(e.response?.data?.message || "Adjustment failed", "error");
    } finally { setAdjusting(false); }
  };

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

  const loadBatches = async () => {
    setBatchesLoading(true);
    try {
      const [allRes, expRes] = await Promise.all([
        api.get("/api/inventory/batches"),
        api.get("/api/inventory/batches/expiring"),
      ]);
      setBatches(allRes.data || []);
      setExpiringBatches(expRes.data || []);
    } catch { notify("Failed to load batches", "error"); }
    finally { setBatchesLoading(false); }
  };

  const loadProductBatches = async (productId) => {
    if (productBatches[productId]) return;
    try {
      const res = await api.get(`/api/inventory/products/${productId}/batches`);
      setProductBatches(prev => ({ ...prev, [productId]: res.data || [] }));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === "Batches") loadBatches();
  }, [activeTab]);

  useEffect(() => {
    const handler = () => setBatchTabVisible(getBatchTabVisible());
    window.addEventListener("navItemsChange", handler);
    return () => window.removeEventListener("navItemsChange", handler);
  }, []);

  const openAddBatch = (productId) => {
    setEditingBatch(null);
    setBatchFormProductId(productId);
    setBatchForm({ batchNumber: "", expiryDate: "", quantity: 0, notes: "" });
    setShowBatchForm(true);
  };

  const openEditBatch = (batch) => {
    setEditingBatch(batch.id);
    setBatchFormProductId(batch.productId);
    setBatchForm({
      batchNumber: batch.batchNumber || "",
      expiryDate: batch.expiryDate || "",
      quantity: batch.quantity,
      notes: batch.notes || "",
    });
    setShowBatchForm(true);
  };

  const handleSaveBatch = async () => {
    if (!batchForm.batchNumber.trim()) { notify("Batch number is required", "error"); return; }
    setSavingBatch(true);
    try {
      const payload = {
        batchNumber: batchForm.batchNumber.trim(),
        expiryDate: batchForm.expiryDate || null,
        quantity: parseInt(batchForm.quantity) || 0,
        notes: batchForm.notes.trim() || null,
      };
      if (editingBatch) {
        await api.put(`/api/inventory/batches/${editingBatch}`, payload);
        notify("Batch updated");
      } else {
        await api.post(`/api/inventory/products/${batchFormProductId}/batches`, payload);
        notify("Batch added");
      }
      setShowBatchForm(false);
      setProductBatches(prev => { const n = { ...prev }; delete n[batchFormProductId]; return n; });
      loadBatches();
    } catch (e) {
      notify(e.response?.data?.message || "Failed to save batch", "error");
    } finally { setSavingBatch(false); }
  };

  const handleDeleteBatch = async (batchId, productId) => {
    if (!window.confirm("Delete this batch record?")) return;
    try {
      await api.delete(`/api/inventory/batches/${batchId}`);
      notify("Batch deleted");
      setProductBatches(prev => { const n = { ...prev }; delete n[productId]; return n; });
      loadBatches();
    } catch { notify("Failed to delete batch", "error"); }
  };

  const TABS = [...TABS_BASE, ...(batchTabVisible ? ["Batches"] : [])];

  const filteredBatches = batchFilter === "All" ? batches : batches.filter(b => b.status === batchFilter);

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
            {tab === "Batches" && <FlaskConical className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {tab}
            {tab === "Batches" && expiringBatches.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold">{expiringBatches.length}</span>
            )}
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
                  {lowStock.map(p => `${p.name} (${p.totalStock ?? p.quantityInStock} left)`).join(" · ")}
                </p>
              </div>
            </div>
          )}
          {batchTabVisible && expiringBatches.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-xl p-4 flex items-start gap-3">
              <CalendarClock className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                  {expiringBatches.length} batch{expiringBatches.length > 1 ? "es" : ""} expiring within 30 days
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  {expiringBatches.map(b => `${b.productName} — Batch ${b.batchNumber} (${b.expiryDate})`).join(" · ")}
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
                      {["Product", "SKU / Barcode", "Price / Wholesale", "Cost", "Stock", "Category", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {products.map(p => (
                      <>
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {p.imageUrl && (
                                <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700" />
                              )}
                              {(p.hasVariants || batchTabVisible) && (
                                <button onClick={() => toggleProductExpand(p)}
                                  className="p-0.5 rounded text-slate-400 hover:text-blue-600 transition">
                                  {expandedProduct === p.id
                                    ? <ChevronUp className="w-4 h-4" />
                                    : <ChevronDown className="w-4 h-4" />}
                                </button>
                              )}
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                                  {p.name}
                                  {p.hasVariants && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200">
                                      <Layers className="w-2.5 h-2.5" /> VARIANTS
                                    </span>
                                  )}
                                </p>
                                {p.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{p.description}</p>}
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {p.drugCategory === "POM" && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200">RX</span>
                                  )}
                                  {p.drugCategory === "OTC" && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200">OTC</span>
                                  )}
                                  {p.nafdacNumber && (
                                    <span className="text-[9px] text-slate-400 font-mono">{p.nafdacNumber}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            <span className="font-mono text-xs">{p.sku || "—"}</span>
                            {p.barcode && <span className="block font-mono text-xs text-slate-400">{p.barcode}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800 dark:text-white">{fmt(p.price)}</p>
                            {p.wholesalePrice && (
                              <p className="text-xs text-violet-600 dark:text-violet-400">WS: {fmt(p.wholesalePrice)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{p.costPrice ? fmt(p.costPrice) : "—"}</td>
                          <td className="px-4 py-3">
                            {p.hasVariants ? (
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${
                                  p.lowStock ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {p.lowStock && <AlertTriangle className="w-3 h-3" />}
                                  {p.totalStock ?? 0} {p.unit}
                                </span>
                                <button onClick={() => toggleProductExpand(p)}
                                  className="inline-flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 transition font-medium">
                                  <Layers className="w-3 h-3" /> View variants
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                  p.lowStock ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {p.lowStock && <AlertTriangle className="w-3 h-3" />}
                                  {p.quantityInStock} {p.unit}
                                </span>
                                <button onClick={() => openAdjust("product", p.id, p.name)}
                                  className="p-0.5 rounded text-slate-300 hover:text-amber-500 transition" title="Adjust stock">
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{p.category || "—"}</td>
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
                        {/* Variant expansion row */}
                        {expandedProduct === p.id && p.hasVariants && (
                          <tr key={`${p.id}-variants`}>
                            <td colSpan={7} className="px-0 py-0 bg-violet-50/40 dark:bg-violet-900/10">
                              <div className="px-8 py-3">
                                <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-2">Variants</p>

                                {!productVariants[p.id] ? (
                                  <p className="text-xs text-slate-400">Loading…</p>
                                ) : productVariants[p.id].length === 0 ? (
                                  <p className="text-xs text-slate-400">No variants defined yet</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-slate-400 uppercase tracking-wide">
                                          <th className="text-left pb-1 pr-4 font-semibold">Variant</th>
                                          <th className="text-left pb-1 pr-4 font-semibold">SKU</th>
                                          <th className="text-right pb-1 pr-4 font-semibold">Price</th>
                                          <th className="text-right pb-1 pr-4 font-semibold">WS Price</th>
                                          <th className="text-right pb-1 pr-4 font-semibold">Cost</th>
                                          <th className="text-right pb-1 font-semibold">Stock</th>
                                          <th className="w-8" />
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-violet-100 dark:divide-violet-800/30">
                                        {productVariants[p.id].map(v => (
                                          <tr key={v.id}>
                                            <td className="py-1.5 pr-4 font-medium text-slate-700 dark:text-slate-300">{v.label || "—"}</td>
                                            <td className="py-1.5 pr-4 font-mono text-slate-500">{v.sku || "—"}</td>
                                            <td className="py-1.5 pr-4 text-right text-slate-700 dark:text-slate-300">{v.sellingPrice ? fmt(v.sellingPrice) : <span className="text-slate-400">↑ parent</span>}</td>
                                            <td className="py-1.5 pr-4 text-right text-violet-600">{v.wholesalePrice ? fmt(v.wholesalePrice) : "—"}</td>
                                            <td className="py-1.5 pr-4 text-right text-slate-500">{v.costPrice ? fmt(v.costPrice) : "—"}</td>
                                            <td className="py-1.5 text-right">
                                              <span className={`px-1.5 py-0.5 rounded font-semibold ${v.lowStock ? "text-rose-600" : "text-emerald-600"}`}>
                                                {v.stockQty}
                                              </span>
                                            </td>
                                            <td className="py-1.5 pl-2">
                                              <button onClick={() => openAdjust("variant", v.id, `${p.name} — ${v.label}`)}
                                                className="p-0.5 rounded text-slate-300 hover:text-amber-500 transition" title="Adjust stock">
                                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {batchTabVisible && (
                                  <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-700/40">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                                        <FlaskConical className="w-3.5 h-3.5" /> Batches
                                      </p>
                                      <button onClick={() => openAddBatch(p.id)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 text-[10px] font-semibold hover:bg-emerald-100 transition">
                                        <Plus className="w-2.5 h-2.5" /> Add Batch
                                      </button>
                                    </div>
                                    {!productBatches[p.id] ? (
                                      <p className="text-xs text-slate-400">Loading batches…</p>
                                    ) : productBatches[p.id].length === 0 ? (
                                      <p className="text-xs text-slate-400 italic">No batches recorded. Add one to track expiry.</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {productBatches[p.id].map(b => (
                                          <div key={b.id} className="flex items-center gap-3 text-xs">
                                            <span className={`px-1.5 py-0.5 rounded-full font-semibold border text-[10px] ${
                                              b.status === "EXPIRED"       ? "bg-rose-50 text-rose-600 border-rose-200" :
                                              b.status === "EXPIRING_SOON" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                             "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            }`}>{b.status === "EXPIRING_SOON" ? "EXPIRING" : b.status}</span>
                                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{b.batchNumber}</span>
                                            <span className="text-slate-500">{b.expiryDate || "No expiry"}</span>
                                            <span className="text-slate-500">Qty: {b.quantity}</span>
                                            {b.notes && <span className="text-slate-400 italic truncate max-w-[120px]">{b.notes}</span>}
                                            <div className="ml-auto flex gap-1">
                                              <button onClick={() => openEditBatch(b)} className="p-0.5 rounded hover:text-blue-600 text-slate-300 transition"><Edit2 className="w-3 h-3" /></button>
                                              <button onClick={() => handleDeleteBatch(b.id, p.id)} className="p-0.5 rounded hover:text-rose-500 text-slate-300 transition"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        {/* Non-variant product expansion — batch panel only */}
                        {expandedProduct === p.id && !p.hasVariants && batchTabVisible && (
                          <tr key={`${p.id}-batches`}>
                            <td colSpan={7} className="px-0 py-0 bg-emerald-50/30 dark:bg-emerald-900/10">
                              <div className="px-8 py-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                                    <FlaskConical className="w-3.5 h-3.5" /> Batches
                                  </p>
                                  <button onClick={() => openAddBatch(p.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 text-[10px] font-semibold hover:bg-emerald-100 transition">
                                    <Plus className="w-2.5 h-2.5" /> Add Batch
                                  </button>
                                </div>
                                {!productBatches[p.id] ? (
                                  <p className="text-xs text-slate-400">Loading batches…</p>
                                ) : productBatches[p.id].length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No batches recorded. Add one to track expiry.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {productBatches[p.id].map(b => (
                                      <div key={b.id} className="flex items-center gap-3 text-xs">
                                        <span className={`px-1.5 py-0.5 rounded-full font-semibold border text-[10px] ${
                                          b.status === "EXPIRED"       ? "bg-rose-50 text-rose-600 border-rose-200" :
                                          b.status === "EXPIRING_SOON" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                         "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        }`}>{b.status === "EXPIRING_SOON" ? "EXPIRING" : b.status}</span>
                                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{b.batchNumber}</span>
                                        <span className="text-slate-500">{b.expiryDate || "No expiry"}</span>
                                        <span className="text-slate-500">Qty: {b.quantity}</span>
                                        {b.notes && <span className="text-slate-400 italic truncate max-w-[120px]">{b.notes}</span>}
                                        <div className="ml-auto flex gap-1">
                                          <button onClick={() => openEditBatch(b)} className="p-0.5 rounded hover:text-blue-600 text-slate-300 transition"><Edit2 className="w-3 h-3" /></button>
                                          <button onClick={() => handleDeleteBatch(b.id, p.id)} className="p-0.5 rounded hover:text-rose-500 text-slate-300 transition"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
                      <div className="overflow-x-auto"><table className="w-full text-xs mt-2">
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
                      </table></div>
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

      {/* BATCHES TAB */}
      {activeTab === "Batches" && batchTabVisible && (
        <>
          <div className="flex flex-wrap gap-2">
            {["All", "FRESH", "EXPIRING_SOON", "EXPIRED"].map(s => (
              <button key={s} onClick={() => setBatchFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  batchFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:text-blue-600"
                }`}>
                {s === "EXPIRING_SOON" ? "Expiring Soon" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
            {!batchesLoading && (
              <button onClick={loadBatches}
                className="ml-auto p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          {batchesLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-16">
              <FlaskConical className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No batches found</p>
              <p className="text-xs text-slate-400 mt-1">Expand a product in the Products tab to add batches.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    {["Status", "Product", "Batch No.", "Expiry Date", "Qty", "Notes", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBatches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          b.status === "EXPIRED"       ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700" :
                          b.status === "EXPIRING_SOON" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700" :
                                                         "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700"
                        }`}>
                          {b.status === "EXPIRING_SOON" ? "Expiring Soon" : b.status.charAt(0) + b.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{b.productName}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{b.batchNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {b.expiryDate
                          ? <span className={b.status === "EXPIRED" ? "text-rose-600 font-semibold" : b.status === "EXPIRING_SOON" ? "text-amber-600 font-semibold" : ""}>{b.expiryDate}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{b.quantity}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 italic max-w-[160px] truncate">{b.notes || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditBatch(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBatch(b.id, b.productId)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
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

              {/* Product image — only uploadable when editing (needs product ID) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Image</label>
                {editing ? (
                  productImage ? (
                    <div className="flex items-center gap-3">
                      <img src={productImage} alt="Product" className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-600 flex-shrink-0" />
                      <div className="flex flex-col gap-2">
                        <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 text-xs font-semibold hover:bg-blue-100 transition ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
                          {uploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                          {uploadingImage ? "Uploading…" : "Change"}
                          <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); e.target.value = ""; }} disabled={uploadingImage} />
                        </label>
                        <button type="button" onClick={handleImageDelete}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 text-xs font-semibold hover:bg-rose-100 transition">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 h-24 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl hover:border-blue-400 transition ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
                      {uploadingImage
                        ? <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                        : <Camera className="w-6 h-6 text-slate-300" />}
                      <span className="text-xs text-slate-400">{uploadingImage ? "Uploading…" : "Click to upload image"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); e.target.value = ""; }} disabled={uploadingImage} />
                    </label>
                  )
                ) : (
                  <p className="text-xs text-slate-400 italic">Save the product first, then come back to upload an image.</p>
                )}
              </div>

              {/* Variant toggle */}
              <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-700">
                <button
                  type="button"
                  onClick={() => {
                    set("hasVariants", !form.hasVariants);
                    if (!form.hasVariants && variants.length === 0) addVariant();
                  }}
                  className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${form.hasVariants ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.hasVariants ? "left-5" : "left-0.5"}`} />
                </button>
                <div>
                  <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> This product has variants (size, colour, etc.)
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                    Stock and pricing are tracked per variant. Wholesale prices can be set per variant.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Retail Price ({currencySymbol}) *</label>
                  <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" min="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Wholesale Price ({currencySymbol})</label>
                  <input type="number" value={form.wholesalePrice} onChange={e => set("wholesalePrice", e.target.value)} placeholder="Optional" min="0" className={inputCls} />
                </div>
              </div>
              {(form.wholesalePrice || form.hasVariants) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Min Wholesale Qty (MOQ)</label>
                  <input type="number" value={form.wholesaleMinQty || ""} onChange={e => set("wholesaleMinQty", e.target.value ? parseInt(e.target.value) : null)} placeholder="No minimum" min="1" className={inputCls} />
                  <p className="text-xs text-slate-400 mt-1">Warn at POS if wholesale order is below this quantity</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Cost Price ({currencySymbol})</label>
                  <input type="number" value={form.costPrice} onChange={e => set("costPrice", e.target.value)} placeholder="Optional" min="0" className={inputCls} />
                </div>
                {!form.hasVariants && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity in Stock</label>
                    <input type="number" value={form.quantityInStock} onChange={e => set("quantityInStock", parseInt(e.target.value) || 0)} min="0" className={inputCls} />
                  </div>
                )}
              </div>
              {!form.hasVariants && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Low Stock Alert Below</label>
                    <input type="number" value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", parseInt(e.target.value) || 0)} min="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Barcode</label>
                    <div className="flex gap-1.5">
                      <input value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="e.g. 6001234567890" className={`${inputCls} flex-1`} />
                      <button type="button" onClick={() => { setBarcodeScanTarget(null); setShowBarcodeScanner(true); }}
                        className="px-2.5 py-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg hover:scale-[1.05] transition flex-shrink-0">
                        <Camera size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">SKU</label>
                  <input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. IND-001" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                    <option value="">Select category</option>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Unit</label>
                <select value={form.unit} onChange={e => set("unit", e.target.value)} className={inputCls}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {accounts.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Income Account</label>
                    <select value={form.incomeAccountId} onChange={e => set("incomeAccountId", e.target.value)} className={inputCls}>
                      <option value="">None</option>
                      {accounts.filter(a => a.type === "INCOME").map(a => (
                        <option key={a.id} value={a.id}>{a.code ? `${a.code} · ` : ""}{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Direct Cost Account</label>
                    <select value={form.directCostAccountId} onChange={e => set("directCostAccountId", e.target.value)} className={inputCls}>
                      <option value="">None</option>
                      {accounts.filter(a => a.type === "EXPENSE" && a.subType === "DIRECT_COST").map(a => (
                        <option key={a.id} value={a.id}>{a.code ? `${a.code} · ` : ""}{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  rows={2} placeholder="Optional short description" className={inputCls + " resize-none"} />
              </div>

              {/* Pharmacy fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Drug Category</label>
                  <select value={form.drugCategory} onChange={e => set("drugCategory", e.target.value)} className={inputCls}>
                    <option value="NONE">Not a drug / N/A</option>
                    <option value="OTC">OTC — Over the Counter</option>
                    <option value="POM">POM — Prescription Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">NAFDAC / Reg. Number</label>
                  <input value={form.nafdacNumber} onChange={e => set("nafdacNumber", e.target.value)}
                    placeholder="e.g. A4-0001" className={inputCls} />
                </div>
              </div>

              {/* Variant builder */}
              {form.hasVariants && (
                <div className="border border-violet-200 dark:border-violet-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20">
                    <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Variants ({variants.length})
                    </p>
                    <button type="button" onClick={addVariant}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-200 transition border border-violet-200 dark:border-violet-700">
                      <Plus className="w-3 h-3" /> Add Variant
                    </button>
                  </div>
                  <div className="divide-y divide-violet-100 dark:divide-violet-800/30">
                    {variants.map((v, idx) => (
                      <div key={idx} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Variant #{idx + 1}</p>
                          <button type="button" onClick={() => removeVariant(idx)} disabled={variants.length === 1}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 disabled:opacity-20 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Size</label>
                            <input value={v.size} onChange={e => setVariantField(idx, "size", e.target.value)} placeholder="e.g. S / M / L / XL" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Colour</label>
                            <input value={v.color} onChange={e => setVariantField(idx, "color", e.target.value)} placeholder="e.g. Red / Blue" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Custom Label</label>
                            <input value={v.customLabel} onChange={e => setVariantField(idx, "customLabel", e.target.value)} placeholder="e.g. Weight" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Custom Value</label>
                            <input value={v.customValue} onChange={e => setVariantField(idx, "customValue", e.target.value)} placeholder="e.g. 500g" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">SKU</label>
                            <input value={v.sku} onChange={e => setVariantField(idx, "sku", e.target.value)} placeholder="Variant SKU" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Barcode</label>
                            <div className="flex gap-1">
                              <input value={v.barcode} onChange={e => setVariantField(idx, "barcode", e.target.value)} placeholder="Barcode" className={`${inputCls} flex-1`} />
                              <button type="button" onClick={() => { setBarcodeScanTarget(idx); setShowBarcodeScanner(true); }}
                                className="px-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg text-xs">
                                <Camera size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Retail Price ({currencySymbol})</label>
                            <input type="number" value={v.sellingPrice} onChange={e => setVariantField(idx, "sellingPrice", e.target.value)} placeholder="↑ parent" min="0" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Wholesale ({currencySymbol})</label>
                            <input type="number" value={v.wholesalePrice} onChange={e => setVariantField(idx, "wholesalePrice", e.target.value)} placeholder="Optional" min="0" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Cost ({currencySymbol})</label>
                            <input type="number" value={v.costPrice} onChange={e => setVariantField(idx, "costPrice", e.target.value)} placeholder="Optional" min="0" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Stock Qty</label>
                            <input type="number" value={v.stockQty} onChange={e => setVariantField(idx, "stockQty", e.target.value)} min="0" className={inputCls} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Stock Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" /> Adjust Stock
              </h3>
              <button onClick={() => setAdjustTarget(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 truncate">{adjustTarget.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity (positive to add, negative to remove)</label>
                <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                  placeholder="e.g. 10 or -5" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
                <input value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Stock count correction" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setAdjustTarget(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleAdjust} disabled={adjusting || !adjustQty}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {adjusting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Apply
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

      {showBarcodeScanner && (
        <BarcodeScanner
          onDetected={(code) => {
            if (barcodeScanTarget === null) {
              set("barcode", code);
            } else {
              setVariantField(barcodeScanTarget, "barcode", code);
            }
            setShowBarcodeScanner(false);
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Add/Edit Batch Modal */}
      {showBatchForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                {editingBatch ? "Edit Batch" : "Add Batch"}
              </h3>
              <button onClick={() => setShowBatchForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Batch / Lot Number *</label>
                <input value={batchForm.batchNumber} onChange={e => setBatchForm(f => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="e.g. LOT-2024-001" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Expiry Date</label>
                <input type="date" value={batchForm.expiryDate} onChange={e => setBatchForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity in this Batch</label>
                <input type="number" value={batchForm.quantity} onChange={e => setBatchForm(f => ({ ...f, quantity: e.target.value }))}
                  min="0" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
                <input value={batchForm.notes} onChange={e => setBatchForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Received from supplier X" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setShowBatchForm(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSaveBatch} disabled={savingBatch}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {savingBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingBatch ? "Save Changes" : "Add Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
