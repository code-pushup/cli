export const setupPresets = {
  unit: {
    base: [
      'testing/test-setup/src/lib/console.mock.ts',
      'testing/test-setup/src/lib/reset.mocks.ts',
    ],
    cliui: ['testing/test-setup/src/lib/cliui.mock.ts'],
    fs: ['testing/test-setup/src/lib/fs.mock.ts'],
    git: ['testing/test-setup/src/lib/git.mock.ts'],
    portalClient: ['testing/test-setup/src/lib/portal-client.mock.ts'],
    matchersCore: [
      'testing/test-setup/src/lib/extend/ui-logger.matcher.ts',
      'testing/test-setup/src/lib/extend/markdown-table.matcher.ts',
      'testing/test-setup/src/lib/extend/jest-extended.matcher.ts',
    ],
    matcherPath: ['testing/test-setup/src/lib/extend/path.matcher.ts'],
  },
  int: {
    base: [
      'testing/test-setup/src/lib/console.mock.ts',
      'testing/test-setup/src/lib/reset.mocks.ts',
    ],
    cliui: ['testing/test-setup/src/lib/cliui.mock.ts'],
    fs: ['testing/test-setup/src/lib/fs.mock.ts'],
    git: ['testing/test-setup/src/lib/git.mock.ts'],
    portalClient: ['testing/test-setup/src/lib/portal-client.mock.ts'],
    matcherPath: ['testing/test-setup/src/lib/extend/path.matcher.ts'],
    chromePath: ['testing/test-setup/src/lib/chrome-path.mock.ts'],
  },
  e2e: {
    base: ['testing/test-setup/src/lib/reset.mocks.ts'],
  },
} as const;
