const boldWrap = '**';
export function bold(text: string): string {
  return `${boldWrap}${text}${boldWrap}`;
}

const italicWrap = '_';
export function italic(text: string): string {
  return `${italicWrap}${text}${italicWrap}`;
}

const strikeThroughWrap = '~';
export function strikeThrough(text: string): string {
  return `${strikeThroughWrap}${text}${strikeThroughWrap}`;
}

const codeWrap = '`';
export function code(text: string): string {
  return `${codeWrap}${text}${codeWrap}`;
}
