# test-fixtures

This library contains testing fixtures.

## Mock data

Hardcoded mocks, often referring to a smaller configuration object, live in [`utils`](./src/lib/utils/).
Dynamic mocks (functions that accept objects), referring to a bigger example of a configuration and report object, live in [`dynamic-mocks`](./src/lib/utils/dynamic-mocks/).

Please prefer using static mocks over dynamic ones for better readability. Dynamic mocks to be used with care when testing a snapshot after report generation or similar.

## Fixtures

Example configuration files that are to be used in integration or E2E tests live in [`configs`](./src//lib/fixtures/configs/).
