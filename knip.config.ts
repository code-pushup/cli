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

export const withIgnoreMockInLibs = () =>
  withLibraryMapper({
    mapperFn: ({ rootFolder }) => {
      return {
        ignore: [rootFolder + '/mocks/**', rootFolder + '/perf/**'],
        entry: [rootFolder + '/src/bin.ts', rootFolder + '/perf/**/index.ts'],
      };
    },
  });

export const withNxStandards = (): KnipConfigPlugin => () => {
  return {
    project: ['**/*.{ts,js,tsx,jsx}'],
    ignore: ['tmp/**', 'node_modules/**', 'examples/**'],
    entry: [
      // unknown why this is needed, it should be picked up by knip from the vitest setup files
      'testing/test-utils/src/index.ts',
      'testing/test-utils/src/lib/fixtures/configs/*.ts',
      'testing/test-setup/src/index.ts',
      'testing/test-setup/src/lib/**/*.{js,mjs,ts,cjs,mts,cts}',
      'global-setup.ts',
      'global-setup.e2e.ts',
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
      'global-setup.ts',
      'global-setup.e2e.ts',
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
  withNxStandards(),
);
