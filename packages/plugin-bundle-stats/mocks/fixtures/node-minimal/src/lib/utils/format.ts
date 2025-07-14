export function formatTimestamp(date: Date): string {
  return date.toISOString().split('T')[0] || date.toISOString();
}

export function validateInput(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function createId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const CONSTANTS = {
  DEFAULT_TIMEOUT: 5000,
  MAX_RETRIES: 3,
} as const;
