# test-utils

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
