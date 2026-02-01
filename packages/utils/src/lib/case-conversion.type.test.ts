import { lowercase, uppercase } from './case-conversions.js';
import type { CamelCaseToKebabCase, KebabCaseToCamelCase } from './types.js';

describe('CamelCaseToKebabCase', () => {
  // ✅ CamelCase → kebab-case Type Tests

  it('CamelCaseToKebabCase works correctly', () => {
    expectTypeOf<
      CamelCaseToKebabCase<'myTestString'>
    >().toEqualTypeOf<'my-test-string'>();
    expectTypeOf<
      CamelCaseToKebabCase<'APIResponse'>
    >().toEqualTypeOf<'a-p-i-response'>();
    expectTypeOf<
      CamelCaseToKebabCase<'myXMLParser'>
    >().toEqualTypeOf<'my-x-m-l-parser'>();
    expectTypeOf<
      CamelCaseToKebabCase<'singleWord'>
    >().toEqualTypeOf<'single-word'>();

    // @ts-expect-error Ensures that non-camelCase strings do not pass
    assertType<CamelCaseToKebabCase<'hello_world'>>();

    // @ts-expect-error Numbers should not be transformed
    assertType<CamelCaseToKebabCase<'version2Release'>>();
  });

  // ✅ kebab-case → CamelCase Type Tests
  it('KebabCaseToCamelCase works correctly', () => {
    expectTypeOf<
      KebabCaseToCamelCase<'my-test-string'>
    >().toEqualTypeOf<'myTestString'>();
    expectTypeOf<
      KebabCaseToCamelCase<'a-p-i-response'>
    >().toEqualTypeOf<'aPIResponse'>();
    expectTypeOf<
      KebabCaseToCamelCase<'my-x-m-l-parser'>
    >().toEqualTypeOf<'myXMLParser'>();
    expectTypeOf<
      KebabCaseToCamelCase<'single-word'>
    >().toEqualTypeOf<'singleWord'>();

    // @ts-expect-error Ensures that non-kebab-case inputs are not accepted
    assertType<KebabCaseToCamelCase<'my Test String'>>();

    // @ts-expect-error Numbers should not be transformed
    assertType<KebabCaseToCamelCase<'version-2-release'>>();
  });

  // ✅ Edge Cases
  it('Edge cases for case conversions', () => {
    expectTypeOf<CamelCaseToKebabCase<''>>().toEqualTypeOf<''>();
    expectTypeOf<KebabCaseToCamelCase<''>>().toEqualTypeOf<''>();

    // @ts-expect-error Ensures no spaces allowed in input
    assertType<CamelCaseToKebabCase<'this is not camelCase'>>();

    // @ts-expect-error Ensures no mixed case with dashes
    assertType<KebabCaseToCamelCase<'this-Is-Wrong'>>();
  });
});

describe('lowercase', () => {
  it('converts string literal to lowercased literal', () => {
    expectTypeOf(lowercase('Warning' as const)).toEqualTypeOf<'warning'>();
  });

  it('converts enum value to lowercased string literal', () => {
    enum Severity {
      Warning = 'Warning',
    }
    expectTypeOf(lowercase(Severity.Warning)).toEqualTypeOf<'warning'>();
  });

  it('converts string to string', () => {
    expectTypeOf(lowercase('hello, world')).toBeString();
  });
});

describe('uppercase', () => {
  it('converts string literal to uppercased literal', () => {
    expectTypeOf(uppercase('Warning' as const)).toEqualTypeOf<'WARNING'>();
  });

  it('converts enum value to uppercased string literal', () => {
    enum Severity {
      Warning = 'Warning',
    }
    expectTypeOf(uppercase(Severity.Warning)).toEqualTypeOf<'WARNING'>();
  });

  it('converts string to string', () => {
    expectTypeOf(uppercase('hello, world')).toBeString();
  });
});
