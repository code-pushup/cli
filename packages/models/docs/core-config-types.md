# Code PushUp config file reference

The `code-pushup.config.(ts|mjs|js)` file should conform to the following type definition:

```ts
export type CoreConfig = {
  /** List of plugins to be used (official, community-provided, or custom) */
  plugins: {
    /** NPM package name */
    packageName?: string | undefined;
    /** NPM version of the package */
    version?: string | undefined;
    /** Descriptive name */
    title: string;
    /** Description (markdown) */
    description?: string | undefined;
    /** Plugin documentation site */
    docsUrl?: (string | undefined) | string;
    /** Unique plugin slug within core config */
    slug: string;
    /** Icon from VSCode Material Icons extension */
    icon: 'git' | 'yaml' | 'xml' | 'matlab' | 'settings' | 'shaderlab' | 'diff' | 'json' | 'blink' | 'java' | 'razor' | 'python' | 'mojo' | 'javascript' | 'typescript' | 'scala' | 'handlebars' | 'perl' | 'haxe' | 'puppet' | 'elixir' | 'livescript' | 'erlang' | 'twig' | 'julia' | 'elm' | 'purescript' | 'stylus' | 'nunjucks' | 'pug' | 'robot' | 'sass' | 'less' | 'css' | 'visualstudio' | 'angular' | 'graphql' | 'solidity' | 'autoit' | 'haml' | 'yang' | 'terraform' | 'applescript' | 'cake' | 'cucumber' | 'nim' | 'apiblueprint' | 'riot' | 'postcss' | 'coldfusion' | 'haskell' | 'dhall' | 'cabal' | 'nix' | 'ruby' | 'slim' | 'php' | 'php_elephant' | 'php_elephant_pink' | 'hack' | 'react' | 'mjml' | 'processing' | 'hcl' | 'go' | 'go_gopher' | 'nodejs_alt' | 'django' | 'html' | 'godot' | 'godot-assets' | 'vim' | 'silverstripe' | 'prolog' | 'pawn' | 'reason' | 'sml' | 'tex' | 'salesforce' | 'sas' | 'docker' | 'table' | 'csharp' | 'console' | 'c' | 'cpp' | 'objective-c' | 'objective-cpp' | 'coffee' | 'fsharp' | 'editorconfig' | 'clojure' | 'groovy' | 'markdown' | 'jinja' | 'proto' | 'python-misc' | 'vue' | 'lua' | 'lib' | 'log' | 'jupyter' | 'document' | 'pdf' | 'powershell' | 'r' | 'rust' | 'database' | 'kusto' | 'lock' | 'svg' | 'swift' | 'react_ts' | 'search' | 'minecraft' | 'rescript' | 'otne' | 'twine' | 'grain' | 'lolcode' | 'idris' | 'chess' | 'gemini' | 'vlang' | 'wolframlanguage' | 'shader' | 'tree' | 'svelte' | 'dart' | 'cadence' | 'stylable' | 'hjson' | 'concourse' | 'blink_light' | 'jinja_light' | 'playwright' | 'sublime' | 'image' | 'routing' | 'typescript-def' | 'markojs' | 'astro' | 'vscode' | 'qsharp' | 'zip' | 'vala' | 'zig' | 'exe' | 'hex' | 'jar' | 'javaclass' | 'h' | 'hpp' | 'rc' | 'go-mod' | 'url' | 'gradle' | 'word' | 'certificate' | 'key' | 'font' | 'gemfile' | 'rubocop' | 'rubocop_light' | 'rspec' | 'arduino' | 'powerpoint' | 'video' | 'virtual' | 'email' | 'audio' | 'raml' | 'xaml' | 'kotlin' | 'dart_generated' | 'actionscript' | 'mxml' | 'autohotkey' | 'flash' | 'swc' | 'cmake' | 'assembly' | 'semgrep' | 'vue-config' | 'nuxt' | 'ocaml' | 'odin' | 'javascript-map' | 'css-map' | 'test-ts' | 'test-jsx' | 'test-js' | 'angular-component' | 'angular-guard' | 'angular-service' | 'angular-pipe' | 'angular-directive' | 'angular-resolver' | 'smarty' | 'bucklescript' | 'merlin' | 'verilog' | 'mathematica' | 'vercel' | 'vercel_light' | 'verdaccio' | 'next' | 'next_light' | 'remix' | 'remix_light' | 'laravel' | 'vfl' | 'kl' | 'posthtml' | 'todo' | 'http' | 'restql' | 'kivy' | 'graphcool' | 'sbt' | 'webpack' | 'ionic' | 'gulp' | 'nodejs' | 'npm' | 'yarn' | 'android' | 'tune' | 'turborepo' | 'turborepo_light' | 'babel' | 'blitz' | 'contributing' | 'readme' | 'changelog' | 'architecture' | 'credits' | 'authors' | 'flow' | 'favicon' | 'karma' | 'bithound' | 'svgo' | 'appveyor' | 'travis' | 'codecov' | 'sonarcloud' | 'protractor' | 'fusebox' | 'heroku' | 'gitlab' | 'bower' | 'eslint' | 'conduct' | 'watchman' | 'aurelia' | 'auto' | 'auto_light' | 'mocha' | 'jenkins' | 'firebase' | 'figma' | 'rollup' | 'hardhat' | 'stylelint' | 'stylelint_light' | 'code-climate' | 'code-climate_light' | 'prettier' | 'renovate' | 'apollo' | 'nodemon' | 'webhint' | 'browserlist' | 'browserlist_light' | 'crystal' | 'crystal_light' | 'snyk' | 'drone' | 'drone_light' | 'cuda' | 'dotjs' | 'ejs' | 'sequelize' | 'gatsby' | 'wakatime' | 'wakatime_light' | 'circleci' | 'circleci_light' | 'cloudfoundry' | 'grunt' | 'jest' | 'storybook' | 'wepy' | 'fastlane' | 'hcl_light' | 'helm' | 'san' | 'wallaby' | 'stencil' | 'red' | 'makefile' | 'foxpro' | 'i18n' | 'webassembly' | 'semantic-release' | 'semantic-release_light' | 'bitbucket' | 'd' | 'mdx' | 'mdsvex' | 'ballerina' | 'racket' | 'bazel' | 'mint' | 'velocity' | 'azure-pipelines' | 'azure' | 'vagrant' | 'prisma' | 'abc' | 'asciidoc' | 'istanbul' | 'edge' | 'scheme' | 'lisp' | 'tailwindcss' | '3d' | 'buildkite' | 'netlify' | 'netlify_light' | 'nest' | 'moon' | 'moonscript' | 'percy' | 'gitpod' | 'advpl_prw' | 'advpl_ptm' | 'advpl_tlpp' | 'advpl_include' | 'codeowners' | 'gcp' | 'disc' | 'fortran' | 'tcl' | 'liquid' | 'husky' | 'coconut' | 'tilt' | 'capacitor' | 'sketch' | 'adonis' | 'forth' | 'uml' | 'uml_light' | 'meson' | 'commitlint' | 'buck' | 'nrwl' | 'opam' | 'dune' | 'imba' | 'drawio' | 'pascal' | 'roadmap' | 'nuget' | 'command' | 'stryker' | 'denizenscript' | 'modernizr' | 'slug' | 'stitches' | 'stitches_light' | 'nginx' | 'replit' | 'rescript-interface' | 'snowpack' | 'snowpack_light' | 'brainfuck' | 'bicep' | 'cobol' | 'quasar' | 'dependabot' | 'pipeline' | 'vite' | 'vitest' | 'opa' | 'lerna' | 'windicss' | 'textlint' | 'lilypond' | 'chess_light' | 'sentry' | 'phpunit' | 'php-cs-fixer' | 'robots' | 'tsconfig' | 'tauri' | 'jsconfig' | 'maven' | 'ada' | 'serverless' | 'supabase' | 'ember' | 'horusec' | 'poetry' | 'coala' | 'parcel' | 'dinophp' | 'teal' | 'template' | 'astyle' | 'lighthouse' | 'svgr' | 'rome' | 'cypress' | 'siyuan' | 'ndst' | 'plop' | 'tobi' | 'tobimake' | 'gleam' | 'pnpm' | 'pnpm_light' | 'gridsome' | 'steadybit' | 'caddy' | 'bun' | 'bun_light' | 'antlr' | 'pinejs' | 'nano-staged' | 'nano-staged_light' | 'taskfile' | 'craco' | 'gamemaker' | 'tldraw' | 'tldraw_light' | 'mercurial' | 'deno' | 'deno_light' | 'plastic' | 'typst' | 'unocss' | 'ifanr-cloud' | 'mermaid' | 'werf' | 'roblox' | 'panda' | 'biome' | 'esbuild' | 'spwn' | 'templ' | 'chrome' | 'stan' | 'abap' | 'lottie' | 'puppeteer' | 'apps-script' | 'kubernetes' | 'file' | 'folder-robot' | 'folder-robot-open' | 'folder-src' | 'folder-src-open' | 'folder-dist' | 'folder-dist-open' | 'folder-css' | 'folder-css-open' | 'folder-sass' | 'folder-sass-open' | 'folder-images' | 'folder-images-open' | 'folder-scripts' | 'folder-scripts-open' | 'folder-node' | 'folder-node-open' | 'folder-javascript' | 'folder-javascript-open' | 'folder-json' | 'folder-json-open' | 'folder-font' | 'folder-font-open' | 'folder-bower' | 'folder-bower-open' | 'folder-test' | 'folder-test-open' | 'folder-jinja' | 'folder-jinja-open' | 'folder-jinja_light' | 'folder-jinja-open_light' | 'folder-markdown' | 'folder-markdown-open' | 'folder-php' | 'folder-php-open' | 'folder-phpmailer' | 'folder-phpmailer-open' | 'folder-sublime' | 'folder-sublime-open' | 'folder-docs' | 'folder-docs-open' | 'folder-git' | 'folder-git-open' | 'folder-github' | 'folder-github-open' | 'folder-gitlab' | 'folder-gitlab-open' | 'folder-vscode' | 'folder-vscode-open' | 'folder-views' | 'folder-views-open' | 'folder-vue' | 'folder-vue-open' | 'folder-vuepress' | 'folder-vuepress-open' | 'folder-expo' | 'folder-expo-open' | 'folder-config' | 'folder-config-open' | 'folder-i18n' | 'folder-i18n-open' | 'folder-components' | 'folder-components-open' | 'folder-verdaccio' | 'folder-verdaccio-open' | 'folder-aurelia' | 'folder-aurelia-open' | 'folder-resource' | 'folder-resource-open' | 'folder-lib' | 'folder-lib-open' | 'folder-theme' | 'folder-theme-open' | 'folder-webpack' | 'folder-webpack-open' | 'folder-global' | 'folder-global-open' | 'folder-public' | 'folder-public-open' | 'folder-include' | 'folder-include-open' | 'folder-docker' | 'folder-docker-open' | 'folder-database' | 'folder-database-open' | 'folder-log' | 'folder-log-open' | 'folder-target' | 'folder-target-open' | 'folder-temp' | 'folder-temp-open' | 'folder-aws' | 'folder-aws-open' | 'folder-audio' | 'folder-audio-open' | 'folder-video' | 'folder-video-open' | 'folder-kubernetes' | 'folder-kubernetes-open' | 'folder-import' | 'folder-import-open' | 'folder-export' | 'folder-export-open' | 'folder-wakatime' | 'folder-wakatime-open' | 'folder-circleci' | 'folder-circleci-open' | 'folder-wordpress' | 'folder-wordpress-open' | 'folder-gradle' | 'folder-gradle-open' | 'folder-coverage' | 'folder-coverage-open' | 'folder-class' | 'folder-class-open' | 'folder-other' | 'folder-other-open' | 'folder-lua' | 'folder-lua-open' | 'folder-typescript' | 'folder-typescript-open' | 'folder-graphql' | 'folder-graphql-open' | 'folder-routes' | 'folder-routes-open' | 'folder-ci' | 'folder-ci-open' | 'folder-benchmark' | 'folder-benchmark-open' | 'folder-messages' | 'folder-messages-open' | 'folder-less' | 'folder-less-open' | 'folder-gulp' | 'folder-gulp-open' | 'folder-python' | 'folder-python-open' | 'folder-mojo' | 'folder-mojo-open' | 'folder-moon' | 'folder-moon-open' | 'folder-debug' | 'folder-debug-open' | 'folder-fastlane' | 'folder-fastlane-open' | 'folder-plugin' | 'folder-plugin-open' | 'folder-middleware' | 'folder-middleware-open' | 'folder-controller' | 'folder-controller-open' | 'folder-ansible' | 'folder-ansible-open' | 'folder-server' | 'folder-server-open' | 'folder-client' | 'folder-client-open' | 'folder-tasks' | 'folder-tasks-open' | 'folder-android' | 'folder-android-open' | 'folder-ios' | 'folder-ios-open' | 'folder-upload' | 'folder-upload-open' | 'folder-download' | 'folder-download-open' | 'folder-tools' | 'folder-tools-open' | 'folder-helper' | 'folder-helper-open' | 'folder-serverless' | 'folder-serverless-open' | 'folder-api' | 'folder-api-open' | 'folder-app' | 'folder-app-open' | 'folder-apollo' | 'folder-apollo-open' | 'folder-archive' | 'folder-archive-open' | 'folder-batch' | 'folder-batch-open' | 'folder-buildkite' | 'folder-buildkite-open' | 'folder-cluster' | 'folder-cluster-open' | 'folder-command' | 'folder-command-open' | 'folder-constant' | 'folder-constant-open' | 'folder-container' | 'folder-container-open' | 'folder-content' | 'folder-content-open' | 'folder-context' | 'folder-context-open' | 'folder-core' | 'folder-core-open' | 'folder-delta' | 'folder-delta-open' | 'folder-dump' | 'folder-dump-open' | 'folder-examples' | 'folder-examples-open' | 'folder-environment' | 'folder-environment-open' | 'folder-functions' | 'folder-functions-open' | 'folder-generator' | 'folder-generator-open' | 'folder-hook' | 'folder-hook-open' | 'folder-job' | 'folder-job-open' | 'folder-keys' | 'folder-keys-open' | 'folder-layout' | 'folder-layout-open' | 'folder-mail' | 'folder-mail-open' | 'folder-mappings' | 'folder-mappings-open' | 'folder-meta' | 'folder-meta-open' | 'folder-changesets' | 'folder-changesets-open' | 'folder-packages' | 'folder-packages-open' | 'folder-shared' | 'folder-shared-open' | 'folder-shader' | 'folder-shader-open' | 'folder-stack' | 'folder-stack-open' | 'folder-template' | 'folder-template-open' | 'folder-utils' | 'folder-utils-open' | 'folder-supabase' | 'folder-supabase-open' | 'folder-private' | 'folder-private-open' | 'folder-linux' | 'folder-linux-open' | 'folder-windows' | 'folder-windows-open' | 'folder-macos' | 'folder-macos-open' | 'folder-error' | 'folder-error-open' | 'folder-event' | 'folder-event-open' | 'folder-secure' | 'folder-secure-open' | 'folder-custom' | 'folder-custom-open' | 'folder-mock' | 'folder-mock-open' | 'folder-syntax' | 'folder-syntax-open' | 'folder-vm' | 'folder-vm-open' | 'folder-stylus' | 'folder-stylus-open' | 'folder-flow' | 'folder-flow-open' | 'folder-rules' | 'folder-rules-open' | 'folder-review' | 'folder-review-open' | 'folder-animation' | 'folder-animation-open' | 'folder-guard' | 'folder-guard-open' | 'folder-prisma' | 'folder-prisma-open' | 'folder-pipe' | 'folder-pipe-open' | 'folder-svg' | 'folder-svg-open' | 'folder-terraform' | 'folder-terraform-open' | 'folder-mobile' | 'folder-mobile-open' | 'folder-stencil' | 'folder-stencil-open' | 'folder-firebase' | 'folder-firebase-open' | 'folder-svelte' | 'folder-svelte-open' | 'folder-update' | 'folder-update-open' | 'folder-intellij' | 'folder-intellij-open' | 'folder-intellij_light' | 'folder-intellij-open_light' | 'folder-azure-pipelines' | 'folder-azure-pipelines-open' | 'folder-mjml' | 'folder-mjml-open' | 'folder-admin' | 'folder-admin-open' | 'folder-scala' | 'folder-scala-open' | 'folder-connection' | 'folder-connection-open' | 'folder-quasar' | 'folder-quasar-open' | 'folder-next' | 'folder-next-open' | 'folder-cobol' | 'folder-cobol-open' | 'folder-yarn' | 'folder-yarn-open' | 'folder-husky' | 'folder-husky-open' | 'folder-storybook' | 'folder-storybook-open' | 'folder-base' | 'folder-base-open' | 'folder-cart' | 'folder-cart-open' | 'folder-home' | 'folder-home-open' | 'folder-project' | 'folder-project-open' | 'folder-interface' | 'folder-interface-open' | 'folder-netlify' | 'folder-netlify-open' | 'folder-enum' | 'folder-enum-open' | 'folder-contract' | 'folder-contract-open' | 'folder-queue' | 'folder-queue-open' | 'folder-vercel' | 'folder-vercel-open' | 'folder-cypress' | 'folder-cypress-open' | 'folder-decorators' | 'folder-decorators-open' | 'folder-java' | 'folder-java-open' | 'folder-resolver' | 'folder-resolver-open' | 'folder-angular' | 'folder-angular-open' | 'folder-unity' | 'folder-unity-open' | 'folder-pdf' | 'folder-pdf-open' | 'folder-proto' | 'folder-proto-open' | 'folder-plastic' | 'folder-plastic-open' | 'folder-gamemaker' | 'folder-gamemaker-open' | 'folder-mercurial' | 'folder-mercurial-open' | 'folder-godot' | 'folder-godot-open' | 'folder-lottie' | 'folder-lottie-open' | 'folder-taskfile' | 'folder-taskfile-open' | 'folder' | 'folder-open' | 'folder-root' | 'folder-root-open';
    runner:
      | {
          /** Shell command to execute */
          command: string;
          args?: string[] | undefined;
          /** Output path */
          outputFile: string;
          outputTransform?:
            | ((
                args_0: unknown,
                ...args_1: unknown[]
              ) =>
                | {
                    /** Reference to audit */
                    slug: string;
                    /** Formatted value (e.g. '0.9 s', '2.1 MB') */
                    displayValue?: string | undefined;
                    /** Raw numeric value */
                    value: number;
                    /** Value between 0 and 1 */
                    score: number;
                    /** Detailed information */
                    details?:
                      | {
                          /** List of findings */
                          issues: {
                            /** Descriptive error message */
                            message: string;
                            /** Severity level */
                            severity: 'info' | 'warning' | 'error';
                            /** Source file location */
                            source?:
                              | {
                                  /** Relative path to source file in Git repo */
                                  file: string;
                                  /** Location in file */
                                  position?:
                                    | {
                                        /** Start line */
                                        startLine: number;
                                        /** Start column */
                                        startColumn?: number | undefined;
                                        /** End line */
                                        endLine?: number | undefined;
                                        /** End column */
                                        endColumn?: number | undefined;
                                      }
                                    | undefined;
                                }
                              | undefined;
                          }[];
                        }
                      | undefined;
                  }[]
                | Promise<
                    {
                      /** Reference to audit */
                      slug: string;
                      /** Formatted value (e.g. '0.9 s', '2.1 MB') */
                      displayValue?: string | undefined;
                      /** Raw numeric value */
                      value: number;
                      /** Value between 0 and 1 */
                      score: number;
                      /** Detailed information */
                      details?:
                        | {
                            /** List of findings */
                            issues: {
                              /** Descriptive error message */
                              message: string;
                              /** Severity level */
                              severity: 'info' | 'warning' | 'error';
                              /** Source file location */
                              source?:
                                | {
                                    /** Relative path to source file in Git repo */
                                    file: string;
                                    /** Location in file */
                                    position?:
                                      | {
                                          /** Start line */
                                          startLine: number;
                                          /** Start column */
                                          startColumn?: number | undefined;
                                          /** End line */
                                          endLine?: number | undefined;
                                          /** End column */
                                          endColumn?: number | undefined;
                                        }
                                      | undefined;
                                  }
                                | undefined;
                            }[];
                          }
                        | undefined;
                    }[]
                  >)
            | undefined;
        }
      | ((
          args_0: ((args_0: unknown, ...args_1: unknown[]) => void | undefined) | undefined,
          ...args_1: unknown[]
        ) =>
          | {
              /** Reference to audit */
              slug: string;
              /** Formatted value (e.g. '0.9 s', '2.1 MB') */
              displayValue?: string | undefined;
              /** Raw numeric value */
              value: number;
              /** Value between 0 and 1 */
              score: number;
              /** Detailed information */
              details?:
                | {
                    /** List of findings */
                    issues: {
                      /** Descriptive error message */
                      message: string;
                      /** Severity level */
                      severity: 'info' | 'warning' | 'error';
                      /** Source file location */
                      source?:
                        | {
                            /** Relative path to source file in Git repo */
                            file: string;
                            /** Location in file */
                            position?:
                              | {
                                  /** Start line */
                                  startLine: number;
                                  /** Start column */
                                  startColumn?: number | undefined;
                                  /** End line */
                                  endLine?: number | undefined;
                                  /** End column */
                                  endColumn?: number | undefined;
                                }
                              | undefined;
                          }
                        | undefined;
                    }[];
                  }
                | undefined;
            }[]
          | Promise<
              {
                /** Reference to audit */
                slug: string;
                /** Formatted value (e.g. '0.9 s', '2.1 MB') */
                displayValue?: string | undefined;
                /** Raw numeric value */
                value: number;
                /** Value between 0 and 1 */
                score: number;
                /** Detailed information */
                details?:
                  | {
                      /** List of findings */
                      issues: {
                        /** Descriptive error message */
                        message: string;
                        /** Severity level */
                        severity: 'info' | 'warning' | 'error';
                        /** Source file location */
                        source?:
                          | {
                              /** Relative path to source file in Git repo */
                              file: string;
                              /** Location in file */
                              position?:
                                | {
                                    /** Start line */
                                    startLine: number;
                                    /** Start column */
                                    startColumn?: number | undefined;
                                    /** End line */
                                    endLine?: number | undefined;
                                    /** End column */
                                    endColumn?: number | undefined;
                                  }
                                | undefined;
                            }
                          | undefined;
                      }[];
                    }
                  | undefined;
              }[]
            >);
    audits: {
      /** ID (unique within plugin) */
      slug: string;
      /** Descriptive name */
      title: string;
      /** Description (markdown) */
      description?: string | undefined;
      /** Link to documentation (rationale) */
      docsUrl?: (string | undefined) | string;
    }[];
    groups?:
      | {
          /** Human-readable unique ID, e.g. "performance" */
          slug: string;
          refs: {
            /** Reference slug to a group within this plugin (e.g. 'max-lines') */
            slug: string;
            /** Weight used to calculate score */
            weight: number;
          }[];
          /** Descriptive name for the group */
          title: string;
          /** Description of the group (markdown) */
          description?: string | undefined;
          /** Group documentation site */
          docsUrl?: (string | undefined) | string;
        }[]
      | undefined;
  }[];
  persist?:
    | {
        /** Artifacts folder */
        outputDir?: string | undefined;
        /** Artifacts file name (without extension) */
        filename?: string | undefined;
        format?: ('json' | 'md')[] | undefined;
      }
    | undefined;
  upload?:
    | {
        /** URL of deployed portal API */
        server: string;
        /** API key with write access to portal (use `process.env` for security) */
        apiKey: string;
        /** Organization slug from Code PushUp portal */
        organization: string;
        /** Project slug from Code PushUp portal */
        project: string;
        /** Request timeout in minutes (default is 5) */
        timeout?: number | undefined;
      }
    | undefined;
  categories?:
    | {
        /** Human-readable unique ID, e.g. "performance" */
        slug: string;
        refs: {
          /** Slug of an audit or group (depending on `type`) */
          slug: string;
          /** Weight used to calculate score */
          weight: number;
          /** Discriminant for reference kind, affects where `slug` is looked up */
          type: 'audit' | 'group';
          /** Plugin slug (plugin should contain referenced audit or group) */
          plugin: string;
        }[];
        /** Category Title */
        title: string;
        /** Category description */
        description?: string | undefined;
        /** Category docs URL */
        docsUrl?: (string | undefined) | string;
        /** Is this a binary category (i.e. only a perfect score considered a "pass")? */
        isBinary?: boolean | undefined;
      }[]
    | undefined;
};
export type Report = {
  /** NPM package name */
  packageName: string;
  /** NPM version of the CLI */
  version: string;
  /** Start date and time of the collect run */
  date: string;
  /** Duration of the collect run in ms */
  duration: number;
  categories: {
    /** Human-readable unique ID, e.g. "performance" */
    slug: string;
    refs: {
      /** Slug of an audit or group (depending on `type`) */
      slug: string;
      /** Weight used to calculate score */
      weight: number;
      /** Discriminant for reference kind, affects where `slug` is looked up */
      type: 'audit' | 'group';
      /** Plugin slug (plugin should contain referenced audit or group) */
      plugin: string;
    }[];
    /** Category Title */
    title: string;
    /** Category description */
    description?: string | undefined;
    /** Category docs URL */
    docsUrl?: (string | undefined) | string;
    /** Is this a binary category (i.e. only a perfect score considered a "pass")? */
    isBinary?: boolean | undefined;
  }[];
  plugins: {
    /** NPM package name */
    packageName?: string | undefined;
    /** NPM version of the package */
    version?: string | undefined;
    /** Descriptive name */
    title: string;
    /** Description (markdown) */
    description?: string | undefined;
    /** Plugin documentation site */
    docsUrl?: (string | undefined) | string;
    /** Unique plugin slug within core config */
    slug: string;
    /** Icon from VSCode Material Icons extension */
    icon: 'git' | 'yaml' | 'xml' | 'matlab' | 'settings' | 'shaderlab' | 'diff' | 'json' | 'blink' | 'java' | 'razor' | 'python' | 'mojo' | 'javascript' | 'typescript' | 'scala' | 'handlebars' | 'perl' | 'haxe' | 'puppet' | 'elixir' | 'livescript' | 'erlang' | 'twig' | 'julia' | 'elm' | 'purescript' | 'stylus' | 'nunjucks' | 'pug' | 'robot' | 'sass' | 'less' | 'css' | 'visualstudio' | 'angular' | 'graphql' | 'solidity' | 'autoit' | 'haml' | 'yang' | 'terraform' | 'applescript' | 'cake' | 'cucumber' | 'nim' | 'apiblueprint' | 'riot' | 'postcss' | 'coldfusion' | 'haskell' | 'dhall' | 'cabal' | 'nix' | 'ruby' | 'slim' | 'php' | 'php_elephant' | 'php_elephant_pink' | 'hack' | 'react' | 'mjml' | 'processing' | 'hcl' | 'go' | 'go_gopher' | 'nodejs_alt' | 'django' | 'html' | 'godot' | 'godot-assets' | 'vim' | 'silverstripe' | 'prolog' | 'pawn' | 'reason' | 'sml' | 'tex' | 'salesforce' | 'sas' | 'docker' | 'table' | 'csharp' | 'console' | 'c' | 'cpp' | 'objective-c' | 'objective-cpp' | 'coffee' | 'fsharp' | 'editorconfig' | 'clojure' | 'groovy' | 'markdown' | 'jinja' | 'proto' | 'python-misc' | 'vue' | 'lua' | 'lib' | 'log' | 'jupyter' | 'document' | 'pdf' | 'powershell' | 'r' | 'rust' | 'database' | 'kusto' | 'lock' | 'svg' | 'swift' | 'react_ts' | 'search' | 'minecraft' | 'rescript' | 'otne' | 'twine' | 'grain' | 'lolcode' | 'idris' | 'chess' | 'gemini' | 'vlang' | 'wolframlanguage' | 'shader' | 'tree' | 'svelte' | 'dart' | 'cadence' | 'stylable' | 'hjson' | 'concourse' | 'blink_light' | 'jinja_light' | 'playwright' | 'sublime' | 'image' | 'routing' | 'typescript-def' | 'markojs' | 'astro' | 'vscode' | 'qsharp' | 'zip' | 'vala' | 'zig' | 'exe' | 'hex' | 'jar' | 'javaclass' | 'h' | 'hpp' | 'rc' | 'go-mod' | 'url' | 'gradle' | 'word' | 'certificate' | 'key' | 'font' | 'gemfile' | 'rubocop' | 'rubocop_light' | 'rspec' | 'arduino' | 'powerpoint' | 'video' | 'virtual' | 'email' | 'audio' | 'raml' | 'xaml' | 'kotlin' | 'dart_generated' | 'actionscript' | 'mxml' | 'autohotkey' | 'flash' | 'swc' | 'cmake' | 'assembly' | 'semgrep' | 'vue-config' | 'nuxt' | 'ocaml' | 'odin' | 'javascript-map' | 'css-map' | 'test-ts' | 'test-jsx' | 'test-js' | 'angular-component' | 'angular-guard' | 'angular-service' | 'angular-pipe' | 'angular-directive' | 'angular-resolver' | 'smarty' | 'bucklescript' | 'merlin' | 'verilog' | 'mathematica' | 'vercel' | 'vercel_light' | 'verdaccio' | 'next' | 'next_light' | 'remix' | 'remix_light' | 'laravel' | 'vfl' | 'kl' | 'posthtml' | 'todo' | 'http' | 'restql' | 'kivy' | 'graphcool' | 'sbt' | 'webpack' | 'ionic' | 'gulp' | 'nodejs' | 'npm' | 'yarn' | 'android' | 'tune' | 'turborepo' | 'turborepo_light' | 'babel' | 'blitz' | 'contributing' | 'readme' | 'changelog' | 'architecture' | 'credits' | 'authors' | 'flow' | 'favicon' | 'karma' | 'bithound' | 'svgo' | 'appveyor' | 'travis' | 'codecov' | 'sonarcloud' | 'protractor' | 'fusebox' | 'heroku' | 'gitlab' | 'bower' | 'eslint' | 'conduct' | 'watchman' | 'aurelia' | 'auto' | 'auto_light' | 'mocha' | 'jenkins' | 'firebase' | 'figma' | 'rollup' | 'hardhat' | 'stylelint' | 'stylelint_light' | 'code-climate' | 'code-climate_light' | 'prettier' | 'renovate' | 'apollo' | 'nodemon' | 'webhint' | 'browserlist' | 'browserlist_light' | 'crystal' | 'crystal_light' | 'snyk' | 'drone' | 'drone_light' | 'cuda' | 'dotjs' | 'ejs' | 'sequelize' | 'gatsby' | 'wakatime' | 'wakatime_light' | 'circleci' | 'circleci_light' | 'cloudfoundry' | 'grunt' | 'jest' | 'storybook' | 'wepy' | 'fastlane' | 'hcl_light' | 'helm' | 'san' | 'wallaby' | 'stencil' | 'red' | 'makefile' | 'foxpro' | 'i18n' | 'webassembly' | 'semantic-release' | 'semantic-release_light' | 'bitbucket' | 'd' | 'mdx' | 'mdsvex' | 'ballerina' | 'racket' | 'bazel' | 'mint' | 'velocity' | 'azure-pipelines' | 'azure' | 'vagrant' | 'prisma' | 'abc' | 'asciidoc' | 'istanbul' | 'edge' | 'scheme' | 'lisp' | 'tailwindcss' | '3d' | 'buildkite' | 'netlify' | 'netlify_light' | 'nest' | 'moon' | 'moonscript' | 'percy' | 'gitpod' | 'advpl_prw' | 'advpl_ptm' | 'advpl_tlpp' | 'advpl_include' | 'codeowners' | 'gcp' | 'disc' | 'fortran' | 'tcl' | 'liquid' | 'husky' | 'coconut' | 'tilt' | 'capacitor' | 'sketch' | 'adonis' | 'forth' | 'uml' | 'uml_light' | 'meson' | 'commitlint' | 'buck' | 'nrwl' | 'opam' | 'dune' | 'imba' | 'drawio' | 'pascal' | 'roadmap' | 'nuget' | 'command' | 'stryker' | 'denizenscript' | 'modernizr' | 'slug' | 'stitches' | 'stitches_light' | 'nginx' | 'replit' | 'rescript-interface' | 'snowpack' | 'snowpack_light' | 'brainfuck' | 'bicep' | 'cobol' | 'quasar' | 'dependabot' | 'pipeline' | 'vite' | 'vitest' | 'opa' | 'lerna' | 'windicss' | 'textlint' | 'lilypond' | 'chess_light' | 'sentry' | 'phpunit' | 'php-cs-fixer' | 'robots' | 'tsconfig' | 'tauri' | 'jsconfig' | 'maven' | 'ada' | 'serverless' | 'supabase' | 'ember' | 'horusec' | 'poetry' | 'coala' | 'parcel' | 'dinophp' | 'teal' | 'template' | 'astyle' | 'lighthouse' | 'svgr' | 'rome' | 'cypress' | 'siyuan' | 'ndst' | 'plop' | 'tobi' | 'tobimake' | 'gleam' | 'pnpm' | 'pnpm_light' | 'gridsome' | 'steadybit' | 'caddy' | 'bun' | 'bun_light' | 'antlr' | 'pinejs' | 'nano-staged' | 'nano-staged_light' | 'taskfile' | 'craco' | 'gamemaker' | 'tldraw' | 'tldraw_light' | 'mercurial' | 'deno' | 'deno_light' | 'plastic' | 'typst' | 'unocss' | 'ifanr-cloud' | 'mermaid' | 'werf' | 'roblox' | 'panda' | 'biome' | 'esbuild' | 'spwn' | 'templ' | 'chrome' | 'stan' | 'abap' | 'lottie' | 'puppeteer' | 'apps-script' | 'kubernetes' | 'file' | 'folder-robot' | 'folder-robot-open' | 'folder-src' | 'folder-src-open' | 'folder-dist' | 'folder-dist-open' | 'folder-css' | 'folder-css-open' | 'folder-sass' | 'folder-sass-open' | 'folder-images' | 'folder-images-open' | 'folder-scripts' | 'folder-scripts-open' | 'folder-node' | 'folder-node-open' | 'folder-javascript' | 'folder-javascript-open' | 'folder-json' | 'folder-json-open' | 'folder-font' | 'folder-font-open' | 'folder-bower' | 'folder-bower-open' | 'folder-test' | 'folder-test-open' | 'folder-jinja' | 'folder-jinja-open' | 'folder-jinja_light' | 'folder-jinja-open_light' | 'folder-markdown' | 'folder-markdown-open' | 'folder-php' | 'folder-php-open' | 'folder-phpmailer' | 'folder-phpmailer-open' | 'folder-sublime' | 'folder-sublime-open' | 'folder-docs' | 'folder-docs-open' | 'folder-git' | 'folder-git-open' | 'folder-github' | 'folder-github-open' | 'folder-gitlab' | 'folder-gitlab-open' | 'folder-vscode' | 'folder-vscode-open' | 'folder-views' | 'folder-views-open' | 'folder-vue' | 'folder-vue-open' | 'folder-vuepress' | 'folder-vuepress-open' | 'folder-expo' | 'folder-expo-open' | 'folder-config' | 'folder-config-open' | 'folder-i18n' | 'folder-i18n-open' | 'folder-components' | 'folder-components-open' | 'folder-verdaccio' | 'folder-verdaccio-open' | 'folder-aurelia' | 'folder-aurelia-open' | 'folder-resource' | 'folder-resource-open' | 'folder-lib' | 'folder-lib-open' | 'folder-theme' | 'folder-theme-open' | 'folder-webpack' | 'folder-webpack-open' | 'folder-global' | 'folder-global-open' | 'folder-public' | 'folder-public-open' | 'folder-include' | 'folder-include-open' | 'folder-docker' | 'folder-docker-open' | 'folder-database' | 'folder-database-open' | 'folder-log' | 'folder-log-open' | 'folder-target' | 'folder-target-open' | 'folder-temp' | 'folder-temp-open' | 'folder-aws' | 'folder-aws-open' | 'folder-audio' | 'folder-audio-open' | 'folder-video' | 'folder-video-open' | 'folder-kubernetes' | 'folder-kubernetes-open' | 'folder-import' | 'folder-import-open' | 'folder-export' | 'folder-export-open' | 'folder-wakatime' | 'folder-wakatime-open' | 'folder-circleci' | 'folder-circleci-open' | 'folder-wordpress' | 'folder-wordpress-open' | 'folder-gradle' | 'folder-gradle-open' | 'folder-coverage' | 'folder-coverage-open' | 'folder-class' | 'folder-class-open' | 'folder-other' | 'folder-other-open' | 'folder-lua' | 'folder-lua-open' | 'folder-typescript' | 'folder-typescript-open' | 'folder-graphql' | 'folder-graphql-open' | 'folder-routes' | 'folder-routes-open' | 'folder-ci' | 'folder-ci-open' | 'folder-benchmark' | 'folder-benchmark-open' | 'folder-messages' | 'folder-messages-open' | 'folder-less' | 'folder-less-open' | 'folder-gulp' | 'folder-gulp-open' | 'folder-python' | 'folder-python-open' | 'folder-mojo' | 'folder-mojo-open' | 'folder-moon' | 'folder-moon-open' | 'folder-debug' | 'folder-debug-open' | 'folder-fastlane' | 'folder-fastlane-open' | 'folder-plugin' | 'folder-plugin-open' | 'folder-middleware' | 'folder-middleware-open' | 'folder-controller' | 'folder-controller-open' | 'folder-ansible' | 'folder-ansible-open' | 'folder-server' | 'folder-server-open' | 'folder-client' | 'folder-client-open' | 'folder-tasks' | 'folder-tasks-open' | 'folder-android' | 'folder-android-open' | 'folder-ios' | 'folder-ios-open' | 'folder-upload' | 'folder-upload-open' | 'folder-download' | 'folder-download-open' | 'folder-tools' | 'folder-tools-open' | 'folder-helper' | 'folder-helper-open' | 'folder-serverless' | 'folder-serverless-open' | 'folder-api' | 'folder-api-open' | 'folder-app' | 'folder-app-open' | 'folder-apollo' | 'folder-apollo-open' | 'folder-archive' | 'folder-archive-open' | 'folder-batch' | 'folder-batch-open' | 'folder-buildkite' | 'folder-buildkite-open' | 'folder-cluster' | 'folder-cluster-open' | 'folder-command' | 'folder-command-open' | 'folder-constant' | 'folder-constant-open' | 'folder-container' | 'folder-container-open' | 'folder-content' | 'folder-content-open' | 'folder-context' | 'folder-context-open' | 'folder-core' | 'folder-core-open' | 'folder-delta' | 'folder-delta-open' | 'folder-dump' | 'folder-dump-open' | 'folder-examples' | 'folder-examples-open' | 'folder-environment' | 'folder-environment-open' | 'folder-functions' | 'folder-functions-open' | 'folder-generator' | 'folder-generator-open' | 'folder-hook' | 'folder-hook-open' | 'folder-job' | 'folder-job-open' | 'folder-keys' | 'folder-keys-open' | 'folder-layout' | 'folder-layout-open' | 'folder-mail' | 'folder-mail-open' | 'folder-mappings' | 'folder-mappings-open' | 'folder-meta' | 'folder-meta-open' | 'folder-changesets' | 'folder-changesets-open' | 'folder-packages' | 'folder-packages-open' | 'folder-shared' | 'folder-shared-open' | 'folder-shader' | 'folder-shader-open' | 'folder-stack' | 'folder-stack-open' | 'folder-template' | 'folder-template-open' | 'folder-utils' | 'folder-utils-open' | 'folder-supabase' | 'folder-supabase-open' | 'folder-private' | 'folder-private-open' | 'folder-linux' | 'folder-linux-open' | 'folder-windows' | 'folder-windows-open' | 'folder-macos' | 'folder-macos-open' | 'folder-error' | 'folder-error-open' | 'folder-event' | 'folder-event-open' | 'folder-secure' | 'folder-secure-open' | 'folder-custom' | 'folder-custom-open' | 'folder-mock' | 'folder-mock-open' | 'folder-syntax' | 'folder-syntax-open' | 'folder-vm' | 'folder-vm-open' | 'folder-stylus' | 'folder-stylus-open' | 'folder-flow' | 'folder-flow-open' | 'folder-rules' | 'folder-rules-open' | 'folder-review' | 'folder-review-open' | 'folder-animation' | 'folder-animation-open' | 'folder-guard' | 'folder-guard-open' | 'folder-prisma' | 'folder-prisma-open' | 'folder-pipe' | 'folder-pipe-open' | 'folder-svg' | 'folder-svg-open' | 'folder-terraform' | 'folder-terraform-open' | 'folder-mobile' | 'folder-mobile-open' | 'folder-stencil' | 'folder-stencil-open' | 'folder-firebase' | 'folder-firebase-open' | 'folder-svelte' | 'folder-svelte-open' | 'folder-update' | 'folder-update-open' | 'folder-intellij' | 'folder-intellij-open' | 'folder-intellij_light' | 'folder-intellij-open_light' | 'folder-azure-pipelines' | 'folder-azure-pipelines-open' | 'folder-mjml' | 'folder-mjml-open' | 'folder-admin' | 'folder-admin-open' | 'folder-scala' | 'folder-scala-open' | 'folder-connection' | 'folder-connection-open' | 'folder-quasar' | 'folder-quasar-open' | 'folder-next' | 'folder-next-open' | 'folder-cobol' | 'folder-cobol-open' | 'folder-yarn' | 'folder-yarn-open' | 'folder-husky' | 'folder-husky-open' | 'folder-storybook' | 'folder-storybook-open' | 'folder-base' | 'folder-base-open' | 'folder-cart' | 'folder-cart-open' | 'folder-home' | 'folder-home-open' | 'folder-project' | 'folder-project-open' | 'folder-interface' | 'folder-interface-open' | 'folder-netlify' | 'folder-netlify-open' | 'folder-enum' | 'folder-enum-open' | 'folder-contract' | 'folder-contract-open' | 'folder-queue' | 'folder-queue-open' | 'folder-vercel' | 'folder-vercel-open' | 'folder-cypress' | 'folder-cypress-open' | 'folder-decorators' | 'folder-decorators-open' | 'folder-java' | 'folder-java-open' | 'folder-resolver' | 'folder-resolver-open' | 'folder-angular' | 'folder-angular-open' | 'folder-unity' | 'folder-unity-open' | 'folder-pdf' | 'folder-pdf-open' | 'folder-proto' | 'folder-proto-open' | 'folder-plastic' | 'folder-plastic-open' | 'folder-gamemaker' | 'folder-gamemaker-open' | 'folder-mercurial' | 'folder-mercurial-open' | 'folder-godot' | 'folder-godot-open' | 'folder-lottie' | 'folder-lottie-open' | 'folder-taskfile' | 'folder-taskfile-open' | 'folder' | 'folder-open' | 'folder-root' | 'folder-root-open';
    /** Start date and time of plugin run */
    date: string;
    /** Duration of the plugin run in ms */
    duration: number;
    audits: {
      /** Reference to audit */
      slug: string;
      /** Descriptive name */
      title: string;
      /** Description (markdown) */
      description?: string | undefined;
      /** Link to documentation (rationale) */
      docsUrl?: (string | undefined) | string;
      /** Formatted value (e.g. '0.9 s', '2.1 MB') */
      displayValue?: string | undefined;
      /** Raw numeric value */
      value: number;
      /** Value between 0 and 1 */
      score: number;
      /** Detailed information */
      details?:
        | {
            /** List of findings */
            issues: {
              /** Descriptive error message */
              message: string;
              /** Severity level */
              severity: 'info' | 'warning' | 'error';
              /** Source file location */
              source?:
                | {
                    /** Relative path to source file in Git repo */
                    file: string;
                    /** Location in file */
                    position?:
                      | {
                          /** Start line */
                          startLine: number;
                          /** Start column */
                          startColumn?: number | undefined;
                          /** End line */
                          endLine?: number | undefined;
                          /** End column */
                          endColumn?: number | undefined;
                        }
                      | undefined;
                  }
                | undefined;
            }[];
          }
        | undefined;
    }[];
    groups?:
      | {
          /** Human-readable unique ID, e.g. "performance" */
          slug: string;
          refs: {
            /** Reference slug to a group within this plugin (e.g. 'max-lines') */
            slug: string;
            /** Weight used to calculate score */
            weight: number;
          }[];
          /** Descriptive name for the group */
          title: string;
          /** Description of the group (markdown) */
          description?: string | undefined;
          /** Group documentation site */
          docsUrl?: (string | undefined) | string;
        }[]
      | undefined;
  }[];
};
```
