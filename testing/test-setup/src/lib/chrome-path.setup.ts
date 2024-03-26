import {getChromePath} from 'chrome-launcher';
import * as process from 'node:process';
import {beforeEach, vi} from 'vitest';

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const customChromePath = (process.env as { CUSTOM_CHROME_PATH: string | undefined })
    .CUSTOM_CHROME_PATH;
  if (customChromePath) {
    vi.stubEnv('CHROME_PATH', customChromePath);
  } else {
    vi.stubEnv('CHROME_PATH', getChromePath());
  }
});
