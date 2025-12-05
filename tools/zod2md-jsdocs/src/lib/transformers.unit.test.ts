import { describe, expect, it } from 'vitest';
import { generateJSDocComment } from './transformers';

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

  it('should generate JSDoc comment for different type name', () => {
    const result = generateJSDocComment(
      'ConfigOptions',
      'https://docs.site.com',
    );
    expect(result).toBe(
      `*
 * Type Definition: \`ConfigOptions\`
 *
 * This type is derived from a Zod schema and represents
 * the validated structure of \`ConfigOptions\` used within the application.
 *
 * @see {@link https://docs.site.com#configoptions}
 `,
    );
  });

  it('should convert type name to lowercase in the link anchor', () => {
    const result = generateJSDocComment('MyComplexType', 'https://example.com');
    expect(result).toContain('https://example.com#');
  });

  it('should handle type names with numbers', () => {
    const result = generateJSDocComment('Schema123', 'https://example.com/api');
    expect(result).toContain('Type Definition: `Schema123`');
    expect(result).toContain('#schema123');
  });
});
