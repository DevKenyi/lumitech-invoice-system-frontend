/**
 * ThermalPrint — ESC/POS thermal printer support for LumiLedger POS
 * Supports: Browser Print (CSS 80mm), WebUSB (ESC/POS), Web Bluetooth (ESC/POS)
 */

// ── Browser / CSS Print (works with ANY printer set as default) ─────────────

export function printReceiptBrowser(receipt, orgName, currency = "NGN", locale = "en-NG") {
  const html = buildReceiptHtml(receipt, orgName, currency, locale);
  const win = window.open("", "_blank", "width=380,height=750,scrollbars=no");
  if (!win) {
    alert("Please allow popups for this site to print receipts.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.addEventListener("load", () => {
    setTimeout(() => {
      win.focus();
      win.print();
    }, 300);
  });
}

function buildReceiptHtml(receipt, orgName, currency = "NGN", locale = "en-NG") {
  const fmt = (v) =>
    new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 }).format(v || 0);
  const date = new Date(receipt.saleDate || Date.now()).toLocaleString(locale, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const rows = (receipt.items || [])
    .map(
      (i) => `
    <tr>
      <td>${i.productName}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">${fmt(i.unitPrice)}</td>
      <td style="text-align:right;font-weight:600">${fmt(i.subtotal)}</td>
    </tr>`
    )
    .join("");

  const discountRow =
    receipt.discount && receipt.discount > 0
      ? `<tr style="color:#b45309"><td colspan="3" style="text-align:right">Discount</td><td style="text-align:right">-${fmt(receipt.discount)}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm 3mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; width: 74mm; }
    .center { text-align: center; }
    .org { font-size: 15px; font-weight: bold; text-align: center; margin-bottom: 2px; letter-spacing: 1px; }
    .title { font-size: 10px; text-align: center; color: #555; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 6px 0; }
    .meta { width: 100%; margin-bottom: 6px; }
    .meta td { padding: 1px 0; font-size: 10px; }
    .meta td:last-child { text-align: right; font-weight: 600; }
    table.items { width: 100%; border-collapse: collapse; margin: 4px 0; }
    table.items thead tr { border-top: 1px solid #000; border-bottom: 1px solid #000; }
    table.items th { font-size: 9px; padding: 3px 2px; text-transform: uppercase; }
    table.items td { font-size: 10px; padding: 3px 2px; vertical-align: top; }
    .total-row td { font-size: 13px; font-weight: bold; padding: 5px 2px; border-top: 1px solid #000; }
    .footer { text-align: center; font-size: 9px; color: #555; margin-top: 10px; line-height: 1.6; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="org">${orgName}</div>
  <div class="title">Receipt</div>
  <hr class="divider"/>
  <table class="meta">
    <tr><td>Receipt #</td><td>${receipt.receiptNumber}</td></tr>
    <tr><td>Date</td><td>${date}</td></tr>
    <tr><td>Payment</td><td>${(receipt.paymentMethod || "").replace("_", " ")}</td></tr>
    ${receipt.customerName ? `<tr><td>Customer</td><td>${receipt.customerName}</td></tr>` : ""}
  </table>
  <hr class="divider"/>
  <table class="items">
    <thead>
      <tr>
        <th style="text-align:left">Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      ${discountRow}
      <tr class="total-row">
        <td colspan="3" style="text-align:right">TOTAL</td>
        <td style="text-align:right">${fmt(receipt.total)}</td>
      </tr>
    </tfoot>
  </table>
  <hr class="divider"/>
  <div class="footer">
    Thank you for your purchase!<br/>
    Please keep this receipt for your records.<br/>
    Powered by LumiLedger
  </div>
</body>
</html>`;
}

// ── WebUSB ESC/POS (Chrome / Edge only) ────────────────────────────────────

export const isWebUSBSupported = () => typeof navigator !== "undefined" && "usb" in navigator;
export const isWebBluetoothSupported = () => typeof navigator !== "undefined" && "bluetooth" in navigator;

/** Returns previously-authorised USB devices — no browser picker shown */
export async function getAuthorizedUSBPrinters() {
  if (!isWebUSBSupported()) return [];
  try { return await navigator.usb.getDevices(); } catch { return []; }
}

/** Shows the browser picker to authorise a brand-new USB device */
export async function connectUSBPrinter() {
  if (!isWebUSBSupported()) throw new Error("WebUSB not supported. Use Chrome or Edge.");
  return await navigator.usb.requestDevice({ filters: [] });
}

export async function printReceiptUSB(device, receipt, orgName, currency = "NGN", locale = "en-NG") {
  const data = buildEscPos(receipt, orgName, currency, locale);
  try {
    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    const iface = device.configuration.interfaces.find(
      (i) => i.alternates[0]?.interfaceClass === 7 || i.alternates.length > 0
    ) || device.configuration.interfaces[0];

    await device.claimInterface(iface.interfaceNumber);

    const endpoint = iface.alternates[0]?.endpoints.find((e) => e.direction === "out");
    if (!endpoint) throw new Error("No output endpoint found on printer.");

    await device.transferOut(endpoint.endpointNumber, data);
    await device.releaseInterface(iface.interfaceNumber);
  } finally {
    try { await device.close(); } catch (_) {}
  }
}

// ── Web Bluetooth ESC/POS ──────────────────────────────────────────────────
// Works with BLE thermal printers (most cheap Chinese BT receipt printers)

