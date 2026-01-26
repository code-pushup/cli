# 📦 Package Json Audit - Module Type

🕵️ **An audit to check the `type` settings in `package.json` files.** 📦

---

The audit evaluates the `type` property of a `package.json` file.

You can configure the plugin with the following options:

- `type` as string naming the module type

> [!NOTE]
> If the `type` property is not set in the `package.json` file, it defaults to `commonjs`.
> See: https://nodejs.org/docs/latest-v13.x/api/esm.html#esm_package_json_type_field

## Details

The audit provides additional details on the `type` property in cases a file result is given.

### Issues

**Audit not configured**
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
      <td>No type required</td>
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
      <td>type OK</td>
      <td><code>src/package.json</code></td>
      <td></td>
    </tr>
  </table>
```

**Audit failed**
A `Issue` with severity `error` is present and names to the given file.  
The `type` of the given file, the target `type` as well as the given `type` are mentioned in the message.

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
      <td>type should be TARGET_LICENSE but is GIVEN_LICENSE</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```
