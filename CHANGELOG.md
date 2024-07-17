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
