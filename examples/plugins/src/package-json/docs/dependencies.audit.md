# 📦 Package Json Audit - Dependencies

🕵️ **An audit to check the `dependencies`, `devDependencies` and `optionalDependencies` settings in `package.json` files.** 📦

---

The audit evaluates the dependency related properties of a `package.json` file.

You can configure the plugin with the following options:

- `type` as string naming the module type

## Details

The audit provides additional details on the `type` property in cases a file result is given.

### Issues

**Audit not configured**
An `Issue` with severity `info` is present and names to the given file.

```md
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source</th>
      <th>Location</th>
    </tr>
    <tr>
      <td>ℹ️ <i>info</i></td>
      <td>No dependencies required</td>
      <td><code>src/package.json</code></td>
      <td></td>
    </tr>
  </table>
```

**Audit passed**
A `Issue` with severity `info` is present and names to the given file.

```md
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source</th>
      <th>Location</th>
    </tr>
    <tr>
      <td>ℹ️ <i>info</i></td>
      <td>Package PACKAGE_NAME@VERSION is installed as DEPENDENCY_TYPE.</td>
      <td><code>src/package.json</code></td>
      <td></td>
    </tr>
  </table>
```

**Audit failed**
A `Issue` with severity `error` is present and names to the given file.  
The dependencies of the given file, the target version as well as the given version are mentioned in the message.

```md
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source</th>
      <th>Location</th>
    </tr>
    <tr>
      <td>🚨 <i>error</i></td>
      <td>Package PACKAGE_NAME in DEPENDENCY_TYPE has wrong version. Wanted TARGET_VERSION but got GIVEN_VERSION</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```
