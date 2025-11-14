import ansis from 'ansis';

export function titleStyle(title: string) {
  return `${ansis.bold(title)}`;
}

export function headerStyle(title: string) {
  return `${ansis.green(title)}`;
}

export function descriptionStyle(title: string) {
  return `${ansis.dim(title)}`;
}

export function formatObjectValue<T>(opts: T, propName: keyof T) {
  const description = opts[propName];
  return {
    ...opts,
    ...(typeof description === 'string' && {
      [propName]: descriptionStyle(description),
    }),
  };
}

export function formatNestedValues<T>(
  options: Record<string, T>,
  propName: keyof T,
) {
  return Object.fromEntries(
    Object.entries(options).map(([key, opts]) => [
      key,
      formatObjectValue(opts, propName),
    ]),
  );
}
