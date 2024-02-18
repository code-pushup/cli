import { vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';

vi.mock('simple-git', () => ({
  simpleGit: () => ({
    revparse: () => Promise.resolve(MEMFS_VOLUME),
    log: () =>
      Promise.resolve({
        latest: {
          hash: '0123456789abcdef0123456789abcdef01234567',
          message: 'Minor fixes',
          author: 'John Doe',
          date: 'Wed Feb 14 16:00:00 2024 +0100',
        },
      }),
  }),
}));
