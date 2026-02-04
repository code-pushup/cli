import { describe, expect, it } from 'vitest';
import { createTsconfigFormatter } from './formatter';
import type { Diagnostic } from './json-updater';

describe('formatter', () => {
  describe('createTsconfigFormatter', () => {
    it('should create formatter with default options', () => {
      const formatter = createTsconfigFormatter();
      expect(formatter.headerMessage).toBe('tsconfig out of sync');
      expect(formatter.format([], 'test.json')).toBe('');
    });

    it('should format single diagnostic', () => {
      const formatter = createTsconfigFormatter();
      const diagnostics: Diagnostic[] = [
        {
          path: 'project:compilerOptions.module',
          message: 'updated',
          before: 'CommonJS',
          after: 'ESNext',
        },
      ];
      const result = formatter.format(diagnostics, 'tsconfig.lib.json');
      expect(result).toContain('tsconfig out of sync: tsconfig.lib.json');
      expect(result).toContain('project');
      expect(result).toContain('module');
    });

    it('should format multiple diagnostics grouped by project', () => {
      const formatter = createTsconfigFormatter();
      const diagnostics: Diagnostic[] = [
        {
          path: 'project1:compilerOptions.module',
          message: 'updated',
          before: 'CommonJS',
          after: 'ESNext',
        },
        {
          path: 'project2:compilerOptions.module',
          message: 'updated',
          before: 'CommonJS',
          after: 'ESNext',
        },
      ];
      const result = formatter.format(diagnostics, 'tsconfig.lib.json');
      expect(result).toContain('project1');
      expect(result).toContain('project2');
    });

    it('should handle empty diagnostics', () => {
      const formatter = createTsconfigFormatter();
      expect(formatter.format([], 'test.json')).toBe('');
    });

    it('should create formatter with custom styling', () => {
      const formatter = createTsconfigFormatter({ styling: 'minimal' });
      expect(formatter).toBeDefined();
    });
  });
});
