import {vi} from "vitest";

vi.mock('../../src/lib/logging', async () => {
  const module = await vi.importActual('../../src/lib/logging');
  (module['ui'] as () => {switchMode: (mode: string) => void})().switchMode('raw');
  return module;
});
