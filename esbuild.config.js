const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');

const project = process.env.NX_TASK_TARGET_PROJECT;
const projectPath = project.startsWith('test-')
  ? `testing/${project}`
  : project === 'examples-plugins'
  ? 'examples/plugins'
  : `packages/${project}`;

/** @type {import('esbuild').BuildOptions} */
module.exports = {
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
    {
      name: 'PackageJSON',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length > 0) return;

          if (!existsSync(`${projectPath}/package.json`)) {
            /** @type {import('nx/src/utils/package-json').PackageJson} */
            const newPackageJson = {
              name: `@code-pushup/${project}`,
              private: true,
              type: 'module',
              main: 'index.js',
              types: 'src/index.d.ts',
            };
            writeFileSync(
              `dist/${projectPath}/package.json`,
              JSON.stringify(newPackageJson, null, 2),
            );
            return;
          }

          /** @type {import('nx/src/utils/package-json').PackageJson} */
          const packageJson = JSON.parse(
            readFileSync(`${projectPath}/package.json`).toString(),
          );

          /** @type {import('nx/src/utils/package-json').PackageJson} */
          const rootPackageJson = JSON.parse(
            readFileSync('package.json').toString(),
          );

          packageJson.license = rootPackageJson.license;
          packageJson.homepage = rootPackageJson.homepage;
          packageJson.bugs = rootPackageJson.bugs;
          packageJson.repository = {
            ...rootPackageJson.repository,
            directory: projectPath,
          };
          packageJson.contributors = rootPackageJson.contributors;
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
  ],
};
