import { join } from 'node:path';
import { readTextFile } from '@code-pushup/utils';

/**
 * matches every string, also multiline, that has an import statement importing form a path containing the passed string
 */
export const generatedStylesRegex = (importPath: string): RegExp => {
  // escape special characters in the importPath
  const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`@import +['"](?:.)*(${escapedPath})[^'"]+['"]`, 'g');
};

export const cssVariablesRegex = /(--(?!semantic)[\w-]+)/g;
export const angularComponentSelectorRegex =
  /@Component\s*\(\s*\{\s*(?:.)*selector\s*:\s*['"]([^'"]+)['"]/g;
export const angularComponentStylesRegex =
  /@Component\s*\(\s*\{\s*(?:.)*styles\s*:\s*['"]([^'"]+)['"]/g;

export async function loadGeneratedStyles(
  content: string,
  importPattern: string,
  root = process.cwd(),
): Promise<string> {
  const scssImportStatement = content.match(
    generatedStylesRegex(importPattern),
  );
  const scssImportPath = (scssImportStatement as [string])[0]
    .replace('@import', '')
    .replace(/['"]/g, '')
    .trim();
  return readTextFile(join(root, scssImportPath));
}

export function getCssVariableUsage(
  variables: string,
  targetStyles: string,
): {
  all: string[];
  used: string[];
  unused: string[];
} {
  const all = [...new Set(variables.match(cssVariablesRegex))];
  let used: string[] = [];
  let unused: string[] = [];
  for (const variable of all) {
    if (targetStyles.includes(variable)) {
      used = [...used, variable];
    } else {
      unused = [...unused, variable];
    }
  }
  return { all, used, unused };
}
