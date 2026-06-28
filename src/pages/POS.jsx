// POS.jsx — Point of Sale terminal
import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle,
  X, Barcode, RefreshCw, Printer, Mail, User, Download,
  Bluetooth, Usb, Settings, Wifi, Camera, Layers,
} from "lucide-react";
import Toast from "../components/Toast";
import BarcodeScanner from "../components/BarcodeScanner";
import {
  printReceiptBrowser,
  connectUSBPrinter, printReceiptUSB,
  connectBluetoothPrinter, reconnectBluetoothPrinter, printReceiptBluetooth,
  isWebUSBSupported, isWebBluetoothSupported,
  getAuthorizedUSBPrinters, getAuthorizedBTPrinters,
} from "../utils/thermalPrint";
import { useOrg } from "../context/OrgContext";
const PAYMENT_METHODS = ["CASH", "TRANSFER", "CARD", "POS_TERMINAL"];

// ── Printer Setup Modal ───────────────────────────────────────────────────
function PrinterSetupModal({ orgName, onClose }) {
  const { currency, locale } = useOrg();
  const [usbDevice, setUsbDevice]     = useState(null);
  const [btConn, setBtConn]           = useState(null);
  const [knownUSB, setKnownUSB]       = useState([]);   // previously authorised
  const [knownBT, setKnownBT]         = useState([]);
  const [busy, setBusy]               = useState(null); // device key being connected
  const [error, setError]             = useState("");
  const [status, setStatus]           = useState("");

  // Load previously authorised devices on mount — no picker
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
    } catch (e) {
      setError(e.message); setStatus("");
    } finally { setBusy(null); }
  };

  const addNewUSB = async () => {
    setBusy("new-usb"); setError(""); setStatus("Select your printer from the browser popup…");
    try {
      const device = await connectUSBPrinter();
      setKnownUSB(prev => prev.some(d => d.serialNumber === device.serialNumber) ? prev : [...prev, device]);
      setUsbDevice(device);
      setStatus("Connected: " + (device.productName || "USB Printer"));
    } catch (e) {
      setError(e.message.includes("No device") || e.message.includes("cancelled")
        ? "No printer selected." : e.message);
      setStatus("");
    } finally { setBusy(null); }
  };

  const connectBT = async (device) => {
    setBusy(device.id); setError(""); setStatus("Connecting to " + (device.name || "BT Printer") + "…");
    try {
      const conn = await reconnectBluetoothPrinter(device);
      setBtConn(conn);
      setStatus("Connected: " + (device.name || "BT Printer"));
    } catch (e) {
      setError(e.message); setStatus("");
    } finally { setBusy(null); }
  };

  const addNewBT = async () => {
    setBusy("new-bt"); setError(""); setStatus("Select your printer from the browser popup…");
    try {
      const conn = await connectBluetoothPrinter();
      setKnownBT(prev => prev.some(d => d.id === conn.device.id) ? prev : [...prev, conn.device]);
      setBtConn(conn);
      setStatus("Connected: " + (conn.device.name || "BT Printer"));
    } catch (e) {
      setError(e.message.includes("cancelled") || e.message.includes("chosen")
        ? "No printer selected. Make sure Bluetooth is on." : e.message);
      setStatus("");
    } finally { setBusy(null); }
  };

  const handleTestPrint = async () => {
    setBusy("test"); setError(""); setStatus("Sending test receipt…");
    const testReceipt = {
      receiptNumber: "TEST-001", saleDate: new Date().toISOString(),
      paymentMethod: "CASH", customerName: "Test Customer", total: 5000, discount: 0,
      items: [{ productName: "Test Item", quantity: 1, unitPrice: 5000, subtotal: 5000 }],
    };
    try {
      if (usbDevice)   { await printReceiptUSB(usbDevice, testReceipt, orgName, currency, locale);    setStatus("Test sent to USB printer ✓"); }
      else if (btConn) { await printReceiptBluetooth(btConn, testReceipt, orgName, currency, locale); setStatus("Test sent to Bluetooth printer ✓"); }
      else             { printReceiptBrowser(testReceipt, orgName, currency, locale);                 setStatus("Browser print dialog opened ✓"); }
    } catch (e) {
      setError("Print error: " + e.message); setStatus("");
    } finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-auto"
           style={{ maxHeight: "85dvh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-600/20">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Printer Setup</h3>
              <p className="text-xs text-slate-400">Connect a thermal receipt printer</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isBusy}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Status banners */}
          {isBusy && status && (
            <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-blue-700 font-medium">{status}</p>
            </div>
          )}
          {!isBusy && status && (
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
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

          {/* Browser Print */}
          <div className={`p-4 rounded-xl border-2 transition-all ${!isConnected ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Browser Print</p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">Works everywhere</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Any printer set as default — no setup needed</p>
              </div>
            </div>
            <button onClick={handleTestPrint} disabled={isBusy}
              className="w-full mt-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {busy === "test" ? "Sending…" : "Test Print"}
            </button>
          </div>

          {/* USB — known devices + add new */}
          {isWebUSBSupported() && (
            <div className={`p-4 rounded-xl border-2 transition-all ${usbDevice ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${usbDevice ? "bg-emerald-100" : "bg-violet-50"}`}>
                  <Usb className={`w-4 h-4 ${usbDevice ? "text-emerald-600" : "text-violet-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">USB Direct</p>
                    {usbDevice
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">Connected</span>
                      : <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Chrome / Edge</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {usbDevice ? (usbDevice.productName || "USB Printer") + " — ESC/POS direct" : "ESC/POS direct to USB printer"}
                  </p>
                </div>
              </div>
              {/* Previously paired — one tap, no picker */}
              {knownUSB.length > 0 && knownUSB.map((d) => {
                const key = d.serialNumber || d.productName || "usb";
                return (
                  <button key={key} onClick={() => connectUSB(d)} disabled={isBusy}
                    className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                      usbDevice === d ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                                      : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                    {busy === key ? "Connecting…" : usbDevice === d ? `Connected: ${d.productName || "USB Printer"}` : `Connect ${d.productName || "USB Printer"}`}
                  </button>
                );
              })}
              {/* Add new — triggers picker only if no known devices or want a different one */}
              <button onClick={addNewUSB} disabled={isBusy}
                className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                  knownUSB.length > 0
                    ? "border border-dashed border-violet-300 text-violet-600 hover:bg-violet-50"
                    : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                {busy === "new-usb" ? "Opening picker…" : knownUSB.length > 0 ? "+ Add different USB printer" : "Connect USB Printer"}
              </button>
            </div>
          )}

          {/* Bluetooth — known devices + add new */}
          {isWebBluetoothSupported() && (
            <div className={`p-4 rounded-xl border-2 transition-all ${btConn ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${btConn ? "bg-emerald-100" : "bg-blue-50"}`}>
                  <Bluetooth className={`w-4 h-4 ${btConn ? "text-emerald-600" : "text-blue-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Bluetooth</p>
                    {btConn
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">Connected</span>
                      : <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Chrome / Edge</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {btConn ? (btConn.device.name || "BT Printer") + " — wireless ESC/POS" : "Wireless BLE thermal printer"}
                  </p>
                </div>
              </div>
              {knownBT.length > 0 && knownBT.map((d) => (
                <button key={d.id} onClick={() => connectBT(d)} disabled={isBusy}
                  className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                    btConn?.device === d ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                                        : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {busy === d.id ? "Connecting…" : btConn?.device === d ? `Connected: ${d.name || "BT Printer"}` : `Connect ${d.name || "BT Printer"}`}
                </button>
              ))}
              <button onClick={addNewBT} disabled={isBusy}
                className={`w-full mt-1 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                  knownBT.length > 0
                    ? "border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {busy === "new-bt" ? "Opening picker…" : knownBT.length > 0 ? "+ Add different Bluetooth printer" : "Connect Bluetooth Printer"}
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">USB/BT requires Chrome or Edge</p>
          <button onClick={onClose} disabled={isBusy}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-40">
            {isConnected ? "Done" : "Cancel"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function POS() {
  const { fmt, currencySymbol, currency, locale } = useOrg();
  const [products, setProducts]     = useState([]);
  const [cart, setCart]             = useState([]);
  const [search, setSearch]         = useState("");
  const [barcode, setBarcode]       = useState("");
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [discount, setDiscount]     = useState("");
  const [paymentMethod, setMethod]  = useState("CASH");
  const [customerName, setCustName] = useState("");
  const [customerEmail, setCustEmail]= useState("");
  const [notes, setNotes]           = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [toast, setToast]           = useState({ visible: false, message: "", type: "info" });
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [usbDevice, setUsbDevice]   = useState(null);
  const [btConn, setBtConn]         = useState(null);
  const [orgName, setOrgName]       = useState("");
  const barcodeRef                  = useRef(null);

  // Client search
  const [clients, setClients]             = useState([]);
  const [clientSearch, setClientSearch]   = useState("");
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // Variant picker
  const [pickerProduct, setPickerProduct]     = useState(null);
  const [pickerVariants, setPickerVariants]   = useState([]);
  const [pickerLoading, setPickerLoading]     = useState(false);

  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  // Load all products on mount + org name + clients
  useEffect(() => {
    api.get("/api/inventory/products?page=0&size=200")
      .then(r => setProducts(r.data.content || []))
      .catch(() => {});
    api.get("/api/org").then(r => {
      if (r.data?.name) setOrgName(r.data.name);
    }).catch(() => {});
    api.get("/api/clients?page=0&size=200")
      .then(r => setClients(r.data.content || []))
      .catch(() => {});
  }, []);

  // Client autocomplete
  useEffect(() => {
    if (!clientSearch.trim() || selectedClient) { setClientSuggestions([]); return; }
    const q = clientSearch.toLowerCase();
    setClientSuggestions(
      clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      ).slice(0, 6)
    );
  }, [clientSearch, clients, selectedClient]);

  // Live search
  const [filtered, setFiltered] = useState([]);
  useEffect(() => {
    if (!search.trim()) { setFiltered([]); return; }
    const q = search.toLowerCase();
    setFiltered(products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 8));
  }, [search, products]);

  // Barcode scan (press Enter on text input)
  const handleBarcodeScan = async (e) => {
    if (e.key !== "Enter" || !barcode.trim()) return;
    try {
      const res = await api.get(`/api/inventory/products/barcode/${encodeURIComponent(barcode.trim())}`);
      addToCart(res.data);
      setBarcode("");
    } catch {
      notify("Product not found for barcode: " + barcode, "error");
      setBarcode("");
    }
  };

  // Camera barcode scan callback
  const handleCameraScan = async (code) => {
    setShowCameraScanner(false);
    try {
      const res = await api.get(`/api/inventory/products/barcode/${encodeURIComponent(code)}`);
      addToCart(res.data);
      notify(`${res.data.name} added to cart`, "success");
    } catch {
      notify("Product not found for barcode: " + code, "error");
    }
  };

  const resolvePrice = (retailPrice, wholesalePrice) => {
    if (selectedClient?.customerType === "WHOLESALE" && wholesalePrice) return wholesalePrice;
    return retailPrice;
  };

  const openVariantPicker = async (product) => {
    setPickerProduct(product);
    setPickerLoading(true);
    try {
      const res = await api.get(`/api/inventory/products/${product.id}/variants`);
      setPickerVariants(res.data || []);
    } catch {
      notify("Failed to load variants", "error");
      setPickerProduct(null);
    } finally { setPickerLoading(false); }
  };

  const addVariantToCart = (product, variant) => {
    if (variant.stockQty <= 0) { notify(`${variant.label || "Variant"} is out of stock`, "error"); return; }
    const cartKey = `${product.id}__${variant.id}`;
    const retailPrice = variant.sellingPrice ?? product.price;
    const wsPrice = variant.wholesalePrice ?? product.wholesalePrice ?? null;
    const price = resolvePrice(retailPrice, wsPrice);
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        if (existing.quantity >= variant.stockQty) { notify(`Only ${variant.stockQty} in stock`, "error"); return prev; }
        return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        cartKey, productId: product.id, variantId: variant.id,
        name: product.name, variantLabel: variant.label,
        sku: variant.sku || product.sku,
        price, retailPrice, wholesalePrice: wsPrice,
        unit: product.unit, maxQty: variant.stockQty, quantity: 1,
      }];
    });
    setPickerProduct(null);
    setSearch(""); setFiltered([]);
  };

  const addToCart = (product) => {
    if (product.hasVariants) { openVariantPicker(product); return; }
    if (product.quantityInStock <= 0) { notify(`${product.name} is out of stock`, "error"); return; }
    const isWholesaleClient = selectedClient?.customerType === "WHOLESALE";
    if (isWholesaleClient && product.wholesaleMinQty && product.wholesaleMinQty > 1) {
      notify(`Min order for wholesale is ${product.wholesaleMinQty} ${product.unit}(s) — adjust qty in cart`, "info");
    }
    const cartKey = product.id;
    const retailPrice = product.price;
    const wsPrice = product.wholesalePrice ?? null;
    const price = resolvePrice(retailPrice, wsPrice);
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) {
        if (existing.quantity >= product.quantityInStock) {
          notify(`Only ${product.quantityInStock} in stock`, "error");
          return prev;
        }
        return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        cartKey, productId: product.id, variantId: null,
        name: product.name, variantLabel: null,
        sku: product.sku,
        price, retailPrice, wholesalePrice: wsPrice,
        unit: product.unit, maxQty: product.quantityInStock, quantity: 1,
      }];
    });
    setSearch(""); setFiltered([]);
  };

  // Reprice cart when client changes
  useEffect(() => {
    const isWholesale = selectedClient?.customerType === "WHOLESALE";
    setCart(prev => prev.map(item => ({
      ...item,
      price: isWholesale && item.wholesalePrice ? item.wholesalePrice : item.retailPrice,
    })));
  }, [selectedClient]);

  const updateQty = (cartKey, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const newQty = Math.max(1, Math.min(i.quantity + delta, i.maxQty));
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (cartKey) => setCart(prev => prev.filter(i => i.cartKey !== cartKey));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmt);

  const clearSale = () => {
    setCart([]); setDiscount(""); setMethod("CASH");
    setCustName(""); setCustEmail(""); setNotes("");
    setSelectedClient(null); setClientSearch("");
  };

  const handlePrint = async (receipt) => {
    if (usbDevice) {
      try { await printReceiptUSB(usbDevice, receipt, orgName, currency, locale); notify("Printed to USB printer"); return; }
      catch { notify("USB print failed, using browser print", "info"); }
    }
    if (btConn) {
      try { await printReceiptBluetooth(btConn, receipt, orgName, currency, locale); notify("Printed to Bluetooth printer"); return; }
      catch { notify("Bluetooth print failed, using browser print", "info"); }
    }
    printReceiptBrowser(receipt, orgName, currency, locale);
  };

  const downloadReceipt = (receipt) => {
    const date = new Date(receipt.saleDate || Date.now()).toLocaleString("en-NG", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const rows = (receipt.items || []).map(i => `
      <tr>
        <td class="td">${i.productName}</td>
        <td class="td td-center">${i.quantity}</td>
        <td class="td td-right">${fmt(i.unitPrice)}</td>
        <td class="td td-right fw6">${fmt(i.subtotal)}</td>
      </tr>`).join("");
    const discountRow = receipt.discount && receipt.discount > 0 ? `
      <tr>
        <td colspan="3" class="td td-right" style="color:#b45309">Discount</td>
        <td class="td td-right" style="color:#b45309;font-weight:600">-${fmt(receipt.discount)}</td>
      </tr>` : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    @page { size: A5; margin: 12mm 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff;
           max-width: 540px; margin: 0 auto; }

    /* Header band */
    .header { background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #fff;
               padding: 20px 20px 18px; border-radius: 10px 10px 0 0; }
    .org-name { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .receipt-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
                     opacity: 0.75; margin-top: 2px; }
    .receipt-num { font-size: 12px; font-weight: 600; margin-top: 10px;
                   background: rgba(255,255,255,0.15); display: inline-block;
                   padding: 3px 10px; border-radius: 4px; }

    /* Meta info */
    .meta { padding: 12px 20px; background: #f8fafc; display: flex; flex-wrap: wrap; gap: 16px;
            border-left: 4px solid #2563eb; }
    .meta-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
                       color: #94a3b8; display: block; }
    .meta-item span { font-size: 13px; font-weight: 600; color: #1e293b; }

    /* Table */
    .table-wrap { padding: 0 20px; margin-top: 16px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 280px; }
    thead tr { background: #1e40af; color: #fff; }
    thead th { padding: 9px 8px; text-align: left; font-size: 11px;
               letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; }
    .td { padding: 9px 8px; border-bottom: 1px solid #f1f5f9; word-break: break-word; }
    .td-center { text-align: center; }
    .td-right { text-align: right; white-space: nowrap; }
    .fw6 { font-weight: 600; }

    /* Totals */
    .totals { padding: 0 20px; margin-top: 4px; }
    .total-row { display: flex; justify-content: space-between; align-items: center;
                 background: #eff6ff; border-radius: 8px; padding: 12px 16px; margin-top: 8px; }
    .total-row .label { font-size: 14px; font-weight: 700; color: #1e40af; }
    .total-row .amount { font-size: 18px; font-weight: 800; color: #1e40af; }

    /* Footer */
    .footer { margin: 18px 20px 16px; padding: 14px; border-top: 1px dashed #cbd5e1;
               text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.8; }
    .footer strong { color: #475569; }

    @media (max-width: 480px) {
      .org-name { font-size: 17px; }
      .meta { gap: 12px; }
      table { font-size: 12px; }
      .total-row .amount { font-size: 16px; }
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; max-width: 100%; }
      @page { margin: 8mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">${orgName || "Receipt"}</div>
    <div class="receipt-label">Official Receipt</div>
    <div class="receipt-num">${receipt.receiptNumber}</div>
  </div>

  <div class="meta">
    <div class="meta-item"><label>Date</label><span>${date}</span></div>
    <div class="meta-item"><label>Payment</label><span>${(receipt.paymentMethod || "").replace(/_/g, " ")}</span></div>
    ${receipt.customerName ? `<div class="meta-item"><label>Customer</label><span>${receipt.customerName}</span></div>` : ""}
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="totals">
    ${discountRow ? `<div style="display:flex;justify-content:space-between;padding:6px 10px;font-size:13px;color:#b45309"><span>Discount</span><span>-${fmt(receipt.discount)}</span></div>` : ""}
    <div class="total-row">
      <span class="label">TOTAL</span>
      <span class="amount">${fmt(receipt.total)}</span>
    </div>
  </div>

  <div class="footer">
    <strong>Thank you for your purchase!</strong><br/>
    Please keep this receipt for your records.<br/>
    Powered by LumiLedger
  </div>
</body>
</html>`;

    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) { alert("Please allow popups to download the receipt."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.focus();
        win.print(); // browser "Save as PDF" dialog
      }, 300);
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { notify("Add at least one item", "error"); return; }
    setProcessing(true);
    try {
      const res = await api.post("/api/inventory/sales", {
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId || null })),
        discount: discountAmt > 0 ? discountAmt : null,
        paymentMethod,
        clientId: selectedClient?.id || null,
        customerName: selectedClient ? null : (customerName || null),
        customerEmail: selectedClient ? null : (customerEmail || null),
        notes: notes || null,
      });
      setLastReceipt(res.data);
      clearSale();
      // Refresh stock
      api.get("/api/inventory/products?page=0&size=200")
        .then(r => setProducts(r.data.content || []));
    } catch (e) {
      notify(e.response?.data?.message || "Sale failed", "error");
    } finally { setProcessing(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Toast {...toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />

      {/* Barcode scanner banner */}
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-px shadow-lg shadow-blue-600/20">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-shrink-0">
            <span className="absolute inset-0 rounded-xl bg-blue-500/40 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm sm:text-base leading-snug">
              Scan products with your phone — no barcode gun needed.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 leading-relaxed">
              Tap <span className="text-blue-400 font-semibold">Scan</span> next to the barcode field, point your camera at any product, and it jumps straight into the cart.
            </p>
          </div>
          <button
            onClick={() => setShowCameraScanner(true)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow hover:scale-[1.03] transition-all whitespace-nowrap"
          >
            <Camera size={14} /> Try it now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT — Product search */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" /> Point of Sale
            </h1>
            <button onClick={() => setShowPrinterSetup(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                usbDevice || btConn
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
              }`}>
              <Printer className="w-3.5 h-3.5" />
              {usbDevice ? "USB Printer" : btConn ? "BT Printer" : "Setup Printer"}
            </button>
          </div>

          {/* Barcode scanner input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={barcodeRef}
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={handleBarcodeScan}
                placeholder="Scan barcode and press Enter…"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCameraScanner(true)}
              title="Scan with phone camera"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:scale-[1.03] transition-all flex-shrink-0"
            >
              <Camera size={15} />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>

          {/* Product search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name or SKU…"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {filtered.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                {filtered.map(p => {
                  const isWholesale = selectedClient?.customerType === "WHOLESALE";
                  const displayPrice = isWholesale && p.wholesalePrice ? p.wholesalePrice : p.price;
                  return (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition text-left">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                          {p.name}
                          {p.hasVariants && <Layers className="w-3 h-3 text-violet-500" />}
                        </p>
                        <p className="text-xs text-slate-400">{p.sku || "No SKU"} · {p.hasVariants ? "Has variants" : `${p.quantityInStock} ${p.unit} left`}</p>
                      </div>
                      <p className="text-sm font-bold text-blue-600 ml-4 flex-shrink-0">{fmt(displayPrice)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick product grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {products.slice(0, 30).map(p => {
              const isWholesale = selectedClient?.customerType === "WHOLESALE";
              const displayPrice = isWholesale && p.wholesalePrice ? p.wholesalePrice : p.price;
              const outOfStock = !p.hasVariants && p.quantityInStock <= 0;
              return (
                <button key={p.id} onClick={() => addToCart(p)}
                  disabled={outOfStock}
                  className={`text-left rounded-xl border transition overflow-hidden ${
                    outOfStock
                      ? "opacity-40 cursor-not-allowed border-slate-100"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-sm bg-white dark:bg-slate-800"
                  }`}>
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt="" className="w-full h-24 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate flex items-center gap-1">
                      {p.name}
                      {p.hasVariants && <Layers className="w-3 h-3 text-violet-500 flex-shrink-0" />}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.hasVariants ? "Select variant" : (outOfStock ? "Out of stock" : `${p.quantityInStock} ${p.unit}`)}
                    </p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{fmt(displayPrice)}</p>
                    {isWholesale && p.wholesaleMinQty > 1 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5">MOQ: {p.wholesaleMinQty}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Cart & checkout */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-800 dark:text-white">Cart</h2>
              {cart.length > 0 && (
                <button onClick={clearSale} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Clear</button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700 max-h-64">
              {cart.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm">No items yet</p>
              ) : (
                cart.map(item => (
                  <div key={item.cartKey} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                          <Layers className="w-3 h-3" />{item.variantLabel}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">{fmt(item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateQty(item.cartKey, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 transition">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-slate-800 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.cartKey, 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 transition">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white w-20 text-right">
                      {fmt(item.price * item.quantity)}
                    </p>
                    <button onClick={() => removeFromCart(item.cartKey)}
                      className="text-slate-300 hover:text-rose-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 flex-1">Discount ({currencySymbol})</span>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                  placeholder="0" min="0" className="w-24 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm bg-white dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-100 dark:border-slate-700">
                <span className="text-slate-800 dark:text-white">Total</span>
                <span className="text-blue-600">{fmt(total)}</span>
              </div>
            </div>

            {/* Customer info */}
            <div className="px-4 pb-3 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer (optional)</p>

              {/* Client picker */}
              {selectedClient ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
                  <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-700 dark:text-blue-300 truncate flex items-center gap-1.5">
                      {selectedClient.name}
                      {selectedClient.customerType === "WHOLESALE" && (
                        <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200">WS</span>
                      )}
                    </p>
                    {selectedClient.email && <p className="text-xs text-blue-500 truncate">{selectedClient.email}</p>}
                  </div>
                  <button onClick={() => { setSelectedClient(null); setClientSearch(""); }}
                    className="text-blue-400 hover:text-rose-500 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search existing client…"
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white" />
                  {clientSuggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                      {clientSuggestions.map(c => (
                        <button key={c.id} onMouseDown={() => { setSelectedClient(c); setClientSearch(""); }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-sm transition">
                          <p className="font-medium text-slate-800 dark:text-white">{c.name}</p>
                          {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Free-text fields — only shown when no client selected */}
              {!selectedClient && (
                <>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input value={customerName} onChange={e => setCustName(e.target.value)}
                      placeholder="Or type customer name" className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input value={customerEmail} onChange={e => setCustEmail(e.target.value)}
                      placeholder="Email for receipt (optional)" type="email"
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white" />
                  </div>
                </>
              )}
            </div>

            {/* Payment method */}
            <div className="px-4 pb-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === m
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400"
                    }`}>
                    {m.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 pt-2">
              <button onClick={handleCheckout} disabled={processing || cart.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm">
                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {processing ? "Processing…" : `Charge ${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printer Setup Modal */}
      {showPrinterSetup && (
        <PrinterSetupModal
          orgName={orgName}
          onClose={() => setShowPrinterSetup(false)}
        />
      )}

      {/* Receipt modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sale Complete!</h2>
            <p className="text-slate-500 text-sm mb-4">Receipt #{lastReceipt.receiptNumber}</p>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 text-left space-y-2 mb-5 text-sm">
              {lastReceipt.items?.map(i => (
                <div key={i.id} className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{i.quantity}× {i.productName}</span>
                  <span>{fmt(i.subtotal)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Total</span><span className="text-blue-600">{fmt(lastReceipt.total)}</span>
              </div>
              {(lastReceipt.clientName || lastReceipt.customerName) && (
                <p className="text-xs text-slate-500 pt-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> {lastReceipt.clientName || lastReceipt.customerName}
                </p>
              )}
              {lastReceipt.customerEmail && (
                <p className="text-xs text-emerald-600 pt-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Receipt sent to {lastReceipt.customerEmail}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={() => handlePrint(lastReceipt)}
                className="py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition flex items-center justify-center gap-1.5">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => downloadReceipt(lastReceipt)}
                className="py-2.5 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-200 transition flex items-center justify-center gap-1.5">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
            <button onClick={() => setLastReceipt(null)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
              New Sale
            </button>
          </div>
        </div>
      )}

      {showCameraScanner && (
        <BarcodeScanner
          onDetected={handleCameraScan}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* Variant Picker Modal */}
      {pickerProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {pickerProduct.imageUrl && (
                  <img src={pickerProduct.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-100 dark:border-slate-700" />
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-600" /> {pickerProduct.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select a variant to add</p>
                </div>
              </div>
              <button onClick={() => setPickerProduct(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              {pickerLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">Loading variants…</div>
              ) : pickerVariants.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No variants found</div>
              ) : (
                <div className="space-y-2">
                  {pickerVariants.map(v => {
                    const isWholesale = selectedClient?.customerType === "WHOLESALE";
                    const displayPrice = isWholesale && v.wholesalePrice
                      ? v.wholesalePrice
                      : (v.sellingPrice ?? pickerProduct.price);
                    const outOfStock = v.stockQty <= 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => addVariantToCart(pickerProduct, v)}
                        disabled={outOfStock}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition text-left ${
                          outOfStock
                            ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50"
                            : "border-slate-200 dark:border-slate-600 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white text-sm">{v.label || v.sku || "Variant"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {outOfStock ? "Out of stock" : `${v.stockQty} in stock`}
                          </p>
                          {isWholesale && v.wholesalePrice && (
                            <p className="text-[10px] text-violet-600 mt-0.5">Wholesale price</p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-blue-600 ml-4 flex-shrink-0">{fmt(displayPrice)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
