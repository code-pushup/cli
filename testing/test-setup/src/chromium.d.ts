// typing hack to expose chromium path via dynamic import('chromium')
declare module 'chromium' {
  export const path: string;
}
