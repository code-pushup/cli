Issues is Array of IssueSet | IssueRecords

- For each IssueRecords
  - get filepath
  - ## For each IssueRecords[string] === IssueType

```ts
expect().toBe({
  file: 'packages/plugin-lighthouse/.eslintrc.json',
  owners: ['@BioPhoton'],
  dependencies: [],
  devDependencies: [],
  optionalPeerDependencies: [],
  unlisted: [
    {
      name: 'jsonc-eslint-parser',
    },
  ],
  binaries: [],
  unresolved: [],
  exports: [],
  types: [],
  enumMembers: {},
  duplicates: [],
});
```

**Audit Result Example**

```ts
const report = {
  files: ['src/unused.ts'],
  issues: [
    {
      file: 'package.json',
      owners: ['@org/admin'],
      dependencies: ['jquery', 'moment'],
      devDependencies: [],
      unlisted: [{ name: 'react' }, { name: '@org/unresolved' }],
      exports: [],
      types: [],
      duplicates: [],
    },
    {
      file: 'src/Registration.tsx',
      owners: ['@org/owner'],
      dependencies: [],
      devDependencies: [],
      binaries: [],
      unresolved: [{ name: './unresolved', line: 8, col: 23, pos: 403 }],
      exports: [{ name: 'unusedExport', line: 1, col: 14, pos: 13 }],
      types: [
        { name: 'unusedEnum', line: 3, col: 13, pos: 71 },
        { name: 'unusedType', line: 8, col: 14, pos: 145 },
      ],
      enumMembers: {
        MyEnum: [
          { name: 'unusedMember', line: 13, col: 3, pos: 167 },
          { name: 'unusedKey', line: 15, col: 3, pos: 205 },
        ],
      },
      classMembers: {
        MyClass: [
          { name: 'unusedMember', line: 40, col: 3, pos: 687 },
          { name: 'unusedSetter', line: 61, col: 14, pos: 1071 },
        ],
      },
      duplicates: ['Registration', 'default'],
    },
  ],
};
```

# Unused files

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues

# Unused devDependencies

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues

# Unlisted dependencies

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues

# Unused exports

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues

# Unused exported types

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues

# Duplicate exports

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues

# Configuration issues, Duplicate exports, Unused exported types, Unused exports, Unlisted dependencies, Unused devDependencies, Unused files

🕵️ **An audit to check .** ?

---

The audit evaluates ?

You can configure the plugin with the following options:

- `??`

## Details

The audit provides details in cases a file result is given.

### Issues
