import { getChromePath } from 'chrome-launcher';
import * as process from 'node:process';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  const customChromePath = process.env['CUSTOM_CHROME_PATH'];

  if (customChromePath == null) {
    vi.stubEnv('CHROME_PATH', getChromePath());
  } else {
    vi.stubEnv('CHROME_PATH', customChromePath);
  }
});
