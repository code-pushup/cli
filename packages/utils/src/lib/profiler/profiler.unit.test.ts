import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionTrackEntryPayload } from '../user-timing-extensibility-api.type.js';
import { Profiler } from './profiler.js';

describe('Profiler', () => {
  let profiler: Profiler<Record<string, ActionTrackEntryPayload>>;

  beforeEach(() => {
    // Environment variables are mocked in individual tests using vi.stubEnv

    profiler = new Profiler({
      prefix: 'test',
      track: 'test-track',
      color: 'primary',
      tracks: {},
    });
  });

  it('should initialize with default enabled state from env', () => {
    vi.stubEnv('CP_PROFILING', 'true');
    const profilerWithEnv = new Profiler({
      prefix: 'test',
      track: 'test-track',
      color: 'primary',
      tracks: {},
    });

    expect(profilerWithEnv.isEnabled()).toBe(true);
  });

  it('should override enabled state from options', () => {
    vi.stubEnv('CP_PROFILING', 'false');
    const profilerWithOverride = new Profiler({
      prefix: 'test',
      track: 'test-track',
      color: 'primary',
      tracks: {},
      enabled: true,
    });

    expect(profilerWithOverride.isEnabled()).toBe(true);
  });

  it('should setup tracks with defaults merged', () => {
    const profilerWithTracks = new Profiler({
      prefix: 'test',
      track: 'default-track',
      trackGroup: 'default-group',
      color: 'primary',
      tracks: {
        custom: { track: 'custom-track', color: 'secondary' },
        partial: { color: 'tertiary' }, // partial override
      },
    });

    expect(profilerWithTracks.tracks.custom).toEqual({
      track: 'custom-track',
      trackGroup: 'default-group',
      color: 'secondary',
      dataType: 'track-entry',
    });

    expect(profilerWithTracks.tracks.partial).toEqual({
      track: 'default-track', // inherited from defaults
      trackGroup: 'default-group',
      color: 'tertiary', // overridden
      dataType: 'track-entry',
    });
  });

  it('should set and get enabled state', () => {
    expect(profiler.isEnabled()).toBe(false);

    profiler.setEnabled(true);
    expect(profiler.isEnabled()).toBe(true);

    profiler.setEnabled(false);
    expect(profiler.isEnabled()).toBe(false);
  });

  it('should update environment variable', () => {
    profiler.setEnabled(true);
    expect(process.env.CP_PROFILING).toBe('true');

    profiler.setEnabled(false);
    expect(process.env.CP_PROFILING).toBe('false');
  });

  it('should execute marker without error when enabled', () => {
    profiler.setEnabled(true);

    expect(() => {
      profiler.marker('test-marker', {
        color: 'primary',
        tooltipText: 'Test marker',
        properties: [['key', 'value']],
      });
    }).not.toThrow();
  });

  it('should execute marker without error when disabled', () => {
    profiler.setEnabled(false);

    expect(() => {
      profiler.marker('test-marker');
    }).not.toThrow();
  });

  it('should execute work and return result when measure enabled', () => {
    profiler.setEnabled(true);

    const workFn = vi.fn(() => 'result');
    const result = profiler.measure('test-event', workFn);

    expect(result).toBe('result');
    expect(workFn).toHaveBeenCalled();
  });

  it('should execute work directly when measure disabled', () => {
    profiler.setEnabled(false);

    const workFn = vi.fn(() => 'result');
    const result = profiler.measure('test-event', workFn);

    expect(result).toBe('result');
    expect(workFn).toHaveBeenCalled();
  });

  it('should propagate errors when measure enabled', () => {
    profiler.setEnabled(true);

    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profiler.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('should propagate errors when measure disabled', () => {
    profiler.setEnabled(false);

    const error = new Error('Test error');
    const workFn = vi.fn(() => {
      throw error;
    });

    expect(() => profiler.measure('test-event', workFn)).toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('should handle async operations correctly when enabled', async () => {
    profiler.setEnabled(true);

    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await profiler.measureAsync('test-async-event', workFn);

    expect(result).toBe('async-result');
    expect(workFn).toHaveBeenCalled();
  });

  it('should execute async work directly when disabled', async () => {
    profiler.setEnabled(false);

    const workFn = vi.fn(async () => {
      await Promise.resolve();
      return 'async-result';
    });

    const result = await profiler.measureAsync('test-async-event', workFn);

    expect(result).toBe('async-result');
    expect(workFn).toHaveBeenCalled();
  });

  it('should propagate async errors when enabled', async () => {
    profiler.setEnabled(true);

    const error = new Error('Async test error');
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      throw error;
    });

    await expect(
      profiler.measureAsync('test-async-event', workFn),
    ).rejects.toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });

  it('should propagate async errors when disabled', async () => {
    profiler.setEnabled(false);

    const error = new Error('Async test error');
    const workFn = vi.fn(async () => {
      await Promise.resolve();
      throw error;
    });

    await expect(
      profiler.measureAsync('test-async-event', workFn),
    ).rejects.toThrow(error);
    expect(workFn).toHaveBeenCalled();
  });
});
