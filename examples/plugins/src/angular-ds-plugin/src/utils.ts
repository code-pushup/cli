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

export const cssVariablesRegex = /(--(?!semantic)[\w-]+)/gm;
export const angularComponentRegex = /@Component\s*\(\s*\{/m;
export const angularComponentSelectorRegex =
  /(selector)(\s*:\s*['"])([^'"]+)(['"])/m;
export const angularComponentStyleUrlsRegex =
  /styleUrls\s*:\s*\[['"]([^'"]+)['"]\]/m;
export const angularComponentInlineStylesRegex =
  /styles:\s*\[\s*`([^`]+)`\s*\]/m;

export async function loadComponentStyles(
  componentContent: string,
): Promise<string> {
  // @TODO support multiple external style sheets
  const externalStylePaths =
    componentContent.match(angularComponentStyleUrlsRegex)?.[1] || false;
  if (externalStylePaths) {
    return readTextFile(externalStylePaths);
  }
  const inlineStyles =
    componentContent.match(angularComponentInlineStylesRegex)?.[1] || false;
  if (!inlineStyles) {
    throw new Error(`inlineStyles not present in ${componentContent}`);
  }
  return inlineStyles;
}

export async function loadGeneratedStylesFromImports(
  stylesContent: string,
  importPattern: string,
  root = process.cwd(),
): Promise<string> {
  const scssImportStatement = stylesContent.match(
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
