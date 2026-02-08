import ansis, { type AnsiColors } from 'ansis';

export type StylingTheme =
  | 'default'
  | 'minimal'
  | 'colorful'
  | {
      colors?: {
        addition?: AnsiColors;
        update?: AnsiColors;
        removal?: AnsiColors;
        undefined?: AnsiColors;
      };
    };

export type ResolvedStylingConfig = {
  colors: {
    addition: AnsiColors | undefined;
    update: AnsiColors | undefined;
    removal: AnsiColors | undefined;
    undefined: AnsiColors | undefined;
  };
};

const DEFAULT_COLORS = {
  addition: 'green' as AnsiColors,
  update: 'yellow' as AnsiColors,
  removal: 'red' as AnsiColors,
  undefined: 'gray' as AnsiColors,
};

export function resolveTheme(theme?: StylingTheme): ResolvedStylingConfig {
  if (!theme || theme === 'default') {
    return {
      colors: DEFAULT_COLORS,
    };
  }

  if (theme === 'minimal') {
    return {
      colors: {
        addition: undefined,
        update: undefined,
        removal: undefined,
        undefined: undefined,
      },
    };
  }

  if (theme === 'colorful') {
    return {
      colors: {
        addition: 'green',
        update: 'yellow',
        removal: 'red',
        undefined: 'gray',
      },
    };
  }

  // Custom config
  return {
    colors: {
      addition: theme.colors?.addition ?? DEFAULT_COLORS.addition,
      update: theme.colors?.update ?? DEFAULT_COLORS.update,
      removal: theme.colors?.removal ?? DEFAULT_COLORS.removal,
      undefined: theme.colors?.undefined ?? DEFAULT_COLORS.undefined,
    },
  };
}

export type ColorHelpers = {
  green: (v: string) => string;
  red: (v: string) => string;
  gray: (v: string) => string;
  hasColors: boolean;
};

export function createColorHelpers(
  config: ResolvedStylingConfig,
): ColorHelpers {
  const hasColors =
    !!config.colors.addition ||
    !!config.colors.update ||
    !!config.colors.removal ||
    !!config.colors.undefined;

  return {
    green: (v: string) => (config.colors.addition ? ansis.green(v) : v),
    red: (v: string) => (config.colors.removal ? ansis.red(v) : v),
    gray: (v: string) => (config.colors.undefined ? ansis.gray(v) : v),
    hasColors,
  };
}
