import { getChromePath } from 'chrome-launcher';
import * as process from 'node:process';
import { beforeEach, vi } from 'vitest';

beforeEach(async () => {
  const customChromePath = process.env['CUSTOM_CHROME_PATH'];

  if (customChromePath == null) {
    try {
      const path = getChromePath();
      vi.stubEnv('CHROME_PATH', path);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('No Chrome installations found.')
      ) {
        const chromium = await import('chromium');
        // console.info may be overridden by multi-progress-bars or other libraries
        if (typeof console.info === 'function') {
          console.info(
            `${error.message} Using chromium from node_modules instead: ${chromium.path}`,
          );
        }
        vi.stubEnv('CHROME_PATH', chromium.path);
      } else {
        throw error;
      }
    }
  } else {
    vi.stubEnv('CHROME_PATH', customChromePath);
  }
});
