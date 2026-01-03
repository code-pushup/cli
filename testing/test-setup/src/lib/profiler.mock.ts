import { type MockInstance, afterAll, beforeAll, vi } from 'vitest';

const profilerSpies: MockInstance[] = [];

beforeAll(async () => {
  const { profiler }: typeof import('@code-pushup/utils') =
    await vi.importActual('@code-pushup/utils');

  // TODO: use vi.mockObject after Vitest update: https://vitest.dev/api/vi.html#vi-mockobject-3-2-0
  if (process.env['CP_PROFILING_VERBOSE'] === 'true') {
    // only track calls, but preserve original implementation so profiling works
    profilerSpies.push(
      vi.spyOn(profiler, 'span'),
      vi.spyOn(profiler, 'spanAsync'),
      vi.spyOn(profiler, 'instantMarker'),
      vi.spyOn(profiler, 'instantTrackEntry'),
      vi.spyOn(profiler, 'mark'),
      vi.spyOn(profiler, 'measure'),
      vi.spyOn(profiler, 'flush'),
      vi.spyOn(profiler, 'close'),
    );
  } else {
    // track calls and disable profiling
    profilerSpies.push(
      vi
        .spyOn(profiler, 'span')
        .mockImplementation((name, fn, options) => fn()),
      vi
        .spyOn(profiler, 'spanAsync')
        .mockImplementation(async (name, fn, options) => await fn()),
      vi.spyOn(profiler, 'instantMarker').mockImplementation(() => {}),
      vi.spyOn(profiler, 'instantTrackEntry').mockImplementation(() => {}),
      vi.spyOn(profiler, 'mark').mockImplementation(() => ({}) as any),
      vi.spyOn(profiler, 'measure').mockImplementation(() => undefined),
      vi.spyOn(profiler, 'flush').mockImplementation(() => {}),
      vi.spyOn(profiler, 'close').mockImplementation(() => {}),
    );
  }
});

afterAll(() => {
  profilerSpies.forEach(profilerSpy => {
    profilerSpy.mockRestore();
  });
});
