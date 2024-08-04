import { bold, dim, green } from 'ansis';
import { describe, expect } from 'vitest';
import {
  descriptionStyle,
  formatNestedObjects,
  formatObject,
  headerStyle,
  titleStyle,
} from './formatting';

describe('titleStyle', () => {
  it('should return a string with green color', () => {
    expect(titleStyle('Code Pushup CLI')).toBe(bold('Code Pushup CLI'));
  });
});

describe('headerStyle', () => {
  it('should return a string with green color', () => {
    expect(headerStyle('Options')).toBe(green('Options'));
  });
});

describe('descriptionStyle', () => {
  it('should return a string with green color', () => {
    expect(
      descriptionStyle(
        'Run collect using custom tsconfig to parse code-pushup.config.ts file.',
      ),
    ).toBe(
      dim(
        'Run collect using custom tsconfig to parse code-pushup.config.ts file.',
      ),
    );
  });
});

describe('formatInformation', () => {
  it('should return a description property with dim color', () => {
    expect(
      formatObject(
        {
          describe: 'Directory for the produced reports',
        },
        'describe',
      ),
    ).toEqual({
      describe: dim('Directory for the produced reports'),
    });
  });
});

describe('formatOptions', () => {
  it('should return a description property with dim color', () => {
    expect(
      formatNestedObjects(
        {
          outputDir: {
            describe: 'Directory for the produced reports',
          },
        },
        'describe',
      ),
    ).toEqual({
      outputDir: {
        describe: dim('Directory for the produced reports'),
      },
    });
  });
});
