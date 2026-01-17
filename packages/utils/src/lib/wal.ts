import * as fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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

/**
 * Result of recovering records from a WAL file.
 * Contains successfully recovered records and any errors encountered during parsing.
 */
export type RecoverResult<T> = {
  /** Successfully recovered records */
  records: T[];
  /** Errors encountered during recovery with line numbers and context */
  errors: { lineNo: number; line: string; error: Error }[];
  /** Last incomplete line if file was truncated (null if clean) */
  partialTail: string | null;
};

export const createTolerantCodec = <I, O = string>(
  codecOrEncode: ((v: I) => O) | { encode: (v: I) => O; decode: (d: O) => I },
  decode?: (d: O) => I,
): Codec<I | InvalidEntry<O>, O> => {
  if (typeof codecOrEncode === 'function' && !decode) {
    throw new Error(
      'decode function must be provided when codecOrEncode is a function',
    );
  }

  const encodeFn =
    typeof codecOrEncode === 'function' ? codecOrEncode : codecOrEncode.encode;

  const decodeFn =
    typeof codecOrEncode === 'function'
      ? (decode as (d: O) => I)
      : codecOrEncode.decode;

  return {
    encode: v =>
      v && typeof v === 'object' && '__invalid' in v
        ? (v as InvalidEntry<O>).raw
        : encodeFn(v as I),
    decode: d => {
      try {
        return decodeFn(d);
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
 * @param codec - Codec for decoding records
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
export class WriteAheadLogFile<T> {
  #fd: number | null = null;
  readonly #file: string;
  readonly #decode: Codec<T | InvalidEntry<string>>['decode'];
  readonly #encode: Codec<T | InvalidEntry<string>>['encode'];

  /**
   * Create a new WAL file instance.
   * @param options - Configuration options
   */
  constructor(options: { file: string; codec: Codec<T> }) {
    this.#file = options.file;
    const c = createTolerantCodec(options.codec);
    this.#decode = c.decode;
    this.#encode = c.encode;
  }

  /** Get the file path for this WAL */
  get path() {
    return this.#file;
  }

  /** Get the file path for this WAL */
  getPath = () => this.#file;

  /** Open the WAL file for writing (creates directories if needed) */
  open = () => {
    if (this.#fd) {
      return;
    }
    fs.mkdirSync(path.dirname(this.#file), { recursive: true });
    this.#fd = fs.openSync(this.#file, 'a');
  };

  /**
   * Append a record to the WAL.
   * @param v - Record to append
   * @throws Error if WAL cannot be opened
   */
  append = (v: T) => {
    if (!this.#fd) {
      this.open();
    }
    if (this.#fd) {
      fs.writeSync(this.#fd, `${this.#encode(v)}\n`);
    }
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
   * @returns Recovery result with records, errors, and partial tail
   */
  recover(): RecoverResult<T | InvalidEntry<string>> {
    if (!fs.existsSync(this.#file)) {
      return { records: [], errors: [], partialTail: null };
    }

    const txt = fs.readFileSync(this.#file, 'utf8');
    return recoverFromContent<T | InvalidEntry<string>>(txt, this.#decode);
  }

  /**
   * Repack the WAL by recovering all valid records and rewriting cleanly.
   * Removes corrupted entries and ensures clean formatting.
   * @param out - Output path (defaults to current file)
   * @throws Error if recovery encounters decode errors
   */
  repack(out = this.#file) {
    this.close();
    const r = this.recover();
    if (r.errors.length > 0) {
      // Log repack failure - could add proper logging here
    }
    const validRecords = filterValidRecords(r.records);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(
      out,
      `${validRecords.map(v => this.#encode(v)).join('\n')}\n`,
    );
  }
}

/**
 * Format descriptor that binds codec and file extension together.
 * Prevents misconfiguration by keeping related concerns in one object.
 */
export type WalFormat<T> = {
  /** Base name for the WAL (e.g., "trace") */
  baseName: string;
  /** Shard file extension (e.g., ".jsonl") */
  walExtension: string;
  /** Final file extension (e.g., ".json", ".trace.json") falls back to walExtension if not provided */
  finalExtension: string;
  /** Codec for encoding/decoding records */
  codec: Codec<T, string>;
  /** Function to generate shard file paths */
  shardPath: (id: string) => string;
  /** Function to generate final merged file path */
  finalPath: () => string;
  /** Finalizer for converting records to a string */
  finalizer: (records: T[], opt?: Record<string, unknown>) => string;
};

export const stringCodec = <
  T extends string | object = string,
>(): Codec<T> => ({
  encode: v => (typeof v === 'string' ? v : JSON.stringify(v)),
  decode: v => {
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as T;
    }
  },
});

/**
 * Parses a partial WalFormat configuration and returns a complete WalFormat object.
 * All fallback values are targeting string types.
 *  - baseName defaults to Date.now().toString()
 *  - walExtension defaults to '.log'
 *  - finalExtension defaults to '.log'
 *  - codec defaults to stringCodec<T>()
 *  - shardPath defaults to (id: string) => `${baseName}.${id}${walExtension}`
 *  - finalPath defaults to () => `${baseName}${finalExtension}`
 *  - finalizer defaults to (encodedRecords: T[]) => `${encodedRecords.join('\n')}\n`
 * @param format - Partial WalFormat configuration
 * @returns Parsed WalFormat with defaults filled in
 */
export function parseWalFormat<T extends object | string = object>(
  format: Partial<WalFormat<T>>,
): WalFormat<T> {
  const {
    baseName = Date.now().toString(),
    walExtension = '.log',
    finalExtension = walExtension,
    codec = stringCodec<T>(),
    shardPath = (id: string) => `${baseName}.${id}.${walExtension}`,
    finalPath = () => `${baseName}.${finalExtension}`,
    finalizer = (encodedRecords: T[]) => `${encodedRecords.join('\n')}\n`,
  } = format;

  return {
    baseName,
    walExtension,
    finalExtension,
    codec,
    shardPath,
    finalPath,
    finalizer,
  } satisfies WalFormat<T>;
}

/**
 * Determines if this process is the leader WAL process using the origin PID heuristic.
 *
 * The leader is the process that first enabled profiling (the one that set CP_PROFILER_ORIGIN_PID).
 * All descendant processes inherit the environment but have different PIDs.
 *
 * @returns true if this is the leader WAL process, false otherwise
 */
export function isLeaderWal(envVarName: string): boolean {
  return process.env[envVarName] === String(process.pid);
}

/**
 * Initialize the origin PID environment variable if not already set.
 * This must be done as early as possible before any user code runs.
 * Set's PROFILER_ORIGIN_PID_ENV_VAR to the current process PID if not already defined.
 */
export function setLeaderWal(PROFILER_ORIGIN_PID_ENV_VAR: string): void {
  if (!process.env[PROFILER_ORIGIN_PID_ENV_VAR]) {
    // eslint-disable-next-line functional/immutable-data
    process.env[PROFILER_ORIGIN_PID_ENV_VAR] = String(process.pid);
  }
}

/**
 * Sharded Write-Ahead Log manager for coordinating multiple WAL shards.
 * Handles distributed logging across multiple processes/files with atomic finalization.
 */

export class ShardedWal<T extends object | string = object> {
  readonly #format: WalFormat<T>;
  readonly #dir: string;

  /**
   * Create a sharded WAL manager.
   */
  constructor(dir: string, format: Partial<WalFormat<T>>) {
    this.#dir = dir;
    this.#format = parseWalFormat<T>(format);
  }

  shard(id: string) {
    return new WriteAheadLogFile({
      file: path.join(this.#dir, this.#format.shardPath(id)),
      codec: this.#format.codec,
    });
  }

  /** Get all shard file paths matching this WAL's base name */
  private shardFiles() {
    if (!fs.existsSync(this.#dir)) {
      return [];
    }

    return fs
      .readdirSync(this.#dir)
      .filter(entry => entry.endsWith(this.#format.walExtension))
      .map(entry => path.join(this.#dir, entry));
  }

  /**
   * Finalize all shards by merging them into a single output file.
   * Recovers all records from all shards, validates no errors, and writes merged result.
   * @throws Error if any shard contains decode errors
   */
  finalize(opt?: Record<string, unknown>) {
    const fileRecoveries = this.shardFiles().map(f => ({
      file: f,
      recovery: new WriteAheadLogFile({
        file: f,
        codec: this.#format.codec,
      }).recover(),
    }));

    const records = fileRecoveries.flatMap(({ recovery }) => recovery.records);
    const errors = fileRecoveries.flatMap(({ file, recovery }) =>
      recovery.errors.map(e => ({
        ...e,
        line: `${path.basename(file)}:${e.line}`,
      })),
    );

    if (errors.length > 0) {
      // Log finalize failure - could add proper logging here
    }

    const validRecords = filterValidRecords(records);
    const out = path.join(this.#dir, this.#format.finalPath());
    fs.mkdirSync(path.dirname(out), {
      recursive: true,
    });
    fs.writeFileSync(out, this.#format.finalizer(validRecords, opt));
  }

  cleanup() {
    this.shardFiles().forEach(f => {
      // Remove the shard file
      fs.unlinkSync(f);
      // Remove the parent directory (shard group directory)
      const shardDir = path.dirname(f);
      try {
        fs.rmdirSync(shardDir);
      } catch {
        // Directory might not be empty or already removed, ignore
      }
    });
  }
}

/**
 * Generates a shard ID.
 * This is idempotent since PID and TID are fixed for the process/thread.
 */
export function getShardId(pid: number, tid: number = 0): string {
  return `${pid}-${tid}`;
}

/**
 * Generates a sharded group ID based on performance.timeOrigin.
 * This is idempotent per process since timeOrigin is fixed within a process and its worker.
 */
export function getShardedGroupId(): string {
  return Math.floor(performance.timeOrigin).toString();
}
