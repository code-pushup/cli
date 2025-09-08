import path from 'node:path';
import { expect } from 'vitest';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { E2E_ENVIRONMENTS_DIR } from '@code-pushup/test-utils';
import {
  ensureDirectoryExists,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';

describe('zod-to-nx-schema-cli', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const extensionsDir = path.join(envRoot, 'extensions');

  it('should convert a Zod schema to Nx schema JSON with named export', async () => {
    const testCaseDir = path.join(extensionsDir, 'named-export');
    await ensureDirectoryExists(testCaseDir);

    const schemaFile = path.resolve(
      __dirname,
      '../mocks/fixtures/exports/named.zod-schema.js',
    );
    const outputFile = path.join(testCaseDir, 'named.zod-schema.json');

    const result = await executeProcess({
      command: 'node',
      args: [
        'node_modules/@code-pushup/zod-to-nx-schema/src/bin.js',
        '--schemaModulePath',
        schemaFile,
        '--exportName',
        'basicExecutorOptions',
        '--outputPath',
        outputFile,
      ],
      cwd: envRoot,
    }).catch((error: any) => error);

    expect(result.code).toBe(0);

    expect(await readJsonFile(outputFile)).toStrictEqual(
      expect.objectContaining({
        properties: {
          name: {
            type: 'string',
          },
          count: {
            type: 'number',
            minimum: 0,
          },
          enabled: {
            type: 'boolean',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      }),
    );
  });

  it('should convert a Zod schema to Nx schema JSON with default export', async () => {
    const testCaseDir = path.join(extensionsDir, 'default-export');
    await ensureDirectoryExists(testCaseDir);

    const schemaFile = path.resolve(
      __dirname,
      '../mocks/fixtures/exports/default.zod-schema.js',
    );
    const outputFile = path.join(testCaseDir, 'default.zod-schema.json');

    const result = await executeProcess({
      command: 'node',
      args: [
        'node_modules/@code-pushup/zod-to-nx-schema/src/bin.js',
        '--schemaModulePath',
        schemaFile,
        '--outputPath',
        outputFile,
      ],
      cwd: envRoot,
    }).catch((error: any) => error);

    expect(result.code).toBe(0);

    expect(await readJsonFile(outputFile)).toStrictEqual(
      expect.objectContaining({
        properties: {
          command: {
            type: 'string',
            $default: {
              $source: 'argv',
              index: 0,
            },
          },
          verbose: {
            type: 'boolean',
          },
          config: {
            type: 'string',
          },
        },
      }),
    );
  });

  it('should convert a Zod schema using filename option', async () => {
    const testCaseDir = path.join(extensionsDir, 'filename-option');
    await ensureDirectoryExists(testCaseDir);

    const schemaFile = path.resolve(
      __dirname,
      '../mocks/fixtures/exports/default.zod-schema.js',
    );
    // When using --filename, the file is created in the test case directory
    const outputFile = path.resolve(testCaseDir, 'custom-executor.json');

    const result = await executeProcess({
      command: 'node',
      args: [
        'node_modules/@code-pushup/zod-to-nx-schema/src/bin.js',
        '--schemaModulePath',
        schemaFile,
        '--outputPath',
        outputFile,
        '--title',
        '"Custom Executor Schema"',
      ],
      cwd: envRoot,
    }).catch((error: any) => error);

    expect(result.code).toBe(0);

    expect(await readJsonFile(outputFile)).toStrictEqual(
      expect.objectContaining({
        properties: {
          command: {
            type: 'string',
            $default: {
              $source: 'argv',
              index: 0,
            },
          },
          verbose: {
            type: 'boolean',
          },
          config: {
            type: 'string',
          },
        },
      }),
    );
  });
});
