# test-setup

This library contains test setup.

More on this subject as well as all the testing strategy principles can be found on the GitHub [wiki](https://github.com/code-pushup/cli/wiki/Testing-Strategy#mocking).

## Shared config

See [`@code-pushup/test-setup-config` docs](../test-setup-config/README.md) on how to use our Vitest config factory.

## Mock setup

In this library you can find all files that can be used in `setupFiles` property of `vitest.config.(unit|int|e2e).ts` files. Currently include:

- [console](./src/lib/console.mock.ts) mocking
- [file system](./src/lib/fs.setup-file.ts) mocking
- [`portal-client`](./src/lib/portal-client.setup-file.ts) mocking
- [git](./src/lib/git.setup-file.ts) mocking

Additionally, you may find helper functions for:

- setting up and tearing down a [testing folder](./src/lib/test-folder.setup.ts)
- [resetting](./src/lib/reset.setup-file.ts) mocks
