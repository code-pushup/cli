import { vi } from 'vitest';
import type {
  RecoverResult,
  Recoverable,
  Sink,
} from '../src/lib/sink-source.type';

export class MockSink implements Sink<string, string> {
  private writtenItems: string[] = [];
  private closed = true;

  open = vi.fn((): void => {
    this.closed = false;
  });

  write = vi.fn((input: string): void => {
    this.writtenItems.push(input);
  });

  close = vi.fn((): void => {
    this.closed = true;
  });

  isClosed = vi.fn((): boolean => {
    return this.closed;
  });

  encode = vi.fn((input: string): string => {
    return `${input}-${this.constructor.name}-encoded`;
  });

  getWrittenItems = vi.fn((): string[] => {
    return [...this.writtenItems];
  });
}

export class MockTraceEventFileSink extends MockSink implements Recoverable {
  recover = vi.fn(
    (): {
      records: unknown[];
      errors: { lineNo: number; line: string; error: Error }[];
      partialTail: string | null;
    } => {
      return {
        records: this.getWrittenItems(),
        errors: [],
        partialTail: null,
      } satisfies RecoverResult<string>;
    },
  );

  repack = vi.fn((): void => {});

  finalize = vi.fn((): void => {});
}
