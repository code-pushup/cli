import type {
  PackageJson,
  SourceResult,
} from '../src/package-json/src/integration/types.js';

export const packageJsonName = 'package.json';
export const packageJson: PackageJson = {
  dependencies: {
    lib1: '0.0.0',
  },
};

export function packageResult(json?: Partial<PackageJson>): SourceResult {
  const jsonData = {
    ...packageJson,
    ...json,
  };
  return {
    file: packageJsonName,
    json: jsonData,
    content: JSON.stringify(json),
  };
}
