import { createTsconfigBase } from '../../baseline.tsconfig';
import { arr, obj, set } from '../../json-updater';

/**
 * Returns baseline configurations without external dependencies.
 * This approach inlines the baseline configurations to avoid import issues.
 *
 * @returns Array of baseline configurations
 */
export async function loadBaselineRc(): Promise<any[]> {
  const baselines: any[] = [];

  // tsconfig.lib.json baseline
  baselines.push(
    createTsconfigBase('tsconfig.lib.json', {
      extends: (v, path) => ({
        value: './tsconfig.json',
        diagnostics:
          v !== './tsconfig.json'
            ? [
                {
                  path,
                  message: v === undefined ? 'added' : 'updated',
                  before: v,
                  after: './tsconfig.json',
                },
              ]
            : [],
      }),
      compilerOptions: (v, path) => ({
        value: {
          outDir: '../../dist/out-tsc',
          declaration: true,
          types: ['node'],
          ...v,
        },
        diagnostics: [],
      }),
      include: (v, path) => ({
        value: ['src/**/*.ts'],
        diagnostics: [],
      }),
      exclude: (v, path) => ({
        value: [
          'vitest.unit.config.ts',
          'vitest.int.config.ts',
          'src/**/*.test.ts',
          'src/**/*.mock.ts',
          'mocks/**/*.ts',
        ],
        diagnostics: [],
      }),
    }),
  );

  // tsconfig.test.json baseline
  baselines.push(
    createTsconfigBase('tsconfig.test.json', {
      extends: (v, path) => ({
        value: './tsconfig.json',
        diagnostics:
          v !== './tsconfig.json'
            ? [
                {
                  path,
                  message: v === undefined ? 'added' : 'updated',
                  before: v,
                  after: './tsconfig.json',
                },
              ]
            : [],
      }),
      compilerOptions: (v, path) => ({
        value: {
          outDir: '../../dist/out-tsc',
          types: ['vitest/globals', 'node'],
          ...v,
        },
        diagnostics: [],
      }),
      include: (v, path) => ({
        value: [
          'src/**/*',
          'test/**/*',
          'tests/**/*',
          '**/*.test.ts',
          '**/*.spec.ts',
        ],
        diagnostics: [],
      }),
    }),
  );

  // tsconfig.json baseline (base configuration)
  baselines.push(
    createTsconfigBase('tsconfig.json', {
      compilerOptions: (v, path) => ({
        value: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true,
          strict: true,
          noImplicitOverride: true,
          noPropertyAccessFromIndexSignature: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          skipLibCheck: true,
          isolatedModules: true,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          ...v,
        },
        diagnostics: [],
      }),
    }),
  );

  return baselines;

  // tsconfig.lib.json baseline
  baselines.push(
    createTsconfigBase('tsconfig.lib.json', {
      extends: (v, path) => ({
        value: './tsconfig.json',
        diagnostics:
          v !== './tsconfig.json'
            ? [
                {
                  path,
                  message: v === undefined ? 'added' : 'updated',
                  before: v,
                  after: './tsconfig.json',
                },
              ]
            : [],
      }),
      compilerOptions: obj.add({
        outDir: '../../dist/out-tsc',
        declaration: true,
        types: ['node'],
      }),
      include: arr.add('src/**/*.ts'),
      exclude: arr.add(
        'vitest.unit.config.ts',
        'vitest.int.config.ts',
        'src/**/*.test.ts',
        'src/**/*.mock.ts',
        'mocks/**/*.ts',
      ),
    }),
  );

  // tsconfig.test.json baseline
  baselines.push(
    createTsconfigBase('tsconfig.test.json', {
      extends: (v, path) => ({
        value: './tsconfig.json',
        diagnostics:
          v !== './tsconfig.json'
            ? [
                {
                  path,
                  message: v === undefined ? 'added' : 'updated',
                  before: v,
                  after: './tsconfig.json',
                },
              ]
            : [],
      }),
      compilerOptions: obj.add({
        outDir: '../../dist/out-tsc',
        types: ['vitest/globals', 'node'],
      }),
      include: arr.add(
        'src/**/*',
        'test/**/*',
        'tests/**/*',
        '**/*.test.ts',
        '**/*.spec.ts',
      ),
    }),
  );

  // tsconfig.json baseline (base configuration)
  baselines.push(
    createTsconfigBase('tsconfig.json', {
      compilerOptions: (v, path) => ({
        value: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true,
          strict: true,
          noImplicitOverride: true,
          noPropertyAccessFromIndexSignature: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          skipLibCheck: true,
          isolatedModules: true,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          ...v,
        },
        diagnostics: [],
      }),
    }),
  );

  return baselines;
}
