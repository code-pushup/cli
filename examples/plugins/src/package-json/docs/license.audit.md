# 📦 Package Json Audit - License

🕵️ **An audit to check the `license` settings in `package.json` files.** 📦

---

The audit evaluates the `license` property of a `package.json` file.

You can configure the plugin with the following options:

- `license` as string naming the license type

## Details

The audit provides additional details on the `license` property in cases a file result is given.

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
      <td>No license required</td>
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
      <td>license OK</td>
      <td><code>src/package.json</code></td>
      <td></td>
    </tr>
  </table>
```

**Audit failed**
A `Issue` with severity `error` is present and names to the given file.  
The `license` of the given file, the target `license` as well as the given `license` are mentioned in the message.

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
      <td>license should be TARGET_LICENSE but is GIVEN_LICENSE</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```
