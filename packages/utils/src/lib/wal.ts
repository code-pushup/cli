import * as fs from 'node:fs';
import path from 'node:path';

/**
 * Codec for encoding/decoding values to/from strings for WAL storage.
 * Used to serialize/deserialize records written to and read from WAL files.
 */
export type Codec<I, O = string> = {
  /** Encode a value to a string for storage */
  encode: (v: I) => O;
  /** Decode a string back to the original value type */
  decode: (data: O) => I;
};

export type InvalidEntry<O = string> = { __invalid: true; raw: O };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CodecInput<C> = C extends Codec<infer I, infer O> ? I : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CodecOutput<C> = C extends Codec<infer I, infer O> ? O : never;

export type TolerantCodec<C> = Codec<
  CodecInput<C> | InvalidEntry<CodecOutput<C>>,
  CodecOutput<C>
>;

export type WalRecord = object | string;

/**
 * Interface for sinks that can append items.
 * Allows for different types of appendable storage (WAL, in-memory, etc.)
 */
export type AppendableSink<T> = Recoverable & {
  append: (item: T) => void;
  isClosed: () => boolean;
  open?: () => void;
  close?: () => void;
};

/**
 * Result of recovering records from a WAL file.
 * Contains successfully recovered records and any errors encountered during parsing.
 */
export type RecoverResult<T> = {
  /** Successfully recovered records */
  records: (T | InvalidEntry)[];
  /** Errors encountered during recovery with line numbers and context */
  errors: { lineNo: number; line: string; error: Error }[];
  /** Last incomplete line if file was truncated (null if clean) */
  partialTail: string | null;
};

/**
 * Interface for sinks that support recovery operations.
 * Represents the recoverable subset of AppendableSink functionality.
 */
export type Recoverable = {
  recover: () => RecoverResult<unknown>;
  repack: (out?: string) => void;
  finalize?: (opt?: Record<string, unknown>) => void;
};

/**
 * Statistics about the WAL file state and last recovery operation.
 */
export type WalStats<T> = {
  /** File path for this WAL */
  filePath: string;
  /** Whether the WAL file is currently closed */
  isClosed: boolean;
  /** Last recovery state from the most recent {@link recover} or {@link repack} operation */
  lastRecovery: RecoverResult<T | InvalidEntry<string>> | null;
};

export const createTolerantCodec = <I, O = string>(codec: {
  encode: (v: I) => O;
  decode: (d: O) => I;
}): Codec<I | InvalidEntry<O>, O> => {
  const { encode, decode } = codec;

  return {
    encode: v =>
      v && typeof v === 'object' && '__invalid' in v
        ? (v as InvalidEntry<O>).raw
        : encode(v as I),
    decode: d => {
      try {
        return decode(d);
      } catch {
        return { __invalid: true, raw: d };
      }
    },
  };
};

export function filterValidRecords<T>(
  records: (T | InvalidEntry<unknown>)[],
): T[] {
  return records
    .filter(
      (r): r is T => !(typeof r === 'object' && r != null && '__invalid' in r),
    )
    .map(r => r as T);
}

/**
 * Pure helper function to recover records from WAL file content.
 * @param content - Raw file content as string
 * @param decode - function for decoding records
 * @returns Recovery result with records, errors, and partial tail
 */
export function recoverFromContent<T>(
  content: string,
  decode: Codec<T>['decode'],
): RecoverResult<T> {
  const lines = content.split('\n');
  const clean = content.endsWith('\n');

  const out = lines.slice(0, -1).reduce(
    (a, l, i) => {
      if (!l) {
        return a;
      }
      try {
        return {
          ...a,
          records: [...a.records, decode(l)],
        };
      } catch (error) {
        return {
          ...a,
          errors: [
            ...a.errors,
            { lineNo: i + 1, line: l, error: error as Error },
          ],
        };
      }
    },
    { records: [] as T[], errors: [] as RecoverResult<T>['errors'] },
  );

  const tail = lines.at(-1);
  return {
    ...out,
    partialTail: clean || !tail ? null : tail,
  };
}

/**
 * Write-Ahead Log implementation for crash-safe append-only logging.
 * Provides atomic operations for writing, recovering, and repacking log entries.
 */
