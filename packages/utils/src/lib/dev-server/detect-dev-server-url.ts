import path from 'node:path';
import {
  FALLBACK_DEV_SERVER_PORT,
  FALLBACK_DEV_SERVER_URL,
  toDevServerUrl,
} from './default-ports.js';
import { DEV_SERVER_DETECTORS } from './detectors.js';
import type { DevServerDetectionResult, DevServerUrlPrompt } from './types.js';

const cache = new Map<string, DevServerDetectionResult>();

export function resetDevServerUrlCache(): void {
  cache.clear();
}

function createFallbackResult(): DevServerDetectionResult {
  return {
    port: FALLBACK_DEV_SERVER_PORT,
    url: FALLBACK_DEV_SERVER_URL,
    source: 'fallback',
  };
}

export async function detectDevServerUrlWithSource(
  targetDir: string,
): Promise<DevServerDetectionResult> {
  const key = path.resolve(targetDir);
  const cached = cache.get(key);
  if (cached != null) {
    return cached;
  }

  for (const detector of DEV_SERVER_DETECTORS) {
    const result = await detector.detect(targetDir);
    if (result != null) {
      cache.set(key, result);
      return result;
    }
  }

  const fallback = createFallbackResult();
  cache.set(key, fallback);
  return fallback;
}

/**
 * Detects the likely local dev server URL for a project directory.
 * Used by create-cli to pre-fill Axe and Lighthouse target URL prompts.
 */
export async function detectDevServerUrl(targetDir: string): Promise<string> {
  return (await detectDevServerUrlWithSource(targetDir)).url;
}

export async function resolveDevServerUrlPrompt(
  targetDir: string,
): Promise<DevServerUrlPrompt> {
  const detection = await detectDevServerUrlWithSource(targetDir);

  return {
    default: detection.url,
    message:
      detection.source !== 'fallback'
        ? `Target URL(s) (detected from ${detection.source}, comma-separated):`
        : 'Target URL(s) (comma-separated):',
  };
}
