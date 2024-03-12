import { beforeEach, vi } from 'vitest';
import type { CliUi } from '@code-pushup/utils';

beforeAll(async () => {
  const utils: typeof import('@code-pushup/utils') = await vi.importActual(
    '@code-pushup/utils',
  );
  utils.ui().switchMode('raw');
});

beforeEach(async () => {
  const { ui }: typeof import('@code-pushup/utils') = await vi.importActual(
    '@code-pushup/utils',
  );
  ui().logger.flushLogs();
});
