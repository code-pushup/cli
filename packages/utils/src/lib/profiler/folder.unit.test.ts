import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ensureDirectoryExists,
  removeDirectoryIfExists,
} from '@code-pushup/utils';
import type { PerformanceEntryEncoder } from '../performance-observer.js';
import { NodeJsProfiler } from './profiler';

const simpleEncoder: PerformanceEntryEncoder<string> = entry => {
  if (entry.entryType === 'measure') {
    return [`${entry.name}:${entry.duration.toFixed(2)}ms`];
  }
  return [];
};

describe('NodeJsProfiler folder structure', () => {
  const outDir = 'tmp/profiles';

  beforeEach(async () => {
    await removeDirectoryIfExists(outDir);
    await ensureDirectoryExists(outDir);
  });

  afterEach(async () => {
    await removeDirectoryIfExists(outDir);
  });

  it('should have correct file structure', async () => {
    const traceProfiler = new NodeJsProfiler<string>({
      prefix: 'test',
      track: 'test-track',
      format: {
        baseName: 'trace',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: true,
    });

    // Perform some operations - use measureAsync to create observable performance entries
    await traceProfiler.measureAsync('test-op', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result';
    });
    traceProfiler.flush();

    // Get groupId and finalFileName from state
    const groupId = traceProfiler.state.groupId;
    const finalFileName = traceProfiler.state.getFinalFileName();

    // Disable profiler to trigger finalization
    traceProfiler.setEnabled(false);

    // Validate final JSON file exists in directory structure
    const groupIdDir = path.join(outDir, groupId);
    const finalFilePath = path.join(groupIdDir, finalFileName);

    expect(fs.existsSync(groupIdDir)).toBe(true);
    expect(fs.existsSync(finalFilePath)).toBe(true);
    expect(fs.statSync(finalFilePath).isFile()).toBe(true);
  });

  it('should create directory structure with correct groupId format', async () => {
    const traceProfiler = new NodeJsProfiler<string>({
      prefix: 'test',
      track: 'test-track',
      format: {
        baseName: 'trace',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: true,
    });

    const groupId = traceProfiler.state.groupId;
    const groupIdDir = path.join(outDir, groupId);

    // GroupId should be a non-empty string
    expect(groupId).toBeTruthy();
    expect(typeof groupId).toBe('string');
    expect(groupId.length).toBeGreaterThan(0);

    // Directory should exist after operations
    await traceProfiler.measureAsync('test-op', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result';
    });
    traceProfiler.flush();
    traceProfiler.setEnabled(false);

    expect(fs.existsSync(groupIdDir)).toBe(true);
    expect(fs.statSync(groupIdDir).isDirectory()).toBe(true);
  });

  it('should write final file with correct content format', async () => {
    const traceProfiler = new NodeJsProfiler<string>({
      prefix: 'test',
      track: 'test-track',
      format: {
        baseName: 'trace',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: true,
    });

    await traceProfiler.measureAsync('test-op-1', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result-1';
    });

    await traceProfiler.measureAsync('test-op-2', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result-2';
    });

    traceProfiler.flush();
    traceProfiler.setEnabled(false);

    const groupId = traceProfiler.state.groupId;
    const finalFileName = traceProfiler.state.getFinalFileName();
    const finalFilePath = path.join(outDir, groupId, finalFileName);

    expect(fs.existsSync(finalFilePath)).toBe(true);

    // Read and validate file content
    const fileContent = fs.readFileSync(finalFilePath, 'utf-8');
    expect(fileContent).toBeTruthy();

    // Content should be valid JSON
    const parsed = JSON.parse(fileContent);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('should create final file with correct naming convention', async () => {
    const traceProfiler = new NodeJsProfiler<string>({
      prefix: 'test',
      track: 'test-track',
      format: {
        baseName: 'trace',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: true,
    });

    await traceProfiler.measureAsync('test-op', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result';
    });
    traceProfiler.flush();
    traceProfiler.setEnabled(false);

    const finalFileName = traceProfiler.state.getFinalFileName();

    // Final file should have correct extension
    expect(finalFileName).toMatch(/\.json$/);
    expect(finalFileName).toContain('trace');
  });

  it('should handle multiple profiler instances with separate directories', async () => {
    const profiler1 = new NodeJsProfiler<string>({
      prefix: 'test1',
      track: 'test-track-1',
      format: {
        baseName: 'trace1',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: true,
    });

    const profiler2 = new NodeJsProfiler<string>({
      prefix: 'test2',
      track: 'test-track-2',
      format: {
        baseName: 'trace2',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: true,
    });

    await profiler1.measureAsync('op1', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result1';
    });

    await profiler2.measureAsync('op2', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result2';
    });

    profiler1.flush();
    profiler2.flush();
    profiler1.setEnabled(false);
    profiler2.setEnabled(false);

    const groupId1 = profiler1.state.groupId;
    const groupId2 = profiler2.state.groupId;

    // Each profiler should have its own groupId directory
    const dir1 = path.join(outDir, groupId1);
    const dir2 = path.join(outDir, groupId2);

    expect(fs.existsSync(dir1)).toBe(true);
    expect(fs.existsSync(dir2)).toBe(true);
    expect(dir1).not.toBe(dir2);
  });

  it('should create files only when profiler is enabled', async () => {
    const traceProfiler = new NodeJsProfiler<string>({
      prefix: 'test',
      track: 'test-track',
      format: {
        baseName: 'trace',
        walExtension: '.jsonl',
        finalExtension: '.json',
        codec: {
          encode: (entry: string) => entry,
          decode: (data: string) => data,
        },
        finalizer: records => JSON.stringify(records),
        encodePerfEntry: simpleEncoder,
      },
      outDir,
      enabled: false,
    });

    // Perform operations while disabled
    await traceProfiler.measureAsync('test-op', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result';
    });

    const groupId = traceProfiler.state.groupId;
    const groupIdDir = path.join(outDir, groupId);

    // Directory should not exist when disabled
    expect(fs.existsSync(groupIdDir)).toBe(false);

    // Enable and perform operations
    traceProfiler.setEnabled(true);
    await traceProfiler.measureAsync('test-op-2', async () => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return 'result-2';
    });
    traceProfiler.flush();
    traceProfiler.setEnabled(false);

    // Now directory should exist
    expect(fs.existsSync(groupIdDir)).toBe(true);
  });
});
