export function shouldSkipLongRunningTests(): boolean {
  if (process.env['INCLUDE_SLOW_TESTS']) {
    return process.env['INCLUDE_SLOW_TESTS'] === 'false';
  }
  return !process.env['CI'];
}
