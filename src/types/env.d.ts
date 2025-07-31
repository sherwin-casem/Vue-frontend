/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VUE_APP_API_BASE_URL: string
  readonly VUE_APP_API_LOGIN_ENDPOINT: string
  readonly VUE_APP_API_LOGOUT_ENDPOINT: string
  readonly VUE_APP_API_ME_ENDPOINT: string
  readonly BASE_URL: string
  readonly NODE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VUE_APP_API_BASE_URL: string
      VUE_APP_API_LOGIN_ENDPOINT: string
      VUE_APP_API_LOGOUT_ENDPOINT: string
      VUE_APP_API_ME_ENDPOINT: string
      BASE_URL: string
      NODE_ENV: string
    }
  }
}

export {}
