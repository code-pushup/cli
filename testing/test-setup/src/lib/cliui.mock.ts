import { beforeEach, vi } from 'vitest';
import type { CliUi } from '@code-pushup/utils';

vi.mock('@code-pushup/utils', async () => {
  const module = await vi.importActual<{ ui: () => CliUi }>(
    '@code-pushup/utils',
  );

  module.ui().switchMode('raw');
  return module;
});

beforeEach(async () => {
  const module = await vi.importActual<{ ui: () => CliUi }>(
    '@code-pushup/utils',
  );
  module.ui().logger.flushLogs();
});
