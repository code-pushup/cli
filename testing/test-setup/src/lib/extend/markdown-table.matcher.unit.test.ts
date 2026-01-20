describe('markdown-table-matcher', () => {
  it('should match header and data rows in a markdown table', () => {
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
      ':--------------------------',
      ':-------:',
      ':-------:',
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

  it('should match table rows containing escaped pipe symbols', () => {
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

  it('should match table rows with an empty cell', () => {
    const markdown = `
      |  Severity  | Message                   | Source file           | Line(s) |
      | :--------: | :------------------------ | :-------------------- | :-----: |
      | 🚨 _error_ | File size is 20KB too big | \`list.component.ts\` |         |
    `;
    expect(markdown).toContainMarkdownTableRow([
      '🚨 _error_',
      'File size is 20KB too big',
      '`list.component.ts`',
      '',
    ]);
  });
});
