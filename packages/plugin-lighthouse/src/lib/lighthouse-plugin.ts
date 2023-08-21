import { defaultConfig } from 'lighthouse';

type LighthousePluginConfig = {
  config: string;
};

export function lighthousePlugin({ config }: LighthousePluginConfig) {
  return {
    name: 'lighthouse',
    defaultConfig,
  };
}
