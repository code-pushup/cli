# Code PushUp Report

## 🛡️ Audits

### Disallow missing props validation in a React component definition (ESLint)

<details>
<summary>🟥 <b>6 warnings</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>'onCreate' is missing in props validation</td><td><code>src/components/CreateTodo.jsx</code></td><td>15</td></tr><tr><td>⚠️ <i>warning</i></td><td>'setQuery' is missing in props validation</td><td><code>src/components/TodoFilter.jsx</code></td><td>10</td></tr><tr><td>⚠️ <i>warning</i></td><td>'setHideComplete' is missing in props validation</td><td><code>src/components/TodoFilter.jsx</code></td><td>18</td></tr><tr><td>⚠️ <i>warning</i></td><td>'todos' is missing in props validation</td><td><code>src/components/TodoList.jsx</code></td><td>6</td></tr><tr><td>⚠️ <i>warning</i></td><td>'todos.map' is missing in props validation</td><td><code>src/components/TodoList.jsx</code></td><td>6</td></tr><tr><td>⚠️ <i>warning</i></td><td>'onEdit' is missing in props validation</td><td><code>src/components/TodoList.jsx</code></td><td>13</td></tr></table>

</details>


ESLint rule **prop-types**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/prop-types.md)

### Disallow variable declarations from shadowing variables declared in the outer scope (ESLint)

<details>
<summary>🟥 <b>3 warnings</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>'data' is already declared in the upper scope on line 5 column 10.</td><td><code>src/hooks/useTodos.js</code></td><td>11</td></tr><tr><td>⚠️ <i>warning</i></td><td>'data' is already declared in the upper scope on line 5 column 10.</td><td><code>src/hooks/useTodos.js</code></td><td>29</td></tr><tr><td>⚠️ <i>warning</i></td><td>'data' is already declared in the upper scope on line 5 column 10.</td><td><code>src/hooks/useTodos.js</code></td><td>41</td></tr></table>

</details>


