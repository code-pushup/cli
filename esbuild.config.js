const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

const project = process.env.NX_TASK_TARGET_PROJECT;
const isPublishable = project !== 'testing-utils';
const projectPath = isPublishable ? `packages/${project}` : project;

esbuild.build({
  plugins: [
    {
      name: 'TypeScriptDeclarations',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length > 0) return;

          try {
            execSync(
              `tsc --emitDeclarationOnly --project ${projectPath}/tsconfig.lib.json --outDir dist`,
            );
          } catch (err) {
            console.error(err);
          }
        });
      },
    },
    ...(isPublishable
      ? [
          {
            name: 'PackageJSON',
            setup(build) {
              build.onEnd(result => {
                if (result.errors.length > 0) return;

                /** @type {import('type-fest').PackageJson} */
                const rootPackageJson = JSON.parse(
                  readFileSync(`${__dirname}/package.json`).toString(),
                );

                /** @type {import('type-fest').PackageJson} */
                const packageJson = JSON.parse(
                  readFileSync(`${projectPath}/package.json`).toString(),
                );

                packageJson.license = rootPackageJson.license;
                packageJson.type = 'module';
                packageJson.main = './index.js';
                packageJson.types = './src/index.d.ts';

                writeFileSync(
                  `dist/${projectPath}/package.json`,
                  JSON.stringify(packageJson, null, 2),
                );
              });
            },
          },
        ]
      : []),
  ],
});
