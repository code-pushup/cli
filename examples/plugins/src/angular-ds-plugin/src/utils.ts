import { join } from 'node:path';
import { readTextFile } from '@code-pushup/utils';

/**
 * matches every string, also multiline, that has an import statement importing form a path containing the passed string
 */
export const generatedStylesRegex = (importPath: string): RegExp => {
  // escape special characters in the importPath
  const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`@import +['"](${escapedPath})[^'"]+['"]`, 'g');
};

export async function loadGeneratedStyles(
  content: string,
  importPattern: string,
): Promise<string> {
  const scssImportStatement = content.match(
    generatedStylesRegex(importPattern),
  );
  const scssImportPath = (scssImportStatement as [string])[0]
    .replace('@import', '')
    .replace(/['"]/g, '')
    .trim();
  return readTextFile(join(scssImportPath));
}

export function getCssVariableUsage(
  variables: string,
  targetStyles: string,
): {
  all: string[];
  used: string[];
} {
  const cssVariablesRegex = /(--(?!semantic)[\w-]+)/g;
  const allMatches = Array.from(variables.match(cssVariablesRegex) || []);
  const all = Array.from(new Set<string>(allMatches));

  return {
    all,
    used: all.filter(variable => !targetStyles.includes(variable)),
  };
}
