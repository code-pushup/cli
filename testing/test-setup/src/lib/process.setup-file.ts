import process from 'node:process';
import { afterEach, beforeEach, vi } from 'vitest';

export const MOCK_PID = 10_001;

let processMock = vi.spyOn(process, 'pid', 'get');
beforeEach(() => {
  processMock.mockReturnValue(MOCK_PID);
});

afterEach(() => {
  processMock.mockRestore();
});
