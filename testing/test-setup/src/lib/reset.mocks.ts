import { vol } from 'memfs';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vol.reset();
});
