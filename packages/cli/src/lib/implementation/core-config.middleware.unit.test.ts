import { describe, expect, vi } from 'vitest';
import { autoloadRc, readRcByPath } from '@code-pushup/core';
import {
  coreConfigMiddleware,
  normalizeBooleanWithNegation,
  normalizeFormats,
} from './core-config.middleware.js';
import type { CoreConfigCliOptions } from './core-config.model.js';
import type { FilterOptions } from './filter.model.js';
import type { GeneralCliOptions } from './global.model.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('normalizeBooleanWithNegation', () => {
  it('should return true when CLI property is true', () => {
    expect(normalizeBooleanWithNegation('report', { report: true }, {})).toBe(
      true,
    );
  });

  it('should return false when CLI property is false', () => {
    expect(normalizeBooleanWithNegation('report', { report: false }, {})).toBe(
      false,
    );
  });

  it('should return false when no-property exists in CLI persist', () => {
    expect(
      normalizeBooleanWithNegation('report', { 'no-report': true }, {}),
    ).toBe(false);
  });

  it('should fallback to RC persist when no CLI property', () => {
    expect(normalizeBooleanWithNegation('report', {}, { report: false })).toBe(
      false,
    );
  });

  it('should return default true when no property anywhere', () => {
    expect(normalizeBooleanWithNegation('report', {}, {})).toBe(true);
  });
});

describe('normalizeFormats', () => {
  it('should forward valid formats', () => {
    expect(normalizeFormats(['json', 'md'])).toEqual(['json', 'md']);
  });

  it('should split comma separated strings', () => {
    expect(normalizeFormats(['json,md'])).toEqual(['json', 'md']);
  });

  it('should accept empty formats', () => {
    expect(normalizeFormats([])).toEqual([]);
  });

  it('should accept missing formats', () => {
    expect(normalizeFormats()).toEqual([]);
  });
});

describe('coreConfigMiddleware', () => {
  it('should attempt to load code-pushup.config.(ts|mjs|js) by default', async () => {
    await coreConfigMiddleware(
      {} as GeneralCliOptions & CoreConfigCliOptions & FilterOptions,
    );
    expect(autoloadRc).toHaveBeenCalled();
  });

  it('should directly attempt to load passed config', async () => {
    await coreConfigMiddleware({
      config: 'cli/custom-config.mjs',
    } as GeneralCliOptions & CoreConfigCliOptions & FilterOptions);
    expect(autoloadRc).not.toHaveBeenCalled();
    expect(readRcByPath).toHaveBeenCalledWith(
      'cli/custom-config.mjs',
      undefined,
    );
  });

  it('should forward --tsconfig option to config autoload', async () => {
    await coreConfigMiddleware({
      tsconfig: 'tsconfig.base.json',
    } as GeneralCliOptions & CoreConfigCliOptions & FilterOptions);
    expect(autoloadRc).toHaveBeenCalledWith('tsconfig.base.json');
  });

  it('should forward --tsconfig option to custom config load', async () => {
    await coreConfigMiddleware({
      config: 'apps/website/code-pushup.config.ts',
      tsconfig: 'apps/website/tsconfig.json',
    } as GeneralCliOptions & CoreConfigCliOptions & FilterOptions);
    expect(readRcByPath).toHaveBeenCalledWith(
      'apps/website/code-pushup.config.ts',
      'apps/website/tsconfig.json',
    );
  });
});
