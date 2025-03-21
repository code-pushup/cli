# 📚 Audits and Groups

The TypeScript plugin analyzes your codebase using the TypeScript compiler to identify potential issues and enforce best practices.

---

## 🛡️ Audits Overview

The plugin manages issues through structured audits and groups. Each audit targets a specific type of error, ensuring comprehensive analysis.

| **Audit**                                   | **Slug**                                  |
| ------------------------------------------- | ----------------------------------------- |
| **Semantic Errors**                         | `semantic-errors`                         |
| **Syntax Errors**                           | `syntax-errors`                           |
| **Configuration Errors**                    | `configuration-errors`                    |
| **Declaration and Language Service Errors** | `declaration-and-language-service-errors` |
| **Internal Errors**                         | `internal-errors`                         |
| **No Implicit Any Errors**                  | `no-implicit-any-errors`                  |
| **Unknown Codes**                           | `unknown-codes`                           |

---

### Semantic Errors - `semantic-errors`

Errors that occur during type checking and type inference.

- **Slug:** `semantic-errors`
- **Title:** Semantic Errors
- **Description:** Errors that occur during type checking and type inference.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                                                                              | Source file                                                               | Line(s) |
| :--------: | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :-----: |
| 🚨 _error_ | TS2307: Cannot find module './non-existent' or its corresponding type declarations.  | [`path/to/module-resolution.ts`](../path/to/module-resolution.ts)         |    2    |
| 🚨 _error_ | TS2349: This expression is not callable.<br /> Type 'Number' has no call signatures. | [`path/to/strict-function-types.ts`](../path/to/strict-function-types.ts) |    3    |
| 🚨 _error_ | TS2304: Cannot find name 'NonExistentType'.                                          | [`path/to/cannot-find-module.ts`](../path/to/cannot-find-module.ts)       |    1    |

---

### Syntax Errors - `syntax-errors`

Errors that occur during parsing and lexing of TypeScript source code.

- **Slug:** `syntax-errors`
- **Title:** Syntax Errors
- **Description:** Errors that occur during parsing and lexing of TypeScript source code.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                               | Source file                                             | Line(s) |
| :--------: | :------------------------------------ | :------------------------------------------------------ | :-----: |
| 🚨 _error_ | TS1136: Property assignment expected. | [`path/to/syntax-error.ts`](../path/to/syntax-error.ts) |    1    |

---

### Configuration Errors - `configuration-errors`

Errors that occur when parsing TypeScript configuration files.

- **Slug:** `configuration-errors`
- **Title:** Configuration Errors
- **Description:** Errors that occur when parsing TypeScript configuration files.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                                    | Source file                                         | Line(s) |
| :--------: | :----------------------------------------- | :-------------------------------------------------- | :-----: |
| 🚨 _error_ | TS5023: Unknown compiler option 'invalid'. | [`path/to/tsconfig.json`](../path/to/tsconfig.json) |    1    |

---

### Declaration and Language Service Errors - `declaration-and-language-service-errors`

Errors that occur during TypeScript language service operations.

- **Slug:** `declaration-and-language-service-errors`
- **Title:** Declaration and Language Service Errors
- **Description:** Errors that occur during TypeScript language service operations.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                                                                                                                         | Source file                                                         | Line(s) |
| :--------: | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------ | :-----: |
| 🚨 _error_ | TS4112: This member cannot have an 'override' modifier because its containing class 'Standalone' does not extend another class. | [`path/to/incorrect-modifier.ts`](../path/to/incorrect-modifier.ts) |    2    |

---

### Internal Errors - `internal-errors`

Errors that occur during TypeScript internal operations.

- **Slug:** `internal-errors`
- **Title:** Internal Errors
- **Description:** Errors that occur during TypeScript internal operations.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                          | Source file                                                 | Line(s) |
| :--------: | :------------------------------- | :---------------------------------------------------------- | :-----: |
| 🚨 _error_ | TS9001: Internal compiler error. | [`path/to/internal-error.ts`](../path/to/internal-error.ts) |    4    |

---

### No Implicit Any Errors - `no-implicit-any-errors`

Errors related to no implicit any compiler option.

- **Slug:** `no-implicit-any-errors`
- **Title:** No Implicit Any Errors
- **Description:** Errors related to no implicit any compiler option.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                                             | Source file                                             | Line(s) |
| :--------: | :-------------------------------------------------- | :------------------------------------------------------ | :-----: |
| 🚨 _error_ | TS7006: Parameter 'x' implicitly has an 'any' type. | [`path/to/implicit-any.ts`](../path/to/implicit-any.ts) |    5    |

---

### Unknown Codes - `unknown-codes`

Errors that do not match any known TypeScript error code.

- **Slug:** `unknown-codes`
- **Title:** Unknown Codes
- **Description:** Errors that do not match any known TypeScript error code.
- **Scoring:** The score is based on the number of issues found.
- **Value:** The value is the number of issues found.
- **Display Value:** The display value is the number of issues found.

#### Issues

|  Severity  | Message                                 | Source file                                               | Line(s) |
| :--------: | :-------------------------------------- | :-------------------------------------------------------- | :-----: |
| 🚨 _error_ | TS9999: Unknown error code encountered. | [`path/to/unknown-error.ts`](../path/to/unknown-error.ts) |    6    |

---

## 📂 Groups Overview

| **Group**         | **Slug**           |
| ----------------- | ------------------ |
| **Problems**      | `problems`         |
| **Configuration** | `ts-configuration` |
| **Miscellaneous** | `miscellaneous`    |

### Problems - `problems`

- **Description:** Syntax, semantic, and internal compiler errors are critical for identifying and preventing bugs.
- **References:**
  - Syntax Errors (`syntax-errors`)
  - Semantic Errors (`semantic-errors`)
  - No Implicit Any Errors (`no-implicit-any-errors`)

### Configuration - `ts-configuration`

- **Description:** Ensures correct TypeScript project setup, minimizing risks from misconfiguration.
- **References:**
  - Configuration Errors (`configuration-errors`)

### Miscellaneous - `miscellaneous`

- **Description:** Informational errors that may not impact development directly but are helpful for deeper insights.
- **References:**
  - Unknown Codes (`unknown-codes`)
  - Internal Errors (`internal-errors`)
  - Declaration and Language Service Errors (`declaration-and-language-service-errors`)
