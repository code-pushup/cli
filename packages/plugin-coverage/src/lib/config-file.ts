import { generateCode, parseModule } from 'magicast';
import { deepMergeObject } from 'magicast/helpers';

type ProxyObject = Record<string, unknown> & {
  toJSON?: () => unknown;
};

const REPORTER_CONFIGS: Record<string, { path: string[]; key: string }> = {
  vitest: { path: ['test', 'coverage'], key: 'reporter' },
  jest: { path: [], key: 'coverageReporters' },
};

export function hasLcovReporter(content: string, framework: string): boolean {
  const reporterConfig = REPORTER_CONFIGS[framework];
  if (!reporterConfig) {
    return false;
  }
  return /['"]lcov['"]/.test(content) && content.includes(reporterConfig.key);
}

export function addLcovReporter(content: string, framework: string): string {
  const reporterConfig = REPORTER_CONFIGS[framework];
  if (!reporterConfig) {
    return content;
  }
  try {
    const mod = parseModule(content);
    const exported = mod.exports['default'];
    const configObject =
      exported.$type === 'function-call' ? exported.$args[0] : exported;
    const currentReporters = readReporters(configObject, reporterConfig);
    const updatedReporters = [...currentReporters, 'lcov'];

    deepMergeObject(
      configObject,
      buildNestedObject(
        [...reporterConfig.path, reporterConfig.key],
        updatedReporters,
      ),
    );

    return generateCode(mod).code;
  } catch {
    return content;
  }
}

function isProxyObject(value: unknown): value is ProxyObject {
  return typeof value === 'object' && value != null;
}

function readReporters(
  configObject: ProxyObject,
  { path, key }: { path: string[]; key: string },
): string[] {
  const container = path.reduce<ProxyObject>((parent, segment) => {
    const nested = parent[segment];
    return isProxyObject(nested) ? nested : {};
  }, configObject);
  const reporterProxy = container[key];
  const resolved =
    isProxyObject(reporterProxy) && typeof reporterProxy.toJSON === 'function'
      ? reporterProxy.toJSON()
      : reporterProxy;
  return Array.isArray(resolved) ? resolved : [];
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
