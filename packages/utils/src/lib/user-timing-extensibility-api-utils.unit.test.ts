import { performance } from 'node:perf_hooks';
import { threadId } from 'node:worker_threads';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type MeasureCtxOptions,
  type MeasureOptions,
  asOptions,
  errorToDevToolsProperties,
  errorToEntryMeta,
  errorToMarkerPayload,
  errorToTrackEntryPayload,
  getNames,
  markerErrorPayload,
  markerPayload,
  measureCtx,
  mergeDevtoolsPayload,
  mergePropertiesWithOverwrite,
  setupTracks,
  trackEntryErrorPayload,
  trackEntryPayload,
} from './user-timing-extensibility-api-utils.js';
import type {
  EntryMeta,
  TrackEntryPayload,
  TrackMeta,
} from './user-timing-extensibility-api.type.js';

describe('mergePropertiesWithOverwrite', () => {
  it('should merge properties with overwrite', () => {
    expect(
      mergePropertiesWithOverwrite(
        [
          ['key1', 'value1'],
          ['key2', 'value2'],
        ],
        [
          ['key2', 'overwritten'],
          ['key3', 'value3'],
        ],
      ),
    ).toStrictEqual([
      ['key1', 'value1'],
      ['key2', 'overwritten'],
      ['key3', 'value3'],
    ]);
  });

  it('should handle undefined base properties', () => {
    expect(mergePropertiesWithOverwrite([['key', 'value']])).toStrictEqual([
      ['key', 'value'],
    ]);
  });

  it('should handle undefined override properties', () => {
    expect(mergePropertiesWithOverwrite([['key', 'value']])).toStrictEqual([
      ['key', 'value'],
    ]);
  });
});

describe('markerPayload', () => {
  it('should create marker payload with defaults', () => {
    expect(markerPayload()).toStrictEqual({
      dataType: 'marker',
    });
  });

  it('should create marker payload with options', () => {
    expect(
      markerPayload({
        color: 'primary',
        tooltipText: 'test tooltip',
        properties: [['key', 'value']],
      }),
    ).toStrictEqual({
      dataType: 'marker',
      color: 'primary',
      tooltipText: 'test tooltip',
      properties: [['key', 'value']],
    });
  });
});

describe('trackEntryPayload', () => {
  it('should create track entry payload with defaults', () => {
    expect(
      trackEntryPayload({
        track: 'Main',
      }),
    ).toStrictEqual({
      dataType: 'track-entry',
      track: 'Main',
    });
  });

  it('should create track entry payload with options', () => {
    expect(
      trackEntryPayload({
        track: 'Custom Track',
        trackGroup: 'Custom Group',
        color: 'primary',
        tooltipText: 'test',
        properties: [['key', 'value']],
      }),
    ).toStrictEqual({
      dataType: 'track-entry',
      track: 'Custom Track',
      trackGroup: 'Custom Group',
      color: 'primary',
      tooltipText: 'test',
      properties: [['key', 'value']],
    });
  });
});

describe('markerErrorPayload', () => {
  it('should create error marker payload with default color', () => {
    expect(markerErrorPayload()).toStrictEqual({
      dataType: 'marker',
      color: 'error',
    });
  });

  it('should create error marker payload with custom options', () => {
    expect(
      markerErrorPayload({
        tooltipText: 'error occurred',
        properties: [['code', '500']],
      }),
    ).toStrictEqual({
      dataType: 'marker',
      color: 'error',
      tooltipText: 'error occurred',
      properties: [['code', '500']],
    });
  });
});

describe('trackEntryErrorPayload', () => {
  it('should create error track entry payload with defaults', () => {
    expect(trackEntryErrorPayload({ track: 'Test' })).toStrictEqual({
      dataType: 'track-entry',
      color: 'error',
      track: 'Test',
    });
  });

  it('should create error track entry payload with all options', () => {
    expect(
      trackEntryErrorPayload({
        track: 'Custom Track',
        trackGroup: 'Custom Group',
        tooltipText: 'warning occurred',
        properties: [['level', 'high']],
      }),
    ).toStrictEqual({
      dataType: 'track-entry',
      color: 'error',
      track: 'Custom Track',
      trackGroup: 'Custom Group',
      tooltipText: 'warning occurred',
      properties: [['level', 'high']],
    });
  });
});