ESLint rule **no-shadow**. [📖 Docs](https://eslint.org/docs/latest/rules/no-shadow)

### Require or disallow method and property shorthand syntax for object literals (ESLint)

<details>
<summary>🟥 <b>3 warnings</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>Expected property shorthand.</td><td><code>src/hooks/useTodos.js</code></td><td>19</td></tr><tr><td>⚠️ <i>warning</i></td><td>Expected property shorthand.</td><td><code>src/hooks/useTodos.js</code></td><td>32</td></tr><tr><td>⚠️ <i>warning</i></td><td>Expected property shorthand.</td><td><code>src/hooks/useTodos.js</code></td><td>33</td></tr></table>

</details>


ESLint rule **object-shorthand**. [📖 Docs](https://eslint.org/docs/latest/rules/object-shorthand)

### verifies the list of dependencies for Hooks like useEffect and similar (ESLint)

<details>
<summary>🟥 <b>2 warnings</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies?</td><td><code>src/hooks/useTodos.js</code></td><td>17</td></tr><tr><td>⚠️ <i>warning</i></td><td>React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies?</td><td><code>src/hooks/useTodos.js</code></td><td>40</td></tr></table>

</details>


ESLint rule **exhaustive-deps**, from _react-hooks_ plugin. [📖 Docs](https://github.com/facebook/react/issues/14920)

### Disallow missing `key` props in iterators/collection literals (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>Missing "key" prop for element in iterator</td><td><code>src/components/TodoList.jsx</code></td><td>7-28</td></tr></table>

</details>


ESLint rule **jsx-key**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md)

### Disallow unused variables (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>'loading' is assigned a value but never used.</td><td><code>src/App.jsx</code></td><td>8</td></tr></table>

</details>


ESLint rule **no-unused-vars**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unused-vars)

### Enforce a maximum number of lines of code in a function (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>Arrow function has too many lines (71). Maximum allowed is 50.</td><td><code>src/hooks/useTodos.js</code></td><td>3-73</td></tr></table>

</details>


ESLint rule **max-lines-per-function**. [📖 Docs](https://eslint.org/docs/latest/rules/max-lines-per-function)

### Require `const` declarations for variables that are never reassigned after declared (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>'root' is never reassigned. Use 'const' instead.</td><td><code>src/index.jsx</code></td><td>5</td></tr></table>

</details>


ESLint rule **prefer-const**. [📖 Docs](https://eslint.org/docs/latest/rules/prefer-const)

### Require braces around arrow function bodies (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>Unexpected block statement surrounding arrow body; move the returned value immediately after the `=>`.</td><td><code>src/components/TodoFilter.jsx</code></td><td>3-25</td></tr></table>

</details>


ESLint rule **arrow-body-style**. [📖 Docs](https://eslint.org/docs/latest/rules/arrow-body-style)

### Require the use of `===` and `!==` (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

<h4>Issues</h4><table><tr><th>Severity</th><th>Message</th><th>Source file</th><th>Line(s)</th></tr><tr><td>⚠️ <i>warning</i></td><td>Expected '===' and instead saw '=='.</td><td><code>src/hooks/useTodos.js</code></td><td>41</td></tr></table>

</details>


ESLint rule **eqeqeq**. [📖 Docs](https://eslint.org/docs/latest/rules/eqeqeq)

### Disallow `target="_blank"` attribute without `rel="noreferrer"` (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **jsx-no-target-blank**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-target-blank.md)

### Disallow assignment operators in conditional expressions (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-cond-assign**. [📖 Docs](https://eslint.org/docs/latest/rules/no-cond-assign)

### Disallow comments from being inserted as text nodes (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **jsx-no-comment-textnodes**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-comment-textnodes.md)

### Disallow direct mutation of this.state (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-direct-mutation-state**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-direct-mutation-state.md)

### Disallow duplicate properties in JSX (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **jsx-no-duplicate-props**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-duplicate-props.md)

### Disallow invalid regular expression strings in `RegExp` constructors (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-invalid-regexp**. [📖 Docs](https://eslint.org/docs/latest/rules/no-invalid-regexp)

### Disallow loops with a body that allows only one iteration (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-unreachable-loop**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unreachable-loop)

### Disallow missing displayName in a React component definition (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **display-name**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/display-name.md)

### Disallow missing React when using JSX (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **react-in-jsx-scope**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/react-in-jsx-scope.md)

### Disallow negating the left operand of relational operators (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-unsafe-negation**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unsafe-negation)

### Disallow passing of children as props (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-children-prop**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-children-prop.md)

### Disallow React to be incorrectly marked as unused (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **jsx-uses-react**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-react.md)

### Disallow reassigning `const` variables (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-const-assign**. [📖 Docs](https://eslint.org/docs/latest/rules/no-const-assign)

### Disallow the use of `debugger` (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-debugger**. [📖 Docs](https://eslint.org/docs/latest/rules/no-debugger)

### Disallow the use of undeclared variables unless mentioned in `/*global */` comments (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-undef**. [📖 Docs](https://eslint.org/docs/latest/rules/no-undef)

### Disallow undeclared variables in JSX (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **jsx-no-undef**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-undef.md)

### Disallow unescaped HTML entities from appearing in markup (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-unescaped-entities**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unescaped-entities.md)

### Disallow usage of deprecated methods (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-deprecated**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-deprecated.md)

### Disallow usage of findDOMNode (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-find-dom-node**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-find-dom-node.md)

### Disallow usage of isMounted (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-is-mounted**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-is-mounted.md)

### Disallow usage of the return value of ReactDOM.render (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-render-return-value**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-render-return-value.md)

### Disallow usage of unknown DOM property (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-unknown-property**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unknown-property.md)

### Disallow use of optional chaining in contexts where the `undefined` value is not allowed (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-unsafe-optional-chaining**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining)

### Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **prefer-object-spread**. [📖 Docs](https://eslint.org/docs/latest/rules/prefer-object-spread)

### Disallow using string references (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-string-refs**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-string-refs.md)

### Disallow variables used in JSX to be incorrectly marked as unused (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **jsx-uses-vars**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-vars.md)

### Disallow when a DOM element is using both children and dangerouslySetInnerHTML (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-danger-with-children**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-danger-with-children.md)

### Enforce a maximum number of lines per file (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **max-lines**. [📖 Docs](https://eslint.org/docs/latest/rules/max-lines)

### Enforce camelcase naming convention (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **camelcase**. [📖 Docs](https://eslint.org/docs/latest/rules/camelcase)

### Enforce comparing `typeof` expressions against valid strings (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **valid-typeof**. [📖 Docs](https://eslint.org/docs/latest/rules/valid-typeof)

### Enforce consistent brace style for all control statements (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **curly**. [📖 Docs](https://eslint.org/docs/latest/rules/curly)

### Enforce ES5 or ES6 class for returning value in render function (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **require-render-return**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/require-render-return.md)

### enforces the Rules of Hooks (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **rules-of-hooks**, from _react-hooks_ plugin. [📖 Docs](https://reactjs.org/docs/hooks-rules.html)

### Require `let` or `const` instead of `var` (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **no-var**. [📖 Docs](https://eslint.org/docs/latest/rules/no-var)

### Require calls to `isNaN()` when checking for `NaN` (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **use-isnan**. [📖 Docs](https://eslint.org/docs/latest/rules/use-isnan)

### Require or disallow "Yoda" conditions (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **yoda**. [📖 Docs](https://eslint.org/docs/latest/rules/yoda)

### Require using arrow functions for callbacks (ESLint)

🟩 <b>passed</b> (score: 100)

ESLint rule **prefer-arrow-callback**. [📖 Docs](https://eslint.org/docs/latest/rules/prefer-arrow-callback)

### First Contentful Paint (Lighthouse)

🟨 <b>1.2 s</b> (score: 76)

First Contentful Paint marks the time at which the first text or image is painted. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/)

### Largest Contentful Paint (Lighthouse)

🟨 <b>1.5 s</b> (score: 81)

Largest Contentful Paint marks the time at which the largest text or image is painted. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/)

### Speed Index (Lighthouse)

🟩 <b>1.2 s</b> (score: 93)

Speed Index shows how quickly the contents of a page are visibly populated. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/speed-index/)

### Cumulative Layout Shift (Lighthouse)

🟩 <b>0</b> (score: 100)

Cumulative Layout Shift measures the movement of visible elements within the viewport. [📖 Docs](https://web.dev/cls/)

### Total Blocking Time (Lighthouse)

🟩 <b>0 ms</b> (score: 100)

Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/)



## About

Report was created by [Code PushUp](https://github.com/flowup/quality-metrics-cli#readme) on Wed, Sep 15, 2021, 12:00 AM UTC.

|Commit|Version|Duration|Plugins|Categories|Audits|
|:--|:--:|:--:|:--:|:--:|:--:|
|Minor fixes (abcdef0123456789abcdef0123456789abcdef01)|`0.0.1`|1.65 s|2|0|52|

The following plugins were run:

|Plugin|Audits|Version|Duration|
|:--|:--:|:--:|:--:|
|ESLint|47|`0.1.0`|368 ms|
|Lighthouse|5|`0.1.0`|1.23 s|

Made with ❤ by [Code PushUp](https://github.com/flowup/quality-metrics-cli#readme)