# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- **models:** add isBinary field to category schema ([8b13039](https://github.com/flowup/quality-metrics-cli/commit/8b130390059a9986fd06f9c9fc2415ad7963da5b))
- **models:** setup types and parser with zod ([7d5c99e](https://github.com/flowup/quality-metrics-cli/commit/7d5c99e47d026167914a265941c710eed5fd84a2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/flowup/quality-metrics-cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/flowup/quality-metrics-cli/issues/39)) ([dacaaf7](https://github.com/flowup/quality-metrics-cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/flowup/quality-metrics-cli/issues/32)
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)

### Bug Fixes

- **core:** audit metadata looked up in plugin config, not expected in output ([31ffd5e](https://github.com/flowup/quality-metrics-cli/commit/31ffd5e39cab3d5ddb997c92b7efafdc920c8359))
- **models:** allow empty string as docsUrl ([1c34d92](https://github.com/flowup/quality-metrics-cli/commit/1c34d923b06eec7f19bd97d93fdd109a4a40da1c))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **chore:** improvements testing ([#46](https://github.com/flowup/quality-metrics-cli/issues/46)) ([ce21d87](https://github.com/flowup/quality-metrics-cli/commit/ce21d8775e18903adfb4651cbd401d5466592af5))
- **cli:** prepare for core package ([#80](https://github.com/flowup/quality-metrics-cli/issues/80)) ([0c915f0](https://github.com/flowup/quality-metrics-cli/commit/0c915f0dd9b507514e329ff240e0d0511670f2f6)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73) [#79](https://github.com/flowup/quality-metrics-cli/issues/79)
- **cli:** rename configPath to config ([#109](https://github.com/flowup/quality-metrics-cli/issues/109)) ([daf548d](https://github.com/flowup/quality-metrics-cli/commit/daf548df1d153409998213ca11914212a1d036b6))
- **models:** add cross field validators ([788cfb4](https://github.com/flowup/quality-metrics-cli/commit/788cfb417afc42fd63a2bae276762340a41ec7ca))
- **models:** add global options ([#76](https://github.com/flowup/quality-metrics-cli/issues/76)) ([28966a2](https://github.com/flowup/quality-metrics-cli/commit/28966a263434ee9e0d4d86466b2d78f389dd6324)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73)
- **models:** add int and non negative validators ([2157e45](https://github.com/flowup/quality-metrics-cli/commit/2157e45a6e9b531db8a6f5d1968f34db63b424da))
- **models:** add regex and validators and tests ([65ca4df](https://github.com/flowup/quality-metrics-cli/commit/65ca4df73f91200c011f66067f38519ae9712e95))
- **models:** add test case ([da437ad](https://github.com/flowup/quality-metrics-cli/commit/da437ad274f9ed498225df89ee748de7e225d571))
- **models:** align package.json ([40ec70e](https://github.com/flowup/quality-metrics-cli/commit/40ec70e3fc68ce81568804de71901df826abec81))
- **models:** fix tests and comments ([227d8c7](https://github.com/flowup/quality-metrics-cli/commit/227d8c7b75cf97158a23a3287a4677a5b6760da8))
- **models:** fix tests and lint errors ([ba1e811](https://github.com/flowup/quality-metrics-cli/commit/ba1e81116f38302ed6a69f2b7bd413a207f3e379))
- **models:** format ([0e3087a](https://github.com/flowup/quality-metrics-cli/commit/0e3087a18dd4a8cafd4e9f2dd3006e79360f27d8))
- **models:** format ([77142b0](https://github.com/flowup/quality-metrics-cli/commit/77142b06dca43f96eeef1aa2e28148b8602ebf40))
- **models:** format files ([8b943d2](https://github.com/flowup/quality-metrics-cli/commit/8b943d2845156265bb050c3ec1ea41bb526d6e2f))
- **models:** implement feedback from PR, format ([990b058](https://github.com/flowup/quality-metrics-cli/commit/990b058b34ef24a7de978edfed12641648681f1a))
- **models:** merge suggestions, fix tests ([6425f01](https://github.com/flowup/quality-metrics-cli/commit/6425f016179056c705e9e005964af63ff592aeaf))
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- **models:** remove budgets ([b9eea33](https://github.com/flowup/quality-metrics-cli/commit/b9eea33bd0e8bec8014ae2a2d40bda7ce2d2461a))
- **models:** remove budgets from initial code base ([2e23aeb](https://github.com/flowup/quality-metrics-cli/commit/2e23aeb0afbdfe4e19b13fc815bc993cc74435e6))

## 0.1.0 (2023-10-17)

### Features

- **cli:** initial collect command ([#45](https://github.com/flowup/quality-metrics-cli/issues/45)) ([ba048be](https://github.com/flowup/quality-metrics-cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/flowup/quality-metrics-cli/issues/47)) ([6241fd7](https://github.com/flowup/quality-metrics-cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/flowup/quality-metrics-cli/issues/42)) ([37ea0a5](https://github.com/flowup/quality-metrics-cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/flowup/quality-metrics-cli/issues/6) [#38](https://github.com/flowup/quality-metrics-cli/issues/38)
- **models:** add isBinary field to category schema ([8b13039](https://github.com/flowup/quality-metrics-cli/commit/8b130390059a9986fd06f9c9fc2415ad7963da5b))
- **models:** setup types and parser with zod ([7d5c99e](https://github.com/flowup/quality-metrics-cli/commit/7d5c99e47d026167914a265941c710eed5fd84a2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/flowup/quality-metrics-cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/flowup/quality-metrics-cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/flowup/quality-metrics-cli/issues/39)) ([dacaaf7](https://github.com/flowup/quality-metrics-cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/flowup/quality-metrics-cli/issues/32)
- **utils:** add upload logic ([#66](https://github.com/flowup/quality-metrics-cli/issues/66)) ([3e88ffc](https://github.com/flowup/quality-metrics-cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/flowup/quality-metrics-cli/issues/21) [#57](https://github.com/flowup/quality-metrics-cli/issues/57) [#85](https://github.com/flowup/quality-metrics-cli/issues/85)

### Bug Fixes

- **core:** audit metadata looked up in plugin config, not expected in output ([31ffd5e](https://github.com/flowup/quality-metrics-cli/commit/31ffd5e39cab3d5ddb997c92b7efafdc920c8359))
- **models:** allow empty string as docsUrl ([1c34d92](https://github.com/flowup/quality-metrics-cli/commit/1c34d923b06eec7f19bd97d93fdd109a4a40da1c))
- refactor after core package intro ([#83](https://github.com/flowup/quality-metrics-cli/issues/83)) ([aa39d09](https://github.com/flowup/quality-metrics-cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))

### Code Refactoring

- add version targets and ([0d5b87c](https://github.com/flowup/quality-metrics-cli/commit/0d5b87c5a3edbe0fb59dd021dd94779d425ed716))
- **chore:** improvements testing ([#46](https://github.com/flowup/quality-metrics-cli/issues/46)) ([ce21d87](https://github.com/flowup/quality-metrics-cli/commit/ce21d8775e18903adfb4651cbd401d5466592af5))
- **cli:** prepare for core package ([#80](https://github.com/flowup/quality-metrics-cli/issues/80)) ([0c915f0](https://github.com/flowup/quality-metrics-cli/commit/0c915f0dd9b507514e329ff240e0d0511670f2f6)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73) [#79](https://github.com/flowup/quality-metrics-cli/issues/79)
- **cli:** rename configPath to config ([#109](https://github.com/flowup/quality-metrics-cli/issues/109)) ([daf548d](https://github.com/flowup/quality-metrics-cli/commit/daf548df1d153409998213ca11914212a1d036b6))
- **models:** add cross field validators ([788cfb4](https://github.com/flowup/quality-metrics-cli/commit/788cfb417afc42fd63a2bae276762340a41ec7ca))
- **models:** add global options ([#76](https://github.com/flowup/quality-metrics-cli/issues/76)) ([28966a2](https://github.com/flowup/quality-metrics-cli/commit/28966a263434ee9e0d4d86466b2d78f389dd6324)), closes [#73](https://github.com/flowup/quality-metrics-cli/issues/73)
- **models:** add int and non negative validators ([2157e45](https://github.com/flowup/quality-metrics-cli/commit/2157e45a6e9b531db8a6f5d1968f34db63b424da))
- **models:** add regex and validators and tests ([65ca4df](https://github.com/flowup/quality-metrics-cli/commit/65ca4df73f91200c011f66067f38519ae9712e95))
- **models:** add test case ([da437ad](https://github.com/flowup/quality-metrics-cli/commit/da437ad274f9ed498225df89ee748de7e225d571))
- **models:** align package.json ([40ec70e](https://github.com/flowup/quality-metrics-cli/commit/40ec70e3fc68ce81568804de71901df826abec81))
- **models:** fix tests and comments ([227d8c7](https://github.com/flowup/quality-metrics-cli/commit/227d8c7b75cf97158a23a3287a4677a5b6760da8))
- **models:** fix tests and lint errors ([ba1e811](https://github.com/flowup/quality-metrics-cli/commit/ba1e81116f38302ed6a69f2b7bd413a207f3e379))
- **models:** format ([0e3087a](https://github.com/flowup/quality-metrics-cli/commit/0e3087a18dd4a8cafd4e9f2dd3006e79360f27d8))
- **models:** format ([77142b0](https://github.com/flowup/quality-metrics-cli/commit/77142b06dca43f96eeef1aa2e28148b8602ebf40))
- **models:** format files ([8b943d2](https://github.com/flowup/quality-metrics-cli/commit/8b943d2845156265bb050c3ec1ea41bb526d6e2f))
- **models:** implement feedback from PR, format ([990b058](https://github.com/flowup/quality-metrics-cli/commit/990b058b34ef24a7de978edfed12641648681f1a))
- **models:** merge suggestions, fix tests ([6425f01](https://github.com/flowup/quality-metrics-cli/commit/6425f016179056c705e9e005964af63ff592aeaf))
- **models:** name file related path more specific ([#102](https://github.com/flowup/quality-metrics-cli/issues/102)) ([fff1ae2](https://github.com/flowup/quality-metrics-cli/commit/fff1ae29c2b3ceb6bc53de1bdaf222859dc9fc83)), closes [#96](https://github.com/flowup/quality-metrics-cli/issues/96)
- **models:** refine data structure ([#55](https://github.com/flowup/quality-metrics-cli/issues/55)) ([f94933b](https://github.com/flowup/quality-metrics-cli/commit/f94933b008fd4b475e6a2ceb1d9d008899df8f53)), closes [#50](https://github.com/flowup/quality-metrics-cli/issues/50)
- **models:** remove budgets ([b9eea33](https://github.com/flowup/quality-metrics-cli/commit/b9eea33bd0e8bec8014ae2a2d40bda7ce2d2461a))
- **models:** remove budgets from initial code base ([2e23aeb](https://github.com/flowup/quality-metrics-cli/commit/2e23aeb0afbdfe4e19b13fc815bc993cc74435e6))
