import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";
import {
  ShoppingCart, Plus, Minus, X, Loader2,
  UtensilsCrossed, ToggleLeft, ToggleRight, RefreshCw,
  Printer, Users, ShoppingBag, Package, Usb, Bluetooth, Wifi, CheckCircle,
} from "lucide-react";
import {
  printFoodOrderBrowser, printFoodOrderUSB, printFoodOrderBluetooth,
  connectUSBPrinter, reconnectBluetoothPrinter, connectBluetoothPrinter,
  getAuthorizedUSBPrinters, getAuthorizedBTPrinters,
  isWebUSBSupported, isWebBluetoothSupported,
} from "../utils/thermalPrint";

const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "POS_TERMINAL"];

const fmt = (val, currency) =>
  currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);

function uuid() { return Math.random().toString(36).slice(2) + Date.now(); }

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
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [usbDevice, setUsbDevice] = useState(null);
  const [btConn, setBtConn] = useState(null);
  const [showCartSheet, setShowCartSheet] = useState(false);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  async function handlePrint(order) {
    if (usbDevice) {
      try { await printFoodOrderUSB(usbDevice, order, orgName || "Restaurant", currency); return; }
      catch { showToast("USB print failed, using browser print", "info"); }
    }
    if (btConn) {
      try { await printFoodOrderBluetooth(btConn, order, orgName || "Restaurant", currency); return; }
      catch { showToast("Bluetooth print failed, using browser print", "info"); }
    }
    printFoodOrderBrowser(order, orgName || "Restaurant", currency);
  }

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

  const subtotal = cart.reduce((s, ci) => s + ci.unitPrice * ci.qty, 0);
  const convenienceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + convenienceFee;

  async function charge() {
    if (cart.length === 0) return;
    setCharging(true);
    try {
      const res = await api.post("/api/orders", {
        orderType,
        channel: "IN_STORE",
        paymentMethod,
        notes,
        convenienceFee,
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
      setShowCartSheet(false);
      handlePrint(order);
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
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-3 pb-24 md:pb-3 bg-slate-50 dark:bg-slate-900">
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

      {/* Mobile: floating cart button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartSheet(true)}
          className="fixed bottom-4 left-4 right-4 z-30 md:hidden flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-2xl shadow-xl">
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingCart size={18} />
            {cart.reduce((s, i) => s + i.qty, 0)} item{cart.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""}
          </span>
          <span className="font-bold text-base">{fmt(total, currency)}</span>
        </button>
      )}

      {/* Mobile: overlay */}
      {showCartSheet && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setShowCartSheet(false)} />
      )}

      {/* Right: Order panel — sidebar on desktop, bottom sheet on mobile */}
      <div className={`
        md:relative md:flex md:w-72 xl:md:w-80 md:flex-col md:bg-white md:dark:bg-slate-800 md:shrink-0
        ${showCartSheet
          ? "fixed bottom-0 left-0 right-0 z-40 flex flex-col bg-white dark:bg-slate-800 rounded-t-2xl max-h-[92dvh] overflow-hidden"
          : "hidden md:flex"
        }
      `}>

        {/* Mobile sheet handle + close */}
        <div className="md:hidden flex items-center justify-between px-4 pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" />
          <button onClick={() => setShowCartSheet(false)} className="absolute right-4 top-3 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Order type toggle + printer setup */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowPrinterSetup(true)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                usbDevice || btConn
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 dark:border-slate-600 text-slate-500 hover:text-blue-600"
              }`}>
              <Printer size={12} />
              {usbDevice ? "USB Printer" : btConn ? "BT Printer" : "Setup Printer"}
            </button>
          </div>
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
          {orderType === "DINE_IN" && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Mixed order? Keep <strong>Dine In</strong> and tap <span className="text-orange-500 font-semibold">SERVE / TO GO</span> on each item below.
            </p>
          )}
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
        <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain">
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
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border-2 transition-colors ${
                          ci.toGo
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-400 hover:border-orange-400 hover:text-orange-500"
                        }`}>
                        <Package size={11} />
                        {ci.toGo ? "TO GO" : "SERVE"}
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
          {cart.length > 0 && (
            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{fmt(subtotal, currency)}</span>
            </div>
          )}
          {cart.length > 0 && (
            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
              <span>✅ Convenience (5%)</span>
              <span>{fmt(convenienceFee, currency)}</span>
            </div>
          )}
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

      {/* Printer setup modal */}
      {showPrinterSetup && (
        <FoodPrinterSetupModal
          orgName={orgName || "Restaurant"}
          currency={currency}
          onConnect={(usb, bt) => { if (usb) setUsbDevice(usb); if (bt) setBtConn(bt); }}
          onClose={() => setShowPrinterSetup(false)}
        />
      )}

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
                <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center mx-auto mb-3 gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Table</span>
                  <span className="text-4xl font-black leading-none">{successOrder.standNumber}</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">Give this table number to the customer</p>
              </>
            ) : (
              <div className="w-28 h-28 rounded-full bg-orange-500 text-white flex flex-col items-center justify-center mx-auto mb-3 gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Ref</span>
                <span className="text-xl font-black leading-tight text-center px-2">{successOrder.orderNumber}</span>
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{successOrder.orderNumber}</h3>
            <p className="text-2xl font-bold text-blue-600 mb-1">{fmt(successOrder.total, currency)}</p>
            <p className="text-xs text-slate-400 mb-4">{(successOrder.paymentMethod || "").replace("_", " ")} · {successOrder.orderType === "DINE_IN" ? "Dine In" : "Takeaway"}</p>
            <div className="flex gap-2">
              <button onClick={() => handlePrint(successOrder)}
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

// ── Food Printer Setup Modal ──────────────────────────────────────────────────
function FoodPrinterSetupModal({ orgName, currency, onConnect, onClose }) {
  const [usbDevice, setUsbDevice] = useState(null);
  const [btConn, setBtConn]       = useState(null);
  const [knownUSB, setKnownUSB]   = useState([]);
  const [knownBT, setKnownBT]     = useState([]);
  const [busy, setBusy]           = useState(null);
  const [error, setError]         = useState("");
  const [status, setStatus]       = useState("");

  useEffect(() => {
    getAuthorizedUSBPrinters().then(setKnownUSB);
    getAuthorizedBTPrinters().then(setKnownBT);
  }, []);

  const isBusy = busy !== null;
  const isConnected = usbDevice || btConn;

  const connectUSB = async (device) => {
    const key = device.serialNumber || device.productName || "usb";
    setBusy(key); setError(""); setStatus("Connecting to " + (device.productName || "USB Printer") + "…");
    try {
      setUsbDevice(device);
      setStatus("Connected: " + (device.productName || "USB Printer"));
    } catch (e) { setError(e.message); setStatus(""); }
    finally { setBusy(null); }
  };

  const addNewUSB = async () => {
    setBusy("new-usb"); setError(""); setStatus("Select your printer from the browser popup…");
    try {
      const device = await connectUSBPrinter();
      setKnownUSB(prev => prev.some(d => d.serialNumber === device.serialNumber) ? prev : [...prev, device]);
      setUsbDevice(device);
      setStatus("Connected: " + (device.productName || "USB Printer"));
    } catch (e) {
      setError(e.message.includes("No device") || e.message.includes("cancelled") ? "No printer selected." : e.message);
      setStatus("");
    } finally { setBusy(null); }
  };

  const connectBT = async (device) => {
    setBusy(device.id); setError(""); setStatus("Connecting to " + (device.name || "BT Printer") + "…");
    try {
      const conn = await reconnectBluetoothPrinter(device);
      setBtConn(conn);
      setStatus("Connected: " + (device.name || "BT Printer"));
    } catch (e) { setError(e.message); setStatus(""); }
    finally { setBusy(null); }
  };

  const addNewBT = async () => {
    setBusy("new-bt"); setError(""); setStatus("Select your printer from the browser popup…");
    try {
      const conn = await connectBluetoothPrinter();
      setKnownBT(prev => prev.some(d => d.id === conn.device.id) ? prev : [...prev, conn.device]);
      setBtConn(conn);
      setStatus("Connected: " + (conn.device.name || "BT Printer"));
    } catch (e) {
      setError(e.message.includes("cancelled") ? "No printer selected. Make sure Bluetooth is on." : e.message);
      setStatus("");
    } finally { setBusy(null); }
  };

  const testPrint = async () => {
    setBusy("test"); setError(""); setStatus("Sending test receipt…");
    const testOrder = {
      orderNumber: "TEST-001", orderType: "DINE_IN", standNumber: 5,
      paymentMethod: "CASH", total: 3500, notes: "",
      items: [
        { name: "Egusi Soup", qty: 1, subtotal: 2000, toGo: false, modifiers: [{ name: "Beef", qty: 2, priceDelta: 500 }] },
        { name: "Jollof Rice", qty: 1, subtotal: 1500, toGo: true, modifiers: [] },
      ],
    };
    try {
      if (usbDevice)   { await printFoodOrderUSB(usbDevice, testOrder, orgName, currency); setStatus("Test sent to USB printer ✓"); }
      else if (btConn) { await printFoodOrderBluetooth(btConn, testOrder, orgName, currency); setStatus("Test sent to BT printer ✓"); }
      else             { printFoodOrderBrowser(testOrder, orgName, currency); setStatus("Browser print dialog opened ✓"); }
    } catch (e) { setError("Print error: " + e.message); setStatus(""); }
    finally { setBusy(null); }
  };

  const handleDone = () => {
    onConnect(usbDevice, btConn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-auto"
           style={{ maxHeight: "85dvh", overflowY: "auto" }}>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Printer Setup</h3>
              <p className="text-xs text-slate-400">Connect a receipt printer for food orders</p>
            </div>
          </div>
          <button onClick={handleDone} disabled={isBusy}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {isBusy && status && (
            <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{status}</p>
            </div>
          )}
          {!isBusy && status && (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">{status}</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <X className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}

          {/* Browser print */}
          <div className={`p-4 rounded-xl border-2 transition-all ${!isConnected ? "border-blue-200 bg-blue-50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700"}`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Browser Print</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Works everywhere</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Any printer set as default — no setup needed</p>
              </div>
            </div>
            <button onClick={testPrint} disabled={isBusy}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {busy === "test" ? "Sending…" : "Test Print (food order)"}
            </button>
          </div>

          {/* USB */}
          {isWebUSBSupported() && (
            <div className={`p-4 rounded-xl border-2 transition-all ${usbDevice ? "border-emerald-300 bg-emerald-50" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${usbDevice ? "bg-emerald-100" : "bg-violet-50"}`}>
                  <Usb className={`w-4 h-4 ${usbDevice ? "text-emerald-600" : "text-violet-600"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">USB Direct</p>
                    {usbDevice
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Connected</span>
                      : <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Chrome / Edge</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{usbDevice ? (usbDevice.productName || "USB Printer") : "ESC/POS thermal printer"}</p>
                </div>
              </div>
              {knownUSB.map(d => {
                const key = d.serialNumber || d.productName || "usb";
                return (
                  <button key={key} onClick={() => connectUSB(d)} disabled={isBusy}
                    className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                      usbDevice === d ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                    {busy === key ? "Connecting…" : usbDevice === d ? `Connected: ${d.productName || "USB Printer"}` : `Connect ${d.productName || "USB Printer"}`}
                  </button>
                );
              })}
              <button onClick={addNewUSB} disabled={isBusy}
                className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                  knownUSB.length > 0 ? "border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                {busy === "new-usb" ? "Opening picker…" : knownUSB.length > 0 ? "+ Add different USB printer" : "Connect USB Printer"}
              </button>
            </div>
          )}

          {/* Bluetooth */}
          {isWebBluetoothSupported() && (
            <div className={`p-4 rounded-xl border-2 transition-all ${btConn ? "border-emerald-300 bg-emerald-50" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${btConn ? "bg-emerald-100" : "bg-blue-50"}`}>
                  <Bluetooth className={`w-4 h-4 ${btConn ? "text-emerald-600" : "text-blue-500"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bluetooth</p>
                    {btConn
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Connected</span>
                      : <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Chrome / Edge</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{btConn ? (btConn.device.name || "BT Printer") : "Wireless BLE thermal printer"}</p>
                </div>
              </div>
              {knownBT.map(d => (
                <button key={d.id} onClick={() => connectBT(d)} disabled={isBusy}
                  className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                    btConn?.device === d ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {busy === d.id ? "Connecting…" : btConn?.device === d ? `Connected: ${d.name || "BT Printer"}` : `Connect ${d.name || "BT Printer"}`}
                </button>
              ))}
              <button onClick={addNewBT} disabled={isBusy}
                className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                  knownBT.length > 0 ? "border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {busy === "new-bt" ? "Opening picker…" : knownBT.length > 0 ? "+ Add different Bluetooth printer" : "Connect Bluetooth Printer"}
              </button>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">USB/BT requires Chrome or Edge</p>
          <button onClick={handleDone} disabled={isBusy}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-xl transition disabled:opacity-40">
            {isConnected ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
