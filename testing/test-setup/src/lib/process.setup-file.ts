import process from 'node:process';
import { beforeEach, vi } from 'vitest';

export const MOCK_PID = 10_001;

beforeEach(() => {
  vi.spyOn(process, 'pid', 'get').mockReturnValue(MOCK_PID);
});
