import { writeFileSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

const FIXTURES_DIR = path.join(
  'packages',
  'plugin-bundle-stats',
  'mocks',
  'fixtures',
);

const tmpRoot = path.join(E2E_ENVIRONMENTS_DIR, 'plugin-bundle-stats');

const tmpTestOutputRoot = path.join(tmpRoot, TEST_OUTPUT_DIR);

const fixtureSharedRoot = path.join(FIXTURES_DIR, 'node-minimal');

const SNAPSHOTS_DIR = path.join(
  'packages',
  'plugin-bundle-stats',
  'src',
  'lib',
  '__snapshots__',
);

describe('esbuild stats generation', () => {
  const tmpEsbuild = path.join(tmpTestOutputRoot, 'esbuild-stats');
  const esbuildDistDir = path.join(tmpEsbuild, 'dist');

  beforeAll(async () => {
    await cp(fixtureSharedRoot, tmpEsbuild, {
      recursive: true,
    });
  });

  afterAll(async () => {
    await teardownTestFolder(tmpEsbuild);
  });

  it('should create stats.json using esbuild', async () => {
    // Copy esbuild configuration
    await cp(path.join(FIXTURES_DIR, 'esbuild'), tmpEsbuild, {
      recursive: true,
    });

    const { code } = await executeProcess({
      command: 'node',
      args: ['esbuild.config.cjs'],
      cwd: tmpEsbuild,
    });

    expect(code).toBe(0);

    const statsPath = path.join(esbuildDistDir, 'stats.json');
    const stats = (await readJsonFile(statsPath)) as Record<string, any>;

    expect(stats).toEqual(
      expect.objectContaining({
        inputs: expect.any(Object),
        outputs: expect.objectContaining({
          'dist/index.js': expect.any(Object),
          'dist/bin.js': expect.any(Object),
        }),
      }),
    );

    await cp(statsPath, path.join(SNAPSHOTS_DIR, 'esbuild.stats.json'));
  });
});

describe('webpack stats generation', () => {
  const tmpWebpack = path.join(tmpTestOutputRoot, 'webpack-stats');
  const webpackDistDir = path.join(tmpWebpack, 'dist');

  beforeAll(async () => {
    await cp(fixtureSharedRoot, tmpWebpack, {
      recursive: true,
    });
  });

  afterAll(async () => {
    await teardownTestFolder(tmpWebpack);
  });

  it('should create stats.json using webpack@5', async () => {
    await cp(path.join(FIXTURES_DIR, 'webpack'), tmpWebpack, {
      recursive: true,
    });

    const { code } = await executeProcess({
      command: 'node',
      args: ['webpack-build.cjs'],
      cwd: tmpWebpack,
    });

    expect(code).toBe(0);

    const statsPath = path.join(webpackDistDir, 'stats.json');
    const rawStats = (await readJsonFile(statsPath)) as Record<string, any>;

    expect(rawStats).toEqual(
      expect.objectContaining({
        modules: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringMatching(/src\/index/),
          }),
          expect.objectContaining({
            name: expect.stringMatching(/src\/utils/),
          }),
        ]),
        assets: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringMatching(/bundle\.js/),
          }),
        ]),
      }),
    );

    await cp(statsPath, path.join(SNAPSHOTS_DIR, 'webpack.stats.json'));
  });
});

describe('rsbuild stats generation', () => {
  const tmpRsbuild = path.join(tmpTestOutputRoot, 'rsbuild-stats');
  const rsbuildDistDir = path.join(tmpRsbuild, 'dist');

  beforeAll(async () => {
    await cp(fixtureSharedRoot, tmpRsbuild, {
      recursive: true,
    });
  });

  afterAll(async () => {
    await teardownTestFolder(tmpRsbuild);
  });

  it('should create stats.json using rsbuild', async () => {
    await executeProcess({
      command: 'mkdir',
      args: ['-p', 'dist'],
      cwd: tmpRsbuild,
    });

    await cp(path.join(FIXTURES_DIR, 'rsbuild'), path.join(tmpRsbuild), {
      recursive: true,
    });

    await cp(fixtureSharedRoot, path.join(tmpRsbuild, 'src'), {
      recursive: true,
    });

    const { code } = await executeProcess({
      command: 'node',
      args: ['rsbuild-build.cjs'],
      cwd: tmpRsbuild,
    });

    expect(code).toBe(0);

    const statsPath = path.join(rsbuildDistDir, 'stats.json');
    const rawStats = (await readJsonFile(statsPath)) as Record<string, any>;

    expect(rawStats).toEqual(
      expect.objectContaining({
        modules: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringMatching(/src\/index/),
          }),
          expect.objectContaining({
            name: expect.stringMatching(/src\/utils/),
          }),
        ]),
        assets: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringMatching(/bundle\.js/),
          }),
        ]),
      }),
    );

    await cp(statsPath, path.join(SNAPSHOTS_DIR, 'rsbuild.stats.json'));
  });
});
