import fs from 'node:fs';
import path from 'node:path';
import type { Decoder, Encoder, RecoverResult } from './sink-source.type';

export type AppendOptions = {
  filePath: string;
};

export class AppendFileSink {
  #fd: number | null = null;

  constructor(private filePath: string) {}

  getPath() {
    return this.filePath;
  }
  setPath(filePath: string) {
    if (this.#fd != null) {
      throw new Error('Cannot change path while open');
    }
    this.filePath = filePath;
  }

  open() {
    if (this.#fd != null) {
      return;
    }

    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.#fd = fs.openSync(this.filePath, 'a');
  }

  write(line: string) {
    if (this.#fd == null) {
      throw new Error('Sink not opened');
    }
    fs.writeSync(this.#fd, `${line}\n`);
  }

  close() {
    if (this.#fd == null) {
      return;
    }
    fs.closeSync(this.#fd);
    this.#fd = null;
  }

  flush() {
    if (this.#fd != null) {
      fs.fsyncSync(this.#fd);
    }
  }

  isClosed() {
    return this.#fd == null;
  }

  *readAll(): Iterable<string> {
    if (!fs.existsSync(this.filePath)) {
      return;
    }

    const data = fs.readFileSync(this.filePath, 'utf8');
    yield* data
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => (line.endsWith('\r') ? line.slice(0, -1) : line));
  }

  recover(): {
    records: string[];
    errors: { lineNo: number; line: string; error: Error }[];
    partialTail: string | null;
  } {
    if (!fs.existsSync(this.filePath)) {
      return { records: [], errors: [], partialTail: null };
    }

    const data = fs.readFileSync(this.filePath, 'utf8');
    const lines = data.split('\n');
    const endsClean = data.endsWith('\n');

    const records: string[] = lines
      .slice(0, -1)
      .map(line => line?.replace(/\r$/, ''))
      .filter(Boolean);

    const lastLine = lines.at(-1);
    const partialTail =
      endsClean || lines.length === 0 || !lastLine
        ? null
        : lastLine.replace(/\r$/, '');

    return { records, errors: [], partialTail };
  }

  repack(outputPath = this.filePath) {
    if (!this.isClosed()) {
      throw new Error('Cannot repack while open');
    }

    const { records, partialTail } = this.recover();

    if (partialTail === null && outputPath === this.filePath) {
      return;
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, records.map(r => `${r}\n`).join(''));
  }
}

export class JsonlFile<T> {
  protected sink: AppendFileSink;

  constructor(
    filePath: string,
    private encode: Encoder<T>,
    private decode: Decoder<T>,
  ) {
    this.sink = new AppendFileSink(filePath);
  }
  open() {
    this.sink.open();
  }

  write(value: T) {
    this.sink.write(this.encode(value));
  }

  close() {
    this.sink.close();
  }

  *readAll(): Iterable<T> {
    yield* [...this.sink.readAll()].map(line => this.decode(line));
  }

  recover(): {
    records: T[];
    errors: { lineNo: number; line: string; error: Error }[];
    partialTail: string | null;
  } {
    const r = this.sink.recover();
    return {
      records: r.records.map(l => this.decode(l)),
      errors: r.errors,
      partialTail: r.partialTail,
    };
  }

  repack(outputPath?: string) {
    this.sink.repack(outputPath);
  }
}

export const JsonCodec = {
  encode: (v: unknown) => JSON.stringify(v),
  decode: (v: string) => JSON.parse(v),
};

export const StringCodec = {
  encode: (v: string) => v,
  decode: (v: string) => v,
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
