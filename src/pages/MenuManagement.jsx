import { useEffect, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";
import {
  UtensilsCrossed, Plus, Pencil, Trash2, X, Loader2,
  ToggleLeft, ToggleRight, Tag, ChevronRight, ImagePlus, Camera,
} from "lucide-react";

const fmt = (val, currency) =>
  currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);

export default function MenuManagement() {
  const { currency } = useOrg();
  const [tab, setTab] = useState("items");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [modifiers, setModifiers] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [catModal, setCatModal] = useState(null); // null | {mode, data}
  const [itemModal, setItemModal] = useState(null);
  const [modModal, setModModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // {type, id, name}

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [cRes, iRes, mRes] = await Promise.all([
        api.get("/api/menu/categories"),
        api.get("/api/menu/items"),
        api.get("/api/menu/modifiers"),
      ]);
      setCategories(cRes.data);
      setItems(iRes.data);
      setModifiers(mRes.data);
    } catch { showToast("Failed to load menu", "error"); }
    finally { setLoading(false); }
  }

  const visibleItems = selectedCat
    ? items.filter(i => i.categoryId === selectedCat)
    : items;

  // ── Toggle availability ────────────────────────────────────────────────────
  async function toggleAvail(item) {
    try {
      const res = await api.patch(`/api/menu/items/${item.id}/availability`);
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
      showToast(`${res.data.name} marked ${res.data.available ? "available" : "sold out"}`);
    } catch { showToast("Failed to update availability", "error"); }
  }

  // ── Category CRUD ──────────────────────────────────────────────────────────
  async function saveCategory(form) {
    try {
      if (catModal.mode === "add") {
        const res = await api.post("/api/menu/categories", form);
        setCategories(prev => [...prev, { ...res.data, items: [] }]);
        showToast("Category created");
      } else {
        const res = await api.put(`/api/menu/categories/${catModal.data.id}`, form);
        setCategories(prev => prev.map(c => c.id === res.data.id ? { ...res.data, items: c.items } : c));
        showToast("Category updated");
      }
      setCatModal(null);
    } catch { showToast("Failed to save category", "error"); }
  }

  async function deleteCategory(id) {
    try {
      await api.delete(`/api/menu/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (selectedCat === id) setSelectedCat(null);
      showToast("Category deleted");
    } catch (e) { showToast(e.response?.data?.message || "Cannot delete category", "error"); }
    setDeleteTarget(null);
  }

  // ── Item CRUD ──────────────────────────────────────────────────────────────
  async function saveItem(form) {
    try {
      if (itemModal.mode === "add") {
        const res = await api.post("/api/menu/items", form);
        setItems(prev => [...prev, res.data]);
        showToast("Item created");
      } else {
        const res = await api.put(`/api/menu/items/${itemModal.data.id}`, form);
        setItems(prev => prev.map(i => i.id === res.data.id ? res.data : i));
        showToast("Item updated");
      }
      setItemModal(null);
    } catch { showToast("Failed to save item", "error"); }
  }

  async function deleteItem(id) {
    try {
      await api.delete(`/api/menu/items/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast("Item deleted");
    } catch { showToast("Failed to delete item", "error"); }
    setDeleteTarget(null);
  }

  // ── Modifier CRUD ──────────────────────────────────────────────────────────
  async function saveModifier(form) {
    try {
      if (modModal.mode === "add") {
        const res = await api.post("/api/menu/modifiers", form);
        setModifiers(prev => [...prev, res.data]);
        showToast("Modifier created");
      } else {
        const res = await api.put(`/api/menu/modifiers/${modModal.data.id}`, form);
        setModifiers(prev => prev.map(m => m.id === res.data.id ? res.data : m));
        showToast("Modifier updated");
      }
      setModModal(null);
    } catch { showToast("Failed to save modifier", "error"); }
  }

  async function deleteModifier(id) {
    try {
      await api.delete(`/api/menu/modifiers/${id}`);
      setModifiers(prev => prev.filter(m => m.id !== id));
      showToast("Modifier deleted");
    } catch { showToast("Failed to delete modifier", "error"); }
    setDeleteTarget(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed size={24} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Menu Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        {["items", "modifiers"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}>
            {t === "items" ? "Menu Items" : "Modifiers"}
          </button>
        ))}
      </div>

      {tab === "items" && (
        <div className="flex flex-col md:flex-row gap-4">

          {/* Mobile: horizontal scroll category chips */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <button onClick={() => setSelectedCat(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedCat ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}>
              All ({items.length})
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCat === c.id ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}>
                {c.name} ({items.filter(i => i.categoryId === c.id).length})
              </button>
            ))}
            <button onClick={() => setCatModal({ mode: "add", data: {} })}
              className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-blue-300 text-blue-600">
              + Add
            </button>
          </div>

          {/* Desktop: sidebar */}
          <div className="hidden md:block w-48 shrink-0">
            <button onClick={() => setCatModal({ mode: "add", data: {} })}
              className="w-full flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mb-3">
              <Plus size={14} /> Add Category
            </button>
            <ul className="space-y-1">
              <li>
                <button onClick={() => setSelectedCat(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedCat
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}>
                  All Items
                  <span className="ml-1 text-xs opacity-70">({items.length})</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id} className="group relative">
                  <button onClick={() => setSelectedCat(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors pr-14 ${
                      selectedCat === c.id
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}>
                    {c.name}
                    <span className="ml-1 text-xs opacity-70">
                      ({items.filter(i => i.categoryId === c.id).length})
                    </span>
                  </button>
                  <div className="absolute right-1 top-1 hidden group-hover:flex gap-0.5">
                    <button onClick={() => setCatModal({ mode: "edit", data: c })}
                      className="p-1 rounded text-slate-400 hover:text-blue-600">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "category", id: c.id, name: c.name })}
                      className="p-1 rounded text-slate-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Items grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">{visibleItems.length} items</p>
              <button onClick={() => setItemModal({ mode: "add", data: {} })}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Plus size={16} /> Add Item
              </button>
            </div>

            {visibleItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <UtensilsCrossed size={40} className="mx-auto mb-2 opacity-30" />
                <p>No items yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleItems.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* Photo */}
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name}
                        className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <UtensilsCrossed size={28} className="text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-tight">{item.name}</p>
                        <button onClick={() => toggleAvail(item)} className="ml-1 shrink-0 text-slate-400 hover:text-blue-600">
                          {item.available
                            ? <ToggleRight size={18} className="text-green-500" />
                            : <ToggleLeft size={18} className="text-slate-400" />}
                        </button>
                      </div>
                      <p className="text-base font-bold text-blue-600">{fmt(item.price, currency)}</p>
                      {item.categoryName && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Tag size={10} /> {item.categoryName}
                        </p>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full w-fit font-medium ${
                        item.available
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {item.available ? "Available" : "Sold Out"}
                      </span>
                      <div className="flex gap-1 mt-auto">
                        <button onClick={() => setItemModal({ mode: "edit", data: item })}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={() => setDeleteTarget({ type: "item", id: item.id, name: item.name })}
                          className="p-1 rounded border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-600 hover:border-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "modifiers" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setModModal({ mode: "add", data: {} })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus size={16} /> Add Modifier
            </button>
          </div>
          {modifiers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ChevronRight size={40} className="mx-auto mb-2 opacity-30" />
              <p>No modifiers yet. Add groups like "Size" or "Extras".</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modifiers.map(mod => (
                <div key={mod.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{mod.name}</p>
                      {mod.required && (
                        <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">Required</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setModModal({ mode: "edit", data: mod })}
                        className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget({ type: "modifier", id: mod.id, name: mod.name })}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-1 mt-2">
                    {(mod.options || []).map(o => (
                      <li key={o.id} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>{o.name}</span>
                        <span className="text-slate-400">
                          {o.priceDelta > 0 ? `+${fmt(o.priceDelta, currency)}` : o.priceDelta < 0 ? fmt(o.priceDelta, currency) : "Free"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <CategoryModal
          mode={catModal.mode}
          data={catModal.data}
          onSave={saveCategory}
          onClose={() => setCatModal(null)}
        />
      )}

      {/* Item Modal */}
      {itemModal && (
        <ItemModal
          mode={itemModal.mode}
          data={itemModal.data}
          categories={categories}
          modifiers={modifiers}
          currency={currency}
          onSave={saveItem}
          onClose={() => setItemModal(null)}
        />
      )}

      {/* Modifier Modal */}
      {modModal && (
        <ModifierModal
          mode={modModal.mode}
          data={modModal.data}
          currency={currency}
          onSave={saveModifier}
          onClose={() => setModModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Delete "{deleteTarget.name}"?</h3>
            <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm">
                Cancel
              </button>
              <button onClick={() => {
                if (deleteTarget.type === "category") deleteCategory(deleteTarget.id);
                else if (deleteTarget.type === "item") deleteItem(deleteTarget.id);
                else deleteModifier(deleteTarget.id);
              }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category Modal ────────────────────────────────────────────────────────────
function CategoryModal({ mode, data, onSave, onClose }) {
  const [name, setName] = useState(data.name || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, displayOrder: data.displayOrder || 0 });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {mode === "add" ? "Add Category" : "Edit Category"}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Category name"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
            required autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Item Modal ────────────────────────────────────────────────────────────────
function ItemModal({ mode, data, categories, modifiers, currency, onSave, onClose }) {
  const [form, setForm] = useState({
    name: data.name || "",
    price: data.price || "",
    categoryId: data.categoryId || "",
    available: data.available !== false,
    imageUrl: data.imageUrl || "",
    modifierIds: (data.modifiers || []).map(m => m.id),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMod = (id) => set("modifierIds",
    form.modifierIds.includes(id)
      ? form.modifierIds.filter(x => x !== id)
      : [...form.modifierIds, id]
  );

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/menu/items/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("imageUrl", res.data.url);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      price: parseFloat(form.price),
      categoryId: form.categoryId || null,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md my-8">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {mode === "add" ? "Add Menu Item" : "Edit Menu Item"}
        </h3>
        <form onSubmit={submit} className="space-y-4">

          {/* Photo upload */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Photo</label>
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                <div className="relative w-20 h-20 shrink-0">
                  <img src={form.imageUrl} alt="preview"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-600" />
                  <button type="button" onClick={() => set("imageUrl", "")}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 bg-slate-50 dark:bg-slate-700">
                  {uploading
                    ? <Loader2 size={20} className="animate-spin text-blue-500" />
                    : <Camera size={20} className="text-slate-300" />}
                </div>
              )}
              <div className="flex-1">
                <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  uploading
                    ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-600 text-slate-400"
                    : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}>
                  <ImagePlus size={15} />
                  {uploading ? "Uploading…" : form.imageUrl ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden" disabled={uploading} onChange={handleImageChange} />
                </label>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG or WebP · max 5 MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
              required autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Price ({currency}) *</label>
            <input type="number" min="0" step="0.01" value={form.price}
              onChange={e => set("price", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
              required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
            <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.available} onChange={e => set("available", e.target.checked)}
              className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm text-slate-700 dark:text-slate-200">Available for ordering</span>
          </label>
          {modifiers.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">Modifier Groups</label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {modifiers.map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.modifierIds.includes(m.id)}
                      onChange={() => toggleMod(m.id)} className="w-4 h-4 rounded text-blue-600" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {m.name} {m.required && <span className="text-xs text-orange-500">(required)</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modifier Modal ────────────────────────────────────────────────────────────
function ModifierModal({ mode, data, currency, onSave, onClose }) {
  const [name, setName] = useState(data.name || "");
  const [required, setRequired] = useState(data.required || false);
  const [options, setOptions] = useState(
    (data.options || []).map(o => ({ name: o.name, priceDelta: o.priceDelta || 0 }))
  );
  const [saving, setSaving] = useState(false);

  const addOption = () => setOptions(prev => [...prev, { name: "", priceDelta: 0 }]);
  const removeOption = (i) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const setOption = (i, k, v) => setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, [k]: v } : o));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, required, options: options.map(o => ({ name: o.name, priceDelta: parseFloat(o.priceDelta) || 0 })) });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md my-8">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {mode === "add" ? "Add Modifier Group" : "Edit Modifier Group"}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Name (e.g. "Size", "Extras") *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
              required autoFocus />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm text-slate-700 dark:text-slate-200">Customer must choose one option</span>
          </label>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-slate-500">Options</label>
              <button type="button" onClick={addOption}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus size={12} /> Add option
              </button>
            </div>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={o.name} onChange={e => setOption(i, "name", e.target.value)}
                    placeholder="Option name"
                    className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm" />
                  <input type="number" step="0.01" value={o.priceDelta}
                    onChange={e => setOption(i, "priceDelta", e.target.value)}
                    placeholder="+0.00"
                    className="w-24 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm" />
                  <button type="button" onClick={() => removeOption(i)}
                    className="text-slate-400 hover:text-red-600"><X size={16} /></button>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-xs text-slate-400 italic">No options yet. Add some above.</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
