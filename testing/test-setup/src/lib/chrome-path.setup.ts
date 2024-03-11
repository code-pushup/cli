import { platform } from 'node:process';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  if (platform === 'win32') {
    vi.stubEnv(
      'CHROME_PATH',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    );
  }
});
