import api from "./api";

// VAPID keys are base64url; pushManager.subscribe needs a raw Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isSubscribed() {
  return localStorage.getItem("pushSubscribed") === "true";
}

export async function subscribeToPush() {
  if (!pushSupported()) throw new Error("Push notifications aren't supported on this device/browser.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.ready;

  const { data } = await api.get("/api/push/vapid-public-key");
  if (!data.publicKey) throw new Error("Push isn't configured on the server yet.");

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
  }

  const json = subscription.toJSON();
  await api.post("/api/push/subscribe", {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });

  localStorage.setItem("pushSubscribed", "true");
  return subscription;
}

export async function unsubscribeFromPush() {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await api.delete("/api/push/subscribe", { data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
  }
  localStorage.removeItem("pushSubscribed");
}
