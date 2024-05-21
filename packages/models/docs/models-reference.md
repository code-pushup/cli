# Code PushUp models reference

## AuditDetails

Detailed information

_Object containing the following properties:_

| Property | Description               | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :------- | :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issues` | List of findings          | _Array of [Issue](#issue) items_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `table`  | Table of related findings | _Object with properties:_<ul><li>`title`: `string` - Display title for table</li><li>`columns`: _Array of [TableAlignment](#tablealignment) items_</li><li>`rows`: _Array of [TableRowPrimitive](#tablerowprimitive) items_</li></ul> _or_ _Object with properties:_<ul><li>`title`: `string` - Display title for table</li><li>`columns`: _Array of [TableAlignment](#tablealignment) items_ _or_ _Array of [TableColumnObject](#tablecolumnobject) items_</li><li>`rows`: _Array of [TableRowObject](#tablerowobject) items_</li></ul> |

_All properties are optional._

## AuditDiff

_Object containing the following properties:_

| Property                 | Description                          | Type                                                                                                                                                                                                                                                                                                                 |
| :----------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`slug`** (\*)          | Unique ID (human-readable, URL-safe) | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_)                                                                                                                                                                                                                                                    |
| **`title`** (\*)         | Descriptive name                     | `string` (_max length: 256_)                                                                                                                                                                                                                                                                                         |
| `docsUrl`                | Documentation site                   | `string` (_url_) (_optional_) _or_ `''`                                                                                                                                                                                                                                                                              |
| **`scores`** (\*)        | Score comparison                     | _Object with properties:_<ul><li>`before`: `number` (_≥0, ≤1_) - Value between 0 and 1 (source commit)</li><li>`after`: `number` (_≥0, ≤1_) - Value between 0 and 1 (target commit)</li><li>`diff`: `number` (_≥-1, ≤1_) - Score change (`scores.after - scores.before`)</li></ul>                                   |
| **`plugin`** (\*)        | Plugin which defines it              | _Object with properties:_<ul><li>`slug`: `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) - Unique plugin slug within core config</li><li>`title`: `string` (_max length: 256_) - Descriptive name</li><li>`docsUrl`: `string` (_url_) (_optional_) _or_ `''` - Plugin documentation site</li></ul> |
| **`values`** (\*)        | Audit `value` comparison             | _Object with properties:_<ul><li>`before`: `number` (_int, ≥0_) - Raw numeric value (source commit)</li><li>`after`: `number` (_int, ≥0_) - Raw numeric value (target commit)</li><li>`diff`: `number` (_int_) - Value change (`values.after - values.before`)</li></ul>                                             |
| **`displayValues`** (\*) | Audit `displayValue` comparison      | _Object with properties:_<ul><li>`before`: `string` - Formatted value (e.g. '0.9 s', '2.1 MB') (source commit)</li><li>`after`: `string` - Formatted value (e.g. '0.9 s', '2.1 MB') (target commit)</li></ul>                                                                                                        |

_(\*) Required._

## AuditOutput

Audit information

_Object containing the following properties:_

