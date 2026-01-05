import { afterEach, beforeEach, vi } from 'vitest';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

let _now = 0;
const clock = {
  tick: () => (_now += 10),
  now: () => _now,
};

beforeEach(() => {
  _now = 0;
  // only patch the time to make the tests deterministic
  vi.useFakeTimers({
    now: clock.now(),
  });

  vi.spyOn(performance, 'mark').mockImplementation(vi.fn());
  vi.spyOn(performance, 'measure').mockImplementation(vi.fn());
  vi.spyOn(performance, 'clearMarks').mockImplementation(vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});
