import os from 'node:os';
import { afterEach, beforeEach, vi } from 'vitest';

export const MOCK_AVAILABLE_PARALLELISM = 1;

const availableParallelismMock = vi.spyOn(os, 'availableParallelism');

beforeEach(() => {
  availableParallelismMock.mockReturnValue(MOCK_AVAILABLE_PARALLELISM);
});

afterEach(() => {
  availableParallelismMock.mockClear();
});