| Property         | Description                              | Type                                                              |
| :--------------- | :--------------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)  | Reference to audit                       | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| `displayValue`   | Formatted value (e.g. '0.9 s', '2.1 MB') | `string`                                                          |
| **`value`** (\*) | Raw numeric value                        | `number` (_int, ≥0_)                                              |
| **`score`** (\*) | Value between 0 and 1                    | `number` (_≥0, ≤1_)                                               |
| `details`        | Detailed information                     | [AuditDetails](#auditdetails)                                     |

_(\*) Required._

## AuditOutputs

_Array of [AuditOutput](#auditoutput) items._

## AuditReport

_Object containing the following properties:_

| Property         | Description                              | Type                                                              |
| :--------------- | :--------------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)  | Reference to audit                       | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`title`** (\*) | Descriptive name                         | `string` (_max length: 256_)                                      |
| `description`    | Description (markdown)                   | `string` (_max length: 65536_)                                    |
| `docsUrl`        | Link to documentation (rationale)        | `string` (_url_) (_optional_) _or_ `''`                           |
| `displayValue`   | Formatted value (e.g. '0.9 s', '2.1 MB') | `string`                                                          |
| **`value`** (\*) | Raw numeric value                        | `number` (_int, ≥0_)                                              |
| **`score`** (\*) | Value between 0 and 1                    | `number` (_≥0, ≤1_)                                               |
| `details`        | Detailed information                     | [AuditDetails](#auditdetails)                                     |

_(\*) Required._

## AuditResult

_Object containing the following properties:_

| Property          | Description                              | Type                                                                                                                                                                                                                                                                                                                 |
| :---------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`slug`** (\*)   | Unique ID (human-readable, URL-safe)     | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_)                                                                                                                                                                                                                                                    |
| **`title`** (\*)  | Descriptive name                         | `string` (_max length: 256_)                                                                                                                                                                                                                                                                                         |
| `docsUrl`         | Documentation site                       | `string` (_url_) (_optional_) _or_ `''`                                                                                                                                                                                                                                                                              |
| **`plugin`** (\*) | Plugin which defines it                  | _Object with properties:_<ul><li>`slug`: `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) - Unique plugin slug within core config</li><li>`title`: `string` (_max length: 256_) - Descriptive name</li><li>`docsUrl`: `string` (_url_) (_optional_) _or_ `''` - Plugin documentation site</li></ul> |
| **`score`** (\*)  | Value between 0 and 1                    | `number` (_≥0, ≤1_)                                                                                                                                                                                                                                                                                                  |
| **`value`** (\*)  | Raw numeric value                        | `number` (_int, ≥0_)                                                                                                                                                                                                                                                                                                 |
| `displayValue`    | Formatted value (e.g. '0.9 s', '2.1 MB') | `string`                                                                                                                                                                                                                                                                                                             |

_(\*) Required._

## Audit

_Object containing the following properties:_

| Property         | Description                       | Type                                                              |
| :--------------- | :-------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)  | ID (unique within plugin)         | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`title`** (\*) | Descriptive name                  | `string` (_max length: 256_)                                      |
| `description`    | Description (markdown)            | `string` (_max length: 65536_)                                    |
| `docsUrl`        | Link to documentation (rationale) | `string` (_url_) (_optional_) _or_ `''`                           |

_(\*) Required._

## CategoryConfig

_Object containing the following properties:_

| Property         | Description                                                                | Type                                                              |
| :--------------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)  | Human-readable unique ID, e.g. "performance"                               | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`refs`** (\*)  |                                                                            | _Array of at least 1 [CategoryRef](#categoryref) items_           |
| **`title`** (\*) | Category Title                                                             | `string` (_max length: 256_)                                      |
| `description`    | Category description                                                       | `string` (_max length: 65536_)                                    |
| `docsUrl`        | Category docs URL                                                          | `string` (_url_) (_optional_) _or_ `''`                           |
| `isBinary`       | Is this a binary category (i.e. only a perfect score considered a "pass")? | `boolean`                                                         |

_(\*) Required._

## CategoryDiff

_Object containing the following properties:_

| Property          | Description                          | Type                                                                                                                                                                                                                                                                               |
| :---------------- | :----------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`slug`** (\*)   | Unique ID (human-readable, URL-safe) | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_)                                                                                                                                                                                                                  |
| **`title`** (\*)  | Descriptive name                     | `string` (_max length: 256_)                                                                                                                                                                                                                                                       |
| `docsUrl`         | Documentation site                   | `string` (_url_) (_optional_) _or_ `''`                                                                                                                                                                                                                                            |
| **`scores`** (\*) | Score comparison                     | _Object with properties:_<ul><li>`before`: `number` (_≥0, ≤1_) - Value between 0 and 1 (source commit)</li><li>`after`: `number` (_≥0, ≤1_) - Value between 0 and 1 (target commit)</li><li>`diff`: `number` (_≥-1, ≤1_) - Score change (`scores.after - scores.before`)</li></ul> |

_(\*) Required._

## CategoryRef

_Object containing the following properties:_

| Property          | Description                                                        | Type                                                              |
| :---------------- | :----------------------------------------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)   | Slug of an audit or group (depending on `type`)                    | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`weight`** (\*) | Weight used to calculate score                                     | `number` (_int, ≥0_)                                              |
| **`type`** (\*)   | Discriminant for reference kind, affects where `slug` is looked up | `'audit' \| 'group'`                                              |
| **`plugin`** (\*) | Plugin slug (plugin should contain referenced audit or group)      | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |

_(\*) Required._

## CategoryResult

_Object containing the following properties:_

| Property         | Description                          | Type                                                              |
| :--------------- | :----------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)  | Unique ID (human-readable, URL-safe) | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`title`** (\*) | Descriptive name                     | `string` (_max length: 256_)                                      |
| `docsUrl`        | Documentation site                   | `string` (_url_) (_optional_) _or_ `''`                           |
| **`score`** (\*) | Value between 0 and 1                | `number` (_≥0, ≤1_)                                               |

_(\*) Required._

## Commit

Git commit

_Object containing the following properties:_

| Property           | Description                            | Type                                  |
| :----------------- | :------------------------------------- | :------------------------------------ |
| **`hash`** (\*)    | Commit SHA (full)                      | `string` (_regex: `/^[\da-f]{40}$/`_) |
| **`message`** (\*) | Commit message                         | `string`                              |
| **`date`** (\*)    | Date and time when commit was authored | `Date` (_nullable_)                   |
| **`author`** (\*)  | Commit author name                     | `string`                              |

_(\*) Required._

## CoreConfig

_Object containing the following properties:_

| Property           | Description                                                          | Type                                                      |
| :----------------- | :------------------------------------------------------------------- | :-------------------------------------------------------- |
| **`plugins`** (\*) | List of plugins to be used (official, community-provided, or custom) | _Array of at least 1 [PluginConfig](#pluginconfig) items_ |
| `persist`          |                                                                      | [PersistConfig](#persistconfig)                           |
| `upload`           |                                                                      | [UploadConfig](#uploadconfig)                             |
| `categories`       |                                                                      | _Array of [CategoryConfig](#categoryconfig) items_        |

_(\*) Required._

## Format

_Enum string, one of the following possible values:_

- `'json'`
- `'md'`

## GroupDiff

_Object containing the following properties:_

| Property          | Description                          | Type                                                                                                                                                                                                                                                                                                                 |
| :---------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`slug`** (\*)   | Unique ID (human-readable, URL-safe) | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_)                                                                                                                                                                                                                                                    |
| **`title`** (\*)  | Descriptive name                     | `string` (_max length: 256_)                                                                                                                                                                                                                                                                                         |
| `docsUrl`         | Documentation site                   | `string` (_url_) (_optional_) _or_ `''`                                                                                                                                                                                                                                                                              |
| **`scores`** (\*) | Score comparison                     | _Object with properties:_<ul><li>`before`: `number` (_≥0, ≤1_) - Value between 0 and 1 (source commit)</li><li>`after`: `number` (_≥0, ≤1_) - Value between 0 and 1 (target commit)</li><li>`diff`: `number` (_≥-1, ≤1_) - Score change (`scores.after - scores.before`)</li></ul>                                   |
| **`plugin`** (\*) | Plugin which defines it              | _Object with properties:_<ul><li>`slug`: `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) - Unique plugin slug within core config</li><li>`title`: `string` (_max length: 256_) - Descriptive name</li><li>`docsUrl`: `string` (_url_) (_optional_) _or_ `''` - Plugin documentation site</li></ul> |

_(\*) Required._

## GroupRef

Weighted reference to a group

_Object containing the following properties:_

