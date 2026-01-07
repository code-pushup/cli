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
} from './user-timing-extensibility-api-utils.js';

describe('objToPropertiesPayload', () => {
  it('should convert object to properties array', () => {
    expect(
      objToPropertiesPayload({ key: 'value', number: 42, bool: true }),
    ).toStrictEqual([
      ['key', 'value'],
      ['number', 42],
      ['bool', true],
    ]);
  });

  it('should keep undefined values', () => {
    expect(
      objToPropertiesPayload({ key: 'value', undef: undefined }),
    ).toStrictEqual([
      ['key', 'value'],
      ['undef', undefined],
    ]);
  });

  it('should handle empty object', () => {
    expect(objToPropertiesPayload({})).toStrictEqual([]);
  });
});

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
    expect(
      mergePropertiesWithOverwrite(undefined, [['key', 'value']]),
    ).toStrictEqual([['key', 'value']]);
  });

  it('should handle undefined override properties', () => {
    expect(
      mergePropertiesWithOverwrite([['key', 'value']], undefined),
    ).toStrictEqual([['key', 'value']]);
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
        color: 'warning',
        tooltipText: 'warning occurred',
        properties: [['level', 'high']],
      }),
    ).toStrictEqual({
      dataType: 'track-entry',
      color: 'warning',
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
    expect(asOptions(null as any)).toStrictEqual({ detail: {} });
  });

  it('should return empty detail for undefined input', () => {
    expect(asOptions(undefined as any)).toStrictEqual({ detail: {} });
  });
});
