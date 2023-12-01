# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# 0.1.0 (2023-11-29)

### Bug Fixes

- **core:** audit metadata looked up in plugin config, not expected in output ([31ffd5e](https://github.com/code-pushup/cli/commit/31ffd5e39cab3d5ddb997c92b7efafdc920c8359))
- **core:** include package.json data ([0fef0c3](https://github.com/code-pushup/cli/commit/0fef0c3b784454a2ab2d9e0fb65f132e8ee8e196))
- refactor after core package intro ([#83](https://github.com/code-pushup/cli/issues/83)) ([aa39d09](https://github.com/code-pushup/cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))
- **testing:** fix tests for Windows ([#165](https://github.com/code-pushup/cli/issues/165)) ([b80255b](https://github.com/code-pushup/cli/commit/b80255b5ed93c9cb6312d8c426a82f4b8bd1cdf3)), closes [#131](https://github.com/code-pushup/cli/issues/131)

### Features

- add transform to persist config ([#229](https://github.com/code-pushup/cli/issues/229)) ([ce4d975](https://github.com/code-pushup/cli/commit/ce4d975feafeea1249faf58a3acbbfc1483d8c90))
- **cli:** add `--persist.filename` cli option ([#187](https://github.com/code-pushup/cli/issues/187)) ([296df7d](https://github.com/code-pushup/cli/commit/296df7df42afcb656f33a657b7d1820a75208824))
- **core:** add core package ([dd8ddae](https://github.com/code-pushup/cli/commit/dd8ddaeaaf91534261f0416e15b79fe924a4a798))
- **core:** add esm plugin logic ([#248](https://github.com/code-pushup/cli/issues/248)) ([18d4e3a](https://github.com/code-pushup/cli/commit/18d4e3af31bc10a55b01fc8201d83c6caf0548e3))
- **core:** change to execute all plugins before throwing on failed ([#275](https://github.com/code-pushup/cli/issues/275)) ([32a6ef5](https://github.com/code-pushup/cli/commit/32a6ef55444b28ef6468eb2b38facd5f1c554a80)), closes [#159](https://github.com/code-pushup/cli/issues/159)
- **models:** add report filename option ([#174](https://github.com/code-pushup/cli/issues/174)) ([bdeab54](https://github.com/code-pushup/cli/commit/bdeab543c305d7c100762b0e490b292468eac172))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/code-pushup/cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **utils:** add scoring logic ([#133](https://github.com/code-pushup/cli/issues/133)) ([89fecbb](https://github.com/code-pushup/cli/commit/89fecbba34d78b526b065de13fdb27e522bb4c3f))
- **utils:** add upload logic ([#66](https://github.com/code-pushup/cli/issues/66)) ([3e88ffc](https://github.com/code-pushup/cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/code-pushup/cli/issues/21) [#57](https://github.com/code-pushup/cli/issues/57) [#85](https://github.com/code-pushup/cli/issues/85)
- **utils:** implement a new design for stdout ([#206](https://github.com/code-pushup/cli/issues/206)) ([84b8c28](https://github.com/code-pushup/cli/commit/84b8c281dd0f2cfdacfc25f9f7b658a81828fde0)), closes [#190](https://github.com/code-pushup/cli/issues/190)
- **utils:** implement report.md formatting ([#196](https://github.com/code-pushup/cli/issues/196)) ([346596d](https://github.com/code-pushup/cli/commit/346596dc44c7970e3a960222961ba61d0b2b646d)), closes [#148](https://github.com/code-pushup/cli/issues/148)
- **utils:** implement verbose helper logic ([#121](https://github.com/code-pushup/cli/issues/121)) ([112ebe7](https://github.com/code-pushup/cli/commit/112ebe7d1cce68872398967ffaea84c6906bafed))
- **utils:** move parts from utils into core ([#81](https://github.com/code-pushup/cli/issues/81)) ([dd0a180](https://github.com/code-pushup/cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/code-pushup/cli/issues/78)
- **utils:** update git latest commit functionality ([#205](https://github.com/code-pushup/cli/issues/205)) ([7ec4582](https://github.com/code-pushup/cli/commit/7ec45829a34127410e972a207e37ee03bc33d09a)), closes [#192](https://github.com/code-pushup/cli/issues/192)

### Performance Improvements

- **utils:** improve the performance of scoring and reporting ([#212](https://github.com/code-pushup/cli/issues/212)) ([41d7c0b](https://github.com/code-pushup/cli/commit/41d7c0b442b7f73dbb0408fc704af27e4827855e)), closes [#132](https://github.com/code-pushup/cli/issues/132)
