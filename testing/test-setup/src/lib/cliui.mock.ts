import { vi } from 'vitest';

vi.mock('@code-pushup/utils', async () => {
  const module = await vi.importActual('@code-pushup/utils');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  module.ui().switchMode('raw');
  return module;
});
