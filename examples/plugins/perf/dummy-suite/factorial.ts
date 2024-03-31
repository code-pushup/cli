export function factorial(n: number): number {
  return n === 0 || n === 1 ? 1 : n * factorial(n - 1);
}
