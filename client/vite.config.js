import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Errors that are normal during dev (server restart, HMR, tab close)
const IGNORED_PROXY_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ECONNABORTED",
  "EPIPE",
  "ETIMEDOUT",
]);

function silentProxyErrors(proxy, label) {
  proxy.on("error", (err) => {
    if (!IGNORED_PROXY_CODES.has(err.code)) {
      console.error(`[proxy ${label}]`, err.message);
    }
  });
  // ws-level socket errors (ECONNABORTED, EPIPE on raw TCP socket)
  proxy.on("proxyReqWs", (_proxyReq, _req, socket) => {
    socket.on("error", (err) => {
      if (!IGNORED_PROXY_CODES.has(err.code)) {
        console.error(`[proxy ${label} ws socket]`, err.message);
      }
    });
  });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5009",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => silentProxyErrors(proxy, "/api"),
      },
      "/uploads": {
        target: "http://localhost:5009",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => silentProxyErrors(proxy, "/uploads"),
      },
      "/socket.io": {
        target: "http://localhost:5009",
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => silentProxyErrors(proxy, "/socket.io"),
      },
    },
  },
});
