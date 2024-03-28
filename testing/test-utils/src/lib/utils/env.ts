export function shouldSkipLongRunningTests(): boolean {
  return process.env['SKIP_LONG_TESTS'] === 'true' || !process.env['CI'];
}
