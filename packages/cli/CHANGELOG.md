# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- **cli:** use bundle-require instead of jiti (no hackfix, but also no CJS configs) ([028c592](https://github.com/flowup/quality-metrics-cli/commit/028c592817b8440e0af5ce1f72e8fffde2f11314))
- configure build and tests to handle ESM and CJS configs ([48cd967](https://github.com/flowup/quality-metrics-cli/commit/48cd967866a84488e6a2382fe44687a31ca47db2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- support TS config files using Jiti + hackfix lighthouse import.meta usages ([3b7927d](https://github.com/flowup/quality-metrics-cli/commit/3b7927d65d4607a35dc23d076e72184c281ae8f6))
- **utils:** add file size logging ([#65](https://github.com/flowup/quality-metrics-cli/issues/65)) ([c46046f](https://github.com/flowup/quality-metrics-cli/commit/c46046f9756ea2d02e1d9bb7cc0bbfeff09e61a3)), closes [#59](https://github.com/flowup/quality-metrics-cli/issues/59)
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/flowup/quality-metrics-cli/issues/39)) ([dacaaf7](https://github.com/flowup/quality-metrics-cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/flowup/quality-metrics-cli/issues/32)
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/flowup/quality-metrics-cli/issues/81)) ([dd0a180](https://github.com/flowup/quality-metrics-cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/flowup/quality-metrics-cli/issues/78)

### Bug Fixes

- **cli:** run `npm install` before tests ([6507c2e](https://github.com/flowup/quality-metrics-cli/commit/6507c2e9c2e4105144c03ef74cdfbe1e999355a7))
- lint config and errors ([6f5f677](https://github.com/flowup/quality-metrics-cli/commit/6f5f6779a37359fdde2740fa42e44e7320fa190c))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **chore:** improvements testing ([#46](https://github.com/flowup/quality-metrics-cli/issues/46)) ([ce21d87](https://github.com/flowup/quality-metrics-cli/commit/ce21d8775e18903adfb4651cbd401d5466592af5))
- **cli:** prepare for core package ([#80](https://github.com/flowup/quality-metrics-cli/issues/80)) ([0c915f0](https://github.com/flowup/quality-metrics-cli/commit/0c915f0dd9b507514e329ff240e0d0511670f2f6)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73) [#79](https://github.com/flowup/quality-metrics-cli/issues/79)
- **cli:** rename configPath to config ([#109](https://github.com/flowup/quality-metrics-cli/issues/109)) ([daf548d](https://github.com/flowup/quality-metrics-cli/commit/daf548df1d153409998213ca11914212a1d036b6))
- **models:** add global options ([#76](https://github.com/flowup/quality-metrics-cli/issues/76)) ([28966a2](https://github.com/flowup/quality-metrics-cli/commit/28966a263434ee9e0d4d86466b2d78f389dd6324)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73)
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- move config loading tests to cli-e2e project ([16cd86d](https://github.com/flowup/quality-metrics-cli/commit/16cd86dedf721bf9e0083cc779e754e22b852074))
- purge remaining jest references ([3c6c0ae](https://github.com/flowup/quality-metrics-cli/commit/3c6c0ae74f1374941781088c11abc41d9dee1e7f))
- **utils:** add package.json metadata to report in cli, not utils ([7d3de10](https://github.com/flowup/quality-metrics-cli/commit/7d3de1090cb820121fe245c24d453919546f90e8))
