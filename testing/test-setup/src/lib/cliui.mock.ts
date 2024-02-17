import { beforeAll, beforeEach } from 'vitest';
import { ui } from '@code-pushup/utils';

beforeAll(() => {
  ui().switchMode('raw');
});
beforeEach(() => {
  ui().logger.flushLogs();
});
