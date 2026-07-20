/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SURFY_DEMO_ROOM_ID?: string;
  readonly VITE_DEMO_GATE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
