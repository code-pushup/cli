import { type MockInstance, afterEach, beforeEach, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';

// Mock fs, fs/promises AND process.cwd() for full memfs environment
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

// eslint-disable-next-line functional/no-let -- Mock spy needs to be reassignable
let cwdSpy: MockInstance<[], string> | undefined;

beforeEach(() => {
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
});

afterEach(() => {
  cwdSpy?.mockRestore();
});
