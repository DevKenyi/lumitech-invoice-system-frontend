// IngredientManagement.jsx — Restaurant ingredient catalog + stock ledger (Food POS)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";
import {
  Plus, Search, Edit2, Trash2, Wheat, AlertTriangle, X, Check,
  RefreshCw, History, SlidersHorizontal, UtensilsCrossed,
} from "lucide-react";

const STOCK_UNITS = ["g", "kg", "ml", "l", "pcs", "pack", "bottle", "bag", "box"];
const CATEGORIES = ["Grains", "Vegetables", "Meat", "Seafood", "Dairy", "Cooking Oil", "Spices", "Beverages", "Packaging", "Other"];

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyForm = () => ({
  name: "", category: "", stockUnit: "kg", quantityOnHand: 0, lowStockThreshold: 0,
  reorderQuantity: "", purchaseCost: "", supplierName: "", storageLocation: "", active: true,
});

const MOVEMENT_STYLES = {
  RESTOCK:            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700",
  RECIPE_CONSUMPTION: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
  WASTE:              "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700",
  ADJUSTMENT:         "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
  RETURN:             "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700",
  REVERSAL:           "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700",
};

function MovementTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${MOVEMENT_STYLES[type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {type}
    </span>
  );
}

export default function IngredientManagement() {
  const { fmtDate } = useOrg();
  const navigate = useNavigate();

  const [dlg, setDlg] = useState({ visible: false, title: "", message: "", action: null });
  const [confirming, setConfirming] = useState(false);
  const openConfirm = (title, message, action) => setDlg({ visible: true, title, message, action });
  const runConfirm = async () => { setConfirming(true); try { await dlg.action(); } finally { setConfirming(false); setDlg(d => ({ ...d, visible: false })); } };

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const [activeTab, setActiveTab] = useState("Ingredients");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [adjustTarget, setAdjustTarget] = useState(null); // { id, name, currentQty, unit }
  const [adjustQty, setAdjustQty] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsIngredientId, setMovementsIngredientId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/ingredients");
      setIngredients(res.data || []);
    } catch { notify("Failed to load ingredients", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const lowStock = ingredients.filter(i => i.lowStock && i.active);
  const filtered = search.trim()
    ? ingredients.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.category || "").toLowerCase().includes(search.toLowerCase()))
    : ingredients;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (i) => {
    setEditing(i.id);
    setForm({
      name: i.name, category: i.category || "", stockUnit: i.stockUnit,
      quantityOnHand: i.quantityOnHand, lowStockThreshold: i.lowStockThreshold,
      reorderQuantity: i.reorderQuantity ?? "", purchaseCost: i.purchaseCost ?? "",
      supplierName: i.supplierName || "", storageLocation: i.storageLocation || "", active: i.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.stockUnit) { notify("Name and stock unit are required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantityOnHand: parseFloat(form.quantityOnHand) || 0,
        lowStockThreshold: parseFloat(form.lowStockThreshold) || 0,
        reorderQuantity: form.reorderQuantity !== "" ? parseFloat(form.reorderQuantity) : null,
        purchaseCost: form.purchaseCost !== "" ? parseFloat(form.purchaseCost) : null,
      };
      if (editing) {
        await api.put(`/api/ingredients/${editing}`, payload);
        notify("Ingredient updated");
      } else {
        await api.post("/api/ingredients", payload);
        notify("Ingredient added");
      }
      setShowForm(false);
      load();
    } catch (e) {
      notify(e.response?.data?.message || "Failed to save ingredient", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => {
    openConfirm("Remove Ingredient", `Remove "${name}" from the catalog? Existing recipes using it will stop deducting stock.`, async () => {
      try {
        await api.delete(`/api/ingredients/${id}`);
        notify("Ingredient removed");
        load();
      } catch { notify("Failed to remove ingredient", "error"); }
    });
  };

  const openAdjust = (i) => {
    setAdjustTarget({ id: i.id, name: i.name, currentQty: i.quantityOnHand, unit: i.stockUnit, full: i });
    setAdjustQty("");
  };

  const handleAdjust = async () => {
    const delta = parseFloat(adjustQty);
    if (!delta || isNaN(delta)) { notify("Enter a non-zero quantity", "error"); return; }
    setAdjusting(true);
    try {
      const i = adjustTarget.full;
      const payload = {
        name: i.name, category: i.category || "", stockUnit: i.stockUnit,
        quantityOnHand: adjustTarget.currentQty + delta,
        lowStockThreshold: i.lowStockThreshold,
        reorderQuantity: i.reorderQuantity, purchaseCost: i.purchaseCost,
        supplierName: i.supplierName || "", storageLocation: i.storageLocation || "", active: i.active,
      };
      await api.put(`/api/ingredients/${adjustTarget.id}`, payload);
      notify(`Stock adjusted by ${delta > 0 ? "+" : ""}${delta} ${adjustTarget.unit}`);
      setAdjustTarget(null);
      load();
    } catch (e) {
      notify(e.response?.data?.message || "Adjustment failed", "error");
    } finally { setAdjusting(false); }
  };

  const loadMovements = async (ingredientId) => {
    setMovementsIngredientId(ingredientId);
    setMovementsLoading(true);
    try {
      const res = await api.get(`/api/ingredients/${ingredientId}/movements?size=100`);
      setMovements(res.data.content || []);
    } catch { notify("Failed to load stock movements", "error"); }
    finally { setMovementsLoading(false); }
  };

  useEffect(() => {
    if (activeTab !== "Movements") return;
    if (!movementsIngredientId && ingredients.length > 0) loadMovements(ingredients[0].id);
  }, [activeTab, ingredients]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Toast {...toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />
      <ConfirmModal visible={dlg.visible} title={dlg.title} message={dlg.message} loading={confirming}
        onConfirm={runConfirm} onCancel={() => setDlg(d => ({ ...d, visible: false }))} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wheat className="w-6 h-6 text-amber-600" /> Ingredients
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage raw ingredients and stock levels for recipe-based deduction</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/menu")}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition">
            <UtensilsCrossed className="w-4 h-4" /> Go to Menu
          </button>
          {activeTab === "Ingredients" && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition">
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full w-fit">
        {["Ingredients", "Movements"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}>
            {tab === "Movements" && <History className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {tab === "Ingredients" && <Wheat className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Ingredients" && (
        <>
          {lowStock.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {lowStock.length} ingredient{lowStock.length > 1 ? "s" : ""} running low on stock
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {lowStock.map(i => `${i.name} (${i.quantityOnHand} ${i.stockUnit} left)`).join(" · ")}
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or category…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Wheat className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No ingredients yet. Add your first ingredient to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    {["Ingredient", "Category", "Stock", "Low Stock At", "Supplier", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map(i => (
                    <tr key={i.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${!i.active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-white">{i.name}</p>
                        {!i.active && <span className="text-[10px] text-slate-400 font-semibold uppercase">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{i.category || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            i.lowStock ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {i.lowStock && <AlertTriangle className="w-3 h-3" />}
                            {i.quantityOnHand} {i.stockUnit}
                          </span>
                          <button onClick={() => openAdjust(i)}
                            className="p-0.5 rounded text-slate-300 hover:text-amber-500 transition" title="Adjust stock">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{i.lowStockThreshold} {i.stockUnit}</td>
                      <td className="px-4 py-3 text-slate-500">{i.supplierName || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setActiveTab("Movements"); loadMovements(i.id); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition" title="View movements">
                            <History className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(i.id, i.name)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition">
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

      {activeTab === "Movements" && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={movementsIngredientId || ""} onChange={e => loadMovements(e.target.value)}
              className={`${inputCls} max-w-xs`}>
              {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            {!movementsLoading && movementsIngredientId && (
              <button onClick={() => loadMovements(movementsIngredientId)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          {movementsLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No stock movements recorded yet for this ingredient.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    {["Date", "Type", "Quantity", "Notes", "By"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {fmtDate(m.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3"><MovementTypeBadge type={m.movementType} /></td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold tabular-nums ${Number(m.quantity) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {Number(m.quantity) >= 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[220px]">{m.notes || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{m.createdBy || "system"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Ingredient Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-900 dark:text-white text-lg">{editing ? "Edit Ingredient" : "Add Ingredient"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ingredient Name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Rice, Chicken, Cooking Oil" className={inputCls} autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Stock Unit *</label>
                  <select value={form.stockUnit} onChange={e => set("stockUnit", e.target.value)} className={inputCls}>
                    {STOCK_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {editing ? "Quantity on Hand" : "Initial Stock"}
                  </label>
                  <input type="number" value={form.quantityOnHand} onChange={e => set("quantityOnHand", e.target.value)}
                    min="0" step="0.01" className={inputCls} />
                  {editing && <p className="text-xs text-slate-400 mt-1">Editing this directly logs an ADJUSTMENT movement.</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Low Stock Alert Below</label>
                  <input type="number" value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", e.target.value)}
                    min="0" step="0.01" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Reorder Quantity</label>
                  <input type="number" value={form.reorderQuantity} onChange={e => set("reorderQuantity", e.target.value)}
                    placeholder="Optional" min="0" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Cost (per {form.stockUnit})</label>
                  <input type="number" value={form.purchaseCost} onChange={e => set("purchaseCost", e.target.value)}
                    placeholder="Optional" min="0" step="0.01" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier</label>
                  <input value={form.supplierName} onChange={e => set("supplierName", e.target.value)}
                    placeholder="Optional" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Storage Location</label>
                  <input value={form.storageLocation} onChange={e => set("storageLocation", e.target.value)}
                    placeholder="e.g. Walk-in fridge" className={inputCls} />
                </div>
              </div>

              {editing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Active</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Save Changes" : "Add Ingredient"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
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
            <p className="text-xs text-slate-500 mb-4">
              {adjustTarget.name} — currently {adjustTarget.currentQty} {adjustTarget.unit}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Quantity ({adjustTarget.unit}) — positive to add, negative to remove
              </label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                placeholder="e.g. 10 or -5" step="0.01" className={inputCls} autoFocus />
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
    </div>
  );
}
