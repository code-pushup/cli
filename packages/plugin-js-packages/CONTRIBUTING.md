# Contributing to js-packages

## Adding new package managers

In order to add a support for a new package manager, one needs to do the following:

1. Expand `packageManagerIdSchema` in `config.ts`.
2. Create a new object of `PackageManager` type in `package-managers/<name>/<name>.ts` and fill it in with all relevant data. Following the current pattern of separate files for audit and outdated result and types is recommended.
3. Extend `package-managers/package-managers.ts` record with the new package manager.

> [!NOTE]
> Should your package manager require specific behaviour, feel free to request a property addition or change.

### Notable properties

- `(audit|check).unifyResult()`: In order to process the results in a unified way, the expected type needs to be defined in `runner/(audit|check)/types.ts` and its transformation to normalised result implemented in `runner/(audit|check)/unify-type.ts`. This function is then referenced in the object to be called accordingly.
- `audit.getCommandArgs(depGroup)`: The `audit` command is run for one dependency group. In order to filter out the other dependencies, the arguments are provided dynamically based on this function. One may include frequently used arguments from `COMMON_AUDIT_ARGS`.
- `audit.ignoreExitCode`: Some package managers do not allow non-zero exit code override. To ignore non-zero exit code, set this property to `true`.
- `audit.supportedDepGroups`: Some package managers do not support `audit` check for all types of dependencies (e.g. optional). In that case, please list a supported subset of dependencies in this property. By default, all dependency groups are considered supported.
- `audit.postProcessResult()`: The `audit` check often does not offer exclusive result for all dependency groups. In order to filter out duplicates after the results are normalised, add a post-processing function here.
