# How types flow

## General

**Naming:**  
The naming for arguments consumed over the CLI like user input directly in the process arguments. 
Those arguments are called `flags`. 

Flags can be used globally e.g. `npx code-pushup --verbose` or for a specific command e.g. `npx code-pushup collect --onlyPlugins=eslint,npm-audit`

**Parsing and Validation:**  
In our example we use `zod` as parser.

Parsing should be used when a unknown source for your data is present. e.g. data from `rc.config.json`.
Another situation would be the terminal input over prompts or CLI `flags`.

**Packages and Types:**  
The 3 main packages to use are `models`, `core`, `cli`.  

1. `model` - should  maintain types and parser for the logic in `core`.  
2. `core` - should reuse final typing. All less strict types should be maintained in `cli` oth other consumer of `core`.  
3. `cli` - reuses `model` and maintains all validations and parsing logic for less sctircter types. It executes the `core` logic.  
  examples are rc config or cli flags

## Example 

```ts
// === @code-pushup/model

type PersistOptions = {
  persist: {
    filename: string
  }
};
type PluginOptions = {
  plugins: string[]
};

// === @code-pushup/core

type GlobalOptions = {
  verbose: boolean
};

type CollectOnlyOptions = {
  onlyPlugins: string[]
};

type CollectOptions = GlobalOptions & PluginOptions & PersistOptions & CollectOnlyOptions;

type CollectLogic = (options: CollectOptions) => unknown;

// === @code-pushup/cli

// {persist: {filename: string}} => {persist?: {filename?: string}}
type DeepPartial<T> = { [Key in keyof T]?: Partial<T[Key]> };

//  {persist: {filename: string}} => {'persist.filename': string} 
type DotNotation<T> = { [Key in keyof T]?: Partial<T[Key]> };

type GlobalFlags = Partial<GlobalOptions>;

// Config
type ConfigFlags = { configPath?: string } & Partial<DotNotation<PersistOptions>>;

// -> Inside Middleware

type ConfigOptions = PluginOptions & PersistOptions;

// GlobalOptions => GlobalOptions

// ConfigFlags => DeepPartial<PersistOptions>
// GlobalFlags.configPath => PluginOptions & DeepPartial<PersistOptions>
// zod(PluginOptions & DeepPartial<PersistOptions> & DEFAULTS): ConfigOptions
type ConfigMiddleware<T extends GlobalFlags & ConfigFlags> = (args: T) => GlobalOptions & ConfigOptions;
// ---

// Collect
type SeperatedString = string; // e.g "a b c" or "a,b,c"
type CollectFlags = {
  onlyPlugins?: SeperatedString | string | string[]
};

// -> Inside Middleware

// GlobalOptions => GlobalOptions
// CollectFlags => CollectOnlyOptions
// ConfigOptions => PluginOptions & PersistOptions
// zod(PluginOptions & PersistOptions & DEFAULTS_OR_ERROR): CollectOptions
type CollectMiddleware = (args: GlobalOptions & ConfigOptions & CollectFlags) => CollectOptions;
// ---

// Call collectLogic
```
