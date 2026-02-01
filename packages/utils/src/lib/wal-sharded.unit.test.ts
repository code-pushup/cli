import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME, osAgnosticPath } from '@code-pushup/test-utils';
import { getUniqueInstanceId } from './process-id.js';
import { PROFILER_SHARDER_ID_ENV_VAR } from './profiler/constants.js';
import { ShardedWal } from './wal-sharded.js';
import {
  type WalFormat,
  WriteAheadLogFile,
  parseWalFormat,
  stringCodec,
} from './wal.js';

const read = (p: string) => vol.readFileSync(p, 'utf8') as string;

const getShardedWal = (overrides?: {
  dir?: string;
  format?: Partial<WalFormat>;
  measureNameEnvVar?: string;
  autoCoordinator?: boolean;
}) => {
  const { format, ...rest } = overrides ?? {};
  return new ShardedWal({
    debug: false,
    dir: '/test/shards',
    format: parseWalFormat({
      baseName: 'test-wal',
      ...format,
    }),
    coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
    ...rest,
  });
};

describe('ShardedWal', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
    // Clear coordinator env var for fresh state
    // eslint-disable-next-line functional/immutable-data, @typescript-eslint/no-dynamic-delete
    delete process.env[PROFILER_SHARDER_ID_ENV_VAR];
  });

  describe('initialization', () => {
    it('should create instance with directory and format', () => {
      const sw = getShardedWal();
      expect(sw).toBeInstanceOf(ShardedWal);
    });

    it('should expose a stable id via getter', () => {
      const sw = getShardedWal();
      const firstId = sw.id;
      expect(sw.id).toBe(firstId);
    });

    it('should use groupId from env var when measureNameEnvVar is set', () => {
      // eslint-disable-next-line functional/immutable-data
      process.env.CP_PROFILER_MEASURE_NAME = 'from-env';
      const sw = getShardedWal({
        measureNameEnvVar: 'CP_PROFILER_MEASURE_NAME',
      });
      expect(sw.groupId).toBe('from-env');
      expect(process.env.CP_PROFILER_MEASURE_NAME).toBe('from-env');
    });

    it('should set env var when measureNameEnvVar is provided and unset', () => {
      // eslint-disable-next-line functional/immutable-data
      delete process.env.CP_PROFILER_MEASURE_NAME;
      const sw = getShardedWal({
        measureNameEnvVar: 'CP_PROFILER_MEASURE_NAME',
      });
      expect(process.env.CP_PROFILER_MEASURE_NAME).toBe(sw.groupId);
    });
  });

  describe('shard management', () => {
    it('should create shard with correct file path', () => {
      const sw = getShardedWal({
        format: { baseName: 'trace', walExtension: '.log' },
      });
      const shard = sw.shard();
      expect(shard).toBeInstanceOf(WriteAheadLogFile);
      // Shard files use getShardId() format (timestamp.pid.threadId.counter)
      // The groupId is auto-generated and used in the shard path
      // Normalize path before regex matching to handle OS-specific separators
      expect(osAgnosticPath(shard.getPath())).toMatch(
        /^<CWD>\/shards\/\d{8}-\d{6}-\d{3}\/trace\.\d{8}-\d{6}-\d{3}(?:\.\d+){3}\.log$/,
      );
      expect(shard.getPath()).toEndWithPath('.log');
    });

    it('should create shard with default shardId when no argument provided', () => {
      const sw = getShardedWal({
        format: { baseName: 'trace', walExtension: '.log' },
      });
      const shard = sw.shard();
      expect(shard.getPath()).toStartWithPath(
        '<CWD>/shards/20231114-221320-000/trace.20231114-221320-000.10001',
      );
      expect(shard.getPath()).toEndWithPath('.log');
    });
  });

  describe('file operations', () => {
    it('should list no shard files when directory does not exist', () => {
      const sw = getShardedWal({ dir: '/nonexistent' });
      const files = (sw as any).shardFiles();
      expect(files).toEqual([]);
    });

    it('should list no shard files when directory is empty', () => {
      const sw = getShardedWal({ dir: '/empty' });
      vol.mkdirSync('/empty/20231114-221320-000', { recursive: true });
      const files = (sw as any).shardFiles();
      expect(files).toEqual([]);
    });

    it('should list shard files matching extension', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/trace.19700101-000820-001.1.log':
          'content1',
        '/shards/20231114-221320-000/trace.19700101-000820-002.2.log':
          'content2',
        '/shards/other.txt': 'not a shard',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'trace', walExtension: '.log' },
      });
      const files = (sw as any).shardFiles();

      expect(files).toHaveLength(2);
      expect(files).toEqual(
        expect.arrayContaining([
          expect.pathToMatch(
            '/shards/20231114-221320-000/trace.19700101-000820-001.1.log',
          ),
          expect.pathToMatch(
            '/shards/20231114-221320-000/trace.19700101-000820-002.2.log',
          ),
        ]),
      );
    });
  });

  describe('finalization', () => {
    it('should finalize empty shards to empty result', () => {
      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'final',
          finalExtension: '.json',
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      vol.mkdirSync('/shards/20231114-221320-000', { recursive: true });
      sw.finalize();

      expect(
        read('/shards/20231114-221320-000/final.20231114-221320-000.json'),
      ).toBe('[]\n');
    });

    it('should finalize multiple shards into single file', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/merged.20240101-120000-001.1.log':
          'record1\n',
        '/shards/20231114-221320-000/merged.20240101-120000-002.2.log':
          'record2\n',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'merged',
          walExtension: '.log',
          finalExtension: '.json',
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      sw.finalize();

      const result = JSON.parse(
        read(
          '/shards/20231114-221320-000/merged.20231114-221320-000.json',
        ).trim(),
      );
      expect(result).toEqual(['record1', 'record2']);
    });

    it('should handle invalid entries during finalize', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/final.20240101-120000-001.1.log':
          'valid\n',
        '/shards/20231114-221320-000/final.20240101-120000-002.2.log':
          'invalid\n',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'final',
          walExtension: '.log',
          finalExtension: '.json',
          codec: stringCodec(),
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      sw.finalize();

      const result = JSON.parse(
        read(
          '/shards/20231114-221320-000/final.20231114-221320-000.json',
        ).trim(),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('valid');
      expect(result[1]).toBe('invalid');
    });

    it('should use custom options in finalizer', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/final.20231114-221320-000.10001.2.1.log':
          'record1\n',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'final',
          walExtension: '.log',
          finalExtension: '.json',
          finalizer: (records, opt) =>
            `${JSON.stringify({ records, meta: opt })}\n`,
        },
      });

      sw.finalize({ version: '1.0', compressed: true });

      const result = JSON.parse(
        read('/shards/20231114-221320-000/final.20231114-221320-000.json'),
      );
      expect(result.records).toEqual(['record1']);
      expect(result.meta).toEqual({ version: '1.0', compressed: true });
    });
  });

  describe('cleanup', () => {
    it('should throw error when cleanup is called by non-coordinator', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });
      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
        autoCoordinator: false,
      });

      // Instance won't be coordinator, so cleanup() should throw
      expect(() => sw.cleanup()).toThrowError(
        'cleanup() can only be called by coordinator',
      );
    });

    it('should handle cleanupIfCoordinator when not coordinator', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
        autoCoordinator: false,
      });

      // cleanupIfCoordinator should be no-op when not coordinator
      sw.cleanupIfCoordinator();

      // Files should still exist
      expect(vol.toJSON()).not.toStrictEqual({});
      expect(sw.getState()).toBe('active');
    });

    it('should handle cleanup when some shard files do not exist', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
      });

      vol.unlinkSync(
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log',
      );

      // cleanupIfCoordinator won't throw even if files don't exist
      expect(() => sw.cleanupIfCoordinator()).not.toThrowError();
    });

    it('should ignore directory removal failures during cleanup', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
        '/shards/20231114-221320-000/keep.txt': 'keep',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
      });

      expect(() => sw.cleanup()).not.toThrowError();
      expect(
        vol.readFileSync('/shards/20231114-221320-000/keep.txt', 'utf8'),
      ).toBe('keep');
    });
  });

  describe('lifecycle state', () => {
    it('throws with appended finalizer error when finalize fails', () => {
      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'test',
          finalExtension: '.json',
          finalizer: () => {
            throw new Error('finalizer boom');
          },
        },
      });

      expect(() => sw.finalize()).toThrowError(
        /Could not finalize sharded wal\. Finalizer method in format throws\./,
      );
      expect(() => sw.finalize()).toThrowError(/finalizer boom/);
      expect(sw.getState()).toBe('active');
    });

    it('should start in active state', () => {
      const sw = getShardedWal();
      expect(sw.getState()).toBe('active');
      expect(sw.isFinalized()).toBeFalse();
      expect(sw.isCleaned()).toBeFalse();
    });

    it('should transition to finalized state after finalize', () => {
      vol.mkdirSync('/shards/20231114-221320-000', { recursive: true });
      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'test',
          finalExtension: '.json',
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      sw.finalize();

      expect(sw.getState()).toBe('finalized');
      expect(sw.isFinalized()).toBeTrue();
      expect(sw.isCleaned()).toBeFalse();
    });

    it('should transition to cleaned state after cleanup (when coordinator)', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
      });

      sw.cleanupIfCoordinator();

      const state = sw.getState();
      expect(['active', 'cleaned']).toContain(state);
    });

    it('should make cleanup idempotent for coordinator', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
      });

      sw.cleanup();
      expect(sw.getState()).toBe('cleaned');

      expect(() => sw.cleanup()).not.toThrowError();
      expect(sw.getState()).toBe('cleaned');
    });

    it('should prevent shard creation after finalize', () => {
      vol.mkdirSync('/shards/20231114-221320-000', { recursive: true });
      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'test',
          finalExtension: '.json',
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      sw.finalize();

      expect(() => sw.shard()).toThrowError('WAL is finalized, cannot modify');
    });

    it('should prevent shard creation after cleanup', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });

      // Generate the instance ID that will be used by the constructor
      // The constructor increments ShardedWal.instanceCount, so we need to
      // generate the ID using the value that will be used (current + 1)
      // without actually modifying ShardedWal.instanceCount
      const nextCount = ShardedWal.instanceCount + 1;
      const instanceId = getUniqueInstanceId({
        next() {
          return nextCount;
        },
      });

      // Set coordinator BEFORE creating instance
      ShardedWal.setCoordinatorProcess(PROFILER_SHARDER_ID_ENV_VAR, instanceId);

      const sw = getShardedWal({
        dir: '/shards',
        format: { baseName: 'test', walExtension: '.log' },
      });

      sw.cleanupIfCoordinator();

      expect(() => sw.shard()).toThrowError('WAL is cleaned, cannot modify');
    });

    it('should make finalize idempotent', () => {
      vol.mkdirSync('/shards/20231114-221320-000', { recursive: true });
      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'test',
          finalExtension: '.json',
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      sw.finalize();
      expect(sw.getState()).toBe('finalized');

      // Call again - should not throw and should remain finalized
      sw.finalize();
      expect(sw.getState()).toBe('finalized');
    });

    it('should prevent finalize after cleanup', () => {
      vol.fromJSON({
        '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
          'content1',
      });

      // Generate the instance ID that will be used by the constructor
      // The constructor increments ShardedWal.instanceCount, so we need to
      // generate the ID using the value that will be used (current + 1)
      // without actually modifying ShardedWal.instanceCount
      const nextCount = ShardedWal.instanceCount + 1;
      const instanceId = getUniqueInstanceId({
        next() {
          return nextCount;
        },
      });

      // Set coordinator BEFORE creating instance
      ShardedWal.setCoordinatorProcess(PROFILER_SHARDER_ID_ENV_VAR, instanceId);

      const sw = getShardedWal({
        dir: '/shards',
        format: {
          baseName: 'test',
          walExtension: '.log',
          finalExtension: '.json',
          finalizer: records => `${JSON.stringify(records)}\n`,
        },
      });

      expect(sw.stats.shardFiles).toHaveLength(0);
      sw.shard();
      expect(sw.stats.shardFiles).toHaveLength(0);

      sw.cleanupIfCoordinator();
      expect(sw.getState()).toBe('cleaned');
      expect(sw.stats.shardFiles).toHaveLength(0);
    });
  });
});
