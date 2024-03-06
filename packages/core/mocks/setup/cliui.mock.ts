import { afterEach, vi } from 'vitest';
import { ui } from '@code-pushup/utils';

vi.mock('@code-pushup/utils', async () => {
  const module = await vi.importActual('@code-pushup/utils');

  module.ui().switchMode('raw');
  return module;
});

afterEach(() => {
  ui().logger.flushLogs();
});
