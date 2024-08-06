import { vol } from 'memfs';
import { rm } from 'node:fs/promises';
import { beforeEach, describe, expect } from 'vitest';
import {
  parseNxProcessOutput,
  setupNxContext,
  teardownNxContext,
} from './utils';

describe('parseNxProcessOutput', () => {
  it('should replace NX with <↗>', () => {
    expect(parseNxProcessOutput('NX some message')).toBe('<↗> some message');
  });
});

describe('setupNxContext', () => {
  beforeEach(async () => {
    vol.reset();
    // to have the test folder set up we need to recreate it
    vol.fromJSON({
      '.': '',
    });
    await rm('.');
  });

  it('should setup nx.json', async () => {
    vol.fromJSON({
      'project.json': '{"name": "my-lib"}',
    });
    await expect(setupNxContext()).resolves.toStrictEqual({
      nxJsonTeardown: true,
      projectJsonTeardown: false,
      projectName: 'my-lib',
    });
    expect(vol.toJSON()).toStrictEqual({
      '/test/nx.json':
        '{"$schema":"./node_modules/nx/schemas/nx-schema.json","releaseTagPattern":"v{version}","targetDefaults":{}}',
      '/test/project.json': '{"name": "my-lib"}',
    });
  });

  it('should setup project.json', async () => {
    vol.fromJSON({
      'nx.json': '{}',
    });
    await expect(setupNxContext()).resolves.toStrictEqual({
      nxJsonTeardown: false,
      projectJsonTeardown: true,
      projectName: 'source-root',
    });
    expect(vol.toJSON()).toStrictEqual({
      '/test/nx.json': '{}',
      '/test/project.json':
        '{"$schema":"node_modules/nx/schemas/project-schema.json","name":"source-root"}',
    });
  });
});

describe('teardownNxContext', () => {
  beforeEach(async () => {
    vol.reset();
    // to have the test folder set up we need to recreate it
    vol.fromJSON({
      '.': '',
    });
    await rm('.');
  });

  it('should delete nx.json', async () => {
    vol.fromJSON({
      'nx.json': '{}',
    });
    await expect(
      teardownNxContext({
        nxJsonTeardown: true,
        projectJsonTeardown: false,
      }),
    ).resolves.toBeUndefined();
    expect(vol.toJSON()).toStrictEqual({
      '/test': null,
    });
  });

  it('should delete project.json', async () => {
    vol.fromJSON({
      'project.json': '{}',
    });
    await expect(
      teardownNxContext({
        nxJsonTeardown: false,
        projectJsonTeardown: true,
      }),
    ).resolves.toBeUndefined();
    expect(vol.toJSON()).toStrictEqual({
      '/test': null,
    });
  });
});
