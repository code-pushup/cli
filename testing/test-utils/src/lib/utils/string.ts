import ansis from 'ansis';

// removes all color codes from the output for snapshot readability
export function removeColorCodes(stdout: string) {
  return ansis.strip(stdout);
}
