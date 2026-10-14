import { useEffect, useState } from "react";

/**
 * Tracks navigator.onLine for UX purposes only (banners, button state).
 * navigator.onLine only reflects network interface status, not whether the
 * backend is actually reachable — never use this as the sole gate before
 * attempting a request; the real signal is whether the request itself fails.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
