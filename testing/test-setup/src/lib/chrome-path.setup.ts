import { getChromePath } from 'chrome-launcher';
import * as process from 'process';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  try {
    vi.stubEnv('CHROME_PATH', getChromePath());
  } catch (error) {
    const customChromePath = (process.env as { CUSTOM_CHROME_PATH: string })
      .CUSTOM_CHROME_PATH;
    if (customChromePath == null || customChromePath === '') {
      throw new Error(
        (error as { message: string }).message + 'Chrome path not found. Please read the in the packages CONTRIBUTING.md/#chrome-path section.',
      );
    }
    vi.stubEnv('CHROME_PATH', customChromePath);
  }
});
