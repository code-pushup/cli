import { bold, dim, green } from 'ansis';

export function titleStyle(title: unknown) {
  return `${bold((title as string).toString())}`;
}

export function headerStyle(title: unknown) {
  return `${green((title as string).toString())}`;
}

export function descriptionStyle(title: unknown) {
  return `${dim((title as string).toString())}`;
}

export function formatObject<T>(opts: T, propName: keyof T) {
  return {
    ...opts,
    ...(opts[propName] && {
      [propName]: `${descriptionStyle(opts[propName])}`,
    }),
  };
}

export function formatNestedObjects<T>(
  options: Record<string, T>,
  propName: keyof T,
) {
  return Object.fromEntries(
    Object.entries(options).map(([key, opts]) => [
      key,
      formatObject(opts, propName),
    ]),
  );
}
