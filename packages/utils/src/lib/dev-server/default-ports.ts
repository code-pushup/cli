export const FALLBACK_DEV_SERVER_PORT = 4200;

export const DEV_SERVER_PORTS = {
  vite: 5173,
  next: 3000,
  nuxt: 3000,
  astro: 4321,
  angular: 4200,
  webpack: 8080,
  vueCli: 8080,
  cra: 3000,
  parcel: 1234,
} as const;

export type DevServerTool = keyof typeof DEV_SERVER_PORTS;

export function toDevServerUrl(port: number): string {
  return `http://localhost:${port}`;
}

export const FALLBACK_DEV_SERVER_URL = toDevServerUrl(FALLBACK_DEV_SERVER_PORT);
