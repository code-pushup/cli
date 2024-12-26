import { describe, expect, it } from 'vitest';
import { prepareTsConfigFileContent } from './generate-ts-config.js';

describe('prepareTsConfigFileContent', () => {
  it('should remove empty lines', async () => {
    const testContent = `
    {

}
`;
    expect(prepareTsConfigFileContent(testContent)).toBe(`{}`);
  });

  it('should remove block comments', async () => {
    const testContent = `/* general block comment */
{
/* property block comment */
"prop": 42, /* value block comment */
}`;
    expect(prepareTsConfigFileContent(testContent)).toBe(`{"prop": 42}`);
  });

  it('should remove line comments characters', async () => {
    const testContent = `{
// "prop": 42,
}`;
    expect(prepareTsConfigFileContent(testContent)).toBe(`{"prop": 42}`);
  });

  it('should add missing comma for existing properties before a inline comment property', async () => {
    const testContent = `{
      "pro1": 42
// "prop2": "value"
}`;
    expect(prepareTsConfigFileContent(testContent)).toBe(
      `{"pro1": 42,"prop2": "value"}`,
    );
  });
});
