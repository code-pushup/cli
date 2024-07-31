import {join, relative} from "node:path";
import {executeProcess} from "@code-pushup/utils";

export function distPluginPackage(cwd: string): string {
  return relative(join(process.cwd(), cwd), join(process.cwd(), "dist/packages/nx-plugin"));
}
export function pluginFilePath(cwd: string): string {
  return relative(join(process.cwd(), cwd), join(process.cwd(), "packages/nx-plugin/src/index.ts"));
}

export async function executeGenerator(args: string[], options: {
  cwd?: string,
  bin?: string,
  generator: 'init' | 'configuration'
}) {
  const {bin = '@code-pushup/nx-plugin', generator, cwd = process.cwd()} = options;
  return await executeProcess({
    command: 'npx',
    args: [
      'nx',
      'g',
      `${bin}:${generator} `, ...args
    ],
    cwd
  });
}

