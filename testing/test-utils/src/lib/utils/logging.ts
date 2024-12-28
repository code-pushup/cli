// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLogMessages(logger: any): string[] {
  return logger
    .getRenderer()
    .getLogs()
    .map(({ message }: {message: string}) => message);
}
