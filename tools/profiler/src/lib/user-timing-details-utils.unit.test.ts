import { describe, expect, it } from 'vitest';
import {
  asOptions,
  errorToDevToolsProperties,
  errorToEntryMeta,
  errorToMarkerPayload,
  errorToTrackEntryPayload,
  markerErrorPayload,
  markerPayload,
  mergePropertiesWithOverwrite,
  objToPropertiesPayload,
  trackEntryErrorPayload,
  trackEntryPayload,
} from './user-timing-details-utils.js';

describe('objToPropertiesPayload function', () => {
  it('should convert object to properties array', () => {
    const obj = { key: 'value', number: 42, bool: true };
    expect(objToPropertiesPayload(obj)).toStrictEqual([
      ['key', 'value'],
      ['number', 42],
      ['bool', true],
    ]);
  });

  it('should handle undefined values', () => {
    const obj = { key: 'value', undef: undefined };
    expect(objToPropertiesPayload(obj)).toStrictEqual([
      ['key', 'value'],
      ['undef', undefined],
    ]);
  });

  it('should handle empty object', () => {
    expect(objToPropertiesPayload({})).toStrictEqual([]);
  });
});

describe('mergePropertiesWithOverwrite function', () => {
  it('should merge properties with overwrite', () => {
    const base: any = [
      ['key1', 'value1'],
      ['key2', 'value2'],
    ];
    const override: any = [
      ['key2', 'overwritten'],
      ['key3', 'value3'],
    ];
    expect(mergePropertiesWithOverwrite(base, override)).toStrictEqual([
      ['key1', 'value1'],
      ['key2', 'overwritten'],
      ['key3', 'value3'],
    ]);
  });

  it('should handle undefined base properties', () => {
    const override: any = [['key', 'value']];
    expect(mergePropertiesWithOverwrite(undefined, override)).toStrictEqual([
      ['key', 'value'],
    ]);
  });

  it('should handle undefined override properties', () => {
    const base: any = [['key', 'value']];
    expect(mergePropertiesWithOverwrite(base, undefined)).toStrictEqual([
      ['key', 'value'],
    ]);
  });
});

describe('markerPayload function', () => {
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
      }),
    ).toStrictEqual({
      dataType: 'marker',
      color: 'primary',
      tooltipText: 'test tooltip',
    });
  });
});

describe('trackEntryPayload function', () => {
  it('should create track entry payload with defaults', () => {
    expect(trackEntryPayload({})).toStrictEqual({
      dataType: 'track-entry',
      track: 'Main',
    });
  });

  it('should create track entry payload with custom track', () => {
    expect(trackEntryPayload({ track: 'Custom' })).toStrictEqual({
      dataType: 'track-entry',
      track: 'Custom',
    });
  });

  it('should create track entry payload with all options', () => {
    expect(
      trackEntryPayload({
        track: 'Custom',
        color: 'primary',
        tooltipText: 'test',
        properties: [['key', 'value']],
      }),
    ).toStrictEqual({
      dataType: 'track-entry',
      track: 'Custom',
      color: 'primary',
      tooltipText: 'test',
      properties: [['key', 'value']],
    });
  });
});

describe('markerErrorPayload function', () => {
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

  it('should create error marker payload with custom color', () => {
    expect(markerErrorPayload({}, 'warning')).toStrictEqual({
      dataType: 'marker',
      color: 'warning',
    });
  });
});

describe('trackEntryErrorPayload function', () => {
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
        track: 'Test',
        color: 'warning',
        tooltipText: 'warning occurred',
        properties: [['level', 'high']],
      }),
    ).toStrictEqual({
      dataType: 'track-entry',
      color: 'warning',
      track: 'Test',
      tooltipText: 'warning occurred',
      properties: [['level', 'high']],
    });
  });
});

describe('errorToDevToolsProperties function', () => {
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

  it('should handle null and undefined', () => {
    expect(errorToDevToolsProperties(null)).toStrictEqual([
      ['Error Type', 'UnknownError'],
      ['Error Message', 'null'],
    ]);
    expect(errorToDevToolsProperties(undefined)).toStrictEqual([
      ['Error Type', 'UnknownError'],
      ['Error Message', 'undefined'],
    ]);
  });
});

describe('errorToEntryMeta function', () => {
  it('should convert error to entry meta with defaults', () => {
    const error = new Error('test error');
    const result = errorToEntryMeta(error);
    expect(result.properties).toStrictEqual([
      ['Error Type', 'Error'],
      ['Error Message', 'test error'],
    ]);
    expect(result.tooltipText).toBeUndefined();
  });

  it('should convert error to entry meta with custom options', () => {
    const error = new Error('test error');
    const result = errorToEntryMeta(error, {
      tooltipText: 'Custom tooltip',
      properties: [['custom', 'value']],
    });
    expect(result.properties).toStrictEqual([
      ['Error Type', 'Error'],
      ['Error Message', 'test error'],
      ['custom', 'value'],
    ]);
    expect(result.tooltipText).toBe('Custom tooltip');
  });

  it('should handle error without properties', () => {
    const error = new Error('test error');
    const result = errorToEntryMeta(error, { properties: [] });
    expect(result.properties).toStrictEqual([
      ['Error Type', 'Error'],
      ['Error Message', 'test error'],
    ]);
  });
});

describe('errorToTrackEntryPayload function', () => {
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
});

describe('errorToMarkerPayload function', () => {
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
      color: 'warning',
    });
    expect(result).toStrictEqual({
      dataType: 'marker',
      color: 'warning',
      tooltipText: 'Custom tooltip',
      properties: [
        ['Error Type', 'Error'],
        ['Error Message', 'test error'],
        ['custom', 'value'],
      ],
    });
  });
});

describe('asOptions function', () => {
  it('should convert marker payload to mark options', () => {
    const payload = markerPayload({ color: 'primary' });
    expect(asOptions(payload)).toStrictEqual({
      detail: { devtools: payload },
    });
  });

  it('should convert track entry payload to measure options', () => {
    const payload = trackEntryPayload({ track: 'Custom' });
    expect(asOptions(payload)).toStrictEqual({
      detail: { devtools: payload },
    });
  });

  it('should return empty detail for falsy input', () => {
    expect(asOptions(null as any)).toStrictEqual({ detail: {} });
    expect(asOptions(undefined as any)).toStrictEqual({ detail: {} });
  });
});
