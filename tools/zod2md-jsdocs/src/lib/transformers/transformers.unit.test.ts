import { describe, expect, it } from 'vitest';
import { generateJSDocComment } from './transformers.js';

describe('generateJSDocComment', () => {
  it('should generate JSDoc comment with type name and base URL', () => {
    const result = generateJSDocComment(
      'UserSchema',
      'https://example.com/docs',
    );
    expect(result).toMatchInlineSnapshot(`
      "*
       * Type Definition: \`UserSchema\`
       *
       * This type is derived from a Zod schema and represents
       * the validated structure of \`UserSchema\` used within the application.
       *
       * @see {@link https://example.com/docs#userschema}
       "
    `);
  });

  it('should use type name in description', () => {
    const result = generateJSDocComment('SchemaName123', 'https://example.com');
    expect(result).toContain('Type Definition: `SchemaName123`');
  });

  it('should convert type name to lowercase in the link anchor', () => {
    const result = generateJSDocComment('SchemaName123', 'https://example.com');
    expect(result).toContain('#schemaname123');
  });

  it('should baseUrl in the link', () => {
    const result = generateJSDocComment('Schema', 'https://example.com');
    expect(result).toContain('https://example.com#');
  });
});
