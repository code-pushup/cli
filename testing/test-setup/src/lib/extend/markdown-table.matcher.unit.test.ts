import { describe, expect, it } from 'vitest';

describe('markdown-table-matcher', () => {
  it('should match table rows', () => {
    const markdown = `
      | 🏷 Category                 | ⭐ Score  | 🛡 Audits |
      | :-------------------------- | :-------: | :-------: |
      | [Security](#security)       | 🟡 **81** |     2     |
      | [Performance](#performance) | 🟡 **64** |    56     |
      | [SEO](#seo)                 | 🟡 **61** |    11     |
`;

    expect(markdown).toContainMarkdownTableRow([
      '🏷 Category',
      '⭐ Score',
      '🛡 Audits',
    ]);
    expect(markdown).toContainMarkdownTableRow([
      '[Performance](#performance)',
      '🟡 **64**',
      '56',
    ]);
    expect(markdown).not.toContainMarkdownTableRow([
      'Non-existent cell',
      'Row cell',
      'Test cell',
    ]);
  });

  it('should match table row with escaped pipe symbols', () => {
    const markdown = `
      | Package    | Versions                 |
      | :--------- | :----------------------- |
      | \`eslint\` | \`^8.0.0 \\|\\| ^9.0.0\` |
    `;
    expect(markdown).toContainMarkdownTableRow([
      '`eslint`',
      '`^8.0.0 || ^9.0.0`',
    ]);
  });
});
