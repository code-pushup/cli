#!/usr/bin/env node
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, '..', 'package.json');
const distPackageJsonPath = join(__dirname, '..', 'dist', 'package.json');
const readmePath = join(__dirname, '..', 'README.md');
const distReadmePath = join(__dirname, '..', 'dist', 'README.md');

// Read the main package.json
const mainPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Create a simplified package.json for the dist folder
const distPackageJson = {
  name: mainPackageJson.name,
  version: mainPackageJson.version,
  license: mainPackageJson.license,
  description: mainPackageJson.description,
  homepage: mainPackageJson.homepage,
  bugs: mainPackageJson.bugs,
  repository: mainPackageJson.repository,
  keywords: mainPackageJson.keywords,
  publishConfig: mainPackageJson.publishConfig,
  type: mainPackageJson.type,
  main: './index.cjs',
  module: './index.js',
  types: './index.d.ts',
  exports: {
    '.': {
      types: './index.d.ts',
      import: './index.js',
      require: './index.cjs',
    },
    './audit': {
      types: './audit.d.ts',
      import: './audit.js',
      require: './audit.cjs',
    },
    './audit-output': {
      types: './audit-output.d.ts',
      import: './audit-output.js',
      require: './audit-output.cjs',
    },
    './cache-config': {
      types: './cache-config.d.ts',
      import: './cache-config.js',
      require: './cache-config.cjs',
    },
    './category-config': {
      types: './category-config.d.ts',
      import: './category-config.js',
      require: './category-config.cjs',
    },
    './commit': {
      types: './commit.d.ts',
      import: './commit.js',
      require: './commit.cjs',
    },
    './configuration': {
      types: './configuration.d.ts',
      import: './configuration.js',
      require: './configuration.cjs',
    },
    './core-config': {
      types: './core-config.d.ts',
      import: './core-config.js',
      require: './core-config.cjs',
    },
    './group': {
      types: './group.d.ts',
      import: './group.js',
      require: './group.cjs',
    },
    './issue': {
      types: './issue.d.ts',
      import: './issue.js',
      require: './issue.cjs',
    },
    './persist-config': {
      types: './persist-config.d.ts',
      import: './persist-config.js',
      require: './persist-config.cjs',
    },
    './plugin-config': {
      types: './plugin-config.d.ts',
      import: './plugin-config.js',
      require: './plugin-config.cjs',
    },
    './report': {
      types: './report.d.ts',
      import: './report.js',
      require: './report.cjs',
    },
    './reports-diff': {
      types: './reports-diff.d.ts',
      import: './reports-diff.js',
      require: './reports-diff.cjs',
    },
    './runner-config': {
      types: './runner-config.d.ts',
      import: './runner-config.js',
      require: './runner-config.cjs',
    },
    './source': {
      types: './source.d.ts',
      import: './source.js',
      require: './source.cjs',
    },
    './table': {
      types: './table.d.ts',
      import: './table.js',
      require: './table.cjs',
    },
    './tree': {
      types: './tree.d.ts',
      import: './tree.js',
      require: './tree.cjs',
    },
    './upload-config': {
      types: './upload-config.d.ts',
      import: './upload-config.js',
      require: './upload-config.cjs',
    },
  },
  sideEffects: false,
  dependencies: mainPackageJson.dependencies,
};

// Write the dist package.json
writeFileSync(
  distPackageJsonPath,
  JSON.stringify(distPackageJson, null, 2) + '\n',
);

// Copy README.md to dist
copyFileSync(readmePath, distReadmePath);

console.log('✅ Generated dist/package.json successfully');
console.log('✅ Copied README.md to dist/ successfully');