| Property          | Description                                                     | Type                                                              |
| :---------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)   | Reference slug to a group within this plugin (e.g. 'max-lines') | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`weight`** (\*) | Weight used to calculate score                                  | `number` (_int, ≥0_)                                              |

_(\*) Required._

## GroupResult

_Object containing the following properties:_

| Property          | Description                          | Type                                                                                                                                                                                                                                                                                                                 |
| :---------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`slug`** (\*)   | Unique ID (human-readable, URL-safe) | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_)                                                                                                                                                                                                                                                    |
| **`title`** (\*)  | Descriptive name                     | `string` (_max length: 256_)                                                                                                                                                                                                                                                                                         |
| `docsUrl`         | Documentation site                   | `string` (_url_) (_optional_) _or_ `''`                                                                                                                                                                                                                                                                              |
| **`plugin`** (\*) | Plugin which defines it              | _Object with properties:_<ul><li>`slug`: `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) - Unique plugin slug within core config</li><li>`title`: `string` (_max length: 256_) - Descriptive name</li><li>`docsUrl`: `string` (_url_) (_optional_) _or_ `''` - Plugin documentation site</li></ul> |
| **`score`** (\*)  | Value between 0 and 1                | `number` (_≥0, ≤1_)                                                                                                                                                                                                                                                                                                  |

_(\*) Required._

## Group

_Object containing the following properties:_

| Property         | Description                                  | Type                                                              |
| :--------------- | :------------------------------------------- | :---------------------------------------------------------------- |
| **`slug`** (\*)  | Human-readable unique ID, e.g. "performance" | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`refs`** (\*)  |                                              | _Array of at least 1 [GroupRef](#groupref) items_                 |
| **`title`** (\*) | Descriptive name for the group               | `string` (_max length: 256_)                                      |
| `description`    | Description of the group (markdown)          | `string` (_max length: 65536_)                                    |
| `docsUrl`        | Group documentation site                     | `string` (_url_) (_optional_) _or_ `''`                           |

_(\*) Required._

## Issue

Issue information

_Object containing the following properties:_

| Property            | Description               | Type                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :------------------ | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`message`** (\*)  | Descriptive error message | `string` (_max length: 1024_)                                                                                                                                                                                                                                                                                                                                                                                                  |
| **`severity`** (\*) | Severity level            | [IssueSeverity](#issueseverity)                                                                                                                                                                                                                                                                                                                                                                                                |
| `source`            | Source file location      | _Object with properties:_<ul><li>`file`: `string` (_min length: 1_) - Relative path to source file in Git repo</li><li>`position`: _Object with properties:_<ul><li>`startLine`: `number` (_int, >0_) - Start line</li><li>`startColumn`: `number` (_int, >0_) - Start column</li><li>`endLine`: `number` (_int, >0_) - End line</li><li>`endColumn`: `number` (_int, >0_) - End column</li></ul> - Location in file</li></ul> |

_(\*) Required._

## IssueSeverity

Severity level

_Enum string, one of the following possible values:_

- `'info'`
- `'warning'`
- `'error'`

## MaterialIcon

Icon from VSCode Material Icons extension

_Enum string, one of the following possible values:_

<details>
<summary><i>Expand for full list of 839 values</i></summary>

- `'git'`
- `'yaml'`
- `'xml'`
- `'matlab'`
- `'settings'`
- `'shaderlab'`
- `'diff'`
- `'json'`
- `'blink'`
- `'java'`
- `'razor'`
- `'python'`
- `'mojo'`
- `'javascript'`
- `'typescript'`
- `'scala'`
- `'handlebars'`
- `'perl'`
- `'haxe'`
- `'puppet'`
- `'elixir'`
- `'livescript'`
- `'erlang'`
- `'twig'`
- `'julia'`
- `'elm'`
- `'purescript'`
- `'stylus'`
- `'nunjucks'`
- `'pug'`
- `'robot'`
- `'sass'`
- `'less'`
- `'css'`
- `'visualstudio'`
- `'angular'`
- `'graphql'`
- `'solidity'`
- `'autoit'`
- `'haml'`
- `'yang'`
- `'terraform'`
- `'applescript'`
- `'cake'`
- `'cucumber'`
- `'nim'`
- `'apiblueprint'`
- `'riot'`
- `'postcss'`
- `'coldfusion'`
- `'haskell'`
- `'dhall'`
- `'cabal'`
- `'nix'`
- `'ruby'`
- `'slim'`
- `'php'`
- `'php_elephant'`
- `'php_elephant_pink'`
- `'hack'`
- `'react'`
- `'mjml'`
- `'processing'`
- `'hcl'`
- `'go'`
- `'go_gopher'`
- `'nodejs_alt'`
- `'django'`
- `'html'`
- `'godot'`
- `'godot-assets'`
- `'vim'`
- `'silverstripe'`
- `'prolog'`
- `'pawn'`
- `'reason'`
- `'sml'`
- `'tex'`
- `'salesforce'`
- `'sas'`
- `'docker'`
- `'table'`
- `'csharp'`
- `'console'`
- `'c'`
- `'cpp'`
- `'objective-c'`
- `'objective-cpp'`
- `'coffee'`
- `'fsharp'`
- `'editorconfig'`
- `'clojure'`
- `'groovy'`
- `'markdown'`
- `'jinja'`
- `'proto'`
- `'python-misc'`
- `'vue'`
- `'lua'`
- `'lib'`
- `'log'`
- `'jupyter'`
- `'document'`
- `'pdf'`
- `'powershell'`
- `'r'`
- `'rust'`
- `'database'`
- `'kusto'`
- `'lock'`
- `'svg'`
- `'swift'`
- `'react_ts'`
- `'search'`
- `'minecraft'`
- `'rescript'`
- `'otne'`
- `'twine'`
- `'grain'`
- `'lolcode'`
- `'idris'`
- `'chess'`
- `'gemini'`
- `'vlang'`
- `'wolframlanguage'`
- `'shader'`
- `'tree'`
- `'svelte'`
- `'dart'`
- `'cadence'`
- `'stylable'`
- `'hjson'`
- `'huff'`
- `'concourse'`
- `'blink_light'`
- `'jinja_light'`
- `'playwright'`
- `'sublime'`
- `'image'`
- `'routing'`
- `'typescript-def'`
- `'markojs'`
- `'astro'`
- `'vscode'`
- `'qsharp'`
- `'zip'`
- `'vala'`
- `'zig'`
- `'exe'`
- `'hex'`
- `'jar'`
- `'javaclass'`
- `'h'`
- `'hpp'`
- `'rc'`
- `'go-mod'`
- `'url'`
- `'gradle'`
- `'word'`
- `'certificate'`
- `'key'`
- `'font'`
- `'dll'`
- `'gemfile'`
- `'rubocop'`
- `'rubocop_light'`
- `'rspec'`
- `'arduino'`
- `'powerpoint'`
- `'video'`
- `'virtual'`
- `'vedic'`
- `'email'`
- `'audio'`
- `'raml'`
- `'xaml'`
- `'kotlin'`
- `'dart_generated'`
- `'actionscript'`
- `'mxml'`
- `'autohotkey'`
- `'flash'`
- `'swc'`
- `'cmake'`
- `'assembly'`
- `'semgrep'`
- `'vue-config'`
- `'nuxt'`
- `'ocaml'`
- `'odin'`
- `'javascript-map'`
- `'css-map'`
- `'test-ts'`
- `'test-jsx'`
- `'test-js'`
- `'angular-component'`
- `'angular-guard'`
- `'angular-service'`
- `'angular-pipe'`
- `'angular-directive'`
- `'angular-resolver'`
- `'smarty'`
- `'bucklescript'`
- `'merlin'`
- `'verilog'`
- `'mathematica'`
- `'vercel'`
- `'vercel_light'`
- `'verdaccio'`
- `'next'`
- `'next_light'`
- `'remix'`
- `'remix_light'`
- `'laravel'`
- `'vfl'`
- `'kl'`
- `'posthtml'`
- `'todo'`
- `'http'`
- `'restql'`
- `'kivy'`
- `'graphcool'`
- `'sbt'`
- `'webpack'`
- `'ionic'`
- `'gulp'`
- `'nodejs'`
- `'npm'`
- `'yarn'`
- `'android'`
- `'tune'`
- `'turborepo'`
- `'turborepo_light'`
- `'babel'`
- `'blitz'`
- `'contributing'`
- `'readme'`
- `'changelog'`
- `'architecture'`
- `'credits'`
- `'authors'`
- `'flow'`
- `'favicon'`
- `'karma'`
- `'bithound'`
- `'svgo'`
- `'appveyor'`
- `'travis'`
- `'codecov'`
- `'sonarcloud'`
- `'protractor'`
- `'fusebox'`
- `'heroku'`
- `'gitlab'`
- `'bower'`
- `'eslint'`
- `'conduct'`
- `'watchman'`
- `'aurelia'`
- `'auto'`
- `'auto_light'`
- `'mocha'`
- `'jenkins'`
- `'firebase'`
- `'figma'`
- `'rollup'`
- `'huff_light'`
- `'hardhat'`
- `'stylelint'`
- `'stylelint_light'`
- `'code-climate'`
- `'code-climate_light'`
- `'prettier'`
- `'renovate'`
- `'apollo'`
- `'nodemon'`
- `'webhint'`
- `'browserlist'`
- `'browserlist_light'`
- `'crystal'`
- `'crystal_light'`
- `'snyk'`
- `'drone'`
- `'drone_light'`
- `'cuda'`
- `'dotjs'`
- `'ejs'`
- `'sequelize'`
- `'gatsby'`
- `'wakatime'`
- `'wakatime_light'`
- `'circleci'`
- `'circleci_light'`
- `'cloudfoundry'`
- `'grunt'`
- `'jest'`
- `'storybook'`
- `'wepy'`
- `'fastlane'`
- `'hcl_light'`
- `'helm'`
- `'san'`
- `'wallaby'`
- `'stencil'`
- `'red'`
- `'makefile'`
- `'foxpro'`
- `'i18n'`
- `'webassembly'`
- `'semantic-release'`
- `'semantic-release_light'`
- `'bitbucket'`
- `'d'`
- `'mdx'`
- `'mdsvex'`
- `'ballerina'`
- `'racket'`
- `'bazel'`
- `'mint'`
- `'velocity'`
- `'azure-pipelines'`
- `'azure'`
- `'vagrant'`
- `'prisma'`
- `'abc'`
- `'asciidoc'`
- `'istanbul'`
- `'edge'`
- `'scheme'`
- `'lisp'`
- `'tailwindcss'`
- `'3d'`
- `'buildkite'`
- `'netlify'`
- `'netlify_light'`
- `'nest'`
- `'moon'`
- `'moonscript'`
- `'percy'`
- `'gitpod'`
- `'advpl_prw'`
- `'advpl_ptm'`
- `'advpl_tlpp'`
- `'advpl_include'`
- `'codeowners'`
- `'gcp'`
- `'disc'`
- `'fortran'`
- `'tcl'`
- `'liquid'`
- `'husky'`
- `'coconut'`
- `'tilt'`
- `'capacitor'`
- `'sketch'`
- `'adonis'`
- `'forth'`
- `'uml'`
- `'uml_light'`
- `'meson'`
- `'commitlint'`
- `'buck'`
- `'nrwl'`
- `'opam'`
- `'dune'`
- `'imba'`
- `'drawio'`
- `'pascal'`
- `'roadmap'`
- `'nuget'`
- `'command'`
- `'stryker'`
- `'denizenscript'`
- `'modernizr'`
- `'slug'`
- `'stitches'`
- `'stitches_light'`
- `'nginx'`
- `'replit'`
- `'rescript-interface'`
- `'snowpack'`
- `'snowpack_light'`
- `'brainfuck'`
- `'bicep'`
- `'cobol'`
- `'quasar'`
- `'dependabot'`
- `'pipeline'`
- `'vite'`
- `'vitest'`
- `'opa'`
- `'lerna'`
- `'windicss'`
- `'textlint'`
- `'lilypond'`
- `'chess_light'`
- `'sentry'`
- `'phpunit'`
- `'php-cs-fixer'`
- `'robots'`
- `'tsconfig'`
- `'tauri'`
- `'jsconfig'`
- `'maven'`
- `'ada'`
- `'serverless'`
- `'supabase'`
- `'ember'`
- `'horusec'`
- `'poetry'`
- `'pdm'`
- `'coala'`
- `'parcel'`
- `'dinophp'`
- `'teal'`
- `'template'`
- `'astyle'`
- `'lighthouse'`
- `'svgr'`
- `'rome'`
- `'cypress'`
- `'siyuan'`
- `'ndst'`
- `'plop'`
- `'tobi'`
- `'tobimake'`
- `'gleam'`
- `'pnpm'`
- `'pnpm_light'`
- `'gridsome'`
- `'steadybit'`
- `'caddy'`
- `'bun'`
- `'bun_light'`
- `'antlr'`
- `'pinejs'`
- `'nano-staged'`
- `'nano-staged_light'`
- `'taskfile'`
- `'craco'`
- `'gamemaker'`
- `'tldraw'`
- `'tldraw_light'`
- `'mercurial'`
- `'deno'`
- `'deno_light'`
- `'plastic'`
- `'typst'`
- `'unocss'`
- `'ifanr-cloud'`
- `'mermaid'`
- `'werf'`
- `'roblox'`
- `'panda'`
- `'biome'`
- `'esbuild'`
- `'spwn'`
- `'templ'`
- `'chrome'`
- `'stan'`
- `'abap'`
- `'lottie'`
- `'puppeteer'`
- `'apps-script'`
- `'pkl'`
- `'kubernetes'`
- `'file'`
- `'folder-robot'`
- `'folder-robot-open'`
- `'folder-src'`
- `'folder-src-open'`
- `'folder-dist'`
- `'folder-dist-open'`
- `'folder-css'`
- `'folder-css-open'`
- `'folder-sass'`
- `'folder-sass-open'`
- `'folder-images'`
- `'folder-images-open'`
- `'folder-scripts'`
- `'folder-scripts-open'`
- `'folder-node'`
- `'folder-node-open'`
- `'folder-javascript'`
- `'folder-javascript-open'`
- `'folder-json'`
- `'folder-json-open'`
- `'folder-font'`
- `'folder-font-open'`
- `'folder-bower'`
- `'folder-bower-open'`
- `'folder-test'`
- `'folder-test-open'`
- `'folder-jinja'`
- `'folder-jinja-open'`
- `'folder-jinja_light'`
- `'folder-jinja-open_light'`
- `'folder-markdown'`
- `'folder-markdown-open'`
- `'folder-pdm'`
- `'folder-pdm-open'`
- `'folder-php'`
- `'folder-php-open'`
- `'folder-phpmailer'`
- `'folder-phpmailer-open'`
- `'folder-sublime'`
- `'folder-sublime-open'`
- `'folder-docs'`
- `'folder-docs-open'`
- `'folder-git'`
- `'folder-git-open'`
- `'folder-github'`
- `'folder-github-open'`
- `'folder-gitlab'`
- `'folder-gitlab-open'`
- `'folder-vscode'`
- `'folder-vscode-open'`
- `'folder-views'`
- `'folder-views-open'`
- `'folder-vue'`
- `'folder-vue-open'`
- `'folder-vuepress'`
- `'folder-vuepress-open'`
- `'folder-expo'`
- `'folder-expo-open'`
- `'folder-config'`
- `'folder-config-open'`
- `'folder-i18n'`
- `'folder-i18n-open'`
- `'folder-components'`
- `'folder-components-open'`
- `'folder-verdaccio'`
- `'folder-verdaccio-open'`
- `'folder-aurelia'`
- `'folder-aurelia-open'`
- `'folder-resource'`
- `'folder-resource-open'`
- `'folder-lib'`
- `'folder-lib-open'`
- `'folder-theme'`
- `'folder-theme-open'`
- `'folder-webpack'`
- `'folder-webpack-open'`
- `'folder-global'`
- `'folder-global-open'`
- `'folder-public'`
- `'folder-public-open'`
- `'folder-include'`
- `'folder-include-open'`
- `'folder-docker'`
- `'folder-docker-open'`
- `'folder-database'`
- `'folder-database-open'`
- `'folder-log'`
- `'folder-log-open'`
- `'folder-target'`
- `'folder-target-open'`
- `'folder-temp'`
- `'folder-temp-open'`
- `'folder-aws'`
- `'folder-aws-open'`
- `'folder-audio'`
- `'folder-audio-open'`
- `'folder-video'`
- `'folder-video-open'`
- `'folder-kubernetes'`
- `'folder-kubernetes-open'`
- `'folder-import'`
- `'folder-import-open'`
- `'folder-export'`
- `'folder-export-open'`
- `'folder-wakatime'`
- `'folder-wakatime-open'`
- `'folder-circleci'`
- `'folder-circleci-open'`
- `'folder-wordpress'`
- `'folder-wordpress-open'`
- `'folder-gradle'`
- `'folder-gradle-open'`
- `'folder-coverage'`
- `'folder-coverage-open'`
- `'folder-class'`
- `'folder-class-open'`
- `'folder-other'`
- `'folder-other-open'`
- `'folder-lua'`
- `'folder-lua-open'`
- `'folder-typescript'`
- `'folder-typescript-open'`
- `'folder-graphql'`
- `'folder-graphql-open'`
- `'folder-routes'`
- `'folder-routes-open'`
- `'folder-ci'`
- `'folder-ci-open'`
- `'folder-benchmark'`
- `'folder-benchmark-open'`
- `'folder-messages'`
- `'folder-messages-open'`
- `'folder-less'`
- `'folder-less-open'`
- `'folder-gulp'`
- `'folder-gulp-open'`
- `'folder-python'`
- `'folder-python-open'`
- `'folder-mojo'`
- `'folder-mojo-open'`
- `'folder-moon'`
- `'folder-moon-open'`
- `'folder-debug'`
- `'folder-debug-open'`
- `'folder-fastlane'`
- `'folder-fastlane-open'`
- `'folder-plugin'`
- `'folder-plugin-open'`
- `'folder-middleware'`
- `'folder-middleware-open'`
- `'folder-controller'`
- `'folder-controller-open'`
- `'folder-ansible'`
- `'folder-ansible-open'`
- `'folder-server'`
- `'folder-server-open'`
- `'folder-client'`
- `'folder-client-open'`
- `'folder-tasks'`
- `'folder-tasks-open'`
- `'folder-android'`
- `'folder-android-open'`
- `'folder-ios'`
- `'folder-ios-open'`
- `'folder-upload'`
- `'folder-upload-open'`
- `'folder-download'`
- `'folder-download-open'`
- `'folder-tools'`
- `'folder-tools-open'`
- `'folder-helper'`
- `'folder-helper-open'`
- `'folder-serverless'`
- `'folder-serverless-open'`
- `'folder-api'`
- `'folder-api-open'`
- `'folder-app'`
- `'folder-app-open'`
- `'folder-apollo'`
- `'folder-apollo-open'`
- `'folder-archive'`
- `'folder-archive-open'`
- `'folder-batch'`
- `'folder-batch-open'`
- `'folder-buildkite'`
- `'folder-buildkite-open'`
- `'folder-cluster'`
- `'folder-cluster-open'`
- `'folder-command'`
- `'folder-command-open'`
- `'folder-constant'`
- `'folder-constant-open'`
- `'folder-container'`
- `'folder-container-open'`
- `'folder-content'`
- `'folder-content-open'`
- `'folder-context'`
- `'folder-context-open'`
- `'folder-core'`
- `'folder-core-open'`
- `'folder-delta'`
- `'folder-delta-open'`
- `'folder-dump'`
- `'folder-dump-open'`
- `'folder-examples'`
- `'folder-examples-open'`
- `'folder-environment'`
- `'folder-environment-open'`
- `'folder-functions'`
- `'folder-functions-open'`
- `'folder-generator'`
- `'folder-generator-open'`
- `'folder-hook'`
- `'folder-hook-open'`
- `'folder-job'`
- `'folder-job-open'`
- `'folder-keys'`
- `'folder-keys-open'`
- `'folder-layout'`
- `'folder-layout-open'`
- `'folder-mail'`
- `'folder-mail-open'`
- `'folder-mappings'`
- `'folder-mappings-open'`
- `'folder-meta'`
- `'folder-meta-open'`
- `'folder-changesets'`
- `'folder-changesets-open'`
- `'folder-packages'`
- `'folder-packages-open'`
- `'folder-shared'`
- `'folder-shared-open'`
- `'folder-shader'`
- `'folder-shader-open'`
- `'folder-stack'`
- `'folder-stack-open'`
- `'folder-template'`
- `'folder-template-open'`
- `'folder-utils'`
- `'folder-utils-open'`
- `'folder-supabase'`
- `'folder-supabase-open'`
- `'folder-private'`
- `'folder-private-open'`
- `'folder-linux'`
- `'folder-linux-open'`
- `'folder-windows'`
- `'folder-windows-open'`
- `'folder-macos'`
- `'folder-macos-open'`
- `'folder-error'`
- `'folder-error-open'`
- `'folder-event'`
- `'folder-event-open'`
- `'folder-secure'`
- `'folder-secure-open'`
- `'folder-custom'`
- `'folder-custom-open'`
- `'folder-mock'`
- `'folder-mock-open'`
- `'folder-syntax'`
- `'folder-syntax-open'`
- `'folder-vm'`
- `'folder-vm-open'`
- `'folder-stylus'`
- `'folder-stylus-open'`
- `'folder-flow'`
- `'folder-flow-open'`
- `'folder-rules'`
- `'folder-rules-open'`
- `'folder-review'`
- `'folder-review-open'`
- `'folder-animation'`
- `'folder-animation-open'`
- `'folder-guard'`
- `'folder-guard-open'`
- `'folder-prisma'`
- `'folder-prisma-open'`
- `'folder-pipe'`
- `'folder-pipe-open'`
- `'folder-svg'`
- `'folder-svg-open'`
- `'folder-terraform'`
- `'folder-terraform-open'`
- `'folder-mobile'`
- `'folder-mobile-open'`
- `'folder-stencil'`
- `'folder-stencil-open'`
- `'folder-firebase'`
- `'folder-firebase-open'`
- `'folder-svelte'`
- `'folder-svelte-open'`
- `'folder-update'`
- `'folder-update-open'`
- `'folder-intellij'`
- `'folder-intellij-open'`
- `'folder-intellij_light'`
- `'folder-intellij-open_light'`
- `'folder-azure-pipelines'`
- `'folder-azure-pipelines-open'`
- `'folder-mjml'`
- `'folder-mjml-open'`
- `'folder-admin'`
- `'folder-admin-open'`
- `'folder-scala'`
- `'folder-scala-open'`
- `'folder-connection'`
- `'folder-connection-open'`
- `'folder-quasar'`
- `'folder-quasar-open'`
- `'folder-next'`
- `'folder-next-open'`
- `'folder-cobol'`
- `'folder-cobol-open'`
- `'folder-yarn'`
- `'folder-yarn-open'`
- `'folder-husky'`
- `'folder-husky-open'`
- `'folder-storybook'`
- `'folder-storybook-open'`
- `'folder-base'`
- `'folder-base-open'`
- `'folder-cart'`
- `'folder-cart-open'`
- `'folder-home'`
- `'folder-home-open'`
- `'folder-project'`
- `'folder-project-open'`
- `'folder-interface'`
- `'folder-interface-open'`
- `'folder-netlify'`
- `'folder-netlify-open'`
- `'folder-enum'`
- `'folder-enum-open'`
- `'folder-contract'`
- `'folder-contract-open'`
- `'folder-queue'`
- `'folder-queue-open'`
- `'folder-vercel'`
- `'folder-vercel-open'`
- `'folder-cypress'`
- `'folder-cypress-open'`
- `'folder-decorators'`
- `'folder-decorators-open'`
- `'folder-java'`
- `'folder-java-open'`
- `'folder-resolver'`
- `'folder-resolver-open'`
- `'folder-angular'`
- `'folder-angular-open'`
- `'folder-unity'`
- `'folder-unity-open'`
- `'folder-pdf'`
- `'folder-pdf-open'`
- `'folder-proto'`
- `'folder-proto-open'`
- `'folder-plastic'`
- `'folder-plastic-open'`
- `'folder-gamemaker'`
- `'folder-gamemaker-open'`
- `'folder-mercurial'`
- `'folder-mercurial-open'`
- `'folder-godot'`
- `'folder-godot-open'`
- `'folder-lottie'`
- `'folder-lottie-open'`
- `'folder-taskfile'`
- `'folder-taskfile-open'`
- `'folder'`
- `'folder-open'`
- `'folder-root'`
- `'folder-root-open'`

</details>

## OnProgress

_Function._

_Parameters:_

1. `unknown` (_optional & nullable_)

_Returns:_

- `void` (_optional_)

## PersistConfig

_Object containing the following properties:_

| Property    | Description                             | Type                                                            |
| :---------- | :-------------------------------------- | :-------------------------------------------------------------- |
| `outputDir` | Artifacts folder                        | `string` (_min length: 1_)                                      |
| `filename`  | Artifacts file name (without extension) | `string` (_regex: `/^(?!.*[ \\/:*?"<>\|]).+$/`, min length: 1_) |
| `format`    |                                         | _Array of [Format](#format) items_                              |

_All properties are optional._

## PluginConfig

_Object containing the following properties:_

| Property          | Description                               | Type                                                                 |
| :---------------- | :---------------------------------------- | :------------------------------------------------------------------- |
| `packageName`     | NPM package name                          | `string`                                                             |
| `version`         | NPM version of the package                | `string`                                                             |
| **`title`** (\*)  | Descriptive name                          | `string` (_max length: 256_)                                         |
| `description`     | Description (markdown)                    | `string` (_max length: 65536_)                                       |
| `docsUrl`         | Plugin documentation site                 | `string` (_url_) (_optional_) _or_ `''`                              |
| **`slug`** (\*)   | Unique plugin slug within core config     | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_)    |
| **`icon`** (\*)   | Icon from VSCode Material Icons extension | [MaterialIcon](#materialicon)                                        |
| **`runner`** (\*) |                                           | [RunnerConfig](#runnerconfig) _or_ [RunnerFunction](#runnerfunction) |
| **`audits`** (\*) |                                           | _Array of at least 1 [Audit](#audit) items_                          |
| `groups`          |                                           | _Array of [Group](#group) items_                                     |

_(\*) Required._

## PluginMeta

_Object containing the following properties:_

| Property         | Description                               | Type                                                              |
| :--------------- | :---------------------------------------- | :---------------------------------------------------------------- |
| `packageName`    | NPM package name                          | `string`                                                          |
| `version`        | NPM version of the package                | `string`                                                          |
| **`title`** (\*) | Descriptive name                          | `string` (_max length: 256_)                                      |
| `description`    | Description (markdown)                    | `string` (_max length: 65536_)                                    |
| `docsUrl`        | Plugin documentation site                 | `string` (_url_) (_optional_) _or_ `''`                           |
| **`slug`** (\*)  | Unique plugin slug within core config     | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`icon`** (\*)  | Icon from VSCode Material Icons extension | [MaterialIcon](#materialicon)                                     |

_(\*) Required._

## PluginReport

_Object containing the following properties:_

| Property            | Description                               | Type                                                              |
| :------------------ | :---------------------------------------- | :---------------------------------------------------------------- |
| `packageName`       | NPM package name                          | `string`                                                          |
| `version`           | NPM version of the package                | `string`                                                          |
| **`title`** (\*)    | Descriptive name                          | `string` (_max length: 256_)                                      |
| `description`       | Description (markdown)                    | `string` (_max length: 65536_)                                    |
| `docsUrl`           | Plugin documentation site                 | `string` (_url_) (_optional_) _or_ `''`                           |
| **`slug`** (\*)     | Unique plugin slug within core config     | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`icon`** (\*)     | Icon from VSCode Material Icons extension | [MaterialIcon](#materialicon)                                     |
| **`date`** (\*)     | Start date and time of plugin run         | `string`                                                          |
| **`duration`** (\*) | Duration of the plugin run in ms          | `number`                                                          |
| **`audits`** (\*)   |                                           | _Array of at least 1 [AuditReport](#auditreport) items_           |
| `groups`            |                                           | _Array of [Group](#group) items_                                  |

_(\*) Required._

## PrimitiveValue

_Union of the following possible types:_

- `string`
- `number`

## Report

_Object containing the following properties:_

| Property               | Description                               | Type                                                                                                                                                                                                                                                                                                |
| :--------------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`packageName`** (\*) | NPM package name                          | `string`                                                                                                                                                                                                                                                                                            |
| **`version`** (\*)     | NPM version of the CLI                    | `string`                                                                                                                                                                                                                                                                                            |
| **`date`** (\*)        | Start date and time of the collect run    | `string`                                                                                                                                                                                                                                                                                            |
| **`duration`** (\*)    | Duration of the collect run in ms         | `number`                                                                                                                                                                                                                                                                                            |
| **`categories`** (\*)  |                                           | _Array of [CategoryConfig](#categoryconfig) items_                                                                                                                                                                                                                                                  |
| **`plugins`** (\*)     |                                           | _Array of at least 1 [PluginReport](#pluginreport) items_                                                                                                                                                                                                                                           |
| **`commit`** (\*)      | Git commit for which report was collected | _Object with properties:_<ul><li>`hash`: `string` (_regex: `/^[\da-f]{40}$/`_) - Commit SHA (full)</li><li>`message`: `string` - Commit message</li><li>`date`: `Date` (_nullable_) - Date and time when commit was authored</li><li>`author`: `string` - Commit author name</li></ul> (_nullable_) |

_(\*) Required._

## ReportsDiff

_Object containing the following properties:_

| Property               | Description                                     | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :--------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`commits`** (\*)     | Commits identifying compared reports            | _Object with properties:_<ul><li>`before`: _Object with properties:_<ul><li>`hash`: `string` (_regex: `/^[\da-f]{40}$/`_) - Commit SHA (full)</li><li>`message`: `string` - Commit message</li><li>`date`: `Date` (_nullable_) - Date and time when commit was authored</li><li>`author`: `string` - Commit author name</li></ul> - Git commit (source commit)</li><li>`after`: _Object with properties:_<ul><li>`hash`: `string` (_regex: `/^[\da-f]{40}$/`_) - Commit SHA (full)</li><li>`message`: `string` - Commit message</li><li>`date`: `Date` (_nullable_) - Date and time when commit was authored</li><li>`author`: `string` - Commit author name</li></ul> - Git commit (target commit)</li></ul> (_nullable_) |
| **`categories`** (\*)  | Changes affecting categories                    | _Object with properties:_<ul><li>`changed`: _Array of [CategoryDiff](#categorydiff) items_</li><li>`unchanged`: _Array of [CategoryResult](#categoryresult) items_</li><li>`added`: _Array of [CategoryResult](#categoryresult) items_</li><li>`removed`: _Array of [CategoryResult](#categoryresult) items_</li></ul>                                                                                                                                                                                                                                                                                                                                                                                                     |
| **`groups`** (\*)      | Changes affecting groups                        | _Object with properties:_<ul><li>`changed`: _Array of [GroupDiff](#groupdiff) items_</li><li>`unchanged`: _Array of [GroupResult](#groupresult) items_</li><li>`added`: _Array of [GroupResult](#groupresult) items_</li><li>`removed`: _Array of [GroupResult](#groupresult) items_</li></ul>                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`audits`** (\*)      | Changes affecting audits                        | _Object with properties:_<ul><li>`changed`: _Array of [AuditDiff](#auditdiff) items_</li><li>`unchanged`: _Array of [AuditResult](#auditresult) items_</li><li>`added`: _Array of [AuditResult](#auditresult) items_</li><li>`removed`: _Array of [AuditResult](#auditresult) items_</li></ul>                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`packageName`** (\*) | NPM package name                                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **`version`** (\*)     | NPM version of the CLI (when `compare` was run) | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **`date`** (\*)        | Start date and time of the compare run          | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **`duration`** (\*)    | Duration of the compare run in ms               | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

_(\*) Required._

## RunnerConfig

How to execute runner

_Object containing the following properties:_

| Property              | Description              | Type                                                                                                                                                                                                  |
| :-------------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`command`** (\*)    | Shell command to execute | `string`                                                                                                                                                                                              |
| `args`                |                          | `Array<string>`                                                                                                                                                                                       |
| **`outputFile`** (\*) | Output path              | `string` (_min length: 1_)                                                                                                                                                                            |
| `outputTransform`     |                          | _Function:_<br /><ul><li>_parameters:_ <ol><li>`unknown` (_optional & nullable_)</li></ol></li><li>_returns:_ [AuditOutputs](#auditoutputs) _or_ _Promise of_ [AuditOutputs](#auditoutputs)</li></ul> |

_(\*) Required._

## RunnerFunction

_Function._

_Parameters:_

1. [OnProgress](#onprogress) (_optional_)

_Returns:_

- [AuditOutputs](#auditoutputs) _or_ _Promise of_ [AuditOutputs](#auditoutputs)

## TableAlignment

Cell alignment

_Enum string, one of the following possible values:_

- `'left'`
- `'center'`
- `'right'`

## TableColumnObject

_Object containing the following properties:_

| Property       | Description    | Type                              |
| :------------- | :------------- | :-------------------------------- |
| **`key`** (\*) |                | `string`                          |
| `label`        |                | `string`                          |
| `align`        | Cell alignment | [TableAlignment](#tablealignment) |

_(\*) Required._

## TableColumnPrimitive

Cell alignment

_Enum string, one of the following possible values:_

- `'left'`
- `'center'`
- `'right'`

## TableRowObject

Object row

_Object record with dynamic keys:_

- _keys of type_ `string`
- _values of type_ [PrimitiveValue](#primitivevalue)

## TableRowPrimitive

Primitive row

_Array of [PrimitiveValue](#primitivevalue) items._

## UploadConfig

_Object containing the following properties:_

| Property                | Description                                                          | Type                                                              |
| :---------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **`server`** (\*)       | URL of deployed portal API                                           | `string` (_url_)                                                  |
| **`apiKey`** (\*)       | API key with write access to portal (use `process.env` for security) | `string`                                                          |
| **`organization`** (\*) | Organization slug from Code PushUp portal                            | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| **`project`** (\*)      | Project slug from Code PushUp portal                                 | `string` (_regex: `/^[a-z\d]+(?:-[a-z\d]+)*$/`, max length: 128_) |
| `timeout`               | Request timeout in minutes (default is 5)                            | `number` (_>0, int_)                                              |

_(\*) Required._
