/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the API. Defaults to "/api" (same-origin / Vite dev proxy). */
  readonly VITE_API_BASE_URL?: string;
  /** Dev-server proxy target for /api and /health. Defaults to http://localhost:5000. */
  readonly VITE_DEV_API_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
