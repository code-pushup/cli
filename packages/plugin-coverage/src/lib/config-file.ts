import { generateCode, parseModule } from 'magicast';
import { deepMergeObject, getDefaultExportOptions } from 'magicast/helpers';

const VITEST_DEFAULTS = ['text', 'html', 'clover', 'json'];

export function hasLcovReporter(content: string, framework: string): boolean {
  switch (framework) {
    case 'vitest':
      return /['"]lcov['"]/.test(content) && content.includes('reporter');
    case 'jest':
      return (
        !content.includes('coverageReporters') || /['"]lcov['"]/.test(content)
      );
    default:
      return false;
  }
}

export function addLcovReporter(content: string, framework: string): string {
  switch (framework) {
    case 'vitest':
      return addLcovToVitest(content);
    case 'jest':
      return addLcovToJest(content);
    default:
      return content;
  }
}

function addLcovToVitest(content: string): string {
  try {
    const mod = parseModule(content);
    const config = getDefaultExportOptions(mod);
    const reporter = config['test']?.['coverage']?.['reporter'];
    const base = reporter?.['length'] ? [...reporter] : VITEST_DEFAULTS;
    deepMergeObject(
      config,
      buildNestedObject(['test', 'coverage', 'reporter'], [...base, 'lcov']),
    );
    return generateCode(mod).code;
  } catch {
    return content;
  }
}

function addLcovToJest(content: string): string {
  try {
    const mod = parseModule(content);
    const config = getDefaultExportOptions(mod);
    const reporters = config['coverageReporters'];
    if (!reporters?.['length']) {
      return content;
    }
    deepMergeObject(
      config,
      buildNestedObject(['coverageReporters'], [...reporters, 'lcov']),
    );
    return generateCode(mod).code;
  } catch {
    return content;
  }
}

export function buildNestedObject(
  segments: string[],
  value: unknown,
): Record<string, unknown> {
  return segments.reduceRight<Record<string, unknown>>(
    (nested, segment) => ({ [segment]: nested }),
    value as Record<string, unknown>,
  );
}
