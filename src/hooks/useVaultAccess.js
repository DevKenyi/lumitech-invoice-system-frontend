import { useEffect, useState } from "react";
import api from "../services/api";

// Shared across every page behind the personal Vault's PIN lock (Vault, LumiFlow, ...) — unlocking
// once in a tab unlocks all of them, since they all read/write the same sessionStorage keys.
const SESSION_KEY = "vaultToken";
const SESSION_EXPIRY_KEY = "vaultTokenExpiry";

/** PIN lifecycle (status/setup/unlock/reset/change) shared by every Vault-locked page.
 *  `showToast(message, type)` is supplied by the caller so each page keeps its own <Toast>. */
export function useVaultAccess(showToast) {
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [vaultToken, setVaultToken] = useState(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    const expiry = Number(sessionStorage.getItem(SESSION_EXPIRY_KEY) || 0);
    return token && Date.now() < expiry ? token : null;
  });

  // Setup
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  // Unlock
  const [unlockPin, setUnlockPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotNewPin, setForgotNewPin] = useState("");
  const [resetting, setResetting] = useState(false);

  // Change PIN
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  const vaultHeaders = () => ({ headers: { "X-Vault-Token": vaultToken } });

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    setVaultToken(null);
  };

  const handleVaultAuthError = (err) => {
    if (err?.response?.status === 401) {
      lock();
      showToast("Vault session expired — please unlock again.", "error");
      return true;
    }
    return false;
  };

  useEffect(() => {
    api.get("/api/vault/status")
      .then(res => setHasPin(res.data.hasPin))
      .catch(() => showToast("Failed to load vault status.", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSetup = async (e) => {
    e.preventDefault();
    if (setupPin.length < 4) { showToast("PIN must be at least 4 digits.", "error"); return; }
    if (setupPin !== setupConfirm) { showToast("PINs don't match.", "error"); return; }
    setSettingUp(true);
    try {
      await api.post("/api/vault/setup", { pin: setupPin });
      setHasPin(true);
      setSetupPin(""); setSetupConfirm("");
      showToast("Vault PIN set — enter it now to unlock.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to set up PIN.", "error");
    } finally { setSettingUp(false); }
  };

  const doUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    try {
      const res = await api.post("/api/vault/unlock", { pin: unlockPin });
      sessionStorage.setItem(SESSION_KEY, res.data.vaultToken);
      sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + res.data.expiresInSeconds * 1000));
      setVaultToken(res.data.vaultToken);
      setUnlockPin("");
    } catch (err) {
      showToast(err.response?.data?.message || "Incorrect PIN.", "error");
    } finally { setUnlocking(false); }
  };

  const doResetPin = async (e) => {
    e.preventDefault();
    if (forgotNewPin.length < 4) { showToast("PIN must be at least 4 digits.", "error"); return; }
    setResetting(true);
    try {
      await api.post("/api/vault/reset-pin", { accountPassword: forgotPassword, newPin: forgotNewPin });
      setForgotPassword(""); setForgotNewPin(""); setShowForgot(false);
      showToast("PIN reset — you can unlock with your new PIN now.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset PIN.", "error");
    } finally { setResetting(false); }
  };

  const doChangePin = async (e) => {
    e.preventDefault();
    if (newPinInput.length < 4) { showToast("New PIN must be at least 4 digits.", "error"); return; }
    setChangingPin(true);
    try {
      await api.post("/api/vault/change-pin", { currentPin: currentPinInput, newPin: newPinInput });
      setCurrentPinInput(""); setNewPinInput(""); setShowChangePin(false);
      showToast("PIN changed.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change PIN.", "error");
    } finally { setChangingPin(false); }
  };

  return {
    loading, hasPin, vaultToken, vaultHeaders, lock, handleVaultAuthError,
    setupPin, setSetupPin, setupConfirm, setSetupConfirm, settingUp, doSetup,
    unlockPin, setUnlockPin, unlocking, doUnlock,
    showForgot, setShowForgot, forgotPassword, setForgotPassword, forgotNewPin, setForgotNewPin, resetting, doResetPin,
    showChangePin, setShowChangePin, currentPinInput, setCurrentPinInput, newPinInput, setNewPinInput, changingPin, doChangePin,
  };
}
