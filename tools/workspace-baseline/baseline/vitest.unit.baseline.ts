import { arr, object } from '../src/lib/baseline/baseline.json';
import { createTsBaseline } from '../src/lib/baseline/baseline.ts';
import type { VitestUserConfig } from '../src/lib/baseline/vitest.type';

/**
 * Baseline for Vitest unit test configurations (vitest.unit.config.ts).
 *
 * Standardizes:
 * - Cache directory paths (project-specific)
 * - Test configuration (reporters, globals, pool settings)
 * - Test file includes (unit and type tests)
 * - Global setup and setup files
 * - Coverage configuration with standard exclusions
 * - Typecheck configuration for type tests
 */
const vitestUnitBase = createTsBaseline({
  matcher: ['vitest.unit.config.ts'],
  projects: ['workspace-baseline'],
  fileName: 'vitest.unit.config.ts',
  baseline: root =>
    root.set({
      cacheDir: '../../node_modules/.vite/{projectName}',
      test: object(t =>
        t.set({
          reporters: arr(r => r.add('basic')),
          globals: true,
          cache: object(c => c.set({ dir: '../../node_modules/.vitest' })),
          alias: arr(a => a), // Preserve existing alias configuration
          pool: 'threads',
          poolOptions: object(p =>
            p.set({
              threads: object(th => th.set({ singleThread: true })),
            }),
          ),
          environment: 'node',
          include: arr(i =>
            i.add(
              'src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
              'src/**/*.type.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ),
          ),
          globalSetup: arr(g => g.add('../../global-setup.ts')),
          setupFiles: arr(s =>
            s.add(
              '../../testing/test-setup/src/lib/reset.mocks.ts',
              '../../testing/test-setup/src/lib/fs.mock.ts',
              '../../testing/test-setup/src/lib/logger.mock.ts',
              '../../testing/test-setup/src/lib/git.mock.ts',
              '../../testing/test-setup/src/lib/performance.setup-file.ts',
              '../../testing/test-setup/src/lib/portal-client.mock.ts',
              '../../testing/test-setup/src/lib/process.setup-file.ts',
              '../../testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
              '../../testing/test-setup/src/lib/extend/path.matcher.ts',
              '../../testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
            ),
          ),
          coverage: object(c =>
            c.set({
              reporter: arr(r => r.add('text', 'lcov')),
              reportsDirectory: '../../coverage/{projectName}/unit-tests',
              exclude: arr(e =>
                e.add(
                  'tests/**',
                  'perf/**',
                  'mocks/**',
                  '**/fixtures/**',
                  '**/*.mock.ts',
                  '**/*.fixture.ts',
                  '**/vitest.*.config.ts',
                  '**/vitest.config.ts',
                  '**/code-pushup.config.ts',
                  '**/*.config.ts',
                  '**/index.ts',
                  '**/index.js',
                  '**/index.mjs',
                  '**/models.ts',
                  '**/*.model.ts',
                  '**/types.ts',
                  '**/*.type.ts',
                  '**/constants.ts',
                  '**/*.d.ts',
                ),
              ),
            }),
          ),
          typecheck: object(tc =>
            tc.set({
              include: arr(i => i.add('**/*.type.test.ts')),
            }),
          ),
        }),
      ),
    }),
});

export default vitestUnitBase;
