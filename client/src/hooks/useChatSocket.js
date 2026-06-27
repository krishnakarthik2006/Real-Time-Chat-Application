import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// In dev, VITE_SERVER_URL is empty so the Vite proxy handles /socket.io.
// In production, set VITE_SERVER_URL to the full server origin.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

export function useChatSocket(token) {
  const [socket, setSocket] = useState(null);
  // Keep a stable ref so cleanup always sees the latest socket instance
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    const connection = io(SERVER_URL, {
      auth: { token },

      // Use WebSocket first, fall back to polling only if needed
      transports: ["websocket", "polling"],

      // Reconnection settings — back off gracefully on server restarts
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.3,

      // Timeouts
      timeout: 20000,
    });

    // Silence the "websocket error" console spam that comes from
    // ECONNRESET during Vite HMR / server restarts. The socket
    // reconnects automatically — no action needed.
    connection.io.on("error", () => {});

    socketRef.current = connection;
    setSocket(connection);

    return () => {
      connection.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  return socket;
}
