import { WriteAheadLogFile } from '../src/lib/wal.js';
import type { Codec } from '../src/lib/wal.js';

export class MockFileSink implements WriteAheadLogFile<string> {
  private writtenItems: string[] = [];
  private closed = false;

  constructor(options?: { file?: string; codec?: Codec<string> }) {
    const file = options?.file || '/tmp/mock-sink.log';
    const codec = options?.codec || {
      encode: (input: string) => input,
      decode: (data: string) => data,
    };
  }

  #fd: number | null = null;

  get path(): string {
    return '/tmp/mock-sink.log';
  }

  getPath(): string {
    return this.path;
  }

  open(): void {
    this.#fd = 1; // Mock file descriptor
  }

  append(v: string): void {
    this.writtenItems.push(v);
  }

  close(): void {
    this.#fd = null;
    this.closed = true;
  }

  isClosed(): boolean {
    return this.#fd === null;
  }

  recover(): any {
    return {
      records: this.writtenItems,
      errors: [],
      partialTail: null,
    };
  }

  repack(): void {
    // Mock implementation - do nothing
  }

  getWrittenItems(): string[] {
    return [...this.writtenItems];
  }

  clearWrittenItems(): void {
    this.writtenItems = [];
  }
}
