/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Fallback only — the live number is managed in admin Settings via /api/config. */
  readonly VITE_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
