import type { AppendableSink, RecoverResult } from '../src/lib/wal';

export class MockAppendableSink implements AppendableSink<string> {
  private writtenItems: string[] = [];
  private closed = true;

  open = vi.fn((): void => {
    this.closed = false;
  });

  append = vi.fn((input: string): void => {
    this.writtenItems.push(input);
  });

  close = vi.fn((): void => {
    this.closed = true;
  });

  isClosed = vi.fn((): boolean => {
    return this.closed;
  });

  recover = vi.fn((): RecoverResult<string> => {
    return {
      records: [...this.writtenItems],
      errors: [],
      partialTail: null,
    };
  });

  repack = vi.fn((): void => {});

  encode = vi.fn((input: string): string => {
    return `${input}-${this.constructor.name}-encoded`;
  });

  getWrittenItems = vi.fn((): string[] => {
    return [...this.writtenItems];
  });
}

export class MockTraceEventFileSink extends MockAppendableSink {
  override recover = vi.fn((): RecoverResult<string> => {
    return {
      records: this.getWrittenItems(),
      errors: [],
      partialTail: null,
    };
  });

  repack = vi.fn((): void => {});

  finalize = vi.fn((): void => {});

  getPath = vi.fn((): string => {
    return '/test/tmp/profiles/default/trace.default.jsonl';
  });
}
