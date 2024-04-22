import {NEW_LINE} from "../md";

const stylesMap = {
  '': 'undefined',
  js: 'javascript',
} as const;

export type CodeFormat = keyof typeof stylesMap;
export function code(text: string, format: CodeFormat = ''): string {
  return `<code data-type="${format}">${text}</code>`;
}