describe('errorToDevToolsProperties', () => {
  it('should convert Error to properties', () => {
    const error = new Error('test message');
    expect(errorToDevToolsProperties(error)).toStrictEqual([
      ['Error Type', 'Error'],
      ['Error Message', 'test message'],
    ]);
  });

  it('should convert non-Error to properties', () => {
    expect(errorToDevToolsProperties('string error')).toStrictEqual([
      ['Error Type', 'UnknownError'],
      ['Error Message', 'string error'],
    ]);
  });

  it('should handle null', () => {
    expect(errorToDevToolsProperties(null)).toStrictEqual([
      ['Error Type', 'UnknownError'],
      ['Error Message', 'null'],
    ]);
  });

  it('should handle undefined', () => {
    expect(errorToDevToolsProperties(undefined)).toStrictEqual([
      ['Error Type', 'UnknownError'],
      ['Error Message', 'undefined'],
    ]);
  });
});

describe('errorToEntryMeta', () => {
  it('should convert error to entry meta with defaults', () => {
    const result = errorToEntryMeta(new Error('test error'));
    expect(result).toStrictEqual({
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
      ],
    });
  });

  it('should convert error to entry meta with custom options', () => {
    const result = errorToEntryMeta(new Error('test error'), {
      tooltipText: 'Custom tooltip',
      properties: [['custom', 'value']],
    });
    expect(result).toStrictEqual({
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
        ['custom', 'value'],
      ],
      tooltipText: 'Custom tooltip',
    });
  });

  it('should handle error without properties', () => {
    const error = new Error('test error');
    const result = errorToEntryMeta(error, { properties: [] });
    expect(result).toStrictEqual({
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
      ],
    });
  });

  it('should handle error with undefined options', () => {
    const result = errorToEntryMeta(new Error('test error'), undefined);
    expect(result).toStrictEqual({
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
      ],
    });
  });
});

describe('errorToTrackEntryPayload', () => {
  it('should convert error to track entry payload', () => {
    const error = new Error('test error');
    const result = errorToTrackEntryPayload(error, { track: 'Test' });
    expect(result).toStrictEqual({
      dataType: 'track-entry',
      color: 'error',
      track: 'Test',
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
      ],
    });
  });

  it('should convert error to track entry payload with custom properties', () => {
    const error = new Error('test error');
    const result = errorToTrackEntryPayload(error, {
      track: 'Test',
      tooltipText: 'Custom tooltip',
      properties: [['custom', 'value']],
    });
    expect(result).toStrictEqual({
      dataType: 'track-entry',
      color: 'error',
      track: 'Test',
      tooltipText: 'Custom tooltip',
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
        ['custom', 'value'],
      ],
    });
  });

  it('should convert error to track entry payload with undefined detail', () => {
    const error = new Error('test error');
    const result = errorToTrackEntryPayload(error, { track: 'Test' });
    expect(result).toStrictEqual({
      dataType: 'track-entry',
      track: 'Test',
      color: 'error',
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
      ],
    });
  });
});

describe('errorToMarkerPayload', () => {
  it('should convert error to marker payload with defaults', () => {
    const error = new Error('test error');
    const result = errorToMarkerPayload(error);
    expect(result).toStrictEqual({
      dataType: 'marker',
      color: 'error',
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
      ],
    });
  });

  it('should convert error to marker payload with custom options', () => {
    const error = new Error('test error');
    const result = errorToMarkerPayload(error, {
      tooltipText: 'Custom tooltip',
      properties: [['custom', 'value']],
    });
    expect(result).toStrictEqual({
      dataType: 'marker',
      color: 'error',
      tooltipText: 'Custom tooltip',
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
        ['custom', 'value'],
      ],
    });
  });
});

