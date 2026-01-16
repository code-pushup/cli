import type { JsonlFile } from './file-sink.js';

export type Encoder<T> = (value: T) => string;
export type Decoder<T> = (line: string) => T;

export type EncoderInterface<I, O> = {
  encode: (input: I) => O;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Sink<I = string | Buffer, O = unknown> = {
  setPath: (filePath: string) => void;
  getPath: () => string;
  open: () => void;
  write: (input: I) => void;
  close: () => void;
  isClosed: () => boolean;
};

export type Buffered = {
  flush: () => void;
};
export type BufferedSink<I, O> = Sink<I, O> & Buffered;

export type Source<I, O = unknown> = {
  read?: () => O;
  decode?: (input: I) => O;
};

export type Observer = {
  subscribe: () => void;
  unsubscribe: () => void;
  isSubscribed: () => boolean;
};

export type Recoverable<T> = {
  recover: () => RecoverResult<T>;
  repack: (outputPath?: string) => void;
};

export type RecoverResult<T = unknown> = {
  records: T[];
  errors: { lineNo: number; line: string; error: Error }[];
  partialTail: string | null;
};

export abstract class RecoverableEventSink<
  Raw extends Record<string, unknown>,
  Domain,
> {
  protected readonly sink: JsonlFile<Raw>;
  private finalized = false;

  constructor(sink: JsonlFile<Raw>) {
    this.sink = sink;
  }

  open() {
    this.sink.open();
  }

  write(event: Domain) {
    this.sink.write(this.encode(event));
  }

  close() {
    this.finalize();
  }

  recover(): RecoverResult<Domain> {
    const { records, errors, partialTail } = this.sink.recover();
    const out: Domain[] = [];
    const errs = [...errors];

    records.forEach((r, i) => {
      try {
        out.push(this.decode(r));
      } catch (error) {
        errs.push({
          lineNo: i + 1,
          line: JSON.stringify(r),
          error: error as Error,
        });
      }
    });

    return { records: out, errors: errs, partialTail };
  }

  finalize() {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    this.sink.close();
    this.onFinalize();
  }

  protected abstract encode(domain: Domain): Raw;
  protected abstract decode(raw: Raw): Domain;
  protected abstract onFinalize(): void;
}

export type RecoverOptions = {
  keepInvalid?: boolean;
};

export type Output<I, O> = {} & BufferedSink<I, O>;
