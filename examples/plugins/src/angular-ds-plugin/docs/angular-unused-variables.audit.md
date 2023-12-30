# Angular Unused Variables Audit

🕵️ **An audit to check Angular styles for unused css variables.** 💅

---

The audit evaluates the css imports of a Angular component and checks for unused css variables.

You can configure the plugin with the following options:

- `variableImportPattern` as string

## Details

The audit provides details on the variable usage.

### Issues

**Audit passed**
A `Issue` with severity `info` is present and names to the given file.

```md
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source file</th>
      <th>Line(s)</th>
    </tr>
    <tr>
      <td>ℹ️ <i>info</i></td>
      <td>TODO</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```

**Audit failed because of missing variable imports**
A `Issue` with severity `error` is present and names to the given file.  
The missing import is mentioned in the message.

```md
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source file</th>
      <th>Line(s)</th>
    </tr>
    <tr>
       <td>🚨 <i>error</i></td>
      <td>TODO</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```


**Audit failed because of missing variable usage**
A `Issue` with severity `error` is present and names to the given file.  
The missing variables are mentioned in the message.

```md
  <table>
    <tr>
      <th>Severity</th>
      <th>Message</th>
      <th>Source file</th>
      <th>Line(s)</th>
    </tr>
    <tr>
       <td>🚨 <i>error</i></td>
      <td>TODO</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```
