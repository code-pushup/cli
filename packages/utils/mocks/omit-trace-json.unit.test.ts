import { vol } from 'memfs';
import { expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import type { TraceEvent } from '../src/lib/profiler/trace-file.type';
import {
  loadAndOmitTraceJson,
  loadAndOmitTraceJsonl,
  normalizeAndFormatEvents,
} from './omit-trace-json.js';

describe('normalizeAndFormatEvents', () => {
  it('should return empty string unchanged', () => {
    expect(normalizeAndFormatEvents('')).toBe('');
  });

  it('should return whitespace-only string unchanged', () => {
    expect(normalizeAndFormatEvents('   \n\t  ')).toBe('   \n\t  ');
  });

  it('should return empty JSONL unchanged', () => {
    expect(normalizeAndFormatEvents('\n\n')).toBe('\n\n');
  });

  it('should normalize single event with all fields', () => {
    expect(
      normalizeAndFormatEvents(
        '{"pid":12345,"tid":999,"ts":1234567890,"id2":{"local":"0xabc123"},"name":"test"}\n',
      ),
    ).toBe(
      '{"pid":10001,"tid":1,"ts":1700000005000000,"id2":{"local":"0x1"},"name":"test"}\n',
    );
  });

  it('should normalize ts field with custom baseTimestampUs', () => {
    const customBase = 2_000_000_000_000_000;
    expect(
      normalizeAndFormatEvents('{"ts":1234567890}\n', {
        baseTimestampUs: customBase,
      }),
    ).toBe('{"ts":2000000000000000}\n');
  });

  it('should preserve event order when timestamps are out of order', () => {
    const input =
      '{"ts":300,"name":"third"}\n{"ts":100,"name":"first"}\n{"ts":200,"name":"second"}\n';
    expect(normalizeAndFormatEvents(input)).toBe(
      '{"ts":1700000005000200,"name":"third"}\n{"ts":1700000005000000,"name":"first"}\n{"ts":1700000005000100,"name":"second"}\n',
    );
  });

  it('should preserve event order when PIDs are out of order', () => {
    const input =
      '{"pid":300,"name":"third"}\n{"pid":100,"name":"first"}\n{"pid":200,"name":"second"}\n';
    expect(normalizeAndFormatEvents(input)).toBe(
      '{"pid":10003,"name":"third"}\n{"pid":10001,"name":"first"}\n{"pid":10002,"name":"second"}\n',
    );
  });

  it('should handle decoding of instantEvents with args.data.detail', () => {
    const rawInstantEvent: TraceEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'plugin-eslint:run-eslint:start',
      pid: 8057,
      tid: 0,
      ts: 1769814970883535,
      args: {
        data: {
          detail:
            '{"devtools":{"dataType":"track-entry","track":"External","trackGroup":"<✓> Code PushUp","color":"secondary"}}',
        },
      },
    };

    expect(normalizeAndFormatEvents([rawInstantEvent])).toStrictEqual([
      {
        cat: 'blink.user_timing',
        ph: 'i',
        name: 'plugin-eslint:run-eslint:start',
        pid: 10_001,
        tid: 1,
        ts: 1_700_000_005_000_000,
        args: {
          data: {
            detail: {
              devtools: {
                dataType: 'track-entry',
                track: 'External',
                trackGroup: '<✓> Code PushUp',
                color: 'secondary',
              },
            },
          },
        },
      },
    ]);
  });

  it('should handle decoding of spanEvents with args.detail', () => {
    const rawSpanEvent = {
      cat: 'blink.user_timing',
      s: 't',
      ph: 'b' as const,
      name: 'plugin-eslint:run-eslint',
      pid: 8057,
      tid: 0,
      ts: 1769814970883536,
      id2: { local: '0x3' },
      args: {
        detail:
          '{"devtools":{"dataType":"track-entry","track":"External","trackGroup":"<✓> Code PushUp","color":"secondary"}}',
      },
    } as TraceEvent;

    expect(normalizeAndFormatEvents([rawSpanEvent])).toStrictEqual([
      {
        cat: 'blink.user_timing',
        s: 't',
        ph: 'b',
        name: 'plugin-eslint:run-eslint',
        pid: 10_001,
        tid: 1,
        ts: 1_700_000_005_000_000,
        id2: { local: '0x1' },
        args: {
          detail: {
            devtools: {
              dataType: 'track-entry',
              track: 'External',
              trackGroup: '<✓> Code PushUp',
              color: 'secondary',
            },
          },
        },
      },
    ]);
  });

  it('should handle events with frame normalization', () => {
    const rawEvent = {
      cat: 'devtools.timeline',
      s: 't',
      ph: 'i' as const,
      name: 'TracingStartedInBrowser',
      pid: 8057,
      tid: 0,
      ts: 1769814970882268,
      args: {
        data: {
          frameTreeNodeId: 805700,
          frames: [
            {
              frame: 'FRAME0P8057T0',
              isInPrimaryMainFrame: true,
              processId: 8057,
              url: 'trace.json',
            },
          ],
        },
      },
    } as TraceEvent;

    expect(normalizeAndFormatEvents([rawEvent])).toStrictEqual([
      {
        cat: 'devtools.timeline',
        s: 't',
        ph: 'i',
        name: 'TracingStartedInBrowser',
        pid: 10_001,
        tid: 1,
        ts: 1_700_000_005_000_000,
        args: {
          data: {
            frameTreeNodeId: 1_000_101, // 10001 + '0' + 1
            frames: [
              {
                frame: 'FRAME0P10001T1',
                isInPrimaryMainFrame: true,
                processId: 10_001,
                url: 'trace.json',
              },
            ],
          },
        },
      },
    ]);
  });

  it('should handle multiple events with different pid/tid/ts/id2', () => {
    const events = [
      {
        cat: 'test',
        ph: 'i' as const,
        pid: 100,
        tid: 5,
        ts: 100,
        name: 'first',
      },
      {
        cat: 'test',
        ph: 'b' as const,
        pid: 200,
        tid: 3,
        ts: 300,
        name: 'second',
        id2: { local: '0xabc' },
      },
      {
        cat: 'test',
        ph: 'b' as const,
        pid: 150,
        tid: 7,
        ts: 200,
        name: 'third',
        id2: { local: '0xdef' },
      },
    ] as TraceEvent[];

    expect(normalizeAndFormatEvents(events)).toStrictEqual([
      {
        cat: 'test',
        ph: 'i',
        pid: 10_001,
        tid: 2,
        ts: 1_700_000_005_000_000,
        name: 'first',
      }, // pid 100->10001, tid 5->2 (sorted: 3->1, 5->2, 7->3)
      {
        cat: 'test',
        ph: 'b',
        pid: 10_003,
        tid: 1,
        ts: 1_700_000_005_000_200,
        name: 'second',
        id2: { local: '0x1' },
      }, // pid 200->10003, tid 3->1
      {
        cat: 'test',
        ph: 'b',
        pid: 10_002,
        tid: 3,
        ts: 1_700_000_005_000_100,
        name: 'third',
        id2: { local: '0x2' },
      }, // pid 150->10002, tid 7->3
    ]);
  });

  it('should handle empty array', () => {
    expect(normalizeAndFormatEvents([])).toStrictEqual([]);
  });

  it('should handle events with both args.detail and args.data.detail', () => {
    const rawEvent: TraceEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test',
      pid: 8057,
      tid: 0,
      ts: 1769814970883535,
      args: {
        detail: '{"type":"mark"}',
        data: { detail: '{"type":"span"}' },
      },
    };

    expect(normalizeAndFormatEvents([rawEvent])).toStrictEqual([
      {
        cat: 'blink.user_timing',
        ph: 'i',
        name: 'test',
        pid: 10_001,
        tid: 1,
        ts: 1_700_000_005_000_000,
        args: {
          detail: { type: 'mark' },
          data: { detail: { type: 'span' } },
        },
      },
    ]);
  });
});

