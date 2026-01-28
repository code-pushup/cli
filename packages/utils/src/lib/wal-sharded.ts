import * as fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { threadId } from 'node:worker_threads';
import {
  type Counter,
  getUniqueInstanceId,
  getUniqueProcessThreadId,
  getUniqueTimeId,
} from './process-id.js';
import {
  type WalFormat,
  WriteAheadLogFile,
  filterValidRecords,
  parseWalFormat,
} from './wal.js';

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

// eslint-disable-next-line functional/no-let
let shardCount = 0;

/**
 * Counter for generating sequential shard IDs.
 * Encapsulates the shard count increment logic.
 */
export const ShardedWalCounter: Counter = {
  next() {
    return ++shardCount;
  },
};

/**
 * Generates a unique readable instance ID.
 * This ID uniquely identifies a shard/file per process/thread combination with a human-readable timestamp.
 * Format: readable-timestamp.pid.threadId.counter
 * Example: "20240101-120000-000.12345.1.1"
 *
 * @returns A unique ID string with readable timestamp, process ID, thread ID, and counter
 */
export function getShardId(): string {
  return `${getUniqueTimeId()}.${process.pid}.${threadId}.${ShardedWalCounter.next()}`;
}

/**
 * NOTE: this helper is only used in this file. The rest of the repo avoids sync methods so it is not reusable.
 * Attempts to remove a directory if it exists and is empty, ignoring errors if removal fails.
 * @param dirPath - The directory path to remove
 */
function ensureDirectoryRemoveSync(dirPath: string): void {
  try {
    fs.rmdirSync(dirPath);
  } catch {
    // Directory might not be empty or already removed, ignore
  }
}

/**
 * Sharded Write-Ahead Log manager for coordinating multiple WAL shards.
 * Handles distributed logging across multiple processes/files with atomic finalization.
 */

export class ShardedWal<T extends object = object> {
  static instanceCount = 0;

