// removes all color codes from the output for snapshot readability
export function removeColorCodes(stdout: string) {
  // eslint-disable-next-line no-control-regex
  return stdout.replace(/\u001B\[\d+m/g, '');
}

// Return a formatted JSON in TS object with the same keys as the input object but remove the " for the properties
export function formatObjectToFormattedJsString(
  jsonObj?:
    | {
        [key: string]: unknown;
      }
    | Array<unknown>,
): string | undefined {
  if (!jsonObj) {
    return;
  }
  // Convert JSON object to a string with indentation
  const jsonString = JSON.stringify(jsonObj, null, 2);

  // Remove double quotes around property names
  return jsonString.replace(/"(\w+)":/g, '$1:');
}
