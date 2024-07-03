# Code PushUp CLI

**Just Follow the Score <✓>**

[![version](https://img.shields.io/github/package-json/v/code-pushup/cli)](https://www.npmjs.com/package/%40code-pushup%2Fcli)
[![release date](https://img.shields.io/github/release-date/code-pushup/cli)](https://github.com/code-pushup/cli/releases)
[![license](https://img.shields.io/github/license/code-pushup/cli)](https://opensource.org/licenses/MIT)
[![commit activity](https://img.shields.io/github/commit-activity/m/code-pushup/cli)](https://github.com/code-pushup/cli/pulse/monthly)
[![CI](https://github.com/code-pushup/cli/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/code-pushup/cli/actions/workflows/ci.yml?query=branch%3Amain)
[![Codecov](https://codecov.io/gh/code-pushup/cli/branch/main/graph/badge.svg?token=Y7V489JZ4A)](https://codecov.io/gh/code-pushup/cli)

---

### 🔌 Code quality tools are like phone chargers. Everyone has a different plug.

_Common problems with keeping track of technical quality:_

- **When tech debt is invisible**, it's difficult to plan much-needed maintenance efforts 🔧
- **Individual tools** measure different metrics, **inability to combine** them leads to  
  a lack of comprehensive overview 🧑‍🦯
- Open-source tools typically used for failing checks in CI, which **can't measure incremental improvements** due to arbitrary pass/fail thresholds 🤖
- Off-the-shelf solutions tend to be opinionated and **hard to customize**, so may not fit your specific needs 🧱

_We want to change that!_

---

## 🔎🔬 Code quality integrations for any tool 📉🔍

| [🚀 Get started](./packages/cli/README.md#getting-started)️                                                                                                                                                                                   | [🤖 CI automation](https://github.com/marketplace/actions/code-pushup)                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a href="./packages/cli/README.md#getting-started"><img alt="Getting started cover image" title="Getting started with code-pushup" src="packages/cli/docs/images/getting-started-cover.png" max-height="200" width="auto"></a> | <a href="./packages/cli/README.md#-ci-automation"><img alt="CI Automation cover" title="CI automation guide" src="docs/images/gh-action.png" max-height="200" width="auto"></a>                                         |
| <ul><li>Run **[📦 `@code-pushup/cli`](./packages/cli#readme)** to collect **reports**.</li><li>[Get started](./packages/cli/README.md#getting-started) quickly with our [**official plugins**](#-officially-supported-plugins)! ⏱️</li></ul> | <ul><li>Easy **CI** setup with **[🤖 `code-pushup/github-action`](https://github.com/marketplace/actions/code-pushup)**.</li><li>Import logic from **[📦 `@code-pushup/core`](./packages/core#readme)** to craft **custom tools**.</li></ul> |

| 📈 [Portal](https://code-pushup.dev#portal)️                                                                                                                                                                                      | 🔌 [Custom plugins](./packages/cli/docs/custom-plugins.md)                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a href="#portal-integration"><img alt="Portal integration cover image" title="Inetegrate code-pushup portal" src="packages/cli/docs/images/portal-cover.png" max-height="200" width="auto"></a>                                  | <a href="#custom-plugins"><img alt="Custom plugins" title="Create custom code-pushup plugins" src="docs/images/code-pushup-custom-plugins.png" max-height="200" width="auto"></a>                                    |
| <ul><li>**[Portal](https://code-pushup.dev#portal)** 🌐 **visualizes reports** in a slick UI.</li><li>Track **historical data** from uploads. ⬆️</li></ul>                                       | <ul><li>All the [data models](./packages/models/docs/models-reference.md) you need are provided in **[📦 `@code-pushup/models`](./packages/models/README.md)**.</li><li>Find tons of useful utilities in **[📦 `@code-pushup/utils`](./packages/utils/README.md)**.</li></ul> |

---

### 🔌 Officially Supported Plugins

|                                                                |                                                     |                                                        |
| -------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| <img width="50" src="docs/images/plugin-eslint.icon.png">      | [Eslint](./packages/plugin-eslint#readme)           | Static analysis using **ESLint** rules                 |
| <img width="50" src="docs/images/plugin-coverage.icon.png">    | [Coverage](./packages/plugin-coverage#readme)       | **Test Coverage** analysis                             |
| <img width="50" src="docs/images/plugin-js-packages.icon.png"> | [JS Packages](./packages/plugin-js-packages#readme) | Package audit on **Security** and **Outdates**         |
| <img width="50" src="docs/images/plugin-lighthouse.icon.png">  | [Lighthouse](./packages/plugin-lighthouse#readme)   | Web performance and best practices from **Lighthouse** |

---

## 📝 How It Works!

1. **[Configure](./packages/cli/README.md#getting-started)**  
   Pick from a set of supported packages or include your own ideas. 🧩

2. **[Integrate](https://github.com/marketplace/actions/code-pushup)**  
   Use our integration guide and packages to set up CI integration in minutes. ⏱️

3. **[Observe](https://code-pushup.dev#portal)**  
   Guard regressions and track improvements with every code change. 🔍

4. **Relax!**  
   Watch improvements, share reports 📈

---

<table>
<tr>
<td>
<img alt="Code-Pushup Logo" src="./packages/cli/docs/images/code-pushup-logo.png" width="130px"> 
</td>
<td>
<h2>Just follow the score</h2>
<h3>See regressions - Report scores - On every PR</h3>
<!-- link when web landing is ready <a href="./packages/cli/README.md#getting-started">Try our paid features</a> -->
</td>
</tr>
</table>

## 💖 Want to support us?

- Read how to contribute to the codebase. See: [CONTRIBUTING.md](./CONTRIBUTING.md) 🤝
<!-- link when sponsorships are ready [Sponsor](./CONTRIBUTING.md) -->
