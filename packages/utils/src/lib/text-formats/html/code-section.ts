const stylesMap = {
  '': 'undefined',
  js: 'javascript',
  bash: 'bash',
  ts: 'typescript',
} as const;

export type CodeFormat = keyof typeof stylesMap;
export function codeSection(text: string, format: CodeFormat = ''): string {
  return `<code data-type="${format}">${text}</code>`;
}
