# `package.json` plugin

A plugin to parse the `package.json` file of a project and validate the contents.

## Motivation

This example shows a bigger file base including utils, shared types and multiple audits.

## Audits

### Dependencies Audit

This audit checks the dependencies of the project and validates that the dependencies are up to date.

```typescript
// code-pushup.config.ts
export default {
  // ...
  plugins: [
    await packageJsonPlugin({
      directory: join(process.cwd(), './dist/packages'),
      requiredDependencies: {
        dependencies: {
          '@code-pushup/models': '^0.0.1',
        },
      },
    }),
  ],
};
```

### License Audit

This audit checks the license of the project and validates that the license is correct.

```typescript
// code-pushup.config.ts
export default {
  // ...
  plugins: [
    await packageJsonPlugin({
      directory: join(process.cwd(), './dist/packages'),
      license: 'MIT',
    }),
  ],
};
```
