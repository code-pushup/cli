const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

const project = process.env.NX_TASK_TARGET_PROJECT;

esbuild.build({
  plugins: [
    {
      name: 'TypeScriptDeclarations',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length > 0) return;

          execSync(
            `tsc --emitDeclarationOnly --project packages/${project}/tsconfig.lib.json --outDir dist`,
          );
        });
      },
    },
    {
      name: 'PackageJSON',
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length > 0) return;

          /** @type {import('type-fest').PackageJson} */
          const packageJson = JSON.parse(
            readFileSync(`packages/${project}/package.json`).toString(),
          );

          packageJson.type = 'module';
          packageJson.main = './index.js';
          packageJson.types = './src/index.d.ts';

          writeFileSync(
            `dist/packages/${project}/package.json`,
            JSON.stringify(packageJson, null, 2),
          );
        });
      },
    },
  ],
});
