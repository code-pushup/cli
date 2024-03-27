# Contributing to js-packages

## Adding new package managers

In order to add a support for a new package manager, one needs to do the following.

1. Expand `packageManagerSchema` in `config.ts`.
2. Expand `<command>Args` in `runner/<command>/constants.ts` with a set of arguments to be run for a given package manager command.
3. Create a custom type in `runner/<command>/types.ts` with relevant properties based on expected command JSON output.
4. Create a function in `runner/<command>/unify-type.ts` that will transform JSON output into a normalized type `OutdatedResult` or `AuditResult` and add it to `normalized<command>Mapper` in `runner/<command>/constants.ts`.
