import {
  KnipConfigPlugin,
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
          rootFolder + '/mocks/**' /*rootFolder + '/perf/**' SHOULD WORK */,
        ],
        entry: [rootFolder + '/src/bin.ts', rootFolder + '/perf/**/index.ts'],
      };
    },
  });

const withExamplePlugins = (): KnipConfigPlugin => () => {
  return {
    entry: ['examples/plugins/**/src/index.ts'],
  };
};

const withReactExample = (): KnipConfigPlugin => () => {
  return {
    entry: ['examples/react-todos-app/src/index.jsx'],
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
      config: ['commitlint.config.js'],
    },
    entry: [
      '**/src/bin.ts',
      '**/perf/**/index.ts',
      // unknown why this is needed, it should be picked up by knip from the vitest setup files
      'testing/test-utils/src/index.ts',
      'testing/test-utils/src/lib/fixtures/configs/*.ts',
      'testing/test-setup/src/index.ts',
      'testing/test-setup/src/lib/**/*.{js,mjs,ts,cjs,mts,cts}',
      'global-setup.ts',
      'global-setup.e2e.ts',
      // missing knip plugin for now, so this is in the root entry
      '**/code-pushup.config.{ts,js,mjs}',
      'packages/models/zod2md.config.ts',
      'esbuild.config.js',
      'tools/**/*.{js,mjs,ts,cjs,mts,cts}',
    ],
    ignoreDependencies: [
      'prettier',
      '@swc/helpers',
      '@swc/cli',
      '@nx/plugin',
      '@nx/workspace',
      // ignored becasue fake dept from a thes (but valid catch)
      '@example/custom-plugin',
      // Same issue as the other vitest related, it should be picked up by knip from the vitest setup files
      //  'global-setup.ts',
      //  'global-setup.e2e.ts',

      // Should be picked up by knip from the vitest setup files
      // 'basic',
      // Should be picked up by the commit lint knip config
      //  'commitlint-plugin-tense',

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
