import { describe, expect, it } from 'vitest';
import {
  MARK_SUFFIX,
  defaultTrack,
  getEndMarkName,
  getMeasureControl,
  getMeasureMarkNames,
  getStartMarkName,
  getTrackControl,
} from './performance-utils.js';

describe('defaultTrack constant', () => {
  it('should have main track', () => {
    expect(defaultTrack).toStrictEqual({ track: 'Main' });
  });
});

describe('MARK_SUFFIX constant', () => {
  it('should have start and end suffixes', () => {
    expect(MARK_SUFFIX).toStrictEqual({
      START: ':start',
      END: ':end',
    });
  });
});

describe('getStartMarkName function', () => {
  it('should create start mark name without prefix', () => {
    expect(getStartMarkName('test')).toBe('test:start');
  });

  it('should create start mark name with prefix', () => {
    expect(getStartMarkName('test', 'prefix')).toBe('prefix:test:start');
  });
});

describe('getEndMarkName function', () => {
  it('should create end mark name without prefix', () => {
    expect(getEndMarkName('test')).toBe('test:end');
  });

  it('should create end mark name with prefix', () => {
    expect(getEndMarkName('test', 'prefix')).toBe('prefix:test:end');
  });
});

describe('getMeasureMarkNames function', () => {
  it('should create measure mark names without prefix', () => {
    expect(getMeasureMarkNames('test')).toStrictEqual({
      startName: 'test:start',
      endName: 'test:end',
      measureName: 'test',
    });
  });

  it('should create measure mark names with prefix', () => {
    expect(getMeasureMarkNames('test', 'prefix')).toStrictEqual({
      startName: 'prefix:test:start',
      endName: 'prefix:test:end',
      measureName: 'prefix:test',
    });
  });
});

describe('getMeasureControl function', () => {
  it('should create measure control without default prefix', () => {
    const control = getMeasureControl();
    expect(control.getNames('test')).toStrictEqual({
      startName: 'test:start',
      endName: 'test:end',
      measureName: 'test',
    });
  });

  it('should create measure control with default prefix', () => {
    const control = getMeasureControl('prefix');
    expect(control.getNames('test')).toStrictEqual({
      startName: 'prefix:test:start',
      endName: 'prefix:test:end',
      measureName: 'prefix:test',
    });
  });
});

describe('getTrackControl function', () => {
  it('should create track control with defaults', () => {
    const control = getTrackControl();
    expect(control.tracks).toStrictEqual({
      defaultTrack: { track: 'Main' },
    });
    expect(typeof control.errorHandler).toBe('function');
  });

  it('should create track control with custom default track', () => {
    const control = getTrackControl({
      defaultTrack: { track: 'Custom', color: 'primary' },
    });
    expect(control.tracks.defaultTrack).toStrictEqual({
      track: 'Custom',
      color: 'primary',
    });
  });

  it('should create track control with custom tracks', () => {
    const control = getTrackControl({
      tracks: {
        custom: { track: 'Custom Track', color: 'secondary' },
      },
    });
    expect(control.tracks).toStrictEqual({
      defaultTrack: { track: 'Main' },
      custom: { track: 'Custom Track', color: 'secondary' },
    });
  });

  it('should create track control with custom error handler', () => {
    const customErrorHandler = () => ({ error: 'custom' });
    const control = getTrackControl({ errorHandler: customErrorHandler });
    expect(control.errorHandler).toBe(customErrorHandler);
  });

  it('should merge all options correctly', () => {
    const customErrorHandler = () => ({ error: 'custom' });
    const control = getTrackControl({
      defaultTrack: { track: 'Custom Main', color: 'primary' },
      tracks: {
        plugin: { track: 'Plugin Track', color: 'secondary' },
      },
      errorHandler: customErrorHandler,
    });

    expect(control.tracks).toStrictEqual({
      defaultTrack: { track: 'Custom Main', color: 'primary' },
      plugin: { track: 'Plugin Track', color: 'secondary' },
    });
    expect(control.errorHandler).toBe(customErrorHandler);
  });
});
