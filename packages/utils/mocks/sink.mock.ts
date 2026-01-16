import type {
  RecoverResult,
  Recoverable,
  Sink,
} from '../src/lib/sink-source.type';

export class MockSink implements Sink<string, string> {
  private writtenItems: string[] = [];
  private closed = false;

  open(): void {
    this.closed = false;
  }

  write(input: string): void {
    this.writtenItems.push(input);
  }

  close(): void {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  encode(input: string): string {
    return `${input}-${this.constructor.name}-encoded`;
  }

  getWrittenItems(): string[] {
    return [...this.writtenItems];
  }
}

export class MockRecoverableSink<T> extends MockSink implements Recoverable<T> {
  recover(): RecoverResult<T> {
    return {
      records: this.getWrittenItems() as T[],
      errors: [],
      partialTail: null,
    };
  }

  repack(): void {
    this.getWrittenItems().forEach(item => this.write(item));
  }

  finalize(): void {
    this.close();
  }
}
