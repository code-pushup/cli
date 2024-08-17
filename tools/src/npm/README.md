# NPM Nx Plugin

## Usage

Configure a target in your project json.

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": ["tools/npm/npm.plugin.ts"]
}
```

With options:

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": [
    {
      "plugin": "tools/npm/npm.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "npmCheckScript": "check-package-range.ts"
      }
    }
  ]
}
```

### Targets

#### `npm-check`

Added dynamically to every project that is publishable (has a target named `publishable`).
Checks if a given package is registered in a given registry.

It will automatically use `tools/tsconfig.tools.ts` to execute the script as well as derives the package name from the project name from `package/root/package.json`.
By default, it registers the latest version of the package from the default registry.

Run:
`nx run <project-name>:npm-check`

**Options:**
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `pkgVersion` | `string` | `latest` | The package version to check. |
| `registry` | `string` | `https://registry.npmjs.org` | The registry to check the package version against. |

Examples:

- `nx run <project-name>:npm-check`
- `nx run <project-name>:npm-check --registry=http://localhost:58999`
- `nx run <project-name>:npm-check --registry=http://localhost:58999 --pkgVersion=1.0.0`

#### `npm-install`

Added dynamically to every project that is publishable (has a target named `publishable`).
Installs a given package version from a given registry.

It will automatically derive the package name from the project name from `package/root/package.json`.
By default, it installs the latest version of the package from the default registry.

Run:
`nx run <project-name>:npm-install`

**Options:**
| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `pkgVersion` | `string` | `latest` | The package version to install. |
| `registry` | `string` | `https://registry.npmjs.org` | The registry to install the package from. |

Examples:

- `nx run <project-name>:npm-install --pkgVersion=1.0.0 --registry=http://localhost:58999`

#### `npm-uninstall`

Added dynamically to every project that is publishable (has a target named `publishable`).
Uninstalls a given package.

By default, it uninstalls the latest version of the package from the package.json in your CWD.

Run:
`nx run <project-name>:npm-uninstall`

Examples:

- `nx run <project-name>:npm-uninstall`

## Scripts

### `check-package-range.ts`

Checks if a given package is registered in a given registry.

Run:
`tsx --tsconfig=tools/tsconfig.tools.json tools/npm/check-package-range.ts <package-name> <package-version> <registry>`
