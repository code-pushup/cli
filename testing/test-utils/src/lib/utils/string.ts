// removes all color codes from the output for snapshot readability
export function removeColorCodes(stdout: string) {
  // eslint-disable-next-line no-control-regex
  return stdout.replace(/\u001B\[\d+m/g, '');
}
