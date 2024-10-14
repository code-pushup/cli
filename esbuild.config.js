const { readFile, writeFile, stat } = require('node:fs/promises');
const { exec } = require('node:child_process');
const { promisify } = require('node:util');

const { createProjectGraphAsync } = require('@nx/devkit');

const { NX_TASK_TARGET_PROJECT, NX_TASK_TARGET_TARGET } = process.env;
if (!NX_TASK_TARGET_PROJECT) {
  throw new Error('Missing NX_TASK_TARGET_PROJECT environment variable');
}
if (!NX_TASK_TARGET_TARGET) {
  throw new Error('Missing NX_TASK_TARGET_TARGET environment variable');
}

const getNxProject = async () => {
  const graph = await createProjectGraphAsync();
  return graph.nodes[NX_TASK_TARGET_PROJECT];
};

/**
 * @param {import('@nx/devkit').ProjectGraphProjectNode} project
 * @returns {import('@nx/esbuild/src/executors/esbuild/schema').EsBuildExecutorOptions}
 */
const getESBuildExecutorOptions = project => {
  const target = project.data.targets[NX_TASK_TARGET_TARGET];
  if (target.executor !== '@nx/esbuild:esbuild') {
    throw new Error(
      `Unexpected ${target.executor} executor for ${NX_TASK_TARGET_TARGET} target, expected @nx/esbuild:esbuild`,
    );
  }
  return target.options;
};

/** @type {import('esbuild').BuildOptions} */
module.exports = {
  plugins: [
    {
      name: 'TypeScriptDeclarations',
      setup(build) {
        build.onEnd(async result => {
          if (result.errors.length > 0) return;

          const project = await getNxProject();
          const { tsConfig } = getESBuildExecutorOptions(project);

          try {
            await promisify(exec)(
              `tsc --emitDeclarationOnly --project ${tsConfig} --outDir dist`,
            );
          } catch (err) {
            console.error(err);
            throw err;
          }
        });
      },
    },
    {
      name: 'PackageJSON',
      setup(build) {
        build.onEnd(async result => {
          if (result.errors.length > 0) return;

          const project = await getNxProject();
          const { outputPath } = getESBuildExecutorOptions(project);

          const sourcePackageJsonPath = `${project.data.root}/package.json`;
          const outputPackageJsonPath = `${outputPath}/package.json`;

          const isPublishable = await stat(sourcePackageJsonPath)
            .then(stats => stats.isFile())
            .catch(() => false);

          if (!isPublishable) {
            /** @type {import('nx/src/utils/package-json').PackageJson} */
            const newPackageJson = {
              name: `@code-pushup/${project.name}`,
              private: true,
              type: 'module',
              main: 'index.js',
              types: 'src/index.d.ts',
            };
            await writeFile(
              outputPackageJsonPath,
              JSON.stringify(newPackageJson, null, 2),
            );
            return;
          }

          /** @type {import('nx/src/utils/package-json').PackageJson} */
          const packageJson = JSON.parse(
            await readFile(sourcePackageJsonPath, 'utf8'),
          );

          /** @type {import('nx/src/utils/package-json').PackageJson} */
          const rootPackageJson = JSON.parse(
            await readFile('package.json', 'utf8'),
          );

          packageJson.license = rootPackageJson.license;
          if (project.name === 'cli') {
            packageJson.homepage = rootPackageJson.homepage;
          } else {
            packageJson.homepage = `https://github.com/code-pushup/cli/tree/main/packages/${project.name}#readme`;
          }
          packageJson.bugs = rootPackageJson.bugs;
          packageJson.repository = {
            ...rootPackageJson.repository,
            directory: project.data.root,
          };
          packageJson.contributors = rootPackageJson.contributors;
          packageJson.publishConfig = { access: 'public' };
          packageJson.type = 'module';
          packageJson.main = './index.js';
          packageJson.types = './src/index.d.ts';

          await writeFile(
            outputPackageJsonPath,
            JSON.stringify(packageJson, null, 2),
          );
        });
      },
    },
  ],
};
