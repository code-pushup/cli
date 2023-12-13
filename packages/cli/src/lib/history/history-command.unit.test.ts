import {vol} from 'memfs';
import {beforeEach, describe} from 'vitest';
import {HistoryOptions} from "@code-pushup/core";
import {MINIMAL_CONFIG_MOCK} from "@code-pushup/testing-utils";
import {yargsCli} from "../yargs-cli";
import {DEFAULT_CLI_CONFIGURATION} from "../../../mocks/constants";
import {yargsConfigCommandObject} from "../print-config/print-config-command";
import {objectToCliArgs} from "@code-pushup/utils";

describe('history-command', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
  });

  it('should throw for invalid targetBranch', async () => {
    const verboseConfig: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
      targetBranch: 'test',
    };
    await yargsCli(objectToCliArgs({
      ...verboseConfig,
      _ :'history',
      }),
      { ...DEFAULT_CLI_CONFIGURATION, commands: [yargsConfigCommandObject()] },
    ).parseAsync();
  });
});
