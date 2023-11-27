import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Issue } from '@code-pushup/models';
import { pluralize, readJsonFile } from '../../../../dist/packages/utils';
import { DependencyTypes, RequiredDependencies } from './dependencies.audit';

export async function crawlFileSystem<T>(options: {
  directory: string;
  pattern?: string | RegExp;
  fileTransform?: (filePath: string) => Promise<T> | T;
}): Promise<T[]> {
  const {
    directory,
    pattern,
    fileTransform = (filePath: string) => filePath as unknown as T,
  } = options;

  const files = await readdir(directory);
  const promises = files.map(async (file): Promise<T | T[]> => {
    const filePath = join(directory, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      return crawlFileSystem({ directory: filePath, pattern, fileTransform });
    } else if (stats.isFile() && (!pattern || new RegExp(pattern).test(file))) {
      return fileTransform(filePath);
    } else {
      return [];
    }
  });

  const resultsNestedArray = await Promise.all(promises);
  return resultsNestedArray.flat() as T[];
}

export function findLineNumberInText(
  content: string,
  pattern: string,
): number | null {
  const lines = content.split(/\r?\n/); // Split lines, handle both Windows and UNIX line endings

  const lineNumber = lines.findIndex(line => line.includes(pattern)) + 1; // +1 because line numbers are 1-based
  return lineNumber === 0 ? null : lineNumber; // If the package isn't found, return null
}

export function displayValueNumPackages(numPackages: number): string {
  return `${numPackages} ${
    numPackages === 1 ? 'package' : pluralize('package')
  }`;
}

export function scoreErrorIssues(issues: Issue[]): number {
  const issuesCount = issues.length;
  let errorCount = issues.filter(({ severity }) => severity === 'error').length;
  if (issuesCount < errorCount) {
    throw new Error(
      `issues: ${issuesCount} cannot be less than errors ${errorCount}`,
    );
  }
  errorCount = Math.max(errorCount, 0);
  return errorCount > 0
    ? Math.abs((issuesCount - errorCount) / issuesCount)
    : 1;
}

export async function depsFromTarget(
  filePath: string,
  deps: RequiredDependencies,
): Promise<RequiredDependencies> {
  const { dependencies, devDependencies, optionalDependencies } =
    await readJsonFile<Record<DependencyTypes, Record<string, string>>>(
      filePath,
    );

  const newDeps: Record<DependencyTypes, Record<string, string>> = {} as Record<
    DependencyTypes,
    Record<string, string>
  >;
  // iterate over each deps and create new object with only the deps that are in the target
  Object.entries(deps).forEach(([depType, depMap]) => {
    const newDepMap = {} as Record<string, string>;
    Object.entries(depMap).forEach(([depName, depVersion]) => {
      if (depName in dependencies) {
        newDepMap[depName] = depVersion;
      }
    });
    newDeps[depType as DependencyTypes] = newDepMap;
  });

  return { dependencies, devDependencies, optionalDependencies };
}
