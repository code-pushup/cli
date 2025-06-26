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
        ignore: [
          rootFolder + '/perf/**',
          '**/mock/**',
          '**/mocks/**',
          '**/__snapshots__/**',
        ],
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
    ignore: ['examples/**/constants.ts'],
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
    ignoreExportsUsedInFile: true,
    entry: [
      '**/index.ts',

      // unknown why this is needed, it should be picked up by knip from the vitest setup files
      'testing/test-{setup,utils}/src/lib/**/*.{js,mjs,ts,cjs,mts,cts}',
      'global-setup.*.ts',

      // missing knip plugin for now, so this is in the root entry
      'packages/models/zod2md.config.ts',
      '**/code-pushup.*.{js,mjs,ts,cjs,mts,cts}',
      '**/vitest.*.config.ts',
      '**/*.d.ts',
      'tools/**/*.{js,mjs,ts,cjs,mts,cts}',
    ],
    ignoreDependencies: [
      '@swc/helpers',
      '@swc/cli',
      '@nx/plugin',
      '@nx/workspace',
      '@nx/jest',
      '@nx/eslint',

      // Knip does not pick up this as it is used for TS execution
      'tsx',

      // Not a npm library, and resolved in a different typescript path than the global import one
      '@example/custom-plugin',

      '@code-pushup/models',
      '@code-pushup/utils',
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
