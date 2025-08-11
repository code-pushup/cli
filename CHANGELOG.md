## 0.73.0 (2025-08-08)

### 🚀 Features

- **ci:** add searchCommits option to extend portal cache range ([0b14111f](https://github.com/code-pushup/cli/commit/0b14111f))

### ❤️ Thank You

- Matěj Chalk

## 0.72.1 (2025-08-06)

### 🩹 Fixes

- **ci:** download portal report for base commit and include details ([21572d52](https://github.com/code-pushup/cli/commit/21572d52))

### ❤️ Thank You

- Matěj Chalk

## 0.72.0 (2025-08-06)

### 🚀 Features

- **ci:** add configPatterns as optional performance optimization ([823ade1f](https://github.com/code-pushup/cli/commit/823ade1f))
- **cli:** use default report paths if --before/--after missing in compare command ([61ee2272](https://github.com/code-pushup/cli/commit/61ee2272))
- **core:** copy label from report.json inputs to report-diff.json output ([2adcf9db](https://github.com/code-pushup/cli/commit/2adcf9db))
- **models:** add optional label to report.json schema ([77d33b54](https://github.com/code-pushup/cli/commit/77d33b54))
- **utils:** interpolate variables in strings ([242435e0](https://github.com/code-pushup/cli/commit/242435e0))

### 🔥 Performance

- **ci:** use bulk command to compare reports for all projects ([f9deac78](https://github.com/code-pushup/cli/commit/f9deac78))

### ❤️ Thank You

- Matěj Chalk

## 0.71.0 (2025-08-01)

### 🚀 Features

- **ci:** download report from graphql api and convert to report.json format ([d35cd7a0](https://github.com/code-pushup/cli/commit/d35cd7a0))
- **ci:** parse upload along with persist in print-config commands ([a73bf21b](https://github.com/code-pushup/cli/commit/a73bf21b))
- **ci:** download previous report from portal if available ([918eb0d5](https://github.com/code-pushup/cli/commit/918eb0d5))
- **utils:** add type helpers for lower/upper case conversions ([50483748](https://github.com/code-pushup/cli/commit/50483748))

### ❤️ Thank You

- Matěj Chalk

## 0.70.0 (2025-07-31)

### 🚀 Features

- **ci:** update to zod v4 ([c342dab1](https://github.com/code-pushup/cli/commit/c342dab1))
- **ci:** remove redundant --no-progress argument ([b0ed2fa9](https://github.com/code-pushup/cli/commit/b0ed2fa9))
- **ci:** skip persist.format args if defaults already configured ([c11db95e](https://github.com/code-pushup/cli/commit/c11db95e))
- **cli:** disable progress bar in CI environment ([ecd42c60](https://github.com/code-pushup/cli/commit/ecd42c60))
- **models:** add generic artifact generation to enable caching ([#1023](https://github.com/code-pushup/cli/pull/1023))
- **models:** update to zod v4 ([7985c239](https://github.com/code-pushup/cli/commit/7985c239))
- **nx-plugin:** update to zod v4 ([91774182](https://github.com/code-pushup/cli/commit/91774182))
- **plugin-coverage:** update to zod v4 ([a0814d31](https://github.com/code-pushup/cli/commit/a0814d31))
- **plugin-eslint:** update zod to v4 ([4ef657f1](https://github.com/code-pushup/cli/commit/4ef657f1))
- **plugin-js-packages:** update to zod v4 ([c24b7435](https://github.com/code-pushup/cli/commit/c24b7435))
- **plugin-jsdocs:** update to zod v4 ([3444e8d3](https://github.com/code-pushup/cli/commit/3444e8d3))
- **plugin-lighthouse:** implement multiple URL support ([f4db1368](https://github.com/code-pushup/cli/commit/f4db1368))
- **plugin-typescript:** update to zod v4 ([6de416f4](https://github.com/code-pushup/cli/commit/6de416f4))
- **utils:** update to zod v4, replace zod-validation-error with z.prettifyError ([b1364d7d](https://github.com/code-pushup/cli/commit/b1364d7d))
- **utils:** parse boolean environment variables ([be08c188](https://github.com/code-pushup/cli/commit/be08c188))
- **utils:** detect ci environment ([3430d31b](https://github.com/code-pushup/cli/commit/3430d31b))
- **utils:** extract boolean value coercion to standalone function ([f76e4fb0](https://github.com/code-pushup/cli/commit/f76e4fb0))

### 🩹 Fixes

- **ci:** do not set --verbose by default ([ab39b050](https://github.com/code-pushup/cli/commit/ab39b050))
- **cli:** adapt format schema check to zod v4 ([77a384b0](https://github.com/code-pushup/cli/commit/77a384b0))
- **models:** use implementAsync for async z.function occurrences ([17931228](https://github.com/code-pushup/cli/commit/17931228))

### ❤️ Thank You

- Andrii Siuta
- Hanna Skryl @hanna-skryl
- Matěj Chalk

## 0.69.5 (2025-07-11)

### 🩹 Fixes

- **plugin-js-packages:** include url for outdated packages in modern yarn ([297766d1](https://github.com/code-pushup/cli/commit/297766d1))
- **plugin-js-packages:** include transitive dependencies in audit for modern yarn ([8e285e93](https://github.com/code-pushup/cli/commit/8e285e93))

### ❤️ Thank You

- Matěj Chalk

## 0.69.4 (2025-07-09)

### 🩹 Fixes

- **plugin-js-packages:** parse yarn 4 audit output correctly ([8041d870](https://github.com/code-pushup/cli/commit/8041d870))

### ❤️ Thank You

- Matěj Chalk

## 0.69.3 (2025-07-07)

### 🩹 Fixes

- **plugin-js-packages:** prevent negative scores in yarn v2+ workspaces ([b6f96330](https://github.com/code-pushup/cli/commit/b6f96330))

### ❤️ Thank You

- Matěj Chalk

## 0.69.2 (2025-06-16)

### 🩹 Fixes

- **plugin-coverage:** prevent invalid coverage when lcov has hit > found ([c796f30e](https://github.com/code-pushup/cli/commit/c796f30e))

### ❤️ Thank You

- Matěj Chalk

## 0.69.1 (2025-06-16)

### 🩹 Fixes

- **plugin-coverage:** skip invalid line numbers from tools like pytest-cov ([ba8b3171](https://github.com/code-pushup/cli/commit/ba8b3171))

### ❤️ Thank You

- Matěj Chalk

## 0.69.0 (2025-06-03)

### 🚀 Features

- **ci:** use nx cache friendly output path for print-config command ([35e334f5](https://github.com/code-pushup/cli/commit/35e334f5))
- **ci:** do not skip nx/turbo cache for print-config and compare commands ([c83ad36d](https://github.com/code-pushup/cli/commit/c83ad36d))

### ❤️ Thank You

- Matěj Chalk

## 0.68.0 (2025-05-19)

### 🚀 Features

- **core:** include trees when uploading audits to portal ([c1c6965e](https://github.com/code-pushup/cli/commit/c1c6965e))
- **models:** define tree data structure for audit details ([63bf44ca](https://github.com/code-pushup/cli/commit/63bf44ca))
- **plugin-coverage:** replace issues with tree ([2dc16890](https://github.com/code-pushup/cli/commit/2dc16890))
- **plugin-jsdocs:** replace issues with tree ([d347c0f2](https://github.com/code-pushup/cli/commit/d347c0f2))
- **plugin-jsdocs:** include end line number ([f2102eb5](https://github.com/code-pushup/cli/commit/f2102eb5))
- **plugin-lighthouse:** convert criticalrequestchain details to trees and table ([18d4230e](https://github.com/code-pushup/cli/commit/18d4230e))
- **plugin-lighthouse:** convert treemap-data details to trees ([19088927](https://github.com/code-pushup/cli/commit/19088927))
- **utils:** generate ascii tree in full markdown report's audit details ([ab462d42](https://github.com/code-pushup/cli/commit/ab462d42))
- **utils:** convert files array to tree structure ([211be5bf](https://github.com/code-pushup/cli/commit/211be5bf))
- **utils:** aggregate coverage per folder ([7ef0c14e](https://github.com/code-pushup/cli/commit/7ef0c14e))
- **utils:** sort coverage tree alphabetically with folders before files ([f87b869e](https://github.com/code-pushup/cli/commit/f87b869e))

### 🩹 Fixes

- **ci:** use absolute path in print-config --output file ([61ae18e1](https://github.com/code-pushup/cli/commit/61ae18e1))

### ❤️ Thank You

- Matěj Chalk

## 0.67.0 (2025-04-28)

### 🚀 Features

- **utils:** create helper function for sequential Promise.all ([556d8788](https://github.com/code-pushup/cli/commit/556d8788))

### 🩹 Fixes

- handle repos without git gracefully ([dba3ff58](https://github.com/code-pushup/cli/commit/dba3ff58))
- lint ([18225ede](https://github.com/code-pushup/cli/commit/18225ede))
- **ci:** prevent parallel print-config commands ([85ff390c](https://github.com/code-pushup/cli/commit/85ff390c))

### ❤️ Thank You

- Matěj Chalk
- Michael @rx-angular

## 0.66.2 (2025-04-07)

### 🩹 Fixes

- **plugin-typescript:** use consistent casing for plugin metadata (Typescript -> TypeScript) ([8e78e8d8](https://github.com/code-pushup/cli/commit/8e78e8d8))
- **plugin-typescript:** use same displayValue formatting as eslint ([87dadf33](https://github.com/code-pushup/cli/commit/87dadf33))

### ❤️ Thank You

- Matěj Chalk

## 0.66.1 (2025-04-07)

### 🩹 Fixes

- **plugin-typescript:** use default export ([1aa6211f](https://github.com/code-pushup/cli/commit/1aa6211f))

### ❤️ Thank You

- Matěj Chalk

## 0.66.0 (2025-04-04)

### 🚀 Features

- **plugin-typescript:** prepare for first release ([6b1e39d6](https://github.com/code-pushup/cli/commit/6b1e39d6))

### 🩹 Fixes

- **plugin-js-packages-e2e:** npm outdated fallback to "wanted" if "current" is missing ([ef5c2eee](https://github.com/code-pushup/cli/commit/ef5c2eee))

### ❤️ Thank You

- Matěj Chalk
- Vojtech Masek @vmasek

## 0.65.3 (2025-03-31)

### 🩹 Fixes

- **utils:** update esbuild to version patched for GHSA-67mh-4wv8-2f99 ([c5921ab2](https://github.com/code-pushup/cli/commit/c5921ab2))

### ❤️ Thank You

- Matěj Chalk

## 0.65.2 (2025-03-26)

### 🚀 Features

- **plugin-typescript:** adjust logic ([#975](https://github.com/code-pushup/cli/pull/975))

### 🩹 Fixes

- **plugin-js-packages:** handle empty output from yarn outdated ([a8cb0810](https://github.com/code-pushup/cli/commit/a8cb0810))

### ❤️ Thank You

- Matěj Chalk
- Michael Hladky @BioPhoton

## 0.65.1 (2025-03-11)

### 🩹 Fixes

- update pkgs ([#965](https://github.com/code-pushup/cli/pull/965))
- **ci:** prevent overwriting report artifacts ([3c7fa08f](https://github.com/code-pushup/cli/commit/3c7fa08f))
- **nx-plugin:** adjust upload config handling ([#937](https://github.com/code-pushup/cli/pull/937))

### ❤️ Thank You

- Matěj Chalk
- Michael Hladky @BioPhoton

## 0.65.0 (2025-03-05)

### 🚀 Features

- **utils:** add score filter to md report generation ([#956](https://github.com/code-pushup/cli/pull/956))

### ❤️ Thank You

- Michael Hladky @BioPhoton

## 0.64.2 (2025-03-05)

### 🩹 Fixes

- update nx-verdaccio pkg ([#954](https://github.com/code-pushup/cli/pull/954))
- **plugin-js-packages:** ignore non-empty stderr ([7936a00c](https://github.com/code-pushup/cli/commit/7936a00c))
- **utils:** ignore non-json lines in fromJsonLines utility ([7886c572](https://github.com/code-pushup/cli/commit/7886c572))

### ❤️ Thank You

- Matěj Chalk
- Michael Hladky @BioPhoton

## 0.64.1 (2025-03-04)

### 🩹 Fixes

- **ci:** always show execute process errors and log stdout if verbose ([b41de478](https://github.com/code-pushup/cli/commit/b41de478))
- **utils:** remove partial from mergeConfigs return type ([69c2ef4c](https://github.com/code-pushup/cli/commit/69c2ef4c))

### ❤️ Thank You

- Matěj Chalk
- Vojtech Masek @vmasek

## 0.64.0 (2025-02-27)

### 🚀 Features

- **ci:** allow refs without shas, fetch if needed ([2ee0a8d1](https://github.com/code-pushup/cli/commit/2ee0a8d1))

### ❤️ Thank You

- Matěj Chalk

## 0.63.0 (2025-02-26)

### 🚀 Features

- **ci:** use temporary file for print-config instead of stdout ([aa4d0b38](https://github.com/code-pushup/cli/commit/aa4d0b38))
- **cli:** add --output=<file> option to print-config command ([a1fde20c](https://github.com/code-pushup/cli/commit/a1fde20c))

### ❤️ Thank You

- Matěj Chalk

## 0.62.0 (2025-02-25)

### 🚀 Features

- log process working directory as cwd if undefined ([a0638f8c](https://github.com/code-pushup/cli/commit/a0638f8c))

### 🩹 Fixes

- **utils:** replace misleading commit labels in markdown diff ([21a1f25d](https://github.com/code-pushup/cli/commit/21a1f25d))

### ❤️ Thank You

- Matěj Chalk
- Vojtech Masek @vmasek

## 0.61.0 (2025-02-19)

### 🚀 Features

- **ci:** disable nx/turbo cache for non-autorun code-pushup commands ([29a1bc63](https://github.com/code-pushup/cli/commit/29a1bc63))
- **models:** do not throw if docs url invalid, treat as missing and log warning ([a54295c6](https://github.com/code-pushup/cli/commit/a54295c6))

### ❤️ Thank You

- Matěj Chalk

## 0.60.2 (2025-02-18)

### 🩹 Fixes

- **ci:** prevent unknown pathspec error for custom base ref ([60dfb5b2](https://github.com/code-pushup/cli/commit/60dfb5b2))

### ❤️ Thank You

- Matěj Chalk

## 0.60.1 (2025-02-18)

### 🩹 Fixes

- add toSorted polyfill as hotfix for bug in github actions runner ([55704d18](https://github.com/code-pushup/cli/commit/55704d18))
- **ci:** prevent ambigious ref when checking head ([f5f226e1](https://github.com/code-pushup/cli/commit/f5f226e1))

### ❤️ Thank You

- Matěj Chalk
- Vojtech Masek @vmasek

## 0.60.0 (2025-02-18)

### 🚀 Features

- **ci:** add skipComment option ([9ac2a6ba](https://github.com/code-pushup/cli/commit/9ac2a6ba))
- **plugin-typescript:** add TS core logic ([#932](https://github.com/code-pushup/cli/pull/932))
- **plugin-typescript:** add plugin logic ([#936](https://github.com/code-pushup/cli/pull/936))

### 🩹 Fixes

- **ci:** ensure head ref is checked out ([74db9023](https://github.com/code-pushup/cli/commit/74db9023))

### ❤️ Thank You

- Matěj Chalk
- Michael Hladky @BioPhoton

## 0.59.0 (2025-02-14)

### 🚀 Features

- **plugin-coverage:** do not halt plugin execution on fail ([23f1ce5c](https://github.com/code-pushup/cli/commit/23f1ce5c))
- **utils:** add string helper ([#916](https://github.com/code-pushup/cli/pull/916))

### 🩹 Fixes

- explicitly exit process with successful code to not leave cli hanging ([2cb815bb](https://github.com/code-pushup/cli/commit/2cb815bb))

### ❤️ Thank You

- Michael Hladky @BioPhoton
- Vojtech Masek @vmasek

## 0.58.0 (2025-02-12)

### 🚀 Features

- **models:** auto-generate JSDoc annotations ([29cf02ad](https://github.com/code-pushup/cli/commit/29cf02ad))
- **plugin-coverage:** support lcovonly option for vitest ([b230a3d2](https://github.com/code-pushup/cli/commit/b230a3d2))
- **plugin-eslint:** add support for custom groups ([#925](https://github.com/code-pushup/cli/pull/925))
- **plugin-jsdocs:** add plugin-jsdocs to analyze documentation in ts/js projects ([#896](https://github.com/code-pushup/cli/pull/896))
- **plugin-typescript:** setup plugin project base ([#917](https://github.com/code-pushup/cli/pull/917))

### 🩹 Fixes

- handle skipped audits and groups ([#911](https://github.com/code-pushup/cli/pull/911))
- fix poppinss version ([#921](https://github.com/code-pushup/cli/pull/921))
- nest files with timestamp for plugin runners ([4ecf9772](https://github.com/code-pushup/cli/commit/4ecf9772))
- **models:** add missing exports ([#918](https://github.com/code-pushup/cli/pull/918))
- **nx-plugin:** deep merge executor options ([#927](https://github.com/code-pushup/cli/pull/927))

### ❤️ Thank You

- Alejandro @aramirezj
- Hanna Skryl @hanna-skryl
- hanna-skryl
- Michael Hladky @BioPhoton
- Vojtech Masek @vmasek

## 0.57.0 (2024-12-17)

### 🚀 Features

- **ci:** detect persist config from print-config ([ad8bd284](https://github.com/code-pushup/cli/commit/ad8bd284))
- **ci:** remove obsolete output option ([0b9d679e](https://github.com/code-pushup/cli/commit/0b9d679e))
- **ci:** implement run many command resolution for each monorepo tool ([094797d9](https://github.com/code-pushup/cli/commit/094797d9))
- **ci:** add parallel option ([85e51864](https://github.com/code-pushup/cli/commit/85e51864))
- **ci:** filter nx run-many by projects from nx show projects as fallback ([97a603cc](https://github.com/code-pushup/cli/commit/97a603cc))
- **ci:** sort nx projects alphabetically ([6a6c2f3d](https://github.com/code-pushup/cli/commit/6a6c2f3d))
- **ci:** copy merged-report-diff.md from project to root ([e1305295](https://github.com/code-pushup/cli/commit/e1305295))
- **ci:** implement bulk collecting reports for parallel monorepo runs ([e0b4d97f](https://github.com/code-pushup/cli/commit/e0b4d97f))
- **core:** enhance config validation ([836b242d](https://github.com/code-pushup/cli/commit/836b242d))
- **utils:** implement type guard for nullable object props ([c3fc549e](https://github.com/code-pushup/cli/commit/c3fc549e))

### 🩹 Fixes

- prevent "ExperimentalWarning: Importing JSON" logged to stderr ([8ce9e635](https://github.com/code-pushup/cli/commit/8ce9e635))
- update progress bar gradually as plugin run complete ([7a592ebd](https://github.com/code-pushup/cli/commit/7a592ebd))
- lint import extensions and fix missing .js extensions ([9d6eacf4](https://github.com/code-pushup/cli/commit/9d6eacf4))
- **ci:** handle non-JSON prefix/suffix lines from print-config ([43ffcf2d](https://github.com/code-pushup/cli/commit/43ffcf2d))
- **ci:** ensure valid output directory for reports and merged diff ([5e36323d](https://github.com/code-pushup/cli/commit/5e36323d))
- **ci:** resolve outputDir correctly by running workspace commands in project dir ([94b25f88](https://github.com/code-pushup/cli/commit/94b25f88))
- **ci:** only copy merged-report-diff.md when paths are different ([f8ac4007](https://github.com/code-pushup/cli/commit/f8ac4007))
- **nx-plugin:** use wildcard path imports to prevent CJS runtime errors ([31bed82a](https://github.com/code-pushup/cli/commit/31bed82a))
- **plugin-eslint:** avoid directory imports ([688a4859](https://github.com/code-pushup/cli/commit/688a4859))
- **plugin-eslint:** consider defaultOptions to ensure rule slugs from runner match ([13de4b57](https://github.com/code-pushup/cli/commit/13de4b57))
- **plugin-eslint:** handle mismatched slugs for legacy configs ([e324f39d](https://github.com/code-pushup/cli/commit/e324f39d))
- **plugin-eslint:** parse rule names containing slashes correctly ([f1163d0a](https://github.com/code-pushup/cli/commit/f1163d0a))

### ❤️ Thank You

- Hanna Skryl @hanna-skryl
- Matěj Chalk
- Vojtech Masek @vmasek

## 0.56.0 (2024-11-29)

### 🚀 Features

- **ci:** add nxProjectsFilter option, forwards custom filters to Nx CLI ([93a6a428](https://github.com/code-pushup/cli/commit/93a6a428))
- **plugin-eslint:** support new config format in nx helpers ([effd5d26](https://github.com/code-pushup/cli/commit/effd5d26))

### ❤️ Thank You

- Matěj Chalk

## 0.55.0 (2024-11-25)

### 🚀 Features

- **ci:** accept custom output directory, with project name interpolation ([db3fcced](https://github.com/code-pushup/cli/commit/db3fcced))
- **plugin-eslint:** drop inline object support for eslintrc (incompatible with flat config) ([ead1c0ad](https://github.com/code-pushup/cli/commit/ead1c0ad))
- **plugin-eslint:** implement rules loader for flat config ([e9edf0c0](https://github.com/code-pushup/cli/commit/e9edf0c0))
- **plugin-eslint:** detect version of config format ([a618bf29](https://github.com/code-pushup/cli/commit/a618bf29))
- **plugin-eslint:** search for flat config files in parent directories ([3e45ac07](https://github.com/code-pushup/cli/commit/3e45ac07))
- **plugin-eslint:** move eslint to peer deps, add v9 to supported range ([953e3c76](https://github.com/code-pushup/cli/commit/953e3c76))
- **utils:** implement and test helper function to find nearest file ([2acdb2d8](https://github.com/code-pushup/cli/commit/2acdb2d8))

### 🩹 Fixes

- **plugin-eslint:** remove unsupported parameter for ESLint 9+ ([4b889d66](https://github.com/code-pushup/cli/commit/4b889d66))
- **plugin-eslint:** use LegacyESLint if ESLINT_USE_FLAT_CONFIG=false in v9 ([e9352808](https://github.com/code-pushup/cli/commit/e9352808))
- **plugin-eslint:** ensure file url scheme needed for dynamic imports on Windows ([91c7678c](https://github.com/code-pushup/cli/commit/91c7678c))
- **plugin-js-packages:** add ignoreExitCode option for yarn v2 package manager ([#878](https://github.com/code-pushup/cli/pull/878))

### ❤️ Thank You

- Edouard Maleix
- Matěj Chalk

## 0.54.0 (2024-11-08)

### 🚀 Features

- **plugin-eslint:** add exclude option for Nx projects ([e9560f56](https://github.com/code-pushup/cli/commit/e9560f56))

### 🩹 Fixes

- **ci:** pass project name to downloadReportArtifact ([647f7e28](https://github.com/code-pushup/cli/commit/647f7e28))
- **ci:** improve misleading logs ([cfece081](https://github.com/code-pushup/cli/commit/cfece081))
- **ci:** catch errors from downloadReportArtifact - log warning and proceed ([3df4a71a](https://github.com/code-pushup/cli/commit/3df4a71a))
- **models:** allow non-integers in audit values diff ([61d49ea4](https://github.com/code-pushup/cli/commit/61d49ea4))
- **plugin-eslint,plugin-coverage:** future-proof version range of nx peer deps ([52afea5a](https://github.com/code-pushup/cli/commit/52afea5a))
- **utils:** always log single perfect audit ([d8a7eb25](https://github.com/code-pushup/cli/commit/d8a7eb25))

### ❤️ Thank You

- Hanna Skryl @hanna-skryl
- hanna-skryl
- Matěj Chalk

## 0.53.1 (2024-10-18)

### 🚀 Features

- add keywords for NPM to display ([17a0c498](https://github.com/code-pushup/cli/commit/17a0c498))

### 🩹 Fixes

- **ci:** handle monorepo mode in non-PR flow ([d7ba5a3f](https://github.com/code-pushup/cli/commit/d7ba5a3f))

### ❤️ Thank You

- Matěj Chalk
- Vojtech Masek @vmasek

## 0.53.0 (2024-10-17)

### 🚀 Features

- **ci:** add useful exports ([844d529c](https://github.com/code-pushup/cli/commit/844d529c))
- **utils:** support GitLab report links ([27d8a657](https://github.com/code-pushup/cli/commit/27d8a657))

### 🩹 Fixes

- **core:** avoid portal-client import for enum conversions ([1a68636f](https://github.com/code-pushup/cli/commit/1a68636f))

### ❤️ Thank You

- hanna-skryl
- Matěj Chalk

## 0.52.0 (2024-10-16)

### 🚀 Features

- skip perfect scores in stdout summary ([f423c6c4](https://github.com/code-pushup/cli/commit/f423c6c4))
- make portal-client dependency optional ([18822a85](https://github.com/code-pushup/cli/commit/18822a85))
- **ci:** move in monorepo code from github-action ([a9c51d98](https://github.com/code-pushup/cli/commit/a9c51d98))
- **ci:** move in code from github-action for issues, git diff and commands ([bad87239](https://github.com/code-pushup/cli/commit/bad87239))
- **ci:** move in code for posting comment, generalized to any provider ([b61d6747](https://github.com/code-pushup/cli/commit/b61d6747))
- **ci:** move in main run functions from github-action and adapt ([697948eb](https://github.com/code-pushup/cli/commit/697948eb))
- **cli:** handle invalid plugin filter options ([9d756826](https://github.com/code-pushup/cli/commit/9d756826))
- **cli:** add skip and only category filters ([149f54b2](https://github.com/code-pushup/cli/commit/149f54b2))
- **plugin-lighthouse:** export default Chrome flags ([2518b6ca](https://github.com/code-pushup/cli/commit/2518b6ca))

### ❤️ Thank You

- Hanna Skryl @hanna-skryl
- hanna-skryl
- Matěj Chalk

## 0.51.0 (2024-10-02)

### 🚀 Features

- **cli:** add command option aliases ([3ae16263](https://github.com/code-pushup/cli/commit/3ae16263))
- **nx-plugin:** update unicode logo in stdout ([1d5e3ad1](https://github.com/code-pushup/cli/commit/1d5e3ad1))
- **utils:** support local report links ([f98b10a0](https://github.com/code-pushup/cli/commit/f98b10a0))

### 🩹 Fixes

- **plugin-js-packages:** filter out warnings ([61ab0f75](https://github.com/code-pushup/cli/commit/61ab0f75))
- **utils:** handle rounding of small trend values ([c23e38e6](https://github.com/code-pushup/cli/commit/c23e38e6))
- **utils:** format reports with unchanged score ([cddbdd35](https://github.com/code-pushup/cli/commit/cddbdd35))

### ❤️ Thank You

- Hanna Skryl @hanna-skryl
- hanna-skryl
- Matěj Chalk

## 0.50.0 (2024-09-10)

### 🚀 Features

- add defaults to js-packages plugin options ([#762](https://github.com/code-pushup/cli/pull/762))
- **cli:** add optional label option to compare command ([b3494d63](https://github.com/code-pushup/cli/commit/b3494d63))
- **cli:** scaffold merge-diffs command and test argument parsing ([074c50fb](https://github.com/code-pushup/cli/commit/074c50fb))
- **cli:** do not show help on error ([7cefdaad](https://github.com/code-pushup/cli/commit/7cefdaad))
- **core:** include portal link and label in report-diff.json ([e5036f1d](https://github.com/code-pushup/cli/commit/e5036f1d))
- **core:** implement mergeDiffs logic ([0a3594d5](https://github.com/code-pushup/cli/commit/0a3594d5))
- **core:** improve error messages for report-diff.json parsing ([85b3cdb1](https://github.com/code-pushup/cli/commit/85b3cdb1))
- **create-cli:** package to align with package managers init command ([#779](https://github.com/code-pushup/cli/pull/779))
- **models:** add optional portalUrl and label to reports diff schema ([8a1dacb1](https://github.com/code-pushup/cli/commit/8a1dacb1))
- **nx-plugin:** extend config generator ([#778](https://github.com/code-pushup/cli/pull/778))
- **nx-plugin:** implement `bin` property in options ([#773](https://github.com/code-pushup/cli/pull/773))
- **nx-plugin:** add project prefix to plugin ([#792](https://github.com/code-pushup/cli/pull/792))
- **plugin-lighthouse:** omit audit details table title ([eb7d6295](https://github.com/code-pushup/cli/commit/eb7d6295))
- **test-nx-utils:** add testing lib for nx specific logic ([#777](https://github.com/code-pushup/cli/pull/777))
- **utils:** increase audit value column width ([2d125074](https://github.com/code-pushup/cli/commit/2d125074))
- **utils:** move groups and audits under details to make diff comment more compact ([7d77b51a](https://github.com/code-pushup/cli/commit/7d77b51a))
- **utils:** implement diff markdown comment for monorepos ([3cf7b114](https://github.com/code-pushup/cli/commit/3cf7b114))
- **utils:** skip unchanged categories and projects in report-diff.md ([c834cfa1](https://github.com/code-pushup/cli/commit/c834cfa1))
- **utils:** sort projects in report-diff.md by most changed ([40d24768](https://github.com/code-pushup/cli/commit/40d24768))
- **utils:** move project status from heading to paragraph in report-diff.md ([260692e1](https://github.com/code-pushup/cli/commit/260692e1))
- **utils:** helper function to convert unknown errors to string ([1ac3c231](https://github.com/code-pushup/cli/commit/1ac3c231))

### 🩹 Fixes

- **plugin-lighthouse:** process empty array flags ([2101cf14](https://github.com/code-pushup/cli/commit/2101cf14))
- **plugin-lighthouse:** process empty array flags ([304b2298](https://github.com/code-pushup/cli/commit/304b2298))

### ❤️ Thank You

- Hanna Skryl @hanna-skryl
- hanna-skryl
- Matěj Chalk
- Michael Hladky @BioPhoton
- Vojtech Masek @vmasek

## 0.49.0 (2024-07-31)

### 🚀 Features

- replace chalk with ansis ([#750](https://github.com/code-pushup/cli/pull/750))
- **core:** fetch portal comparison link if available when comparing reports ([a08978e8](https://github.com/code-pushup/cli/commit/a08978e8))
- **nx-plugin:** add executor to nx-plugin ([#737](https://github.com/code-pushup/cli/pull/737))
- **nx-plugin:** add crystal utils ([#754](https://github.com/code-pushup/cli/pull/754))
- **utils:** add nested objects to cli args parsing ([#758](https://github.com/code-pushup/cli/pull/758))
- **utils:** include optional link to portal in markdown comment ([04455aeb](https://github.com/code-pushup/cli/commit/04455aeb))

### 🩹 Fixes

- **utils:** add is binary icon ([#749](https://github.com/code-pushup/cli/pull/749))

### ❤️ Thank You

- Elderov Ali
- Matěj Chalk
- Michael Hladky @BioPhoton

## 0.48.0 (2024-07-15)

### 🚀 Features

- implement skip-plugins option ([73695855](https://github.com/code-pushup/cli/commit/73695855))
- add skipPlugin options to global configs ([64f45dab](https://github.com/code-pushup/cli/commit/64f45dab))
- **nx-plugin:** add general executor logic ([3b5b9770](https://github.com/code-pushup/cli/commit/3b5b9770))
- **plugin-lighthouse:** parse opportunity details from lighthouse report ([2e76d08c](https://github.com/code-pushup/cli/commit/2e76d08c))
- **testing-utils:** add test helper for paths ([ccef3a1c](https://github.com/code-pushup/cli/commit/ccef3a1c))
- **utils:** merge configs function ([ac67ea5c](https://github.com/code-pushup/cli/commit/ac67ea5c))
- **utils:** add explicit types to merge config function and helpers ([e16c1c43](https://github.com/code-pushup/cli/commit/e16c1c43))
- **utils:** export merge configs helper as public API ([2f8d78e4](https://github.com/code-pushup/cli/commit/2f8d78e4))

### 🩹 Fixes

- restore e2e tests ([9a2e45b9](https://github.com/code-pushup/cli/commit/9a2e45b9))
- **nx-plugin:** fix lint ([d6161599](https://github.com/code-pushup/cli/commit/d6161599))
- **nx-plugin:** fix test for windows ([4fed38cf](https://github.com/code-pushup/cli/commit/4fed38cf))
- **utils:** unchanged categories table markdown content ([1df3ccb6](https://github.com/code-pushup/cli/commit/1df3ccb6))

### ❤️ Thank You

- Matěj Chalk
- Michael @rx-angular
- Nacho Vazquez @NachoVazquez
- Vojtech Masek @vmasek

## 0.47.0 (2024-07-01)

### 🚀 Features

- **plugin-coverage:** include decimals in coverage percentage used as audit value ([afeeb8e7](https://github.com/code-pushup/cli/commit/afeeb8e7))
- **plugin-lighthouse:** add audit details to lighthouse plugin ([#684](https://github.com/code-pushup/cli/pull/684))
- **plugin-lighthouse:** keep audit values as floats ([2627a879](https://github.com/code-pushup/cli/commit/2627a879))
- **utils:** add options to truncateTest ([f3444d70](https://github.com/code-pushup/cli/commit/f3444d70))

### 🩹 Fixes

- **plugin-coverage:** correct jest/vitest config lookup + respect project.json overrides ([561ed3e3](https://github.com/code-pushup/cli/commit/561ed3e3))
- **plugin-coverage:** handle absolute paths in jest/vitest coverage directories ([f997f860](https://github.com/code-pushup/cli/commit/f997f860))
- **plugin-coverage:** skip lcov reporter validation if jest config uses preset ([f9718bdb](https://github.com/code-pushup/cli/commit/f9718bdb))
- **plugin-coverage:** support non-cjs jest configs ([3fc351c2](https://github.com/code-pushup/cli/commit/3fc351c2))

### ❤️ Thank You

- Matěj Chalk
- Michael @rx-angular
- Michael Hladky @BioPhoton

## 0.46.0 (2024-06-19)

### 🚀 Features

- **cli:** forward plugins and categories if onlyPlugins is invalid ([1a6c6fa8](https://github.com/code-pushup/cli/commit/1a6c6fa8))
- **plugin-lighthouse:** add logLevel to lighthouse runner flags ([120b3160](https://github.com/code-pushup/cli/commit/120b3160))

### 🩹 Fixes

- **plugin-coverage:** support newer nx versions ([9e416852](https://github.com/code-pushup/cli/commit/9e416852))

### ❤️ Thank You

- Matěj Chalk
- Michael @rx-angular

## 0.45.1 (2024-06-17)

### 🚀 Features

- **models:** allow non-integer weights in refs ([016e011f](https://github.com/code-pushup/cli/commit/016e011f))
- **models:** allow non-integer audit values ([1db88e39](https://github.com/code-pushup/cli/commit/1db88e39))
- **plugin-js-packages:** support multiple package.json and auto search ([df87ff9b](https://github.com/code-pushup/cli/commit/df87ff9b))

### 🩹 Fixes

- round down report scores to avoid misleading perfect results ([#700](https://github.com/code-pushup/cli/pull/700))
- wrap paths in quotes in case of spaces ([a3c0314d](https://github.com/code-pushup/cli/commit/a3c0314d))

### ❤️ Thank You

- Hanna Skryl @hanna-skryl
- Katerina Pilatova
- Matěj Chalk

## 0.45.0 (2024-06-03)

This was a version bump only, there were no code changes.

## 0.44.5 (2024-05-30)

### 🩹 Fixes

- **plugin-coverage:** merge multiple results for a file ([#688](https://github.com/code-pushup/cli/pull/688))

### ❤️ Thank You

- Katka Pilátová

## 0.44.3 (2024-05-29)

### 🩹 Fixes

- **plugin-eslint:** revert to explicit config file in nx helper ([ecd82642](https://github.com/code-pushup/cli/commit/ecd82642))

### ❤️ Thank You

- Matěj Chalk

## 0.44.2 (2024-05-28)

### 🚀 Features

- **plugin-eslint:** support implicit configs ([f89037ad](https://github.com/code-pushup/cli/commit/f89037ad))

### ❤️ Thank You

- Matěj Chalk

## 0.44.1 (2024-05-23)

This was a version bump only, there were no code changes.

## 0.44.0 (2024-05-23)

### 🚀 Features

- **core:** include audit table in portal upload ([2b4f3e15](https://github.com/code-pushup/cli/commit/2b4f3e15))

### ❤️ Thank You

- Matěj Chalk

## 0.43.1 (2024-05-23)

### 🩹 Fixes

- **plugin-coverage:** always include issues array, even if empty ([bd7c5631](https://github.com/code-pushup/cli/commit/bd7c5631))
- **plugin-js-packages:** always include issues array, even if empty ([748eb64a](https://github.com/code-pushup/cli/commit/748eb64a))

### ❤️ Thank You

- Matěj Chalk

## 0.43.0 (2024-05-22)

### 🚀 Features

- **plugin-eslint:** rename eslintConfigFromNxProjects to eslintConfigFromAllNxProjects ([068b3359](https://github.com/code-pushup/cli/commit/068b3359))
- **plugin-eslint:** rename eslintConfigFromNxProject to eslintConfigFromNxProjectAndDeps ([efbb72ae](https://github.com/code-pushup/cli/commit/efbb72ae))
- **plugin-eslint:** add eslintConfigFromNxProject helper that doesn't include nx project deps ([0706bdaf](https://github.com/code-pushup/cli/commit/0706bdaf))

### ❤️ Thank You

- Vojtech Masek @vmasek

## 0.42.1 (2024-05-22)

This was a version bump only, there were no code changes.

## 0.42.0 (2024-05-21)

This was a version bump only, there were no code changes.

## 0.39.0 (2024-04-29)

### 🚀 Features

- **plugin-eslint:** support array of config and patterns to lint separately ([7b1e4585](https://github.com/code-pushup/cli/commit/7b1e4585))
- **plugin-eslint:** nx helpers generate array of lint targets ([10dd3c6a](https://github.com/code-pushup/cli/commit/10dd3c6a))

### 🩹 Fixes

- **ci:** temporarily adjust e2e job ([1e494c76](https://github.com/code-pushup/cli/commit/1e494c76))

### 🔥 Performance

- **plugin-eslint:** run eslint as separate process to prevent exceeding memory ([c25b3671](https://github.com/code-pushup/cli/commit/c25b3671))

### ❤️ Thank You

- Matěj Chalk
- Michael @rx-angular

## 0.35.0 (2024-04-09)

This was a version bump only, there were no code changes.

# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# [0.29.0](https://github.com/code-pushup/cli/compare/v0.28.0...v0.29.0) (2024-03-25)

### Bug Fixes

- **cli:** fix missing executable permissions for index.js ([0fd2eb4](https://github.com/code-pushup/cli/commit/0fd2eb41219114852577bdaafdc0cd705d1951b3))
- **plugin-eslint:** allow minor updates to eslint dependency ([efbe028](https://github.com/code-pushup/cli/commit/efbe0289e87ecda8c87a4353d7ff6466874afd9c))

### Features

- **utils:** use auto-link commit format (GitHub/GitLab) in markdown ([2f26c6c](https://github.com/code-pushup/cli/commit/2f26c6c241dc1900fbf131cc9ae83618e7f4ffb3))

# [0.28.0](https://github.com/code-pushup/cli/compare/v0.27.1...v0.28.0) (2024-03-22)

### Bug Fixes

- **core:** ensure output directory exists in compareReportFiles ([cf309bc](https://github.com/code-pushup/cli/commit/cf309bc80e7a1a9a0ef0320948a155104b538719))
- **utils:** prevent mixed summary when some audit changed only value ([20673fd](https://github.com/code-pushup/cli/commit/20673fdc29d77011c7793b3ae9ed8a95cc014db2))
- **utils:** use unicode arrows with wider OS support ([271155e](https://github.com/code-pushup/cli/commit/271155eb84e2b0c76f1018f3774171dd79d17e26))

### Features

- **cli:** include md format by default ([65a08ea](https://github.com/code-pushup/cli/commit/65a08ea88f3605f3e4955d9f704312e5499e381c))
- **core:** create report-diff.md file if specified by persist.format ([8c4e1e4](https://github.com/code-pushup/cli/commit/8c4e1e4958b88e67be60ffba5033b542961803e9))

## [0.27.1](https://github.com/code-pushup/cli/compare/v0.27.0...v0.27.1) (2024-03-19)

# [0.27.0](https://github.com/code-pushup/cli/compare/v0.26.1...v0.27.0) (2024-03-19)

### Bug Fixes

- package json lock ([#562](https://github.com/code-pushup/cli/issues/562)) ([c73f3ac](https://github.com/code-pushup/cli/commit/c73f3ace524a5a331b5efbbcb7e1be2a8e74d4d0))
- **plugin-eslint:** eslint startline can be zero ([#563](https://github.com/code-pushup/cli/issues/563)) ([4eefb35](https://github.com/code-pushup/cli/commit/4eefb35eae6a90064caae498bbfe0eb2f3656fd3))
- **utils:** literal asterisk in Markdown doc should be escaped ([6348ba3](https://github.com/code-pushup/cli/commit/6348ba314cfed4f3e789556f8295019a1ccfdfa1))
- **utils:** use shields.io for colorizing changed values ([d0eb475](https://github.com/code-pushup/cli/commit/d0eb475db520c8dcad9d023c09cbe2e5bb583782))

### Features

- **cli:** implement compare command ([314e7ba](https://github.com/code-pushup/cli/commit/314e7ba5a496005fe10407dbe2780f81f3f1b869))
- **core:** add history logic ([#541](https://github.com/code-pushup/cli/issues/541)) ([10df94c](https://github.com/code-pushup/cli/commit/10df94ccb54f6479367213a42f7e3578c6815c7b))
- **core:** implement categories, groups and audits comparisons ([72d6c14](https://github.com/code-pushup/cli/commit/72d6c14386eee5d63ed3c59dd4eb8d5be1a1ded0))
- **core:** implement compare reports functions ([5493cc4](https://github.com/code-pushup/cli/commit/5493cc4bccb36969b6d3e70ea323b3bee7510ca8))
- **models:** create reportsDiff schema ([75dc8aa](https://github.com/code-pushup/cli/commit/75dc8aa63df9db476c8ea6dfcb8e3ac3783f2b7e))
- **plugin-js-packages:** add runner config integration test, restructure runner ([cae4ca8](https://github.com/code-pushup/cli/commit/cae4ca892a95716a3025efd072db0692b346611c))
- **plugin-js-packages:** implement plugin schema and configuration flow ([e2ce3f6](https://github.com/code-pushup/cli/commit/e2ce3f67f0ccd9628e6f2039988d0cde46e29265))
- **plugin-js-packages:** implement runner for npm audit ([6aa55a2](https://github.com/code-pushup/cli/commit/6aa55a2d912773243b6955517b4096d70c2da289))
- **plugin-js-packages:** implement runner for npm outdated ([7cb623b](https://github.com/code-pushup/cli/commit/7cb623b88ea6c0a2dfe202b2354c7111dbc8cb37))
- **plugin-js-packages:** improve output, scoring, error handling ([b9f1432](https://github.com/code-pushup/cli/commit/b9f14326827f07eaa3a7489d3c6f2cf2ef1ba485))
- **plugin-js-packages:** use group per check, audit per dependency group ([1405e7d](https://github.com/code-pushup/cli/commit/1405e7d7bbb734e0b80ddd4bb9538cf49c9400ed))
- **utils:** add helper functions for diffing ([4e87cd5](https://github.com/code-pushup/cli/commit/4e87cd551918257f6155dbdfdd11ca0e2d5b62ec))
- **utils:** handle unchanged reports diff ([0cdcb9e](https://github.com/code-pushup/cli/commit/0cdcb9e81a038e9f36a56859b908a6de565faa9d))
- **utils:** implement markdown diff formatting ([5f453ef](https://github.com/code-pushup/cli/commit/5f453ef7adfd9973ec6b6ca2716c8e026a58c610))
- **utils:** improve diff md formatting - change icon, n/a cells, percentage space ([27290f2](https://github.com/code-pushup/cli/commit/27290f2110062404b51c069745a8533dc53947db))
- **utils:** improve reports diff formatting ([2bee85e](https://github.com/code-pushup/cli/commit/2bee85e47b523a878c2ac042dee8b8b76465b89f))
- **utils:** include unchanged and added categories in markdown table ([4e53077](https://github.com/code-pushup/cli/commit/4e530777cbd0fe78e0b6b65ed9cb385241fe14ce))
- **utils:** sort changed categories/groups/audits by most affected ([74cb57e](https://github.com/code-pushup/cli/commit/74cb57e0ea4a8f4a50eda0b8ef7563f1a8c9cd82))

# [0.27.0](https://github.com/code-pushup/cli/compare/v0.26.1...v0.27.0) (2024-03-19)

### Bug Fixes

- package json lock ([#562](https://github.com/code-pushup/cli/issues/562)) ([c73f3ac](https://github.com/code-pushup/cli/commit/c73f3ace524a5a331b5efbbcb7e1be2a8e74d4d0))
- **plugin-eslint:** eslint startline can be zero ([#563](https://github.com/code-pushup/cli/issues/563)) ([4eefb35](https://github.com/code-pushup/cli/commit/4eefb35eae6a90064caae498bbfe0eb2f3656fd3))
- **utils:** literal asterisk in Markdown doc should be escaped ([6348ba3](https://github.com/code-pushup/cli/commit/6348ba314cfed4f3e789556f8295019a1ccfdfa1))
- **utils:** use shields.io for colorizing changed values ([d0eb475](https://github.com/code-pushup/cli/commit/d0eb475db520c8dcad9d023c09cbe2e5bb583782))

### Features

- **cli:** implement compare command ([314e7ba](https://github.com/code-pushup/cli/commit/314e7ba5a496005fe10407dbe2780f81f3f1b869))
- **core:** add history logic ([#541](https://github.com/code-pushup/cli/issues/541)) ([10df94c](https://github.com/code-pushup/cli/commit/10df94ccb54f6479367213a42f7e3578c6815c7b))
- **core:** implement categories, groups and audits comparisons ([72d6c14](https://github.com/code-pushup/cli/commit/72d6c14386eee5d63ed3c59dd4eb8d5be1a1ded0))
- **core:** implement compare reports functions ([5493cc4](https://github.com/code-pushup/cli/commit/5493cc4bccb36969b6d3e70ea323b3bee7510ca8))
- **models:** create reportsDiff schema ([75dc8aa](https://github.com/code-pushup/cli/commit/75dc8aa63df9db476c8ea6dfcb8e3ac3783f2b7e))
- **plugin-js-packages:** add runner config integration test, restructure runner ([cae4ca8](https://github.com/code-pushup/cli/commit/cae4ca892a95716a3025efd072db0692b346611c))
- **plugin-js-packages:** implement plugin schema and configuration flow ([e2ce3f6](https://github.com/code-pushup/cli/commit/e2ce3f67f0ccd9628e6f2039988d0cde46e29265))
- **plugin-js-packages:** implement runner for npm audit ([6aa55a2](https://github.com/code-pushup/cli/commit/6aa55a2d912773243b6955517b4096d70c2da289))
- **plugin-js-packages:** implement runner for npm outdated ([7cb623b](https://github.com/code-pushup/cli/commit/7cb623b88ea6c0a2dfe202b2354c7111dbc8cb37))
- **plugin-js-packages:** improve output, scoring, error handling ([b9f1432](https://github.com/code-pushup/cli/commit/b9f14326827f07eaa3a7489d3c6f2cf2ef1ba485))
- **plugin-js-packages:** use group per check, audit per dependency group ([1405e7d](https://github.com/code-pushup/cli/commit/1405e7d7bbb734e0b80ddd4bb9538cf49c9400ed))
- **utils:** add helper functions for diffing ([4e87cd5](https://github.com/code-pushup/cli/commit/4e87cd551918257f6155dbdfdd11ca0e2d5b62ec))
- **utils:** handle unchanged reports diff ([0cdcb9e](https://github.com/code-pushup/cli/commit/0cdcb9e81a038e9f36a56859b908a6de565faa9d))
- **utils:** implement markdown diff formatting ([5f453ef](https://github.com/code-pushup/cli/commit/5f453ef7adfd9973ec6b6ca2716c8e026a58c610))
- **utils:** improve diff md formatting - change icon, n/a cells, percentage space ([27290f2](https://github.com/code-pushup/cli/commit/27290f2110062404b51c069745a8533dc53947db))
- **utils:** improve reports diff formatting ([2bee85e](https://github.com/code-pushup/cli/commit/2bee85e47b523a878c2ac042dee8b8b76465b89f))
- **utils:** include unchanged and added categories in markdown table ([4e53077](https://github.com/code-pushup/cli/commit/4e530777cbd0fe78e0b6b65ed9cb385241fe14ce))
- **utils:** sort changed categories/groups/audits by most affected ([74cb57e](https://github.com/code-pushup/cli/commit/74cb57e0ea4a8f4a50eda0b8ef7563f1a8c9cd82))

## [0.26.1](https://github.com/code-pushup/cli/compare/v0.26.0...v0.26.1) (2024-03-07)

# [0.26.0](https://github.com/code-pushup/cli/compare/v0.25.7...v0.26.0) (2024-03-06)

### Features

- **cli:** include commit info in report.json ([5965900](https://github.com/code-pushup/cli/commit/596590082c76b0b7915b2b339fa27baee9eaa678))

## [0.25.7](https://github.com/code-pushup/cli/compare/v0.25.6...v0.25.7) (2024-03-06)

## [0.25.6](https://github.com/code-pushup/cli/compare/v0.25.5...v0.25.6) (2024-03-05)

### Bug Fixes

- **plugin-eslint:** pass arguments via config file instead of argv ([dca0266](https://github.com/code-pushup/cli/commit/dca026617c6f7e33e25bab06922dec417dfbc63e))

## [0.25.5](https://github.com/code-pushup/cli/compare/v0.25.4...v0.25.5) (2024-03-05)

## [0.25.4](https://github.com/code-pushup/cli/compare/v0.25.3...v0.25.4) (2024-03-05)

## [0.25.3](https://github.com/code-pushup/cli/compare/v0.25.2...v0.25.3) (2024-03-05)

## [0.25.2](https://github.com/code-pushup/cli/compare/v0.25.1...v0.25.2) (2024-03-05)

## [0.25.1](https://github.com/code-pushup/cli/compare/v0.25.0...v0.25.1) (2024-02-29)

# [0.25.0](https://github.com/code-pushup/cli/compare/v0.24.0...v0.25.0) (2024-02-29)

### Features

- **plugin-lighthouse:** implement basic audit parsing ([#523](https://github.com/code-pushup/cli/issues/523)) ([cbd044e](https://github.com/code-pushup/cli/commit/cbd044e0267304d48066cca27bfae12ee7d708d7))

# [0.24.0](https://github.com/code-pushup/cli/compare/v0.23.4...v0.24.0) (2024-02-29)

### Features

- **plugin-lighthouse:** add only filters logic for categories ([#515](https://github.com/code-pushup/cli/issues/515)) ([3cb8fa4](https://github.com/code-pushup/cli/commit/3cb8fa47ac57ac9ae8c74e9c166e638f8180a1cd))

## [0.23.4](https://github.com/code-pushup/cli/compare/v0.23.3...v0.23.4) (2024-02-29)

### Bug Fixes

- **utils:** sort groups and category refs correctly in report ([76a7636](https://github.com/code-pushup/cli/commit/76a7636dae231520b386c634e4ed945c267e89c5))

## [0.23.3](https://github.com/code-pushup/cli/compare/v0.23.2...v0.23.3) (2024-02-29)

### Bug Fixes

- stop CLI when a plugin fails ([263537c](https://github.com/code-pushup/cli/commit/263537c0a85ba290287cc5a29af1ac125c4191b3))

## [0.23.2](https://github.com/code-pushup/cli/compare/v0.23.1...v0.23.2) (2024-02-28)

## [0.23.1](https://github.com/code-pushup/cli/compare/v0.23.0...v0.23.1) (2024-02-27)

# [0.23.0](https://github.com/code-pushup/cli/compare/v0.22.8...v0.23.0) (2024-02-26)

### Features

- **utils:** add git helper ([#469](https://github.com/code-pushup/cli/issues/469)) ([d927a61](https://github.com/code-pushup/cli/commit/d927a6153554a4bc7eecabde7386bbbd3c9b2de1))

## [0.22.8](https://github.com/code-pushup/cli/compare/v0.22.7...v0.22.8) (2024-02-23)

### Bug Fixes

- **plugin-eslint:** handle rules which emit column 0 ([de791e1](https://github.com/code-pushup/cli/commit/de791e12de1f8856f12b0d574f15232df5138cb2))

## [0.22.7](https://github.com/code-pushup/cli/compare/v0.22.6...v0.22.7) (2024-02-21)

## [0.22.6](https://github.com/code-pushup/cli/compare/v0.22.5...v0.22.6) (2024-02-21)

## [0.22.5](https://github.com/code-pushup/cli/compare/v0.22.4...v0.22.5) (2024-02-21)

## [0.22.4](https://github.com/code-pushup/cli/compare/v0.22.3...v0.22.4) (2024-02-20)

## [0.22.3](https://github.com/code-pushup/cli/compare/v0.22.2...v0.22.3) (2024-02-19)

### Performance Improvements

- **utils:** add benchmarks for file system walk and glob libs ([#514](https://github.com/code-pushup/cli/issues/514)) ([50e5f96](https://github.com/code-pushup/cli/commit/50e5f962e400d2721c583c17c216bb770b2f26eb))

## [0.22.2](https://github.com/code-pushup/cli/compare/v0.22.1...v0.22.2) (2024-02-19)

## [0.22.1](https://github.com/code-pushup/cli/compare/v0.22.0...v0.22.1) (2024-02-19)

# [0.22.0](https://github.com/code-pushup/cli/compare/v0.21.1...v0.22.0) (2024-02-19)

### Features

- **cli:** add --tsconfig option ([67abfb7](https://github.com/code-pushup/cli/commit/67abfb728548344c7e25310fc21eb0446ceecb7f))

# [0.22.0](https://github.com/code-pushup/cli/compare/v0.21.1...v0.22.0) (2024-02-19)

### Features

- **cli:** add --tsconfig option ([67abfb7](https://github.com/code-pushup/cli/commit/67abfb728548344c7e25310fc21eb0446ceecb7f))

## [0.21.1](https://github.com/code-pushup/cli/compare/v0.21.0...v0.21.1) (2024-02-16)

# [0.21.0](https://github.com/code-pushup/cli/compare/v0.20.2...v0.21.0) (2024-02-16)

### Features

- **cli:** print full report url after upload ([0eb7771](https://github.com/code-pushup/cli/commit/0eb777107fc56317622fb7000306b33a8d085598))

## [0.20.2](https://github.com/code-pushup/cli/compare/v0.20.1...v0.20.2) (2024-02-16)

## [0.20.1](https://github.com/code-pushup/cli/compare/v0.20.0...v0.20.1) (2024-02-15)

### Bug Fixes

- **cli:** make onlyPlugins filter based on plugin not audit/group slug ([e963c36](https://github.com/code-pushup/cli/commit/e963c36219295d5b48f1e6c836ba321bcc01e90a))

# [0.20.0](https://github.com/code-pushup/cli/compare/v0.19.0...v0.20.0) (2024-02-15)

### Bug Fixes

- **models:** issue file positions must be positive integers ([727926e](https://github.com/code-pushup/cli/commit/727926e987b526703d7fd46994b442dce3ac4a25))

### Features

- **models:** add missing schema exports ([36d3eea](https://github.com/code-pushup/cli/commit/36d3eeafba94f41dfded28b97e8af5f9441b4062))

# [0.19.0](https://github.com/code-pushup/cli/compare/v0.18.1...v0.19.0) (2024-02-15)

### Features

- **core:** convert all issue file paths after executing plugin ([d82c68d](https://github.com/code-pushup/cli/commit/d82c68da9aaa4d3e4132ee5b8eb3766d60369440))
- **utils:** implement helpers for making paths relative to git root ([b12df6d](https://github.com/code-pushup/cli/commit/b12df6d05f81d7c26df40c5435ad0efad7fdb687))

## [0.18.1](https://github.com/code-pushup/cli/compare/v0.18.0...v0.18.1) (2024-02-14)

# [0.18.0](https://github.com/code-pushup/cli/compare/v0.17.0...v0.18.0) (2024-02-14)

### Features

- **plugin-coverage:** allow passing results as strings ([6813021](https://github.com/code-pushup/cli/commit/681302101889001774a6b5ddd375dc26a6ab3d53))

# [0.17.0](https://github.com/code-pushup/cli/compare/v0.16.8...v0.17.0) (2024-02-13)

### Features

- **plugin-coverage:** add coverage tool run option, convert to runnerConfig ([d259c14](https://github.com/code-pushup/cli/commit/d259c14814d256bb1ad3dfb749a7c8ac25640d2b))
- **plugin-coverage:** get coverage paths using nx ([cd499ea](https://github.com/code-pushup/cli/commit/cd499ea817b7c2fe67a8b04e4701b4f387783613))
- **plugin-coverage:** provide coverage group ([8cddfcd](https://github.com/code-pushup/cli/commit/8cddfcd0c5b54c042962ec596883b9a0d9775c6f))

## [0.16.8](https://github.com/code-pushup/cli/compare/v0.16.7...v0.16.8) (2024-02-12)

## [0.16.7](https://github.com/code-pushup/cli/compare/v0.16.6...v0.16.7) (2024-02-09)

### Bug Fixes

- **core:** upload issue without source if file not linked ([2923dbd](https://github.com/code-pushup/cli/commit/2923dbddc353b069e3c7f82caf1c52a5c63eeeb0))

## [0.16.6](https://github.com/code-pushup/cli/compare/v0.16.5...v0.16.6) (2024-02-09)

## [0.16.5](https://github.com/code-pushup/cli/compare/v0.16.4...v0.16.5) (2024-02-09)

## [0.16.4](https://github.com/code-pushup/cli/compare/v0.16.3...v0.16.4) (2024-02-09)

### Bug Fixes

- **workflows:** update and improve labeler options ([146434a](https://github.com/code-pushup/cli/commit/146434aacb3741e0e4973f91d8954be3cc69e82e))

## [0.16.3](https://github.com/code-pushup/cli/compare/v0.16.2...v0.16.3) (2024-02-08)

## [0.16.2](https://github.com/code-pushup/cli/compare/v0.16.1...v0.16.2) (2024-02-08)

## [0.16.1](https://github.com/code-pushup/cli/compare/v0.16.0...v0.16.1) (2024-02-07)

# [0.16.0](https://github.com/code-pushup/cli/compare/v0.15.0...v0.16.0) (2024-02-07)

### Features

- **plugin-lighthouse:** add onlyAudits logic ([#472](https://github.com/code-pushup/cli/issues/472)) ([d45eac4](https://github.com/code-pushup/cli/commit/d45eac4fe9fa509f6807825f881bf26b2acb4343))

# [0.15.0](https://github.com/code-pushup/cli/compare/v0.14.4...v0.15.0) (2024-02-06)

### Features

- **cli:** add logger ([#459](https://github.com/code-pushup/cli/issues/459)) ([f436299](https://github.com/code-pushup/cli/commit/f4362995108197211563b5cb77a4d37727d141af))

## [0.14.4](https://github.com/code-pushup/cli/compare/v0.14.3...v0.14.4) (2024-02-06)

## [0.14.3](https://github.com/code-pushup/cli/compare/v0.14.2...v0.14.3) (2024-02-06)

## [0.14.2](https://github.com/code-pushup/cli/compare/v0.14.1...v0.14.2) (2024-02-06)

## [0.14.1](https://github.com/code-pushup/cli/compare/v0.14.0...v0.14.1) (2024-02-05)

# [0.14.0](https://github.com/code-pushup/cli/compare/v0.13.2...v0.14.0) (2024-02-05)

### Features

- **examples-plugins:** add lighthouse to examples ([#417](https://github.com/code-pushup/cli/issues/417)) ([8fcc465](https://github.com/code-pushup/cli/commit/8fcc46551314358486969a2687373d6735274341))

## [0.13.2](https://github.com/code-pushup/cli/compare/v0.13.1...v0.13.2) (2024-02-05)

## [0.13.1](https://github.com/code-pushup/cli/compare/v0.13.0...v0.13.1) (2024-02-05)

# [0.13.0](https://github.com/code-pushup/cli/compare/v0.12.10...v0.13.0) (2024-02-05)

### Bug Fixes

- **plugin-coverage:** calculate coverage for no found entities as full coverage ([349c772](https://github.com/code-pushup/cli/commit/349c7724060231863236e16f7a69a54bbdcaf95e))
- **plugin-coverage:** convert new lines on Windows for parse-lcov, update docs ([3195da2](https://github.com/code-pushup/cli/commit/3195da2c92c10148cd2d43b1a6fc6eef62d52348))

### Features

- **plugin-coverage:** implement lcov parsing ([800e2d0](https://github.com/code-pushup/cli/commit/800e2d07542ab6398386ee278193c1ee49560b29))
- **plugin-coverage:** implement plugin configuration ([513c518](https://github.com/code-pushup/cli/commit/513c51809e412d14d48a859e75ee5cdc855dff3d))
- **plugin-coverage:** set up plugin-coverage package ([8b18a0f](https://github.com/code-pushup/cli/commit/8b18a0ff05982f350240d33114f3738bac2be4ed))

## [0.12.10](https://github.com/code-pushup/cli/compare/v0.12.9...v0.12.10) (2024-02-03)

## [0.12.9](https://github.com/code-pushup/cli/compare/v0.12.8...v0.12.9) (2024-02-03)

## [0.12.8](https://github.com/code-pushup/cli/compare/v0.12.7...v0.12.8) (2024-02-02)

## [0.12.7](https://github.com/code-pushup/cli/compare/v0.12.6...v0.12.7) (2024-02-01)

## [0.12.6](https://github.com/code-pushup/cli/compare/v0.12.5...v0.12.6) (2024-02-01)

## [0.12.5](https://github.com/code-pushup/cli/compare/v0.12.4...v0.12.5) (2024-02-01)

## [0.12.4](https://github.com/code-pushup/cli/compare/v0.12.3...v0.12.4) (2024-02-01)

## [0.12.3](https://github.com/code-pushup/cli/compare/v0.12.2...v0.12.3) (2024-02-01)

## [0.12.2](https://github.com/code-pushup/cli/compare/v0.12.1...v0.12.2) (2024-01-31)

## [0.12.1](https://github.com/code-pushup/cli/compare/v0.12.0...v0.12.1) (2024-01-31)

# [0.12.0](https://github.com/code-pushup/cli/compare/v0.11.2...v0.12.0) (2024-01-30)

### Features

- **cli:** add hints to commands ([#443](https://github.com/code-pushup/cli/issues/443)) ([854cf4b](https://github.com/code-pushup/cli/commit/854cf4b1f947b5574a4493b6c5f5e2f2a81b2ad8))

## [0.11.2](https://github.com/code-pushup/cli/compare/v0.11.1...v0.11.2) (2024-01-29)

### Bug Fixes

- **core:** update portal-client, fixed missing graphql dependency ([c16c0c8](https://github.com/code-pushup/cli/commit/c16c0c8154097d33ce18259ff17b93f039fb1481))

## [0.11.1](https://github.com/code-pushup/cli/compare/v0.11.0...v0.11.1) (2024-01-27)

# [0.11.0](https://github.com/code-pushup/cli/compare/v0.10.7...v0.11.0) (2024-01-26)

### Features

- **cli:** add autoloading of the config file ([#361](https://github.com/code-pushup/cli/issues/361)) ([aef86c9](https://github.com/code-pushup/cli/commit/aef86c9d472e7dc77e6e85dcf7fa11319b5ad662))

## [0.10.7](https://github.com/code-pushup/cli/compare/v0.10.6...v0.10.7) (2024-01-26)

## [0.10.6](https://github.com/code-pushup/cli/compare/v0.10.5...v0.10.6) (2024-01-26)

## [0.10.5](https://github.com/code-pushup/cli/compare/v0.10.4...v0.10.5) (2024-01-26)

### Bug Fixes

- **cli:** set terminal output to full width ([#362](https://github.com/code-pushup/cli/issues/362)) ([d6270a5](https://github.com/code-pushup/cli/commit/d6270a5cc7766e9c3d4090ad5935e65c9d36c427))

## [0.10.4](https://github.com/code-pushup/cli/compare/v0.10.3...v0.10.4) (2024-01-25)

## [0.10.3](https://github.com/code-pushup/cli/compare/v0.10.2...v0.10.3) (2024-01-25)

## [0.10.2](https://github.com/code-pushup/cli/compare/v0.10.1...v0.10.2) (2024-01-25)

## [0.10.1](https://github.com/code-pushup/cli/compare/v0.10.0...v0.10.1) (2024-01-24)

# [0.10.0](https://github.com/code-pushup/cli/compare/v0.9.0...v0.10.0) (2024-01-24)

### Bug Fixes

- **utils:** set fixed locale for date in report.md ([aa4694b](https://github.com/code-pushup/cli/commit/aa4694b33da34f3a6c4aff8ff92b1c4f8717c520))

### Features

- **utils:** include timezone in report.md ([27d267a](https://github.com/code-pushup/cli/commit/27d267ab481f90187b0717ca72053689aab3b4f3))

# [0.9.0](https://github.com/code-pushup/cli/compare/v0.8.25...v0.9.0) (2024-01-24)

### Features

- **core:** add optional upload.timeout to config ([fdc3f58](https://github.com/code-pushup/cli/commit/fdc3f58cb0617d5240dcb7a80ec9f640d0b5df7c))
- **core:** update portal-client to version with request timeouts ([173bd2f](https://github.com/code-pushup/cli/commit/173bd2f9a1e5b66f52d98c9fa36a2db4cf1403d1))

## [0.8.25](https://github.com/code-pushup/cli/compare/v0.8.24...v0.8.25) (2024-01-19)

## [0.8.24](https://github.com/code-pushup/cli/compare/v0.8.23...v0.8.24) (2024-01-19)

## [0.8.23](https://github.com/code-pushup/cli/compare/v0.8.22...v0.8.23) (2024-01-18)

## [0.8.22](https://github.com/code-pushup/cli/compare/v0.8.21...v0.8.22) (2024-01-16)

## [0.8.21](https://github.com/code-pushup/cli/compare/v0.8.20...v0.8.21) (2024-01-16)

## [0.8.20](https://github.com/code-pushup/cli/compare/v0.8.19...v0.8.20) (2024-01-16)

## [0.8.19](https://github.com/code-pushup/cli/compare/v0.8.18...v0.8.19) (2024-01-16)

## [0.8.18](https://github.com/code-pushup/cli/compare/v0.8.17...v0.8.18) (2024-01-15)

## [0.8.17](https://github.com/code-pushup/cli/compare/v0.8.16...v0.8.17) (2024-01-15)

## [0.8.16](https://github.com/code-pushup/cli/compare/v0.8.15...v0.8.16) (2024-01-15)

## [0.8.15](https://github.com/code-pushup/cli/compare/v0.8.14...v0.8.15) (2024-01-15)

## [0.8.14](https://github.com/code-pushup/cli/compare/v0.8.13...v0.8.14) (2024-01-12)

## [0.8.13](https://github.com/code-pushup/cli/compare/v0.8.12...v0.8.13) (2024-01-12)

## [0.8.12](https://github.com/code-pushup/cli/compare/v0.8.11...v0.8.12) (2024-01-12)

## [0.8.11](https://github.com/code-pushup/cli/compare/v0.8.10...v0.8.11) (2024-01-12)

### Bug Fixes

- **models:** fix use case for a group reference but empty audits, clean up tests ([d311b95](https://github.com/code-pushup/cli/commit/d311b956cf6d6c9532de30bfd4080bfeb37ab1c3))

## [0.8.10](https://github.com/code-pushup/cli/compare/v0.8.9...v0.8.10) (2024-01-12)

## [0.8.9](https://github.com/code-pushup/cli/compare/v0.8.8...v0.8.9) (2024-01-11)

## [0.8.8](https://github.com/code-pushup/cli/compare/v0.8.7...v0.8.8) (2024-01-11)

### Bug Fixes

- **plugin-eslint:** truncate long issue messages ([c39d0cc](https://github.com/code-pushup/cli/commit/c39d0ccefbbc9f44a7ecb4d90346bca5b1553766))

## [0.8.7](https://github.com/code-pushup/cli/compare/v0.8.6...v0.8.7) (2024-01-10)

## [0.8.6](https://github.com/code-pushup/cli/compare/v0.8.5...v0.8.6) (2024-01-10)

## [0.8.5](https://github.com/code-pushup/cli/compare/v0.8.4...v0.8.5) (2024-01-10)

## [0.8.4](https://github.com/code-pushup/cli/compare/v0.8.3...v0.8.4) (2024-01-10)

## [0.8.3](https://github.com/code-pushup/cli/compare/v0.8.2...v0.8.3) (2024-01-10)

## [0.8.2](https://github.com/code-pushup/cli/compare/v0.8.1...v0.8.2) (2024-01-09)

## [0.8.1](https://github.com/code-pushup/cli/compare/v0.8.0...v0.8.1) (2024-01-08)

# [0.8.0](https://github.com/code-pushup/cli/compare/v0.7.0...v0.8.0) (2024-01-08)

### Features

- **core:** add grouping of promise results by status ([5f50e8e](https://github.com/code-pushup/cli/commit/5f50e8ecafa6742c597604bf3ffdcd0361f8c128)), closes [#287](https://github.com/code-pushup/cli/issues/287) [#287](https://github.com/code-pushup/cli/issues/287)

# [0.7.0](https://github.com/code-pushup/cli/compare/v0.6.6...v0.7.0) (2024-01-08)

### Features

- **core:** improve upload error messages, extend icon set ([2251ebd](https://github.com/code-pushup/cli/commit/2251ebd13763facb562a9011cf034ff2e9b7ef37))

## [0.6.6](https://github.com/code-pushup/cli/compare/v0.6.5...v0.6.6) (2024-01-05)

## [0.6.5](https://github.com/code-pushup/cli/compare/v0.6.4...v0.6.5) (2024-01-04)

## [0.6.4](https://github.com/code-pushup/cli/compare/v0.6.3...v0.6.4) (2024-01-04)

## [0.6.3](https://github.com/code-pushup/cli/compare/v0.6.2...v0.6.3) (2024-01-04)

## [0.6.2](https://github.com/code-pushup/cli/compare/v0.6.1...v0.6.2) (2024-01-04)

## [0.6.1](https://github.com/code-pushup/cli/compare/v0.6.0...v0.6.1) (2024-01-03)

### Bug Fixes

- **plugin-eslint:** fix default Nx lint patterns - directory not valid for "files" in eslintrc ([6865800](https://github.com/code-pushup/cli/commit/68658003f295989b0587986e87a0e17711e7430c))

# [0.6.0](https://github.com/code-pushup/cli/compare/v0.5.7...v0.6.0) (2024-01-03)

### Features

- **plugin-eslint:** set "passed" displayValue for ESLint audits ([40f61a4](https://github.com/code-pushup/cli/commit/40f61a44ec5157a9f6e39218838c5c038fcb495a))

## [0.5.7](https://github.com/code-pushup/cli/compare/v0.5.6...v0.5.7) (2024-01-03)

### Bug Fixes

- **plugin-eslint:** set default lint file patterns for Nx projects ([9db19d0](https://github.com/code-pushup/cli/commit/9db19d01c27b2c577268ae4ccac76c64e2341523))

## [0.5.6](https://github.com/code-pushup/cli/compare/v0.5.5...v0.5.6) (2023-12-29)

## [0.5.5](https://github.com/code-pushup/cli/compare/v0.5.4...v0.5.5) (2023-12-26)

## [0.5.4](https://github.com/code-pushup/cli/compare/v0.5.3...v0.5.4) (2023-12-19)

### Bug Fixes

- **cli:** adjust persist.format options ([#363](https://github.com/code-pushup/cli/issues/363)) ([b5b3bc6](https://github.com/code-pushup/cli/commit/b5b3bc69151091c6e75d7b64a19e4f559ad50ee1))

## [0.5.3](https://github.com/code-pushup/cli/compare/v0.5.2...v0.5.3) (2023-12-19)

### Bug Fixes

- **cli:** fix json format handling ([#360](https://github.com/code-pushup/cli/issues/360)) ([bc9f101](https://github.com/code-pushup/cli/commit/bc9f10198d821d2359b72d8f8506d5c98d55d7bb))

## [0.5.2](https://github.com/code-pushup/cli/compare/v0.5.1...v0.5.2) (2023-12-19)

## [0.5.1](https://github.com/code-pushup/cli/compare/v0.5.0...v0.5.1) (2023-12-18)

# [0.5.0](https://github.com/code-pushup/cli/compare/v0.4.5...v0.5.0) (2023-12-17)

### Features

- **examples-plugins:** add package-json plugin 📦 ([#354](https://github.com/code-pushup/cli/issues/354)) ([e2f2abe](https://github.com/code-pushup/cli/commit/e2f2abe1cbf523359d76f6b27e8e2715977546a2))

## [0.4.5](https://github.com/code-pushup/cli/compare/v0.4.4...v0.4.5) (2023-12-15)

## [0.4.4](https://github.com/code-pushup/cli/compare/v0.4.3...v0.4.4) (2023-12-15)

## [0.4.3](https://github.com/code-pushup/cli/compare/v0.4.2...v0.4.3) (2023-12-14)

## [0.4.2](https://github.com/code-pushup/cli/compare/v0.4.1...v0.4.2) (2023-12-12)

### Performance Improvements

- **utils:** setup microbenchmark for crawlFileSystem ([#355](https://github.com/code-pushup/cli/issues/355)) ([33d6e25](https://github.com/code-pushup/cli/commit/33d6e25c92161c305bf12334ee9e490b927ef71d))

## [0.4.1](https://github.com/code-pushup/cli/compare/v0.4.0...v0.4.1) (2023-12-12)

# [0.4.0](https://github.com/code-pushup/cli/compare/v0.3.2...v0.4.0) (2023-12-11)

### Features

- **utils:** add sorting of audit issues for report md ([b1c5dd7](https://github.com/code-pushup/cli/commit/b1c5dd7d7763141a872a9af8e1c9ba08650fa9c5)), closes [#313](https://github.com/code-pushup/cli/issues/313) [#313](https://github.com/code-pushup/cli/issues/313)

## [0.3.2](https://github.com/code-pushup/cli/compare/v0.3.1...v0.3.2) (2023-12-10)

## [0.3.1](https://github.com/code-pushup/cli/compare/v0.3.0...v0.3.1) (2023-12-04)

# [0.3.0](https://github.com/code-pushup/cli/compare/v0.2.0...v0.3.0) (2023-12-04)

### Bug Fixes

- **plugin-eslint:** truncate rule texts to pass models validations ([a6aac56](https://github.com/code-pushup/cli/commit/a6aac56ed5b6ac73638033ddf5fbba0ab4ec2551))

### Features

- **utils:** add utility function for truncating texts ([bdce572](https://github.com/code-pushup/cli/commit/bdce57299088045ed0af5c0b8129c59d8625e80e))

# [0.2.0](https://github.com/code-pushup/cli/compare/v0.1.1...v0.2.0) (2023-12-04)

### Bug Fixes

- **plugin-eslint:** dynamic import for optional peer dep @nx/devkit ([ab62f2f](https://github.com/code-pushup/cli/commit/ab62f2f38604fc28745b4ef99d7c2d44d93aacf2))

### Features

- **plugin-eslint:** add docs url ([d6a6b2a](https://github.com/code-pushup/cli/commit/d6a6b2ad899f9659b97acfd98c357df8f2c7a2ff))
- **plugin-eslint:** provide Nx helper to combine eslint config from all projects ([82fa3e1](https://github.com/code-pushup/cli/commit/82fa3e18a5171b7f6f8a3b0b3ca33ec6d4cc2de6))
- **plugin-eslint:** provide Nx helper to combine eslint configs from project with deps ([29cd887](https://github.com/code-pushup/cli/commit/29cd8876088ac7976bd3d9f484da6e46abafce9a))

## [0.1.1](https://github.com/code-pushup/cli/compare/v0.1.0...v0.1.1) (2023-12-02)

# 0.1.0 (2023-12-01)

### Bug Fixes

- **cli-e2e:** re-create package-lock.json ([8a99ec0](https://github.com/code-pushup/cli/commit/8a99ec035c845b17573b7bd6ceac8332f282ccf9))
- **cli:** changed persist format options to array ([#153](https://github.com/code-pushup/cli/issues/153)) ([26c6a85](https://github.com/code-pushup/cli/commit/26c6a859608447d486c5e180788077f1e7955392)), closes [#95](https://github.com/code-pushup/cli/issues/95)
- **cli:** exclude nested kebab-case keys, update tests ([741d5a5](https://github.com/code-pushup/cli/commit/741d5a545a0333ea4dc747c9ab8255fc233bab56))
- **cli:** parse multiple config args to last item of array ([#164](https://github.com/code-pushup/cli/issues/164)) ([7c81f81](https://github.com/code-pushup/cli/commit/7c81f8113999e2bb68739cc9a6ee008e9db62bfb)), closes [#146](https://github.com/code-pushup/cli/issues/146)
- **cli:** replace clui on @isaacs/cliui ([#282](https://github.com/code-pushup/cli/issues/282)) ([465f230](https://github.com/code-pushup/cli/commit/465f230133de3742d4f6d4bdeaf64d7db44e767f)), closes [#209](https://github.com/code-pushup/cli/issues/209)
- **cli:** run `npm install` before tests ([6507c2e](https://github.com/code-pushup/cli/commit/6507c2e9c2e4105144c03ef74cdfbe1e999355a7))
- **core:** audit metadata looked up in plugin config, not expected in output ([31ffd5e](https://github.com/code-pushup/cli/commit/31ffd5e39cab3d5ddb997c92b7efafdc920c8359))
- **core:** include package.json data ([0fef0c3](https://github.com/code-pushup/cli/commit/0fef0c3b784454a2ab2d9e0fb65f132e8ee8e196))
- formatting ([7e5e743](https://github.com/code-pushup/cli/commit/7e5e743343210b0db705b72022ac4fc86a3b8365))
- lint config and errors ([6f5f677](https://github.com/code-pushup/cli/commit/6f5f6779a37359fdde2740fa42e44e7320fa190c))
- **models:** add package.lock ([8075613](https://github.com/code-pushup/cli/commit/80756135f2a1562da0a161d20fd7d329c3ee5520))
- **models:** allow empty string as docsUrl ([1c34d92](https://github.com/code-pushup/cli/commit/1c34d923b06eec7f19bd97d93fdd109a4a40da1c))
- **models:** increase character limit for issue message ([e6f6fc8](https://github.com/code-pushup/cli/commit/e6f6fc83ad6d4419339c64e4924abd23f7d1b3d4))
- **plugin-eslint:** allow unmatched patterns ([d350187](https://github.com/code-pushup/cli/commit/d350187109205788eaefd3ee280f5f80a9896cd7))
- **plugin-eslint:** ensure runner output directory exists ([fca87f5](https://github.com/code-pushup/cli/commit/fca87f582ccce7a6c09f823fe03d14809a878fb4))
- **plugin-eslint:** ensure working directory exists before writing .eslintrc.json ([3f19d6f](https://github.com/code-pushup/cli/commit/3f19d6f7ecc8fe69dd717cdb2a9912d6a1c53033))
- **plugin-eslint:** exclude rules which are turned off ([f2cc454](https://github.com/code-pushup/cli/commit/f2cc45424b3d14e4b0c7c9964d8be9288af1f0c4))
- **plugin-eslint:** handle implicitly relative config paths ([39a7d43](https://github.com/code-pushup/cli/commit/39a7d43cb900607bacb21764540f5b0a5fcf418a))
- **plugin-eslint:** omit empty docsUrl in audit metadata ([3127683](https://github.com/code-pushup/cli/commit/3127683b59bd328f085ff1c558db02d985e4b5cd))
- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/code-pushup/cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/code-pushup/cli/issues/83)) ([aa39d09](https://github.com/code-pushup/cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))
- sync package-lock.json with `npm install` ([0fde5f3](https://github.com/code-pushup/cli/commit/0fde5f318b9b110bd308181b21da063bab961832))
- **testing:** fix tests for Windows ([#165](https://github.com/code-pushup/cli/issues/165)) ([b80255b](https://github.com/code-pushup/cli/commit/b80255b5ed93c9cb6312d8c426a82f4b8bd1cdf3)), closes [#131](https://github.com/code-pushup/cli/issues/131)
- **utils,cli:** remove all mentions of the `interactive` option ([#245](https://github.com/code-pushup/cli/issues/245)) ([be7471e](https://github.com/code-pushup/cli/commit/be7471ee8aadf6a6a6c1af2e3ceb35e48a372759)), closes [#120](https://github.com/code-pushup/cli/issues/120)
- **utils:** handle descriptions ending in code block in report.md ([a9a05ad](https://github.com/code-pushup/cli/commit/a9a05ade4d57a24b364cf6e10ba08d35f89e9a95))

### Features

- add transform to persist config ([#229](https://github.com/code-pushup/cli/issues/229)) ([ce4d975](https://github.com/code-pushup/cli/commit/ce4d975feafeea1249faf58a3acbbfc1483d8c90))
- **cli:** add `--persist.filename` cli option ([#187](https://github.com/code-pushup/cli/issues/187)) ([296df7d](https://github.com/code-pushup/cli/commit/296df7df42afcb656f33a657b7d1820a75208824))
- **cli:** disabled version option ([#162](https://github.com/code-pushup/cli/issues/162)) ([9a5371c](https://github.com/code-pushup/cli/commit/9a5371cdef6f1148d0230aaa866b4e9d3e0bdba0)), closes [#124](https://github.com/code-pushup/cli/issues/124)
- **cli:** initial collect command ([#45](https://github.com/code-pushup/cli/issues/45)) ([ba048be](https://github.com/code-pushup/cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** introduce the `onlyPlugins` option ([#246](https://github.com/code-pushup/cli/issues/246)) ([13c9d26](https://github.com/code-pushup/cli/commit/13c9d26c24f3dd8bc97f62298231487d01b0ffa5)), closes [#119](https://github.com/code-pushup/cli/issues/119)
- **cli:** persist login and formatting options ([#47](https://github.com/code-pushup/cli/issues/47)) ([6241fd7](https://github.com/code-pushup/cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/code-pushup/cli/issues/42)) ([37ea0a5](https://github.com/code-pushup/cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/code-pushup/cli/issues/6) [#38](https://github.com/code-pushup/cli/issues/38)
- **cli:** use bundle-require instead of jiti (no hackfix, but also no CJS configs) ([028c592](https://github.com/code-pushup/cli/commit/028c592817b8440e0af5ce1f72e8fffde2f11314))
- configure build and tests to handle ESM and CJS configs ([48cd967](https://github.com/code-pushup/cli/commit/48cd967866a84488e6a2382fe44687a31ca47db2))
- **core:** add core package ([dd8ddae](https://github.com/code-pushup/cli/commit/dd8ddaeaaf91534261f0416e15b79fe924a4a798))
- **core:** add esm plugin logic ([#248](https://github.com/code-pushup/cli/issues/248)) ([18d4e3a](https://github.com/code-pushup/cli/commit/18d4e3af31bc10a55b01fc8201d83c6caf0548e3))
- **core:** change to execute all plugins before throwing on failed ([#275](https://github.com/code-pushup/cli/issues/275)) ([32a6ef5](https://github.com/code-pushup/cli/commit/32a6ef55444b28ef6468eb2b38facd5f1c554a80)), closes [#159](https://github.com/code-pushup/cli/issues/159)
- **models:** add isBinary field to category schema ([8b13039](https://github.com/code-pushup/cli/commit/8b130390059a9986fd06f9c9fc2415ad7963da5b))
- **models:** add report filename option ([#174](https://github.com/code-pushup/cli/issues/174)) ([bdeab54](https://github.com/code-pushup/cli/commit/bdeab543c305d7c100762b0e490b292468eac172))
- **models:** setup types and parser with zod ([7d5c99e](https://github.com/code-pushup/cli/commit/7d5c99e47d026167914a265941c710eed5fd84a2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/code-pushup/cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **nx-plugin:** add configuration generator ([#294](https://github.com/code-pushup/cli/issues/294)) ([ee21143](https://github.com/code-pushup/cli/commit/ee21143f3128be606779b5224b35a329b092399f)), closes [#61](https://github.com/code-pushup/cli/issues/61)
- **nx-plugin:** initial setup and init command ([#51](https://github.com/code-pushup/cli/issues/51)) ([c8dd4d9](https://github.com/code-pushup/cli/commit/c8dd4d95fc8869df697bcc18e73c6cb93f05ba6a)), closes [#9](https://github.com/code-pushup/cli/issues/9)
- **plugin-eslint:** add support for inline eslint config ([67571eb](https://github.com/code-pushup/cli/commit/67571eb529ade91a77e2c739a3995674e52701af))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/code-pushup/cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/code-pushup/cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** create groups from rules' meta.docs.category (per plugin) ([56e129c](https://github.com/code-pushup/cli/commit/56e129c58be4c0544bc1c9dffec1f7ce09260254))
- **plugin-eslint:** create groups from rules' meta.type (problem/suggestion/layout) ([0350e49](https://github.com/code-pushup/cli/commit/0350e492c26015097ef94fb51eb15d7d334a5080))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/code-pushup/cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** include NPM package name and version ([25bda11](https://github.com/code-pushup/cli/commit/25bda113f31c20cc98832ed2f112abe0e058b54c))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/code-pushup/cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **plugin-eslint:** rule options used to identify audit, options in slug (hash) and description ([b9f51c9](https://github.com/code-pushup/cli/commit/b9f51c97d40cbfe7c62f85c4a289ad2528f1fba1))
- **plugin-eslint:** validate initializer params with Zod ([56e1aee](https://github.com/code-pushup/cli/commit/56e1aeeedec220fb5f68de9c3fa0eb309fbd2cf2))
- support top-level await in config files ([7712250](https://github.com/code-pushup/cli/commit/7712250320a93ce61436476f41a247616adf540e))
- support TS config files using Jiti + hackfix lighthouse import.meta usages ([3b7927d](https://github.com/code-pushup/cli/commit/3b7927d65d4607a35dc23d076e72184c281ae8f6))
- **utils:** add audits sorting for reports ([#302](https://github.com/code-pushup/cli/issues/302)) ([10ee12e](https://github.com/code-pushup/cli/commit/10ee12e8138fa0dd71b0e0acb2d717327e22007c)), closes [#210](https://github.com/code-pushup/cli/issues/210)
- **utils:** add command line args helper ([#52](https://github.com/code-pushup/cli/issues/52)) ([9d6acec](https://github.com/code-pushup/cli/commit/9d6aceccb85a4c4cc71319e4c8d14a9ff2897e8e)), closes [#43](https://github.com/code-pushup/cli/issues/43)
- **utils:** add file size logging ([#65](https://github.com/code-pushup/cli/issues/65)) ([c46046f](https://github.com/code-pushup/cli/commit/c46046f9756ea2d02e1d9bb7cc0bbfeff09e61a3)), closes [#59](https://github.com/code-pushup/cli/issues/59)
- **utils:** add file-system helper ([#336](https://github.com/code-pushup/cli/issues/336)) ([001498b](https://github.com/code-pushup/cli/commit/001498b1f54460f77f46eaaa9033e4b04629c878))
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/code-pushup/cli/issues/39)) ([dacaaf7](https://github.com/code-pushup/cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/code-pushup/cli/issues/32)
- **utils:** add scoring logic ([#133](https://github.com/code-pushup/cli/issues/133)) ([89fecbb](https://github.com/code-pushup/cli/commit/89fecbba34d78b526b065de13fdb27e522bb4c3f))
- **utils:** add upload logic ([#66](https://github.com/code-pushup/cli/issues/66)) ([3e88ffc](https://github.com/code-pushup/cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/code-pushup/cli/issues/21) [#57](https://github.com/code-pushup/cli/issues/57) [#85](https://github.com/code-pushup/cli/issues/85)
- **utils:** implement a new design for stdout ([#206](https://github.com/code-pushup/cli/issues/206)) ([84b8c28](https://github.com/code-pushup/cli/commit/84b8c281dd0f2cfdacfc25f9f7b658a81828fde0)), closes [#190](https://github.com/code-pushup/cli/issues/190)
- **utils:** implement report.md formatting ([#196](https://github.com/code-pushup/cli/issues/196)) ([346596d](https://github.com/code-pushup/cli/commit/346596dc44c7970e3a960222961ba61d0b2b646d)), closes [#148](https://github.com/code-pushup/cli/issues/148)
- **utils:** implement verbose helper logic ([#121](https://github.com/code-pushup/cli/issues/121)) ([112ebe7](https://github.com/code-pushup/cli/commit/112ebe7d1cce68872398967ffaea84c6906bafed))
- **utils:** move parts from utils into core ([#81](https://github.com/code-pushup/cli/issues/81)) ([dd0a180](https://github.com/code-pushup/cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/code-pushup/cli/issues/78)
- **utils:** update git latest commit functionality ([#205](https://github.com/code-pushup/cli/issues/205)) ([7ec4582](https://github.com/code-pushup/cli/commit/7ec45829a34127410e972a207e37ee03bc33d09a)), closes [#192](https://github.com/code-pushup/cli/issues/192)

### Performance Improvements

- **utils:** add benchmark logic and example ([#137](https://github.com/code-pushup/cli/issues/137)) ([142943e](https://github.com/code-pushup/cli/commit/142943e1000064a759dc0d0e8239849af32d263e))
- **utils:** improve the performance of scoring and reporting ([#212](https://github.com/code-pushup/cli/issues/212)) ([41d7c0b](https://github.com/code-pushup/cli/commit/41d7c0b442b7f73dbb0408fc704af27e4827855e)), closes [#132](https://github.com/code-pushup/cli/issues/132)
