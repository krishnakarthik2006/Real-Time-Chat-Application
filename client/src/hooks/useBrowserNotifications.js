import { useEffect, useRef, useState } from "react";

export function useBrowserNotifications() {
  const [permission, setPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    return window.Notification.permission;
  });
  const registrationRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function registerWorker() {
      if (!("serviceWorker" in navigator)) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/notification-sw.js");

        if (active) {
          registrationRef.current = registration;
        }
      } catch (error) {
        console.error("Notification worker registration failed.", error);
      }
    }

    registerWorker();

    return () => {
      active = false;
    };
  }, []);

  async function requestPermission() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }

    const result = await window.Notification.requestPermission();
    setPermission(result);
    return result;
  }

  async function notify({ title, body, url, tag }) {
    if (permission !== "granted") {
      return;
    }

    const options = {
      body,
      tag,
      data: {
        url,
      },
    };

    if ("serviceWorker" in navigator) {
      const registration = registrationRef.current || await navigator.serviceWorker.ready;

      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }

    if ("Notification" in window) {
      const notification = new window.Notification(title, options);

      notification.onclick = () => {
        window.focus();

        if (url) {
          window.location.assign(url);
        }
      };
    }
  }

  return {
    permission,
    isSupported: permission !== "unsupported",
    requestPermission,
    notify,
  };
}
