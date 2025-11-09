import { type MockInstance, afterAll, beforeAll, vi } from 'vitest';

const loggerSpies: MockInstance[] = [];

beforeAll(async () => {
  const { logger }: typeof import('@code-pushup/utils') =
    await vi.importActual('@code-pushup/utils');

  // TODO: use vi.mockObject after Vitest update: https://vitest.dev/api/vi.html#vi-mockobject-3-2-0
  if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
    // only track calls, but preserve original implementation so logs are printed
    loggerSpies.push(
      vi.spyOn(logger, 'error'),
      vi.spyOn(logger, 'warn'),
      vi.spyOn(logger, 'info'),
      vi.spyOn(logger, 'debug'),
      vi.spyOn(logger, 'newline'),
      vi.spyOn(logger, 'group'),
      vi.spyOn(logger, 'task'),
      vi.spyOn(logger, 'command'),
    );
  } else {
    // track calls and silence logs
    loggerSpies.push(
      vi.spyOn(logger, 'error').mockImplementation(() => {}),
      vi.spyOn(logger, 'warn').mockImplementation(() => {}),
      vi.spyOn(logger, 'info').mockImplementation(() => {}),
      vi.spyOn(logger, 'debug').mockImplementation(() => {}),
      vi.spyOn(logger, 'newline').mockImplementation(() => {}),
      // make sure worker still gets executed
      vi.spyOn(logger, 'group').mockImplementation(async (_, worker) => {
        await worker();
      }),
      vi.spyOn(logger, 'task').mockImplementation(async (_, worker) => {
        await worker();
      }),
      vi.spyOn(logger, 'command').mockImplementation((_, worker) => worker()),
    );
  }
});

afterAll(() => {
  loggerSpies.forEach(loggerSpy => {
    loggerSpy.mockRestore();
  });
});
