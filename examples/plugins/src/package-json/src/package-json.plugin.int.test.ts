import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { executePlugin } from '@code-pushup/core';
import {
  auditSchema,
  categoryRefSchema,
  pluginConfigSchema,
  pluginReportSchema,
} from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { audits, pluginSlug as slug } from './constants.js';
import { type PluginOptions, create } from './package-json.plugin.js';
import {
  documentationGroupRef,
  performanceGroupRef,
  recommendedRefs,
  versionControlGroupRef,
} from './scoring.js';

describe('create-package-json', () => {
  const baseOptions: PluginOptions = {
    directory: '/',
  };

  beforeEach(() => {
    vol.fromJSON(
      {
        'package.json': '{}',
      },
      MEMFS_VOLUME,
    );
  });

  it('should return valid PluginConfig', () => {
    const pluginConfig = create(baseOptions);
    expect(() => pluginConfigSchema.parse(pluginConfig)).not.toThrow();
    expect(pluginConfig).toEqual({
      slug,
      description: 'A plugin to validate package.json files.',
      icon: 'npm',
      runner: expect.any(Function),
      title: 'Package Json',
      audits: expect.arrayContaining(audits),
      groups: expect.any(Array),
    });
  });

  it('should return PluginConfig that executes correctly', async () => {
    const pluginConfig = create(baseOptions);
    const pluginOutput = await executePlugin(pluginConfig);

    expect(() => pluginReportSchema.parse(pluginOutput)).not.toThrow();
    expect(pluginOutput).toMatchObject(
      expect.objectContaining({
        slug,
        description: 'A plugin to validate package.json files.',
        icon: 'npm',
        duration: expect.any(Number),
        date: expect.any(String),
        title: 'Package Json',
        groups: expect.any(Array),
      }),
    );
  });

  it('should use license', async () => {
    const pluginConfig = create({
      ...baseOptions,
      license: 'MIT',
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs[0]?.value).toBe(1);
    expect(auditOutputs[0]?.score).toBe(0);
    expect(auditOutputs[0]?.details?.issues).toEqual([
      {
        message: 'license should be MIT but is undefined',
        severity: 'error',
      },
    ]);
  });

  it('should use type', async () => {
    const pluginConfig = create({
      ...baseOptions,
      type: 'module',
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs[1]?.slug).toBe('package-type');
    expect(auditOutputs[1]?.score).toBe(0);
    expect(auditOutputs[1]?.details?.issues).toEqual([
      {
        message: 'type should be module but is undefined',
        severity: 'error',
      },
    ]);
  });

  it('should use dependencies', async () => {
    const pluginConfig = create({
      ...baseOptions,
      dependencies: {
        test: '0',
      },
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(audits.length);
    expect(auditOutputs[2]?.slug).toBe('package-dependencies');
    expect(auditOutputs[2]?.score).toBe(0);
    expect(auditOutputs[2]?.details?.issues).toEqual([
      {
        message:
          'Package test is not installed under dependencies. Run `npm install test@0` to install it.',
        severity: 'error',
      },
    ]);
  });

  it('should use optionalDependencies', async () => {
    const pluginConfig = create({
      ...baseOptions,
      optionalDependencies: {
        test: '0',
      },
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(audits.length);
    expect(auditOutputs[2]?.score).toBe(0);
    expect(auditOutputs[2]?.slug).toBe('package-dependencies');
    expect(auditOutputs[2]?.details?.issues).toEqual([
      {
        message:
          'Package test is not installed under optionalDependencies. Run `npm install test@0` to install it.',
        severity: 'error',
      },
    ]);
  });

  it('should use devDependencies', async () => {
    const pluginConfig = create({
      ...baseOptions,
      devDependencies: {
        test: '0',
      },
    });
    const { audits: auditOutputs } = await executePlugin(pluginConfig);

    expect(auditOutputs).toHaveLength(audits.length);
    expect(auditOutputs[2]?.score).toBe(0);
    expect(auditOutputs[2]?.slug).toBe('package-dependencies');
    expect(auditOutputs[2]?.details?.issues).toEqual([
      {
        message:
          'Package test is not installed under devDependencies. Run `npm install test@0` to install it.',
        severity: 'error',
      },
    ]);
  });
});

describe('audits', () => {
  it.each(audits)('should be a valid audit meta info', audit => {
    expect(() => auditSchema.parse(audit)).not.toThrow();
  });
});

describe('groupRefs', () => {
  it.each([versionControlGroupRef, performanceGroupRef, documentationGroupRef])(
    'should be a valid category reference',
    groupRef => {
      expect(() => categoryRefSchema.parse(groupRef)).not.toThrow();
    },
  );
});

describe('recommendedRefs', () => {
  it.each(recommendedRefs)(
    'should be a valid category reference',
    categoryRef => {
      expect(() => categoryRefSchema.parse(categoryRef)).not.toThrow();
    },
  );
});
