/* eslint-disable functional/immutable-data */

const originalCI = process.env['CI'];

export function setup() {
  // package is expected to run in CI environment
  process.env['CI'] = 'true';
}

export function teardown() {
  if (originalCI === undefined) {
    delete process.env['CI'];
  } else {
    process.env['CI'] = originalCI;
  }
}
