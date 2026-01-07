import process from 'node:process';
import { afterEach, beforeEach, vi } from 'vitest';

export const MOCK_PID = 10_001;
export const MOCK_TID = 2;

vi.mock('node:worker_threads', () => ({
  get threadId() {
    return MOCK_TID;
  },
}));

const processMock = vi.spyOn(process, 'pid', 'get');

beforeEach(() => {
  processMock.mockReturnValue(MOCK_PID);
});

afterEach(() => {
  processMock.mockClear();
});
