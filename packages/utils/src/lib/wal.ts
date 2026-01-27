/* eslint-disable max-lines */
import * as fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { threadId } from 'node:worker_threads';

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
 * Interface for sinks that support recovery operations.
 * Represents the recoverable subset of AppendableSink functionality.
 */
export type Recoverable = {
  recover: () => RecoverResult<unknown>;
  repack: (out?: string) => void;
  finalize?: (opt?: Record<string, unknown>) => void;
};

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

/**
 * Statistics about the WAL file state and last recovery operation.
 */
export type WalStats<T> = {
  /** File path for this WAL */
  filePath: string;
  /** Whether the WAL file is currently closed */
  isClosed: boolean;
  /** Whether the WAL file exists on disk */
  fileExists: boolean;
  /** File size in bytes (0 if file doesn't exist) */
  fileSize: number;
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
export class WriteAheadLogFile<T> implements AppendableSink<T> {
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
    this.#file = options.file;
    const c = createTolerantCodec(options.codec);
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
    const recordsToWrite = hasInvalidEntries
      ? (r.records as T[])
      : filterValidRecords(r.records);
    ensureDirectoryExistsSync(path.dirname(out));
    fs.writeFileSync(out, `${recordsToWrite.map(this.#encode).join('\n')}\n`);
  }

  /**
   * Get comprehensive statistics about the WAL file state.
   * Includes file information, open/close status, and last recovery state.
   * @returns Statistics object with file info and last recovery state
   */
  getStats(): WalStats<T> {
    const fileExists = fs.existsSync(this.#file);
    return {
      filePath: this.#file,
      isClosed: this.#fd == null,
      fileExists,
      fileSize: fileExists ? fs.statSync(this.#file).size : 0,
      lastRecovery: this.#lastRecoveryState,
    };
  }
}

/**
 * Format descriptor that binds codec and file extension together.
 * Prevents misconfiguration by keeping related concerns in one object.
 */
export type WalFormat<T extends object | string> = {
  /** Base name for the WAL (e.g., "trace") */
  baseName: string;
  /** Shard file extension (e.g., ".jsonl") */
  walExtension: string;
  /** Final file extension (e.g., ".json", ".trace.json") falls back to walExtension if not provided */
  finalExtension: string;
  /** Codec for encoding/decoding records */
  codec: Codec<T, string>;
  /** Finalizer for converting records to a string */
  finalizer: (
    records: (T | InvalidEntry<string>)[],
    opt?: Record<string, unknown>,
  ) => string;
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
export function parseWalFormat<T extends object | string = object>(
  format: Partial<WalFormat<T>>,
): WalFormat<T> {
  const {
    baseName = 'wal',
    walExtension = '.log',
    finalExtension = walExtension,
    codec = stringCodec<T>(),
  } = format;

  const finalizer =
    format.finalizer ??
    ((records: (T | InvalidEntry<string>)[]) => {
      // Encode each record using the codec before joining.
      // For object types, codec.encode() will JSON-stringify them properly.
      // InvalidEntry records use their raw string value directly.
      const encoded = records.map(record =>
        typeof record === 'object' && record != null && '__invalid' in record
          ? (record as InvalidEntry<string>).raw
          : codec.encode(record as T),
      );
      return `${encoded.join('\n')}\n`;
    });

  return {
    baseName,
    walExtension,
    finalExtension,
    codec,
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
export function isLeaderWal(envVarName: string, profilerID: string): boolean {
  return process.env[envVarName] === profilerID;
}

/**
 * Initialize the origin PID environment variable if not already set.
 * This must be done as early as possible before any user code runs.
 * Sets envVarName to the current process ID if not already defined.
 */
export function setLeaderWal(envVarName: string, profilerID: string): void {
  if (!process.env[envVarName]) {
    // eslint-disable-next-line functional/immutable-data
    process.env[envVarName] = profilerID;
  }
}

// eslint-disable-next-line functional/no-let
let shardCount = 0;

/**
 * Generates a human-readable shard ID.
 * This ID is unique per process/thread/shard combination and used in the file name.
 * Format: readable-timestamp.pid.threadId.shardCount
 * Example: "20240101-120000-000.12345.1.1"
 * Becomes file: trace.20240101-120000-000.12345.1.1.log
 */
export function getShardId(): string {
  const timestamp = Math.round(performance.timeOrigin + performance.now());
  const readableTimestamp = sortableReadableDateString(`${timestamp}`);
  return `${readableTimestamp}.${process.pid}.${threadId}.${++shardCount}`;
}

/**
 * Generates a human-readable sharded group ID.
 * This ID is a globally unique, sortable, human-readable date string per run.
 * Used directly as the folder name to group shards.
 * Format: yyyymmdd-hhmmss-ms
 * Example: "20240101-120000-000"
 */
export function getShardedGroupId(): string {
  return sortableReadableDateString(
    `${Math.round(performance.timeOrigin + performance.now())}`,
  );
}

/**
 * Regex patterns for validating WAL ID formats
 */
export const WAL_ID_PATTERNS = {
  /** Readable date format: yyyymmdd-hhmmss-ms */
  READABLE_DATE: /^\d{8}-\d{6}-\d{3}$/,
  /** Group ID format: yyyymmdd-hhmmss-ms */
  GROUP_ID: /^\d{8}-\d{6}-\d{3}$/,
  /** Shard ID format: readable-date.pid.threadId.count */
  SHARD_ID: /^\d{8}-\d{6}-\d{3}(?:\.\d+){3}$/,
} as const;

export function sortableReadableDateString(timestampMs: string): string {
  const timestamp = Number.parseInt(timestampMs, 10);
  const date = new Date(timestamp);
  const MILLISECONDS_PER_SECOND = 1000;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const ms = String(timestamp % MILLISECONDS_PER_SECOND).padStart(3, '0');

  return `${yyyy}${mm}${dd}-${hh}${min}${ss}-${ms}`;
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

/**
 * Sharded Write-Ahead Log manager for coordinating multiple WAL shards.
 * Handles distributed logging across multiple processes/files with atomic finalization.
 */

export class ShardedWal<T extends object | string = object> {
  readonly groupId = getShardedGroupId();
  readonly #format: WalFormat<T>;
  readonly #dir: string = process.cwd();

  /**
   * Create a sharded WAL manager.
   */
  constructor(opt: {
    dir?: string;
    format: Partial<WalFormat<T>>;
    groupId?: string;
  }) {
    const { dir, format, groupId } = opt;
    this.groupId = groupId ?? getShardedGroupId();
    if (dir) {
      this.#dir = dir;
    }
    this.#format = parseWalFormat<T>(format);
  }

  /**
   * Generates a filename for a shard file using a shard ID.
   * Both groupId and shardId are already in readable date format.
   *
   * Example with baseName "trace" and shardId "20240101-120000-000.12345.1.1":
   * Filename: trace.20240101-120000-000.12345.1.1.log
   *
   * @param shardId - The human-readable shard ID (readable-timestamp.pid.threadId.count format)
   * @returns The filename for the shard file
   */
  getShardedFileName(shardId: string) {
    const { baseName, walExtension } = this.#format;
    return `${baseName}.${shardId}${walExtension}`;
  }

  /**
   * Generates a filename for the final merged output file.
   * Uses the groupId as the identifier in the filename.
   *
   * Example with baseName "trace" and groupId "20240101-120000-000":
   * Filename: trace.20240101-120000-000.json
   *
   * @returns The filename for the final merged output file
   */
  getFinalFileName() {
    const { baseName, finalExtension } = this.#format;
    return `${baseName}.${this.groupId}${finalExtension}`;
  }

  shard(shardId: string = getShardId()) {
    return new WriteAheadLogFile({
      file: path.join(
        this.#dir,
        this.groupId,
        this.getShardedFileName(shardId),
      ),
      codec: this.#format.codec,
    });
  }

  /** Get all shard file paths matching this WAL's base name */
  private shardFiles() {
    if (!fs.existsSync(this.#dir)) {
      return [];
    }

    const groupIdDir = path.join(this.#dir, this.groupId);
    // create dir if not existing
    ensureDirectoryExistsSync(groupIdDir);

    return fs
      .readdirSync(groupIdDir)
      .filter(entry => entry.endsWith(this.#format.walExtension))
      .filter(entry => entry.startsWith(`${this.#format.baseName}`))
      .map(entry => path.join(groupIdDir, entry));
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

    // Check if any records are invalid entries (from tolerant codec)
    const hasInvalidEntries = records.some(
      r => typeof r === 'object' && r != null && '__invalid' in r,
    );

    const recordsToFinalize = hasInvalidEntries
      ? records
      : filterValidRecords(records);
    const out = path.join(this.#dir, this.groupId, this.getFinalFileName());
    ensureDirectoryExistsSync(path.dirname(out));
    fs.writeFileSync(out, this.#format.finalizer(recordsToFinalize, opt));
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

    // Also try to remove the root directory if it becomes empty
    try {
      fs.rmdirSync(this.#dir);
    } catch {
      // Directory might not be empty or already removed, ignore
    }
  }
}
