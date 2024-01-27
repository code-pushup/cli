import { ZodTypeAny } from 'zod';
import { createTypeAlias, printNode, zodToTs } from 'zod-to-ts';

export function generateTypesString(
  schemas: Record<string, ZodTypeAny>,
): string {
  return (
    Object.entries(schemas)
      .map(([identifier, schema]) => {
        const typeName = schemaNameToTypeName(identifier);
        const { node } = zodToTs(schema, typeName);
        const typeAlias = createTypeAlias(node, typeName);
        return `export ${printNode(typeAlias)}`;
      })
      // @TODO add line break
      .join('')
  );
}

export function schemaNameToTypeName(schemaName: string): string {
  const name = schemaName.replace(/Schema/, '');
  return name[0].toUpperCase() + name.slice(1);
}
