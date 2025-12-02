import ansis from 'ansis';
import { formatAsciiTable } from './table.js';

describe('formatAsciiTable', () => {
  it('should format table with primitive rows and no header', () => {
    const output = formatAsciiTable({
      rows: [
        ['x', '0'],
        ['y', '0'],
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───┬───┐
│ x │ 0 │
│ y │ 0 │
└───┴───┘
`.trim(),
    );
  });

  it('should format table with objects rows and column headers', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'x', label: 'X' },
        { key: 'y', label: 'Y' },
      ],
      rows: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───┬───┐
│ X │ Y │
├───┼───┤
│ 0 │ 0 │
│ 2 │ 0 │
│ 0 │ 1 │
│ 2 │ 1 │
└───┴───┘
`.trim(),
    );
  });

  it('should support various primitive cell values', () => {
    const output = formatAsciiTable({
      rows: [['foo', 42, true, null]],
    });
    expect(ansis.strip(output)).toBe(
      `
┌─────┬────┬──────┬──┐
│ foo │ 42 │ true │  │
└─────┴────┴──────┴──┘
`.trim(),
    );
  });

  it('should align columns', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'property', label: 'Property', align: 'left' },
        { key: 'required', label: 'Required', align: 'center' },
        { key: 'default', label: 'Default', align: 'right' },
      ],
      rows: [
        { property: 'elevation', required: false, default: 0 },
        { property: 'bbox', required: true, default: null },
        { property: 'offset', required: false, default: 0 },
        { property: 'gain', required: false, default: 1 },
        { property: 'proj4', required: false, default: 'EPSG:3857' },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───────────┬──────────┬───────────┐
│ Property  │ Required │   Default │
├───────────┼──────────┼───────────┤
│ elevation │  false   │         0 │
│ bbox      │   true   │           │
│ offset    │  false   │         0 │
│ gain      │  false   │         1 │
│ proj4     │  false   │ EPSG:3857 │
└───────────┴──────────┴───────────┘
`.trim(),
    );
  });

  it('should align columns without header', () => {
    const output = formatAsciiTable({
      columns: ['left', 'center', 'right'],
      rows: [
        ['elevation', false, 0],
        ['altitude', '(*)', null],
        ['bbox', true, null],
        ['offset', false, 0],
        ['gain', false, 1],
        ['proj4', false, 'EPSG:3857'],
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───────────┬───────┬───────────┐
│ elevation │ false │         0 │
│ altitude  │  (*)  │           │
│ bbox      │ true  │           │
│ offset    │ false │         0 │
│ gain      │ false │         1 │
│ proj4     │ false │ EPSG:3857 │
└───────────┴───────┴───────────┘
`.trim(),
    );
  });

  it('should fill in empty columns if rows have varying numbers of cells', () => {
    const output = formatAsciiTable({
      rows: [
        ['Angular', 'Apollo Client', 'Ant Design'],
        ['Angular'],
        ['Apollo Server', 'MongoDB'],
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───────────────┬───────────────┬────────────┐
│ Angular       │ Apollo Client │ Ant Design │
│ Angular       │               │            │
│ Apollo Server │ MongoDB       │            │
└───────────────┴───────────────┴────────────┘
`.trim(),
    );
  });

  it("should omit extra columns that aren't listed in header", () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'r', label: 'Red' },
        { key: 'g', label: 'Green' },
        { key: 'b', label: 'Blue' },
      ],
      rows: [
        { r: 44, g: 61, b: 121 },
        { r: 251, g: 252, b: 255, a: 1 },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌─────┬───────┬──────┐
│ Red │ Green │ Blue │
├─────┼───────┼──────┤
│ 44  │ 61    │ 121  │
│ 251 │ 252   │ 255  │
└─────┴───────┴──────┘
`.trim(),
    );
  });

  it('should order cells by columns keys', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'url', label: 'URL' },
        { key: 'duration', label: 'Duration' },
      ],
      rows: [
        { duration: '1.2 s', url: 'https://example.com' },
        { duration: '612 ms', url: 'https://example.com/contact' },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌─────────────────────────────┬──────────┐
│ URL                         │ Duration │
├─────────────────────────────┼──────────┤
│ https://example.com         │ 1.2 s    │
│ https://example.com/contact │ 612 ms   │
└─────────────────────────────┴──────────┘
`.trim(),
    );
  });

  it('should use column key if label is missing', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'order', label: '' }, // empty label overrides
        { key: 'url' },
        { key: 'duration' },
      ],
      rows: [
        { order: '1.', url: '/', duration: '1.2 s' },
        { order: '2.', url: '/contact', duration: '612 ms' },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌────┬──────────┬──────────┐
│    │ url      │ duration │
├────┼──────────┼──────────┤
│ 1. │ /        │ 1.2 s    │
│ 2. │ /contact │ 612 ms   │
└────┴──────────┴──────────┘
`.trim(),
    );
  });

  it('should ignore color codes when aligning columns', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'category', label: ansis.bold('Category'), align: 'left' },
        { key: 'score', label: ansis.bold('Score'), align: 'right' },
      ],
      rows: [
        {
          category: ansis.bold('Performance'),
          score: `${ansis.red('42')} → ${ansis.yellow('51')}`,
        },
        {
          category: 'Accessibility',
          score: ansis.green('100'),
        },
        {
          category: 'Coverage',
          score: ansis.yellow('66'),
        },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───────────────┬─────────┐
│ Category      │   Score │
├───────────────┼─────────┤
│ Performance   │ 42 → 51 │
│ Accessibility │     100 │
│ Coverage      │      66 │
└───────────────┴─────────┘
`.trim(),
    );
  });

  it('should dim borders and preserve ansis styles in cells', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'perf', label: ansis.bold('Performance') },
        { key: 'a11y', label: ansis.bold('Accessibility') },
      ],
      rows: [{ perf: ansis.red('42'), a11y: ansis.green('93') }],
    });
    expect(output).toBe(
      `
${ansis.dim('┌─────────────┬───────────────┐')}
${ansis.dim('│')} ${ansis.bold('Performance')} ${ansis.dim('│')} ${ansis.bold('Accessibility')} ${ansis.dim('│')}
${ansis.dim('├─────────────┼───────────────┤')}
${ansis.dim('│')} ${ansis.red('42')}          ${ansis.dim('│')} ${ansis.green('93')}            ${ansis.dim('│')}
${ansis.dim('└─────────────┴───────────────┘')}
`.trim(),
    );
  });

  it('should include table title', () => {
    const output = formatAsciiTable({
      title: 'Code coverage:',
      rows: [
        ['front-office', '42%'],
        ['back-office', '12%'],
        ['api', '88%'],
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
Code coverage:

┌──────────────┬─────┐
│ front-office │ 42% │
│ back-office  │ 12% │
│ api          │ 88% │
└──────────────┴─────┘
      `.trim(),
    );
  });

  it('should support custom padding', () => {
    const output = formatAsciiTable(
      {
        columns: [
          { key: 'url', label: 'URL', align: 'left' },
          { key: 'duration', label: 'Duration', align: 'right' },
        ],
        rows: [
          { url: '/', duration: '1.2 s' },
          { url: '/contact', duration: '612 ms' },
        ],
      },
      {
        padding: 3,
      },
    );
    expect(ansis.strip(output)).toBe(
      `
┌──────────────┬──────────────┐
│   URL        │   Duration   │
├──────────────┼──────────────┤
│   /          │      1.2 s   │
│   /contact   │     612 ms   │
└──────────────┴──────────────┘
`.trim(),
    );
  });

  it('should support border-less tables', () => {
    const output = formatAsciiTable(
      {
        columns: ['left', 'right', 'center'],
        rows: [
          ['/', '2.4 s', '✖'],
          ['/about', '720 ms', '✔'],
          ['/contact', 'n/a', ''],
        ],
      },
      {
        borderless: true,
      },
    );
    expect(output).toBe(
      `
/          2.4 s  ✖
/about    720 ms  ✔
/contact     n/a
`.trim(),
    );
  });

  it('should align columns with unicode characters correctly', () => {
    const output = formatAsciiTable({
      rows: [
        ['❌', '/', '1.2 s'],
        ['✅', '/contact', '612 ms'],
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌────┬──────────┬────────┐
│ ❌ │ /        │ 1.2 s  │
│ ✅ │ /contact │ 612 ms │
└────┴──────────┴────────┘
`.trim(),
    );
  });

  it('should wrap columns to enforce a maximum width', () => {
    const output = formatAsciiTable({
      rows: [
        ['Audit production dependencies', '0 vulnerabilities'],
        [
          'Audit development dependencies',
          '12 vulnerabilities (1 critical, 3 high, 7 moderate, 5 low)',
        ],
        [
          'Outdated production dependencies',
          '2 outdated packages (1 minor, 1 patch)',
        ],
        [
          'Outdated development dependencies',
          '8 outdated packages (2 major, 2 minor, 4 patch)',
        ],
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌───────────────────────────────────┬──────────────────────────────────────────┐
│ Audit production dependencies     │ 0 vulnerabilities                        │
│ Audit development dependencies    │ 12 vulnerabilities (1 critical, 3 high,  │
│                                   │ 7 moderate, 5 low)                       │
│ Outdated production dependencies  │ 2 outdated packages (1 minor, 1 patch)   │
│ Outdated development dependencies │ 8 outdated packages (2 major, 2 minor, 4 │
│                                   │ patch)                                   │
└───────────────────────────────────┴──────────────────────────────────────────┘
`.trim(),
    );
  });

  it('should wrap columns in border-less tables', () => {
    const output = formatAsciiTable(
      {
        columns: ['center', 'left', 'right'],
        rows: [
          [
            ansis.green('●'),
            'Audit production dependencies',
            '0 vulnerabilities',
          ],
          [
            ansis.red('●'),
            'Audit development dependencies',
            '12 vulnerabilities (1 critical, 3 high, 7 moderate, 5 low)',
          ],
          [
            ansis.green('●'),
            'Outdated production dependencies',
            '2 outdated packages (1 minor, 1 patch)',
          ],
          [
            ansis.yellow('●'),
            'Outdated development dependencies',
            '8 outdated packages (2 major, 2 minor, 4 patch)',
          ],
        ],
      },
      { borderless: true },
    );
    expect(ansis.strip(output)).toBe(
      `
●  Audit production dependencies                               0 vulnerabilities
●  Audit development dependencies      12 vulnerabilities (1 critical, 3 high, 7
                                                                moderate, 5 low)
●  Outdated production dependencies       2 outdated packages (1 minor, 1 patch)
●  Outdated development dependencies    8 outdated packages (2 major, 2 minor, 4
                                                                          patch)
`.trim(),
    );
  });

  it('should wrap columns in header and break long words', () => {
    const output = formatAsciiTable({
      columns: [
        { key: 'a11y', label: 'Accessibility', align: 'center' },
        { key: 'coverage', label: 'Code coverage', align: 'center' },
        { key: 'bug-prevention', label: 'Bug prevention', align: 'center' },
        { key: 'code-style', label: 'Code style', align: 'center' },
        { key: 'security', label: 'Security', align: 'center' },
        { key: 'updates', label: 'Updates', align: 'center' },
        { key: 'docs', label: 'Documentation', align: 'center' },
      ],
      rows: [
        {
          a11y: 81,
          coverage: 64,
          'bug-prevention': 92,
          'code-style': 100,
          security: 95,
          updates: 62,
          docs: 6,
        },
      ],
    });
    expect(ansis.strip(output)).toBe(
      `
┌──────────┬────────────┬─────────┬────────────┬──────────┬─────────┬──────────┐
│ Accessi- │    Code    │   Bug   │ Code style │ Security │ Updates │ Documen- │
│  bility  │  coverage  │ preven- │            │          │         │  tation  │
│          │            │  tion   │            │          │         │          │
├──────────┼────────────┼─────────┼────────────┼──────────┼─────────┼──────────┤
│    81    │     64     │   92    │    100     │    95    │   62    │    6     │
└──────────┴────────────┴─────────┴────────────┴──────────┴─────────┴──────────┘
`.trim(),
    );
  });
});
