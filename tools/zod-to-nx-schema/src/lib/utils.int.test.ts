import { cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadModuleExport } from './utils.js';

describe('loadModuleExport', () => {
  const fixturesDir = path.join(__dirname, '../../mocks/fixtures');
  const fixturesExtensionsDir = path.join(fixturesDir, 'extensions');

  const testEnvDir = path.join('tmp/int/zod-to-nx-schema');
  const extensionsDir = path.join(testEnvDir, 'extensions');

  beforeAll(async () => {
    await cp(fixturesExtensionsDir, extensionsDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testEnvDir, { recursive: true, force: true });
  });

  it.each(['js', 'mjs', 'cjs', 'ts'])(
    'should load a Zod schema from file with extension .%s',
    async extension => {
      const schemaFile = path.resolve(
        extensionsDir,
        `basic.zod-schema.${extension}`,
      );

      const zodSchema = await loadModuleExport(schemaFile);

      expect(zodSchema).toBeDefined();
      expect(typeof zodSchema).toBe('object');

      expect(zodSchema.def).toBeDefined();
      expect(zodSchema.def.type).toBe('object');
    },
  );
});
