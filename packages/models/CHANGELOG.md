# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# 0.1.0 (2023-11-29)

### Bug Fixes

- **core:** audit metadata looked up in plugin config, not expected in output ([31ffd5e](https://github.com/code-pushup/cli/commit/31ffd5e39cab3d5ddb997c92b7efafdc920c8359))
- **models:** allow empty string as docsUrl ([1c34d92](https://github.com/code-pushup/cli/commit/1c34d923b06eec7f19bd97d93fdd109a4a40da1c))
- **models:** increase character limit for issue message ([e6f6fc8](https://github.com/code-pushup/cli/commit/e6f6fc83ad6d4419339c64e4924abd23f7d1b3d4))
- refactor after core package intro ([#83](https://github.com/code-pushup/cli/issues/83)) ([aa39d09](https://github.com/code-pushup/cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))
- **testing:** fix tests for Windows ([#165](https://github.com/code-pushup/cli/issues/165)) ([b80255b](https://github.com/code-pushup/cli/commit/b80255b5ed93c9cb6312d8c426a82f4b8bd1cdf3)), closes [#131](https://github.com/code-pushup/cli/issues/131)

### Features

- add transform to persist config ([#229](https://github.com/code-pushup/cli/issues/229)) ([ce4d975](https://github.com/code-pushup/cli/commit/ce4d975feafeea1249faf58a3acbbfc1483d8c90))
- **cli:** add `--persist.filename` cli option ([#187](https://github.com/code-pushup/cli/issues/187)) ([296df7d](https://github.com/code-pushup/cli/commit/296df7df42afcb656f33a657b7d1820a75208824))
- **cli:** initial collect command ([#45](https://github.com/code-pushup/cli/issues/45)) ([ba048be](https://github.com/code-pushup/cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** persist login and formatting options ([#47](https://github.com/code-pushup/cli/issues/47)) ([6241fd7](https://github.com/code-pushup/cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/code-pushup/cli/issues/42)) ([37ea0a5](https://github.com/code-pushup/cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/code-pushup/cli/issues/6) [#38](https://github.com/code-pushup/cli/issues/38)
- **core:** add esm plugin logic ([#248](https://github.com/code-pushup/cli/issues/248)) ([18d4e3a](https://github.com/code-pushup/cli/commit/18d4e3af31bc10a55b01fc8201d83c6caf0548e3))
- **models:** add isBinary field to category schema ([8b13039](https://github.com/code-pushup/cli/commit/8b130390059a9986fd06f9c9fc2415ad7963da5b))
- **models:** add report filename option ([#174](https://github.com/code-pushup/cli/issues/174)) ([bdeab54](https://github.com/code-pushup/cli/commit/bdeab543c305d7c100762b0e490b292468eac172))
- **models:** setup types and parser with zod ([7d5c99e](https://github.com/code-pushup/cli/commit/7d5c99e47d026167914a265941c710eed5fd84a2))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/code-pushup/cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- **plugin-eslint:** implement runner logic ([0ad5445](https://github.com/code-pushup/cli/commit/0ad5445e427fd365e6e039d3aa13a3a5e7c1d47e))
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/code-pushup/cli/issues/39)) ([dacaaf7](https://github.com/code-pushup/cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/code-pushup/cli/issues/32)
- **utils:** add scoring logic ([#133](https://github.com/code-pushup/cli/issues/133)) ([89fecbb](https://github.com/code-pushup/cli/commit/89fecbba34d78b526b065de13fdb27e522bb4c3f))
- **utils:** add upload logic ([#66](https://github.com/code-pushup/cli/issues/66)) ([3e88ffc](https://github.com/code-pushup/cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/code-pushup/cli/issues/21) [#57](https://github.com/code-pushup/cli/issues/57) [#85](https://github.com/code-pushup/cli/issues/85)
- **utils:** implement report.md formatting ([#196](https://github.com/code-pushup/cli/issues/196)) ([346596d](https://github.com/code-pushup/cli/commit/346596dc44c7970e3a960222961ba61d0b2b646d)), closes [#148](https://github.com/code-pushup/cli/issues/148)
