# File Size Audit - Unmodified

🕵️ **An audit to check JavaScript file size in a directory. The files are not modified and takes as they are.** 📏

---

The audit evaluates the size of a file by using the `stat` function for the `fs:promises` node package.

You can configure the plugin with the following options:

- `budget` as number in bytes

## Details

The audit provides details in cases a file result is given.

### Issues

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
      <td>File file.js OK</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```

**Audit failed**
A `Issue` with severity `error` is present and names to the given file.  
The file sizes of the given file, the budget as well as the size difference is mentioned in the message.

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
      <td>File file.js is 17.31 kB bytes too big. (budget: 41.02 kB)</td>
      <td><code>src/file.js</code></td>
      <td></td>
    </tr>
  </table>
```
