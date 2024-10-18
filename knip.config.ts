import {
  type KnipConfigPlugin,
  combineNxKnipPlugins,
  withEsbuildApps,
  withEsbuildPublishableLibs,
  withEslint,
  withLibraryMapper,
  withLocalNxPlugins,
  withNxTsPaths,
  withVitest,
} from '@beaussan/nx-knip';

const withIgnoreMockInLibs = () =>
  withLibraryMapper({
    mapperFn: ({ rootFolder }) => {
      return {
        ignore: [rootFolder + '/mocks/**', rootFolder + '/perf/**'],
        entry: [rootFolder + '/src/bin.ts', rootFolder + '/perf/**/index.ts'],
      };
    },
  });

const withExamplePlugins = (): KnipConfigPlugin => () => {
  return {
    // Given there is no publish target, thoes libs were not picked up by the auto discovery
    entry: [
      'examples/plugins/src/index.ts',
      'packages/plugin-lighthouse/src/index.ts',
    ],
  };
};

const withReactExample = (): KnipConfigPlugin => () => {
  return {
    entry: [
      'examples/react-todos-app/src/index.jsx',
      'examples/react-todos-app/test-setup.js',
    ],
    eslint: {
      // Given there is no lint target on the project, we need to manually specify the entry point
      config: ['examples/react-todos-app/.eslintrc.js'],
    },
  };
};

const withNxStandards = (): KnipConfigPlugin => () => {
  return {
    project: ['**/*.{ts,js,tsx,jsx}'],
    ignore: ['tmp/**', 'node_modules/**'],
    commitlint: {
      config: ['commitlint.config.mjs'],
    },
    exclude: ['duplicates'],
    entry: [
      // unknown why this is needed, it should be picked up by knip from the vitest setup files
      'testing/test-utils/src/index.ts',
      'testing/test-utils/src/lib/fixtures/configs/*.ts',
      'testing/test-setup/src/index.ts',
      'testing/test-setup/src/lib/**/*.{js,mjs,ts,cjs,mts,cts}',
      'global-setup.ts',
      'global-setup.e2e.ts',
      'examples/react-todos-app/code-pushup.config.js',
      'examples/plugins/code-pushup.config.ts',
      'testing/test-utils/src/lib/fixtures/configs/code-pushup.config.js',
      'testing/test-utils/src/lib/fixtures/configs/code-pushup.empty.config.js',
      'examples/plugins/src/package-json/src/index.ts',
      // missing knip plugin for now, so this is in the root entry
      'packages/models/zod2md.config.ts',
      'code-pushup.config.ts',
      'esbuild.config.js',
      'tools/**/*.{js,mjs,ts,cjs,mts,cts}',
    ],
    ignoreDependencies: [
      'prettier',
      '@swc/helpers',
      '@swc/cli',
      '@nx/plugin',
      '@nx/workspace',
      // Same issue as the other vitest related, it should be picked up by knip from the vitest setup files
      // 'global-setup.ts',
      // 'global-setup.e2e.ts',

      // Knip should be able to pick up this
      'tsx',
      // Not a npm library, and resolved in a different typescript path than the global import one
      '@example/custom-plugin',

      // Prettier magic resolve is not picked up by knip
      '@trivago/prettier-plugin-sort-imports',
    ],
  };
};

export default combineNxKnipPlugins(
  withNxTsPaths(),
  withLocalNxPlugins({ pluginNames: ['nx-plugin'] }),
  withEsbuildApps(),
  withEsbuildPublishableLibs(),
  withVitest(),
  withIgnoreMockInLibs(),
  withEslint(),
  withReactExample(),
  withExamplePlugins(),
  withNxStandards(),
);
