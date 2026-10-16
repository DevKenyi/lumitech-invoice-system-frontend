// nativeUsbPrinter — JS bridge to the native UsbPrinter Capacitor plugin (Android
// only, android/app/src/main/java/.../UsbPrinterPlugin.java). Talks to Android's
// UsbManager directly instead of WebUSB: permission grants survive unplug/replug
// and app restarts, and disconnects are delivered as a real OS broadcast.
// No-ops safely everywhere else (web, iOS) via isNativeAndroid().
import { registerPlugin, Capacitor } from "@capacitor/core";

const UsbPrinter = registerPlugin("UsbPrinter");

export const isNativeAndroid = () => Capacitor.getPlatform() === "android";

export async function nativeListUsbDevices() {
  const { devices } = await UsbPrinter.listDevices();
  return devices || [];
}

export async function nativeRequestUsbPermission(device = {}) {
  return UsbPrinter.requestPermission({ vendorId: device.vendorId, productId: device.productId });
}

export async function nativeUsbIsConnected(device = {}) {
  return UsbPrinter.isConnected({ vendorId: device.vendorId, productId: device.productId });
}

export async function nativeUsbPrint(bytes, device = {}) {
  await UsbPrinter.print({ vendorId: device.vendorId, productId: device.productId, data: uint8ToBase64(bytes) });
}

/** Prints, and if the OS hasn't granted USB permission yet, prompts for it
 *  (the native Android permission dialog) and retries once. */
export async function nativeUsbPrintEnsuringPermission(bytes, device = {}) {
  try {
    await nativeUsbPrint(bytes, device);
  } catch (_) {
    const perm = await nativeRequestUsbPermission(device);
    if (!perm?.granted) throw new Error("USB printer permission was not granted");
    await nativeUsbPrint(bytes, device);
  }
}

/** Fires onAttach(device) whenever a USB device is plugged in. Returns an unsubscribe function. */
export function watchNativeUsbAttach(onAttach) {
  const handle = UsbPrinter.addListener("usbAttached", onAttach);
  return () => handle.remove();
}

/** Fires onDetach(device) whenever a USB device is unplugged. Returns an unsubscribe function. */
export function watchNativeUsbDetach(onDetach) {
  const handle = UsbPrinter.addListener("usbDetached", onDetach);
  return () => handle.remove();
}

function uint8ToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
