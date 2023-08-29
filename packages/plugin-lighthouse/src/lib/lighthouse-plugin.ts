import { defaultConfig } from 'lighthouse';

type LighthousePluginConfig = {
  config: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function lighthousePlugin({ config }: LighthousePluginConfig) {
  return {
    name: 'lighthouse',
    defaultConfig,
  };
}