describe('loadAndOmitTraceJsonl', () => {
  it('should load and normalize JSONL file', async () => {
    vol.fromJSON(
      {
        'trace.jsonl':
          '{"pid":12345,"tid":999,"ts":1234567890,"name":"test"}\n{"pid":54321,"tid":888,"ts":9876543210,"name":"test2"}\n',
      },
      MEMFS_VOLUME,
    );

    await expect(loadAndOmitTraceJsonl('trace.jsonl')).resolves.toStrictEqual([
      { pid: 10_001, tid: 2, ts: 1_700_000_005_000_000, name: 'test' }, // tid 999 maps to 2 (sorted: 888->1, 999->2)
      { pid: 10_002, tid: 1, ts: 1_700_000_005_000_100, name: 'test2' }, // tid 888 maps to 1
    ]);
  });

  it('should decode args.detail and args.data.detail from JSONL', async () => {
    vol.fromJSON(
      {
        'trace.jsonl':
          '{"pid":8057,"tid":0,"ts":1769814970883535,"args":{"data":{"detail":"{\\"devtools\\":{\\"dataType\\":\\"track-entry\\"}}"}}}\n{"pid":8057,"tid":0,"ts":1769814970883536,"args":{"detail":"{\\"devtools\\":{\\"dataType\\":\\"track-entry\\"}}"}}\n',
      },
      MEMFS_VOLUME,
    );

    await expect(loadAndOmitTraceJsonl('trace.jsonl')).resolves.toStrictEqual([
      {
        pid: 10_001,
        tid: 1,
        ts: 1_700_000_005_000_000,
        args: { data: { detail: { devtools: { dataType: 'track-entry' } } } },
      },
      {
        pid: 10_001,
        tid: 1,
        ts: 1_700_000_005_000_100,
        args: { detail: { devtools: { dataType: 'track-entry' } } },
      },
    ]);
  });

  it('should use custom baseTimestampUs', async () => {
    vol.fromJSON(
      {
        'trace.jsonl': '{"ts":1234567890}\n',
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadAndOmitTraceJsonl('trace.jsonl', {
        baseTimestampUs: 2_000_000_000_000_000,
      }),
    ).resolves.toStrictEqual([{ ts: 2_000_000_000_000_000 }]);
  });
});

describe('loadAndOmitTraceJson', () => {
  it('should load and normalize single trace container', async () => {
    vol.fromJSON(
      {
        'trace.json': JSON.stringify({
          traceEvents: [
            { pid: 8057, tid: 0, ts: 1769814970882268, name: 'test' },
          ],
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(loadAndOmitTraceJson('trace.json')).resolves.toStrictEqual({
      traceEvents: [
        { pid: 10_001, tid: 1, ts: 1_700_000_005_000_000, name: 'test' },
      ],
    });
  });

  it('should normalize metadata timestamps', async () => {
    vol.fromJSON(
      {
        'trace.json': JSON.stringify({
          metadata: {
            generatedAt: '2025-01-01T00:00:00.000Z',
            startTime: '2025-01-01T00:00:00.000Z',
            other: 'value',
          },
          traceEvents: [],
        }),
      },
      MEMFS_VOLUME,
    );

    const result = await loadAndOmitTraceJson('trace.json');
    expect(result).toStrictEqual({
      traceEvents: [],
      metadata: {
        generatedAt: '2026-01-28T14:29:27.995Z',
        startTime: '2026-01-28T14:29:27.995Z',
        other: 'value',
      },
    });
  });

  it('should use custom baseTimestampUs', async () => {
    vol.fromJSON(
      {
        'trace.json': JSON.stringify({
          traceEvents: [{ ts: 1234567890 }],
        }),
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadAndOmitTraceJson('trace.json', {
        baseTimestampUs: 2_000_000_000_000_000,
      }),
    ).resolves.toStrictEqual({
      traceEvents: [{ ts: 2_000_000_000_000_000 }],
    });
  });
});
