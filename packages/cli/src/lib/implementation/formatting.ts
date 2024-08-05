import { bold, dim, green } from 'ansis';

export function titleStyle(title: string) {
  return `${bold(title)}`;
}

export function headerStyle(title: string) {
  return `${green(title)}`;
}

export function descriptionStyle(title: string) {
  return `${dim(title)}`;
}

export function formatObjectValue<T>(opts: T, propName: keyof T) {
  return {
    ...opts,
    ...(typeof opts[propName] === 'string' && {
      [propName]: descriptionStyle(opts[propName]),
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