  readonly #id: string = getUniqueInstanceId({
    next() {
      return ++ShardedWal.instanceCount;
    },
  });
  readonly groupId = getUniqueTimeId();
  readonly #format: WalFormat<T>;
  readonly #dir: string = process.cwd();
  readonly #coordinatorIdEnvVar: string;
  #state: 'active' | 'finalized' | 'cleaned' = 'active';

  /**
   * Initialize the origin PID environment variable if not already set.
   * This must be done as early as possible before any user code runs.
   * Sets envVarName to the current process ID if not already defined.
   *
   * @param envVarName - Environment variable name for storing coordinator ID
   * @param profilerID - The profiler ID to set as coordinator
   */
  static setCoordinatorProcess(envVarName: string, profilerID: string): void {
    if (!process.env[envVarName]) {
      // eslint-disable-next-line functional/immutable-data
      process.env[envVarName] = profilerID;
    }
  }

  /**
   * Determines if this process is the leader WAL process using the origin PID heuristic.
   *
   * The leader is the process that first enabled profiling (the one that set CP_PROFILER_ORIGIN_PID).
   * All descendant processes inherit the environment but have different PIDs.
   *
   * @param envVarName - Environment variable name for storing coordinator ID
   * @param profilerID - The profiler ID to check
   * @returns true if this is the leader WAL process, false otherwise
   */
  static isCoordinatorProcess(envVarName: string, profilerID: string): boolean {
    return process.env[envVarName] === profilerID;
  }

  /**
   * Create a sharded WAL manager.
   *
   * @param opt.dir - Base directory to store shard files (defaults to process.cwd())
   * @param opt.format - WAL format configuration
   * @param opt.groupId - Group ID for sharding (defaults to generated group ID)
   * @param opt.coordinatorIdEnvVar - Environment variable name for storing coordinator ID (defaults to CP_SHARDED_WAL_COORDINATOR_ID)
   */
  constructor(opt: {
    dir?: string;
    format: Partial<WalFormat<T>>;
    groupId?: string;
    coordinatorIdEnvVar: string;
  }) {
    const { dir, format, groupId, coordinatorIdEnvVar } = opt;
    this.groupId = groupId ?? getUniqueTimeId();
    if (dir) {
      this.#dir = dir;
    }
    this.#format = parseWalFormat<T>(format);
    this.#coordinatorIdEnvVar = coordinatorIdEnvVar;
  }

  /**
   * Gets the unique instance ID for this ShardedWal.
   *
   * @returns The unique instance ID
   */
  get id(): string {
    return this.#id;
  }

  /**
   * Is this instance the coordinator?
   *
   * Coordinator status is determined from the coordinatorIdEnvVar environment variable.
   * The coordinator handles finalization and cleanup of shard files.
   * Checks dynamically to allow coordinator to be set after construction.
   *
   * @returns true if this instance is the coordinator, false otherwise
   */
  isCoordinator(): boolean {
    return ShardedWal.isCoordinatorProcess(this.#coordinatorIdEnvVar, this.#id);
  }

  /**
   * Ensures this instance is set as the coordinator if no coordinator is currently set.
   * This method is idempotent - if a coordinator is already set (even if it's not this instance),
   * it will not change the coordinator.
   *
   * This should be called after construction to ensure the first instance becomes the coordinator.
   */
  ensureCoordinator(): void {
    ShardedWal.setCoordinatorProcess(this.#coordinatorIdEnvVar, this.#id);
  }

  /**
   * Asserts that the WAL is in 'active' state.
   * Throws an error if the WAL has been finalized or cleaned.
   *
   * @throws Error if WAL is not in 'active' state
   */
  private assertActive(): void {
    if (this.#state !== 'active') {
      throw new Error(`WAL is ${this.#state}, cannot modify`);
    }
  }

  /**
   * Gets the current lifecycle state of the WAL.
   *
   * @returns Current lifecycle state: 'active', 'finalized', or 'cleaned'
   */
  getState(): 'active' | 'finalized' | 'cleaned' {
    return this.#state;
  }

  /**
   * Checks if the WAL has been finalized.
   *
   * @returns true if WAL is in 'finalized' state, false otherwise
   */
  isFinalized(): boolean {
    return this.#state === 'finalized';
  }

  /**
   * Checks if the WAL has been cleaned.
   *
   * @returns true if WAL is in 'cleaned' state, false otherwise
   */
  isCleaned(): boolean {
    return this.#state === 'cleaned';
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
  getFinalFilePath() {
    const groupIdDir = path.join(this.#dir, this.groupId);
    const { baseName, finalExtension } = this.#format;
    return path.join(
      groupIdDir,
      `${baseName}.${this.groupId}${finalExtension}`,
    );
  }

  shard(shardId: string = getShardId()) {
    this.assertActive();
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
   * Idempotent: returns early if already finalized or cleaned.
   * @throws Error if any shard contains decode errors
   */
  finalize(opt?: Record<string, unknown>) {
    if (this.#state !== 'active') {
      return;
    }

    // Ensure base directory exists before calling shardFiles()
    ensureDirectoryExistsSync(this.#dir);

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

    // Ensure groupId directory exists (even if no shard files were created)
    const groupIdDir = path.join(this.#dir, this.groupId);
    ensureDirectoryExistsSync(groupIdDir);

    fs.writeFileSync(
      this.getFinalFilePath(),
      this.#format.finalizer(recordsToFinalize, opt),
    );

    this.#state = 'finalized';
  }

  /**
   * Cleanup shard files by removing them from disk.
   * Coordinator-only: throws error if not coordinator to prevent race conditions.
   * Idempotent: returns early if already cleaned.
   */
  cleanup() {
    if (!this.isCoordinator()) {
      throw new Error('cleanup() can only be called by coordinator');
    }

    if (this.#state === 'cleaned') {
      return;
    }

    this.shardFiles().forEach(f => {
      // Remove the shard file
      fs.unlinkSync(f);
      // Remove the parent directory (shard group directory)
      const shardDir = path.dirname(f);
      ensureDirectoryRemoveSync(shardDir);
    });

    // Also try to remove the root directory if it becomes empty
    ensureDirectoryRemoveSync(this.#dir);

    this.#state = 'cleaned';
  }

  getStats() {
    return {
      state: this.#state,
      groupId: this.groupId,
      shardCount: this.shardFiles().length,
      isCoordinator: this.isCoordinator(),
      isFinalized: this.isFinalized(),
      isCleaned: this.isCleaned(),
      finalFilePath: this.getFinalFilePath(),
      shardFileCount: this.shardFiles().length,
      shardFiles: this.shardFiles(),
    };
  }

  finalizeIfCoordinator(opt?: Record<string, unknown>) {
    if (this.isCoordinator()) {
      this.finalize(opt);
    }
  }

  /**
   * Cleanup shard files if this instance is the coordinator.
   * Safe to call from any process - only coordinator will execute cleanup.
   */
  cleanupIfCoordinator() {
    if (this.isCoordinator()) {
      this.cleanup();
    }
  }
}
