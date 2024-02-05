import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ZodTypeAny } from 'zod';
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts';

export function generateTypesString(
  schemas: Record<string, ZodTypeAny>,
): string {
  return Object.entries(schemas)
    .map(([identifier, schema]) => {
      const typeName = schemaNameToTypeName(identifier);
      const { node } = zodToTs(schema, typeName);
      const typeAlias = createTypeAlias(node, typeName);
      return `export ${printNode(typeAlias)}`;
    })
    .join('\n');
}

export function schemaNameToTypeName(schemaName: string): string {
  const name = schemaName.replace(/Schema/, '');
  return name[0].toUpperCase() + name.slice(1);
}

export function generateMdFile(typesString: string): string {
  return [
    '# Code PushUp config file reference',
    'The `code-pushup.config.(ts|mjs|js)` file should conform to the following type definition:',
    '```ts',
    typesString,
    '```',
  ].join('\n');
}

export async function safeWriteFile(path: string, content: string) {
  const dir = dirname(path) as string;
  const stats = await stat(dir);
  if (!stats.isDirectory()) {
    await mkdir(dir);
  }
  await writeFile(path, content, { encoding: 'utf8' });
}
