package com.lumitechsystems.lumiledger;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Talks to a USB ESC/POS thermal printer via Android's native UsbManager.
 * Unlike WebUSB in a browser tab: permission grants survive unplug/replug and
 * app restarts (no re-pairing gesture needed), and a real disconnect is
 * delivered as an OS broadcast instead of only being discovered the next time
 * a print is attempted.
 */
@CapacitorPlugin(name = "UsbPrinter")
public class UsbPrinterPlugin extends Plugin {

    private static final String ACTION_USB_PERMISSION = "com.lumitechsystems.lumiledger.USB_PERMISSION";

    private UsbManager usbManager;
    private BroadcastReceiver receiver;
    private PluginCall pendingPermissionCall;

    @Override
    public void load() {
        usbManager = (UsbManager) getContext().getSystemService(Context.USB_SERVICE);

        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);

                if (ACTION_USB_PERMISSION.equals(action)) {
                    boolean granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
                    if (pendingPermissionCall != null) {
                        JSObject result = new JSObject();
                        result.put("granted", granted);
                        if (device != null) {
                            result.put("vendorId", device.getVendorId());
                            result.put("productId", device.getProductId());
                        }
                        pendingPermissionCall.resolve(result);
                        pendingPermissionCall = null;
                    }
                } else if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                    notifyListeners("usbAttached", deviceToJson(device));
                } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                    notifyListeners("usbDetached", deviceToJson(device));
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_USB_PERMISSION);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, filter);
        }

        getContext().startForegroundService(new Intent(getContext(), PrinterForegroundService.class));
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            try { getContext().unregisterReceiver(receiver); } catch (IllegalArgumentException ignored) {}
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void listDevices(PluginCall call) {
        JSArray devices = new JSArray();
        for (UsbDevice device : usbManager.getDeviceList().values()) {
            devices.put(deviceToJson(device));
        }
        JSObject result = new JSObject();
        result.put("devices", devices);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        UsbDevice target = findDevice(call.getInt("vendorId"), call.getInt("productId"));
        if (target == null) {
            call.reject("No matching USB device connected");
            return;
        }
        if (usbManager.hasPermission(target)) {
            JSObject result = new JSObject();
            result.put("granted", true);
            result.put("vendorId", target.getVendorId());
            result.put("productId", target.getProductId());
            call.resolve(result);
            return;
        }
        pendingPermissionCall = call;
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent pi = PendingIntent.getBroadcast(getContext(), 0, new Intent(ACTION_USB_PERMISSION), flags);
        usbManager.requestPermission(target, pi);
    }

    @PluginMethod
    public void print(PluginCall call) {
        String base64Data = call.getString("data");
        if (base64Data == null) {
            call.reject("Missing 'data'");
            return;
        }

        UsbDevice device = findDevice(call.getInt("vendorId"), call.getInt("productId"));
        if (device == null) {
            call.reject("Printer not connected");
            return;
        }
        if (!usbManager.hasPermission(device)) {
            call.reject("No permission for this USB device — call requestPermission first");
            return;
        }

        UsbInterface usbInterface = findPrintableInterface(device);
        UsbEndpoint outEndpoint = usbInterface != null ? findOutEndpoint(usbInterface) : null;
        if (usbInterface == null || outEndpoint == null) {
            call.reject("No usable OUT endpoint on this device");
            return;
        }

        UsbDeviceConnection connection = usbManager.openDevice(device);
        if (connection == null) {
            call.reject("Could not open USB device");
            return;
        }

        try {
            if (!connection.claimInterface(usbInterface, true)) {
                call.reject("Could not claim USB interface");
                return;
            }
            byte[] data = Base64.decode(base64Data, Base64.DEFAULT);
            int chunkSize = 4096;
            for (int offset = 0; offset < data.length; offset += chunkSize) {
                int len = Math.min(chunkSize, data.length - offset);
                byte[] chunk = new byte[len];
                System.arraycopy(data, offset, chunk, 0, len);
                int sent = connection.bulkTransfer(outEndpoint, chunk, len, 5000);
                if (sent < 0) {
                    call.reject("USB transfer failed at offset " + offset);
                    return;
                }
            }
            connection.releaseInterface(usbInterface);
            call.resolve();
        } finally {
            connection.close();
        }
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        UsbDevice device = findDevice(call.getInt("vendorId"), call.getInt("productId"));
        JSObject result = new JSObject();
        result.put("connected", device != null);
        result.put("hasPermission", device != null && usbManager.hasPermission(device));
        call.resolve(result);
    }

    /** With no vendorId/productId given, just grabs whatever single USB device is connected —
     *  fine for a single-printer restaurant setup. */
    private UsbDevice findDevice(Integer vendorId, Integer productId) {
        for (UsbDevice device : usbManager.getDeviceList().values()) {
            if (vendorId != null && productId != null) {
                if (device.getVendorId() == vendorId && device.getProductId() == productId) return device;
            } else {
                return device;
            }
        }
        return null;
    }

    private UsbInterface findPrintableInterface(UsbDevice device) {
        for (int i = 0; i < device.getInterfaceCount(); i++) {
            UsbInterface iface = device.getInterface(i);
            if (iface.getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER || findOutEndpoint(iface) != null) {
                return iface;
            }
        }
        return device.getInterfaceCount() > 0 ? device.getInterface(0) : null;
    }

    private UsbEndpoint findOutEndpoint(UsbInterface iface) {
        for (int i = 0; i < iface.getEndpointCount(); i++) {
            UsbEndpoint ep = iface.getEndpoint(i);
            if (ep.getDirection() == UsbConstants.USB_DIR_OUT) return ep;
        }
        return null;
    }

    private JSObject deviceToJson(UsbDevice device) {
        JSObject json = new JSObject();
        if (device == null) return json;
        json.put("vendorId", device.getVendorId());
        json.put("productId", device.getProductId());
        json.put("deviceName", device.getDeviceName());
        json.put("productName", device.getProductName() != null ? device.getProductName() : "USB Printer");
        return json;
    }
}
