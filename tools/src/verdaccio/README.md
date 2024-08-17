# Verdaccio Nx Plugin

## Usage

Configure a target in your project json.

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": ["tools/verdaccio/verdaccio.plugin.ts"]
}
```

With options:

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": [
    {
      "plugin": "tools/verdaccio/verdaccio.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "vernose": true
      }
    }
  ]
}
```

### Targets

#### `start-verdaccio`

Starts a Verdaccio server.

It will automatically use `tools/tsconfig.tools.ts` to execute the script as well as derives the package name from the project name from `package/root/package.json`.
By default, it registers the latest version of the package from the default registry.

Run:
`nx run <project-name>:start-verdaccio`

**Options:**

| Name       | Type     | Default                         | Description                                        |
| ---------- | -------- | ------------------------------- | -------------------------------------------------- |
| `registry` | `string` | `https://registry.npmjs.org`    | The registry to check the package version against. |
| `config`   | `string` | `tools/verdaccio/verdaccio.yml` | The Verdaccio configuration file.                  |
| `port`     | `number` | `4873`                          | The port to start the Verdaccio server on.         |
| `storage`  | `string` | `tools/verdaccio/storage `      | The storage directory for Verdaccio.               |
