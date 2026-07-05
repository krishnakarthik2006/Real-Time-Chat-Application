import { useCallback, useEffect, useRef, useState } from "react";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return window.Notification.permission;
  });

  // Keep a ref so `notify` never needs to be recreated when permission changes
  const permissionRef = useRef(permission);
  const registrationRef = useRef(null);

  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let active = true;

    navigator.serviceWorker
      .register("/notification-sw.js")
      .then((reg) => { if (active) registrationRef.current = reg; })
      .catch((err) => console.error("Notification worker registration failed.", err));

    return () => { active = false; };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }
    const result = await window.Notification.requestPermission();
    setPermission(result);
    permissionRef.current = result;
    return result;
  }, []);

  // Stable reference — reads permission via ref so it never needs to change
  const notify = useCallback(async ({ title, body, url, tag }) => {
    if (permissionRef.current !== "granted") return;

    const options = { body, tag, data: { url } };

    if ("serviceWorker" in navigator) {
      const reg = registrationRef.current ?? await navigator.serviceWorker.ready;
      if (reg) {
        await reg.showNotification(title, options);
        return;
      }
    }

    if ("Notification" in window) {
      const n = new window.Notification(title, options);
      n.onclick = () => { window.focus(); if (url) window.location.assign(url); };
    }
  }, []); // no deps — stable for the lifetime of the hook

  return {
    permission,
    isSupported: permission !== "unsupported",
    requestPermission,
    notify,
  };
}
