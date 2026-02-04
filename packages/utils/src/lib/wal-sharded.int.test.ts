import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PROFILER_SHARDER_ID_ENV_VAR } from './profiler/constants.js';
import { ShardedWal } from './wal-sharded.js';
import { type WalFormat, type WalRecord, stringCodec } from './wal.js';

describe('ShardedWal Integration', () => {
  const testDir = path.join(
    process.cwd(),
    'tmp',
    'int',
    'utils',
    'wal-sharded',
  );
  const makeMockFormat = <T extends WalRecord>(
    overrides: Partial<WalFormat<T>>,
  ): WalFormat<T> => {
    const {
      baseName = 'wal',
      walExtension = '.log',
      finalExtension = '.json',
      codec = stringCodec<T>(),
      finalizer = records => `${JSON.stringify(records)}\n`,
    } = overrides;

    return {
      baseName,
      walExtension,
      finalExtension,
      codec,
      finalizer,
    };
  };
  let shardedWal: ShardedWal;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (shardedWal) {
      shardedWal.cleanupIfCoordinator();
    }
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create and finalize shards correctly', () => {
    shardedWal = new ShardedWal({
      debug: false,
      dir: testDir,
      format: makeMockFormat({
        baseName: 'trace',
      }),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'create-finalize',
    });

    const shard1 = shardedWal.shard();
    shard1.open();
    shard1.append('record1');
    shard1.append('record2');
    shard1.close();

    const shard2 = shardedWal.shard();
    shard2.open();
    shard2.append('record3');
    shard2.close();

    shardedWal.finalize();

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `trace.create-finalize.json`,
    );
    expect(fs.existsSync(finalFile)).toBeTrue();

    const content = fs.readFileSync(finalFile, 'utf8');
    const records = JSON.parse(content.trim());
    expect(records).toEqual(['record1', 'record2', 'record3']);
  });

  it('should merge multiple shards correctly', () => {
    shardedWal = new ShardedWal({
      debug: false,
      dir: testDir,
      format: makeMockFormat({
        baseName: 'merged',
      }),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'merge-shards',
    });

    // eslint-disable-next-line functional/no-loop-statements
    for (let i = 1; i <= 5; i++) {
      const shard = shardedWal.shard();
      shard.open();
      shard.append(`record-from-shard-${i}`);
      shard.close();
    }

    shardedWal.finalize();

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `merged.merge-shards.json`,
    );
    const content = fs.readFileSync(finalFile, 'utf8');
    const records = JSON.parse(content.trim());
    expect(records).toHaveLength(5);
    expect(records[0]).toBe('record-from-shard-1');
    expect(records[4]).toBe('record-from-shard-5');
  });

  it('should handle invalid entries during if debug true', () => {
    shardedWal = new ShardedWal({
      debug: true,
      dir: testDir,
      format: makeMockFormat({
        baseName: 'test',
      }),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'invalid-entries',
    });

    const shard = shardedWal.shard();
    shard.open();
    shard.append('valid1');
    shard.append('invalid');
    shard.append('valid2');
    shard.close();

    shardedWal.finalize();
    // When debug is true, lastRecover should contain recovery results
    expect(shardedWal.stats.lastRecover).toHaveLength(1);
    expect(shardedWal.stats.lastRecover[0]).toMatchObject({
      file: expect.stringContaining('test.'),
      result: expect.objectContaining({
        records: expect.arrayContaining(['valid1', 'invalid', 'valid2']),
        errors: [],
        partialTail: null,
      }),
    });

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `test.invalid-entries.json`,
    );
    const content = fs.readFileSync(finalFile, 'utf8');
    const records = JSON.parse(content.trim());
    expect(records).toEqual(['valid1', 'invalid', 'valid2']);
  });

  it('should cleanup shard files after finalization', () => {
    shardedWal = new ShardedWal({
      debug: false,
      dir: testDir,
      format: makeMockFormat({
        baseName: 'cleanup-test',
      }),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'cleanup-test',
    });

    const shard1 = shardedWal.shard();
    shard1.open();
    shard1.append('record1');
    shard1.close();

    const shard2 = shardedWal.shard();
    shard2.open();
    shard2.append('record2');
    shard2.close();

    shardedWal.finalize();

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `cleanup-test.cleanup-test.json`,
    );
    expect(fs.existsSync(finalFile)).toBeTrue();

    shardedWal.cleanupIfCoordinator();

    const groupDir = path.join(testDir, shardedWal.groupId);
    const files = fs.readdirSync(groupDir);
    expect(files).not.toContain(expect.stringMatching(/cleanup-test.*\.log$/));
    expect(files).toContain(`cleanup-test.cleanup-test.json`);
  });

  it('should use custom options in finalizer', () => {
    shardedWal = new ShardedWal({
      debug: false,
      dir: testDir,
      format: makeMockFormat({
        baseName: 'custom',
        finalizer: (records, opt) =>
          `${JSON.stringify({ records, metadata: opt })}\n`,
      }),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'custom-finalizer',
    });

    const shard = shardedWal.shard();
    shard.open();
    shard.append('record1');
    shard.close();

    shardedWal.finalize({ version: '2.0', timestamp: Date.now() });

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `custom.custom-finalizer.json`,
    );
    const content = fs.readFileSync(finalFile, 'utf8');
    const result = JSON.parse(content.trim());
    expect(result.records).toEqual(['record1']);
    expect(result.metadata).toEqual({
      version: '2.0',
      timestamp: expect.any(Number),
    });
  });

  it('should handle empty shards correctly', () => {
    shardedWal = new ShardedWal({
      debug: false,
      dir: testDir,
      format: makeMockFormat({
        baseName: 'empty',
      }),
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'empty-shards',
    });

    const groupDir = path.join(testDir, shardedWal.groupId);
    fs.mkdirSync(groupDir, { recursive: true });

    shardedWal.finalize();

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `empty.${shardedWal.groupId}.json`,
    );
    expect(fs.existsSync(finalFile)).toBeTrue();
    const content = fs.readFileSync(finalFile, 'utf8');
    expect(content.trim()).toBe('[]');
  });
});
