import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { obj } from '../src/lib/baseline.tsconfig';
import { BASE_VITEST_TYPES } from './constants';

/**
 * Baseline for nx-plugin package configurations (tsconfig.json for nx-plugin).
 *
 * Standardizes:
 * - CommonJS module type (required for nx-plugin compatibility)
 * - verbatimModuleSyntax: false for CommonJS compatibility
 * - All strict TypeScript flags from base config
 *
 * Note: This baseline targets nx-plugin projects specifically.
 * Use tags to target specific projects.
 */
export const tsconfigNxPluginBase = createTsconfigBase('tsconfig.json', {
  tags: ['nx-plugin'],
  // Don't enforce extends as it varies by project depth (../../tsconfig.base.json for packages, etc.)
  enforceExtends: false,
  // Don't enforce include/files as root tsconfig.json files with references should have empty arrays
  enforceInclude: false,
  enforceExclude: false,
  compilerOptions: obj.add({
    module: 'CommonJS',
    verbatimModuleSyntax: false,
    // Keep other compiler options from base (strict flags, etc.)
    forceConsistentCasingInFileNames: true,
    strict: true,
    noImplicitOverride: true,
    noPropertyAccessFromIndexSignature: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    types: BASE_VITEST_TYPES,
  }),
});
