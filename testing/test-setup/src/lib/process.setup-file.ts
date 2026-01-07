import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { afterEach, beforeEach, vi } from 'vitest';

export const MOCK_PID = 10_001;
export const MOCK_TID = 1;

// Mock immediately when the setup file loads for default exports using process.pid or threadId
const processMock = vi.spyOn(process, 'pid', 'get').mockReturnValue(MOCK_PID);
const threadIdMock = vi
  .spyOn({ threadId }, 'threadId', 'get')
  .mockReturnValue(MOCK_TID);

beforeEach(() => {
  processMock.mockReturnValue(MOCK_PID);
  threadIdMock.mockReturnValue(MOCK_TID);
});

afterEach(() => {
  processMock.mockClear();
  threadIdMock.mockClear();
});
