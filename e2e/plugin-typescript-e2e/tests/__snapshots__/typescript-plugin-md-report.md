# Code PushUp Report

| 🏷 Category               |  ⭐ Score  | 🛡 Audits |
| :------------------------ | :-------: | :-------: |
| [Typescript](#typescript) | 🔴 **28** |     6     |

## 🏷 Categories

### Typescript

🔴 Score: **28**

- 🔴 Configuration (_Typescript_)
  - 🟥 [Configuration-Errors](#configuration-errors-typescript) - **1**
- 🔴 Problems (_Typescript_)
  - 🟥 [Semantic-Errors](#semantic-errors-typescript) - **6**
  - 🟥 [Syntax-Errors](#syntax-errors-typescript) - **1**
  - 🟩 [Internal-Errors](#internal-errors-typescript) - **0**
- 🟡 Miscellaneous (_Typescript_)
  - 🟥 [Language-Service-Errors](#language-service-errors-typescript) - **1**
  - 🟩 [Unknown-Codes](#unknown-codes-typescript) - **0**

## 🛡️ Audits

### Semantic-Errors (Typescript)

<details>
<summary>🟥 <b>6</b> (score: 0)</summary>

#### Issues

|  Severity  | Message                                                                               | Source file                                                                                                                 | Line(s) |
| :--------: | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :-----: |
| 🚨 _error_ | TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.  | [`tmp/e2e/plugin-typescript-e2e/src/2-semantic-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/2-semantic-errors.ts) |    3    |
| 🚨 _error_ | TS2322: Type 'null' is not assignable to type 'string'.                               | [`tmp/e2e/plugin-typescript-e2e/src/2-semantic-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/2-semantic-errors.ts) |    7    |
| 🚨 _error_ | TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.  | [`tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts)     |    3    |
| 🚨 _error_ | TS2322: Type 'null' is not assignable to type 'string'.                               | [`tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts)     |    7    |
| 🚨 _error_ | TS2307: Cannot find module './non-existent' or its corresponding type declarations.   | [`tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts)     |   10    |
| 🚨 _error_ | TS2349: This expression is not callable.<br />  Type 'Number' has no call signatures. | [`tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/semantic-errors.ts)     |   14    |

</details>

Errors that occur during type checking and type inference

### Configuration-Errors (Typescript)

<details>
<summary>🟥 <b>1</b> (score: 0)</summary>

#### Issues

|  Severity  | Message                                                                                                                                                                                                   | Source file                                                                                                                           | Line(s) |
| :--------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :-----: |
| 🚨 _error_ | TS6059: File '/Users/michael_hladky/WebstormProjects/quality-metrics-cli/tmp/e2e/plugin-typescript-e2e/exclude/utils.ts' is not under 'rootDir' 'src'. 'rootDir' is expected to contain all source files. | [`tmp/e2e/plugin-typescript-e2e/src/6-configuration-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/6-configuration-errors.ts) |    1    |

</details>

Errors that occur when parsing TypeScript configuration files

### Language-Service-Errors (Typescript)

<details>
<summary>🟥 <b>1</b> (score: 0)</summary>

#### Issues

|  Severity  | Message                                                                                                                         | Source file                                                                                                                   | Line(s) |
| :--------: | :------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- | :-----: |
| 🚨 _error_ | TS4112: This member cannot have an 'override' modifier because its containing class 'Standalone' does not extend another class. | [`tmp/e2e/plugin-typescript-e2e/src/4-languale-service.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/4-languale-service.ts) |    2    |

</details>

Errors that occur during TypeScript language service operations

### Syntax-Errors (Typescript)

<details>
<summary>🟥 <b>1</b> (score: 0)</summary>

#### Issues

|  Severity  | Message                               | Source file                                                                                                             | Line(s) |
| :--------: | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- | :-----: |
| 🚨 _error_ | TS1136: Property assignment expected. | [`tmp/e2e/plugin-typescript-e2e/src/1-syntax-errors.ts`](../../../tmp/e2e/plugin-typescript-e2e/src/1-syntax-errors.ts) |    1    |

</details>

Errors that occur during parsing and lexing of TypeScript source code

### Internal-Errors (Typescript)

🟩 **0** (score: 100)

Errors that occur during TypeScript internal operations

### Unknown-Codes (Typescript)

🟩 **0** (score: 100)

Errors that do not match any known TypeScript error code

## About

Report was created by [Code PushUp](https://github.com/code-pushup/cli#readme) on Thu, Jan 2, 2025, 6:09 AM GMT+1.

| Plugin     | Audits | Version  | Duration |
| :--------- | :----: | :------: | -------: |
| Typescript |   6    | `0.57.0` |   2.00 s |

| Commit                                             | Version  | Duration | Plugins | Categories | Audits |
| :------------------------------------------------- | :------: | -------: | :-----: | :--------: | :----: |
| cleanup (b947f5e7992f047fdbfc73a4973fae30e88db30c) | `0.57.0` |   2.05 s |    1    |     1      |   6    |

---

Made with ❤ by [Code PushUp](https://github.com/code-pushup/cli#readme)
