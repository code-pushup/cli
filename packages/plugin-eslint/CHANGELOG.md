# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- configure build and tests to handle ESM and CJS configs ([48cd967](https://github.com/flowup/quality-metrics-cli/commit/48cd967866a84488e6a2382fe44687a31ca47db2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/flowup/quality-metrics-cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/flowup/quality-metrics-cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/flowup/quality-metrics-cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** include NPM package name and version ([25bda11](https://github.com/flowup/quality-metrics-cli/commit/25bda113f31c20cc98832ed2f112abe0e058b54c))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/flowup/quality-metrics-cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **plugin-eslint:** rule options used to identify audit, options in slug (hash) and description ([b9f51c9](https://github.com/flowup/quality-metrics-cli/commit/b9f51c97d40cbfe7c62f85c4a289ad2528f1fba1))
- **plugin-eslint:** validate initializer params with Zod ([56e1aee](https://github.com/flowup/quality-metrics-cli/commit/56e1aeeedec220fb5f68de9c3fa0eb309fbd2cf2))
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/flowup/quality-metrics-cli/issues/81)) ([dd0a180](https://github.com/flowup/quality-metrics-cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/flowup/quality-metrics-cli/issues/78)

### Bug Fixes

- lint config and errors ([6f5f677](https://github.com/flowup/quality-metrics-cli/commit/6f5f6779a37359fdde2740fa42e44e7320fa190c))
- **plugin-eslint:** ensure runner output directory exists ([fca87f5](https://github.com/flowup/quality-metrics-cli/commit/fca87f582ccce7a6c09f823fe03d14809a878fb4))
- **plugin-eslint:** exclude rules which are turned off ([f2cc454](https://github.com/flowup/quality-metrics-cli/commit/f2cc45424b3d14e4b0c7c9964d8be9288af1f0c4))
- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/flowup/quality-metrics-cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Documentation

- **plugin-eslint:** jsdoc for eslintPlugin function ([890cf4c](https://github.com/flowup/quality-metrics-cli/commit/890cf4c24ae12229cfa7103ef4c0deb7eb397efc))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- **plugin-eslint:** reorganize files ([a5bfd7b](https://github.com/flowup/quality-metrics-cli/commit/a5bfd7b238dde6432f8e3993fead04ec70cc4fa6))
- purge remaining jest references ([3c6c0ae](https://github.com/flowup/quality-metrics-cli/commit/3c6c0ae74f1374941781088c11abc41d9dee1e7f))

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- configure build and tests to handle ESM and CJS configs ([48cd967](https://github.com/flowup/quality-metrics-cli/commit/48cd967866a84488e6a2382fe44687a31ca47db2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/flowup/quality-metrics-cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/flowup/quality-metrics-cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/flowup/quality-metrics-cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** include NPM package name and version ([25bda11](https://github.com/flowup/quality-metrics-cli/commit/25bda113f31c20cc98832ed2f112abe0e058b54c))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/flowup/quality-metrics-cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **plugin-eslint:** rule options used to identify audit, options in slug (hash) and description ([b9f51c9](https://github.com/flowup/quality-metrics-cli/commit/b9f51c97d40cbfe7c62f85c4a289ad2528f1fba1))
- **plugin-eslint:** validate initializer params with Zod ([56e1aee](https://github.com/flowup/quality-metrics-cli/commit/56e1aeeedec220fb5f68de9c3fa0eb309fbd2cf2))
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/flowup/quality-metrics-cli/issues/81)) ([dd0a180](https://github.com/flowup/quality-metrics-cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/flowup/quality-metrics-cli/issues/78)

### Bug Fixes

- lint config and errors ([6f5f677](https://github.com/flowup/quality-metrics-cli/commit/6f5f6779a37359fdde2740fa42e44e7320fa190c))
- **plugin-eslint:** ensure runner output directory exists ([fca87f5](https://github.com/flowup/quality-metrics-cli/commit/fca87f582ccce7a6c09f823fe03d14809a878fb4))
- **plugin-eslint:** exclude rules which are turned off ([f2cc454](https://github.com/flowup/quality-metrics-cli/commit/f2cc45424b3d14e4b0c7c9964d8be9288af1f0c4))
- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/flowup/quality-metrics-cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Documentation

- **plugin-eslint:** jsdoc for eslintPlugin function ([890cf4c](https://github.com/flowup/quality-metrics-cli/commit/890cf4c24ae12229cfa7103ef4c0deb7eb397efc))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- **plugin-eslint:** reorganize files ([a5bfd7b](https://github.com/flowup/quality-metrics-cli/commit/a5bfd7b238dde6432f8e3993fead04ec70cc4fa6))
- purge remaining jest references ([3c6c0ae](https://github.com/flowup/quality-metrics-cli/commit/3c6c0ae74f1374941781088c11abc41d9dee1e7f))
