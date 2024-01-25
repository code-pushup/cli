# testing-utils

This library contains testing utilities, such as helper functions or fixtures.
Any reusable mocks should live here.

More on this subject as well as all the testing strategy principles can be found on the GitHub [wiki](https://github.com/code-pushup/cli/wiki/Testing-Strategy#testing-utilities).

## Library utilities

### Mock data

Hardcoded mocks, often referring to a smaller configuration object, live in [`utils`](./src/lib/utils/).
Dynamic mocks (functions that accept objects), referring to a bigger example of a configuration and report object, live in [`dynamic-mocks`](./src/lib/utils/dynamic-mocks/).

Please prefer using static mocks over dynamic ones for better readability. Dynamic mocks to be used with care when testing a snapshot after report generation or similar.

### Fixtures

Example configuration files that are to be used in integration or E2E tests live in [`configs`](./src//lib/fixtures/configs/).

### Mock setup

In the [`setup`](./src/lib/setup/) folder you can find all files that can be used in `setupFiles` property of `vitest.config.(unit|integration|e2e).ts` files. Currently include:

- [console](./src/lib/setup/console.mock.ts) mocking
- [file system](./src/lib/setup/fs.mock.ts) mocking
- [`portal-client`](./src/lib/setup/portal-client.mock.ts) mocking

Additionally, you may find helper functions for:

- setting up and tearing down a [testing folder](./src/lib/setup/test-folder.setup.ts)
- [resetting](./src/lib/setup/reset.mocks.ts) mocks
