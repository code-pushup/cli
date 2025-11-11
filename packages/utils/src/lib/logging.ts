import isaacs_cliui from '@isaacs/cliui';
import { cliui } from '@poppinss/cliui';
import ansis from 'ansis';
import { TERMINAL_WIDTH } from './text-formats/constants.js';

// TODO: remove once logger is used everywhere

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;
export type CliUiBase = ReturnType<typeof cliui>;
type UI = ReturnType<typeof isaacs_cliui>;
type CliExtension = {
  row: (r: ArgumentsType<UI['div']>) => void;
};
export type Column = {
  text: string;
  width?: number;
  align?: 'right' | 'left' | 'center';
  padding: number[];
  border?: boolean;
};
export type CliUi = CliUiBase & CliExtension;

// eslint-disable-next-line functional/no-let
let cliUISingleton: CliUiBase | undefined;
// eslint-disable-next-line functional/no-let
let cliUIExtendedSingleton: CliUi | undefined;

export function ui(): CliUi {
  if (cliUISingleton === undefined) {
    cliUISingleton = cliui();
  }
  if (!cliUIExtendedSingleton) {
    cliUIExtendedSingleton = {
      ...cliUISingleton,
      row: args => {
        logListItem(args);
      },
    };
  }

  return cliUIExtendedSingleton;
}

// eslint-disable-next-line functional/no-let
let singletonisaacUi: UI | undefined;
export function logListItem(args: ArgumentsType<UI['div']>) {
  if (singletonisaacUi === undefined) {
    singletonisaacUi = isaacs_cliui({ width: TERMINAL_WIDTH });
  }
  singletonisaacUi.div(...args);
  const content = singletonisaacUi.toString();
  // eslint-disable-next-line functional/immutable-data
  singletonisaacUi.rows = [];
  cliUIExtendedSingleton?.logger.log(content);
}

export function link(text: string) {
  return ansis.underline.blueBright(text);
}
