# Publish script - `scripts/publish-package.ts`

This script is used to publish a package to npm.

Run:

- `tsx tools/publish/scripts/publish-package.ts`
- `tsx tools/publish/scripts/publish-package.ts --nextVersion=0.50.3 --tag=e2e --registry=https://registry.npmjs.org`

Options:

| Option          | Type     | Description              | Default                    |
| --------------- | -------- | ------------------------ | -------------------------- |
| `--nextVersion` | `string` | The version to publish.  | next                       |
| `--tag`         | `string` | The tag to publish.      | `undefined`                |
| `--registry`    | `string` | The registry to publish. | https://registry.npmjs.org |

# Publish Nx Plugin

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

Run dynamically added targets:

- `nx run <project-name>:publish --nextVersion=1.0.0 --registry=https://registry.npmjs.org`
