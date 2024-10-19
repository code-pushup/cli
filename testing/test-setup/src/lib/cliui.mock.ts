import { beforeAll, beforeEach, vi } from 'vitest';

beforeAll(async () => {
  const utils: typeof import('@code-pushup/utils') =
    await vi.importActual('@code-pushup/utils');
  utils.ui().switchMode('raw');
});

beforeEach(async () => {
  const { ui }: typeof import('@code-pushup/utils') =
    await vi.importActual('@code-pushup/utils');
  ui().logger.flushLogs();
});
