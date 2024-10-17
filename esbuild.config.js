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
              `npx tsc --emitDeclarationOnly --project ${tsConfig} --outDir dist`,
            );
          } catch (err) {
            console.error(err);
            throw err;
          }
        });
      },
    },
  ],
};