describe('getNames', () => {
  it('should generate names without prefix', () => {
    const result = getNames('test');
    expect(result).toStrictEqual({
      startName: 'test:start',
      endName: 'test:end',
      measureName: 'test',
    });
  });

  it('should generate names with prefix', () => {
    const result = getNames('operation', 'db');
    expect(result).toStrictEqual({
      startName: 'db:operation:start',
      endName: 'db:operation:end',
      measureName: 'db:operation',
    });
  });

  it('should handle empty prefix', () => {
    const result = getNames('task', '');
    expect(result).toStrictEqual({
      startName: 'task:start',
      endName: 'task:end',
      measureName: 'task',
    });
  });
});

describe('mergeDevtoolsPayload', () => {
  it('should return empty object when no payloads provided', () => {
    expect(mergeDevtoolsPayload()).toStrictEqual({});
  });

  it('should return the same payload when single payload provided', () => {
    const payload: TrackEntryPayload = {
      dataType: 'track-entry',
      track: 'Test Track',
      color: 'primary',
      properties: [['key1', 'value1']],
    };
    expect(mergeDevtoolsPayload(payload)).toStrictEqual(payload);
  });

  it('should merge multiple track entry payloads', () => {
    const payload1: TrackEntryPayload = {
      track: 'Test Track',
      color: 'primary',
    };
    const payload2: Partial<TrackEntryPayload> = {
      trackGroup: 'Test Group',
      tooltipText: 'Test tooltip',
      properties: [['key2', 'value2']],
    };
    const payload3: EntryMeta = {
      properties: [['key3', 'value3']],
    };

    expect(mergeDevtoolsPayload(payload1, payload2, payload3)).toStrictEqual({
      track: 'Test Track',
      color: 'primary',
      trackGroup: 'Test Group',
      tooltipText: 'Test tooltip',
      properties: [
        ['key2', 'value2'],
        ['key3', 'value3'],
      ],
    });
  });

  it('should merge multiple property payloads with overwrite behavior', () => {
    const payload1: EntryMeta = {
      properties: [['key1', 'value1']],
    };
    const payload2: EntryMeta = {
      properties: [
        ['key1', 'overwrite'],
        ['key2', 'value2'],
      ],
    };

    expect(mergeDevtoolsPayload(payload1, payload2)).toStrictEqual({
      properties: [
        ['key1', 'overwrite'],
        ['key2', 'value2'],
      ],
    });
  });

  it('should handle undefined and empty properties', () => {
    const payload1: TrackMeta = {
      track: 'Test',
    };
    const payload2: EntryMeta = {
      properties: undefined,
    };

    expect(mergeDevtoolsPayload(payload1, payload2)).toStrictEqual({
      track: 'Test',
      properties: undefined,
    });
  });
});

describe('setupTracks', () => {
  it('should create track definitions with defaults as base', () => {
    const defaults: TrackEntryPayload = {
      track: 'Main Track',
      color: 'primary',
      trackGroup: 'My Group',
    };
    const tracks = {
      main: { track: 'Main Track' },
      secondary: { track: 'Secondary Track' },
    };

    const result = setupTracks(defaults, tracks);
    expect(result).toStrictEqual({
      main: {
        track: 'Main Track',
        color: 'primary',
        trackGroup: 'My Group',
        dataType: 'track-entry',
      },
      secondary: {
        track: 'Secondary Track',
        color: 'primary',
        trackGroup: 'My Group',
        dataType: 'track-entry',
      },
    });
  });
});

