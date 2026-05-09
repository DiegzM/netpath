/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
