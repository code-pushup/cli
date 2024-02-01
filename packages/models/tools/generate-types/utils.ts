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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const dir = dirname(path) as string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
  const stats = await stat(dir);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
  if (!stats.isDirectory()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await mkdir(dir);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await writeFile(path, content, { encoding: 'utf8' });
}
