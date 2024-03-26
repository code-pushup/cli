# Contributing

## Setup

Make sure to install dependencies:

```sh
npm install
```

### Chrome path

In this plugin we provide Lighthouse functionality exposed over the `lighthousePlugin`.
To e2e test lighthouse properly we work with a predefined testing setup.

On some OS there could be a problem finding the path to Chrome.

We try to detect it automatically in the set-setup script.

If no chrome path is detected the error looks like this: `Runtime error encountered: No Chrome installations found.`

To prevent this from happening you have to provide the path manually in your `.env`:

```bash
CUSTOM_CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

We added consider this path in our `beforeAll` hook.

```ts
beforeEach(() => {
  try {
    vi.stubEnv('CHROME_PATH', getChromePath());
  } catch (e) {
    const customChromePath = (process.env as { CUSTOM_CHROME_PATH: string }).CUSTOM_CHROME_PATH;
    if (customChromePath == null || customChromePath === '') {
      throw new Error('Chrome path not found. Please read the in the packages CONTRIBUTING.md/#trouble-shooting section.');
    }
    vi.stubEnv('CHROME_PATH', customChromePath);
  }
});
```

### Testing chrome flags

1. run `npx chrome-debug --<chromium-flag>` to pass terminal arguments to Chrome. E.g. `npx chrome-debug --headless=shell`.
   `npx chrome-debug --headless=shell --@TODO-PUT-OTHER-EXAMPLE-FOR-FLAG`

For a full list of available flags check out [this document](https://peter.sh/experiments/chromium-command-line-switches/).

> [!NOTE]
> To pass chrome flags to lighthouse you have to provide them under `--chrome-flags="<chrome-flags-as-array>"`.
> E.g. `lighthouse https://example.com --chrome-flage="--headless=shell"`

2. Check if the flag got accepted. This is quite unintuitive as we would expect the passed flag to be visible under `chrome://flags/` but as you can see in the screenshot it is not visible.
   <img width="1202" alt="chrome-flags" src="./docs/images/chrome-flags.png">
   Instead open `chrome://version/` and look under the "Command Line" section.  
   <img width="1202" alt="chrome-chrome-version" src="./docs/images/chrome-version.png">

### Chrome User Data

To bootstrap Chrome with a predefined for setting we have to provide a couple of config files that we located under `<project-root>/mock/chromium-user-data`.
When executing Lighthouse we provide the path to this folder over the `Flag` object.

To generate initialise or edit the file structure under `chromium-user-data` do the following steps:

1. Spin up Chrome by running `npx chrome-debug --user-data-dir=./packages/plugin-lighthouse/mock/chromium-user-data`
   <img width="1202" alt="chrome-blank-screen" src="./docs/images/chrome-blank-screen.png">

2. If you do this the first time you should already see content under `<project-root>/mock/chromium-user-data`
3. Edit the configuration over the Chrome UI. E.g. adding a profile
4. Close chromium and open it again, and you should see chromium bootstraps as the configured user
   <img width="1202" alt="chrome-blank-screen-pre-configured" src="./docs/images/chrome-blank-screen-pre-configure.png">

To reset the above just delete the folder and apply the settings again.

_A helpful chromium setup is preconfigured with the following settings:_

- A user profile is set up. This enables certain debugging related options as well as help to visually distinguish between test setups as the header bar is colored.
  <img width="1202" alt="chrome-settings-manage-profile" src="./docs/images/chrome-settings-manage-profile.png">

#### Resources

- https://www.chromium.org/developers/how-tos/run-chromium-with-flags/