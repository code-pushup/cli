import { DEFAULT_SETTINGS } from './constants';
import type {
  GitRefs,
  Options,
  ProviderAPIClient,
  RunResult as RunOutput,
  Settings,
} from './models';

export function runInCI(
  refs: GitRefs,
  api: ProviderAPIClient,
  options?: Options,
): Promise<RunOutput> {
  const settings: Settings = { ...DEFAULT_SETTINGS, ...options };
  // TODO: implement main flow
}
