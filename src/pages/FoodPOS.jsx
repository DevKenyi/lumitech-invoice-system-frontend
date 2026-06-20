import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";
import {
  ShoppingCart, Plus, Minus, Trash2, X, Loader2,
  UtensilsCrossed, ToggleLeft, ToggleRight, RefreshCw,
  Printer, Users, ShoppingBag, Package,
} from "lucide-react";

const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "POS_TERMINAL"];

const fmt = (val, currency) =>
  currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);

function uuid() { return Math.random().toString(36).slice(2) + Date.now(); }

// ── Receipt printer ──────────────────────────────────────────────────────────
function printReceipts(order, orgName, currency) {
  const hasMixed = (order.items || []).some(i => i.toGo);

  const items = (order.items || []).map(i => {
    const modLine = i.modifiers?.length
      ? `<br><small style="color:#666">${i.modifiers.map(m => m.qty > 1 ? `${m.name} ×${m.qty}` : m.name).join(", ")}</small>`
      : "";
    const toGoTag = i.toGo
      ? `<span style="font-size:9px;border:1px solid #000;padding:1px 3px;margin-left:4px;font-weight:bold">TO GO</span>`
      : "";
    return `<tr>
      <td style="padding:2px 4px">${i.qty}× ${i.name}${toGoTag}${modLine}</td>
      <td style="padding:2px 4px;text-align:right">${fmt(i.subtotal, currency)}</td>
    </tr>`;
  }).join("");

  const kitchenItems = (order.items || []).map(i => {
    const modLine = i.modifiers?.length
      ? ` (${i.modifiers.map(m => m.qty > 1 ? `${m.name} ×${m.qty}` : m.name).join(", ")})`
      : "";
    const badge = hasMixed
      ? i.toGo
        ? `<span style="font-size:10px;border:2px solid #000;padding:1px 5px;margin-left:5px;font-weight:bold">PACK</span>`
        : `<span style="font-size:10px;border:1px solid #999;padding:1px 5px;margin-left:5px">SERVE</span>`
      : "";
    return `<div style="font-size:14px;margin:4px 0"><strong>${i.qty}×</strong> ${i.name}${badge}${modLine}</div>`;
  }).join("");

  const win = window.open("", "_blank", "width=380,height=600");
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Receipts</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: monospace; font-size:12px; }
      .page { width:80mm; padding:8px; page-break-after:always; }
      .page:last-child { page-break-after:avoid; }
      h2 { font-size:16px; text-align:center; margin-bottom:4px; }
      .center { text-align:center; }
      .big { font-size:32px; font-weight:bold; text-align:center; margin:8px 0; }
      .divider { border-top:1px dashed #000; margin:6px 0; }
      table { width:100%; border-collapse:collapse; }
      .total { font-size:14px; font-weight:bold; }
      .badge { display:inline-block; border:2px solid #000; padding:2px 8px; font-size:11px; font-weight:bold; }
      @media print { body { margin:0; } }
    </style></head><body>

    <!-- CUSTOMER RECEIPT -->
    <div class="page">
      <h2>${orgName}</h2>
      <div class="center" style="font-size:11px">Order Receipt</div>
      <div class="divider"></div>
      <div class="center"><span class="badge">${order.orderType === "DINE_IN" ? "DINE IN" : "TAKEAWAY"}</span></div>
      ${order.standNumber ? `<div class="big">#${order.standNumber}</div><div class="center" style="font-size:11px;margin-bottom:6px">Place this on your table</div>` : ""}
      <div class="divider"></div>
      <div style="font-size:11px;margin-bottom:4px">Order: <strong>${order.orderNumber}</strong></div>
      <table>${items}</table>
      <div class="divider"></div>
      <table>
        <tr class="total"><td>TOTAL</td><td style="text-align:right">${fmt(order.total, currency)}</td></tr>
        <tr><td style="font-size:11px">Payment</td><td style="text-align:right;font-size:11px">${(order.paymentMethod || "").replace("_", " ")}</td></tr>
      </table>
      <div class="divider"></div>
      <div class="center" style="font-size:11px">Thank you! Enjoy your meal.</div>
    </div>

    <!-- KITCHEN TICKET -->
    <div class="page">
      <div class="center" style="font-size:11px;font-weight:bold">— KITCHEN TICKET —</div>
      <div class="big">${order.standNumber ? "#" + order.standNumber : order.orderType === "TAKEAWAY" ? "TKWY" : "—"}</div>
      <div class="center" style="font-size:11px;margin-bottom:8px">${order.orderNumber} · ${order.orderType === "DINE_IN" ? "Dine In" : "Takeaway"}</div>
      <div class="divider"></div>
      ${kitchenItems}
      ${order.notes ? `<div class="divider"></div><div style="font-size:11px"><strong>Note:</strong> ${order.notes}</div>` : ""}
    </div>

    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

export default function FoodPOS() {
  const { currency, orgName } = useOrg();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState(null);
  const [modifierModal, setModifierModal] = useState(null);
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

  async function toggleAvail(item, e) {
    e.stopPropagation();
    try {
      const res = await api.patch(`/api/menu/items/${item.id}/availability`);
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
    } catch { showToast("Failed to update", "error"); }
  }

  function clickItem(item) {
    if (!item.available) return;
    if (item.modifiers && item.modifiers.length > 0) {
      setModifierModal(item);
    } else {
      addToCart(item, []);
    }
  }

  function addToCart(item, selectedMods) {
    const modTotal = selectedMods.reduce((s, m) => s + (m.priceDelta || 0) * (m.qty || 1), 0);
    const unitPrice = parseFloat(item.price) + modTotal;
    setCart(prev => {
      const modKey = selectedMods.map(m => `${m.modifierOptionId}:${m.qty || 1}`).sort().join(",");
      const existing = prev.find(ci =>
        ci.refId === item.id && ci.modKey === modKey && selectedMods.length === ci.modifiers.length);
      if (existing) {
        return prev.map(ci => ci.cartId === existing.cartId ? { ...ci, qty: ci.qty + 1 } : ci);
      }
      return [...prev, {
        cartId: uuid(), refId: item.id, modKey,
        itemType: "menu_item", name: item.name,
        unitPrice, qty: 1, modifiers: selectedMods, toGo: false,
      }];
    });
  }

  function changeQty(cartId, delta) {
    setCart(prev => prev.map(ci =>
      ci.cartId === cartId ? { ...ci, qty: Math.max(1, ci.qty + delta) } : ci
    ));
  }

  function toggleToGo(cartId) {
    setCart(prev => prev.map(ci =>
      ci.cartId === cartId ? { ...ci, toGo: !ci.toGo } : ci
    ));
  }

  function removeItem(cartId) {
    setCart(prev => prev.filter(ci => ci.cartId !== cartId));
  }

  const total = cart.reduce((s, ci) => s + ci.unitPrice * ci.qty, 0);

  async function charge() {
    if (cart.length === 0) return;
    setCharging(true);
    try {
      const res = await api.post("/api/orders", {
        orderType,
        channel: "IN_STORE",
        paymentMethod,
        notes,
        items: cart.map(ci => ({
          itemType: ci.itemType,
          refId: ci.refId,
          name: ci.name,
          qty: ci.qty,
          unitPrice: ci.unitPrice,
          toGo: ci.toGo || false,
          modifiers: ci.modifiers.map(m => ({
            modifierOptionId: m.modifierOptionId,
            name: m.name,
            priceDelta: m.priceDelta,
            qty: m.qty || 1,
          })),
        })),
      });
      const order = res.data;
      setSuccessOrder(order);
      setCart([]);
      setNotes("");
      printReceipts(order, orgName || "Restaurant", currency);
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
                <div key={item.id} onClick={() => clickItem(item)}
                  className={`relative bg-white dark:bg-slate-800 rounded-xl border shadow-sm cursor-pointer transition-all select-none overflow-hidden flex flex-col ${
                    item.available
                      ? "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md active:scale-95"
                      : "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed"
                  }`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <UtensilsCrossed size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  <button onClick={(e) => toggleAvail(item, e)}
                    className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-slate-800/80 rounded-full p-0.5 shadow">
                    {item.available
                      ? <ToggleRight size={16} className="text-green-500" />
                      : <ToggleLeft size={16} className="text-slate-400" />}
                  </button>
                  <div className="p-2.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-1">{item.name}</p>
                    <p className="text-blue-600 font-bold text-sm">{fmt(item.price, currency)}</p>
                    {!item.available && <span className="text-xs text-red-500 font-medium">Sold Out</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Order panel */}
      <div className="w-72 xl:w-80 flex flex-col bg-white dark:bg-slate-800 shrink-0">

        {/* Order type toggle */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
            <button onClick={() => setOrderType("DINE_IN")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                orderType === "DINE_IN"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}>
              <Users size={14} /> Dine In
            </button>
            <button onClick={() => setOrderType("TAKEAWAY")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                orderType === "TAKEAWAY"
                  ? "bg-orange-500 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}>
              <ShoppingBag size={14} /> Takeaway
            </button>
          </div>
        </div>

        {/* Cart header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
          <ShoppingCart size={16} className="text-blue-600" />
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Order</span>
          {cart.length > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-slate-400 text-sm mt-8">
              {orderType === "DINE_IN" ? "Select items for the order" : "Select items + packaging"}
            </p>
          ) : (
            cart.map(ci => (
              <div key={ci.cartId} className={`rounded-lg p-2.5 border ${
                ci.toGo
                  ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                  : "bg-slate-50 dark:bg-slate-700 border-transparent"
              }`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{ci.name}</p>
                    {ci.modifiers.length > 0 && (
                      <p className="text-xs text-slate-400 truncate">
                        {ci.modifiers.map(m => m.qty > 1 ? `${m.name} ×${m.qty}` : m.name).join(", ")}
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
                  <div className="flex items-center gap-2">
                    {/* TO GO toggle — only shown for dine-in orders */}
                    {orderType === "DINE_IN" && (
                      <button onClick={() => toggleToGo(ci.cartId)}
                        title={ci.toGo ? "Mark as Dine In" : "Mark as To Go"}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                          ci.toGo
                            ? "bg-orange-500 text-white border-orange-500"
                            : "border-slate-300 dark:border-slate-500 text-slate-400 hover:border-orange-400 hover:text-orange-500"
                        }`}>
                        <Package size={10} />
                        {ci.toGo ? "To Go" : "Serve"}
                      </button>
                    )}
                    <span className="text-sm font-bold text-blue-600">{fmt(ci.unitPrice * ci.qty, currency)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{fmt(total, currency)}</span>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Payment</p>
            <div className="flex flex-wrap gap-1">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    paymentMethod === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                  }`}>
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)" rows={2}
            className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 resize-none" />

          <button onClick={charge} disabled={cart.length === 0 || charging}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2">
            {charging ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            {charging ? "Processing..." : "Charge & Print"}
          </button>
        </div>
      </div>

      {/* Modifier modal */}
      {modifierModal && (
        <ModifierSelectionModal
          item={modifierModal} currency={currency}
          onConfirm={(mods) => { addToCart(modifierModal, mods); setModifierModal(null); }}
          onClose={() => setModifierModal(null)}
        />
      )}

      {/* Success modal */}
      {successOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-xs text-center">
            {successOrder.standNumber ? (
              <>
                <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 text-4xl font-black">
                  #{successOrder.standNumber}
                </div>
                <p className="text-sm text-slate-500 mb-1">Give this stand to the customer</p>
              </>
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={32} />
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{successOrder.orderNumber}</h3>
            <p className="text-2xl font-bold text-blue-600 mb-1">{fmt(successOrder.total, currency)}</p>
            <p className="text-xs text-slate-400 mb-4">{(successOrder.paymentMethod || "").replace("_", " ")} · {successOrder.orderType === "DINE_IN" ? "Dine In" : "Takeaway"}</p>
            <div className="flex gap-2">
              <button onClick={() => printReceipts(successOrder, orgName || "Restaurant", currency)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm flex items-center justify-center gap-1">
                <Printer size={14} /> Reprint
              </button>
              <button onClick={() => setSuccessOrder(null)}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm">
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modifier Selection Modal ──────────────────────────────────────────────────
function ModifierSelectionModal({ item, currency, onConfirm, onClose }) {
  const [selections, setSelections] = useState({});

  function selectOption(modId, opt) {
    setSelections(prev => {
      const existing = prev[modId];
      // If same option clicked again, keep it selected (don't deselect required)
      if (existing?.id === opt.id) return prev;
      return { ...prev, [modId]: { ...opt, qty: 1 } };
    });
  }

  function changeModQty(modId, delta) {
    setSelections(prev => {
      const opt = prev[modId];
      if (!opt) return prev;
      return { ...prev, [modId]: { ...opt, qty: Math.max(1, (opt.qty || 1) + delta) } };
    });
  }

  const requiredMet = item.modifiers.every(mod => !mod.required || selections[mod.id]);
  const modTotal = Object.values(selections).reduce((s, o) => s + (o.priceDelta || 0) * (o.qty || 1), 0);
  const finalPrice = parseFloat(item.price) + modTotal;

  function confirm() {
    const mods = Object.entries(selections).map(([, opt]) => ({
      modifierOptionId: opt.id,
      name: opt.name,
      priceDelta: opt.priceDelta || 0,
      qty: opt.qty || 1,
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
                {(mod.options || []).map(opt => {
                  const selected = selections[mod.id]?.id === opt.id;
                  const selQty = selections[mod.id]?.qty || 1;
                  return (
                    <div key={opt.id}>
                      <button
                        onClick={() => selectOption(mod.id, opt)}
                        className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}>
                        <span>{opt.name}</span>
                        <span className="text-xs text-slate-400">
                          {opt.priceDelta > 0 ? `+${currency}${Number(opt.priceDelta).toFixed(2)}` : opt.priceDelta < 0 ? `${currency}${Number(opt.priceDelta).toFixed(2)}` : "Free"}
                        </span>
                      </button>

                      {/* Qty stepper — only shown when this option is selected */}
                      {selected && (
                        <div className="flex items-center gap-2 mt-1.5 pl-3">
                          <span className="text-xs text-slate-500">Qty:</span>
                          <button onClick={() => changeModQty(mod.id, -1)}
                            className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-300 text-slate-600 dark:text-slate-300">
                            <Minus size={11} />
                          </button>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 w-4 text-center">{selQty}</span>
                          <button onClick={() => changeModQty(mod.id, 1)}
                            className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-300 text-slate-600 dark:text-slate-300">
                            <Plus size={11} />
                          </button>
                          {selQty > 1 && opt.priceDelta > 0 && (
                            <span className="text-xs text-blue-600 font-semibold ml-1">
                              +{currency}{(Number(opt.priceDelta) * selQty).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button onClick={confirm} disabled={!requiredMet}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2">
          <Plus size={16} />
          Add — {currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2 }).format(finalPrice)}
        </button>
      </div>
    </div>
  );
}
