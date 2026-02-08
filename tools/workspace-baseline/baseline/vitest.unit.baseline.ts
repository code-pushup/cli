import { arr, object } from '../src/lib/baseline/baseline.json';
import { createTsBaseline } from '../src/lib/baseline/baseline.ts';
import type { VitestUserConfig } from './vitest';
import {
  COVERAGE_UNIT_DIR,
  PROJECT_CACHE_DIR,
  STANDARD_COVERAGE_EXCLUDES,
  STANDARD_VITEST_SETUP_FILES,
} from './vitest';

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
 *
 * Note: This baseline uses the {projectName} placeholder for project-specific substitutions.
 * For import paths, you can use Nx-style interpolation:
 * - {workspaceRoot}/path/to/file - resolves to workspace root
 * - {projectRoot}/path/to/file - resolves to project root
 * - {projectName} - resolves to project name
 */
const vitestUnitBase = createTsBaseline({
  matcher: ['vitest.unit.config.ts'],
  projects: ['workspace-baseline'],
  fileName: 'vitest.unit.config.ts',
  baseline: root =>
    root.set({
      cacheDir: PROJECT_CACHE_DIR,
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
          setupFiles: arr(s => s.add(...STANDARD_VITEST_SETUP_FILES)),
          coverage: object(c =>
            c.set({
              reporter: arr(r => r.add('text', 'lcov')),
              reportsDirectory: COVERAGE_UNIT_DIR,
              exclude: arr(e => e.add(...STANDARD_COVERAGE_EXCLUDES)),
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
