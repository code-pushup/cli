import { cliui } from '@poppinss/cliui';
import ansis from 'ansis';

// TODO: remove once logger is used everywhere

export type CliUi = ReturnType<typeof cliui>;

// eslint-disable-next-line functional/no-let
let cliUISingleton: CliUi | undefined;

export function ui(): CliUi {
  cliUISingleton ??= cliui();
  return cliUISingleton;
}

export function link(text: string) {
  return ansis.underline.blueBright(text);
}
