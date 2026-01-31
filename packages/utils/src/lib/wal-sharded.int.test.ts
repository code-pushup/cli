import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PROFILER_SHARDER_ID_ENV_VAR } from './profiler/constants.js';
import { ShardedWal } from './wal-sharded.js';
import { createTolerantCodec, stringCodec } from './wal.js';

describe('ShardedWal Integration', () => {
  const testDir = path.join(
    process.cwd(),
    'tmp',
    'int',
    'utils',
    'wal-sharded',
  );
  let shardedWal: ShardedWal<string>;

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
      dir: testDir,
      format: {
        baseName: 'trace',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'create-finalize',
      filename: 'test-shard-1',
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
      `trace.test-shard-1.json`,
    );
    expect(fs.existsSync(finalFile)).toBeTrue();

    const content = fs.readFileSync(finalFile, 'utf8');
    const records = JSON.parse(content.trim());
    expect(records).toEqual(['record1', 'record2', 'record3']);
  });

  it('should merge multiple shards correctly', () => {
    shardedWal = new ShardedWal({
      dir: testDir,
      format: {
        baseName: 'merged',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'merge-shards',
      filename: 'shard-1',
    });

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
      `merged.shard-1.json`,
    );
    const content = fs.readFileSync(finalFile, 'utf8');
    const records = JSON.parse(content.trim());
    expect(records).toHaveLength(5);
    expect(records[0]).toBe('record-from-shard-1');
    expect(records[4]).toBe('record-from-shard-5');
  });

  it('should handle invalid entries during finalization', () => {
    const tolerantCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'invalid') throw new Error('Invalid record');
        return s;
      },
    });

    shardedWal = new ShardedWal({
      dir: testDir,
      format: {
        baseName: 'test',
        walExtension: '.log',
        finalExtension: '.json',
        codec: tolerantCodec,
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'invalid-entries',
      filename: 'test-shard',
    });

    const shard = shardedWal.shard();
    shard.open();
    shard.append('valid1');
    shard.append('invalid');
    shard.append('valid2');
    shard.close();

    shardedWal.finalize();

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `test.test-shard.json`,
    );
    const content = fs.readFileSync(finalFile, 'utf8');
    const records = JSON.parse(content.trim());
    expect(records).toHaveLength(3);
    expect(records[0]).toBe('valid1');
    expect(records[1]).toEqual({ __invalid: true, raw: 'invalid' });
    expect(records[2]).toBe('valid2');
  });

  it('should cleanup shard files after finalization', () => {
    shardedWal = new ShardedWal({
      dir: testDir,
      format: {
        baseName: 'cleanup-test',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'cleanup-test',
      filename: 'shard-1',
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
      `cleanup-test.shard-1.json`,
    );
    expect(fs.existsSync(finalFile)).toBeTrue();

    shardedWal.cleanupIfCoordinator();

    const groupDir = path.join(testDir, shardedWal.groupId);
    const files = fs.readdirSync(groupDir);
    expect(files).not.toContain(expect.stringMatching(/cleanup-test.*\.log$/));
    expect(files).toContain(`cleanup-test.shard-1.json`);
  });

  it('should use custom options in finalizer', () => {
    shardedWal = new ShardedWal({
      dir: testDir,
      format: {
        baseName: 'custom',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: (records, opt) =>
          `${JSON.stringify({ records, metadata: opt })}\n`,
      },
      coordinatorIdEnvVar: PROFILER_SHARDER_ID_ENV_VAR,
      groupId: 'custom-finalizer',
      filename: 'custom-shard',
    });

    const shard = shardedWal.shard();
    shard.open();
    shard.append('record1');
    shard.close();

    shardedWal.finalize({ version: '2.0', timestamp: Date.now() });

    const finalFile = path.join(
      testDir,
      shardedWal.groupId,
      `custom.custom-shard.json`,
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
      dir: testDir,
      format: {
        baseName: 'empty',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
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
