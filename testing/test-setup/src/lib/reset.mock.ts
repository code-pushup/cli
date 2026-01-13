import { vol } from 'memfs';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();

  vi.unstubAllEnvs();
  // set the verbose to false as default for all tests as local env could be set to true
  vi.stubEnv('CP_VERBOSE', 'false');

  vol.reset();
});
