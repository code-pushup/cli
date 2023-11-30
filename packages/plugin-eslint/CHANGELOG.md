# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [0.1.1](https://github.com/code-pushup/cli/compare/plugin-eslint@0.1.0...plugin-eslint@0.1.1) (2023-11-30)

# 0.1.0 (2023-11-29)

### Bug Fixes

- lint config and errors ([6f5f677](https://github.com/code-pushup/cli/commit/6f5f6779a37359fdde2740fa42e44e7320fa190c))
- **plugin-eslint:** allow unmatched patterns ([d350187](https://github.com/code-pushup/cli/commit/d350187109205788eaefd3ee280f5f80a9896cd7))
- **plugin-eslint:** ensure runner output directory exists ([fca87f5](https://github.com/code-pushup/cli/commit/fca87f582ccce7a6c09f823fe03d14809a878fb4))
- **plugin-eslint:** exclude rules which are turned off ([f2cc454](https://github.com/code-pushup/cli/commit/f2cc45424b3d14e4b0c7c9964d8be9288af1f0c4))
- **plugin-eslint:** handle implicitly relative config paths ([39a7d43](https://github.com/code-pushup/cli/commit/39a7d43cb900607bacb21764540f5b0a5fcf418a))
- **plugin-eslint:** omit empty docsUrl in audit metadata ([3127683](https://github.com/code-pushup/cli/commit/3127683b59bd328f085ff1c558db02d985e4b5cd))
- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/code-pushup/cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/code-pushup/cli/issues/83)) ([aa39d09](https://github.com/code-pushup/cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))
- **testing:** fix tests for Windows ([#165](https://github.com/code-pushup/cli/issues/165)) ([b80255b](https://github.com/code-pushup/cli/commit/b80255b5ed93c9cb6312d8c426a82f4b8bd1cdf3)), closes [#131](https://github.com/code-pushup/cli/issues/131)

### Features

- **cli:** initial collect command ([#45](https://github.com/code-pushup/cli/issues/45)) ([ba048be](https://github.com/code-pushup/cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/code-pushup/cli/issues/47)) ([6241fd7](https://github.com/code-pushup/cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/code-pushup/cli/issues/42)) ([37ea0a5](https://github.com/code-pushup/cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/code-pushup/cli/issues/6) [#38](https://github.com/code-pushup/cli/issues/38)
- configure build and tests to handle ESM and CJS configs ([48cd967](https://github.com/code-pushup/cli/commit/48cd967866a84488e6a2382fe44687a31ca47db2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/code-pushup/cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/code-pushup/cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/code-pushup/cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** create groups from rules' meta.docs.category (per plugin) ([56e129c](https://github.com/code-pushup/cli/commit/56e129c58be4c0544bc1c9dffec1f7ce09260254))
- **plugin-eslint:** create groups from rules' meta.type (problem/suggestion/layout) ([0350e49](https://github.com/code-pushup/cli/commit/0350e492c26015097ef94fb51eb15d7d334a5080))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/code-pushup/cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** include NPM package name and version ([25bda11](https://github.com/code-pushup/cli/commit/25bda113f31c20cc98832ed2f112abe0e058b54c))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/code-pushup/cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **plugin-eslint:** rule options used to identify audit, options in slug (hash) and description ([b9f51c9](https://github.com/code-pushup/cli/commit/b9f51c97d40cbfe7c62f85c4a289ad2528f1fba1))
- **plugin-eslint:** validate initializer params with Zod ([56e1aee](https://github.com/code-pushup/cli/commit/56e1aeeedec220fb5f68de9c3fa0eb309fbd2cf2))
- **utils:** add upload logic ([#66](https://github.com/code-pushup/cli/issues/66)) ([3e88ffc](https://github.com/code-pushup/cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/code-pushup/cli/issues/21) [#57](https://github.com/code-pushup/cli/issues/57) [#85](https://github.com/code-pushup/cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/code-pushup/cli/issues/81)) ([dd0a180](https://github.com/code-pushup/cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/code-pushup/cli/issues/78)
