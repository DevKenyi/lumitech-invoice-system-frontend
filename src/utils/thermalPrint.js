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

// ── Food Order Print — Browser (HTML) ────────────────────────────────────────

export function printFoodOrderBrowser(order, orgName, currency = "") {
  const hasMixed = (order.items || []).some(i => i.toGo);
  const fmtAmt = (v) => currency + new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);

  const customerItems = (order.items || []).map(i => {
    const toGoTag = i.toGo ? `<span style="font-size:9px;border:1px solid #000;padding:1px 3px;margin-left:4px;font-weight:bold">TO GO</span>` : "";
    const modLine = i.modifiers?.length
      ? `<br><small style="color:#666">${i.modifiers.map(m => m.qty > 1 ? `${m.name} x${m.qty}` : m.name).join(", ")}</small>`
      : "";
    return `<tr>
      <td style="padding:2px 4px">${i.qty}x ${i.name}${toGoTag}${modLine}</td>
      <td style="padding:2px 4px;text-align:right">${fmtAmt(i.subtotal)}</td>
    </tr>`;
  }).join("");

  const kitchenItems = (order.items || []).map(i => {
    const badge = hasMixed
      ? i.toGo
        ? `<span style="font-size:10px;border:2px solid #000;padding:1px 5px;margin-left:5px;font-weight:bold">PACK</span>`
        : `<span style="font-size:10px;border:1px solid #999;padding:1px 5px;margin-left:5px">SERVE</span>`
      : "";
    const modLine = i.modifiers?.length
      ? ` (${i.modifiers.map(m => m.qty > 1 ? `${m.name} x${m.qty}` : m.name).join(", ")})`
      : "";
    return `<div style="font-size:14px;margin:4px 0"><strong>${i.qty}x</strong> ${i.name}${badge}${modLine}</div>`;
  }).join("");

  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) { alert("Please allow popups to print receipts."); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>Food Order</title>
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
    <div class="page">
      <h2>${orgName}</h2>
      <div class="center" style="font-size:11px">Order Receipt</div>
      <div class="divider"></div>
      <div class="center"><span class="badge">${order.orderType === "DINE_IN" ? "DINE IN" : "TAKEAWAY"}</span></div>
      ${order.standNumber ? `<div class="big">Table ${order.standNumber}</div><div class="center" style="font-size:11px;margin-bottom:6px">Place this on your table</div>` : `<div class="big" style="font-size:20px">${order.orderNumber}</div><div class="center" style="font-size:11px;margin-bottom:6px">Quote this ref when collecting</div>`}
      <div class="divider"></div>
      <div style="font-size:11px;margin-bottom:4px">Order: <strong>${order.orderNumber}</strong></div>
      <div style="font-size:11px;margin-bottom:4px">Payment: <strong>${(order.paymentMethod || "").replace("_", " ")}</strong></div>
      <div class="divider"></div>
      <table>${customerItems}</table>
      <div class="divider"></div>
      <table>
        ${order.convenienceFee && Number(order.convenienceFee) > 0 ? `
        <tr><td style="font-size:11px;color:#555">Subtotal</td><td style="text-align:right;font-size:11px;color:#555">${fmtAmt(Number(order.total) - Number(order.convenienceFee))}</td></tr>
        <tr><td style="font-size:11px;color:#555">Convenience fee (5%)</td><td style="text-align:right;font-size:11px;color:#555">${fmtAmt(order.convenienceFee)}</td></tr>
        ` : ""}
        <tr class="total"><td>TOTAL</td><td style="text-align:right">${fmtAmt(order.total)}</td></tr>
      </table>
      <div class="divider"></div>
      <div class="center" style="font-size:11px">Thank you! Enjoy your meal.</div>
    </div>
    <div class="page">
      <div class="center" style="font-size:11px;font-weight:bold">— KITCHEN TICKET —</div>
      <div class="big" style="${!order.standNumber ? "font-size:20px" : ""}">${order.standNumber ? "Table " + order.standNumber : order.orderNumber}</div>
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

// ── Food Order Print — ESC/POS (USB + Bluetooth) ─────────────────────────────

export async function printFoodOrderUSB(device, order, orgName, currency = "") {
  const data = buildFoodEscPos(order, orgName, currency);
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

export async function printFoodOrderBluetooth(connection, order, orgName, currency = "") {
  const data = buildFoodEscPos(order, orgName, currency);
  const CHUNK = 512;
  for (let i = 0; i < data.length; i += CHUNK) {
    await connection.characteristic.writeValueWithoutResponse(data.slice(i, i + CHUNK));
    await new Promise((r) => setTimeout(r, 80));
  }
}

function buildFoodEscPos(order, orgName, currency = "") {
  const enc = new TextEncoder();
  const ESC = 0x1b, GS = 0x1d, LF = 0x0a;
  const buf = [];
  const push = (...bytes) => bytes.forEach((b) => buf.push(b));
  const text = (str) => enc.encode(str.replace(/[^\x00-\x7F]/g, "?")).forEach((b) => buf.push(b));
  const nl   = (n = 1) => { for (let i = 0; i < n; i++) push(LF); };
  const hr   = () => { text("--------------------------------"); nl(); };
  const cut  = () => { push(GS, 0x56, 0x00); };

  const fmtShort = (v) => {
    const n = Number(v ?? 0);
    if (n >= 1_000_000) return currency + (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000)     return currency + (n / 1_000).toFixed(1) + "k";
    return currency + Math.round(n);
  };

  const hasMixed = (order.items || []).some(i => i.toGo);
  const isDineIn = order.orderType === "DINE_IN";

  // ── CUSTOMER RECEIPT ──────────────────────────────────────────────────────
  push(ESC, 0x40); // init

  // Org name
  push(ESC, 0x61, 0x01); push(GS, 0x21, 0x11); push(ESC, 0x45, 0x01);
  text(orgName.substring(0, 16).toUpperCase()); nl();
  push(GS, 0x21, 0x00); push(ESC, 0x45, 0x00);
  text("ORDER RECEIPT"); nl();
  push(ESC, 0x61, 0x00); hr();

  // Table number (dine-in) or order ref (go-to) — prominently
  push(ESC, 0x61, 0x01); push(GS, 0x21, 0x22); push(ESC, 0x45, 0x01);
  if (isDineIn && order.standNumber) {
    text("TABLE " + order.standNumber); nl();
  } else {
    text(order.orderNumber); nl();
  }
  push(GS, 0x21, 0x00); push(ESC, 0x45, 0x00);
  push(ESC, 0x61, 0x00);

  text("Order  : " + order.orderNumber); nl();
  text("Type   : " + (isDineIn ? "Dine In" : "Takeaway")); nl();
  text("Payment: " + (order.paymentMethod || "").replace("_", " ")); nl();
  hr();

  // Items
  (order.items || []).forEach(item => {
    const name = (item.name || "").substring(0, 20).padEnd(20);
    const amt  = fmtShort(item.subtotal).padStart(11);
    push(ESC, 0x45, 0x01);
    text(`${item.qty}x ${name.trim()}`); push(ESC, 0x45, 0x00);
    text("  " + fmtShort(item.subtotal)); nl();
    if (item.toGo) { text("   [TO GO]"); nl(); }
    (item.modifiers || []).forEach(m => {
      const modLabel = m.qty > 1 ? `${m.name} x${m.qty}` : m.name;
      text("   + " + modLabel.substring(0, 26)); nl();
    });
  });

  hr();

  // Fee breakdown
  if (order.convenienceFee && Number(order.convenienceFee) > 0) {
    const subtotalAmt = Number(order.total) - Number(order.convenienceFee);
    text("Subtotal       : " + fmtShort(subtotalAmt)); nl();
    text("Convenience(5%): " + fmtShort(order.convenienceFee)); nl();
    hr();
  }

  // Total
  push(ESC, 0x61, 0x02); push(GS, 0x21, 0x01); push(ESC, 0x45, 0x01);
  text("TOTAL: " + fmtShort(order.total)); nl(2);
  push(GS, 0x21, 0x00); push(ESC, 0x45, 0x00);

  push(ESC, 0x61, 0x01);
  text("Thank you! Enjoy your meal."); nl();
  text("Powered by LumiLedger"); nl(4);
  cut();

  // ── KITCHEN TICKET ────────────────────────────────────────────────────────
  push(ESC, 0x40); // init

  push(ESC, 0x61, 0x01); push(ESC, 0x45, 0x01);
  text("-- KITCHEN TICKET --"); nl();
  push(ESC, 0x45, 0x00);

  // Table number (dine-in) or order ref (go-to) — big
  push(GS, 0x21, 0x22); push(ESC, 0x45, 0x01);
  text(isDineIn && order.standNumber ? "TABLE " + order.standNumber : order.orderNumber); nl();
  push(GS, 0x21, 0x00); push(ESC, 0x45, 0x00);

  push(ESC, 0x61, 0x00);
  text(order.orderNumber + " - " + (isDineIn ? "Dine In" : "Takeaway")); nl();
  hr();

  (order.items || []).forEach(item => {
    push(ESC, 0x45, 0x01);
    text(`${item.qty}x ${(item.name || "").substring(0, 22)}`);
    push(ESC, 0x45, 0x00);
    if (hasMixed) { text(item.toGo ? " [PACK]" : " [SERVE]"); }
    nl();
    (item.modifiers || []).forEach(m => {
      const modLabel = m.qty > 1 ? `${m.name} x${m.qty}` : m.name;
      text("   + " + modLabel.substring(0, 26)); nl();
    });
  });

  if (order.notes) { hr(); text("Note: " + order.notes.substring(0, 50)); nl(); }

  nl(4); cut();

  return new Uint8Array(buf);
}
