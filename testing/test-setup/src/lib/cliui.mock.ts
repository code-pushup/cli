import { vi } from 'vitest';

vi.mock('@code-pushup/utils', async () => {
  const module = await vi.importActual('@code-pushup/utils');

  (module['ui'] as () => { switchMode: (mode: string) => void })().switchMode(
    'raw',
  );
  return module;
});
