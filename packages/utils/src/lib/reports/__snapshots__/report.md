# Code PushUp report

| 🏷 Category                       |  ⭐ Score  | 🛡 Audits |
| :-------------------------------- | :-------: | :-------: |
| [Performance](#performance)       | 🟢 **92** |     8     |
| [Bug prevention](#bug-prevention) | 🟡 **68** |    16     |
| [Code style](#code-style)         | 🟡 **54** |    13     |

## 🏷 Categories

### Performance

Performance metrics [📖 Docs](https://developers.google.com/web/fundamentals/performance)

🟢 Score: **92**

- 🟥 [Disallow missing `key` props in iterators/collection literals](#disallow-missing-key-props-in-iterators-collection-literals-eslint) (_ESLint_) - **1 warning**
- 🟡 Maximum lines limitation (_ESLint_)
  - 🟥 [Enforce a maximum number of lines of code in a function](#enforce-a-maximum-number-of-lines-of-code-in-a-function-eslint) - **1 warning**
  - 🟩 [Enforce a maximum number of lines per file](#enforce-a-maximum-number-of-lines-per-file-eslint) - **passed**
- 🟢 Performance (_Lighthouse_)
  - 🟨 [First Contentful Paint](#first-contentful-paint-lighthouse) - **1.2 s**
  - 🟨 [Largest Contentful Paint](#largest-contentful-paint-lighthouse) - **1.5 s**
  - 🟩 [Speed Index](#speed-index-lighthouse) - **1.2 s**
  - 🟩 [Total Blocking Time](#total-blocking-time-lighthouse) - **0 ms**
  - 🟩 [Cumulative Layout Shift](#cumulative-layout-shift-lighthouse) - **0**

### Bug prevention

🟡 Score: **68**

- 🟥 [verifies the list of dependencies for Hooks like useEffect and similar](#verifies-the-list-of-dependencies-for-hooks-like-useeffect-and-similar-eslint) (_ESLint_) - **2 warnings**
- 🟥 [Disallow missing `key` props in iterators/collection literals](#disallow-missing-key-props-in-iterators-collection-literals-eslint) (_ESLint_) - **1 warning**
- 🟥 [Disallow missing props validation in a React component definition](#disallow-missing-props-validation-in-a-react-component-definition-eslint) (_ESLint_) - **6 warnings**
- 🟥 [Require the use of `===` and `!==`](#require-the-use-of--and--eslint) (_ESLint_) - **1 warning**
- 🟩 [enforces the Rules of Hooks](#enforces-the-rules-of-hooks-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow assignment operators in conditional expressions](#disallow-assignment-operators-in-conditional-expressions-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow invalid regular expression strings in `RegExp` constructors](#disallow-invalid-regular-expression-strings-in-regexp-constructors-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow loops with a body that allows only one iteration](#disallow-loops-with-a-body-that-allows-only-one-iteration-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow missing React when using JSX](#disallow-missing-react-when-using-jsx-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow negating the left operand of relational operators](#disallow-negating-the-left-operand-of-relational-operators-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow reassigning `const` variables](#disallow-reassigning-const-variables-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow the use of `debugger`](#disallow-the-use-of-debugger-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow the use of undeclared variables unless mentioned in `/*global */` comments](#disallow-the-use-of-undeclared-variables-unless-mentioned-in--global---comments-eslint) (_ESLint_) - **passed**
- 🟩 [Disallow use of optional chaining in contexts where the `undefined` value is not allowed](#disallow-use-of-optional-chaining-in-contexts-where-the-undefined-value-is-not-allowed-eslint) (_ESLint_) - **passed**
- 🟩 [Enforce comparing `typeof` expressions against valid strings](#enforce-comparing-typeof-expressions-against-valid-strings-eslint) (_ESLint_) - **passed**
- 🟩 [Require calls to `isNaN()` when checking for `NaN`](#require-calls-to-isnan-when-checking-for-nan-eslint) (_ESLint_) - **passed**

### Code style

🟡 Score: **54**

- 🟥 [Require or disallow method and property shorthand syntax for object literals](#require-or-disallow-method-and-property-shorthand-syntax-for-object-literals-eslint) (_ESLint_) - **3 warnings**
- 🟥 [Disallow unused variables](#disallow-unused-variables-eslint) (_ESLint_) - **1 warning**
- 🟥 [Enforce a maximum number of lines of code in a function](#enforce-a-maximum-number-of-lines-of-code-in-a-function-eslint) (_ESLint_) - **1 warning**
- 🟥 [Require `const` declarations for variables that are never reassigned after declared](#require-const-declarations-for-variables-that-are-never-reassigned-after-declared-eslint) (_ESLint_) - **1 warning**
- 🟥 [Require braces around arrow function bodies](#require-braces-around-arrow-function-bodies-eslint) (_ESLint_) - **1 warning**
- 🟥 [Require the use of `===` and `!==`](#require-the-use-of--and--eslint) (_ESLint_) - **1 warning**
- 🟩 [Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead](#disallow-using-objectassign-with-an-object-literal-as-the-first-argument-and-prefer-the-use-of-object-spread-instead-eslint) (_ESLint_) - **passed**
- 🟩 [Enforce a maximum number of lines per file](#enforce-a-maximum-number-of-lines-per-file-eslint) (_ESLint_) - **passed**
- 🟩 [Enforce camelcase naming convention](#enforce-camelcase-naming-convention-eslint) (_ESLint_) - **passed**
- 🟩 [Enforce consistent brace style for all control statements](#enforce-consistent-brace-style-for-all-control-statements-eslint) (_ESLint_) - **passed**
- 🟩 [Require `let` or `const` instead of `var`](#require-let-or-const-instead-of-var-eslint) (_ESLint_) - **passed**
- 🟩 [Require or disallow "Yoda" conditions](#require-or-disallow-yoda-conditions-eslint) (_ESLint_) - **passed**
- 🟩 [Require using arrow functions for callbacks](#require-using-arrow-functions-for-callbacks-eslint) (_ESLint_) - **passed**

## 🛡️ Audits

### Disallow missing props validation in a React component definition (ESLint)

<details>
<summary>🟥 <b>6 warnings</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                          | Source                          | Location |
| :----------: | :----------------------------------------------- | :------------------------------ | :------: |
| ⚠️ _warning_ | 'onCreate' is missing in props validation        | `src/components/CreateTodo.jsx` |    15    |
| ⚠️ _warning_ | 'setQuery' is missing in props validation        | `src/components/TodoFilter.jsx` |    10    |
| ⚠️ _warning_ | 'setHideComplete' is missing in props validation | `src/components/TodoFilter.jsx` |    18    |
| ⚠️ _warning_ | 'todos' is missing in props validation           | `src/components/TodoList.jsx`   |    6     |
| ⚠️ _warning_ | 'todos.map' is missing in props validation       | `src/components/TodoList.jsx`   |    6     |
| ⚠️ _warning_ | 'onEdit' is missing in props validation          | `src/components/TodoList.jsx`   |    13    |

</details>

ESLint rule **prop-types**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/prop-types.md)

### Disallow variable declarations from shadowing variables declared in the outer scope (ESLint)

<details>
<summary>🟥 <b>3 warnings</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                                            | Source                  | Location |
| :----------: | :----------------------------------------------------------------- | :---------------------- | :------: |
| ⚠️ _warning_ | 'data' is already declared in the upper scope on line 5 column 10. | `src/hooks/useTodos.js` |    11    |
| ⚠️ _warning_ | 'data' is already declared in the upper scope on line 5 column 10. | `src/hooks/useTodos.js` |    29    |
| ⚠️ _warning_ | 'data' is already declared in the upper scope on line 5 column 10. | `src/hooks/useTodos.js` |    41    |

</details>

ESLint rule **no-shadow**. [📖 Docs](https://eslint.org/docs/latest/rules/no-shadow)

### Require or disallow method and property shorthand syntax for object literals (ESLint)

<details>
<summary>🟥 <b>3 warnings</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                      | Source                  | Location |
| :----------: | :--------------------------- | :---------------------- | :------: |
| ⚠️ _warning_ | Expected property shorthand. | `src/hooks/useTodos.js` |    19    |
| ⚠️ _warning_ | Expected property shorthand. | `src/hooks/useTodos.js` |    32    |
| ⚠️ _warning_ | Expected property shorthand. | `src/hooks/useTodos.js` |    33    |

</details>

ESLint rule **object-shorthand**. [📖 Docs](https://eslint.org/docs/latest/rules/object-shorthand)

### verifies the list of dependencies for Hooks like useEffect and similar (ESLint)

<details>
<summary>🟥 <b>2 warnings</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                                                                                                  | Source                  | Location |
| :----------: | :----------------------------------------------------------------------------------------------------------------------- | :---------------------- | :------: |
| ⚠️ _warning_ | React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies? | `src/hooks/useTodos.js` |    17    |
| ⚠️ _warning_ | React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies? | `src/hooks/useTodos.js` |    40    |

</details>

ESLint rule **exhaustive-deps**, from _react-hooks_ plugin. [📖 Docs](https://github.com/facebook/react/issues/14920)

### Disallow missing `key` props in iterators/collection literals (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                    | Source                        | Location |
| :----------: | :----------------------------------------- | :---------------------------- | :------: |
| ⚠️ _warning_ | Missing "key" prop for element in iterator | `src/components/TodoList.jsx` |   7-28   |

</details>

ESLint rule **jsx-key**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md)

### Disallow unused variables (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                       | Source        | Location |
| :----------: | :-------------------------------------------- | :------------ | :------: |
| ⚠️ _warning_ | 'loading' is assigned a value but never used. | `src/App.jsx` |    8     |

</details>

ESLint rule **no-unused-vars**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unused-vars)

### Enforce a maximum number of lines of code in a function (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                                        | Source                  | Location |
| :----------: | :------------------------------------------------------------- | :---------------------- | :------: |
| ⚠️ _warning_ | Arrow function has too many lines (71). Maximum allowed is 50. | `src/hooks/useTodos.js` |   3-73   |

</details>

ESLint rule **max-lines-per-function**. [📖 Docs](https://eslint.org/docs/latest/rules/max-lines-per-function)

### Require `const` declarations for variables that are never reassigned after declared (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                          | Source          | Location |
| :----------: | :----------------------------------------------- | :-------------- | :------: |
| ⚠️ _warning_ | 'root' is never reassigned. Use 'const' instead. | `src/index.jsx` |    5     |

</details>

ESLint rule **prefer-const**. [📖 Docs](https://eslint.org/docs/latest/rules/prefer-const)

### Require braces around arrow function bodies (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                                                                                                | Source                          | Location |
| :----------: | :----------------------------------------------------------------------------------------------------- | :------------------------------ | :------: |
| ⚠️ _warning_ | Unexpected block statement surrounding arrow body; move the returned value immediately after the `=>`. | `src/components/TodoFilter.jsx` |   3-25   |

</details>

ESLint rule **arrow-body-style**. [📖 Docs](https://eslint.org/docs/latest/rules/arrow-body-style)

### Require the use of `===` and `!==` (ESLint)

<details>
<summary>🟥 <b>1 warning</b> (score: 0)</summary>

#### Issues

|   Severity   | Message                              | Source                  | Location |
| :----------: | :----------------------------------- | :---------------------- | :------: |
| ⚠️ _warning_ | Expected '===' and instead saw '=='. | `src/hooks/useTodos.js` |    41    |

</details>

ESLint rule **eqeqeq**. [📖 Docs](https://eslint.org/docs/latest/rules/eqeqeq)

### Disallow `target="_blank"` attribute without `rel="noreferrer"` (ESLint)

🟩 **passed** (score: 100)

ESLint rule **jsx-no-target-blank**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-target-blank.md)

### Disallow assignment operators in conditional expressions (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-cond-assign**. [📖 Docs](https://eslint.org/docs/latest/rules/no-cond-assign)

### Disallow comments from being inserted as text nodes (ESLint)

🟩 **passed** (score: 100)

ESLint rule **jsx-no-comment-textnodes**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-comment-textnodes.md)

### Disallow direct mutation of this.state (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-direct-mutation-state**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-direct-mutation-state.md)

### Disallow duplicate properties in JSX (ESLint)

🟩 **passed** (score: 100)

ESLint rule **jsx-no-duplicate-props**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-duplicate-props.md)

### Disallow invalid regular expression strings in `RegExp` constructors (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-invalid-regexp**. [📖 Docs](https://eslint.org/docs/latest/rules/no-invalid-regexp)

### Disallow loops with a body that allows only one iteration (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-unreachable-loop**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unreachable-loop)

### Disallow missing displayName in a React component definition (ESLint)

🟩 **passed** (score: 100)

ESLint rule **display-name**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/display-name.md)

### Disallow missing React when using JSX (ESLint)

🟩 **passed** (score: 100)

ESLint rule **react-in-jsx-scope**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/react-in-jsx-scope.md)

### Disallow negating the left operand of relational operators (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-unsafe-negation**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unsafe-negation)

### Disallow passing of children as props (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-children-prop**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-children-prop.md)

### Disallow React to be incorrectly marked as unused (ESLint)

🟩 **passed** (score: 100)

ESLint rule **jsx-uses-react**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-react.md)

### Disallow reassigning `const` variables (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-const-assign**. [📖 Docs](https://eslint.org/docs/latest/rules/no-const-assign)

### Disallow the use of `debugger` (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-debugger**. [📖 Docs](https://eslint.org/docs/latest/rules/no-debugger)

### Disallow the use of undeclared variables unless mentioned in `/*global */` comments (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-undef**. [📖 Docs](https://eslint.org/docs/latest/rules/no-undef)

### Disallow undeclared variables in JSX (ESLint)

🟩 **passed** (score: 100)

ESLint rule **jsx-no-undef**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-undef.md)

### Disallow unescaped HTML entities from appearing in markup (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-unescaped-entities**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unescaped-entities.md)

### Disallow usage of deprecated methods (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-deprecated**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-deprecated.md)

### Disallow usage of findDOMNode (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-find-dom-node**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-find-dom-node.md)

### Disallow usage of isMounted (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-is-mounted**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-is-mounted.md)

### Disallow usage of the return value of ReactDOM.render (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-render-return-value**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-render-return-value.md)

### Disallow usage of unknown DOM property (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-unknown-property**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unknown-property.md)

### Disallow use of optional chaining in contexts where the `undefined` value is not allowed (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-unsafe-optional-chaining**. [📖 Docs](https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining)

### Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead (ESLint)

🟩 **passed** (score: 100)

ESLint rule **prefer-object-spread**. [📖 Docs](https://eslint.org/docs/latest/rules/prefer-object-spread)

### Disallow using string references (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-string-refs**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-string-refs.md)

### Disallow variables used in JSX to be incorrectly marked as unused (ESLint)

🟩 **passed** (score: 100)

ESLint rule **jsx-uses-vars**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-vars.md)

### Disallow when a DOM element is using both children and dangerouslySetInnerHTML (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-danger-with-children**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-danger-with-children.md)

### Enforce a maximum number of lines per file (ESLint)

🟩 **passed** (score: 100)

ESLint rule **max-lines**. [📖 Docs](https://eslint.org/docs/latest/rules/max-lines)

### Enforce camelcase naming convention (ESLint)

🟩 **passed** (score: 100)

ESLint rule **camelcase**. [📖 Docs](https://eslint.org/docs/latest/rules/camelcase)

### Enforce comparing `typeof` expressions against valid strings (ESLint)

🟩 **passed** (score: 100)

ESLint rule **valid-typeof**. [📖 Docs](https://eslint.org/docs/latest/rules/valid-typeof)

### Enforce consistent brace style for all control statements (ESLint)

🟩 **passed** (score: 100)

ESLint rule **curly**. [📖 Docs](https://eslint.org/docs/latest/rules/curly)

### Enforce ES5 or ES6 class for returning value in render function (ESLint)

🟩 **passed** (score: 100)

ESLint rule **require-render-return**, from _react_ plugin. [📖 Docs](https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/require-render-return.md)

### enforces the Rules of Hooks (ESLint)

🟩 **passed** (score: 100)

ESLint rule **rules-of-hooks**, from _react-hooks_ plugin. [📖 Docs](https://reactjs.org/docs/hooks-rules.html)

### Require `let` or `const` instead of `var` (ESLint)

🟩 **passed** (score: 100)

ESLint rule **no-var**. [📖 Docs](https://eslint.org/docs/latest/rules/no-var)

### Require calls to `isNaN()` when checking for `NaN` (ESLint)

🟩 **passed** (score: 100)

ESLint rule **use-isnan**. [📖 Docs](https://eslint.org/docs/latest/rules/use-isnan)

### Require or disallow "Yoda" conditions (ESLint)

🟩 **passed** (score: 100)

ESLint rule **yoda**. [📖 Docs](https://eslint.org/docs/latest/rules/yoda)

### Require using arrow functions for callbacks (ESLint)

🟩 **passed** (score: 100)

ESLint rule **prefer-arrow-callback**. [📖 Docs](https://eslint.org/docs/latest/rules/prefer-arrow-callback)

### Minimize third-party usage (Lighthouse)

🟥 **Third-party code blocked the main thread for 6,850 ms** (score: 0)

Third-party code can significantly impact load performance. Limit the number of redundant third-party providers and try to load third-party code after your page has primarily finished loading. [Learn how to minimize third-party impact](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/loading-third-party-javascript/).

### First Contentful Paint (Lighthouse)

🟨 **1.2 s** (score: 76)

First Contentful Paint marks the time at which the first text or image is painted. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/)

### Largest Contentful Paint (Lighthouse)

🟨 **1.5 s** (score: 81)

Largest Contentful Paint marks the time at which the largest text or image is painted. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/)

### Speed Index (Lighthouse)

🟩 **1.2 s** (score: 93)

Speed Index shows how quickly the contents of a page are visibly populated. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/speed-index/)

### Cumulative Layout Shift (Lighthouse)

🟩 **0** (score: 100)

Cumulative Layout Shift measures the movement of visible elements within the viewport. [📖 Docs](https://web.dev/cls/)

### Total Blocking Time (Lighthouse)

🟩 **0 ms** (score: 100)

Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [📖 Docs](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/)

## About

Report was created by [Code PushUp](https://github.com/code-pushup/cli#readme) on Wed, Oct 18, 2023, 7:49 AM UTC.

| Plugin     | Audits | Version | Duration |
| :--------- | :----: | :-----: | -------: |
| ESLint     |   47   | `0.1.0` |   368 ms |
| Lighthouse |   6    | `0.1.0` |   1.23 s |

| Commit                                                 | Version | Duration | Plugins | Categories | Audits |
| :----------------------------------------------------- | :-----: | -------: | :-----: | :--------: | :----: |
| Minor fixes (abcdef0123456789abcdef0123456789abcdef01) | `0.0.1` |   1.65 s |    2    |     3      |   53   |

---

Made with ❤ by [Code PushUp](https://github.com/code-pushup/cli#readme)
