export function stringifyError(error: unknown): string {
  // TODO: special handling for ZodError instances
  if (error instanceof Error) {
    if (error.name === 'Error' || error.message.startsWith(error.name)) {
      return error.message;
    }
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}
