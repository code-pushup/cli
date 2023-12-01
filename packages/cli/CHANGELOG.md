# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

# 0.1.0 (2023-11-29)

### Bug Fixes

- **cli:** changed persist format options to array ([#153](https://github.com/code-pushup/cli/issues/153)) ([26c6a85](https://github.com/code-pushup/cli/commit/26c6a859608447d486c5e180788077f1e7955392)), closes [#95](https://github.com/code-pushup/cli/issues/95)
- **cli:** exclude nested kebab-case keys, update tests ([741d5a5](https://github.com/code-pushup/cli/commit/741d5a545a0333ea4dc747c9ab8255fc233bab56))
- **cli:** parse multiple config args to last item of array ([#164](https://github.com/code-pushup/cli/issues/164)) ([7c81f81](https://github.com/code-pushup/cli/commit/7c81f8113999e2bb68739cc9a6ee008e9db62bfb)), closes [#146](https://github.com/code-pushup/cli/issues/146)
- **cli:** run `npm install` before tests ([6507c2e](https://github.com/code-pushup/cli/commit/6507c2e9c2e4105144c03ef74cdfbe1e999355a7))
- lint config and errors ([6f5f677](https://github.com/code-pushup/cli/commit/6f5f6779a37359fdde2740fa42e44e7320fa190c))
- refactor after core package intro ([#83](https://github.com/code-pushup/cli/issues/83)) ([aa39d09](https://github.com/code-pushup/cli/commit/aa39d098c53f7de958509ad465c18b6bee5ec4b9))
- **testing:** fix tests for Windows ([#165](https://github.com/code-pushup/cli/issues/165)) ([b80255b](https://github.com/code-pushup/cli/commit/b80255b5ed93c9cb6312d8c426a82f4b8bd1cdf3)), closes [#131](https://github.com/code-pushup/cli/issues/131)
- **utils,cli:** remove all mentions of the `interactive` option ([#245](https://github.com/code-pushup/cli/issues/245)) ([be7471e](https://github.com/code-pushup/cli/commit/be7471ee8aadf6a6a6c1af2e3ceb35e48a372759)), closes [#120](https://github.com/code-pushup/cli/issues/120)

### Features

- **cli:** add `--persist.filename` cli option ([#187](https://github.com/code-pushup/cli/issues/187)) ([296df7d](https://github.com/code-pushup/cli/commit/296df7df42afcb656f33a657b7d1820a75208824))
- **cli:** disabled version option ([#162](https://github.com/code-pushup/cli/issues/162)) ([9a5371c](https://github.com/code-pushup/cli/commit/9a5371cdef6f1148d0230aaa866b4e9d3e0bdba0)), closes [#124](https://github.com/code-pushup/cli/issues/124)
- **cli:** initial collect command ([#45](https://github.com/code-pushup/cli/issues/45)) ([ba048be](https://github.com/code-pushup/cli/commit/ba048be5f3e9b4291ae6311051cda89403186795))
- **cli:** introduce the `onlyPlugins` option ([#246](https://github.com/code-pushup/cli/issues/246)) ([13c9d26](https://github.com/code-pushup/cli/commit/13c9d26c24f3dd8bc97f62298231487d01b0ffa5)), closes [#119](https://github.com/code-pushup/cli/issues/119)
- **cli:** persist login and formatting options ([#47](https://github.com/code-pushup/cli/issues/47)) ([6241fd7](https://github.com/code-pushup/cli/commit/6241fd7412f33a8d40183b40f8ed7e39e85278dd))
- **cli:** setup yargs for cli ([#42](https://github.com/code-pushup/cli/issues/42)) ([37ea0a5](https://github.com/code-pushup/cli/commit/37ea0a56c987ef38cf7e961d885c711b32de777a)), closes [#6](https://github.com/code-pushup/cli/issues/6) [#38](https://github.com/code-pushup/cli/issues/38)
- **cli:** use bundle-require instead of jiti (no hackfix, but also no CJS configs) ([028c592](https://github.com/code-pushup/cli/commit/028c592817b8440e0af5ce1f72e8fffde2f11314))
- configure build and tests to handle ESM and CJS configs ([48cd967](https://github.com/code-pushup/cli/commit/48cd967866a84488e6a2382fe44687a31ca47db2))
- **core:** add esm plugin logic ([#248](https://github.com/code-pushup/cli/issues/248)) ([18d4e3a](https://github.com/code-pushup/cli/commit/18d4e3af31bc10a55b01fc8201d83c6caf0548e3))
- **models:** validate plugin icons using portal-client package ([f52cc75](https://github.com/code-pushup/cli/commit/f52cc75ed766e47e1d9f82fda1560e0085b3c02e))
- support TS config files using Jiti + hackfix lighthouse import.meta usages ([3b7927d](https://github.com/code-pushup/cli/commit/3b7927d65d4607a35dc23d076e72184c281ae8f6))
- **utils:** add file size logging ([#65](https://github.com/code-pushup/cli/issues/65)) ([c46046f](https://github.com/code-pushup/cli/commit/c46046f9756ea2d02e1d9bb7cc0bbfeff09e61a3)), closes [#59](https://github.com/code-pushup/cli/issues/59)
- **utils:** add package `utils` for cli independent logic ([#39](https://github.com/code-pushup/cli/issues/39)) ([dacaaf7](https://github.com/code-pushup/cli/commit/dacaaf74fb4795a96083ca00fd3b7ca5d3928400)), closes [#32](https://github.com/code-pushup/cli/issues/32)
- **utils:** add upload logic ([#66](https://github.com/code-pushup/cli/issues/66)) ([3e88ffc](https://github.com/code-pushup/cli/commit/3e88ffcbbe375f1fe01bdfd05c088253eeeb98d9)), closes [#21](https://github.com/code-pushup/cli/issues/21) [#57](https://github.com/code-pushup/cli/issues/57) [#85](https://github.com/code-pushup/cli/issues/85)
- **utils:** move parts from utils into core ([#81](https://github.com/code-pushup/cli/issues/81)) ([dd0a180](https://github.com/code-pushup/cli/commit/dd0a1805ddb97de14d7a4938938aa0bfd852a528)), closes [#78](https://github.com/code-pushup/cli/issues/78)
