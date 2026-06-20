import { useEffect, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";
import {
  ShoppingCart, Plus, Minus, Trash2, CheckCircle,
  X, Loader2, UtensilsCrossed, ToggleLeft, ToggleRight, RefreshCw,
} from "lucide-react";

const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD", "POS_TERMINAL"];

const fmt = (val, currency) =>
  currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now();
}

export default function FoodPOS() {
  const { currency } = useOrg();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState(null);
  const [modifierModal, setModifierModal] = useState(null); // item to select modifiers for
  const [successOrder, setSuccessOrder] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => { loadMenu(); }, []);

  async function loadMenu() {
    setLoading(true);
    try {
      const [cRes, iRes] = await Promise.all([
        api.get("/api/menu/categories"),
        api.get("/api/menu/items"),
      ]);
      setCategories(cRes.data);
      setItems(iRes.data);
    } catch { showToast("Failed to load menu", "error"); }
    finally { setLoading(false); }
  }

  const visibleItems = activeCat
    ? items.filter(i => i.categoryId === activeCat)
    : items;

  // ── Availability toggle ────────────────────────────────────────────────────
  async function toggleAvail(item, e) {
    e.stopPropagation();
    try {
      const res = await api.patch(`/api/menu/items/${item.id}/availability`);
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
    } catch { showToast("Failed to update", "error"); }
  }

  // ── Cart ───────────────────────────────────────────────────────────────────
  function clickItem(item) {
    if (!item.available) return;
    if (item.modifiers && item.modifiers.length > 0) {
      setModifierModal(item);
    } else {
      addToCart(item, []);
    }
  }

  function addToCart(item, selectedMods) {
    const modTotal = selectedMods.reduce((s, m) => s + (m.priceDelta || 0), 0);
    const unitPrice = parseFloat(item.price) + modTotal;
    setCart(prev => [...prev, {
      cartId: uuid(),
      refId: item.id,
      itemType: "menu_item",
      name: item.name,
      unitPrice,
      qty: 1,
      modifiers: selectedMods,
    }]);
  }

  function changeQty(cartId, delta) {
    setCart(prev => prev.map(ci =>
      ci.cartId === cartId ? { ...ci, qty: Math.max(1, ci.qty + delta) } : ci
    ));
  }

  function removeItem(cartId) {
    setCart(prev => prev.filter(ci => ci.cartId !== cartId));
  }

  const total = cart.reduce((s, ci) => s + ci.unitPrice * ci.qty, 0);

  // ── Charge ─────────────────────────────────────────────────────────────────
  async function chargeAndSend() {
    if (cart.length === 0) return;
    setCharging(true);
    try {
      const payload = {
        channel: "IN_STORE",
        paymentMethod,
        notes,
        items: cart.map(ci => ({
          itemType: ci.itemType,
          refId: ci.refId,
          name: ci.name,
          qty: ci.qty,
          unitPrice: ci.unitPrice,
          modifiers: ci.modifiers.map(m => ({
            modifierOptionId: m.modifierOptionId,
            name: m.name,
            priceDelta: m.priceDelta,
          })),
        })),
      };
      const res = await api.post("/api/orders", payload);
      setSuccessOrder(res.data);
      setCart([]);
      setNotes("");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to place order", "error");
    } finally { setCharging(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Left: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-700">
        {/* Category tabs */}
        <div className="flex gap-2 p-3 overflow-x-auto shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button onClick={() => setActiveCat(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeCat ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}>
            All
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCat === c.id ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}>
              {c.name}
            </button>
          ))}
          <button onClick={loadMenu} className="ml-auto shrink-0 p-1.5 text-slate-400 hover:text-blue-600">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <UtensilsCrossed size={40} className="mb-2 opacity-30" />
              <p>No items in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visibleItems.map(item => (
                <div key={item.id}
                  onClick={() => clickItem(item)}
                  className={`relative bg-white dark:bg-slate-800 rounded-xl border shadow-sm cursor-pointer transition-all select-none overflow-hidden flex flex-col ${
                    item.available
                      ? "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md active:scale-95"
                      : "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed"
                  }`}>
                  {/* Photo */}
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name}
                      className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <UtensilsCrossed size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  {/* Availability toggle */}
                  <button
                    onClick={(e) => toggleAvail(item, e)}
                    className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-slate-800/80 rounded-full p-0.5 shadow"
                    title={item.available ? "Mark sold out" : "Mark available"}>
                    {item.available
                      ? <ToggleRight size={16} className="text-green-500" />
                      : <ToggleLeft size={16} className="text-slate-400" />}
                  </button>
                  <div className="p-2.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-1">{item.name}</p>
                    <p className="text-blue-600 font-bold text-sm">{fmt(item.price, currency)}</p>
                    {!item.available && (
                      <span className="text-xs text-red-500 font-medium">Sold Out</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-72 xl:w-80 flex flex-col bg-white dark:bg-slate-800 shrink-0">
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
          <ShoppingCart size={18} className="text-blue-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-100">Order</span>
          {cart.length > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-slate-400 text-sm mt-8">Cart is empty</p>
          ) : (
            cart.map(ci => (
              <div key={ci.cartId} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2.5">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{ci.name}</p>
                    {ci.modifiers.length > 0 && (
                      <p className="text-xs text-slate-400 truncate">
                        {ci.modifiers.map(m => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeItem(ci.cartId)} className="text-slate-400 hover:text-red-500 shrink-0">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(ci.cartId, -1)}
                      className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 w-5 text-center">{ci.qty}</span>
                    <button onClick={() => changeQty(ci.cartId, 1)}
                      className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300">
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{fmt(ci.unitPrice * ci.qty, currency)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{fmt(total, currency)}</span>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Payment Method</p>
            <div className="flex flex-wrap gap-1">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    paymentMethod === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}>
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 resize-none"
          />

          {/* Charge button */}
          <button
            onClick={chargeAndSend}
            disabled={cart.length === 0 || charging}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
            {charging ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {charging ? "Processing..." : "Charge & Send to Kitchen"}
          </button>
        </div>
      </div>

      {/* Modifier Selection Modal */}
      {modifierModal && (
        <ModifierSelectionModal
          item={modifierModal}
          currency={currency}
          onConfirm={(mods) => { addToCart(modifierModal, mods); setModifierModal(null); }}
          onClose={() => setModifierModal(null)}
        />
      )}

      {/* Success modal */}
      {successOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Order Placed!</h3>
            <p className="text-slate-500 text-sm mb-1">{successOrder.orderNumber}</p>
            <p className="text-2xl font-bold text-blue-600 mb-4">{fmt(successOrder.total, currency)}</p>
            <p className="text-sm text-slate-500 mb-4">
              {successOrder.status === "received" ? "Sent to kitchen" : "Order completed"}
            </p>
            <button onClick={() => setSuccessOrder(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium">
              New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modifier Selection Modal ──────────────────────────────────────────────────
function ModifierSelectionModal({ item, currency, onConfirm, onClose }) {
  const [selections, setSelections] = useState({});

  const selectOption = (modifierId, option) => {
    setSelections(prev => ({ ...prev, [modifierId]: option }));
  };

  const requiredMet = item.modifiers.every(mod =>
    !mod.required || selections[mod.id]
  );

  const modTotal = Object.values(selections).reduce((s, o) => s + (o.priceDelta || 0), 0);
  const finalPrice = parseFloat(item.price) + modTotal;

  function confirm() {
    const mods = Object.entries(selections).map(([modId, opt]) => ({
      modifierOptionId: opt.id,
      name: opt.name,
      priceDelta: opt.priceDelta || 0,
    }));
    onConfirm(mods);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm my-8">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{item.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <p className="text-blue-600 font-semibold mb-4">
          {currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2 }).format(finalPrice)}
        </p>

        <div className="space-y-5">
          {item.modifiers.map(mod => (
            <div key={mod.id}>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1">
                {mod.name}
                {mod.required && <span className="text-xs text-orange-500">(required)</span>}
              </p>
              <div className="space-y-1.5">
                {(mod.options || []).map(opt => (
                  <button key={opt.id}
                    onClick={() => selectOption(mod.id, opt)}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selections[mod.id]?.id === opt.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}>
                    <span>{opt.name}</span>
                    <span className="text-xs text-slate-400">
                      {opt.priceDelta > 0 ? `+${currency}${opt.priceDelta.toFixed(2)}` : opt.priceDelta < 0 ? `${currency}${opt.priceDelta.toFixed(2)}` : "Free"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={confirm} disabled={!requiredMet}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2">
          <Plus size={16} />
          Add to Order — {currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2 }).format(finalPrice)}
        </button>
      </div>
    </div>
  );
}
