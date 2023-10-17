# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/flowup/quality-metrics-cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/flowup/quality-metrics-cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/flowup/quality-metrics-cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/flowup/quality-metrics-cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **utils:** add command line args helper ([#52](https://github.com/flowup/quality-metrics-cli/issues/52)) ([9d6acec](https://github.com/flowup/quality-metrics-cli/commit/9d6aceccb85a4c4cc71319e4c8d14a9ff2897e8e)), closes [#43](https://github.com/flowup/quality-metrics-cli/issues/43)
- **utils:** add file size logging ([#65](https://github.com/flowup/quality-metrics-cli/issues/65)) ([c46046f](https://github.com/flowup/quality-metrics-cli/commit/c46046f9756ea2d02e1d9bb7cc0bbfeff09e61a3)), closes [#59](https://github.com/flowup/quality-metrics-cli/issues/59)
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/flowup/quality-metrics-cli/issues/39)) ([dacaaf7](https://github.com/flowup/quality-metrics-cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/flowup/quality-metrics-cli/issues/32)
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/flowup/quality-metrics-cli/issues/81)) ([dd0a180](https://github.com/flowup/quality-metrics-cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/flowup/quality-metrics-cli/issues/78)

### Bug Fixes

- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/flowup/quality-metrics-cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **chore:** improvements testing ([#46](https://github.com/flowup/quality-metrics-cli/issues/46)) ([ce21d87](https://github.com/flowup/quality-metrics-cli/commit/ce21d8775e18903adfb4651cbd401d5466592af5))
- **cli:** prepare for core package ([#80](https://github.com/flowup/quality-metrics-cli/issues/80)) ([0c915f0](https://github.com/flowup/quality-metrics-cli/commit/0c915f0dd9b507514e329ff240e0d0511670f2f6)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73) [#79](https://github.com/flowup/quality-metrics-cli/issues/79)
- **models:** add global options ([#76](https://github.com/flowup/quality-metrics-cli/issues/76)) ([28966a2](https://github.com/flowup/quality-metrics-cli/commit/28966a263434ee9e0d4d86466b2d78f389dd6324)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73)
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- **utils:** add package.json metadata to report in cli, not utils ([7d3de10](https://github.com/flowup/quality-metrics-cli/commit/7d3de1090cb820121fe245c24d453919546f90e8))
- **utils:** format duration, add tests ([#60](https://github.com/flowup/quality-metrics-cli/issues/60)) ([89a5e4c](https://github.com/flowup/quality-metrics-cli/commit/89a5e4c2dbb8f9c9a662de139f4856ada5d09595))
- **utils:** remove type-fest dependency ([bba4d0a](https://github.com/flowup/quality-metrics-cli/commit/bba4d0a03c60a5ac6c514db2282c2cb4a7c8d2bc))

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/flowup/quality-metrics-cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/flowup/quality-metrics-cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/flowup/quality-metrics-cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/flowup/quality-metrics-cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **utils:** add command line args helper ([#52](https://github.com/flowup/quality-metrics-cli/issues/52)) ([9d6acec](https://github.com/flowup/quality-metrics-cli/commit/9d6aceccb85a4c4cc71319e4c8d14a9ff2897e8e)), closes [#43](https://github.com/flowup/quality-metrics-cli/issues/43)
- **utils:** add file size logging ([#65](https://github.com/flowup/quality-metrics-cli/issues/65)) ([c46046f](https://github.com/flowup/quality-metrics-cli/commit/c46046f9756ea2d02e1d9bb7cc0bbfeff09e61a3)), closes [#59](https://github.com/flowup/quality-metrics-cli/issues/59)
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/flowup/quality-metrics-cli/issues/39)) ([dacaaf7](https://github.com/flowup/quality-metrics-cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/flowup/quality-metrics-cli/issues/32)
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/flowup/quality-metrics-cli/issues/81)) ([dd0a180](https://github.com/flowup/quality-metrics-cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/flowup/quality-metrics-cli/issues/78)

### Bug Fixes

- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/flowup/quality-metrics-cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **chore:** improvements testing ([#46](https://github.com/flowup/quality-metrics-cli/issues/46)) ([ce21d87](https://github.com/flowup/quality-metrics-cli/commit/ce21d8775e18903adfb4651cbd401d5466592af5))
- **cli:** prepare for core package ([#80](https://github.com/flowup/quality-metrics-cli/issues/80)) ([0c915f0](https://github.com/flowup/quality-metrics-cli/commit/0c915f0dd9b507514e329ff240e0d0511670f2f6)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73) [#79](https://github.com/flowup/quality-metrics-cli/issues/79)
- **models:** add global options ([#76](https://github.com/flowup/quality-metrics-cli/issues/76)) ([28966a2](https://github.com/flowup/quality-metrics-cli/commit/28966a263434ee9e0d4d86466b2d78f389dd6324)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73)
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- **utils:** add package.json metadata to report in cli, not utils ([7d3de10](https://github.com/flowup/quality-metrics-cli/commit/7d3de1090cb820121fe245c24d453919546f90e8))
- **utils:** format duration, add tests ([#60](https://github.com/flowup/quality-metrics-cli/issues/60)) ([89a5e4c](https://github.com/flowup/quality-metrics-cli/commit/89a5e4c2dbb8f9c9a662de139f4856ada5d09595))
- **utils:** remove type-fest dependency ([bba4d0a](https://github.com/flowup/quality-metrics-cli/commit/bba4d0a03c60a5ac6c514db2282c2cb4a7c8d2bc))
