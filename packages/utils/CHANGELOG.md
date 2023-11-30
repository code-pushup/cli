# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# [0.3.0](https://github.com/code-pushup/cli/compare/utils@0.2.0...utils@0.3.0) (2023-11-30)

### Features

- **utils:** add file-system helper ([#336](https://github.com/code-pushup/cli/issues/336)) ([001498b](https://github.com/code-pushup/cli/commit/001498b1f54460f77f46eaaa9033e4b04629c878))

# [0.2.0](https://github.com/code-pushup/cli/compare/utils@0.1.0...utils@0.2.0) (2023-11-30)

### Features

- **plugin-eslint:** add support for inline eslint config ([67571eb](https://github.com/code-pushup/cli/commit/67571eb529ade91a77e2c739a3995674e52701af))

# 0.1.0 (2023-11-29)

### Bug Fixes

- **cli:** replace clui on @isaacs/cliui ([#282](https://github.com/code-pushup/cli/issues/282)) ([465f230](https://github.com/code-pushup/cli/commit/465f230133de3742d4f6d4bdeaf64d7db44e767f)), closes [#209](https://github.com/code-pushup/cli/issues/209)
- **plugin-eslint:** pluralize audit display value based on count ([aa35d0c](https://github.com/code-pushup/cli/commit/aa35d0cc00e505f71ccdaa6612f498d95a88c4ea))
- refactor after core package intro ([#83](https://github.com/code-pushup/cli/issues/83)) ([aa39d09](https://github.com/code-pushup/cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))
- **testing:** fix tests for Windows ([#165](https://github.com/code-pushup/cli/issues/165)) ([b80255b](https://github.com/code-pushup/cli/commit/b80255b5ed93c9cb6312d8c426a82f4b8bd1cdf3)), closes [#131](https://github.com/code-pushup/cli/issues/131)
- **utils,cli:** remove all mentions of the `interactive` option ([#245](https://github.com/code-pushup/cli/issues/245)) ([be7471e](https://github.com/code-pushup/cli/commit/be7471ee8aadf6a6a6c1af2e3ceb35e48a372759)), closes [#120](https://github.com/code-pushup/cli/issues/120)
- **utils:** handle descriptions ending in code block in report.md ([a9a05ad](https://github.com/code-pushup/cli/commit/a9a05ade4d57a24b364cf6e10ba08d35f89e9a95))

### Features

- add transform to persist config ([#229](https://github.com/code-pushup/cli/issues/229)) ([ce4d975](https://github.com/code-pushup/cli/commit/ce4d975feafeea1249faf58a3acbbfc1483d8c90))
- **cli:** add `--persist.filename` cli option ([#187](https://github.com/code-pushup/cli/issues/187)) ([296df7d](https://github.com/code-pushup/cli/commit/296df7df42afcb656f33a657b7d1820a75208824))
- **cli:** initial collect command ([#45](https://github.com/code-pushup/cli/issues/45)) ([ba048be](https://github.com/code-pushup/cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/code-pushup/cli/issues/47)) ([6241fd7](https://github.com/code-pushup/cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/code-pushup/cli/issues/42)) ([37ea0a5](https://github.com/code-pushup/cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/code-pushup/cli/issues/6) [#38](https://github.com/code-pushup/cli/issues/38)
- **core:** add esm plugin logic ([#248](https://github.com/code-pushup/cli/issues/248)) ([18d4e3a](https://github.com/code-pushup/cli/commit/18d4e3af31bc10a55b01fc8201d83c6caf0548e3))
- **core:** change to execute all plugins before throwing on failed ([#275](https://github.com/code-pushup/cli/issues/275)) ([32a6ef5](https://github.com/code-pushup/cli/commit/32a6ef55444b28ef6468eb2b38facd5f1c554a80)), closes [#159](https://github.com/code-pushup/cli/issues/159)
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/code-pushup/cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** configure bin entry point ([b34ecb2](https://github.com/code-pushup/cli/commit/b34ecb224ff0182aab40811e1abdfe1f5446efcd))
- **plugin-eslint:** convert rule ids to slugs, add basic description to audits ([971c97a](https://github.com/code-pushup/cli/commit/971c97a49b583f61b9e6eb8500c4712687f5797a))
- **plugin-eslint:** create groups from rules' meta.type (problem/suggestion/layout) ([0350e49](https://github.com/code-pushup/cli/commit/0350e492c26015097ef94fb51eb15d7d334a5080))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/code-pushup/cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **plugin-eslint:** register audit metadata based on eslintrc and file patterns ([3aac581](https://github.com/code-pushup/cli/commit/3aac581acb5955b673641ee9df52e6a99656b07b))
- **utils:** add audits sorting for reports ([#302](https://github.com/code-pushup/cli/issues/302)) ([10ee12e](https://github.com/code-pushup/cli/commit/10ee12e8138fa0dd71b0e0acb2d717327e22007c)), closes [#210](https://github.com/code-pushup/cli/issues/210)
- **utils:** add command line args helper ([#52](https://github.com/code-pushup/cli/issues/52)) ([9d6acec](https://github.com/code-pushup/cli/commit/9d6aceccb85a4c4cc71319e4c8d14a9ff2897e8e)), closes [#43](https://github.com/code-pushup/cli/issues/43)
- **utils:** add file size logging ([#65](https://github.com/code-pushup/cli/issues/65)) ([c46046f](https://github.com/code-pushup/cli/commit/c46046f9756ea2d02e1d9bb7cc0bbfeff09e61a3)), closes [#59](https://github.com/code-pushup/cli/issues/59)
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