export class WriteAheadLogFile<T extends WalRecord = WalRecord>
  implements AppendableSink<T>
{
  #fd: number | null = null;
  readonly #file: string;
  readonly #decode: Codec<T | InvalidEntry<string>>['decode'];
  readonly #encode: Codec<T>['encode'];
  #lastRecoveryState: RecoverResult<T | InvalidEntry<string>> | null = null;

  /**
   * Create a new WAL file instance.
   * @param options - Configuration options
   */
  constructor(options: { file: string; codec: Codec<T> }) {
    const { file, codec } = options;
    this.#file = file;
    const c = createTolerantCodec(codec);
    this.#decode = c.decode;
    this.#encode = c.encode;
  }

  /** Get the file path for this WAL */
  getPath = () => this.#file;

  /** Open the WAL file for writing (creates directories if needed) */
  open = () => {
    if (this.#fd) {
      return;
    }
    ensureDirectoryExistsSync(path.dirname(this.#file));
    this.#fd = fs.openSync(this.#file, 'a');
  };

  /**
   * Append a record to the WAL.
   * @param v - Record to append
   * @throws Error if WAL cannot be opened
   */
  append = (v: T) => {
    if (!this.#fd) {
      throw new Error('WAL not opened');
    }
    fs.writeSync(this.#fd, `${this.#encode(v)}\n`);
  };

  /** Close the WAL file */
  close = () => {
    if (this.#fd) {
      fs.closeSync(this.#fd);
    }
    this.#fd = null;
  };

  isClosed = () => this.#fd == null;

  /**
   * Recover all records from the WAL file.
   * Handles partial writes and decode errors gracefully.
   * Updates the recovery state (accessible via {@link getStats}).
   * @returns Recovery result with records, errors, and partial tail
   */
  recover(): RecoverResult<T | InvalidEntry<string>> {
    if (!fs.existsSync(this.#file)) {
      this.#lastRecoveryState = { records: [], errors: [], partialTail: null };
      return this.#lastRecoveryState;
    }
    const txt = fs.readFileSync(this.#file, 'utf8');
    this.#lastRecoveryState = recoverFromContent<T | InvalidEntry<string>>(
      txt,
      this.#decode,
    );

    return this.#lastRecoveryState;
  }

  /**
   * Repack the WAL by recovering all valid records and rewriting cleanly.
   * Removes corrupted entries and ensures clean formatting.
   * Updates the recovery state (accessible via {@link getStats}).
   * @param out - Output path (defaults to current file)
   */
  repack(out = this.#file) {
    this.close();
    const r = this.recover();
    if (r.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log('WAL repack encountered decode errors');
    }

    // Check if any records are invalid entries (from tolerant codec)
    const hasInvalidEntries = r.records.some(
      rec => typeof rec === 'object' && rec != null && '__invalid' in rec,
    );
    if (hasInvalidEntries) {
      // eslint-disable-next-line no-console
      console.log('Found invalid entries during WAL repack');
    }
    // Always filter out invalid entries when repacking
    const recordsToWrite = filterValidRecords(r.records);
    ensureDirectoryExistsSync(path.dirname(out));
    fs.writeFileSync(out, `${recordsToWrite.map(this.#encode).join('\n')}\n`);
  }

  /**
   * Get comprehensive statistics about the WAL file state.
   * Includes file information, open/close status, and last recovery state.
   * @returns Statistics object with file info and last recovery state
   */
  getStats(): WalStats<T> {
    return {
      filePath: this.#file,
      isClosed: this.#fd == null,
      lastRecovery: this.#lastRecoveryState,
    };
  }
}

/**
 * Format descriptor that binds codec and file extension together.
 * Prevents misconfiguration by keeping related concerns in one object.
 */
export type WalFormat<T extends WalRecord = WalRecord> = {
  /** Base name for the WAL (e.g., "trace") */
  baseName: string;
  /** Shard file extension (e.g., ".jsonl") */
  walExtension: string;
  /** Final file extension (e.g., ".json", ".trace.json") falls back to walExtension if not provided */
  finalExtension: string;
  /** Codec for encoding/decoding records */
  codec: Codec<T, string>;
  /** Finalizer for converting records to a string */
  finalizer: (records: T[], opt?: Record<string, unknown>) => string;
};

export type WalFormatWithInvalids<T extends WalRecord> = Omit<
  WalFormat<T>,
  'codec' | 'finalizer'
> & {
  codec: TolerantCodec<Codec<T, string>>;
  finalizer: (
    records: (T | InvalidEntry<string>)[],
    opt?: Record<string, unknown>,
  ) => string;
};

export const stringCodec = <T extends WalRecord = WalRecord>(): Codec<T> => ({
  encode: v => JSON.stringify(v),
  decode: v => {
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as unknown as T;
    }
  },
});

/**
 * Parses a partial WalFormat configuration and returns a complete WalFormat object.
 * All fallback values are targeting string types.
 *  - baseName defaults to 'wal'
 *  - walExtension defaults to '.log'
 *  - finalExtension defaults to '.log'
 *  - codec defaults to stringCodec<T>()
 *  - finalizer defaults to encoding each record using codec.encode() and joining with newlines.
 *    For object types, this properly JSON-stringifies them (not [object Object]).
 *    InvalidEntry records use their raw string value directly.
 * @param format - Partial WalFormat configuration
 * @returns Parsed WalFormat with defaults filled in
 */
export function parseWalFormat<T extends WalRecord = WalRecord>(
  format: Partial<WalFormat<T>>,
): WalFormat<T> {
  const {
    baseName = 'wal',
    walExtension = '.log',
    finalExtension = walExtension,
    codec = stringCodec<T>(),
    finalizer,
  } = format;

  return {
    baseName,
    walExtension,
    finalExtension,
    codec,
    finalizer:
      finalizer ??
      ((records, _opt) =>
        `${records.map(record => codec.encode(record)).join('\n')}\n`),
  };
}

/**
 * NOTE: this helper is only used in this file. The rest of the repo avoids sync methods so it is not reusable.
 * Ensures a directory exists, creating it recursively if necessary using sync methods.
 * @param dirPath - The directory path to ensure exists
 */
function ensureDirectoryExistsSync(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
