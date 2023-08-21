import { TransformOptions } from '@babel/core';
import jiti from 'jiti';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { babelPluginLighthouseHackfix } from './babel-plugin-lighthouse-hackfix';

export async function cli(configPath: string) {
  const path = resolveImportPath(configPath);
  const data = await loadModule(path);
  console.log('Loaded config:', data);
  return data;
}

function resolveImportPath(path: string) {
  const absolutePath = join(process.cwd(), path);
  const modulePath = fileURLToPath(new URL(import.meta.url));
  const relativePath = relative(dirname(modulePath), absolutePath);
  if (!relativePath.startsWith('.')) {
    return `./${relativePath}`;
  }
  return relativePath;
}

async function loadModule(path: string) {
  if (/\.[cm]?ts$/.test(path)) {
    const babelOptions: TransformOptions = {
      plugins: [babelPluginLighthouseHackfix],
    };
    const jitiLoader = jiti(fileURLToPath(new URL(import.meta.url)), {
      interopDefault: true,
      transformOptions: {
        babel: babelOptions,
      },
    });
    return jitiLoader(path);
  }

  const module = await import(path);
  return module.default ?? module;
}
