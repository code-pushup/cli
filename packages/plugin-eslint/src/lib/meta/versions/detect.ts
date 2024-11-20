import type { ConfigFormat } from './formats';

export async function detectConfigVersion(): Promise<ConfigFormat> {
  // TODO: detect flat config
  return 'legacy';
}
