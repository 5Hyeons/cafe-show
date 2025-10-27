/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOKEN_SERVER_URL: string
  readonly VITE_LIVEKIT_SERVER_URL: string
  readonly VITE_ROOM_PREFIX: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
