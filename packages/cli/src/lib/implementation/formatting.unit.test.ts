import ansis from 'ansis';
import {
  descriptionStyle,
  formatNestedValues,
  formatObjectValue,
  headerStyle,
  titleStyle,
} from './formatting.js';

describe('titleStyle', () => {
  it('should return a string with green color', () => {
    expect(titleStyle('Code Pushup CLI')).toBe(ansis.bold('Code Pushup CLI'));
  });
});

describe('headerStyle', () => {
  it('should return a string with green color', () => {
    expect(headerStyle('Options')).toBe(ansis.green('Options'));
  });
});

describe('descriptionStyle', () => {
  it('should return a string with green color', () => {
    expect(
      descriptionStyle(
        'Run collect using custom tsconfig to parse code-pushup.config.ts file.',
      ),
    ).toBe(
      ansis.dim(
        'Run collect using custom tsconfig to parse code-pushup.config.ts file.',
      ),
    );
  });
});

describe('formatObjectValue', () => {
  it('should return a description property with dim color', () => {
    expect(
      formatObjectValue(
        {
          describe: 'Directory for the produced reports',
        },
        'describe',
      ),
    ).toEqual({
      describe: ansis.dim('Directory for the produced reports'),
    });
  });
});

describe('formatNestedValues', () => {
  it('should return a description property with dim color', () => {
    expect(
      formatNestedValues(
        {
          outputDir: {
            describe: 'Directory for the produced reports',
          },
        },
        'describe',
      ),
    ).toEqual({
      outputDir: {
        describe: ansis.dim('Directory for the produced reports'),
      },
    });
  });
});