describe('asOptions', () => {
  it('should convert marker payload to mark options', () => {
    const devtools = markerPayload({ color: 'primary' });
    expect(asOptions(devtools)).toStrictEqual({
      detail: { devtools },
    });
  });

  it('should convert track entry payload to measure options', () => {
    const devtools = trackEntryPayload({ track: 'Custom' });
    expect(asOptions(devtools)).toStrictEqual({
      detail: { devtools },
    });
  });

  it('should return empty detail for null input', () => {
    expect(asOptions(null)).toStrictEqual({ detail: {} });
  });

  it('should return empty detail for undefined input', () => {
    expect(asOptions(undefined)).toStrictEqual({ detail: {} });
  });
});

describe('measureCtx', () => {
  beforeEach(() => {
    vi.spyOn(performance, 'mark').mockImplementation(vi.fn());
    vi.spyOn(performance, 'measure').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates measure context and supports measurement', () => {
    // Your code to profile
    const codeToProfile = ({ fail }: { fail?: boolean } = {}) => {
      if (fail) {
        throw new Error('test error');
      }
      return 1;
    };

    // Base global config - define once
    const globalDefaults: MeasureCtxOptions = {
      track: 'Global Track',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
      color: 'primary-dark',
      error: (error: unknown) => ({
        properties: [['Global:Error', `Custom Error Info: ${String(error)}`]],
      }),
    } as const;

    // Local overrides - define once
    const localOverrides: MeasureOptions = {
      color: 'primary',
      properties: [['Runtime:Config', `Thread ID ${threadId}`]],
      success: (result: unknown) => ({
        properties: [['Runtime:Result', String(result)]],
      }),
      error: (error: unknown) => ({
        properties: [
          ['Runtime:Error', `Stack Trace: ${String((error as Error)?.stack)}`],
        ],
      }),
    } as const;

    const profilerCtx = measureCtx(globalDefaults);
    const { start, success } = profilerCtx('utils', localOverrides);

    start(); // <= start mark
    expect(performance.mark).toHaveBeenCalledWith('utils:start', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'primary', // local override wins
        },
      },
    });

    const result = codeToProfile();
    success(result); // <= end mark + measure (success)
    expect(performance.mark).toHaveBeenLastCalledWith('utils:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'primary',
        },
      },
    });
    expect(performance.measure).toHaveBeenCalledWith('utils', {
      start: 'utils:start',
      end: 'utils:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'primary',
          properties: [
            ['Global:Config', `Process ID ${process.pid}`],
            ['Runtime:Config', `Thread ID ${threadId}`],
            ['Runtime:Result', String(result)],
          ],
        },
      },
    });
  });

  it('creates measure context with minimal config', () => {
    expect(measureCtx({ track: 'Global Track' })('utils')).toStrictEqual({
      start: expect.any(Function),
      success: expect.any(Function),
      error: expect.any(Function),
    });
  });

  it('creates start mark with global defaults', () => {
    const { start } = measureCtx({
      track: 'Global Track',
      trackGroup: 'Global Track Group',
      color: 'primary-dark',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
    })('load-cfg');
    start();
    expect(performance.mark).toHaveBeenCalledWith('load-cfg:start', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          trackGroup: 'Global Track Group',
          color: 'primary-dark',
          // Marks do not have EntryMeta as hover/click is rare
        },
      },
    });
  });

  it('creates start mark with local overrides', () => {
    const { start } = measureCtx({
      track: 'Global Track',
      color: 'primary-dark',
    })('load-cfg', {
      color: 'primary',
      properties: [['Runtime:Config', `Thread ID ${threadId}`]],
    });
    start();
    expect(performance.mark).toHaveBeenCalledWith('load-cfg:start', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'primary',
          // Marks do not have EntryMeta as hover/click is rare
        },
      },
    });
  });

  it('creates success mark and measure with global defaults', () => {
    const { success } = measureCtx({
      track: 'Global Track',
      trackGroup: 'Global Track Group',
      color: 'primary-dark',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
    })('load-cfg');
    success(1);
    expect(performance.mark).toHaveBeenCalledWith('load-cfg:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          trackGroup: 'Global Track Group',
          color: 'primary-dark',
          // Marks do not have EntryMeta as hover/click is rare
        },
      },
    });
    expect(performance.measure).toHaveBeenCalledWith('load-cfg', {
      start: 'load-cfg:start',
      end: 'load-cfg:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          trackGroup: 'Global Track Group',
          color: 'primary-dark',
          properties: [['Global:Config', `Process ID ${process.pid}`]],
        },
      },
    });
  });

  it('creates success mark and measure with local overrides and success handler', () => {
    const { success } = measureCtx({
      track: 'Global Track',
      color: 'primary-dark',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
    })('test', {
      color: 'primary',
      properties: [['Runtime:Config', `Thread ID ${threadId}`]],
      success: (result: unknown) => ({
        properties: [['Runtime:Result', String(result)]],
      }),
    });
    success(1);
    expect(performance.mark).toHaveBeenCalledWith('test:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'primary',
          // Marks do not have EntryMeta as hover/click is rare
        },
      },
    });
    expect(performance.measure).toHaveBeenCalledWith('test', {
      start: 'test:start',
      end: 'test:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'primary',
          properties: [
            ['Global:Config', `Process ID ${process.pid}`],
            ['Runtime:Config', `Thread ID ${threadId}`],
            ['Runtime:Result', '1'],
          ],
        },
      },
    });
  });

  it('creates error mark and measure with global defaults', () => {
    const error = new Error('test error');
    const { error: errorFn } = measureCtx({
      track: 'Global Track',
      trackGroup: 'Global Track Group',
      color: 'primary-dark',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
    })('load-cfg');
    errorFn(error);
    expect(performance.mark).toHaveBeenCalledWith('load-cfg:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          trackGroup: 'Global Track Group',
          color: 'error',
          // Marks do not have EntryMeta as hover/click is rare
        },
      },
    });
    expect(performance.measure).toHaveBeenCalledWith('load-cfg', {
      start: 'load-cfg:start',
      end: 'load-cfg:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          trackGroup: 'Global Track Group',
          color: 'error',
          properties: [
            ['Error Type', 'Error'],
            ['Error Message', 'test error'],
            ['Global:Config', `Process ID ${process.pid}`],
          ],
        },
      },
    });
  });

  it('creates error mark and measure with local overrides and error handler', () => {
    const error = new Error('test error');
    const { error: errorFn } = measureCtx({
      track: 'Global Track',
      color: 'primary-dark',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
    })('test', {
      color: 'primary',
      properties: [['Runtime:Config', `Thread ID ${threadId}`]],
      error: (err: unknown) => ({
        properties: [
          ['Runtime:Error', `Stack Trace: ${String((err as Error)?.stack)}`],
        ],
      }),
    });
    errorFn(error);
    expect(performance.mark).toHaveBeenCalledWith('test:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'error',
          // Marks do not have EntryMeta as hover/click is rare
        },
      },
    });
    expect(performance.measure).toHaveBeenCalledWith('test', {
      start: 'test:start',
      end: 'test:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'error',
          properties: [
            ['Error Type', 'Error'],
            ['Error Message', 'test error'],
            [
              'Runtime:Error',
              `Stack Trace: ${String((error as Error)?.stack)}`,
            ],
            ['Global:Config', `Process ID ${process.pid}`],
            ['Runtime:Config', `Thread ID ${threadId}`],
          ],
        },
      },
    });
  });

  it('creates error mark and measure with no error handlers', () => {
    const error = new Error('test error');
    const { error: errorFn } = measureCtx({
      track: 'Global Track',
      properties: [['Global:Config', `Process ID ${process.pid}`]],
    })('test');
    errorFn(error);
    expect(performance.mark).toHaveBeenCalledWith('test:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'error',
        },
      },
    });
    expect(performance.measure).toHaveBeenCalledWith('test', {
      start: 'test:start',
      end: 'test:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Global Track',
          color: 'error',
          properties: [
            ['Error Type', 'Error'],
            ['Error Message', 'test error'],
            ['Global:Config', `Process ID ${process.pid}`],
          ],
        },
      },
    });
  });
});
