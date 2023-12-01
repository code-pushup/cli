import {
  PackageJson,
  SourceResult,
} from '../src/package-json.plugin/integration/types';

export const packageJsonName = 'package.json';
export const packageJson: PackageJson = {
  dependencies: {
    lib1: '0.0.0',
  },
};

export function packageResult(json: PackageJson): SourceResult {
  return {
    file: packageJsonName,
    json,
    content: JSON.stringify(json),
  };
}