const BT_SERVICE_UUID    = "000018f0-0000-1000-8000-00805f9b34fb"; // Common BLE printer service
const BT_CHAR_UUID       = "00002af1-0000-1000-8000-00805f9b34fb"; // Common BLE printer characteristic
const BT_SPP_SERVICE     = "00001101-0000-1000-8000-00805f9b34fb"; // Classic BT SPP
const GENERIC_SERVICE    = 0x18f0;

/** Returns previously-paired BT devices — no browser picker shown */
export async function getAuthorizedBTPrinters() {
  if (!isWebBluetoothSupported()) return [];
  try { return await navigator.bluetooth.getDevices(); } catch { return []; }
}

/** Connect to an already-known BT device without showing the picker */
export async function reconnectBluetoothPrinter(device) {
  const server = await device.gatt.connect();
  let service;
  try {
    service = await server.getPrimaryService(BT_SERVICE_UUID);
  } catch {
    const services = await server.getPrimaryServices();
    service = services[0];
  }
  const characteristic = await service.getCharacteristic(BT_CHAR_UUID);
  return { device, server, characteristic };
}

/** Shows the browser picker to pair a brand-new BT device */
export async function connectBluetoothPrinter() {
  if (!isWebBluetoothSupported()) throw new Error("Web Bluetooth not supported. Use Chrome or Edge.");
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [GENERIC_SERVICE] }],
    optionalServices: [BT_SERVICE_UUID, "battery_service"],
  });
  return reconnectBluetoothPrinter(device);
}

export async function printReceiptBluetooth(connection, receipt, orgName, currency = "NGN", locale = "en-NG") {
  const data = buildEscPos(receipt, orgName, currency, locale);
  const CHUNK = 512;
  for (let i = 0; i < data.length; i += CHUNK) {
    await connection.characteristic.writeValueWithoutResponse(data.slice(i, i + CHUNK));
    await new Promise((r) => setTimeout(r, 80));
  }
}

// ── ESC/POS command builder ────────────────────────────────────────────────

function buildEscPos(receipt, orgName, currency = "NGN", locale = "en-NG") {
  const fmtShort = makeFmtShort(
    (() => { try { return (0).toLocaleString(locale, { style: "currency", currency, minimumFractionDigits: 0 }).replace(/[\d.,\s]/g, "").trim() || currency; } catch { return currency; } })()
  );
  const enc = new TextEncoder();
  const ESC = 0x1b, GS = 0x1d, LF = 0x0a;
  const buf = [];

  const push = (...bytes) => bytes.forEach((b) => buf.push(b));
  const text = (str) => enc.encode(str).forEach((b) => buf.push(b));
  const nl   = (n = 1) => { for (let i = 0; i < n; i++) push(LF); };
  const hr   = () => { text("--------------------------------"); nl(); };

  // Initialize
  push(ESC, 0x40);

  // Org name — center, double size, bold
  push(ESC, 0x61, 0x01);          // center
  push(GS,  0x21, 0x11);          // double width+height
  push(ESC, 0x45, 0x01);          // bold
  text(orgName.substring(0, 16).toUpperCase());
  nl();
  push(GS,  0x21, 0x00);          // normal size
  push(ESC, 0x45, 0x00);          // bold off
  text("RECEIPT");
  nl();

  push(ESC, 0x61, 0x00);          // left
  hr();

  const d = new Date(receipt.saleDate || Date.now());
  const dateStr = d.toLocaleDateString(locale) + " " +
    d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  text("Receipt#: " + receipt.receiptNumber); nl();
  text("Date    : " + dateStr); nl();
  text("Payment : " + (receipt.paymentMethod || "").replace("_", " ")); nl();
  if (receipt.customerName) { text("Customer: " + receipt.customerName); nl(); }

  hr();

  // Column header
  push(ESC, 0x45, 0x01);
  text("ITEM             QTY  PRICE    TOTAL"); nl();
  push(ESC, 0x45, 0x00);
  hr();

  // Items
  (receipt.items || []).forEach((item) => {
    const name  = (item.productName || "").substring(0, 16).padEnd(16);
    const qty   = String(item.quantity).padStart(3);
    const price = fmtShort(item.unitPrice).padStart(8);
    const sub   = fmtShort(item.subtotal).padStart(8);
    text(name + qty + price + sub); nl();
  });

  hr();

  // Discount
  if (receipt.discount && receipt.discount > 0) {
    push(ESC, 0x61, 0x02);
    text("Discount: -" + fmtShort(receipt.discount)); nl();
    push(ESC, 0x61, 0x00);
  }

  // Total
  push(ESC, 0x61, 0x02);          // right align
  push(GS,  0x21, 0x01);          // double height
  push(ESC, 0x45, 0x01);          // bold
  text("TOTAL: " + fmtShort(receipt.total)); nl(2);
  push(GS,  0x21, 0x00);
  push(ESC, 0x45, 0x00);

  // Footer
  push(ESC, 0x61, 0x01);          // center
  text("Thank you for your purchase!"); nl();
  text("Powered by LumiLedger"); nl(4);

  // Cut
  push(GS, 0x56, 0x00);

  return new Uint8Array(buf);
}

function makeFmtShort(sym) {
  return (val) => {
    if (val == null) return sym + "0";
    const n = Number(val);
    if (n >= 1_000_000) return sym + (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000)     return sym + (n / 1_000).toFixed(1) + "k";
    return sym + Math.round(n);
  };
}
