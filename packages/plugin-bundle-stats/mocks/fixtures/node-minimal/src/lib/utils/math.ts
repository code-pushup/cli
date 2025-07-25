export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function calculate(x: number, y: number): number {
  return multiply(add(x, y), 2);
}
