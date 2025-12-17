/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_MASTER_LOG_URL?: string;
  readonly PUBLIC_TILT_DATA_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
