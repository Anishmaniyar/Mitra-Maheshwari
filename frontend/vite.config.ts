import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Content-Security-Policy for the built app shell. It is injected only into
 * production HTML (`apply: "build"`), because the Vite dev server relies on an
 * inline HMR/refresh preamble that a strict script-src would block.
 *
 * Razorpay Checkout is loaded from its CDN and renders in its own iframe, so
 * only those hosts are allowlisted. `style-src 'unsafe-inline'` is required by
 * React inline styles and the checkout widget; scripts are not inline.
 */
function contentSecurityPolicy(apiOrigin: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "script-src 'self' https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""} https://*.razorpay.com`,
    "frame-src https://*.razorpay.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:5000";

  let apiOrigin = "";
  try {
    apiOrigin = new URL(env.VITE_API_BASE_URL ?? "").origin;
  } catch {
    // Relative base ("/api") or unset: the API is same-origin.
    apiOrigin = "";
  }

  const cspPlugin: Plugin = {
    name: "inject-content-security-policy",
    apply: "build",
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(apiOrigin)}" />`;
      return html.replace("</head>", `    ${meta}\n  </head>`);
    },
  };

  return {
    plugins: [
      react(),
      cspPlugin,
      VitePWA({
        registerType: "autoUpdate",
        // External registration script so the strict CSP needs no inline
        // script exception for the service worker bootstrap.
        injectRegister: "script",
        includeAssets: ["icons/*.png", "favicon.ico"],
        manifest: {
          name: "Mitra Maheshwari Seva Pratishthan",
          short_name: "Mitra Maheshwari",
          description: "Community membership and family services for the Mitra Maheshwari Seva Pratishthan.",
          theme_color: "#FAFAF8",
          background_color: "#FAFAF8",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        },
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        // The health endpoint lives at the server root, not under /api.
        "/health": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
