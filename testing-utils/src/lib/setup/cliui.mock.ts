import { afterEach, beforeAll } from 'vitest';
import { ui } from '@code-pushup/utils';

beforeAll(() => {
  // initialize it in raw mode
  ui().switchMode('raw');
});

afterEach(() => {
  // clean previous logs
  ui().flushLogs();
});
