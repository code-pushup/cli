import { describe, expect, it } from 'vitest';
import { type PluginConfig, pluginConfigSchema } from './plugin-config.js';

describe('pluginConfigSchema', () => {
  it('should accept a valid plugin configuration with all entities', () => {
    expect(() =>
      pluginConfigSchema.parse({
        slug: 'eslint',
        title: 'ESLint plugin',
        description: 'This plugin checks ESLint in configured files.',
        docsUrl: 'https://eslint.org/',
        icon: 'eslint',
        runner: { command: 'node', outputFile: 'output.json' },
        audits: [
          { slug: 'no-magic-numbers', title: 'Use defined constants' },
          { slug: 'require-await', title: 'Every async has await.' },
        ],
        groups: [
          {
            slug: 'typescript-eslint',
            title: 'TypeScript ESLint rules',
            refs: [{ slug: 'require-await', weight: 2 }],
          },
        ],
        packageName: 'cli',
        version: 'v0.5.2',
      } satisfies PluginConfig),
    ).not.toThrow();
  });

  it('should accept a minimal plugin configuration', () => {
    expect(() =>
      pluginConfigSchema.parse({
        slug: 'cypress',
        title: 'Cypress testing',
        icon: 'cypress',
        runner: { command: 'npx cypress run', outputFile: 'e2e-output.json' },
        audits: [{ slug: 'cypress-e2e', title: 'Cypress E2E results' }],
      } satisfies PluginConfig),
    ).not.toThrow();
  });

  it('should throw for a plugin configuration without audits', () => {
    expect(() =>
      pluginConfigSchema.parse({
        slug: 'jest',
        title: 'Jest',
        icon: 'jest',
        runner: { command: 'npm run test', outputFile: 'jest-output.json' },
        audits: [],
      } satisfies PluginConfig),
    ).toThrow('too_small');
  });

  it('should throw for a configuration with a group reference missing among audits', () => {
    expect(() =>
      pluginConfigSchema.parse({
        slug: 'cypress',
        title: 'Cypress testing',
        icon: 'cypress',
        runner: { command: 'npx cypress run', outputFile: 'output.json' },
        audits: [{ slug: 'jest', title: 'Jest' }],
        groups: [
          {
            slug: 'cyct',
            title: 'Cypress component testing',
            refs: [{ slug: 'cyct', weight: 5 }],
          },
        ],
      } satisfies PluginConfig),
    ).toThrow(
      'group references need to point to an existing audit in this plugin config: cyct',
    );
  });

  it('should throw for a plugin configuration that has a group but empty audits', () => {
    expect(() =>
      pluginConfigSchema.parse({
        slug: 'cypress',
        title: 'Cypress testing',
        icon: 'cypress',
        runner: { command: 'npx cypress run', outputFile: 'output.json' },
        audits: [],
        groups: [
          {
            slug: 'cyct',
            title: 'Cypress component testing',
            refs: [{ slug: 'cyct', weight: 5 }],
          },
        ],
      } satisfies PluginConfig),
    ).toThrow(
      'group references need to point to an existing audit in this plugin config: cyct',
    );
  });

  it('should throw for an invalid plugin slug', () => {
    expect(() =>
      pluginConfigSchema.parse({
        slug: '-invalid-jest',
        title: 'Jest',
        icon: 'jest',
        runner: { command: 'npm run test', outputFile: 'jest-output.json' },
        audits: [],
      } satisfies PluginConfig),
    ).toThrow('slug has to follow the pattern');
  });
});
