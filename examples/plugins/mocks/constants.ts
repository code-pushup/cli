import { join } from 'path';
import { PackageJson } from '../src/package-json.plugin/types';

export const packageJson: PackageJson = {
  license: 'MIT',
  dependencies: {
    lib1: '0.0.0',
    types1: '0.0.1',
  },
  devDependencies: {
    lib2: '0.0.0',
  },
  optionalDependencies: {
    lib3: '0.0.0',
  },
};
export const packageJsonContent = JSON.stringify(packageJson, null, 2);

export const readmeMd = '# Docs';

export const packageJsonName = 'package.json';

export const multiPackageFileStructure = {
  [join('pkg-1', packageJsonName)]: packageJsonContent,
  [join('pkg-1', 'README.md')]: readmeMd,
  [join('pkg-2', packageJsonName)]: packageJsonContent,
  [join('pkg-2', 'README.md')]: readmeMd,
  [join('pkg-3', packageJsonName)]: packageJsonContent,
  [join('pkg-3', 'README.md')]: readmeMd,
};
