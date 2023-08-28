import { readJsonFile, writeJsonFile } from '@nx/devkit';
import { basename } from 'path';
import { build } from 'tsup';
import type { PackageJson } from 'type-fest';
import { TsupExecutorSchema } from './schema';

export default async function runExecutor(options: TsupExecutorSchema) {
  await build({
    entry: [options.main],
    outDir: options.outputPath,
    tsconfig: options.tsConfig,
    platform: 'node',
    format: options.format,
    dts: true,
    cjsInterop: true,
    splitting: true,
    clean: options.deleteOutputPath,
    skipNodeModulesBundle: true,
  });

  const packageJson = readJsonFile<PackageJson>(options.project);

  const entryName = basename(options.main).replace(/\.[tj]s$/, '');
  const typesPath = options.format.includes('cjs')
    ? `./${entryName}.d.ts`
    : `./${entryName}.d.mts`;
  const esmPath = `./${entryName}.mjs`;
  const cjsPath = `./${entryName}.js`;

  packageJson.exports = {
    '.': {
      types: typesPath,
      ...(options.format.includes('esm') && { import: esmPath }),
      ...(options.format.includes('cjs') && { require: cjsPath }),
      default: options.format.includes('cjs') ? cjsPath : esmPath,
    },
    './package.json': './package.json',
  };
  packageJson.main = options.format.includes('cjs') ? cjsPath : esmPath;
  if (options.format.includes('esm')) {
    packageJson.module = esmPath;
  }
  packageJson.types = typesPath;

  writeJsonFile(`${options.outputPath}/package.json`, packageJson);

  return {
    success: true,
  };
}
