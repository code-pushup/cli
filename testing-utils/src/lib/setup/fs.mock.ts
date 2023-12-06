import { SpyInstance, afterEach, beforeEach, vi } from 'vitest';
import { MEMFS_VOLUME } from '../constants';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

let cwdSpy: SpyInstance;

beforeEach(() => {
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
});

afterEach(() => {
  cwdSpy.mockRestore();
});
