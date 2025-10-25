import type { Audit } from '@code-pushup/models';
import { ruleToAudit } from './transform.js';

describe('ruleToAudit', () => {
  it('built-in rule without custom options', () => {
    expect(
      ruleToAudit({
        id: 'no-invalid-regexp',
        meta: {
          docs: {
            description:
              'Disallow invalid regular expression strings in `RegExp` constructors',
            url: 'https://eslint.org/docs/latest/rules/no-invalid-regexp',
          },
        },
        options: undefined,
      }),
    ).toEqual<Audit>({
      slug: 'no-invalid-regexp',
      title:
        'Disallow invalid regular expression strings in `RegExp` constructors',
      description: 'ESLint rule **no-invalid-regexp**.',
      docsUrl: 'https://eslint.org/docs/latest/rules/no-invalid-regexp',
    });
  });

  it('plugin rule without custom options', () => {
    expect(
      ruleToAudit({
        id: '@typescript-eslint/no-explicit-any',
        meta: {
          docs: {
            description: 'Disallow the `any` type.',
            url: 'https://typescript-eslint.io/rules/no-explicit-any/',
          },
        },
        options: undefined,
      }),
    ).toEqual<Audit>({
      slug: 'typescript-eslint-no-explicit-any',
      title: 'Disallow the `any` type.',
      description:
        'ESLint rule **no-explicit-any**, from _@typescript-eslint_ plugin.',
      docsUrl: 'https://typescript-eslint.io/rules/no-explicit-any/',
    });
  });

  it('plugin rule with custom options object', () => {
    expect(
      ruleToAudit({
        id: 'max-lines',
        meta: {
          docs: {
            description: 'Enforce a maximum number of lines per file',
            url: 'https://eslint.org/docs/latest/rules/max-lines',
          },
        },
        options: [
          {
            max: 400,
            skipBlankLines: true,
            skipComments: true,
          },
        ],
      }),
    ).toEqual<Audit>({
      slug: 'max-lines-08c585be8dafbac7',
      title: 'Enforce a maximum number of lines per file',
      description: `ESLint rule **max-lines**.

Custom options:

\`\`\`json
{
  "max": 400,
  "skipBlankLines": true,
  "skipComments": true
}
\`\`\``,
      docsUrl: 'https://eslint.org/docs/latest/rules/max-lines',
    });
  });

  it('built-in rule with custom options array', () => {
    expect(
      ruleToAudit({
        id: 'no-restricted-imports',
        meta: {
          docs: {
            description: 'Disallow specified modules when loaded by import',
            url: 'https://eslint.org/docs/latest/rules/no-restricted-imports',
          },
        },
        options: ['rxjs/Rx', 'rxjs/internal/operators'],
      }),
    ).toEqual<Audit>({
      slug: 'no-restricted-imports-ecb8b58b3d3381ca',
      title: 'Disallow specified modules when loaded by import',
      description: `ESLint rule **no-restricted-imports**.

Custom options:

\`\`\`json
"rxjs/Rx"
\`\`\`

\`\`\`json
"rxjs/internal/operators"
\`\`\``,
      docsUrl: 'https://eslint.org/docs/latest/rules/no-restricted-imports',
    });
  });

  it('plugin rule with custom options', () => {
    expect(
      ruleToAudit({
        id: 'import/extensions',
        meta: {
          docs: {
            description:
              'Ensure consistent use of file extension within the import path.',
            url: 'https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/extensions.md',
          },
        },
        options: ['never', { json: 'always' }],
      }),
    ).toEqual<Audit>({
      slug: 'import-extensions-b091227b35c11a16',
      title: 'Ensure consistent use of file extension within the import path.',
      description: `ESLint rule **extensions**, from _import_ plugin.

Custom options:

\`\`\`json
"never"
\`\`\`

\`\`\`json
{
  "json": "always"
}
\`\`\``,
      docsUrl:
        'https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/extensions.md',
    });
  });

  it('rule with overlong description -> title is truncated', () => {
    expect(
      ruleToAudit({
        id: '@angular-eslint/template/mouse-events-have-key-events',
        meta: {
          docs: {
            description:
              '[Accessibility] Ensures that the mouse events `mouseout` and `mouseover` are accompanied by `focus` and `blur` events respectively. Coding for the keyboard is important for users with physical disabilities who cannot use a mouse, AT compatibility, and screenreader users. See more at https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
            url: 'https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/mouse-events-have-key-events.md',
          },
        },
        options: [],
      }),
    ).toEqual<Audit>({
      slug: 'angular-eslint-template-mouse-events-have-key-events',
      title:
        '[Accessibility] Ensures that the mouse events `mouseout` and `mouseover` are accompanied by `focus` and `blur` events respectively. Coding for the keyboard is important for users with physical disabilities who cannot use a mouse, AT compatibility, and scr…',
      description:
        'ESLint rule **mouse-events-have-key-events**, from _@angular-eslint/template_ plugin.',
      docsUrl:
        'https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/mouse-events-have-key-events.md',
    });
  });
});
