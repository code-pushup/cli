import {
  type ConfigRestParams,
  type VitestOverrides,
  createVitestConfig,
} from './vitest-config-factory.js';

const CONSOLE_MOCK_PATH = 'testing/test-setup/src/lib/console.mock.ts';
const RESET_MOCKS_PATH = 'testing/test-setup/src/lib/reset.mocks.ts';

export const setupPresets = {
  unit: {
    base: [
      CONSOLE_MOCK_PATH,
      RESET_MOCKS_PATH,
      'testing/test-setup/src/lib/cliui.mock.ts',
      'testing/test-setup/src/lib/fs.mock.ts',
      'testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
    ],
    git: ['testing/test-setup/src/lib/git.mock.ts'],
    portalClient: ['testing/test-setup/src/lib/portal-client.mock.ts'],
    matchersCore: [
      'testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
      'testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
    ],
    matcherPath: ['testing/test-setup/src/lib/extend/path.matcher.ts'],
  },
  int: {
    base: [CONSOLE_MOCK_PATH, RESET_MOCKS_PATH],
    cliui: ['testing/test-setup/src/lib/cliui.mock.ts'],
    fs: ['testing/test-setup/src/lib/fs.mock.ts'],
    git: ['testing/test-setup/src/lib/git.mock.ts'],
    portalClient: ['testing/test-setup/src/lib/portal-client.mock.ts'],
    matcherPath: ['testing/test-setup/src/lib/extend/path.matcher.ts'],
    chromePath: ['testing/test-setup/src/lib/chrome-path.mock.ts'],
  },
  e2e: {
    base: [RESET_MOCKS_PATH],
  },
} as const;

export const createUnitConfig = (
  projectKey: string,
  rest: ConfigRestParams,
  overrides?: VitestOverrides,
) => {
  const finalSetupFiles = overrides?.test?.setupFiles ?? [
    ...setupPresets.unit.base,
  ];

  return createVitestConfig(
    { projectKey, kind: 'unit', ...rest },
    { ...overrides, test: { ...overrides?.test, setupFiles: finalSetupFiles } },
  );
};

export const createIntConfig = (
  projectKey: string,
  rest: ConfigRestParams,
  overrides?: VitestOverrides,
) => {
  const finalSetupFiles = overrides?.test?.setupFiles ?? [
    ...setupPresets.int.base,
  ];

  return createVitestConfig(
    { projectKey, kind: 'int', ...rest },
    { ...overrides, test: { ...overrides?.test, setupFiles: finalSetupFiles } },
  );
};

export const createE2eConfig = (
  projectKey: string,
  rest: ConfigRestParams,
  overrides?: VitestOverrides,
) => {
  const finalSetupFiles = overrides?.test?.setupFiles ?? [
    ...setupPresets.e2e.base,
  ];

  return createVitestConfig(
    { projectKey, kind: 'e2e', ...rest },
    { ...overrides, test: { ...overrides?.test, setupFiles: finalSetupFiles } },
  );
};
