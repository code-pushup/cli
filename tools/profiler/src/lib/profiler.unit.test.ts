import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROFILER_ENV_VAR,
  Profiler,
  getProfiler,
  getProfiler as profilerSingleton,
} from './profiler.js';
import type { EntryMeta } from './user-timing-details.type.js';

describe('measure method', () => {
  beforeEach(() => {
    vi.stubEnv(PROFILER_ENV_VAR, 'true');
  });
  it('should execute function and return result on success', () => {
    const profiler = new Profiler({ enabled: false });
    let executed = false;

    const result = profiler.measure('test-measure', () => {
      executed = true;
      return 'success';
    });

    expect(result).toBe('success');
    expect(executed).toBe(true);
  });

  it('should have default track configured on measureConfig', () => {
    const { measureConfig } = new Profiler();

    expect(measureConfig.tracks).toHaveProperty('defaultTrack', {
      track: 'Main',
    });
  });
  it('should accept custom default track on measureConfig', () => {
    const { measureConfig } = new Profiler({
      tracks: {
        defaultTrack: {
          track: 'Custom Track Main',
          color: 'primary-dark',
          group: 'Custom Group',
        },
      },
    });

    expect(measureConfig.tracks).toHaveProperty('defaultTrack', {
      track: 'Custom Track Main',
      color: 'primary-dark',
      group: 'Custom Group',
    });
  });

  it('should accept tracks on measureConfig', () => {
    const profiler = new Profiler({
      tracks: {
        pluginEslint: {
          track: 'Plugins Eslint',
          color: 'secondary-dark',
          group: 'Plugins',
        },
      },
    });

    expect(profiler.measureConfig.tracks).toHaveProperty('defaultTrack', {
      track: 'Main',
    });
    expect(profiler.measureConfig.tracks).toHaveProperty('pluginEslint', {
      track: 'Plugins Eslint',
      color: 'secondary-dark',
      group: 'Plugins',
    });
  });

  it('should add default payload on mark', () => {
    const profiler = new Profiler();
    const name = 'test-mark';
    profiler.mark(name);

    expect(performance.mark).toHaveBeenCalledWith(`${name}:start`, {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Main',
        },
      },
    });
  });

  it('should add string  payload on mark', () => {
    const profiler = new Profiler({
      tracks: {
        main: {
          track: 'My Main',
        },
      },
    });
    const name = 'test-mark';
    profiler.mark(name, 'main');

    expect(performance.mark).toHaveBeenCalledWith(`${name}:start`, {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'My Main',
        },
      },
    });
  });
  it('should add default and custom payload on mark', () => {
    const profiler = new Profiler();
    const name = 'test-mark';
    profiler.mark(name, {
      track: 'CustomTrack',
      color: 'secondary',
    });

    expect(performance.mark).toHaveBeenCalledWith(`${name}:start`, {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'CustomTrack',
          color: 'secondary',
        },
      },
    });
  });
  it('should add default payload on measure', () => {
    const profiler = new Profiler();
    const name = 'test-measure';
    profiler.measure(name, () => 'result');

    expect(performance.mark).toHaveBeenCalledTimes(2);
    expect(performance.measure).toHaveBeenCalledTimes(1);

    expect(performance.mark).toHaveBeenCalledWith(`${name}:start`, {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Main',
        },
      },
    });

    expect(performance.mark).toHaveBeenCalledWith(`${name}:end`, {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Main',
        },
      },
    });

    expect(performance.measure).toHaveBeenCalledWith('test-measure', {
      start: 'test-measure:start',
      end: 'test-measure:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Main',
        },
      },
    });
  });

  it('should handle custom success callback', () => {
    const profiler = new Profiler();
    const successCallback = vi.fn(
      (result: string): Partial<TrackEntryPayload> => ({
        tooltipText: `Success: ${result}`,
        properties: [['Success', String(result)]] as Array<
          [string, string | number | boolean | object | undefined]
        >,
        track: 'Custom Success Track', // Can now include track data
      }),
    );

    profiler.measure('test-measure', () => 'result', {
      success: successCallback,
    });

    expect(successCallback).toHaveBeenCalledWith('result');
    expect(performance.measure).toHaveBeenCalledWith('test-measure', {
      start: 'test-measure:start',
      end: 'test-measure:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Custom Success Track',
          tooltipText: 'Success: result',
          properties: [['Success', 'result']],
        },
      },
    });
  });
  it('should handle custom error handler', () => {
    const profiler = new Profiler();

    expect(() => {
      profiler.measure(
        'test-measure',
        () => {
          throw new Error('Test error');
        },
        {
          error: err => ({
            tooltipText: 'Custom error',
            properties: [['Custom', 'value']],
          }),
        },
      );
    }).toThrow('Test error');

    expect(performance.mark).toHaveBeenCalledTimes(2);
    expect(performance.measure).toHaveBeenCalledTimes(1);

    expect(performance.mark).toHaveBeenCalledWith('test-measure:start', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Main',
        },
      },
    });

    expect(performance.mark).toHaveBeenCalledWith('test-measure:end', {
      detail: {
        devtools: {
          dataType: 'track-entry',
          color: 'error',
          track: 'Main',
          properties: [
            ['Error Type', 'Error'],
            ['Error Message', 'Test error'],
          ],
        },
      },
    });

    expect(performance.measure).toHaveBeenCalledWith('test-measure', {
      start: 'test-measure:start',
      end: 'test-measure:end',
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Main',
          tooltipText: 'Custom error',
          properties: [['Custom', 'value']],
        },
      },
    });
  });
});
