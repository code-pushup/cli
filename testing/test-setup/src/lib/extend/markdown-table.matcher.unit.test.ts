import { describe, expect, it } from 'vitest';

describe('markdown-table-matcher', () => {
  const markdown = `
    | 🏷 Category   | ⭐ Score    | 🛡 Audits |
    |--------------|-------------|-----------|
    | Performance  | 🟡 **61**   | 2         |
    | SEO          | 🟢 **100**  | 1         |
    | PWA          | 🔴 **0**    | 1         |
  `;

  it('toContainMarkdownTableRow matches correctly', () => {
    expect(markdown).toContainMarkdownTableRow([
      '🏷 Category',
      '⭐ Score',
      '🛡 Audits',
    ]);
    expect(markdown).toContainMarkdownTableRow([
      'Performance',
      '🟡 **61**',
      '2',
    ]);
    expect(markdown).not.toContainMarkdownTableRow([
      'Non-existent cell',
      'Row cell',
      'Test cell',
    ]);
  });
});
