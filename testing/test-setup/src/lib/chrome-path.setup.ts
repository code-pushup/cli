import { getChromePath } from 'chrome-launcher';
import chromium from 'chromium';
import * as process from 'node:process';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  const customChromePath = process.env['CUSTOM_CHROME_PATH'];

  if (customChromePath == null) {
    try {
      const path = getChromePath();
      vi.stubEnv('CHROME_PATH', path);
    } catch (e) {
      if ((e as Error).message.includes('No Chrome installations found.')) {
        console.info(
          `${(e as Error).message} Using chromium from node_modules instead: ${
            chromium.path
          }`,
        );
        vi.stubEnv('CHROME_PATH', chromium.path);
      }
      throw e;
    }
  } else {
    vi.stubEnv('CHROME_PATH', customChromePath);
  }
});
