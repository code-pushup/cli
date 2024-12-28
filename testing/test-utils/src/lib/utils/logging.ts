export function getLogMessages(logger: any): string[] {
  return logger
    .getRenderer()
    .getLogs()
    .map(({ message }: { message: string }) => message);
}
