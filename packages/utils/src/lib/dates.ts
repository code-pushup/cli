export function dateToUnixTimestamp(date: Date): number {
  return Math.round(date.getTime() / 1000);
}
