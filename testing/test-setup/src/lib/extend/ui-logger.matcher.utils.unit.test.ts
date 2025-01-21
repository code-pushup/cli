import { describe, expect, it } from 'vitest';
import {
  extractLevel,
  extractMessage,
  hasExpectedMessage,
} from './ui-logger.matcher.utils';

describe('extractLevel', () => {
  it('should extract level from an info log', () => {
    expect(extractLevel('[ blue(info) ] Info message')).toBe('info');
  });

  it('should extract level from a warning log', () => {
    expect(extractLevel('[ yellow(warn) ] Warning message')).toBe('warn');
  });

  it('should fall back to a default log level for a log without a level', () => {
    expect(extractLevel('Message without level')).toBe('log');
  });

  it('should fall back to a default log level for an invalid log level', () => {
    expect(extractLevel('[ unknown ] Message with invalid level')).toBe('log');
  });
});

describe('extractMessage', () => {
  it('should extract styled and unstyled messages from a log', () => {
    const { styledMessage, unstyledMessage } = extractMessage(
      '[ blue(info) ] \u001B[90mRun merge-diffs...\u001B[39m',
    );
    expect(styledMessage).toBe('\u001B[90mRun merge-diffs...\u001B[39m');
    expect(unstyledMessage).toBe('Run merge-diffs...');
  });

  it('should handle logs without styling', () => {
    const { styledMessage, unstyledMessage } = extractMessage(
      'Warning message without styles.',
    );
    expect(styledMessage).toBe('Warning message without styles.');
    expect(unstyledMessage).toBe('Warning message without styles.');
  });
});

describe('hasExpectedMessage', () => {
  it('should return true for a matching styled message', () => {
    const result = hasExpectedMessage('Styled message', {
      styledMessage: 'Styled message',
      unstyledMessage: 'Plain message',
    });
    expect(result).toBe(true);
  });

  it('should return true for a matching unstyled message', () => {
    const result = hasExpectedMessage('Plain message', {
      styledMessage: 'Styled message',
      unstyledMessage: 'Plain message',
    });
    expect(result).toBe(true);
  });

  it('should return false for a non-matching message', () => {
    const result = hasExpectedMessage('Non-matching message', {
      styledMessage: 'Styled message',
      unstyledMessage: 'Plain message',
    });
    expect(result).toBe(false);
  });

  it('should return false for undefined message', () => {
    const result = hasExpectedMessage('Expected message', undefined);
    expect(result).toBe(false);
  });

  it('should handle asymmetric matchers', () => {
    const asymmetricMatcher = expect.stringContaining('Styled');
    const result = hasExpectedMessage(asymmetricMatcher, {
      styledMessage: 'Styled message',
      unstyledMessage: 'Plain message',
    });
    expect(result).toBe(true);
  });
});
