import ansis from 'ansis';
import { formatAsciiSticker } from './sticker.js';

describe('formatAsciiSticker', () => {
  it('should frame lines with border and padding', () => {
    const output = formatAsciiSticker(['Hello,', 'How are you today?']);
    expect(ansis.strip(output)).toBe(
      `
┌──────────────────────────┐
│                          │
│    Hello,                │
│    How are you today?    │
│                          │
└──────────────────────────┘
      `.trim(),
    );
  });

  it('should align emojis, color codes and line breaks correctly', () => {
    const output = formatAsciiSticker([
      `✅ ${ansis.bold('ESLint')} ${ansis.gray('(1.2 s)')}`,
      `✅ ${ansis.bold('Code Coverage')} ${ansis.gray('(680 ms)')}`,
      `❌ ${ansis.bold('Lighthouse')}\n   - ${ansis.red('Unable to connect to Chrome')}`,
    ]);
    expect(ansis.strip(output)).toBe(
      `
┌────────────────────────────────────────┐
│                                        │
│    ✅ ESLint (1.2 s)                   │
│    ✅ Code Coverage (680 ms)           │
│    ❌ Lighthouse                       │
│       - Unable to connect to Chrome    │
│                                        │
└────────────────────────────────────────┘
      `.trim(),
    );
  });
});
