import { type MockInstance, afterEach, beforeEach, vi } from 'vitest';

const MOCK_DATE_NOW_MS = 1_000_000;
const MOCK_TIME_ORIGIN = 500_000;

const dateNow = MOCK_DATE_NOW_MS;
const performanceTimeOrigin = MOCK_TIME_ORIGIN;

/* eslint-disable functional/no-let */
let dateNowSpy: MockInstance<[], number> | undefined;
let performanceNowSpy: MockInstance<[], number> | undefined;
/* eslint-enable functional/no-let */

beforeEach(() => {
  dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(dateNow);
  performanceNowSpy = vi
    .spyOn(performance, 'now')
    .mockReturnValue(dateNow - performanceTimeOrigin);

  vi.stubGlobal('performance', {
    ...performance,
    timeOrigin: performanceTimeOrigin,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();

  if (dateNowSpy) {
    dateNowSpy.mockRestore();
    dateNowSpy = undefined;
  }
  if (performanceNowSpy) {
    performanceNowSpy.mockRestore();
    performanceNowSpy = undefined;
  }
});
