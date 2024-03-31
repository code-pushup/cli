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
        ignore: [rootFolder + '/mocks/**'],
        entry: [rootFolder + '/src/bin.ts', rootFolder + '/perf/**/index.ts'],
      };
    },
  });

export const withCuNxStandards = (): KnipConfigPlugin => () => {
  return {
    project: ['**/*.{ts,js,tsx,jsx}'],
    ignore: ['tmp/**', 'node_modules/**', 'examples/**'],
    entry: [
      'testing/test-utils/src/index.ts',
      'testing/test-utils/src/lib/fixtures/configs/*.{js,mjs,ts,cjs,mts,cts}',
      'testing/test-setup/src/index.ts',
      'testing/test-setup/src/lib/**/*.{js,mjs,ts,cjs,mts,cts}',
      // Same issue as the other vitest related, it should be picked up by knip from the vitest setup files
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
      '@example/custom-plugin',
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
  withCuNxStandards(),
);
