const boldElement = 'b';
export function bold(text: string): string {
  return `<${boldElement}>${text}</${boldElement}>`;
}

const italicElement = 'i';
export function italic(text: string): string {
  return `<${italicElement}>${text}</${italicElement}>`;
}

const codeElement = 'code';
export function code(text: string): string {
  return `<${codeElement}>${text}</${codeElement}>`;
}
