import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { PackageJson } from 'type-fest';
import { fileExists, readJsonFile } from '../file-system.js';
import { hasDependency } from '../workspace-packages.js';
import {
  DEV_SERVER_PORTS,
  type DevServerTool,
  toDevServerUrl,
} from './default-ports.js';
import { parsePortFromConfigFile } from './parse-config-port.js';
import { detectPortFromScript } from './parse-port-from-script.js';
import type { DevServerDetectionResult, DevServerDetector } from './types.js';

const CONFIG_EXT = '(?:[mc]?[tj]s|mts)';

const CONFIG_FILE_DETECTORS = [
  {
    pattern: new RegExp(`^vite\\.config\\.${CONFIG_EXT}$`),
    defaultPort: DEV_SERVER_PORTS.vite,
    sections: ['server', 'devServer'],
  },
  {
    pattern: new RegExp(`^next\\.config\\.${CONFIG_EXT}$`),
    defaultPort: DEV_SERVER_PORTS.next,
    sections: ['server', 'devServer'],
  },
  {
    pattern: new RegExp(`^nuxt\\.config\\.${CONFIG_EXT}$`),
    defaultPort: DEV_SERVER_PORTS.nuxt,
    sections: ['devServer', 'server'],
  },
  {
    pattern: new RegExp(`^webpack\\.config\\.${CONFIG_EXT}$`),
    defaultPort: DEV_SERVER_PORTS.webpack,
    sections: ['devServer'],
  },
  {
    pattern: new RegExp(`^astro\\.config\\.${CONFIG_EXT}$`),
    defaultPort: DEV_SERVER_PORTS.astro,
    sections: ['server'],
  },
] as const;

const VUE_CONFIG_FILES = ['vue.config.js', 'vue.config.cjs'] as const;

const SCRIPT_KEYS = ['dev', 'start', 'serve'] as const;

const DEPENDENCY_TOOL_MAP: { dependency: string; tool: DevServerTool }[] = [
  { dependency: 'vite', tool: 'vite' },
  { dependency: 'next', tool: 'next' },
  { dependency: 'nuxt', tool: 'nuxt' },
  { dependency: 'astro', tool: 'astro' },
  { dependency: '@angular/cli', tool: 'angular' },
  { dependency: '@remix-run/dev', tool: 'vite' },
  { dependency: 'react-scripts', tool: 'cra' },
  { dependency: '@vue/cli-service', tool: 'vueCli' },
  { dependency: 'webpack-dev-server', tool: 'webpack' },
  { dependency: 'webpack', tool: 'webpack' },
  { dependency: 'parcel', tool: 'parcel' },
];

function toDetectionResult(
  port: number,
  source: string,
): DevServerDetectionResult {
  return {
    port,
    url: toDevServerUrl(port),
    source,
  };
}

type PackageJsonWithScripts = PackageJson & {
  scripts?: Record<string, string | undefined>;
};

async function readPackageJson(
  targetDir: string,
): Promise<PackageJsonWithScripts | null> {
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (!(await fileExists(packageJsonPath))) {
    return null;
  }

  try {
    return await readJsonFile<PackageJsonWithScripts>(packageJsonPath);
  } catch {
    return null;
  }
}

const angularJsonDetector: DevServerDetector = {
  id: 'angular-json',
  detect: async targetDir => {
    const angularJsonPath = path.join(targetDir, 'angular.json');
    if (!(await fileExists(angularJsonPath))) {
      return null;
    }

    try {
      const angularJson = await readJsonFile<{
        projects?: Record<
          string,
          {
            architect?: {
              serve?: {
                options?: {
                  port?: number;
                };
              };
            };
          }
        >;
      }>(angularJsonPath);

      for (const project of Object.values(angularJson.projects ?? {})) {
        const port = project.architect?.serve?.options?.port;
        if (typeof port === 'number') {
          return toDetectionResult(port, 'angular.json');
        }
      }
    } catch {
      return null;
    }

    return toDetectionResult(DEV_SERVER_PORTS.angular, 'angular.json');
  },
};

const projectJsonDetector: DevServerDetector = {
  id: 'project-json',
  detect: async targetDir => {
    const projectJsonPath = path.join(targetDir, 'project.json');
    if (!(await fileExists(projectJsonPath))) {
      return null;
    }

    try {
      const projectJson = await readJsonFile<{
        targets?: {
          serve?: {
            options?: {
              port?: number;
            };
          };
        };
      }>(projectJsonPath);

      const port = projectJson.targets?.serve?.options?.port;
      if (typeof port === 'number') {
        return toDetectionResult(port, 'project.json');
      }
    } catch {
      return null;
    }

    return null;
  },
};

const configFileDetector: DevServerDetector = {
  id: 'config-file',
  detect: async targetDir => {
    const files = await readdir(targetDir, { encoding: 'utf8' }).catch(
      () => [] as string[],
    );

    for (const file of files) {
      const filePath = path.join(targetDir, file);
      if (!(await fileExists(filePath))) {
        continue;
      }

      for (const detector of CONFIG_FILE_DETECTORS) {
        if (!detector.pattern.test(file)) {
          continue;
        }

        const port =
          (await parsePortFromConfigFile(filePath, {
            defaultPort: detector.defaultPort,
            sections: [...detector.sections],
          })) ?? detector.defaultPort;

        return toDetectionResult(port, file);
      }

      if (
        VUE_CONFIG_FILES.includes(file as (typeof VUE_CONFIG_FILES)[number])
      ) {
        const port =
          (await parsePortFromConfigFile(filePath, {
            defaultPort: DEV_SERVER_PORTS.vueCli,
            sections: ['devServer'],
          })) ?? DEV_SERVER_PORTS.vueCli;

        return toDetectionResult(port, file);
      }
    }

    return null;
  },
};

const packageJsonScriptsDetector: DevServerDetector = {
  id: 'package-json-scripts',
  detect: async targetDir => {
    const packageJson = await readPackageJson(targetDir);
    if (packageJson?.scripts == null) {
      return null;
    }

    for (const key of SCRIPT_KEYS) {
      const script = packageJson.scripts[key];
      if (script == null) {
        continue;
      }

      const port = detectPortFromScript(script);
      if (port != null) {
        return toDetectionResult(port, `package.json ${key} script`);
      }
    }

    return null;
  },
};

const packageJsonDependenciesDetector: DevServerDetector = {
  id: 'package-json-dependencies',
  detect: async targetDir => {
    const packageJson = await readPackageJson(targetDir);
    if (packageJson == null) {
      return null;
    }

    for (const { dependency, tool } of DEPENDENCY_TOOL_MAP) {
      if (hasDependency(packageJson, dependency)) {
        return toDetectionResult(
          DEV_SERVER_PORTS[tool],
          'package.json dependencies',
        );
      }
    }

    return null;
  },
};

export const DEV_SERVER_DETECTORS: DevServerDetector[] = [
  angularJsonDetector,
  projectJsonDetector,
  configFileDetector,
  packageJsonScriptsDetector,
  packageJsonDependenciesDetector,
];
