import { type MockInstance, afterEach, beforeEach, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

let cwdSpy: MockInstance<[], string>;

beforeEach(() => {
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
});

afterEach(() => {
  cwdSpy.mockRestore();
});
