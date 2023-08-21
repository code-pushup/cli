import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

export async function cli(configPath: string) {
  const path = resolveImportPath(configPath);
  // if (/\.[cm]?ts$/.test(path)) {
  //   console.log('ts-node/register');
  //   const { register } = await import('ts-node');
  //   register();
  // }
  const module = await import(path);
  const data = module.default ?? module;
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
