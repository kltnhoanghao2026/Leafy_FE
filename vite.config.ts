import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8060";
const iotTestDataProxyTarget =
  process.env.VITE_IOT_TEST_DATA_PROXY_TARGET || "http://localhost:8099";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@mui")) return "vendor-mui";
          if (id.includes("firebase")) return "vendor-firebase";
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("@tanstack")) return "vendor-query";
          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom")
          ) {
            return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Avoid forwarding the browser Origin header to downstream services.
            // Some backend services still enforce direct-browser CORS rules even
            // when the request is already going through the local dev proxy.
            proxyReq.removeHeader("origin");
          });
        },
      },
      "/iot-test-data": {
        target: iotTestDataProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iot-test-data/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
      "/ws": {
        target: apiProxyTarget,
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
