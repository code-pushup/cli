import type { Audit } from '@code-pushup/models';

/* eslint-disable max-lines */
export const AUDITS = [
  {
    slug: 'unterminated-string-literal',
    title: 'Unterminated String Literal',
    description: 'Unterminated string literal.',
  },
  {
    slug: 'identifier-expected',
    title: 'Identifier Expected',
    description: 'Identifier expected.',
  },
  {
    slug: 'token-expected',
    title: 'Token Expected',
    description: "'{0}' expected.",
  },
  {
    slug: 'self-reference-error',
    title: 'Self Reference Error',
    description: 'A file cannot have a reference to itself.',
  },
  {
    slug: 'mismatched-token',
    title: 'Mismatched Token',
    description:
      "The parser expected to find a '{1}' to match the '{0}' token here.",
  },
  {
    slug: 'trailing-comma-not-allowed',
    title: 'Trailing Comma Not Allowed',
    description: 'Trailing comma not allowed.',
  },
  {
    slug: 'end-comment-expected',
    title: 'End Comment Expected',
    description: "'*/' expected.",
  },
  {
    slug: 'argument-expected',
    title: 'Argument Expected',
    description: 'An element access expression should take an argument.',
  },
  {
    slug: 'unexpected-token',
    title: 'Unexpected Token',
    description: 'Unexpected token.',
  },
  {
    slug: 'no-trailing-comma',
    title: 'No Trailing Comma',
    description:
      'A rest parameter or binding pattern may not have a trailing comma.',
  },
  {
    slug: 'rest-param-must-be-last',
    title: 'Rest Param Must Be Last',
    description: 'A rest parameter must be last in a parameter list.',
  },
  {
    slug: 'invalid-param-initializer',
    title: 'Invalid Param Initializer',
    description: 'Parameter cannot have question mark and initializer.',
  },
  {
    slug: 'optional-param-order-error',
    title: 'Optional Param Order Error',
    description: 'A required parameter cannot follow an optional parameter.',
  },
  {
    slug: 'invalid-rest-in-index-signature',
    title: 'Invalid Rest In Index Signature',
    description: 'An index signature cannot have a rest parameter.',
  },
  {
    slug: 'no-access-modifier-in-index-signature',
    title: 'No Access Modifier In Index Signature',
    description:
      'An index signature parameter cannot have an accessibility modifier.',
  },
  {
    slug: 'no-optional-in-index-signature',
    title: 'No Optional In Index Signature',
    description: 'An index signature parameter cannot have a question mark.',
  },
  {
    slug: 'no-initializer-in-index-signature',
    title: 'No Initializer In Index Signature',
    description: 'An index signature parameter cannot have an initializer.',
  },
  {
    slug: 'index-signature-type-required',
    title: 'Index Signature Type Required',
    description: 'An index signature must have a type annotation.',
  },
  {
    slug: 'index-param-type-required',
    title: 'Index Param Type Required',
    description: 'An index signature parameter must have a type annotation.',
  },
  {
    slug: 'readonly-only-on-properties',
    title: 'Readonly Only On Properties',
    description:
      "'readonly' modifier can only appear on a property declaration or index signature.",
  },
  {
    slug: 'no-trailing-comma-in-index-signature',
    title: 'No Trailing Comma In Index Signature',
    description: 'An index signature cannot have a trailing comma.',
  },
  {
    slug: 'duplicate-access-modifier',
    title: 'Duplicate Access Modifier',
    description: 'Accessibility modifier already seen.',
  },
  {
    slug: 'modifier-order-error',
    title: 'Modifier Order Error',
    description: "'{0}' modifier must precede '{1}' modifier.",
  },
  {
    slug: 'duplicate-modifier',
    title: 'Duplicate Modifier',
    description: "'{0}' modifier already seen.",
  },
  {
    slug: 'invalid-modifier-placement',
    title: 'Invalid Modifier Placement',
    description: "'{0}' modifier cannot appear on class elements of this kind.",
  },
  {
    slug: 'invalid-super-usage',
    title: 'Invalid Super Usage',
    description:
      "'super' must be followed by an argument list or member access.",
  },
  {
    slug: 'quoted-names-in-modules-only',
    title: 'Quoted Names In Modules Only',
    description: 'Only ambient modules can use quoted names.',
  },
  {
    slug: 'no-statements-in-ambient',
    title: 'No Statements In Ambient',
    description: 'Statements are not allowed in ambient contexts.',
  },
  {
    slug: 'declare-not-in-ambient',
    title: 'Declare Not In Ambient',
    description:
      "A 'declare' modifier cannot be used in an already ambient context.",
  },
  {
    slug: 'no-initializer-in-ambient',
    title: 'No Initializer In Ambient',
    description: 'Initializers are not allowed in ambient contexts.',
  },
  {
    slug: 'invalid-modifier-in-ambient',
    title: 'Invalid Modifier In Ambient',
    description: "'{0}' modifier cannot be used in an ambient context.",
  },
  {
    slug: 'invalid-modifier-here',
    title: 'Invalid Modifier Here',
    description: "'{0}' modifier cannot be used here.",
  },
  {
    slug: 'invalid-modifier-on-module',
    title: 'Invalid Modifier On Module',
    description:
      "'{0}' modifier cannot appear on a module or namespace element.",
  },
  {
    slug: 'invalid-declaration-in-dts',
    title: 'Invalid Declaration In Dts',
    description:
      "Top-level declarations in .d.ts files must start with either a 'declare' or 'export' modifier.",
  },
  {
    slug: 'rest-param-not-optional',
    title: 'Rest Param Not Optional',
    description: 'A rest parameter cannot be optional.',
  },
  {
    slug: 'rest-param-no-initializer',
    title: 'Rest Param No Initializer',
    description: 'A rest parameter cannot have an initializer.',
  },
  {
    slug: 'setter-one-param-only',
    title: 'Setter One Param Only',
    description: "A 'set' accessor must have exactly one parameter.",
  },
  {
    slug: 'setter-no-optional-param',
    title: 'Setter No Optional Param',
    description: "A 'set' accessor cannot have an optional parameter.",
  },
  {
    slug: 'setter-no-initializer',
    title: 'Setter No Initializer',
    description: "A 'set' accessor parameter cannot have an initializer.",
  },
  {
    slug: 'setter-no-rest-param',
    title: 'Setter No Rest Param',
    description: "A 'set' accessor cannot have rest parameter.",
  },
  {
    slug: 'getter-no-params',
    title: 'Getter No Params',
    description: "A 'get' accessor cannot have parameters.",
  },
  {
    slug: 'invalid-async-return-type',
    title: 'Invalid Async Return Type',
    description:
      "Type '{0}' is not a valid async function return type in ES5 because it does not refer to a Promise-compatible constructor value.",
  },
  {
    slug: 'accessors-require-es5',
    title: 'Accessors Require Es5',
    description:
      'Accessors are only available when targeting ECMAScript 5 and higher.',
  },
  {
    slug: 'invalid-async-promise',
    title: 'Invalid Async Promise',
    description:
      "The return type of an async function must either be a valid promise or must not contain a callable 'then' member.",
  },
  {
    slug: 'promise-requires-then',
    title: 'Promise Requires Then',
    description: "A promise must have a 'then' method.",
  },
  {
    slug: 'promise-then-callback-required',
    title: 'Promise Then Callback Required',
    description:
      "The first parameter of the 'then' method of a promise must be a callback.",
  },
  {
    slug: 'enum-initializer-required',
    title: 'Enum Initializer Required',
    description: 'Enum member must have initializer.',
  },
  {
    slug: 'recursive-promise-reference',
    title: 'Recursive Promise Reference',
    description:
      "Type is referenced directly or indirectly in the fulfillment callback of its own 'then' method.",
  },
  {
    slug: 'export-assignment-error',
    title: 'Export Assignment Error',
    description: 'An export assignment cannot be used in a namespace.',
  },
  {
    slug: 'async-promise-type-error',
    title: 'Async Promise Type Error',
    description:
      "The return type of an async function or method must be the global Promise<T> type. Did you mean to write 'Promise<{0}>'?",
  },
  {
    slug: 'ts-code-1065',
    title: 'Ts Code 1065',
    description:
      'The return type of an async function or method must be the global Promise<T> type.',
  },
  {
    slug: 'constant-enum-initializer-required',
    title: 'Constant Enum Initializer Required',
    description:
      'In ambient enum declarations member initializer must be constant expression.',
  },
  {
    slug: 'ts-code-1068',
    title: 'Ts Code 1068',
    description:
      'Unexpected token. A constructor, method, accessor, or property was expected.',
  },
  {
    slug: 'ts-code-1069',
    title: 'Ts Code 1069',
    description:
      'Unexpected token. A type parameter name was expected without curly braces.',
  },
  {
    slug: 'ts-code-1070',
    title: 'Ts Code 1070',
    description: "'{0}' modifier cannot appear on a type member.",
  },
  {
    slug: 'ts-code-1071',
    title: 'Ts Code 1071',
    description: "'{0}' modifier cannot appear on an index signature.",
  },
  {
    slug: 'ts-code-1079',
    title: 'Ts Code 1079',
    description: "A '{0}' modifier cannot be used with an import declaration.",
  },
  {
    slug: 'ts-code-1084',
    title: 'Ts Code 1084',
    description: "Invalid 'reference' directive syntax.",
  },
  {
    slug: 'invalid-constructor-modifier',
    title: 'Invalid Constructor Modifier',
    description: "'{0}' modifier cannot appear on a constructor declaration.",
  },
  {
    slug: 'invalid-param-modifier',
    title: 'Invalid Param Modifier',
    description: "'{0}' modifier cannot appear on a parameter.",
  },
  {
    slug: 'ts-code-1091',
    title: 'Ts Code 1091',
    description:
      "Only a single variable declaration is allowed in a 'for...in' statement.",
  },
  {
    slug: 'ts-code-1092',
    title: 'Ts Code 1092',
    description: 'Type parameters cannot appear on a constructor declaration.',
  },
  {
    slug: 'ts-code-1093',
    title: 'Ts Code 1093',
    description: 'Type annotation cannot appear on a constructor declaration.',
  },
  {
    slug: 'ts-code-1094',
    title: 'Ts Code 1094',
    description: 'An accessor cannot have type parameters.',
  },
  {
    slug: 'ts-code-1095',
    title: 'Ts Code 1095',
    description: "A 'set' accessor cannot have a return type annotation.",
  },
  {
    slug: 'ts-code-1096',
    title: 'Ts Code 1096',
    description: 'An index signature must have exactly one parameter.',
  },
  {
    slug: 'ts-code-1097',
    title: 'Ts Code 1097',
    description: "'{0}' list cannot be empty.",
  },
  {
    slug: 'ts-code-1098',
    title: 'Ts Code 1098',
    description: 'Type parameter list cannot be empty.',
  },
  {
    slug: 'ts-code-1099',
    title: 'Ts Code 1099',
    description: 'Type argument list cannot be empty.',
  },
  {
    slug: 'ts-code-1100',
    title: 'Ts Code 1100',
    description: "Invalid use of '{0}' in strict mode.",
  },
  {
    slug: 'ts-code-1101',
    title: 'Ts Code 1101',
    description: "'with' statements are not allowed in strict mode.",
  },
  {
    slug: 'ts-code-1102',
    title: 'Ts Code 1102',
    description: "'delete' cannot be called on an identifier in strict mode.",
  },
  {
    slug: 'ts-code-1103',
    title: 'Ts Code 1103',
    description:
      "'for await' loops are only allowed within async functions and at the top levels of modules.",
  },
  {
    slug: 'ts-code-1104',
    title: 'Ts Code 1104',
    description:
      "A 'continue' statement can only be used within an enclosing iteration statement.",
  },
  {
    slug: 'ts-code-1105',
    title: 'Ts Code 1105',
    description:
      "A 'break' statement can only be used within an enclosing iteration or switch statement.",
  },
  {
    slug: 'ts-code-1106',
    title: 'Ts Code 1106',
    description:
      "The left-hand side of a 'for...of' statement may not be 'async'.",
  },
  {
    slug: 'ts-code-1107',
    title: 'Ts Code 1107',
    description: 'Jump target cannot cross function boundary.',
  },
  {
    slug: 'ts-code-1108',
    title: 'Ts Code 1108',
    description:
      "A 'return' statement can only be used within a function body.",
  },
  {
    slug: 'ts-code-1109',
    title: 'Ts Code 1109',
    description: 'Expression expected.',
  },
  {
    slug: 'ts-code-1110',
    title: 'Ts Code 1110',
    description: 'Type expected.',
  },
  {
    slug: 'ts-code-1111',
    title: 'Ts Code 1111',
    description: "Private field '{0}' must be declared in an enclosing class.",
  },
  {
    slug: 'ts-code-1113',
    title: 'Ts Code 1113',
    description:
      "A 'default' clause cannot appear more than once in a 'switch' statement.",
  },
  {
    slug: 'ts-code-1114',
    title: 'Ts Code 1114',
    description: "Duplicate label '{0}'.",
  },
  {
    slug: 'ts-code-1115',
    title: 'Ts Code 1115',
    description:
      "A 'continue' statement can only jump to a label of an enclosing iteration statement.",
  },
  {
    slug: 'ts-code-1116',
    title: 'Ts Code 1116',
    description:
      "A 'break' statement can only jump to a label of an enclosing statement.",
  },
  {
    slug: 'ts-code-1117',
    title: 'Ts Code 1117',
    description:
      'An object literal cannot have multiple properties with the same name.',
  },
  {
    slug: 'ts-code-1118',
    title: 'Ts Code 1118',
    description:
      'An object literal cannot have multiple get/set accessors with the same name.',
  },
  {
    slug: 'ts-code-1119',
    title: 'Ts Code 1119',
    description:
      'An object literal cannot have property and accessor with the same name.',
  },
  {
    slug: 'ts-code-1120',
    title: 'Ts Code 1120',
    description: 'An export assignment cannot have modifiers.',
  },
  {
    slug: 'ts-code-1121',
    title: 'Ts Code 1121',
    description: "Octal literals are not allowed. Use the syntax '{0}'.",
  },
  {
    slug: 'ts-code-1123',
    title: 'Ts Code 1123',
    description: 'Variable declaration list cannot be empty.',
  },
  {
    slug: 'ts-code-1124',
    title: 'Ts Code 1124',
    description: 'Digit expected.',
  },
  {
    slug: 'ts-code-1125',
    title: 'Ts Code 1125',
    description: 'Hexadecimal digit expected.',
  },
  {
    slug: 'ts-code-1126',
    title: 'Ts Code 1126',
    description: 'Unexpected end of text.',
  },
  {
    slug: 'ts-code-1127',
    title: 'Ts Code 1127',
    description: 'Invalid character.',
  },
  {
    slug: 'ts-code-1128',
    title: 'Ts Code 1128',
    description: 'Declaration or statement expected.',
  },
  {
    slug: 'ts-code-1129',
    title: 'Ts Code 1129',
    description: 'Statement expected.',
  },
  {
    slug: 'ts-code-1130',
    title: 'Ts Code 1130',
    description: "'case' or 'default' expected.",
  },
  {
    slug: 'ts-code-1131',
    title: 'Ts Code 1131',
    description: 'Property or signature expected.',
  },
  {
    slug: 'ts-code-1132',
    title: 'Ts Code 1132',
    description: 'Enum member expected.',
  },
  {
    slug: 'ts-code-1134',
    title: 'Ts Code 1134',
    description: 'Variable declaration expected.',
  },
  {
    slug: 'ts-code-1135',
    title: 'Ts Code 1135',
    description: 'Argument expression expected.',
  },
  {
    slug: 'ts-code-1136',
    title: 'Ts Code 1136',
    description: 'Property assignment expected.',
  },
  {
    slug: 'ts-code-1137',
    title: 'Ts Code 1137',
    description: 'Expression or comma expected.',
  },
  {
    slug: 'ts-code-1138',
    title: 'Ts Code 1138',
    description: 'Parameter declaration expected.',
  },
  {
    slug: 'ts-code-1139',
    title: 'Ts Code 1139',
    description: 'Type parameter declaration expected.',
  },
  {
    slug: 'ts-code-1140',
    title: 'Ts Code 1140',
    description: 'Type argument expected.',
  },
  {
    slug: 'ts-code-1141',
    title: 'Ts Code 1141',
    description: 'String literal expected.',
  },
  {
    slug: 'ts-code-1142',
    title: 'Ts Code 1142',
    description: 'Line break not permitted here.',
  },
  {
    slug: 'ts-code-1144',
    title: 'Ts Code 1144',
    description: "'{' or ';' expected.",
  },
  {
    slug: 'ts-code-1145',
    title: 'Ts Code 1145',
    description: "'{' or JSX element expected.",
  },
  {
    slug: 'ts-code-1146',
    title: 'Ts Code 1146',
    description: 'Declaration expected.',
  },
  {
    slug: 'ts-code-1147',
    title: 'Ts Code 1147',
    description:
      'Import declarations in a namespace cannot reference a module.',
  },
  {
    slug: 'ts-code-1148',
    title: 'Ts Code 1148',
    description:
      "Cannot use imports, exports, or module augmentations when '--module' is 'none'.",
  },
  {
    slug: 'ts-code-1149',
    title: 'Ts Code 1149',
    description:
      "File name '{0}' differs from already included file name '{1}' only in casing.",
  },
  {
    slug: 'ts-code-1155',
    title: 'Ts Code 1155',
    description: "'{0}' declarations must be initialized.",
  },
  {
    slug: 'ts-code-1156',
    title: 'Ts Code 1156',
    description: "'{0}' declarations can only be declared inside a block.",
  },
  {
    slug: 'ts-code-1160',
    title: 'Ts Code 1160',
    description: 'Unterminated template literal.',
  },
  {
    slug: 'ts-code-1161',
    title: 'Ts Code 1161',
    description: 'Unterminated regular expression literal.',
  },
  {
    slug: 'ts-code-1162',
    title: 'Ts Code 1162',
    description: 'An object member cannot be declared optional.',
  },
  {
    slug: 'ts-code-1163',
    title: 'Ts Code 1163',
    description: "A 'yield' expression is only allowed in a generator body.",
  },
  {
    slug: 'ts-code-1164',
    title: 'Ts Code 1164',
    description: 'Computed property names are not allowed in enums.',
  },
  {
    slug: 'ts-code-1165',
    title: 'Ts Code 1165',
    description:
      "A computed property name in an ambient context must refer to an expression whose type is a literal type or a 'unique symbol' type.",
  },
  {
    slug: 'ts-code-1166',
    title: 'Ts Code 1166',
    description:
      "A computed property name in a class property declaration must have a simple literal type or a 'unique symbol' type.",
  },
  {
    slug: 'ts-code-1168',
    title: 'Ts Code 1168',
    description:
      "A computed property name in a method overload must refer to an expression whose type is a literal type or a 'unique symbol' type.",
  },
  {
    slug: 'ts-code-1169',
    title: 'Ts Code 1169',
    description:
      "A computed property name in an interface must refer to an expression whose type is a literal type or a 'unique symbol' type.",
  },
  {
    slug: 'ts-code-1170',
    title: 'Ts Code 1170',
    description:
      "A computed property name in a type literal must refer to an expression whose type is a literal type or a 'unique symbol' type.",
  },
  {
    slug: 'ts-code-1171',
    title: 'Ts Code 1171',
    description:
      'A comma expression is not allowed in a computed property name.',
  },
  {
    slug: 'ts-code-1172',
    title: 'Ts Code 1172',
    description: "'extends' clause already seen.",
  },
  {
    slug: 'ts-code-1173',
    title: 'Ts Code 1173',
    description: "'extends' clause must precede 'implements' clause.",
  },
  {
    slug: 'ts-code-1174',
    title: 'Ts Code 1174',
    description: 'Classes can only extend a single class.',
  },
  {
    slug: 'ts-code-1175',
    title: 'Ts Code 1175',
    description: "'implements' clause already seen.",
  },
  {
    slug: 'ts-code-1176',
    title: 'Ts Code 1176',
    description: "Interface declaration cannot have 'implements' clause.",
  },
  {
    slug: 'ts-code-1177',
    title: 'Ts Code 1177',
    description: 'Binary digit expected.',
  },
  {
    slug: 'ts-code-1178',
    title: 'Ts Code 1178',
    description: 'Octal digit expected.',
  },
  {
    slug: 'ts-code-1179',
    title: 'Ts Code 1179',
    description: "Unexpected token. '{' expected.",
  },
  {
    slug: 'ts-code-1180',
    title: 'Ts Code 1180',
    description: 'Property destructuring pattern expected.',
  },
  {
    slug: 'ts-code-1181',
    title: 'Ts Code 1181',
    description: 'Array element destructuring pattern expected.',
  },
  {
    slug: 'ts-code-1182',
    title: 'Ts Code 1182',
    description: 'A destructuring declaration must have an initializer.',
  },
  {
    slug: 'ts-code-1183',
    title: 'Ts Code 1183',
    description: 'An implementation cannot be declared in ambient contexts.',
  },
  {
    slug: 'ts-code-1184',
    title: 'Ts Code 1184',
    description: 'Modifiers cannot appear here.',
  },
  {
    slug: 'ts-code-1185',
    title: 'Ts Code 1185',
    description: 'Merge conflict marker encountered.',
  },
  {
    slug: 'ts-code-1186',
    title: 'Ts Code 1186',
    description: 'A rest element cannot have an initializer.',
  },
  {
    slug: 'ts-code-1187',
    title: 'Ts Code 1187',
    description:
      'A parameter property may not be declared using a binding pattern.',
  },
  {
    slug: 'ts-code-1188',
    title: 'Ts Code 1188',
    description:
      "Only a single variable declaration is allowed in a 'for...of' statement.",
  },
  {
    slug: 'ts-code-1189',
    title: 'Ts Code 1189',
    description:
      "The variable declaration of a 'for...in' statement cannot have an initializer.",
  },
  {
    slug: 'ts-code-1190',
    title: 'Ts Code 1190',
    description:
      "The variable declaration of a 'for...of' statement cannot have an initializer.",
  },
  {
    slug: 'ts-code-1191',
    title: 'Ts Code 1191',
    description: 'An import declaration cannot have modifiers.',
  },
  {
    slug: 'ts-code-1192',
    title: 'Ts Code 1192',
    description: "Module '{0}' has no default export.",
  },
  {
    slug: 'ts-code-1193',
    title: 'Ts Code 1193',
    description: 'An export declaration cannot have modifiers.',
  },
  {
    slug: 'ts-code-1194',
    title: 'Ts Code 1194',
    description: 'Export declarations are not permitted in a namespace.',
  },
  {
    slug: 'ts-code-1195',
    title: 'Ts Code 1195',
    description: "'export *' does not re-export a default.",
  },
  {
    slug: 'ts-code-1196',
    title: 'Ts Code 1196',
    description:
      "Catch clause variable type annotation must be 'any' or 'unknown' if specified.",
  },
  {
    slug: 'ts-code-1197',
    title: 'Ts Code 1197',
    description: 'Catch clause variable cannot have an initializer.',
  },
  {
    slug: 'ts-code-1198',
    title: 'Ts Code 1198',
    description:
      'An extended Unicode escape value must be between 0x0 and 0x10FFFF inclusive.',
  },
  {
    slug: 'ts-code-1199',
    title: 'Ts Code 1199',
    description: 'Unterminated Unicode escape sequence.',
  },
  {
    slug: 'ts-code-1200',
    title: 'Ts Code 1200',
    description: 'Line terminator not permitted before arrow.',
  },
  {
    slug: 'ts-code-1202',
    title: 'Ts Code 1202',
    description:
      'Import assignment cannot be used when targeting ECMAScript modules. Consider using \'import * as ns from "mod"\', \'import {a} from "mod"\', \'import d from "mod"\', or another module format instead.',
  },
  {
    slug: 'ts-code-1203',
    title: 'Ts Code 1203',
    description:
      "Export assignment cannot be used when targeting ECMAScript modules. Consider using 'export default' or another module format instead.",
  },
  {
    slug: 'ts-code-1205',
    title: 'Ts Code 1205',
    description:
      "Re-exporting a type when '{0}' is enabled requires using 'export type'.",
  },
  {
    slug: 'ts-code-1206',
    title: 'Ts Code 1206',
    description: 'Decorators are not valid here.',
  },
  {
    slug: 'ts-code-1207',
    title: 'Ts Code 1207',
    description:
      'Decorators cannot be applied to multiple get/set accessors of the same name.',
  },
  {
    slug: 'ts-code-1209',
    title: 'Ts Code 1209',
    description:
      "Invalid optional chain from new expression. Did you mean to call '{0}()'?",
  },
  {
    slug: 'ts-code-1210',
    title: 'Ts Code 1210',
    description:
      "Code contained in a class is evaluated in JavaScript's strict mode which does not allow this use of '{0}'. For more information, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode.",
  },
  {
    slug: 'ts-code-1211',
    title: 'Ts Code 1211',
    description:
      "A class declaration without the 'default' modifier must have a name.",
  },
  {
    slug: 'ts-code-1212',
    title: 'Ts Code 1212',
    description:
      "Identifier expected. '{0}' is a reserved word in strict mode.",
  },
  {
    slug: 'ts-code-1213',
    title: 'Ts Code 1213',
    description:
      "Identifier expected. '{0}' is a reserved word in strict mode. Class definitions are automatically in strict mode.",
  },
  {
    slug: 'ts-code-1214',
    title: 'Ts Code 1214',
    description:
      "Identifier expected. '{0}' is a reserved word in strict mode. Modules are automatically in strict mode.",
  },
  {
    slug: 'ts-code-1215',
    title: 'Ts Code 1215',
    description:
      "Invalid use of '{0}'. Modules are automatically in strict mode.",
  },
  {
    slug: 'ts-code-1216',
    title: 'Ts Code 1216',
    description:
      "Identifier expected. '__esModule' is reserved as an exported marker when transforming ECMAScript modules.",
  },
  {
    slug: 'ts-code-1218',
    title: 'Ts Code 1218',
    description:
      "Export assignment is not supported when '--module' flag is 'system'.",
  },
  {
    slug: 'ts-code-1221',
    title: 'Ts Code 1221',
    description: 'Generators are not allowed in an ambient context.',
  },
  {
    slug: 'ts-code-1222',
    title: 'Ts Code 1222',
    description: 'An overload signature cannot be declared as a generator.',
  },
  {
    slug: 'ts-code-1223',
    title: 'Ts Code 1223',
    description: "'{0}' tag already specified.",
  },
  {
    slug: 'ts-code-1224',
    title: 'Ts Code 1224',
    description: "Signature '{0}' must be a type predicate.",
  },
  {
    slug: 'ts-code-1225',
    title: 'Ts Code 1225',
    description: "Cannot find parameter '{0}'.",
  },
  {
    slug: 'ts-code-1226',
    title: 'Ts Code 1226',
    description: "Type predicate '{0}' is not assignable to '{1}'.",
  },
  {
    slug: 'ts-code-1227',
    title: 'Ts Code 1227',
    description:
      "Parameter '{0}' is not in the same position as parameter '{1}'.",
  },
  {
    slug: 'ts-code-1228',
    title: 'Ts Code 1228',
    description:
      'A type predicate is only allowed in return type position for functions and methods.',
  },
  {
    slug: 'ts-code-1229',
    title: 'Ts Code 1229',
    description: 'A type predicate cannot reference a rest parameter.',
  },
  {
    slug: 'ts-code-1230',
    title: 'Ts Code 1230',
    description:
      "A type predicate cannot reference element '{0}' in a binding pattern.",
  },
  {
    slug: 'ts-code-1231',
    title: 'Ts Code 1231',
    description:
      'An export assignment must be at the top level of a file or module declaration.',
  },
  {
    slug: 'ts-code-1232',
    title: 'Ts Code 1232',
    description:
      'An import declaration can only be used at the top level of a namespace or module.',
  },
  {
    slug: 'ts-code-1233',
    title: 'Ts Code 1233',
    description:
      'An export declaration can only be used at the top level of a namespace or module.',
  },
  {
    slug: 'ts-code-1234',
    title: 'Ts Code 1234',
    description:
      'An ambient module declaration is only allowed at the top level in a file.',
  },
  {
    slug: 'ts-code-1235',
    title: 'Ts Code 1235',
    description:
      'A namespace declaration is only allowed at the top level of a namespace or module.',
  },
  {
    slug: 'ts-code-1236',
    title: 'Ts Code 1236',
    description:
      "The return type of a property decorator function must be either 'void' or 'any'.",
  },
  {
    slug: 'ts-code-1237',
    title: 'Ts Code 1237',
    description:
      "The return type of a parameter decorator function must be either 'void' or 'any'.",
  },
  {
    slug: 'ts-code-1238',
    title: 'Ts Code 1238',
    description:
      'Unable to resolve signature of class decorator when called as an expression.',
  },
  {
    slug: 'ts-code-1239',
    title: 'Ts Code 1239',
    description:
      'Unable to resolve signature of parameter decorator when called as an expression.',
  },
  {
    slug: 'ts-code-1240',
    title: 'Ts Code 1240',
    description:
      'Unable to resolve signature of property decorator when called as an expression.',
  },
  {
    slug: 'ts-code-1241',
    title: 'Ts Code 1241',
    description:
      'Unable to resolve signature of method decorator when called as an expression.',
  },
  {
    slug: 'ts-code-1242',
    title: 'Ts Code 1242',
    description:
      "'abstract' modifier can only appear on a class, method, or property declaration.",
  },
  {
    slug: 'ts-code-1243',
    title: 'Ts Code 1243',
    description: "'{0}' modifier cannot be used with '{1}' modifier.",
  },
  {
    slug: 'ts-code-1244',
    title: 'Ts Code 1244',
    description: 'Abstract methods can only appear within an abstract class.',
  },
  {
    slug: 'ts-code-1245',
    title: 'Ts Code 1245',
    description:
      "Method '{0}' cannot have an implementation because it is marked abstract.",
  },
  {
    slug: 'ts-code-1246',
    title: 'Ts Code 1246',
    description: 'An interface property cannot have an initializer.',
  },
  {
    slug: 'ts-code-1247',
    title: 'Ts Code 1247',
    description: 'A type literal property cannot have an initializer.',
  },
  {
    slug: 'ts-code-1248',
    title: 'Ts Code 1248',
    description: "A class member cannot have the '{0}' keyword.",
  },
  {
    slug: 'ts-code-1249',
    title: 'Ts Code 1249',
    description:
      'A decorator can only decorate a method implementation, not an overload.',
  },
  {
    slug: 'ts-code-1250',
    title: 'Ts Code 1250',
    description:
      "Function declarations are not allowed inside blocks in strict mode when targeting 'ES5'.",
  },
  {
    slug: 'ts-code-1251',
    title: 'Ts Code 1251',
    description:
      "Function declarations are not allowed inside blocks in strict mode when targeting 'ES5'. Class definitions are automatically in strict mode.",
  },
  {
    slug: 'ts-code-1252',
    title: 'Ts Code 1252',
    description:
      "Function declarations are not allowed inside blocks in strict mode when targeting 'ES5'. Modules are automatically in strict mode.",
  },
  {
    slug: 'ts-code-1253',
    title: 'Ts Code 1253',
    description:
      'Abstract properties can only appear within an abstract class.',
  },
  {
    slug: 'ts-code-1254',
    title: 'Ts Code 1254',
    description:
      "A 'const' initializer in an ambient context must be a string or numeric literal or literal enum reference.",
  },
  {
    slug: 'ts-code-1255',
    title: 'Ts Code 1255',
    description:
      "A definite assignment assertion '!' is not permitted in this context.",
  },
  {
    slug: 'ts-code-1257',
    title: 'Ts Code 1257',
    description: 'A required element cannot follow an optional element.',
  },
  {
    slug: 'ts-code-1258',
    title: 'Ts Code 1258',
    description:
      'A default export must be at the top level of a file or module declaration.',
  },
  {
    slug: 'ts-code-1259',
    title: 'Ts Code 1259',
    description:
      "Module '{0}' can only be default-imported using the '{1}' flag",
  },
  {
    slug: 'ts-code-1260',
    title: 'Ts Code 1260',
    description: 'Keywords cannot contain escape characters.',
  },
  {
    slug: 'ts-code-1261',
    title: 'Ts Code 1261',
    description:
      "Already included file name '{0}' differs from file name '{1}' only in casing.",
  },
  {
    slug: 'ts-code-1262',
    title: 'Ts Code 1262',
    description:
      "Identifier expected. '{0}' is a reserved word at the top-level of a module.",
  },
  {
    slug: 'ts-code-1263',
    title: 'Ts Code 1263',
    description:
      'Declarations with initializers cannot also have definite assignment assertions.',
  },
  {
    slug: 'ts-code-1264',
    title: 'Ts Code 1264',
    description:
      'Declarations with definite assignment assertions must also have type annotations.',
  },
  {
    slug: 'ts-code-1265',
    title: 'Ts Code 1265',
    description: 'A rest element cannot follow another rest element.',
  },
  {
    slug: 'ts-code-1266',
    title: 'Ts Code 1266',
    description: 'An optional element cannot follow a rest element.',
  },
  {
    slug: 'ts-code-1267',
    title: 'Ts Code 1267',
    description:
      "Property '{0}' cannot have an initializer because it is marked abstract.",
  },
  {
    slug: 'ts-code-1268',
    title: 'Ts Code 1268',
    description:
      "An index signature parameter type must be 'string', 'number', 'symbol', or a template literal type.",
  },
  {
    slug: 'ts-code-1269',
    title: 'Ts Code 1269',
    description:
      "Cannot use 'export import' on a type or type-only namespace when '{0}' is enabled.",
  },
  {
    slug: 'ts-code-1270',
    title: 'Ts Code 1270',
    description:
      "Decorator function return type '{0}' is not assignable to type '{1}'.",
  },
  {
    slug: 'ts-code-1271',
    title: 'Ts Code 1271',
    description:
      "Decorator function return type is '{0}' but is expected to be 'void' or 'any'.",
  },
  {
    slug: 'ts-code-1272',
    title: 'Ts Code 1272',
    description:
      "A type referenced in a decorated signature must be imported with 'import type' or a namespace import when 'isolatedModules' and 'emitDecoratorMetadata' are enabled.",
  },
  {
    slug: 'ts-code-1273',
    title: 'Ts Code 1273',
    description: "'{0}' modifier cannot appear on a type parameter",
  },
  {
    slug: 'ts-code-1274',
    title: 'Ts Code 1274',
    description:
      "'{0}' modifier can only appear on a type parameter of a class, interface or type alias",
  },
  {
    slug: 'ts-code-1275',
    title: 'Ts Code 1275',
    description:
      "'accessor' modifier can only appear on a property declaration.",
  },
  {
    slug: 'ts-code-1276',
    title: 'Ts Code 1276',
    description: "An 'accessor' property cannot be declared optional.",
  },
  {
    slug: 'ts-code-1277',
    title: 'Ts Code 1277',
    description:
      "'{0}' modifier can only appear on a type parameter of a function, method or class",
  },
  {
    slug: 'ts-code-1278',
    title: 'Ts Code 1278',
    description:
      'The runtime will invoke the decorator with {1} arguments, but the decorator expects {0}.',
  },
  {
    slug: 'ts-code-1279',
    title: 'Ts Code 1279',
    description:
      'The runtime will invoke the decorator with {1} arguments, but the decorator expects at least {0}.',
  },
  {
    slug: 'ts-code-1280',
    title: 'Ts Code 1280',
    description:
      "Namespaces are not allowed in global script files when '{0}' is enabled. If this file is not intended to be a global script, set 'moduleDetection' to 'force' or add an empty 'export {}' statement.",
  },
  {
    slug: 'ts-code-1281',
    title: 'Ts Code 1281',
    description:
      "Cannot access '{0}' from another file without qualification when '{1}' is enabled. Use '{2}' instead.",
  },
  {
    slug: 'ts-code-1282',
    title: 'Ts Code 1282',
    description:
      "An 'export =' declaration must reference a value when 'verbatimModuleSyntax' is enabled, but '{0}' only refers to a type.",
  },
  {
    slug: 'ts-code-1283',
    title: 'Ts Code 1283',
    description:
      "An 'export =' declaration must reference a real value when 'verbatimModuleSyntax' is enabled, but '{0}' resolves to a type-only declaration.",
  },
  {
    slug: 'ts-code-1284',
    title: 'Ts Code 1284',
    description:
      "An 'export default' must reference a value when 'verbatimModuleSyntax' is enabled, but '{0}' only refers to a type.",
  },
  {
    slug: 'ts-code-1285',
    title: 'Ts Code 1285',
    description:
      "An 'export default' must reference a real value when 'verbatimModuleSyntax' is enabled, but '{0}' resolves to a type-only declaration.",
  },
  {
    slug: 'ts-code-1286',
    title: 'Ts Code 1286',
    description:
      "ESM syntax is not allowed in a CommonJS module when 'verbatimModuleSyntax' is enabled.",
  },
  {
    slug: 'ts-code-1287',
    title: 'Ts Code 1287',
    description:
      "A top-level 'export' modifier cannot be used on value declarations in a CommonJS module when 'verbatimModuleSyntax' is enabled.",
  },
  {
    slug: 'ts-code-1288',
    title: 'Ts Code 1288',
    description:
      "An import alias cannot resolve to a type or type-only declaration when 'verbatimModuleSyntax' is enabled.",
  },
  {
    slug: 'ts-code-1289',
    title: 'Ts Code 1289',
    description:
      "'{0}' resolves to a type-only declaration and must be marked type-only in this file before re-exporting when '{1}' is enabled. Consider using 'import type' where '{0}' is imported.",
  },
  {
    slug: 'ts-code-1290',
    title: 'Ts Code 1290',
    description:
      "'{0}' resolves to a type-only declaration and must be marked type-only in this file before re-exporting when '{1}' is enabled. Consider using 'export type { {0} as default }'.",
  },
  {
    slug: 'ts-code-1291',
    title: 'Ts Code 1291',
    description:
      "'{0}' resolves to a type and must be marked type-only in this file before re-exporting when '{1}' is enabled. Consider using 'import type' where '{0}' is imported.",
  },
  {
    slug: 'ts-code-1292',
    title: 'Ts Code 1292',
    description:
      "'{0}' resolves to a type and must be marked type-only in this file before re-exporting when '{1}' is enabled. Consider using 'export type { {0} as default }'.",
  },
  {
    slug: 'ts-code-1293',
    title: 'Ts Code 1293',
    description:
      "ESM syntax is not allowed in a CommonJS module when 'module' is set to 'preserve'.",
  },
  {
    slug: 'ts-code-1300',
    title: 'Ts Code 1300',
    description:
      "'with' statements are not allowed in an async function block.",
  },
  {
    slug: 'ts-code-1308',
    title: 'Ts Code 1308',
    description:
      "'await' expressions are only allowed within async functions and at the top levels of modules.",
  },
  {
    slug: 'ts-code-1309',
    title: 'Ts Code 1309',
    description:
      "The current file is a CommonJS module and cannot use 'await' at the top level.",
  },
  {
    slug: 'ts-code-1312',
    title: 'Ts Code 1312',
    description:
      "Did you mean to use a ':'? An '=' can only follow a property name when the containing object literal is part of a destructuring pattern.",
  },
  {
    slug: 'ts-code-1313',
    title: 'Ts Code 1313',
    description: "The body of an 'if' statement cannot be the empty statement.",
  },
  {
    slug: 'ts-code-1314',
    title: 'Ts Code 1314',
    description: 'Global module exports may only appear in module files.',
  },
  {
    slug: 'ts-code-1315',
    title: 'Ts Code 1315',
    description: 'Global module exports may only appear in declaration files.',
  },
  {
    slug: 'ts-code-1316',
    title: 'Ts Code 1316',
    description: 'Global module exports may only appear at top level.',
  },
  {
    slug: 'ts-code-1317',
    title: 'Ts Code 1317',
    description:
      'A parameter property cannot be declared using a rest parameter.',
  },
  {
    slug: 'ts-code-1318',
    title: 'Ts Code 1318',
    description: 'An abstract accessor cannot have an implementation.',
  },
  {
    slug: 'ts-code-1319',
    title: 'Ts Code 1319',
    description:
      'A default export can only be used in an ECMAScript-style module.',
  },
  {
    slug: 'ts-code-1320',
    title: 'Ts Code 1320',
    description:
      "Type of 'await' operand must either be a valid promise or must not contain a callable 'then' member.",
  },
  {
    slug: 'ts-code-1321',
    title: 'Ts Code 1321',
    description:
      "Type of 'yield' operand in an async generator must either be a valid promise or must not contain a callable 'then' member.",
  },
  {
    slug: 'ts-code-1322',
    title: 'Ts Code 1322',
    description:
      "Type of iterated elements of a 'yield*' operand must either be a valid promise or must not contain a callable 'then' member.",
  },
  {
    slug: 'ts-code-1323',
    title: 'Ts Code 1323',
    description:
      "Dynamic imports are only supported when the '--module' flag is set to 'es2020', 'es2022', 'esnext', 'commonjs', 'amd', 'system', 'umd', 'node16', 'node18', or 'nodenext'.",
  },
  {
    slug: 'ts-code-1324',
    title: 'Ts Code 1324',
    description:
      "Dynamic imports only support a second argument when the '--module' option is set to 'esnext', 'node16', 'node18', 'nodenext', or 'preserve'.",
  },
  {
    slug: 'ts-code-1325',
    title: 'Ts Code 1325',
    description: 'Argument of dynamic import cannot be spread element.',
  },
  {
    slug: 'ts-code-1326',
    title: 'Ts Code 1326',
    description:
      "This use of 'import' is invalid. 'import()' calls can be written, but they must have parentheses and cannot have type arguments.",
  },
  {
    slug: 'ts-code-1327',
    title: 'Ts Code 1327',
    description: 'String literal with double quotes expected.',
  },
  {
    slug: 'ts-code-1328',
    title: 'Ts Code 1328',
    description:
      "Property value can only be string literal, numeric literal, 'true', 'false', 'null', object literal or array literal.",
  },
  {
    slug: 'ts-code-1329',
    title: 'Ts Code 1329',
    description:
      "'{0}' accepts too few arguments to be used as a decorator here. Did you mean to call it first and write '@{0}()'?",
  },
  {
    slug: 'ts-code-1330',
    title: 'Ts Code 1330',
    description:
      "A property of an interface or type literal whose type is a 'unique symbol' type must be 'readonly'.",
  },
  {
    slug: 'ts-code-1331',
    title: 'Ts Code 1331',
    description:
      "A property of a class whose type is a 'unique symbol' type must be both 'static' and 'readonly'.",
  },
  {
    slug: 'ts-code-1332',
    title: 'Ts Code 1332',
    description:
      "A variable whose type is a 'unique symbol' type must be 'const'.",
  },
  {
    slug: 'ts-code-1333',
    title: 'Ts Code 1333',
    description:
      "'unique symbol' types may not be used on a variable declaration with a binding name.",
  },
  {
    slug: 'ts-code-1334',
    title: 'Ts Code 1334',
    description:
      "'unique symbol' types are only allowed on variables in a variable statement.",
  },
  {
    slug: 'ts-code-1335',
    title: 'Ts Code 1335',
    description: "'unique symbol' types are not allowed here.",
  },
  {
    slug: 'ts-code-1337',
    title: 'Ts Code 1337',
    description:
      'An index signature parameter type cannot be a literal type or generic type. Consider using a mapped object type instead.',
  },
  {
    slug: 'ts-code-1338',
    title: 'Ts Code 1338',
    description:
      "'infer' declarations are only permitted in the 'extends' clause of a conditional type.",
  },
  {
    slug: 'ts-code-1339',
    title: 'Ts Code 1339',
    description:
      "Module '{0}' does not refer to a value, but is used as a value here.",
  },
  {
    slug: 'ts-code-1340',
    title: 'Ts Code 1340',
    description:
      "Module '{0}' does not refer to a type, but is used as a type here. Did you mean 'typeof import('{0}')'?",
  },
  {
    slug: 'ts-code-1341',
    title: 'Ts Code 1341',
    description: 'Class constructor may not be an accessor.',
  },
  {
    slug: 'ts-code-1343',
    title: 'Ts Code 1343',
    description:
      "The 'import.meta' meta-property is only allowed when the '--module' option is 'es2020', 'es2022', 'esnext', 'system', 'node16', 'node18', or 'nodenext'.",
  },
  {
    slug: 'ts-code-1344',
    title: 'Ts Code 1344',
    description: "'A label is not allowed here.",
  },
  {
    slug: 'ts-code-1345',
    title: 'Ts Code 1345',
    description:
      "An expression of type 'void' cannot be tested for truthiness.",
  },
  {
    slug: 'ts-code-1346',
    title: 'Ts Code 1346',
    description: "This parameter is not allowed with 'use strict' directive.",
  },
  {
    slug: 'ts-code-1347',
    title: 'Ts Code 1347',
    description:
      "'use strict' directive cannot be used with non-simple parameter list.",
  },
  {
    slug: 'ts-code-1348',
    title: 'Ts Code 1348',
    description: 'Non-simple parameter declared here.',
  },
  {
    slug: 'ts-code-1349',
    title: 'Ts Code 1349',
    description: "'use strict' directive used here.",
  },
  {
    slug: 'ts-code-1351',
    title: 'Ts Code 1351',
    description:
      'An identifier or keyword cannot immediately follow a numeric literal.',
  },
  {
    slug: 'ts-code-1352',
    title: 'Ts Code 1352',
    description: 'A bigint literal cannot use exponential notation.',
  },
  {
    slug: 'ts-code-1353',
    title: 'Ts Code 1353',
    description: 'A bigint literal must be an integer.',
  },
  {
    slug: 'ts-code-1354',
    title: 'Ts Code 1354',
    description:
      "'readonly' type modifier is only permitted on array and tuple literal types.",
  },
  {
    slug: 'ts-code-1355',
    title: 'Ts Code 1355',
    description:
      "A 'const' assertions can only be applied to references to enum members, or string, number, boolean, array, or object literals.",
  },
  {
    slug: 'ts-code-1356',
    title: 'Ts Code 1356',
    description: "Did you mean to mark this function as 'async'?",
  },
  {
    slug: 'ts-code-1357',
    title: 'Ts Code 1357',
    description: "An enum member name must be followed by a ',', '=', or '}'.",
  },
  {
    slug: 'ts-code-1358',
    title: 'Ts Code 1358',
    description:
      'Tagged template expressions are not permitted in an optional chain.',
  },
  {
    slug: 'ts-code-1359',
    title: 'Ts Code 1359',
    description:
      "Identifier expected. '{0}' is a reserved word that cannot be used here.",
  },
  {
    slug: 'ts-code-1360',
    title: 'Ts Code 1360',
    description: "Type '{0}' does not satisfy the expected type '{1}'.",
  },
  {
    slug: 'ts-code-1361',
    title: 'Ts Code 1361',
    description:
      "'{0}' cannot be used as a value because it was imported using 'import type'.",
  },
  {
    slug: 'ts-code-1362',
    title: 'Ts Code 1362',
    description:
      "'{0}' cannot be used as a value because it was exported using 'export type'.",
  },
  {
    slug: 'ts-code-1363',
    title: 'Ts Code 1363',
    description:
      'A type-only import can specify a default import or named bindings, but not both.',
  },
  {
    slug: 'ts-code-1368',
    title: 'Ts Code 1368',
    description: 'Class constructor may not be a generator.',
  },
  {
    slug: 'ts-code-1375',
    title: 'Ts Code 1375',
    description:
      "'await' expressions are only allowed at the top level of a file when that file is a module, but this file has no imports or exports. Consider adding an empty 'export {}' to make this file a module.",
  },
  {
    slug: 'ts-code-1378',
    title: 'Ts Code 1378',
    description:
      "Top-level 'await' expressions are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', 'node18', 'nodenext', or 'preserve', and the 'target' option is set to 'es2017' or higher.",
  },
  {
    slug: 'ts-code-1379',
    title: 'Ts Code 1379',
    description:
      "An import alias cannot reference a declaration that was exported using 'export type'.",
  },
  {
    slug: 'ts-code-1380',
    title: 'Ts Code 1380',
    description:
      "An import alias cannot reference a declaration that was imported using 'import type'.",
  },
  {
    slug: 'ts-code-1381',
    title: 'Ts Code 1381',
    description: "Unexpected token. Did you mean `{'}'}` or `&rbrace;`?",
  },
  {
    slug: 'ts-code-1382',
    title: 'Ts Code 1382',
    description: "Unexpected token. Did you mean `{'>'}` or `&gt;`?",
  },
  {
    slug: 'ts-code-1385',
    title: 'Ts Code 1385',
    description:
      'Function type notation must be parenthesized when used in a union type.',
  },
  {
    slug: 'ts-code-1386',
    title: 'Ts Code 1386',
    description:
      'Constructor type notation must be parenthesized when used in a union type.',
  },
  {
    slug: 'ts-code-1387',
    title: 'Ts Code 1387',
    description:
      'Function type notation must be parenthesized when used in an intersection type.',
  },
  {
    slug: 'ts-code-1388',
    title: 'Ts Code 1388',
    description:
      'Constructor type notation must be parenthesized when used in an intersection type.',
  },
  {
    slug: 'ts-code-1389',
    title: 'Ts Code 1389',
    description: "'{0}' is not allowed as a variable declaration name.",
  },
  {
    slug: 'ts-code-1390',
    title: 'Ts Code 1390',
    description: "'{0}' is not allowed as a parameter name.",
  },
  {
    slug: 'ts-code-1392',
    title: 'Ts Code 1392',
    description: "An import alias cannot use 'import type'",
  },
  {
    slug: 'ts-code-1431',
    title: 'Ts Code 1431',
    description:
      "'for await' loops are only allowed at the top level of a file when that file is a module, but this file has no imports or exports. Consider adding an empty 'export {}' to make this file a module.",
  },
  {
    slug: 'ts-code-1432',
    title: 'Ts Code 1432',
    description:
      "Top-level 'for await' loops are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', 'node18', 'nodenext', or 'preserve', and the 'target' option is set to 'es2017' or higher.",
  },
  {
    slug: 'ts-code-1433',
    title: 'Ts Code 1433',
    description:
      "Neither decorators nor modifiers may be applied to 'this' parameters.",
  },
  {
    slug: 'ts-code-1434',
    title: 'Ts Code 1434',
    description: 'Unexpected keyword or identifier.',
  },
  {
    slug: 'ts-code-1435',
    title: 'Ts Code 1435',
    description: "Unknown keyword or identifier. Did you mean '{0}'?",
  },
  {
    slug: 'ts-code-1436',
    title: 'Ts Code 1436',
    description:
      'Decorators must precede the name and all keywords of property declarations.',
  },
  {
    slug: 'ts-code-1437',
    title: 'Ts Code 1437',
    description: 'Namespace must be given a name.',
  },
  {
    slug: 'ts-code-1438',
    title: 'Ts Code 1438',
    description: 'Interface must be given a name.',
  },
  {
    slug: 'ts-code-1439',
    title: 'Ts Code 1439',
    description: 'Type alias must be given a name.',
  },
  {
    slug: 'ts-code-1440',
    title: 'Ts Code 1440',
    description: 'Variable declaration not allowed at this location.',
  },
  {
    slug: 'ts-code-1441',
    title: 'Ts Code 1441',
    description: 'Cannot start a function call in a type annotation.',
  },
  {
    slug: 'ts-code-1442',
    title: 'Ts Code 1442',
    description: "Expected '=' for property initializer.",
  },
  {
    slug: 'ts-code-1443',
    title: 'Ts Code 1443',
    description:
      'Module declaration names may only use \' or " quoted strings.',
  },
  {
    slug: 'ts-code-1448',
    title: 'Ts Code 1448',
    description:
      "'{0}' resolves to a type-only declaration and must be re-exported using a type-only re-export when '{1}' is enabled.",
  },
  {
    slug: 'ts-code-1451',
    title: 'Ts Code 1451',
    description:
      "Private identifiers are only allowed in class bodies and may only be used as part of a class member declaration, property access, or on the left-hand-side of an 'in' expression",
  },
  {
    slug: 'ts-code-1453',
    title: 'Ts Code 1453',
    description: '`resolution-mode` should be either `require` or `import`.',
  },
  {
    slug: 'ts-code-1454',
    title: 'Ts Code 1454',
    description: '`resolution-mode` can only be set for type-only imports.',
  },
  {
    slug: 'ts-code-1455',
    title: 'Ts Code 1455',
    description:
      '`resolution-mode` is the only valid key for type import assertions.',
  },
  {
    slug: 'ts-code-1456',
    title: 'Ts Code 1456',
    description:
      'Type import assertions should have exactly one key - `resolution-mode` - with value `import` or `require`.',
  },
  {
    slug: 'ts-code-1463',
    title: 'Ts Code 1463',
    description:
      "'resolution-mode' is the only valid key for type import attributes.",
  },
  {
    slug: 'ts-code-1464',
    title: 'Ts Code 1464',
    description:
      "Type import attributes should have exactly one key - 'resolution-mode' - with value 'import' or 'require'.",
  },
  {
    slug: 'ts-code-1470',
    title: 'Ts Code 1470',
    description:
      "The 'import.meta' meta-property is not allowed in files which will build into CommonJS output.",
  },
  {
    slug: 'ts-code-1471',
    title: 'Ts Code 1471',
    description:
      "Module '{0}' cannot be imported using this construct. The specifier only resolves to an ES module, which cannot be imported with 'require'. Use an ECMAScript import instead.",
  },
  {
    slug: 'ts-code-1472',
    title: 'Ts Code 1472',
    description: "'catch' or 'finally' expected.",
  },
  {
    slug: 'ts-code-1473',
    title: 'Ts Code 1473',
    description:
      'An import declaration can only be used at the top level of a module.',
  },
  {
    slug: 'ts-code-1474',
    title: 'Ts Code 1474',
    description:
      'An export declaration can only be used at the top level of a module.',
  },
  {
    slug: 'ts-code-1477',
    title: 'Ts Code 1477',
    description:
      'An instantiation expression cannot be followed by a property access.',
  },
  {
    slug: 'ts-code-1478',
    title: 'Ts Code 1478',
    description: 'Identifier or string literal expected.',
  },
  {
    slug: 'ts-code-1479',
    title: 'Ts Code 1479',
    description:
      "The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import(\"{0}\")' call instead.",
  },
  {
    slug: 'ts-code-1484',
    title: 'Ts Code 1484',
    description:
      "'{0}' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.",
  },
  {
    slug: 'ts-code-1485',
    title: 'Ts Code 1485',
    description:
      "'{0}' resolves to a type-only declaration and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.",
  },
  {
    slug: 'ts-code-1486',
    title: 'Ts Code 1486',
    description: "Decorator used before 'export' here.",
  },
  {
    slug: 'ts-code-1487',
    title: 'Ts Code 1487',
    description:
      "Octal escape sequences are not allowed. Use the syntax '{0}'.",
  },
  {
    slug: 'ts-code-1488',
    title: 'Ts Code 1488',
    description: "Escape sequence '{0}' is not allowed.",
  },
  {
    slug: 'ts-code-1489',
    title: 'Ts Code 1489',
    description: 'Decimals with leading zeros are not allowed.',
  },
  {
    slug: 'ts-code-1490',
    title: 'Ts Code 1490',
    description: 'File appears to be binary.',
  },
  {
    slug: 'ts-code-1491',
    title: 'Ts Code 1491',
    description: "'{0}' modifier cannot appear on a 'using' declaration.",
  },
  {
    slug: 'ts-code-1492',
    title: 'Ts Code 1492',
    description: "'{0}' declarations may not have binding patterns.",
  },
  {
    slug: 'ts-code-1493',
    title: 'Ts Code 1493',
    description:
      "The left-hand side of a 'for...in' statement cannot be a 'using' declaration.",
  },
  {
    slug: 'ts-code-1494',
    title: 'Ts Code 1494',
    description:
      "The left-hand side of a 'for...in' statement cannot be an 'await using' declaration.",
  },
  {
    slug: 'ts-code-1495',
    title: 'Ts Code 1495',
    description:
      "'{0}' modifier cannot appear on an 'await using' declaration.",
  },
  {
    slug: 'ts-code-1496',
    title: 'Ts Code 1496',
    description: 'Identifier, string literal, or number literal expected.',
  },
  {
    slug: 'ts-code-1497',
    title: 'Ts Code 1497',
    description:
      'Expression must be enclosed in parentheses to be used as a decorator.',
  },
  {
    slug: 'ts-code-1498',
    title: 'Ts Code 1498',
    description: 'Invalid syntax in decorator.',
  },
  {
    slug: 'ts-code-1499',
    title: 'Ts Code 1499',
    description: 'Unknown regular expression flag.',
  },
  {
    slug: 'ts-code-1500',
    title: 'Ts Code 1500',
    description: 'Duplicate regular expression flag.',
  },
  {
    slug: 'ts-code-1501',
    title: 'Ts Code 1501',
    description:
      "This regular expression flag is only available when targeting '{0}' or later.",
  },
  {
    slug: 'ts-code-1502',
    title: 'Ts Code 1502',
    description:
      'The Unicode (u) flag and the Unicode Sets (v) flag cannot be set simultaneously.',
  },
  {
    slug: 'ts-code-1503',
    title: 'Ts Code 1503',
    description:
      "Named capturing groups are only available when targeting 'ES2018' or later.",
  },
  {
    slug: 'ts-code-1504',
    title: 'Ts Code 1504',
    description: 'Subpattern flags must be present when there is a minus sign.',
  },
  {
    slug: 'ts-code-1505',
    title: 'Ts Code 1505',
    description: 'Incomplete quantifier. Digit expected.',
  },
  {
    slug: 'ts-code-1506',
    title: 'Ts Code 1506',
    description: 'Numbers out of order in quantifier.',
  },
  {
    slug: 'ts-code-1507',
    title: 'Ts Code 1507',
    description: 'There is nothing available for repetition.',
  },
  {
    slug: 'ts-code-1508',
    title: 'Ts Code 1508',
    description: "Unexpected '{0}'. Did you mean to escape it with backslash?",
  },
  {
    slug: 'ts-code-1509',
    title: 'Ts Code 1509',
    description:
      'This regular expression flag cannot be toggled within a subpattern.',
  },
  {
    slug: 'ts-code-1510',
    title: 'Ts Code 1510',
    description: String.raw`'\k' must be followed by a capturing group name enclosed in angle brackets.`,
  },
  {
    slug: 'ts-code-1511',
    title: 'Ts Code 1511',
    description: String.raw`'\q' is only available inside character class.`,
  },
  {
    slug: 'ts-code-1512',
    title: 'Ts Code 1512',
    description: String.raw`'\c' must be followed by an ASCII letter.`,
  },
  {
    slug: 'ts-code-1513',
    title: 'Ts Code 1513',
    description: 'Undetermined character escape.',
  },
  {
    slug: 'ts-code-1514',
    title: 'Ts Code 1514',
    description: 'Expected a capturing group name.',
  },
  {
    slug: 'ts-code-1515',
    title: 'Ts Code 1515',
    description:
      'Named capturing groups with the same name must be mutually exclusive to each other.',
  },
  {
    slug: 'ts-code-1516',
    title: 'Ts Code 1516',
    description:
      'A character class range must not be bounded by another character class.',
  },
  {
    slug: 'ts-code-1517',
    title: 'Ts Code 1517',
    description: 'Range out of order in character class.',
  },
  {
    slug: 'ts-code-1518',
    title: 'Ts Code 1518',
    description:
      'Anything that would possibly match more than a single character is invalid inside a negated character class.',
  },
  {
    slug: 'ts-code-1519',
    title: 'Ts Code 1519',
    description:
      'Operators must not be mixed within a character class. Wrap it in a nested class instead.',
  },
  {
    slug: 'ts-code-1520',
    title: 'Ts Code 1520',
    description: 'Expected a class set operand.',
  },
  {
    slug: 'ts-code-1521',
    title: 'Ts Code 1521',
    description: String.raw`'\q' must be followed by string alternatives enclosed in braces.`,
  },
  {
    slug: 'ts-code-1522',
    title: 'Ts Code 1522',
    description:
      'A character class must not contain a reserved double punctuator. Did you mean to escape it with backslash?',
  },
  {
    slug: 'ts-code-1523',
    title: 'Ts Code 1523',
    description: 'Expected a Unicode property name.',
  },
  {
    slug: 'ts-code-1524',
    title: 'Ts Code 1524',
    description: 'Unknown Unicode property name.',
  },
  {
    slug: 'ts-code-1525',
    title: 'Ts Code 1525',
    description: 'Expected a Unicode property value.',
  },
  {
    slug: 'ts-code-1526',
    title: 'Ts Code 1526',
    description: 'Unknown Unicode property value.',
  },
  {
    slug: 'ts-code-1527',
    title: 'Ts Code 1527',
    description: 'Expected a Unicode property name or value.',
  },
  {
    slug: 'ts-code-1528',
    title: 'Ts Code 1528',
    description:
      'Any Unicode property that would possibly match more than a single character is only available when the Unicode Sets (v) flag is set.',
  },
  {
    slug: 'ts-code-1529',
    title: 'Ts Code 1529',
    description: 'Unknown Unicode property name or value.',
  },
  {
    slug: 'ts-code-1530',
    title: 'Ts Code 1530',
    description:
      'Unicode property value expressions are only available when the Unicode (u) flag or the Unicode Sets (v) flag is set.',
  },
  {
    slug: 'ts-code-1531',
    title: 'Ts Code 1531',
    description: String.raw`'\{0}' must be followed by a Unicode property value expression enclosed in braces.`,
  },
  {
    slug: 'ts-code-1532',
    title: 'Ts Code 1532',
    description:
      "There is no capturing group named '{0}' in this regular expression.",
  },
  {
    slug: 'ts-code-1533',
    title: 'Ts Code 1533',
    description:
      'This backreference refers to a group that does not exist. There are only {0} capturing groups in this regular expression.',
  },
  {
    slug: 'ts-code-1534',
    title: 'Ts Code 1534',
    description:
      'This backreference refers to a group that does not exist. There are no capturing groups in this regular expression.',
  },
  {
    slug: 'ts-code-1535',
    title: 'Ts Code 1535',
    description: 'This character cannot be escaped in a regular expression.',
  },
  {
    slug: 'ts-code-1536',
    title: 'Ts Code 1536',
    description:
      "Octal escape sequences and backreferences are not allowed in a character class. If this was intended as an escape sequence, use the syntax '{0}' instead.",
  },
  {
    slug: 'ts-code-1537',
    title: 'Ts Code 1537',
    description:
      'Decimal escape sequences and backreferences are not allowed in a character class.',
  },
  {
    slug: 'ts-code-1538',
    title: 'Ts Code 1538',
    description:
      'Unicode escape sequences are only available when the Unicode (u) flag or the Unicode Sets (v) flag is set.',
  },
  {
    slug: 'ts-code-1539',
    title: 'Ts Code 1539',
    description: "A 'bigint' literal cannot be used as a property name.",
  },
  {
    slug: 'ts-code-1541',
    title: 'Ts Code 1541',
    description:
      "Type-only import of an ECMAScript module from a CommonJS module must have a 'resolution-mode' attribute.",
  },
  {
    slug: 'ts-code-1542',
    title: 'Ts Code 1542',
    description:
      "Type import of an ECMAScript module from a CommonJS module must have a 'resolution-mode' attribute.",
  },
  {
    slug: 'ts-code-1543',
    title: 'Ts Code 1543',
    description:
      "Importing a JSON file into an ECMAScript module requires a 'type: \"json\"' import attribute when 'module' is set to '{0}'.",
  },
  {
    slug: 'ts-code-1544',
    title: 'Ts Code 1544',
    description:
      "Named imports from a JSON file into an ECMAScript module are not allowed when 'module' is set to '{0}'.",
  },
  {
    slug: 'ts-code-2200',
    title: 'Ts Code 2200',
    description: "The types of '{0}' are incompatible between these types.",
  },
  {
    slug: 'ts-code-2201',
    title: 'Ts Code 2201',
    description:
      "The types returned by '{0}' are incompatible between these types.",
  },
  {
    slug: 'ts-code-2202',
    title: 'Ts Code 2202',
    description:
      "Call signature return types '{0}' and '{1}' are incompatible.",
  },
  {
    slug: 'ts-code-2203',
    title: 'Ts Code 2203',
    description:
      "Construct signature return types '{0}' and '{1}' are incompatible.",
  },
  {
    slug: 'ts-code-2204',
    title: 'Ts Code 2204',
    description:
      "Call signatures with no arguments have incompatible return types '{0}' and '{1}'.",
  },
  {
    slug: 'ts-code-2205',
    title: 'Ts Code 2205',
    description:
      "Construct signatures with no arguments have incompatible return types '{0}' and '{1}'.",
  },
  {
    slug: 'ts-code-2206',
    title: 'Ts Code 2206',
    description:
      "The 'type' modifier cannot be used on a named import when 'import type' is used on its import statement.",
  },
  {
    slug: 'ts-code-2207',
    title: 'Ts Code 2207',
    description:
      "The 'type' modifier cannot be used on a named export when 'export type' is used on its export statement.",
  },
  {
    slug: 'ts-code-2208',
    title: 'Ts Code 2208',
    description: 'This type parameter might need an `extends {0}` constraint.',
  },
  {
    slug: 'ts-code-2209',
    title: 'Ts Code 2209',
    description:
      "The project root is ambiguous, but is required to resolve export map entry '{0}' in file '{1}'. Supply the `rootDir` compiler option to disambiguate.",
  },
  {
    slug: 'ts-code-2210',
    title: 'Ts Code 2210',
    description:
      "The project root is ambiguous, but is required to resolve import map entry '{0}' in file '{1}'. Supply the `rootDir` compiler option to disambiguate.",
  },
  {
    slug: 'ts-code-2300',
    title: 'Ts Code 2300',
    description: "Duplicate identifier '{0}'.",
  },
  {
    slug: 'ts-code-2301',
    title: 'Ts Code 2301',
    description:
      "Initializer of instance member variable '{0}' cannot reference identifier '{1}' declared in the constructor.",
  },
  {
    slug: 'ts-code-2302',
    title: 'Ts Code 2302',
    description: 'Static members cannot reference class type parameters.',
  },
  {
    slug: 'ts-code-2303',
    title: 'Ts Code 2303',
    description: "Circular definition of import alias '{0}'.",
  },
  {
    slug: 'ts-code-2304',
    title: 'Ts Code 2304',
    description: "Cannot find name '{0}'.",
  },
  {
    slug: 'ts-code-2305',
    title: 'Ts Code 2305',
    description: "Module '{0}' has no exported member '{1}'.",
  },
  {
    slug: 'ts-code-2306',
    title: 'Ts Code 2306',
    description: "File '{0}' is not a module.",
  },
  {
    slug: 'ts-code-2307',
    title: 'Ts Code 2307',
    description:
      "Cannot find module '{0}' or its corresponding type declarations.",
  },
  {
    slug: 'ts-code-2308',
    title: 'Ts Code 2308',
    description:
      "Module {0} has already exported a member named '{1}'. Consider explicitly re-exporting to resolve the ambiguity.",
  },
  {
    slug: 'ts-code-2309',
    title: 'Ts Code 2309',
    description:
      'An export assignment cannot be used in a module with other exported elements.',
  },
  {
    slug: 'ts-code-2310',
    title: 'Ts Code 2310',
    description: "Type '{0}' recursively references itself as a base type.",
  },
  {
    slug: 'ts-code-2311',
    title: 'Ts Code 2311',
    description:
      "Cannot find name '{0}'. Did you mean to write this in an async function?",
  },
  {
    slug: 'ts-code-2312',
    title: 'Ts Code 2312',
    description:
      'An interface can only extend an object type or intersection of object types with statically known members.',
  },
  {
    slug: 'ts-code-2313',
    title: 'Ts Code 2313',
    description: "Type parameter '{0}' has a circular constraint.",
  },
  {
    slug: 'ts-code-2314',
    title: 'Ts Code 2314',
    description: "Generic type '{0}' requires {1} type argument(s).",
  },
  {
    slug: 'ts-code-2315',
    title: 'Ts Code 2315',
    description: "Type '{0}' is not generic.",
  },
  {
    slug: 'ts-code-2316',
    title: 'Ts Code 2316',
    description: "Global type '{0}' must be a class or interface type.",
  },
  {
    slug: 'ts-code-2317',
    title: 'Ts Code 2317',
    description: "Global type '{0}' must have {1} type parameter(s).",
  },
  {
    slug: 'ts-code-2318',
    title: 'Ts Code 2318',
    description: "Cannot find global type '{0}'.",
  },
  {
    slug: 'ts-code-2319',
    title: 'Ts Code 2319',
    description:
      "Named property '{0}' of types '{1}' and '{2}' are not identical.",
  },
  {
    slug: 'ts-code-2320',
    title: 'Ts Code 2320',
    description:
      "Interface '{0}' cannot simultaneously extend types '{1}' and '{2}'.",
  },
  {
    slug: 'ts-code-2321',
    title: 'Ts Code 2321',
    description: "Excessive stack depth comparing types '{0}' and '{1}'.",
  },
  {
    slug: 'strict-type-checks',
    title: 'Strict Type Checks',
    description: "Type '{0}' is not assignable to type '{1}'.",
  },
  {
    slug: 'ts-code-2323',
    title: 'Ts Code 2323',
    description: "Cannot redeclare exported variable '{0}'.",
  },
  {
    slug: 'ts-code-2324',
    title: 'Ts Code 2324',
    description: "Property '{0}' is missing in type '{1}'.",
  },
  {
    slug: 'ts-code-2325',
    title: 'Ts Code 2325',
    description:
      "Property '{0}' is private in type '{1}' but not in type '{2}'.",
  },
  {
    slug: 'ts-code-2326',
    title: 'Ts Code 2326',
    description: "Types of property '{0}' are incompatible.",
  },
  {
    slug: 'ts-code-2327',
    title: 'Ts Code 2327',
    description:
      "Property '{0}' is optional in type '{1}' but required in type '{2}'.",
  },
  {
    slug: 'ts-code-2328',
    title: 'Ts Code 2328',
    description: "Types of parameters '{0}' and '{1}' are incompatible.",
  },
  {
    slug: 'ts-code-2329',
    title: 'Ts Code 2329',
    description: "Index signature for type '{0}' is missing in type '{1}'.",
  },
  {
    slug: 'ts-code-2330',
    title: 'Ts Code 2330',
    description: "'{0}' and '{1}' index signatures are incompatible.",
  },
  {
    slug: 'ts-code-2331',
    title: 'Ts Code 2331',
    description: "'this' cannot be referenced in a module or namespace body.",
  },
  {
    slug: 'ts-code-2332',
    title: 'Ts Code 2332',
    description: "'this' cannot be referenced in current location.",
  },
  {
    slug: 'ts-code-2334',
    title: 'Ts Code 2334',
    description:
      "'this' cannot be referenced in a static property initializer.",
  },
  {
    slug: 'ts-code-2335',
    title: 'Ts Code 2335',
    description: "'super' can only be referenced in a derived class.",
  },
  {
    slug: 'ts-code-2336',
    title: 'Ts Code 2336',
    description: "'super' cannot be referenced in constructor arguments.",
  },
  {
    slug: 'ts-code-2337',
    title: 'Ts Code 2337',
    description:
      'Super calls are not permitted outside constructors or in nested functions inside constructors.',
  },
  {
    slug: 'ts-code-2338',
    title: 'Ts Code 2338',
    description:
      "'super' property access is permitted only in a constructor, member function, or member accessor of a derived class.",
  },
  {
    slug: 'ts-code-2339',
    title: 'Ts Code 2339',
    description: "Property '{0}' does not exist on type '{1}'.",
  },
  {
    slug: 'ts-code-2340',
    title: 'Ts Code 2340',
    description:
      "Only public and protected methods of the base class are accessible via the 'super' keyword.",
  },
  {
    slug: 'ts-code-2341',
    title: 'Ts Code 2341',
    description:
      "Property '{0}' is private and only accessible within class '{1}'.",
  },
  {
    slug: 'ts-code-2343',
    title: 'Ts Code 2343',
    description:
      "This syntax requires an imported helper named '{1}' which does not exist in '{0}'. Consider upgrading your version of '{0}'.",
  },
  {
    slug: 'ts-code-2344',
    title: 'Ts Code 2344',
    description: "Type '{0}' does not satisfy the constraint '{1}'.",
  },
  {
    slug: 'strict-function-types',
    title: 'Strict Function Types',
    description:
      "Argument of type '{0}' is not assignable to parameter of type '{1}'.",
  },
  {
    slug: 'ts-code-2347',
    title: 'Ts Code 2347',
    description: 'Untyped function calls may not accept type arguments.',
  },
  {
    slug: 'ts-code-2348',
    title: 'Ts Code 2348',
    description:
      "Value of type '{0}' is not callable. Did you mean to include 'new'?",
  },
  {
    slug: 'ts-code-2349',
    title: 'Ts Code 2349',
    description: 'This expression is not callable.',
  },
  {
    slug: 'ts-code-2350',
    title: 'Ts Code 2350',
    description: "Only a void function can be called with the 'new' keyword.",
  },
  {
    slug: 'ts-code-2351',
    title: 'Ts Code 2351',
    description: 'This expression is not constructable.',
  },
  {
    slug: 'ts-code-2352',
    title: 'Ts Code 2352',
    description:
      "Conversion of type '{0}' to type '{1}' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.",
  },
  {
    slug: 'ts-code-2353',
    title: 'Ts Code 2353',
    description:
      "Object literal may only specify known properties, and '{0}' does not exist in type '{1}'.",
  },
  {
    slug: 'ts-code-2354',
    title: 'Ts Code 2354',
    description:
      "This syntax requires an imported helper but module '{0}' cannot be found.",
  },
  {
    slug: 'ts-code-2355',
    title: 'Ts Code 2355',
    description:
      "A function whose declared type is neither 'undefined', 'void', nor 'any' must return a value.",
  },
  {
    slug: 'ts-code-2356',
    title: 'Ts Code 2356',
    description:
      "An arithmetic operand must be of type 'any', 'number', 'bigint' or an enum type.",
  },
  {
    slug: 'ts-code-2357',
    title: 'Ts Code 2357',
    description:
      'The operand of an increment or decrement operator must be a variable or a property access.',
  },
  {
    slug: 'ts-code-2358',
    title: 'Ts Code 2358',
    description:
      "The left-hand side of an 'instanceof' expression must be of type 'any', an object type or a type parameter.",
  },
  {
    slug: 'ts-code-2359',
    title: 'Ts Code 2359',
    description:
      "The right-hand side of an 'instanceof' expression must be either of type 'any', a class, function, or other type assignable to the 'Function' interface type, or an object type with a 'Symbol.hasInstance' method.",
  },
  {
    slug: 'ts-code-2362',
    title: 'Ts Code 2362',
    description:
      "The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.",
  },
  {
    slug: 'ts-code-2363',
    title: 'Ts Code 2363',
    description:
      "The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.",
  },
  {
    slug: 'ts-code-2364',
    title: 'Ts Code 2364',
    description:
      'The left-hand side of an assignment expression must be a variable or a property access.',
  },
  {
    slug: 'ts-code-2365',
    title: 'Ts Code 2365',
    description: "Operator '{0}' cannot be applied to types '{1}' and '{2}'.",
  },
  {
    slug: 'strict-missing-return',
    title: 'Strict Missing Return',
    description:
      "Function lacks ending return statement and return type does not include 'undefined'.",
  },
  {
    slug: 'ts-code-2367',
    title: 'Ts Code 2367',
    description:
      "This comparison appears to be unintentional because the types '{0}' and '{1}' have no overlap.",
  },
  {
    slug: 'ts-code-2368',
    title: 'Ts Code 2368',
    description: "Type parameter name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2369',
    title: 'Ts Code 2369',
    description:
      'A parameter property is only allowed in a constructor implementation.',
  },
  {
    slug: 'ts-code-2370',
    title: 'Ts Code 2370',
    description: 'A rest parameter must be of an array type.',
  },
  {
    slug: 'ts-code-2371',
    title: 'Ts Code 2371',
    description:
      'A parameter initializer is only allowed in a function or constructor implementation.',
  },
  {
    slug: 'ts-code-2372',
    title: 'Ts Code 2372',
    description: "Parameter '{0}' cannot reference itself.",
  },
  {
    slug: 'ts-code-2373',
    title: 'Ts Code 2373',
    description:
      "Parameter '{0}' cannot reference identifier '{1}' declared after it.",
  },
  {
    slug: 'ts-code-2374',
    title: 'Ts Code 2374',
    description: "Duplicate index signature for type '{0}'.",
  },
  {
    slug: 'ts-code-2375',
    title: 'Ts Code 2375',
    description:
      "Type '{0}' is not assignable to type '{1}' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.",
  },
  {
    slug: 'ts-code-2376',
    title: 'Ts Code 2376',
    description:
      "A 'super' call must be the first statement in the constructor to refer to 'super' or 'this' when a derived class contains initialized properties, parameter properties, or private identifiers.",
  },
  {
    slug: 'ts-code-2377',
    title: 'Ts Code 2377',
    description:
      "Constructors for derived classes must contain a 'super' call.",
  },
  {
    slug: 'ts-code-2378',
    title: 'Ts Code 2378',
    description: "A 'get' accessor must return a value.",
  },
  {
    slug: 'ts-code-2379',
    title: 'Ts Code 2379',
    description:
      "Argument of type '{0}' is not assignable to parameter of type '{1}' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.",
  },
  {
    slug: 'ts-code-2383',
    title: 'Ts Code 2383',
    description: 'Overload signatures must all be exported or non-exported.',
  },
  {
    slug: 'ts-code-2384',
    title: 'Ts Code 2384',
    description: 'Overload signatures must all be ambient or non-ambient.',
  },
  {
    slug: 'ts-code-2385',
    title: 'Ts Code 2385',
    description:
      'Overload signatures must all be public, private or protected.',
  },
  {
    slug: 'ts-code-2386',
    title: 'Ts Code 2386',
    description: 'Overload signatures must all be optional or required.',
  },
  {
    slug: 'ts-code-2387',
    title: 'Ts Code 2387',
    description: 'Function overload must be static.',
  },
  {
    slug: 'ts-code-2388',
    title: 'Ts Code 2388',
    description: 'Function overload must not be static.',
  },
  {
    slug: 'ts-code-2389',
    title: 'Ts Code 2389',
    description: "Function implementation name must be '{0}'.",
  },
  {
    slug: 'ts-code-2390',
    title: 'Ts Code 2390',
    description: 'Constructor implementation is missing.',
  },
  {
    slug: 'ts-code-2391',
    title: 'Ts Code 2391',
    description:
      'Function implementation is missing or not immediately following the declaration.',
  },
  {
    slug: 'ts-code-2392',
    title: 'Ts Code 2392',
    description: 'Multiple constructor implementations are not allowed.',
  },
  {
    slug: 'ts-code-2393',
    title: 'Ts Code 2393',
    description: 'Duplicate function implementation.',
  },
  {
    slug: 'ts-code-2394',
    title: 'Ts Code 2394',
    description:
      'This overload signature is not compatible with its implementation signature.',
  },
  {
    slug: 'ts-code-2395',
    title: 'Ts Code 2395',
    description:
      "Individual declarations in merged declaration '{0}' must be all exported or all local.",
  },
  {
    slug: 'ts-code-2396',
    title: 'Ts Code 2396',
    description:
      "Duplicate identifier 'arguments'. Compiler uses 'arguments' to initialize rest parameters.",
  },
  {
    slug: 'ts-code-2397',
    title: 'Ts Code 2397',
    description:
      "Declaration name conflicts with built-in global identifier '{0}'.",
  },
  {
    slug: 'ts-code-2398',
    title: 'Ts Code 2398',
    description: "'constructor' cannot be used as a parameter property name.",
  },
  {
    slug: 'ts-code-2399',
    title: 'Ts Code 2399',
    description:
      "Duplicate identifier '_this'. Compiler uses variable declaration '_this' to capture 'this' reference.",
  },
  {
    slug: 'ts-code-2400',
    title: 'Ts Code 2400',
    description:
      "Expression resolves to variable declaration '_this' that compiler uses to capture 'this' reference.",
  },
  {
    slug: 'ts-code-2401',
    title: 'Ts Code 2401',
    description:
      "A 'super' call must be a root-level statement within a constructor of a derived class that contains initialized properties, parameter properties, or private identifiers.",
  },
  {
    slug: 'ts-code-2402',
    title: 'Ts Code 2402',
    description:
      "Expression resolves to '_super' that compiler uses to capture base class reference.",
  },
  {
    slug: 'ts-code-2403',
    title: 'Ts Code 2403',
    description:
      "Subsequent variable declarations must have the same type.  Variable '{0}' must be of type '{1}', but here has type '{2}'.",
  },
  {
    slug: 'ts-code-2404',
    title: 'Ts Code 2404',
    description:
      "The left-hand side of a 'for...in' statement cannot use a type annotation.",
  },
  {
    slug: 'ts-code-2405',
    title: 'Ts Code 2405',
    description:
      "The left-hand side of a 'for...in' statement must be of type 'string' or 'any'.",
  },
  {
    slug: 'ts-code-2406',
    title: 'Ts Code 2406',
    description:
      "The left-hand side of a 'for...in' statement must be a variable or a property access.",
  },
  {
    slug: 'ts-code-2407',
    title: 'Ts Code 2407',
    description:
      "The right-hand side of a 'for...in' statement must be of type 'any', an object type or a type parameter, but here has type '{0}'.",
  },
  {
    slug: 'ts-code-2408',
    title: 'Ts Code 2408',
    description: 'Setters cannot return a value.',
  },
  {
    slug: 'ts-code-2409',
    title: 'Ts Code 2409',
    description:
      'Return type of constructor signature must be assignable to the instance type of the class.',
  },
  {
    slug: 'ts-code-2410',
    title: 'Ts Code 2410',
    description:
      "The 'with' statement is not supported. All symbols in a 'with' block will have type 'any'.",
  },
  {
    slug: 'ts-code-2412',
    title: 'Ts Code 2412',
    description:
      "Type '{0}' is not assignable to type '{1}' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the type of the target.",
  },
  {
    slug: 'ts-code-2411',
    title: 'Ts Code 2411',
    description:
      "Property '{0}' of type '{1}' is not assignable to '{2}' index type '{3}'.",
  },
  {
    slug: 'ts-code-2413',
    title: 'Ts Code 2413',
    description:
      "'{0}' index type '{1}' is not assignable to '{2}' index type '{3}'.",
  },
  {
    slug: 'ts-code-2414',
    title: 'Ts Code 2414',
    description: "Class name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2415',
    title: 'Ts Code 2415',
    description: "Class '{0}' incorrectly extends base class '{1}'.",
  },
  {
    slug: 'ts-code-2416',
    title: 'Ts Code 2416',
    description:
      "Property '{0}' in type '{1}' is not assignable to the same property in base type '{2}'.",
  },
  {
    slug: 'ts-code-2417',
    title: 'Ts Code 2417',
    description:
      "Class static side '{0}' incorrectly extends base class static side '{1}'.",
  },
  {
    slug: 'ts-code-2418',
    title: 'Ts Code 2418',
    description:
      "Type of computed property's value is '{0}', which is not assignable to type '{1}'.",
  },
  {
    slug: 'ts-code-2419',
    title: 'Ts Code 2419',
    description: 'Types of construct signatures are incompatible.',
  },
  {
    slug: 'ts-code-2420',
    title: 'Ts Code 2420',
    description: "Class '{0}' incorrectly implements interface '{1}'.",
  },
  {
    slug: 'ts-code-2422',
    title: 'Ts Code 2422',
    description:
      'A class can only implement an object type or intersection of object types with statically known members.',
  },
  {
    slug: 'ts-code-2423',
    title: 'Ts Code 2423',
    description:
      "Class '{0}' defines instance member function '{1}', but extended class '{2}' defines it as instance member accessor.",
  },
  {
    slug: 'ts-code-2425',
    title: 'Ts Code 2425',
    description:
      "Class '{0}' defines instance member property '{1}', but extended class '{2}' defines it as instance member function.",
  },
  {
    slug: 'ts-code-2426',
    title: 'Ts Code 2426',
    description:
      "Class '{0}' defines instance member accessor '{1}', but extended class '{2}' defines it as instance member function.",
  },
  {
    slug: 'ts-code-2427',
    title: 'Ts Code 2427',
    description: "Interface name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2428',
    title: 'Ts Code 2428',
    description:
      "All declarations of '{0}' must have identical type parameters.",
  },
  {
    slug: 'ts-code-2430',
    title: 'Ts Code 2430',
    description: "Interface '{0}' incorrectly extends interface '{1}'.",
  },
  {
    slug: 'ts-code-2431',
    title: 'Ts Code 2431',
    description: "Enum name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2432',
    title: 'Ts Code 2432',
    description:
      'In an enum with multiple declarations, only one declaration can omit an initializer for its first enum element.',
  },
  {
    slug: 'ts-code-2433',
    title: 'Ts Code 2433',
    description:
      'A namespace declaration cannot be in a different file from a class or function with which it is merged.',
  },
  {
    slug: 'ts-code-2434',
    title: 'Ts Code 2434',
    description:
      'A namespace declaration cannot be located prior to a class or function with which it is merged.',
  },
  {
    slug: 'ts-code-2435',
    title: 'Ts Code 2435',
    description:
      'Ambient modules cannot be nested in other modules or namespaces.',
  },
  {
    slug: 'ts-code-2436',
    title: 'Ts Code 2436',
    description:
      'Ambient module declaration cannot specify relative module name.',
  },
  {
    slug: 'ts-code-2437',
    title: 'Ts Code 2437',
    description:
      "Module '{0}' is hidden by a local declaration with the same name.",
  },
  {
    slug: 'ts-code-2438',
    title: 'Ts Code 2438',
    description: "Import name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2439',
    title: 'Ts Code 2439',
    description:
      'Import or export declaration in an ambient module declaration cannot reference module through relative module name.',
  },
  {
    slug: 'ts-code-2440',
    title: 'Ts Code 2440',
    description:
      "Import declaration conflicts with local declaration of '{0}'.",
  },
  {
    slug: 'ts-code-2441',
    title: 'Ts Code 2441',
    description:
      "Duplicate identifier '{0}'. Compiler reserves name '{1}' in top level scope of a module.",
  },
  {
    slug: 'ts-code-2442',
    title: 'Ts Code 2442',
    description:
      "Types have separate declarations of a private property '{0}'.",
  },
  {
    slug: 'ts-code-2443',
    title: 'Ts Code 2443',
    description:
      "Property '{0}' is protected but type '{1}' is not a class derived from '{2}'.",
  },
  {
    slug: 'ts-code-2444',
    title: 'Ts Code 2444',
    description:
      "Property '{0}' is protected in type '{1}' but public in type '{2}'.",
  },
  {
    slug: 'ts-code-2445',
    title: 'Ts Code 2445',
    description:
      "Property '{0}' is protected and only accessible within class '{1}' and its subclasses.",
  },
  {
    slug: 'ts-code-2446',
    title: 'Ts Code 2446',
    description:
      "Property '{0}' is protected and only accessible through an instance of class '{1}'. This is an instance of class '{2}'.",
  },
  {
    slug: 'ts-code-2447',
    title: 'Ts Code 2447',
    description:
      "The '{0}' operator is not allowed for boolean types. Consider using '{1}' instead.",
  },
  {
    slug: 'ts-code-2448',
    title: 'Ts Code 2448',
    description: "Block-scoped variable '{0}' used before its declaration.",
  },
  {
    slug: 'ts-code-2449',
    title: 'Ts Code 2449',
    description: "Class '{0}' used before its declaration.",
  },
  {
    slug: 'ts-code-2450',
    title: 'Ts Code 2450',
    description: "Enum '{0}' used before its declaration.",
  },
  {
    slug: 'ts-code-2451',
    title: 'Ts Code 2451',
    description: "Cannot redeclare block-scoped variable '{0}'.",
  },
  {
    slug: 'ts-code-2452',
    title: 'Ts Code 2452',
    description: 'An enum member cannot have a numeric name.',
  },
  {
    slug: 'ts-code-2454',
    title: 'Ts Code 2454',
    description: "Variable '{0}' is used before being assigned.",
  },
  {
    slug: 'ts-code-2456',
    title: 'Ts Code 2456',
    description: "Type alias '{0}' circularly references itself.",
  },
  {
    slug: 'ts-code-2457',
    title: 'Ts Code 2457',
    description: "Type alias name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2458',
    title: 'Ts Code 2458',
    description: 'An AMD module cannot have multiple name assignments.',
  },
  {
    slug: 'ts-code-2459',
    title: 'Ts Code 2459',
    description: "Module '{0}' declares '{1}' locally, but it is not exported.",
  },
  {
    slug: 'ts-code-2460',
    title: 'Ts Code 2460',
    description:
      "Module '{0}' declares '{1}' locally, but it is exported as '{2}'.",
  },
  {
    slug: 'ts-code-2461',
    title: 'Ts Code 2461',
    description: "Type '{0}' is not an array type.",
  },
  {
    slug: 'ts-code-2462',
    title: 'Ts Code 2462',
    description: 'A rest element must be last in a destructuring pattern.',
  },
  {
    slug: 'ts-code-2463',
    title: 'Ts Code 2463',
    description:
      'A binding pattern parameter cannot be optional in an implementation signature.',
  },
  {
    slug: 'ts-code-2464',
    title: 'Ts Code 2464',
    description:
      "A computed property name must be of type 'string', 'number', 'symbol', or 'any'.",
  },
  {
    slug: 'ts-code-2465',
    title: 'Ts Code 2465',
    description: "'this' cannot be referenced in a computed property name.",
  },
  {
    slug: 'ts-code-2466',
    title: 'Ts Code 2466',
    description: "'super' cannot be referenced in a computed property name.",
  },
  {
    slug: 'ts-code-2467',
    title: 'Ts Code 2467',
    description:
      'A computed property name cannot reference a type parameter from its containing type.',
  },
  {
    slug: 'ts-code-2468',
    title: 'Ts Code 2468',
    description: "Cannot find global value '{0}'.",
  },
  {
    slug: 'ts-code-2469',
    title: 'Ts Code 2469',
    description: "The '{0}' operator cannot be applied to type 'symbol'.",
  },
  {
    slug: 'ts-code-2472',
    title: 'Ts Code 2472',
    description:
      "Spread operator in 'new' expressions is only available when targeting ECMAScript 5 and higher.",
  },
  {
    slug: 'ts-code-2473',
    title: 'Ts Code 2473',
    description: 'Enum declarations must all be const or non-const.',
  },
  {
    slug: 'ts-code-2474',
    title: 'Ts Code 2474',
    description: 'const enum member initializers must be constant expressions.',
  },
  {
    slug: 'ts-code-2475',
    title: 'Ts Code 2475',
    description:
      "'const' enums can only be used in property or index access expressions or the right hand side of an import declaration or export assignment or type query.",
  },
  {
    slug: 'ts-code-2476',
    title: 'Ts Code 2476',
    description:
      'A const enum member can only be accessed using a string literal.',
  },
  {
    slug: 'ts-code-2477',
    title: 'Ts Code 2477',
    description:
      "'const' enum member initializer was evaluated to a non-finite value.",
  },
  {
    slug: 'ts-code-2478',
    title: 'Ts Code 2478',
    description:
      "'const' enum member initializer was evaluated to disallowed value 'NaN'.",
  },
  {
    slug: 'ts-code-2480',
    title: 'Ts Code 2480',
    description:
      "'let' is not allowed to be used as a name in 'let' or 'const' declarations.",
  },
  {
    slug: 'ts-code-2481',
    title: 'Ts Code 2481',
    description:
      "Cannot initialize outer scoped variable '{0}' in the same scope as block scoped declaration '{1}'.",
  },
  {
    slug: 'ts-code-2483',
    title: 'Ts Code 2483',
    description:
      "The left-hand side of a 'for...of' statement cannot use a type annotation.",
  },
  {
    slug: 'ts-code-2484',
    title: 'Ts Code 2484',
    description:
      "Export declaration conflicts with exported declaration of '{0}'.",
  },
  {
    slug: 'ts-code-2487',
    title: 'Ts Code 2487',
    description:
      "The left-hand side of a 'for...of' statement must be a variable or a property access.",
  },
  {
    slug: 'ts-code-2488',
    title: 'Ts Code 2488',
    description:
      "Type '{0}' must have a '[Symbol.iterator]()' method that returns an iterator.",
  },
  {
    slug: 'ts-code-2489',
    title: 'Ts Code 2489',
    description: "An iterator must have a 'next()' method.",
  },
  {
    slug: 'ts-code-2490',
    title: 'Ts Code 2490',
    description:
      "The type returned by the '{0}()' method of an iterator must have a 'value' property.",
  },
  {
    slug: 'ts-code-2491',
    title: 'Ts Code 2491',
    description:
      "The left-hand side of a 'for...in' statement cannot be a destructuring pattern.",
  },
  {
    slug: 'ts-code-2492',
    title: 'Ts Code 2492',
    description: "Cannot redeclare identifier '{0}' in catch clause.",
  },
  {
    slug: 'ts-code-2493',
    title: 'Ts Code 2493',
    description:
      "Tuple type '{0}' of length '{1}' has no element at index '{2}'.",
  },
  {
    slug: 'ts-code-2494',
    title: 'Ts Code 2494',
    description:
      "Using a string in a 'for...of' statement is only supported in ECMAScript 5 and higher.",
  },
  {
    slug: 'ts-code-2495',
    title: 'Ts Code 2495',
    description: "Type '{0}' is not an array type or a string type.",
  },
  {
    slug: 'ts-code-2496',
    title: 'Ts Code 2496',
    description:
      "The 'arguments' object cannot be referenced in an arrow function in ES5. Consider using a standard function expression.",
  },
  {
    slug: 'ts-code-2497',
    title: 'Ts Code 2497',
    description:
      "This module can only be referenced with ECMAScript imports/exports by turning on the '{0}' flag and referencing its default export.",
  },
  {
    slug: 'ts-code-2498',
    title: 'Ts Code 2498',
    description:
      "Module '{0}' uses 'export =' and cannot be used with 'export *'.",
  },
  {
    slug: 'ts-code-2499',
    title: 'Ts Code 2499',
    description:
      'An interface can only extend an identifier/qualified-name with optional type arguments.',
  },
  {
    slug: 'ts-code-2500',
    title: 'Ts Code 2500',
    description:
      'A class can only implement an identifier/qualified-name with optional type arguments.',
  },
  {
    slug: 'ts-code-2501',
    title: 'Ts Code 2501',
    description: 'A rest element cannot contain a binding pattern.',
  },
  {
    slug: 'ts-code-2502',
    title: 'Ts Code 2502',
    description:
      "'{0}' is referenced directly or indirectly in its own type annotation.",
  },
  {
    slug: 'ts-code-2503',
    title: 'Ts Code 2503',
    description: "Cannot find namespace '{0}'.",
  },
  {
    slug: 'ts-code-2504',
    title: 'Ts Code 2504',
    description:
      "Type '{0}' must have a '[Symbol.asyncIterator]()' method that returns an async iterator.",
  },
  {
    slug: 'ts-code-2505',
    title: 'Ts Code 2505',
    description: "A generator cannot have a 'void' type annotation.",
  },
  {
    slug: 'ts-code-2506',
    title: 'Ts Code 2506',
    description:
      "'{0}' is referenced directly or indirectly in its own base expression.",
  },
  {
    slug: 'ts-code-2507',
    title: 'Ts Code 2507',
    description: "Type '{0}' is not a constructor function type.",
  },
  {
    slug: 'ts-code-2508',
    title: 'Ts Code 2508',
    description:
      'No base constructor has the specified number of type arguments.',
  },
  {
    slug: 'ts-code-2509',
    title: 'Ts Code 2509',
    description:
      "Base constructor return type '{0}' is not an object type or intersection of object types with statically known members.",
  },
  {
    slug: 'ts-code-2510',
    title: 'Ts Code 2510',
    description: 'Base constructors must all have the same return type.',
  },
  {
    slug: 'ts-code-2511',
    title: 'Ts Code 2511',
    description: 'Cannot create an instance of an abstract class.',
  },
  {
    slug: 'ts-code-2512',
    title: 'Ts Code 2512',
    description: 'Overload signatures must all be abstract or non-abstract.',
  },
  {
    slug: 'ts-code-2513',
    title: 'Ts Code 2513',
    description:
      "Abstract method '{0}' in class '{1}' cannot be accessed via super expression.",
  },
  {
    slug: 'ts-code-2514',
    title: 'Ts Code 2514',
    description: 'A tuple type cannot be indexed with a negative value.',
  },
  {
    slug: 'ts-code-2515',
    title: 'Ts Code 2515',
    description:
      "Non-abstract class '{0}' does not implement inherited abstract member {1} from class '{2}'.",
  },
  {
    slug: 'ts-code-2516',
    title: 'Ts Code 2516',
    description: 'All declarations of an abstract method must be consecutive.',
  },
  {
    slug: 'ts-code-2517',
    title: 'Ts Code 2517',
    description:
      'Cannot assign an abstract constructor type to a non-abstract constructor type.',
  },
  {
    slug: 'ts-code-2518',
    title: 'Ts Code 2518',
    description:
      "A 'this'-based type guard is not compatible with a parameter-based type guard.",
  },
  {
    slug: 'ts-code-2519',
    title: 'Ts Code 2519',
    description: "An async iterator must have a 'next()' method.",
  },
  {
    slug: 'ts-code-2520',
    title: 'Ts Code 2520',
    description:
      "Duplicate identifier '{0}'. Compiler uses declaration '{1}' to support async functions.",
  },
  {
    slug: 'ts-code-2522',
    title: 'Ts Code 2522',
    description:
      "The 'arguments' object cannot be referenced in an async function or method in ES5. Consider using a standard function or method.",
  },
  {
    slug: 'ts-code-2523',
    title: 'Ts Code 2523',
    description:
      "'yield' expressions cannot be used in a parameter initializer.",
  },
  {
    slug: 'ts-code-2524',
    title: 'Ts Code 2524',
    description:
      "'await' expressions cannot be used in a parameter initializer.",
  },
  {
    slug: 'ts-code-2526',
    title: 'Ts Code 2526',
    description:
      "A 'this' type is available only in a non-static member of a class or interface.",
  },
  {
    slug: 'ts-code-2527',
    title: 'Ts Code 2527',
    description:
      "The inferred type of '{0}' references an inaccessible '{1}' type. A type annotation is necessary.",
  },
  {
    slug: 'ts-code-2528',
    title: 'Ts Code 2528',
    description: 'A module cannot have multiple default exports.',
  },
  {
    slug: 'ts-code-2529',
    title: 'Ts Code 2529',
    description:
      "Duplicate identifier '{0}'. Compiler reserves name '{1}' in top level scope of a module containing async functions.",
  },
  {
    slug: 'ts-code-2530',
    title: 'Ts Code 2530',
    description: "Property '{0}' is incompatible with index signature.",
  },
  {
    slug: 'strict-possibly-null',
    title: 'Strict Possibly Null',
    description: "Object is possibly 'null'.",
  },
  {
    slug: 'strict-possibly-undefined',
    title: 'Strict Possibly Undefined',
    description: "Object is possibly 'undefined'.",
  },
  {
    slug: 'ts-code-2533',
    title: 'Ts Code 2533',
    description: "Object is possibly 'null' or 'undefined'.",
  },
  {
    slug: 'ts-code-2534',
    title: 'Ts Code 2534',
    description:
      "A function returning 'never' cannot have a reachable end point.",
  },
  {
    slug: 'ts-code-2536',
    title: 'Ts Code 2536',
    description: "Type '{0}' cannot be used to index type '{1}'.",
  },
  {
    slug: 'ts-code-2537',
    title: 'Ts Code 2537',
    description: "Type '{0}' has no matching index signature for type '{1}'.",
  },
  {
    slug: 'ts-code-2538',
    title: 'Ts Code 2538',
    description: "Type '{0}' cannot be used as an index type.",
  },
  {
    slug: 'ts-code-2539',
    title: 'Ts Code 2539',
    description: "Cannot assign to '{0}' because it is not a variable.",
  },
  {
    slug: 'ts-code-2540',
    title: 'Ts Code 2540',
    description: "Cannot assign to '{0}' because it is a read-only property.",
  },
  {
    slug: 'ts-code-2542',
    title: 'Ts Code 2542',
    description: "Index signature in type '{0}' only permits reading.",
  },
  {
    slug: 'ts-code-2543',
    title: 'Ts Code 2543',
    description:
      "Duplicate identifier '_newTarget'. Compiler uses variable declaration '_newTarget' to capture 'new.target' meta-property reference.",
  },
  {
    slug: 'ts-code-2544',
    title: 'Ts Code 2544',
    description:
      "Expression resolves to variable declaration '_newTarget' that compiler uses to capture 'new.target' meta-property reference.",
  },
  {
    slug: 'ts-code-2545',
    title: 'Ts Code 2545',
    description:
      "A mixin class must have a constructor with a single rest parameter of type 'any[]'.",
  },
  {
    slug: 'ts-code-2547',
    title: 'Ts Code 2547',
    description:
      "The type returned by the '{0}()' method of an async iterator must be a promise for a type with a 'value' property.",
  },
  {
    slug: 'ts-code-2548',
    title: 'Ts Code 2548',
    description:
      "Type '{0}' is not an array type or does not have a '[Symbol.iterator]()' method that returns an iterator.",
  },
  {
    slug: 'ts-code-2549',
    title: 'Ts Code 2549',
    description:
      "Type '{0}' is not an array type or a string type or does not have a '[Symbol.iterator]()' method that returns an iterator.",
  },
  {
    slug: 'ts-code-2550',
    title: 'Ts Code 2550',
    description:
      "Property '{0}' does not exist on type '{1}'. Do you need to change your target library? Try changing the 'lib' compiler option to '{2}' or later.",
  },
  {
    slug: 'ts-code-2551',
    title: 'Ts Code 2551',
    description:
      "Property '{0}' does not exist on type '{1}'. Did you mean '{2}'?",
  },
  {
    slug: 'ts-code-2552',
    title: 'Ts Code 2552',
    description: "Cannot find name '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-2553',
    title: 'Ts Code 2553',
    description:
      'Computed values are not permitted in an enum with string valued members.',
  },
  {
    slug: 'ts-code-2554',
    title: 'Ts Code 2554',
    description: 'Expected {0} arguments, but got {1}.',
  },
  {
    slug: 'ts-code-2555',
    title: 'Ts Code 2555',
    description: 'Expected at least {0} arguments, but got {1}.',
  },
  {
    slug: 'ts-code-2556',
    title: 'Ts Code 2556',
    description:
      'A spread argument must either have a tuple type or be passed to a rest parameter.',
  },
  {
    slug: 'ts-code-2558',
    title: 'Ts Code 2558',
    description: 'Expected {0} type arguments, but got {1}.',
  },
  {
    slug: 'ts-code-2559',
    title: 'Ts Code 2559',
    description: "Type '{0}' has no properties in common with type '{1}'.",
  },
  {
    slug: 'ts-code-2560',
    title: 'Ts Code 2560',
    description:
      "Value of type '{0}' has no properties in common with type '{1}'. Did you mean to call it?",
  },
  {
    slug: 'ts-code-2561',
    title: 'Ts Code 2561',
    description:
      "Object literal may only specify known properties, but '{0}' does not exist in type '{1}'. Did you mean to write '{2}'?",
  },
  {
    slug: 'ts-code-2562',
    title: 'Ts Code 2562',
    description:
      'Base class expressions cannot reference class type parameters.',
  },
  {
    slug: 'ts-code-2563',
    title: 'Ts Code 2563',
    description:
      'The containing function or module body is too large for control flow analysis.',
  },
  {
    slug: 'strict-property-initialization',
    title: 'Strict Property Initialization',
    description:
      "Property '{0}' has no initializer and is not definitely assigned in the constructor.",
  },
  {
    slug: 'ts-code-2565',
    title: 'Ts Code 2565',
    description: "Property '{0}' is used before being assigned.",
  },
  {
    slug: 'ts-code-2566',
    title: 'Ts Code 2566',
    description: 'A rest element cannot have a property name.',
  },
  {
    slug: 'ts-code-2567',
    title: 'Ts Code 2567',
    description:
      'Enum declarations can only merge with namespace or other enum declarations.',
  },
  {
    slug: 'ts-code-2568',
    title: 'Ts Code 2568',
    description:
      "Property '{0}' may not exist on type '{1}'. Did you mean '{2}'?",
  },
  {
    slug: 'ts-code-2570',
    title: 'Ts Code 2570',
    description: "Could not find name '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-2571',
    title: 'Ts Code 2571',
    description: "Object is of type 'unknown'.",
  },
  {
    slug: 'ts-code-2574',
    title: 'Ts Code 2574',
    description: 'A rest element type must be an array type.',
  },
  {
    slug: 'ts-code-2575',
    title: 'Ts Code 2575',
    description:
      'No overload expects {0} arguments, but overloads do exist that expect either {1} or {2} arguments.',
  },
  {
    slug: 'ts-code-2576',
    title: 'Ts Code 2576',
    description:
      "Property '{0}' does not exist on type '{1}'. Did you mean to access the static member '{2}' instead?",
  },
  {
    slug: 'ts-code-2577',
    title: 'Ts Code 2577',
    description: 'Return type annotation circularly references itself.',
  },
  {
    slug: 'ts-code-2578',
    title: 'Ts Code 2578',
    description: "Unused '@ts-expect-error' directive.",
  },
  {
    slug: 'ts-code-2580',
    title: 'Ts Code 2580',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.",
  },
  {
    slug: 'ts-code-2581',
    title: 'Ts Code 2581',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery`.",
  },
  {
    slug: 'ts-code-2582',
    title: 'Ts Code 2582',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.",
  },
  {
    slug: 'ts-code-2583',
    title: 'Ts Code 2583',
    description:
      "Cannot find name '{0}'. Do you need to change your target library? Try changing the 'lib' compiler option to '{1}' or later.",
  },
  {
    slug: 'ts-code-2584',
    title: 'Ts Code 2584',
    description:
      "Cannot find name '{0}'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.",
  },
  {
    slug: 'ts-code-2585',
    title: 'Ts Code 2585',
    description:
      "'{0}' only refers to a type, but is being used as a value here. Do you need to change your target library? Try changing the 'lib' compiler option to es2015 or later.",
  },
  {
    slug: 'ts-code-2588',
    title: 'Ts Code 2588',
    description: "Cannot assign to '{0}' because it is a constant.",
  },
  {
    slug: 'ts-code-2589',
    title: 'Ts Code 2589',
    description:
      'Type instantiation is excessively deep and possibly infinite.',
  },
  {
    slug: 'ts-code-2590',
    title: 'Ts Code 2590',
    description:
      'Expression produces a union type that is too complex to represent.',
  },
  {
    slug: 'ts-code-2591',
    title: 'Ts Code 2591',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.",
  },
  {
    slug: 'ts-code-2592',
    title: 'Ts Code 2592',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for jQuery? Try `npm i --save-dev @types/jquery` and then add 'jquery' to the types field in your tsconfig.",
  },
  {
    slug: 'ts-code-2593',
    title: 'Ts Code 2593',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` and then add 'jest' or 'mocha' to the types field in your tsconfig.",
  },
  {
    slug: 'ts-code-2594',
    title: 'Ts Code 2594',
    description:
      "This module is declared with 'export =', and can only be used with a default import when using the '{0}' flag.",
  },
  {
    slug: 'ts-code-2595',
    title: 'Ts Code 2595',
    description: "'{0}' can only be imported by using a default import.",
  },
  {
    slug: 'ts-code-2596',
    title: 'Ts Code 2596',
    description:
      "'{0}' can only be imported by turning on the 'esModuleInterop' flag and using a default import.",
  },
  {
    slug: 'ts-code-2597',
    title: 'Ts Code 2597',
    description:
      "'{0}' can only be imported by using a 'require' call or by using a default import.",
  },
  {
    slug: 'ts-code-2598',
    title: 'Ts Code 2598',
    description:
      "'{0}' can only be imported by using a 'require' call or by turning on the 'esModuleInterop' flag and using a default import.",
  },
  {
    slug: 'ts-code-2602',
    title: 'Ts Code 2602',
    description:
      "JSX element implicitly has type 'any' because the global type 'JSX.Element' does not exist.",
  },
  {
    slug: 'ts-code-2603',
    title: 'Ts Code 2603',
    description:
      "Property '{0}' in type '{1}' is not assignable to type '{2}'.",
  },
  {
    slug: 'ts-code-2604',
    title: 'Ts Code 2604',
    description:
      "JSX element type '{0}' does not have any construct or call signatures.",
  },
  {
    slug: 'ts-code-2606',
    title: 'Ts Code 2606',
    description:
      "Property '{0}' of JSX spread attribute is not assignable to target property.",
  },
  {
    slug: 'ts-code-2607',
    title: 'Ts Code 2607',
    description:
      "JSX element class does not support attributes because it does not have a '{0}' property.",
  },
  {
    slug: 'ts-code-2608',
    title: 'Ts Code 2608',
    description:
      "The global type 'JSX.{0}' may not have more than one property.",
  },
  {
    slug: 'ts-code-2609',
    title: 'Ts Code 2609',
    description: 'JSX spread child must be an array type.',
  },
  {
    slug: 'ts-code-2610',
    title: 'Ts Code 2610',
    description:
      "'{0}' is defined as an accessor in class '{1}', but is overridden here in '{2}' as an instance property.",
  },
  {
    slug: 'ts-code-2611',
    title: 'Ts Code 2611',
    description:
      "'{0}' is defined as a property in class '{1}', but is overridden here in '{2}' as an accessor.",
  },
  {
    slug: 'ts-code-2612',
    title: 'Ts Code 2612',
    description:
      "Property '{0}' will overwrite the base property in '{1}'. If this is intentional, add an initializer. Otherwise, add a 'declare' modifier or remove the redundant declaration.",
  },
  {
    slug: 'ts-code-2613',
    title: 'Ts Code 2613',
    description:
      "Module '{0}' has no default export. Did you mean to use 'import { {1} } from {0}' instead?",
  },
  {
    slug: 'ts-code-2614',
    title: 'Ts Code 2614',
    description:
      "Module '{0}' has no exported member '{1}'. Did you mean to use 'import {1} from {0}' instead?",
  },
  {
    slug: 'ts-code-2615',
    title: 'Ts Code 2615',
    description:
      "Type of property '{0}' circularly references itself in mapped type '{1}'.",
  },
  {
    slug: 'ts-code-2616',
    title: 'Ts Code 2616',
    description:
      "'{0}' can only be imported by using 'import {1} = require({2})' or a default import.",
  },
  {
    slug: 'ts-code-2617',
    title: 'Ts Code 2617',
    description:
      "'{0}' can only be imported by using 'import {1} = require({2})' or by turning on the 'esModuleInterop' flag and using a default import.",
  },
  {
    slug: 'ts-code-2618',
    title: 'Ts Code 2618',
    description: 'Source has {0} element(s) but target requires {1}.',
  },
  {
    slug: 'ts-code-2619',
    title: 'Ts Code 2619',
    description: 'Source has {0} element(s) but target allows only {1}.',
  },
  {
    slug: 'ts-code-2620',
    title: 'Ts Code 2620',
    description: 'Target requires {0} element(s) but source may have fewer.',
  },
  {
    slug: 'ts-code-2621',
    title: 'Ts Code 2621',
    description: 'Target allows only {0} element(s) but source may have more.',
  },
  {
    slug: 'ts-code-2623',
    title: 'Ts Code 2623',
    description:
      'Source provides no match for required element at position {0} in target.',
  },
  {
    slug: 'ts-code-2624',
    title: 'Ts Code 2624',
    description:
      'Source provides no match for variadic element at position {0} in target.',
  },
  {
    slug: 'ts-code-2625',
    title: 'Ts Code 2625',
    description:
      'Variadic element at position {0} in source does not match element at position {1} in target.',
  },
  {
    slug: 'ts-code-2626',
    title: 'Ts Code 2626',
    description:
      'Type at position {0} in source is not compatible with type at position {1} in target.',
  },
  {
    slug: 'ts-code-2627',
    title: 'Ts Code 2627',
    description:
      'Type at positions {0} through {1} in source is not compatible with type at position {2} in target.',
  },
  {
    slug: 'ts-code-2628',
    title: 'Ts Code 2628',
    description: "Cannot assign to '{0}' because it is an enum.",
  },
  {
    slug: 'ts-code-2629',
    title: 'Ts Code 2629',
    description: "Cannot assign to '{0}' because it is a class.",
  },
  {
    slug: 'ts-code-2630',
    title: 'Ts Code 2630',
    description: "Cannot assign to '{0}' because it is a function.",
  },
  {
    slug: 'ts-code-2631',
    title: 'Ts Code 2631',
    description: "Cannot assign to '{0}' because it is a namespace.",
  },
  {
    slug: 'ts-code-2632',
    title: 'Ts Code 2632',
    description: "Cannot assign to '{0}' because it is an import.",
  },
  {
    slug: 'ts-code-2633',
    title: 'Ts Code 2633',
    description:
      'JSX property access expressions cannot include JSX namespace names',
  },
  {
    slug: 'ts-code-2634',
    title: 'Ts Code 2634',
    description: "'{0}' index signatures are incompatible.",
  },
  {
    slug: 'ts-code-2635',
    title: 'Ts Code 2635',
    description:
      "Type '{0}' has no signatures for which the type argument list is applicable.",
  },
  {
    slug: 'ts-code-2636',
    title: 'Ts Code 2636',
    description:
      "Type '{0}' is not assignable to type '{1}' as implied by variance annotation.",
  },
  {
    slug: 'ts-code-2637',
    title: 'Ts Code 2637',
    description:
      'Variance annotations are only supported in type aliases for object, function, constructor, and mapped types.',
  },
  {
    slug: 'ts-code-2638',
    title: 'Ts Code 2638',
    description:
      "Type '{0}' may represent a primitive value, which is not permitted as the right operand of the 'in' operator.",
  },
  {
    slug: 'ts-code-2639',
    title: 'Ts Code 2639',
    description: 'React components cannot include JSX namespace names',
  },
  {
    slug: 'ts-code-2649',
    title: 'Ts Code 2649',
    description:
      "Cannot augment module '{0}' with value exports because it resolves to a non-module entity.",
  },
  {
    slug: 'ts-code-2650',
    title: 'Ts Code 2650',
    description:
      "Non-abstract class expression is missing implementations for the following members of '{0}': {1} and {2} more.",
  },
  {
    slug: 'ts-code-2651',
    title: 'Ts Code 2651',
    description:
      'A member initializer in a enum declaration cannot reference members declared after it, including members defined in other enums.',
  },
  {
    slug: 'ts-code-2652',
    title: 'Ts Code 2652',
    description:
      "Merged declaration '{0}' cannot include a default export declaration. Consider adding a separate 'export default {0}' declaration instead.",
  },
  {
    slug: 'ts-code-2653',
    title: 'Ts Code 2653',
    description:
      "Non-abstract class expression does not implement inherited abstract member '{0}' from class '{1}'.",
  },
  {
    slug: 'ts-code-2654',
    title: 'Ts Code 2654',
    description:
      "Non-abstract class '{0}' is missing implementations for the following members of '{1}': {2}.",
  },
  {
    slug: 'ts-code-2655',
    title: 'Ts Code 2655',
    description:
      "Non-abstract class '{0}' is missing implementations for the following members of '{1}': {2} and {3} more.",
  },
  {
    slug: 'ts-code-2656',
    title: 'Ts Code 2656',
    description:
      "Non-abstract class expression is missing implementations for the following members of '{0}': {1}.",
  },
  {
    slug: 'ts-code-2657',
    title: 'Ts Code 2657',
    description: 'JSX expressions must have one parent element.',
  },
  {
    slug: 'ts-code-2658',
    title: 'Ts Code 2658',
    description: "Type '{0}' provides no match for the signature '{1}'.",
  },
  {
    slug: 'ts-code-2659',
    title: 'Ts Code 2659',
    description:
      "'super' is only allowed in members of object literal expressions when option 'target' is 'ES2015' or higher.",
  },
  {
    slug: 'ts-code-2660',
    title: 'Ts Code 2660',
    description:
      "'super' can only be referenced in members of derived classes or object literal expressions.",
  },
  {
    slug: 'ts-code-2661',
    title: 'Ts Code 2661',
    description:
      "Cannot export '{0}'. Only local declarations can be exported from a module.",
  },
  {
    slug: 'ts-code-2662',
    title: 'Ts Code 2662',
    description:
      "Cannot find name '{0}'. Did you mean the static member '{1}.{0}'?",
  },
  {
    slug: 'ts-code-2663',
    title: 'Ts Code 2663',
    description:
      "Cannot find name '{0}'. Did you mean the instance member 'this.{0}'?",
  },
  {
    slug: 'ts-code-2664',
    title: 'Ts Code 2664',
    description:
      "Invalid module name in augmentation, module '{0}' cannot be found.",
  },
  {
    slug: 'ts-code-2665',
    title: 'Ts Code 2665',
    description:
      "Invalid module name in augmentation. Module '{0}' resolves to an untyped module at '{1}', which cannot be augmented.",
  },
  {
    slug: 'ts-code-2666',
    title: 'Ts Code 2666',
    description:
      'Exports and export assignments are not permitted in module augmentations.',
  },
  {
    slug: 'ts-code-2667',
    title: 'Ts Code 2667',
    description:
      'Imports are not permitted in module augmentations. Consider moving them to the enclosing external module.',
  },
  {
    slug: 'ts-code-2668',
    title: 'Ts Code 2668',
    description:
      "'export' modifier cannot be applied to ambient modules and module augmentations since they are always visible.",
  },
  {
    slug: 'ts-code-2669',
    title: 'Ts Code 2669',
    description:
      'Augmentations for the global scope can only be directly nested in external modules or ambient module declarations.',
  },
  {
    slug: 'ts-code-2670',
    title: 'Ts Code 2670',
    description:
      "Augmentations for the global scope should have 'declare' modifier unless they appear in already ambient context.",
  },
  {
    slug: 'ts-code-2671',
    title: 'Ts Code 2671',
    description:
      "Cannot augment module '{0}' because it resolves to a non-module entity.",
  },
  {
    slug: 'ts-code-2672',
    title: 'Ts Code 2672',
    description:
      "Cannot assign a '{0}' constructor type to a '{1}' constructor type.",
  },
  {
    slug: 'ts-code-2673',
    title: 'Ts Code 2673',
    description:
      "Constructor of class '{0}' is private and only accessible within the class declaration.",
  },
  {
    slug: 'ts-code-2674',
    title: 'Ts Code 2674',
    description:
      "Constructor of class '{0}' is protected and only accessible within the class declaration.",
  },
  {
    slug: 'ts-code-2675',
    title: 'Ts Code 2675',
    description:
      "Cannot extend a class '{0}'. Class constructor is marked as private.",
  },
  {
    slug: 'ts-code-2676',
    title: 'Ts Code 2676',
    description: 'Accessors must both be abstract or non-abstract.',
  },
  {
    slug: 'ts-code-2677',
    title: 'Ts Code 2677',
    description:
      "A type predicate's type must be assignable to its parameter's type.",
  },
  {
    slug: 'ts-code-2678',
    title: 'Ts Code 2678',
    description: "Type '{0}' is not comparable to type '{1}'.",
  },
  {
    slug: 'ts-code-2679',
    title: 'Ts Code 2679',
    description:
      "A function that is called with the 'new' keyword cannot have a 'this' type that is 'void'.",
  },
  {
    slug: 'ts-code-2680',
    title: 'Ts Code 2680',
    description: "A '{0}' parameter must be the first parameter.",
  },
  {
    slug: 'ts-code-2681',
    title: 'Ts Code 2681',
    description: "A constructor cannot have a 'this' parameter.",
  },
  {
    slug: 'ts-code-2683',
    title: 'Ts Code 2683',
    description:
      "'this' implicitly has type 'any' because it does not have a type annotation.",
  },
  {
    slug: 'ts-code-2684',
    title: 'Ts Code 2684',
    description:
      "The 'this' context of type '{0}' is not assignable to method's 'this' of type '{1}'.",
  },
  {
    slug: 'ts-code-2685',
    title: 'Ts Code 2685',
    description: "The 'this' types of each signature are incompatible.",
  },
  {
    slug: 'ts-code-2686',
    title: 'Ts Code 2686',
    description:
      "'{0}' refers to a UMD global, but the current file is a module. Consider adding an import instead.",
  },
  {
    slug: 'ts-code-2687',
    title: 'Ts Code 2687',
    description: "All declarations of '{0}' must have identical modifiers.",
  },
  {
    slug: 'ts-code-2688',
    title: 'Ts Code 2688',
    description: "Cannot find type definition file for '{0}'.",
  },
  {
    slug: 'ts-code-2689',
    title: 'Ts Code 2689',
    description: "Cannot extend an interface '{0}'. Did you mean 'implements'?",
  },
  {
    slug: 'ts-code-2690',
    title: 'Ts Code 2690',
    description:
      "'{0}' only refers to a type, but is being used as a value here. Did you mean to use '{1} in {0}'?",
  },
  {
    slug: 'ts-code-2692',
    title: 'Ts Code 2692',
    description:
      "'{0}' is a primitive, but '{1}' is a wrapper object. Prefer using '{0}' when possible.",
  },
  {
    slug: 'ts-code-2693',
    title: 'Ts Code 2693',
    description:
      "'{0}' only refers to a type, but is being used as a value here.",
  },
  {
    slug: 'ts-code-2694',
    title: 'Ts Code 2694',
    description: "Namespace '{0}' has no exported member '{1}'.",
  },
  {
    slug: 'ts-code-2695',
    title: 'Ts Code 2695',
    description:
      'Left side of comma operator is unused and has no side effects.',
  },
  {
    slug: 'ts-code-2696',
    title: 'Ts Code 2696',
    description:
      "The 'Object' type is assignable to very few other types. Did you mean to use the 'any' type instead?",
  },
  {
    slug: 'ts-code-2697',
    title: 'Ts Code 2697',
    description:
      "An async function or method must return a 'Promise'. Make sure you have a declaration for 'Promise' or include 'ES2015' in your '--lib' option.",
  },
  {
    slug: 'ts-code-2698',
    title: 'Ts Code 2698',
    description: 'Spread types may only be created from object types.',
  },
  {
    slug: 'ts-code-2699',
    title: 'Ts Code 2699',
    description:
      "Static property '{0}' conflicts with built-in property 'Function.{0}' of constructor function '{1}'.",
  },
  {
    slug: 'ts-code-2700',
    title: 'Ts Code 2700',
    description: 'Rest types may only be created from object types.',
  },
  {
    slug: 'ts-code-2701',
    title: 'Ts Code 2701',
    description:
      'The target of an object rest assignment must be a variable or a property access.',
  },
  {
    slug: 'ts-code-2702',
    title: 'Ts Code 2702',
    description:
      "'{0}' only refers to a type, but is being used as a namespace here.",
  },
  {
    slug: 'ts-code-2703',
    title: 'Ts Code 2703',
    description:
      "The operand of a 'delete' operator must be a property reference.",
  },
  {
    slug: 'ts-code-2704',
    title: 'Ts Code 2704',
    description:
      "The operand of a 'delete' operator cannot be a read-only property.",
  },
  {
    slug: 'ts-code-2705',
    title: 'Ts Code 2705',
    description:
      "An async function or method in ES5 requires the 'Promise' constructor.  Make sure you have a declaration for the 'Promise' constructor or include 'ES2015' in your '--lib' option.",
  },
  {
    slug: 'ts-code-2706',
    title: 'Ts Code 2706',
    description:
      'Required type parameters may not follow optional type parameters.',
  },
  {
    slug: 'ts-code-2707',
    title: 'Ts Code 2707',
    description:
      "Generic type '{0}' requires between {1} and {2} type arguments.",
  },
  {
    slug: 'ts-code-2708',
    title: 'Ts Code 2708',
    description: "Cannot use namespace '{0}' as a value.",
  },
  {
    slug: 'ts-code-2709',
    title: 'Ts Code 2709',
    description: "Cannot use namespace '{0}' as a type.",
  },
  {
    slug: 'ts-code-2710',
    title: 'Ts Code 2710',
    description:
      "'{0}' are specified twice. The attribute named '{0}' will be overwritten.",
  },
  {
    slug: 'ts-code-2711',
    title: 'Ts Code 2711',
    description:
      "A dynamic import call returns a 'Promise'. Make sure you have a declaration for 'Promise' or include 'ES2015' in your '--lib' option.",
  },
  {
    slug: 'ts-code-2712',
    title: 'Ts Code 2712',
    description:
      "A dynamic import call in ES5 requires the 'Promise' constructor.  Make sure you have a declaration for the 'Promise' constructor or include 'ES2015' in your '--lib' option.",
  },
  {
    slug: 'ts-code-2713',
    title: 'Ts Code 2713',
    description:
      "Cannot access '{0}.{1}' because '{0}' is a type, but not a namespace. Did you mean to retrieve the type of the property '{1}' in '{0}' with '{0}[\"{1}\"]'?",
  },
  {
    slug: 'ts-code-2714',
    title: 'Ts Code 2714',
    description:
      'The expression of an export assignment must be an identifier or qualified name in an ambient context.',
  },
  {
    slug: 'ts-code-2715',
    title: 'Ts Code 2715',
    description:
      "Abstract property '{0}' in class '{1}' cannot be accessed in the constructor.",
  },
  {
    slug: 'ts-code-2716',
    title: 'Ts Code 2716',
    description: "Type parameter '{0}' has a circular default.",
  },
  {
    slug: 'ts-code-2717',
    title: 'Ts Code 2717',
    description:
      "Subsequent property declarations must have the same type.  Property '{0}' must be of type '{1}', but here has type '{2}'.",
  },
  {
    slug: 'ts-code-2718',
    title: 'Ts Code 2718',
    description: "Duplicate property '{0}'.",
  },
  {
    slug: 'ts-code-2719',
    title: 'Ts Code 2719',
    description:
      "Type '{0}' is not assignable to type '{1}'. Two different types with this name exist, but they are unrelated.",
  },
  {
    slug: 'ts-code-2720',
    title: 'Ts Code 2720',
    description:
      "Class '{0}' incorrectly implements class '{1}'. Did you mean to extend '{1}' and inherit its members as a subclass?",
  },
  {
    slug: 'ts-code-2721',
    title: 'Ts Code 2721',
    description: "Cannot invoke an object which is possibly 'null'.",
  },
  {
    slug: 'ts-code-2722',
    title: 'Ts Code 2722',
    description: "Cannot invoke an object which is possibly 'undefined'.",
  },
  {
    slug: 'ts-code-2723',
    title: 'Ts Code 2723',
    description:
      "Cannot invoke an object which is possibly 'null' or 'undefined'.",
  },
  {
    slug: 'ts-code-2724',
    title: 'Ts Code 2724',
    description:
      "'{0}' has no exported member named '{1}'. Did you mean '{2}'?",
  },
  {
    slug: 'ts-code-2725',
    title: 'Ts Code 2725',
    description:
      "Class name cannot be 'Object' when targeting ES5 with module {0}.",
  },
  {
    slug: 'ts-code-2726',
    title: 'Ts Code 2726',
    description: "Cannot find lib definition for '{0}'.",
  },
  {
    slug: 'ts-code-2727',
    title: 'Ts Code 2727',
    description: "Cannot find lib definition for '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-2729',
    title: 'Ts Code 2729',
    description: "Property '{0}' is used before its initialization.",
  },
  {
    slug: 'ts-code-2730',
    title: 'Ts Code 2730',
    description: "An arrow function cannot have a 'this' parameter.",
  },
  {
    slug: 'ts-code-2731',
    title: 'Ts Code 2731',
    description:
      "Implicit conversion of a 'symbol' to a 'string' will fail at runtime. Consider wrapping this expression in 'String(...)'.",
  },
  {
    slug: 'ts-code-2732',
    title: 'Ts Code 2732',
    description:
      "Cannot find module '{0}'. Consider using '--resolveJsonModule' to import module with '.json' extension.",
  },
  {
    slug: 'ts-code-2733',
    title: 'Ts Code 2733',
    description: "Property '{0}' was also declared here.",
  },
  {
    slug: 'ts-code-2734',
    title: 'Ts Code 2734',
    description: 'Are you missing a semicolon?',
  },
  {
    slug: 'ts-code-2735',
    title: 'Ts Code 2735',
    description:
      "Did you mean for '{0}' to be constrained to type 'new (...args: any[]) => {1}'?",
  },
  {
    slug: 'ts-code-2736',
    title: 'Ts Code 2736',
    description: "Operator '{0}' cannot be applied to type '{1}'.",
  },
  {
    slug: 'ts-code-2737',
    title: 'Ts Code 2737',
    description:
      'BigInt literals are not available when targeting lower than ES2020.',
  },
  {
    slug: 'ts-code-2739',
    title: 'Ts Code 2739',
    description:
      "Type '{0}' is missing the following properties from type '{1}': {2}",
  },
  {
    slug: 'ts-code-2740',
    title: 'Ts Code 2740',
    description:
      "Type '{0}' is missing the following properties from type '{1}': {2}, and {3} more.",
  },
  {
    slug: 'ts-code-2741',
    title: 'Ts Code 2741',
    description:
      "Property '{0}' is missing in type '{1}' but required in type '{2}'.",
  },
  {
    slug: 'ts-code-2742',
    title: 'Ts Code 2742',
    description:
      "The inferred type of '{0}' cannot be named without a reference to '{1}'. This is likely not portable. A type annotation is necessary.",
  },
  {
    slug: 'ts-code-2743',
    title: 'Ts Code 2743',
    description:
      'No overload expects {0} type arguments, but overloads do exist that expect either {1} or {2} type arguments.',
  },
  {
    slug: 'ts-code-2744',
    title: 'Ts Code 2744',
    description:
      'Type parameter defaults can only reference previously declared type parameters.',
  },
  {
    slug: 'ts-code-2745',
    title: 'Ts Code 2745',
    description:
      "This JSX tag's '{0}' prop expects type '{1}' which requires multiple children, but only a single child was provided.",
  },
  {
    slug: 'ts-code-2746',
    title: 'Ts Code 2746',
    description:
      "This JSX tag's '{0}' prop expects a single child of type '{1}', but multiple children were provided.",
  },
  {
    slug: 'ts-code-2747',
    title: 'Ts Code 2747',
    description:
      "'{0}' components don't accept text as child elements. Text in JSX has the type 'string', but the expected type of '{1}' is '{2}'.",
  },
  {
    slug: 'ts-code-2748',
    title: 'Ts Code 2748',
    description: "Cannot access ambient const enums when '{0}' is enabled.",
  },
  {
    slug: 'ts-code-2749',
    title: 'Ts Code 2749',
    description:
      "'{0}' refers to a value, but is being used as a type here. Did you mean 'typeof {0}'?",
  },
  {
    slug: 'ts-code-2750',
    title: 'Ts Code 2750',
    description: 'The implementation signature is declared here.',
  },
  {
    slug: 'ts-code-2751',
    title: 'Ts Code 2751',
    description: 'Circularity originates in type at this location.',
  },
  {
    slug: 'ts-code-2752',
    title: 'Ts Code 2752',
    description: 'The first export default is here.',
  },
  {
    slug: 'ts-code-2753',
    title: 'Ts Code 2753',
    description: 'Another export default is here.',
  },
  {
    slug: 'ts-code-2754',
    title: 'Ts Code 2754',
    description: "'super' may not use type arguments.",
  },
  {
    slug: 'ts-code-2755',
    title: 'Ts Code 2755',
    description: "No constituent of type '{0}' is callable.",
  },
  {
    slug: 'ts-code-2756',
    title: 'Ts Code 2756',
    description: "Not all constituents of type '{0}' are callable.",
  },
  {
    slug: 'ts-code-2757',
    title: 'Ts Code 2757',
    description: "Type '{0}' has no call signatures.",
  },
  {
    slug: 'ts-code-2758',
    title: 'Ts Code 2758',
    description:
      "Each member of the union type '{0}' has signatures, but none of those signatures are compatible with each other.",
  },
  {
    slug: 'ts-code-2759',
    title: 'Ts Code 2759',
    description: "No constituent of type '{0}' is constructable.",
  },
  {
    slug: 'ts-code-2760',
    title: 'Ts Code 2760',
    description: "Not all constituents of type '{0}' are constructable.",
  },
  {
    slug: 'ts-code-2761',
    title: 'Ts Code 2761',
    description: "Type '{0}' has no construct signatures.",
  },
  {
    slug: 'ts-code-2762',
    title: 'Ts Code 2762',
    description:
      "Each member of the union type '{0}' has construct signatures, but none of those signatures are compatible with each other.",
  },
  {
    slug: 'ts-code-2763',
    title: 'Ts Code 2763',
    description:
      "Cannot iterate value because the 'next' method of its iterator expects type '{1}', but for-of will always send '{0}'.",
  },
  {
    slug: 'ts-code-2764',
    title: 'Ts Code 2764',
    description:
      "Cannot iterate value because the 'next' method of its iterator expects type '{1}', but array spread will always send '{0}'.",
  },
  {
    slug: 'ts-code-2765',
    title: 'Ts Code 2765',
    description:
      "Cannot iterate value because the 'next' method of its iterator expects type '{1}', but array destructuring will always send '{0}'.",
  },
  {
    slug: 'ts-code-2766',
    title: 'Ts Code 2766',
    description:
      "Cannot delegate iteration to value because the 'next' method of its iterator expects type '{1}', but the containing generator will always send '{0}'.",
  },
  {
    slug: 'ts-code-2767',
    title: 'Ts Code 2767',
    description: "The '{0}' property of an iterator must be a method.",
  },
  {
    slug: 'ts-code-2768',
    title: 'Ts Code 2768',
    description: "The '{0}' property of an async iterator must be a method.",
  },
  {
    slug: 'ts-code-2769',
    title: 'Ts Code 2769',
    description: 'No overload matches this call.',
  },
  {
    slug: 'ts-code-2770',
    title: 'Ts Code 2770',
    description: 'The last overload gave the following error.',
  },
  {
    slug: 'ts-code-2771',
    title: 'Ts Code 2771',
    description: 'The last overload is declared here.',
  },
  {
    slug: 'ts-code-2772',
    title: 'Ts Code 2772',
    description: "Overload {0} of {1}, '{2}', gave the following error.",
  },
  {
    slug: 'ts-code-2773',
    title: 'Ts Code 2773',
    description: "Did you forget to use 'await'?",
  },
  {
    slug: 'ts-code-2774',
    title: 'Ts Code 2774',
    description:
      'This condition will always return true since this function is always defined. Did you mean to call it instead?',
  },
  {
    slug: 'ts-code-2775',
    title: 'Ts Code 2775',
    description:
      'Assertions require every name in the call target to be declared with an explicit type annotation.',
  },
  {
    slug: 'ts-code-2776',
    title: 'Ts Code 2776',
    description:
      'Assertions require the call target to be an identifier or qualified name.',
  },
  {
    slug: 'ts-code-2777',
    title: 'Ts Code 2777',
    description:
      'The operand of an increment or decrement operator may not be an optional property access.',
  },
  {
    slug: 'ts-code-2778',
    title: 'Ts Code 2778',
    description:
      'The target of an object rest assignment may not be an optional property access.',
  },
  {
    slug: 'ts-code-2779',
    title: 'Ts Code 2779',
    description:
      'The left-hand side of an assignment expression may not be an optional property access.',
  },
  {
    slug: 'ts-code-2780',
    title: 'Ts Code 2780',
    description:
      "The left-hand side of a 'for...in' statement may not be an optional property access.",
  },
  {
    slug: 'ts-code-2781',
    title: 'Ts Code 2781',
    description:
      "The left-hand side of a 'for...of' statement may not be an optional property access.",
  },
  {
    slug: 'ts-code-2783',
    title: 'Ts Code 2783',
    description:
      "'{0}' is specified more than once, so this usage will be overwritten.",
  },
  {
    slug: 'ts-code-2784',
    title: 'Ts Code 2784',
    description: "'get' and 'set' accessors cannot declare 'this' parameters.",
  },
  {
    slug: 'ts-code-2785',
    title: 'Ts Code 2785',
    description: 'This spread always overwrites this property.',
  },
  {
    slug: 'ts-code-2786',
    title: 'Ts Code 2786',
    description: "'{0}' cannot be used as a JSX component.",
  },
  {
    slug: 'ts-code-2787',
    title: 'Ts Code 2787',
    description: "Its return type '{0}' is not a valid JSX element.",
  },
  {
    slug: 'ts-code-2788',
    title: 'Ts Code 2788',
    description: "Its instance type '{0}' is not a valid JSX element.",
  },
  {
    slug: 'ts-code-2789',
    title: 'Ts Code 2789',
    description: "Its element type '{0}' is not a valid JSX element.",
  },
  {
    slug: 'ts-code-2790',
    title: 'Ts Code 2790',
    description: "The operand of a 'delete' operator must be optional.",
  },
  {
    slug: 'ts-code-2791',
    title: 'Ts Code 2791',
    description:
      "Exponentiation cannot be performed on 'bigint' values unless the 'target' option is set to 'es2016' or later.",
  },
  {
    slug: 'ts-code-2792',
    title: 'Ts Code 2792',
    description:
      "Cannot find module '{0}'. Did you mean to set the 'moduleResolution' option to 'nodenext', or to add aliases to the 'paths' option?",
  },
  {
    slug: 'ts-code-2793',
    title: 'Ts Code 2793',
    description:
      'The call would have succeeded against this implementation, but implementation signatures of overloads are not externally visible.',
  },
  {
    slug: 'ts-code-2794',
    title: 'Ts Code 2794',
    description:
      "Expected {0} arguments, but got {1}. Did you forget to include 'void' in your type argument to 'Promise'?",
  },
  {
    slug: 'ts-code-2795',
    title: 'Ts Code 2795',
    description:
      "The 'intrinsic' keyword can only be used to declare compiler provided intrinsic types.",
  },
  {
    slug: 'ts-code-2796',
    title: 'Ts Code 2796',
    description:
      'It is likely that you are missing a comma to separate these two template expressions. They form a tagged template expression which cannot be invoked.',
  },
  {
    slug: 'ts-code-2797',
    title: 'Ts Code 2797',
    description:
      "A mixin class that extends from a type variable containing an abstract construct signature must also be declared 'abstract'.",
  },
  {
    slug: 'ts-code-2798',
    title: 'Ts Code 2798',
    description: 'The declaration was marked as deprecated here.',
  },
  {
    slug: 'ts-code-2799',
    title: 'Ts Code 2799',
    description: 'Type produces a tuple type that is too large to represent.',
  },
  {
    slug: 'ts-code-2800',
    title: 'Ts Code 2800',
    description:
      'Expression produces a tuple type that is too large to represent.',
  },
  {
    slug: 'ts-code-2801',
    title: 'Ts Code 2801',
    description:
      "This condition will always return true since this '{0}' is always defined.",
  },
  {
    slug: 'ts-code-2802',
    title: 'Ts Code 2802',
    description:
      "Type '{0}' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.",
  },
  {
    slug: 'ts-code-2803',
    title: 'Ts Code 2803',
    description:
      "Cannot assign to private method '{0}'. Private methods are not writable.",
  },
  {
    slug: 'ts-code-2804',
    title: 'Ts Code 2804',
    description:
      "Duplicate identifier '{0}'. Static and instance elements cannot share the same private name.",
  },
  {
    slug: 'ts-code-2806',
    title: 'Ts Code 2806',
    description: 'Private accessor was defined without a getter.',
  },
  {
    slug: 'ts-code-2807',
    title: 'Ts Code 2807',
    description:
      "This syntax requires an imported helper named '{1}' with {2} parameters, which is not compatible with the one in '{0}'. Consider upgrading your version of '{0}'.",
  },
  {
    slug: 'ts-code-2808',
    title: 'Ts Code 2808',
    description: 'A get accessor must be at least as accessible as the setter',
  },
  {
    slug: 'ts-code-2809',
    title: 'Ts Code 2809',
    description:
      "Declaration or statement expected. This '=' follows a block of statements, so if you intended to write a destructuring assignment, you might need to wrap the whole assignment in parentheses.",
  },
  {
    slug: 'ts-code-2810',
    title: 'Ts Code 2810',
    description:
      "Expected 1 argument, but got 0. 'new Promise()' needs a JSDoc hint to produce a 'resolve' that can be called without arguments.",
  },
  {
    slug: 'ts-code-2811',
    title: 'Ts Code 2811',
    description: "Initializer for property '{0}'",
  },
  {
    slug: 'ts-code-2812',
    title: 'Ts Code 2812',
    description:
      "Property '{0}' does not exist on type '{1}'. Try changing the 'lib' compiler option to include 'dom'.",
  },
  {
    slug: 'ts-code-2813',
    title: 'Ts Code 2813',
    description: "Class declaration cannot implement overload list for '{0}'.",
  },
  {
    slug: 'ts-code-2814',
    title: 'Ts Code 2814',
    description:
      'Function with bodies can only merge with classes that are ambient.',
  },
  {
    slug: 'ts-code-2815',
    title: 'Ts Code 2815',
    description: "'arguments' cannot be referenced in property initializers.",
  },
  {
    slug: 'ts-code-2816',
    title: 'Ts Code 2816',
    description:
      "Cannot use 'this' in a static property initializer of a decorated class.",
  },
  {
    slug: 'ts-code-2817',
    title: 'Ts Code 2817',
    description:
      "Property '{0}' has no initializer and is not definitely assigned in a class static block.",
  },
  {
    slug: 'ts-code-2818',
    title: 'Ts Code 2818',
    description:
      "Duplicate identifier '{0}'. Compiler reserves name '{1}' when emitting 'super' references in static initializers.",
  },
  {
    slug: 'ts-code-2819',
    title: 'Ts Code 2819',
    description: "Namespace name cannot be '{0}'.",
  },
  {
    slug: 'ts-code-2820',
    title: 'Ts Code 2820',
    description:
      "Type '{0}' is not assignable to type '{1}'. Did you mean '{2}'?",
  },
  {
    slug: 'ts-code-2821',
    title: 'Ts Code 2821',
    description:
      "Import assertions are only supported when the '--module' option is set to 'esnext', 'node18', 'nodenext', or 'preserve'.",
  },
  {
    slug: 'ts-code-2822',
    title: 'Ts Code 2822',
    description:
      'Import assertions cannot be used with type-only imports or exports.',
  },
  {
    slug: 'ts-code-2823',
    title: 'Ts Code 2823',
    description:
      "Import attributes are only supported when the '--module' option is set to 'esnext', 'node18', 'nodenext', or 'preserve'.",
  },
  {
    slug: 'ts-code-2833',
    title: 'Ts Code 2833',
    description: "Cannot find namespace '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-2834',
    title: 'Ts Code 2834',
    description:
      "Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Consider adding an extension to the import path.",
  },
  {
    slug: 'ts-code-2835',
    title: 'Ts Code 2835',
    description:
      "Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '{0}'?",
  },
  {
    slug: 'ts-code-2836',
    title: 'Ts Code 2836',
    description:
      "Import assertions are not allowed on statements that compile to CommonJS 'require' calls.",
  },
  {
    slug: 'ts-code-2837',
    title: 'Ts Code 2837',
    description: 'Import assertion values must be string literal expressions.',
  },
  {
    slug: 'ts-code-2838',
    title: 'Ts Code 2838',
    description: "All declarations of '{0}' must have identical constraints.",
  },
  {
    slug: 'ts-code-2839',
    title: 'Ts Code 2839',
    description:
      "This condition will always return '{0}' since JavaScript compares objects by reference, not value.",
  },
  {
    slug: 'ts-code-2840',
    title: 'Ts Code 2840',
    description:
      "An interface cannot extend a primitive type like '{0}'. It can only extend other named object types.",
  },
  {
    slug: 'ts-code-2842',
    title: 'Ts Code 2842',
    description:
      "'{0}' is an unused renaming of '{1}'. Did you intend to use it as a type annotation?",
  },
  {
    slug: 'ts-code-2843',
    title: 'Ts Code 2843',
    description:
      "We can only write a type for '{0}' by adding a type for the entire parameter here.",
  },
  {
    slug: 'ts-code-2844',
    title: 'Ts Code 2844',
    description:
      "Type of instance member variable '{0}' cannot reference identifier '{1}' declared in the constructor.",
  },
  {
    slug: 'ts-code-2845',
    title: 'Ts Code 2845',
    description: "This condition will always return '{0}'.",
  },
  {
    slug: 'ts-code-2846',
    title: 'Ts Code 2846',
    description:
      "A declaration file cannot be imported without 'import type'. Did you mean to import an implementation file '{0}' instead?",
  },
  {
    slug: 'ts-code-2848',
    title: 'Ts Code 2848',
    description:
      "The right-hand side of an 'instanceof' expression must not be an instantiation expression.",
  },
  {
    slug: 'ts-code-2849',
    title: 'Ts Code 2849',
    description:
      'Target signature provides too few arguments. Expected {0} or more, but got {1}.',
  },
  {
    slug: 'ts-code-2850',
    title: 'Ts Code 2850',
    description:
      "The initializer of a 'using' declaration must be either an object with a '[Symbol.dispose]()' method, or be 'null' or 'undefined'.",
  },
  {
    slug: 'ts-code-2851',
    title: 'Ts Code 2851',
    description:
      "The initializer of an 'await using' declaration must be either an object with a '[Symbol.asyncDispose]()' or '[Symbol.dispose]()' method, or be 'null' or 'undefined'.",
  },
  {
    slug: 'ts-code-2852',
    title: 'Ts Code 2852',
    description:
      "'await using' statements are only allowed within async functions and at the top levels of modules.",
  },
  {
    slug: 'ts-code-2853',
    title: 'Ts Code 2853',
    description:
      "'await using' statements are only allowed at the top level of a file when that file is a module, but this file has no imports or exports. Consider adding an empty 'export {}' to make this file a module.",
  },
  {
    slug: 'ts-code-2854',
    title: 'Ts Code 2854',
    description:
      "Top-level 'await using' statements are only allowed when the 'module' option is set to 'es2022', 'esnext', 'system', 'node16', 'node18', 'nodenext', or 'preserve', and the 'target' option is set to 'es2017' or higher.",
  },
  {
    slug: 'ts-code-2855',
    title: 'Ts Code 2855',
    description:
      "Class field '{0}' defined by the parent class is not accessible in the child class via super.",
  },
  {
    slug: 'ts-code-2856',
    title: 'Ts Code 2856',
    description:
      "Import attributes are not allowed on statements that compile to CommonJS 'require' calls.",
  },
  {
    slug: 'ts-code-2857',
    title: 'Ts Code 2857',
    description:
      'Import attributes cannot be used with type-only imports or exports.',
  },
  {
    slug: 'ts-code-2858',
    title: 'Ts Code 2858',
    description: 'Import attribute values must be string literal expressions.',
  },
  {
    slug: 'ts-code-2859',
    title: 'Ts Code 2859',
    description: "Excessive complexity comparing types '{0}' and '{1}'.",
  },
  {
    slug: 'ts-code-2860',
    title: 'Ts Code 2860',
    description:
      "The left-hand side of an 'instanceof' expression must be assignable to the first argument of the right-hand side's '[Symbol.hasInstance]' method.",
  },
  {
    slug: 'ts-code-2861',
    title: 'Ts Code 2861',
    description:
      "An object's '[Symbol.hasInstance]' method must return a boolean value for it to be used on the right-hand side of an 'instanceof' expression.",
  },
  {
    slug: 'ts-code-2862',
    title: 'Ts Code 2862',
    description: "Type '{0}' is generic and can only be indexed for reading.",
  },
  {
    slug: 'ts-code-2863',
    title: 'Ts Code 2863',
    description:
      "A class cannot extend a primitive type like '{0}'. Classes can only extend constructable values.",
  },
  {
    slug: 'ts-code-2864',
    title: 'Ts Code 2864',
    description:
      "A class cannot implement a primitive type like '{0}'. It can only implement other named object types.",
  },
  {
    slug: 'ts-code-2865',
    title: 'Ts Code 2865',
    description:
      "Import '{0}' conflicts with local value, so must be declared with a type-only import when 'isolatedModules' is enabled.",
  },
  {
    slug: 'ts-code-2866',
    title: 'Ts Code 2866',
    description:
      "Import '{0}' conflicts with global value used in this file, so must be declared with a type-only import when 'isolatedModules' is enabled.",
  },
  {
    slug: 'ts-code-2867',
    title: 'Ts Code 2867',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for Bun? Try `npm i --save-dev @types/bun`.",
  },
  {
    slug: 'ts-code-2868',
    title: 'Ts Code 2868',
    description:
      "Cannot find name '{0}'. Do you need to install type definitions for Bun? Try `npm i --save-dev @types/bun` and then add 'bun' to the types field in your tsconfig.",
  },
  {
    slug: 'ts-code-2869',
    title: 'Ts Code 2869',
    description:
      'Right operand of ?? is unreachable because the left operand is never nullish.',
  },
  {
    slug: 'ts-code-2870',
    title: 'Ts Code 2870',
    description:
      'This binary expression is never nullish. Are you missing parentheses?',
  },
  {
    slug: 'ts-code-2871',
    title: 'Ts Code 2871',
    description: 'This expression is always nullish.',
  },
  {
    slug: 'ts-code-2872',
    title: 'Ts Code 2872',
    description: 'This kind of expression is always truthy.',
  },
  {
    slug: 'ts-code-2873',
    title: 'Ts Code 2873',
    description: 'This kind of expression is always falsy.',
  },
  {
    slug: 'ts-code-2874',
    title: 'Ts Code 2874',
    description:
      "This JSX tag requires '{0}' to be in scope, but it could not be found.",
  },
  {
    slug: 'ts-code-2875',
    title: 'Ts Code 2875',
    description:
      "This JSX tag requires the module path '{0}' to exist, but none could be found. Make sure you have types for the appropriate package installed.",
  },
  {
    slug: 'ts-code-2876',
    title: 'Ts Code 2876',
    description:
      'This relative import path is unsafe to rewrite because it looks like a file name, but actually resolves to "{0}".',
  },
  {
    slug: 'ts-code-2877',
    title: 'Ts Code 2877',
    description:
      "This import uses a '{0}' extension to resolve to an input TypeScript file, but will not be rewritten during emit because it is not a relative path.",
  },
  {
    slug: 'ts-code-2878',
    title: 'Ts Code 2878',
    description:
      "This import path is unsafe to rewrite because it resolves to another project, and the relative path between the projects' output files is not the same as the relative path between its input files.",
  },
  {
    slug: 'ts-code-2879',
    title: 'Ts Code 2879',
    description:
      "Using JSX fragments requires fragment factory '{0}' to be in scope, but it could not be found.",
  },
  {
    slug: 'ts-code-4000',
    title: 'Ts Code 4000',
    description: "Import declaration '{0}' is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4002',
    title: 'Ts Code 4002',
    description:
      "Type parameter '{0}' of exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4004',
    title: 'Ts Code 4004',
    description:
      "Type parameter '{0}' of exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4006',
    title: 'Ts Code 4006',
    description:
      "Type parameter '{0}' of constructor signature from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4008',
    title: 'Ts Code 4008',
    description:
      "Type parameter '{0}' of call signature from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4010',
    title: 'Ts Code 4010',
    description:
      "Type parameter '{0}' of public static method from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4012',
    title: 'Ts Code 4012',
    description:
      "Type parameter '{0}' of public method from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4014',
    title: 'Ts Code 4014',
    description:
      "Type parameter '{0}' of method from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4016',
    title: 'Ts Code 4016',
    description:
      "Type parameter '{0}' of exported function has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4019',
    title: 'Ts Code 4019',
    description:
      "Implements clause of exported class '{0}' has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4020',
    title: 'Ts Code 4020',
    description:
      "'extends' clause of exported class '{0}' has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4021',
    title: 'Ts Code 4021',
    description:
      "'extends' clause of exported class has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4022',
    title: 'Ts Code 4022',
    description:
      "'extends' clause of exported interface '{0}' has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4023',
    title: 'Ts Code 4023',
    description:
      "Exported variable '{0}' has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4024',
    title: 'Ts Code 4024',
    description:
      "Exported variable '{0}' has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4025',
    title: 'Ts Code 4025',
    description: "Exported variable '{0}' has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4026',
    title: 'Ts Code 4026',
    description:
      "Public static property '{0}' of exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4027',
    title: 'Ts Code 4027',
    description:
      "Public static property '{0}' of exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4028',
    title: 'Ts Code 4028',
    description:
      "Public static property '{0}' of exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4029',
    title: 'Ts Code 4029',
    description:
      "Public property '{0}' of exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4030',
    title: 'Ts Code 4030',
    description:
      "Public property '{0}' of exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4031',
    title: 'Ts Code 4031',
    description:
      "Public property '{0}' of exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4032',
    title: 'Ts Code 4032',
    description:
      "Property '{0}' of exported interface has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4033',
    title: 'Ts Code 4033',
    description:
      "Property '{0}' of exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4034',
    title: 'Ts Code 4034',
    description:
      "Parameter type of public static setter '{0}' from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4035',
    title: 'Ts Code 4035',
    description:
      "Parameter type of public static setter '{0}' from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4036',
    title: 'Ts Code 4036',
    description:
      "Parameter type of public setter '{0}' from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4037',
    title: 'Ts Code 4037',
    description:
      "Parameter type of public setter '{0}' from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4038',
    title: 'Ts Code 4038',
    description:
      "Return type of public static getter '{0}' from exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4039',
    title: 'Ts Code 4039',
    description:
      "Return type of public static getter '{0}' from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4040',
    title: 'Ts Code 4040',
    description:
      "Return type of public static getter '{0}' from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4041',
    title: 'Ts Code 4041',
    description:
      "Return type of public getter '{0}' from exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4042',
    title: 'Ts Code 4042',
    description:
      "Return type of public getter '{0}' from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4043',
    title: 'Ts Code 4043',
    description:
      "Return type of public getter '{0}' from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4044',
    title: 'Ts Code 4044',
    description:
      "Return type of constructor signature from exported interface has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4045',
    title: 'Ts Code 4045',
    description:
      "Return type of constructor signature from exported interface has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4046',
    title: 'Ts Code 4046',
    description:
      "Return type of call signature from exported interface has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4047',
    title: 'Ts Code 4047',
    description:
      "Return type of call signature from exported interface has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4048',
    title: 'Ts Code 4048',
    description:
      "Return type of index signature from exported interface has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4049',
    title: 'Ts Code 4049',
    description:
      "Return type of index signature from exported interface has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4050',
    title: 'Ts Code 4050',
    description:
      "Return type of public static method from exported class has or is using name '{0}' from external module {1} but cannot be named.",
  },
  {
    slug: 'ts-code-4051',
    title: 'Ts Code 4051',
    description:
      "Return type of public static method from exported class has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4052',
    title: 'Ts Code 4052',
    description:
      "Return type of public static method from exported class has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4053',
    title: 'Ts Code 4053',
    description:
      "Return type of public method from exported class has or is using name '{0}' from external module {1} but cannot be named.",
  },
  {
    slug: 'ts-code-4054',
    title: 'Ts Code 4054',
    description:
      "Return type of public method from exported class has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4055',
    title: 'Ts Code 4055',
    description:
      "Return type of public method from exported class has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4056',
    title: 'Ts Code 4056',
    description:
      "Return type of method from exported interface has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4057',
    title: 'Ts Code 4057',
    description:
      "Return type of method from exported interface has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4058',
    title: 'Ts Code 4058',
    description:
      "Return type of exported function has or is using name '{0}' from external module {1} but cannot be named.",
  },
  {
    slug: 'ts-code-4059',
    title: 'Ts Code 4059',
    description:
      "Return type of exported function has or is using name '{0}' from private module '{1}'.",
  },
  {
    slug: 'ts-code-4060',
    title: 'Ts Code 4060',
    description:
      "Return type of exported function has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4061',
    title: 'Ts Code 4061',
    description:
      "Parameter '{0}' of constructor from exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4062',
    title: 'Ts Code 4062',
    description:
      "Parameter '{0}' of constructor from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4063',
    title: 'Ts Code 4063',
    description:
      "Parameter '{0}' of constructor from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4064',
    title: 'Ts Code 4064',
    description:
      "Parameter '{0}' of constructor signature from exported interface has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4065',
    title: 'Ts Code 4065',
    description:
      "Parameter '{0}' of constructor signature from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4066',
    title: 'Ts Code 4066',
    description:
      "Parameter '{0}' of call signature from exported interface has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4067',
    title: 'Ts Code 4067',
    description:
      "Parameter '{0}' of call signature from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4068',
    title: 'Ts Code 4068',
    description:
      "Parameter '{0}' of public static method from exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4069',
    title: 'Ts Code 4069',
    description:
      "Parameter '{0}' of public static method from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4070',
    title: 'Ts Code 4070',
    description:
      "Parameter '{0}' of public static method from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4071',
    title: 'Ts Code 4071',
    description:
      "Parameter '{0}' of public method from exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4072',
    title: 'Ts Code 4072',
    description:
      "Parameter '{0}' of public method from exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4073',
    title: 'Ts Code 4073',
    description:
      "Parameter '{0}' of public method from exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4074',
    title: 'Ts Code 4074',
    description:
      "Parameter '{0}' of method from exported interface has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4075',
    title: 'Ts Code 4075',
    description:
      "Parameter '{0}' of method from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4076',
    title: 'Ts Code 4076',
    description:
      "Parameter '{0}' of exported function has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4077',
    title: 'Ts Code 4077',
    description:
      "Parameter '{0}' of exported function has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4078',
    title: 'Ts Code 4078',
    description:
      "Parameter '{0}' of exported function has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4081',
    title: 'Ts Code 4081',
    description:
      "Exported type alias '{0}' has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4082',
    title: 'Ts Code 4082',
    description:
      "Default export of the module has or is using private name '{0}'.",
  },
  {
    slug: 'ts-code-4083',
    title: 'Ts Code 4083',
    description:
      "Type parameter '{0}' of exported type alias has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4084',
    title: 'Ts Code 4084',
    description:
      "Exported type alias '{0}' has or is using private name '{1}' from module {2}.",
  },
  {
    slug: 'ts-code-4085',
    title: 'Ts Code 4085',
    description:
      "Extends clause for inferred type '{0}' has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4091',
    title: 'Ts Code 4091',
    description:
      "Parameter '{0}' of index signature from exported interface has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4092',
    title: 'Ts Code 4092',
    description:
      "Parameter '{0}' of index signature from exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4094',
    title: 'Ts Code 4094',
    description:
      "Property '{0}' of exported anonymous class type may not be private or protected.",
  },
  {
    slug: 'ts-code-4095',
    title: 'Ts Code 4095',
    description:
      "Public static method '{0}' of exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4096',
    title: 'Ts Code 4096',
    description:
      "Public static method '{0}' of exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4097',
    title: 'Ts Code 4097',
    description:
      "Public static method '{0}' of exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4098',
    title: 'Ts Code 4098',
    description:
      "Public method '{0}' of exported class has or is using name '{1}' from external module {2} but cannot be named.",
  },
  {
    slug: 'ts-code-4099',
    title: 'Ts Code 4099',
    description:
      "Public method '{0}' of exported class has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4100',
    title: 'Ts Code 4100',
    description:
      "Public method '{0}' of exported class has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4101',
    title: 'Ts Code 4101',
    description:
      "Method '{0}' of exported interface has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4102',
    title: 'Ts Code 4102',
    description:
      "Method '{0}' of exported interface has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4103',
    title: 'Ts Code 4103',
    description:
      "Type parameter '{0}' of exported mapped object type is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4104',
    title: 'Ts Code 4104',
    description:
      "The type '{0}' is 'readonly' and cannot be assigned to the mutable type '{1}'.",
  },
  {
    slug: 'ts-code-4105',
    title: 'Ts Code 4105',
    description:
      "Private or protected member '{0}' cannot be accessed on a type parameter.",
  },
  {
    slug: 'ts-code-4106',
    title: 'Ts Code 4106',
    description:
      "Parameter '{0}' of accessor has or is using private name '{1}'.",
  },
  {
    slug: 'ts-code-4107',
    title: 'Ts Code 4107',
    description:
      "Parameter '{0}' of accessor has or is using name '{1}' from private module '{2}'.",
  },
  {
    slug: 'ts-code-4108',
    title: 'Ts Code 4108',
    description:
      "Parameter '{0}' of accessor has or is using name '{1}' from external module '{2}' but cannot be named.",
  },
  {
    slug: 'ts-code-4109',
    title: 'Ts Code 4109',
    description: "Type arguments for '{0}' circularly reference themselves.",
  },
  {
    slug: 'ts-code-4110',
    title: 'Ts Code 4110',
    description: 'Tuple type arguments circularly reference themselves.',
  },
  {
    slug: 'ts-code-4111',
    title: 'Ts Code 4111',
    description:
      "Property '{0}' comes from an index signature, so it must be accessed with ['{0}'].",
  },
  {
    slug: 'ts-code-4112',
    title: 'Ts Code 4112',
    description:
      "This member cannot have an 'override' modifier because its containing class '{0}' does not extend another class.",
  },
  {
    slug: 'ts-code-4113',
    title: 'Ts Code 4113',
    description:
      "This member cannot have an 'override' modifier because it is not declared in the base class '{0}'.",
  },
  {
    slug: 'ts-code-4114',
    title: 'Ts Code 4114',
    description:
      "This member must have an 'override' modifier because it overrides a member in the base class '{0}'.",
  },
  {
    slug: 'ts-code-4115',
    title: 'Ts Code 4115',
    description:
      "This parameter property must have an 'override' modifier because it overrides a member in base class '{0}'.",
  },
  {
    slug: 'ts-code-4116',
    title: 'Ts Code 4116',
    description:
      "This member must have an 'override' modifier because it overrides an abstract method that is declared in the base class '{0}'.",
  },
  {
    slug: 'ts-code-4117',
    title: 'Ts Code 4117',
    description:
      "This member cannot have an 'override' modifier because it is not declared in the base class '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-4118',
    title: 'Ts Code 4118',
    description:
      "The type of this node cannot be serialized because its property '{0}' cannot be serialized.",
  },
  {
    slug: 'ts-code-4119',
    title: 'Ts Code 4119',
    description:
      "This member must have a JSDoc comment with an '@override' tag because it overrides a member in the base class '{0}'.",
  },
  {
    slug: 'ts-code-4120',
    title: 'Ts Code 4120',
    description:
      "This parameter property must have a JSDoc comment with an '@override' tag because it overrides a member in the base class '{0}'.",
  },
  {
    slug: 'ts-code-4121',
    title: 'Ts Code 4121',
    description:
      "This member cannot have a JSDoc comment with an '@override' tag because its containing class '{0}' does not extend another class.",
  },
  {
    slug: 'ts-code-4122',
    title: 'Ts Code 4122',
    description:
      "This member cannot have a JSDoc comment with an '@override' tag because it is not declared in the base class '{0}'.",
  },
  {
    slug: 'ts-code-4123',
    title: 'Ts Code 4123',
    description:
      "This member cannot have a JSDoc comment with an 'override' tag because it is not declared in the base class '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-4124',
    title: 'Ts Code 4124',
    description:
      "Compiler option '{0}' of value '{1}' is unstable. Use nightly TypeScript to silence this error. Try updating with 'npm install -D typescript@next'.",
  },
  {
    slug: 'ts-code-4125',
    title: 'Ts Code 4125',
    description:
      "Each declaration of '{0}.{1}' differs in its value, where '{2}' was expected but '{3}' was given.",
  },
  {
    slug: 'ts-code-4126',
    title: 'Ts Code 4126',
    description:
      "One value of '{0}.{1}' is the string '{2}', and the other is assumed to be an unknown numeric value.",
  },
  {
    slug: 'ts-code-4127',
    title: 'Ts Code 4127',
    description:
      "This member cannot have an 'override' modifier because its name is dynamic.",
  },
  {
    slug: 'ts-code-4128',
    title: 'Ts Code 4128',
    description:
      "This member cannot have a JSDoc comment with an '@override' tag because its name is dynamic.",
  },
  {
    slug: 'ts-code-5001',
    title: 'Ts Code 5001',
    description: "The current host does not support the '{0}' option.",
  },
  {
    slug: 'ts-code-5009',
    title: 'Ts Code 5009',
    description:
      'Cannot find the common subdirectory path for the input files.',
  },
  {
    slug: 'ts-code-5010',
    title: 'Ts Code 5010',
    description:
      "File specification cannot end in a recursive directory wildcard ('**'): '{0}'.",
  },
  {
    slug: 'ts-code-5012',
    title: 'Ts Code 5012',
    description: "Cannot read file '{0}': {1}.",
  },
  {
    slug: 'ts-code-5023',
    title: 'Ts Code 5023',
    description: "Unknown compiler option '{0}'.",
  },
  {
    slug: 'ts-code-5024',
    title: 'Ts Code 5024',
    description: "Compiler option '{0}' requires a value of type {1}.",
  },
  {
    slug: 'ts-code-5025',
    title: 'Ts Code 5025',
    description: "Unknown compiler option '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-5033',
    title: 'Ts Code 5033',
    description: "Could not write file '{0}': {1}.",
  },
  {
    slug: 'ts-code-5042',
    title: 'Ts Code 5042',
    description:
      "Option 'project' cannot be mixed with source files on a command line.",
  },
  {
    slug: 'ts-code-5047',
    title: 'Ts Code 5047',
    description:
      "Option 'isolatedModules' can only be used when either option '--module' is provided or option 'target' is 'ES2015' or higher.",
  },
  {
    slug: 'ts-code-5051',
    title: 'Ts Code 5051',
    description:
      "Option '{0} can only be used when either option '--inlineSourceMap' or option '--sourceMap' is provided.",
  },
  {
    slug: 'ts-code-5052',
    title: 'Ts Code 5052',
    description:
      "Option '{0}' cannot be specified without specifying option '{1}'.",
  },
  {
    slug: 'ts-code-5053',
    title: 'Ts Code 5053',
    description: "Option '{0}' cannot be specified with option '{1}'.",
  },
  {
    slug: 'ts-code-5054',
    title: 'Ts Code 5054',
    description: "A 'tsconfig.json' file is already defined at: '{0}'.",
  },
  {
    slug: 'ts-code-5055',
    title: 'Ts Code 5055',
    description:
      "Cannot write file '{0}' because it would overwrite input file.",
  },
  {
    slug: 'ts-code-5056',
    title: 'Ts Code 5056',
    description:
      "Cannot write file '{0}' because it would be overwritten by multiple input files.",
  },
  {
    slug: 'ts-code-5057',
    title: 'Ts Code 5057',
    description:
      "Cannot find a tsconfig.json file at the specified directory: '{0}'.",
  },
  {
    slug: 'ts-code-5058',
    title: 'Ts Code 5058',
    description: "The specified path does not exist: '{0}'.",
  },
  {
    slug: 'ts-code-5059',
    title: 'Ts Code 5059',
    description:
      "Invalid value for '--reactNamespace'. '{0}' is not a valid identifier.",
  },
  {
    slug: 'ts-code-5061',
    title: 'Ts Code 5061',
    description: "Pattern '{0}' can have at most one '*' character.",
  },
  {
    slug: 'ts-code-5062',
    title: 'Ts Code 5062',
    description:
      "Substitution '{0}' in pattern '{1}' can have at most one '*' character.",
  },
  {
    slug: 'ts-code-5063',
    title: 'Ts Code 5063',
    description: "Substitutions for pattern '{0}' should be an array.",
  },
  {
    slug: 'ts-code-5064',
    title: 'Ts Code 5064',
    description:
      "Substitution '{0}' for pattern '{1}' has incorrect type, expected 'string', got '{2}'.",
  },
  {
    slug: 'ts-code-5065',
    title: 'Ts Code 5065',
    description:
      "File specification cannot contain a parent directory ('..') that appears after a recursive directory wildcard ('**'): '{0}'.",
  },
  {
    slug: 'ts-code-5066',
    title: 'Ts Code 5066',
    description: "Substitutions for pattern '{0}' shouldn't be an empty array.",
  },
  {
    slug: 'ts-code-5067',
    title: 'Ts Code 5067',
    description:
      "Invalid value for 'jsxFactory'. '{0}' is not a valid identifier or qualified-name.",
  },
  {
    slug: 'ts-code-5068',
    title: 'Ts Code 5068',
    description:
      'Adding a tsconfig.json file will help organize projects that contain both TypeScript and JavaScript files. Learn more at https://aka.ms/tsconfig.',
  },
  {
    slug: 'ts-code-5069',
    title: 'Ts Code 5069',
    description:
      "Option '{0}' cannot be specified without specifying option '{1}' or option '{2}'.",
  },
  {
    slug: 'ts-code-5070',
    title: 'Ts Code 5070',
    description:
      "Option '--resolveJsonModule' cannot be specified when 'moduleResolution' is set to 'classic'.",
  },
  {
    slug: 'ts-code-5071',
    title: 'Ts Code 5071',
    description:
      "Option '--resolveJsonModule' cannot be specified when 'module' is set to 'none', 'system', or 'umd'.",
  },
  {
    slug: 'ts-code-5072',
    title: 'Ts Code 5072',
    description: "Unknown build option '{0}'.",
  },
  {
    slug: 'ts-code-5073',
    title: 'Ts Code 5073',
    description: "Build option '{0}' requires a value of type {1}.",
  },
  {
    slug: 'ts-code-5074',
    title: 'Ts Code 5074',
    description:
      "Option '--incremental' can only be specified using tsconfig, emitting to single file or when option '--tsBuildInfoFile' is specified.",
  },
  {
    slug: 'ts-code-5075',
    title: 'Ts Code 5075',
    description:
      "'{0}' is assignable to the constraint of type '{1}', but '{1}' could be instantiated with a different subtype of constraint '{2}'.",
  },
  {
    slug: 'ts-code-5076',
    title: 'Ts Code 5076',
    description:
      "'{0}' and '{1}' operations cannot be mixed without parentheses.",
  },
  {
    slug: 'ts-code-5077',
    title: 'Ts Code 5077',
    description: "Unknown build option '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-5078',
    title: 'Ts Code 5078',
    description: "Unknown watch option '{0}'.",
  },
  {
    slug: 'ts-code-5079',
    title: 'Ts Code 5079',
    description: "Unknown watch option '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-5080',
    title: 'Ts Code 5080',
    description: "Watch option '{0}' requires a value of type {1}.",
  },
  {
    slug: 'ts-code-5081',
    title: 'Ts Code 5081',
    description:
      'Cannot find a tsconfig.json file at the current directory: {0}.',
  },
  {
    slug: 'ts-code-5082',
    title: 'Ts Code 5082',
    description:
      "'{0}' could be instantiated with an arbitrary type which could be unrelated to '{1}'.",
  },
  {
    slug: 'ts-code-5083',
    title: 'Ts Code 5083',
    description: "Cannot read file '{0}'.",
  },
  {
    slug: 'ts-code-5085',
    title: 'Ts Code 5085',
    description: 'A tuple member cannot be both optional and rest.',
  },
  {
    slug: 'ts-code-5086',
    title: 'Ts Code 5086',
    description:
      'A labeled tuple element is declared as optional with a question mark after the name and before the colon, rather than after the type.',
  },
  {
    slug: 'ts-code-5087',
    title: 'Ts Code 5087',
    description:
      "A labeled tuple element is declared as rest with a '...' before the name, rather than before the type.",
  },
  {
    slug: 'ts-code-5088',
    title: 'Ts Code 5088',
    description:
      "The inferred type of '{0}' references a type with a cyclic structure which cannot be trivially serialized. A type annotation is necessary.",
  },
  {
    slug: 'ts-code-5089',
    title: 'Ts Code 5089',
    description: "Option '{0}' cannot be specified when option 'jsx' is '{1}'.",
  },
  {
    slug: 'ts-code-5090',
    title: 'Ts Code 5090',
    description:
      "Non-relative paths are not allowed when 'baseUrl' is not set. Did you forget a leading './'?",
  },
  {
    slug: 'ts-code-5091',
    title: 'Ts Code 5091',
    description:
      "Option 'preserveConstEnums' cannot be disabled when '{0}' is enabled.",
  },
  {
    slug: 'ts-code-5092',
    title: 'Ts Code 5092',
    description: "The root value of a '{0}' file must be an object.",
  },
  {
    slug: 'ts-code-5093',
    title: 'Ts Code 5093',
    description: "Compiler option '--{0}' may only be used with '--build'.",
  },
  {
    slug: 'ts-code-5094',
    title: 'Ts Code 5094',
    description: "Compiler option '--{0}' may not be used with '--build'.",
  },
  {
    slug: 'ts-code-5095',
    title: 'Ts Code 5095',
    description:
      "Option '{0}' can only be used when 'module' is set to 'preserve' or to 'es2015' or later.",
  },
  {
    slug: 'ts-code-5096',
    title: 'Ts Code 5096',
    description:
      "Option 'allowImportingTsExtensions' can only be used when either 'noEmit' or 'emitDeclarationOnly' is set.",
  },
  {
    slug: 'ts-code-5097',
    title: 'Ts Code 5097',
    description:
      "An import path can only end with a '{0}' extension when 'allowImportingTsExtensions' is enabled.",
  },
  {
    slug: 'ts-code-5098',
    title: 'Ts Code 5098',
    description:
      "Option '{0}' can only be used when 'moduleResolution' is set to 'node16', 'nodenext', or 'bundler'.",
  },
  {
    slug: 'ts-code-5101',
    title: 'Ts Code 5101',
    description:
      'Option \'{0}\' is deprecated and will stop functioning in TypeScript {1}. Specify compilerOption \'"ignoreDeprecations": "{2}"\' to silence this error.',
  },
  {
    slug: 'ts-code-5102',
    title: 'Ts Code 5102',
    description:
      "Option '{0}' has been removed. Please remove it from your configuration.",
  },
  {
    slug: 'ts-code-5103',
    title: 'Ts Code 5103',
    description: "Invalid value for '--ignoreDeprecations'.",
  },
  {
    slug: 'ts-code-5104',
    title: 'Ts Code 5104',
    description:
      "Option '{0}' is redundant and cannot be specified with option '{1}'.",
  },
  {
    slug: 'ts-code-5105',
    title: 'Ts Code 5105',
    description:
      "Option 'verbatimModuleSyntax' cannot be used when 'module' is set to 'UMD', 'AMD', or 'System'.",
  },
  {
    slug: 'ts-code-5107',
    title: 'Ts Code 5107',
    description:
      'Option \'{0}={1}\' is deprecated and will stop functioning in TypeScript {2}. Specify compilerOption \'"ignoreDeprecations": "{3}"\' to silence this error.',
  },
  {
    slug: 'ts-code-5108',
    title: 'Ts Code 5108',
    description:
      "Option '{0}={1}' has been removed. Please remove it from your configuration.",
  },
  {
    slug: 'ts-code-5109',
    title: 'Ts Code 5109',
    description:
      "Option 'moduleResolution' must be set to '{0}' (or left unspecified) when option 'module' is set to '{1}'.",
  },
  {
    slug: 'ts-code-5110',
    title: 'Ts Code 5110',
    description:
      "Option 'module' must be set to '{0}' when option 'moduleResolution' is set to '{1}'.",
  },
  {
    slug: 'ts-code-6044',
    title: 'Ts Code 6044',
    description: "Compiler option '{0}' expects an argument.",
  },
  {
    slug: 'ts-code-6045',
    title: 'Ts Code 6045',
    description: "Unterminated quoted string in response file '{0}'.",
  },
  {
    slug: 'ts-code-6046',
    title: 'Ts Code 6046',
    description: "Argument for '{0}' option must be: {1}.",
  },
  {
    slug: 'ts-code-6048',
    title: 'Ts Code 6048',
    description:
      "Locale must be of the form <language> or <language>-<territory>. For example '{0}' or '{1}'.",
  },
  {
    slug: 'ts-code-6050',
    title: 'Ts Code 6050',
    description: "Unable to open file '{0}'.",
  },
  {
    slug: 'ts-code-6051',
    title: 'Ts Code 6051',
    description: 'Corrupted locale file {0}.',
  },
  {
    slug: 'ts-code-6053',
    title: 'Ts Code 6053',
    description: "File '{0}' not found.",
  },
  {
    slug: 'ts-code-6054',
    title: 'Ts Code 6054',
    description:
      "File '{0}' has an unsupported extension. The only supported extensions are {1}.",
  },
  {
    slug: 'ts-code-6059',
    title: 'Ts Code 6059',
    description:
      "File '{0}' is not under 'rootDir' '{1}'. 'rootDir' is expected to contain all source files.",
  },
  {
    slug: 'ts-code-6064',
    title: 'Ts Code 6064',
    description:
      "Option '{0}' can only be specified in 'tsconfig.json' file or set to 'null' on command line.",
  },
  {
    slug: 'ts-code-6082',
    title: 'Ts Code 6082',
    description:
      "Only 'amd' and 'system' modules are supported alongside --{0}.",
  },
  {
    slug: 'ts-code-6114',
    title: 'Ts Code 6114',
    description: "Unknown option 'excludes'. Did you mean 'exclude'?",
  },
  {
    slug: 'ts-code-6131',
    title: 'Ts Code 6131',
    description:
      "Cannot compile modules using option '{0}' unless the '--module' flag is 'amd' or 'system'.",
  },
  {
    slug: 'ts-code-6133',
    title: 'Ts Code 6133',
    description: "'{0}' is declared but its value is never read.",
  },
  {
    slug: 'ts-code-6137',
    title: 'Ts Code 6137',
    description:
      "Cannot import type declaration files. Consider importing '{0}' instead of '{1}'.",
  },
  {
    slug: 'ts-code-6138',
    title: 'Ts Code 6138',
    description: "Property '{0}' is declared but its value is never read.",
  },
  {
    slug: 'ts-code-6140',
    title: 'Ts Code 6140',
    description:
      "Auto discovery for typings is enabled in project '{0}'. Running extra resolution pass for module '{1}' using cache location '{2}'.",
  },
  {
    slug: 'ts-code-6142',
    title: 'Ts Code 6142',
    description: "Module '{0}' was resolved to '{1}', but '--jsx' is not set.",
  },
  {
    slug: 'ts-code-6188',
    title: 'Ts Code 6188',
    description: 'Numeric separators are not allowed here.',
  },
  {
    slug: 'ts-code-6189',
    title: 'Ts Code 6189',
    description: 'Multiple consecutive numeric separators are not permitted.',
  },
  {
    slug: 'ts-code-6192',
    title: 'Ts Code 6192',
    description: 'All imports in import declaration are unused.',
  },
  {
    slug: 'ts-code-6196',
    title: 'Ts Code 6196',
    description: "'{0}' is declared but never used.",
  },
  {
    slug: 'ts-code-6198',
    title: 'Ts Code 6198',
    description: 'All destructured elements are unused.',
  },
  {
    slug: 'ts-code-6199',
    title: 'Ts Code 6199',
    description: 'All variables are unused.',
  },
  {
    slug: 'ts-code-6200',
    title: 'Ts Code 6200',
    description:
      'Definitions of the following identifiers conflict with those in another file: {0}',
  },
  {
    slug: 'ts-code-6202',
    title: 'Ts Code 6202',
    description:
      'Project references may not form a circular graph. Cycle detected: {0}',
  },
  {
    slug: 'ts-code-6205',
    title: 'Ts Code 6205',
    description: 'All type parameters are unused.',
  },
  {
    slug: 'ts-code-6229',
    title: 'Ts Code 6229',
    description:
      "Tag '{0}' expects at least '{1}' arguments, but the JSX factory '{2}' provides at most '{3}'.",
  },
  {
    slug: 'ts-code-6230',
    title: 'Ts Code 6230',
    description:
      "Option '{0}' can only be specified in 'tsconfig.json' file or set to 'false' or 'null' on command line.",
  },
  {
    slug: 'ts-code-6231',
    title: 'Ts Code 6231',
    description: "Could not resolve the path '{0}' with the extensions: {1}.",
  },
  {
    slug: 'ts-code-6232',
    title: 'Ts Code 6232',
    description:
      'Declaration augments declaration in another file. This cannot be serialized.',
  },
  {
    slug: 'ts-code-6233',
    title: 'Ts Code 6233',
    description:
      'This is the declaration being augmented. Consider moving the augmenting declaration into the same file.',
  },
  {
    slug: 'ts-code-6234',
    title: 'Ts Code 6234',
    description:
      "This expression is not callable because it is a 'get' accessor. Did you mean to use it without '()'?",
  },
  {
    slug: 'ts-code-6236',
    title: 'Ts Code 6236',
    description: "Arguments for the rest parameter '{0}' were not provided.",
  },
  {
    slug: 'ts-code-6238',
    title: 'Ts Code 6238',
    description:
      "Specify the module specifier to be used to import the 'jsx' and 'jsxs' factory functions from. eg, react",
  },
  {
    slug: 'ts-code-6258',
    title: 'Ts Code 6258',
    description:
      "'{0}' should be set inside the 'compilerOptions' object of the config json file",
  },
  {
    slug: 'ts-code-6263',
    title: 'Ts Code 6263',
    description:
      "Module '{0}' was resolved to '{1}', but '--allowArbitraryExtensions' is not set.",
  },
  {
    slug: 'ts-code-6266',
    title: 'Ts Code 6266',
    description: "Option '{0}' can only be specified on command line.",
  },
  {
    slug: 'ts-code-6304',
    title: 'Ts Code 6304',
    description: 'Composite projects may not disable declaration emit.',
  },
  {
    slug: 'ts-code-6305',
    title: 'Ts Code 6305',
    description: "Output file '{0}' has not been built from source file '{1}'.",
  },
  {
    slug: 'ts-code-6306',
    title: 'Ts Code 6306',
    description:
      'Referenced project \'{0}\' must have setting "composite": true.',
  },
  {
    slug: 'ts-code-6307',
    title: 'Ts Code 6307',
    description:
      "File '{0}' is not listed within the file list of project '{1}'. Projects must list all files or use an 'include' pattern.",
  },
  {
    slug: 'ts-code-6310',
    title: 'Ts Code 6310',
    description: "Referenced project '{0}' may not disable emit.",
  },
  {
    slug: 'ts-code-6369',
    title: 'Ts Code 6369',
    description: "Option '--build' must be the first command line argument.",
  },
  {
    slug: 'ts-code-6370',
    title: 'Ts Code 6370',
    description: "Options '{0}' and '{1}' cannot be combined.",
  },
  {
    slug: 'ts-code-6377',
    title: 'Ts Code 6377',
    description:
      "Cannot write file '{0}' because it will overwrite '.tsbuildinfo' file generated by referenced project '{1}'",
  },
  {
    slug: 'ts-code-6379',
    title: 'Ts Code 6379',
    description: 'Composite projects may not disable incremental compilation.',
  },
  {
    slug: 'ts-code-6504',
    title: 'Ts Code 6504',
    description:
      "File '{0}' is a JavaScript file. Did you mean to enable the 'allowJs' option?",
  },
  {
    slug: 'ts-code-6807',
    title: 'Ts Code 6807',
    description:
      'This operation can be simplified. This shift is identical to `{0} {1} {2}`.',
  },
  {
    slug: 'ts-code-6931',
    title: 'Ts Code 6931',
    description:
      'List of file name suffixes to search when resolving a module.',
  },
  {
    slug: 'ts-code-7005',
    title: 'Ts Code 7005',
    description: "Variable '{0}' implicitly has an '{1}' type.",
  },
  {
    slug: 'no-implicit-any',
    title: 'No Implicit Any',
    description: "Parameter '{0}' implicitly has an '{1}' type.",
  },
  {
    slug: 'ts-code-7008',
    title: 'Ts Code 7008',
    description: "Member '{0}' implicitly has an '{1}' type.",
  },
  {
    slug: 'ts-code-7009',
    title: 'Ts Code 7009',
    description:
      "'new' expression, whose target lacks a construct signature, implicitly has an 'any' type.",
  },
  {
    slug: 'ts-code-7010',
    title: 'Ts Code 7010',
    description:
      "'{0}', which lacks return-type annotation, implicitly has an '{1}' return type.",
  },
  {
    slug: 'ts-code-7011',
    title: 'Ts Code 7011',
    description:
      "Function expression, which lacks return-type annotation, implicitly has an '{0}' return type.",
  },
  {
    slug: 'ts-code-7012',
    title: 'Ts Code 7012',
    description:
      "This overload implicitly returns the type '{0}' because it lacks a return type annotation.",
  },
  {
    slug: 'ts-code-7013',
    title: 'Ts Code 7013',
    description:
      "Construct signature, which lacks return-type annotation, implicitly has an 'any' return type.",
  },
  {
    slug: 'ts-code-7014',
    title: 'Ts Code 7014',
    description:
      "Function type, which lacks return-type annotation, implicitly has an '{0}' return type.",
  },
  {
    slug: 'ts-code-7015',
    title: 'Ts Code 7015',
    description:
      "Element implicitly has an 'any' type because index expression is not of type 'number'.",
  },
  {
    slug: 'ts-code-7016',
    title: 'Ts Code 7016',
    description:
      "Could not find a declaration file for module '{0}'. '{1}' implicitly has an 'any' type.",
  },
  {
    slug: 'ts-code-7017',
    title: 'Ts Code 7017',
    description:
      "Element implicitly has an 'any' type because type '{0}' has no index signature.",
  },
  {
    slug: 'ts-code-7018',
    title: 'Ts Code 7018',
    description:
      "Object literal's property '{0}' implicitly has an '{1}' type.",
  },
  {
    slug: 'ts-code-7019',
    title: 'Ts Code 7019',
    description: "Rest parameter '{0}' implicitly has an 'any[]' type.",
  },
  {
    slug: 'ts-code-7020',
    title: 'Ts Code 7020',
    description:
      "Call signature, which lacks return-type annotation, implicitly has an 'any' return type.",
  },
  {
    slug: 'ts-code-7022',
    title: 'Ts Code 7022',
    description:
      "'{0}' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.",
  },
  {
    slug: 'ts-code-7023',
    title: 'Ts Code 7023',
    description:
      "'{0}' implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.",
  },
  {
    slug: 'ts-code-7024',
    title: 'Ts Code 7024',
    description:
      "Function implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.",
  },
  {
    slug: 'ts-code-7025',
    title: 'Ts Code 7025',
    description:
      "Generator implicitly has yield type '{0}'. Consider supplying a return type annotation.",
  },
  {
    slug: 'ts-code-7026',
    title: 'Ts Code 7026',
    description:
      "JSX element implicitly has type 'any' because no interface 'JSX.{0}' exists.",
  },
  {
    slug: 'ts-code-7027',
    title: 'Ts Code 7027',
    description: 'Unreachable code detected.',
  },
  {
    slug: 'ts-code-7028',
    title: 'Ts Code 7028',
    description: 'Unused label.',
  },
  {
    slug: 'ts-code-7029',
    title: 'Ts Code 7029',
    description: 'Fallthrough case in switch.',
  },
  {
    slug: 'ts-code-7030',
    title: 'Ts Code 7030',
    description: 'Not all code paths return a value.',
  },
  {
    slug: 'strict-bind-call-apply',
    title: 'Strict Bind Call Apply',
    description: "Binding element '{0}' implicitly has an '{1}' type.",
  },
  {
    slug: 'ts-code-7032',
    title: 'Ts Code 7032',
    description:
      "Property '{0}' implicitly has type 'any', because its set accessor lacks a parameter type annotation.",
  },
  {
    slug: 'ts-code-7033',
    title: 'Ts Code 7033',
    description:
      "Property '{0}' implicitly has type 'any', because its get accessor lacks a return type annotation.",
  },
  {
    slug: 'ts-code-7034',
    title: 'Ts Code 7034',
    description:
      "Variable '{0}' implicitly has type '{1}' in some locations where its type cannot be determined.",
  },
  {
    slug: 'ts-code-7035',
    title: 'Ts Code 7035',
    description:
      "Try `npm i --save-dev @types/{1}` if it exists or add a new declaration (.d.ts) file containing `declare module '{0}';`",
  },
  {
    slug: 'ts-code-7036',
    title: 'Ts Code 7036',
    description:
      "Dynamic import's specifier must be of type 'string', but here has type '{0}'.",
  },
  {
    slug: 'ts-code-7039',
    title: 'Ts Code 7039',
    description: "Mapped object type implicitly has an 'any' template type.",
  },
  {
    slug: 'ts-code-7040',
    title: 'Ts Code 7040',
    description:
      "If the '{0}' package actually exposes this module, consider sending a pull request to amend 'https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/{1}'",
  },
  {
    slug: 'ts-code-7041',
    title: 'Ts Code 7041',
    description:
      "The containing arrow function captures the global value of 'this'.",
  },
  {
    slug: 'ts-code-7042',
    title: 'Ts Code 7042',
    description:
      "Module '{0}' was resolved to '{1}', but '--resolveJsonModule' is not used.",
  },
  {
    slug: 'ts-code-7051',
    title: 'Ts Code 7051',
    description: "Parameter has a name but no type. Did you mean '{0}: {1}'?",
  },
  {
    slug: 'ts-code-7052',
    title: 'Ts Code 7052',
    description:
      "Element implicitly has an 'any' type because type '{0}' has no index signature. Did you mean to call '{1}'?",
  },
  {
    slug: 'ts-code-7053',
    title: 'Ts Code 7053',
    description:
      "Element implicitly has an 'any' type because expression of type '{0}' can't be used to index type '{1}'.",
  },
  {
    slug: 'ts-code-7054',
    title: 'Ts Code 7054',
    description:
      "No index signature with a parameter of type '{0}' was found on type '{1}'.",
  },
  {
    slug: 'ts-code-7055',
    title: 'Ts Code 7055',
    description:
      "'{0}', which lacks return-type annotation, implicitly has an '{1}' yield type.",
  },
  {
    slug: 'ts-code-7056',
    title: 'Ts Code 7056',
    description:
      'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.',
  },
  {
    slug: 'ts-code-7057',
    title: 'Ts Code 7057',
    description:
      "'yield' expression implicitly results in an 'any' type because its containing generator lacks a return-type annotation.",
  },
  {
    slug: 'ts-code-7058',
    title: 'Ts Code 7058',
    description:
      "If the '{0}' package actually exposes this module, try adding a new declaration (.d.ts) file containing `declare module '{1}';`",
  },
  {
    slug: 'ts-code-7059',
    title: 'Ts Code 7059',
    description:
      'This syntax is reserved in files with the .mts or .cts extension. Use an `as` expression instead.',
  },
  {
    slug: 'ts-code-7060',
    title: 'Ts Code 7060',
    description:
      'This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma or explicit constraint.',
  },
  {
    slug: 'ts-code-7061',
    title: 'Ts Code 7061',
    description: 'A mapped type may not declare properties or methods.',
  },
  {
    slug: 'ts-code-8000',
    title: 'Ts Code 8000',
    description: 'You cannot rename this element.',
  },
  {
    slug: 'ts-code-8001',
    title: 'Ts Code 8001',
    description:
      'You cannot rename elements that are defined in the standard TypeScript library.',
  },
  {
    slug: 'ts-code-8002',
    title: 'Ts Code 8002',
    description: "'import ... =' can only be used in TypeScript files.",
  },
  {
    slug: 'ts-code-8003',
    title: 'Ts Code 8003',
    description: "'export =' can only be used in TypeScript files.",
  },
  {
    slug: 'ts-code-8004',
    title: 'Ts Code 8004',
    description:
      'Type parameter declarations can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8005',
    title: 'Ts Code 8005',
    description: "'implements' clauses can only be used in TypeScript files.",
  },
  {
    slug: 'ts-code-8006',
    title: 'Ts Code 8006',
    description: "'{0}' declarations can only be used in TypeScript files.",
  },
  {
    slug: 'ts-code-8008',
    title: 'Ts Code 8008',
    description: 'Type aliases can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8009',
    title: 'Ts Code 8009',
    description: "The '{0}' modifier can only be used in TypeScript files.",
  },
  {
    slug: 'ts-code-8010',
    title: 'Ts Code 8010',
    description: 'Type annotations can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8011',
    title: 'Ts Code 8011',
    description: 'Type arguments can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8012',
    title: 'Ts Code 8012',
    description: 'Parameter modifiers can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8013',
    title: 'Ts Code 8013',
    description: 'Non-null assertions can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8016',
    title: 'Ts Code 8016',
    description:
      'Type assertion expressions can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8017',
    title: 'Ts Code 8017',
    description: 'Signature declarations can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8020',
    title: 'Ts Code 8020',
    description: 'JSDoc types can only be used inside documentation comments.',
  },
  {
    slug: 'ts-code-8021',
    title: 'Ts Code 8021',
    description:
      "JSDoc '@typedef' tag should either have a type annotation or be followed by '@property' or '@member' tags.",
  },
  {
    slug: 'ts-code-8022',
    title: 'Ts Code 8022',
    description: "JSDoc '@{0}' is not attached to a class.",
  },
  {
    slug: 'ts-code-8023',
    title: 'Ts Code 8023',
    description: "JSDoc '@{0} {1}' does not match the 'extends {2}' clause.",
  },
  {
    slug: 'ts-code-8024',
    title: 'Ts Code 8024',
    description:
      "JSDoc '@param' tag has name '{0}', but there is no parameter with that name.",
  },
  {
    slug: 'ts-code-8025',
    title: 'Ts Code 8025',
    description:
      "Class declarations cannot have more than one '@augments' or '@extends' tag.",
  },
  {
    slug: 'ts-code-8026',
    title: 'Ts Code 8026',
    description:
      "Expected {0} type arguments; provide these with an '@extends' tag.",
  },
  {
    slug: 'ts-code-8027',
    title: 'Ts Code 8027',
    description:
      "Expected {0}-{1} type arguments; provide these with an '@extends' tag.",
  },
  {
    slug: 'ts-code-8028',
    title: 'Ts Code 8028',
    description:
      "JSDoc '...' may only appear in the last parameter of a signature.",
  },
  {
    slug: 'ts-code-8029',
    title: 'Ts Code 8029',
    description:
      "JSDoc '@param' tag has name '{0}', but there is no parameter with that name. It would match 'arguments' if it had an array type.",
  },
  {
    slug: 'ts-code-8030',
    title: 'Ts Code 8030',
    description:
      "The type of a function declaration must match the function's signature.",
  },
  {
    slug: 'ts-code-8031',
    title: 'Ts Code 8031',
    description: 'You cannot rename a module via a global import.',
  },
  {
    slug: 'ts-code-8032',
    title: 'Ts Code 8032',
    description:
      "Qualified name '{0}' is not allowed without a leading '@param {object} {1}'.",
  },
  {
    slug: 'ts-code-8033',
    title: 'Ts Code 8033',
    description:
      "A JSDoc '@typedef' comment may not contain multiple '@type' tags.",
  },
  {
    slug: 'ts-code-8034',
    title: 'Ts Code 8034',
    description: 'The tag was first specified here.',
  },
  {
    slug: 'ts-code-8035',
    title: 'Ts Code 8035',
    description:
      "You cannot rename elements that are defined in a 'node_modules' folder.",
  },
  {
    slug: 'ts-code-8036',
    title: 'Ts Code 8036',
    description:
      "You cannot rename elements that are defined in another 'node_modules' folder.",
  },
  {
    slug: 'ts-code-8037',
    title: 'Ts Code 8037',
    description:
      'Type satisfaction expressions can only be used in TypeScript files.',
  },
  {
    slug: 'ts-code-8038',
    title: 'Ts Code 8038',
    description:
      "Decorators may not appear after 'export' or 'export default' if they also appear before 'export'.",
  },
  {
    slug: 'ts-code-8039',
    title: 'Ts Code 8039',
    description:
      "A JSDoc '@template' tag may not follow a '@typedef', '@callback', or '@overload' tag",
  },
  {
    slug: 'ts-code-9005',
    title: 'Ts Code 9005',
    description:
      "Declaration emit for this file requires using private name '{0}'. An explicit type annotation may unblock declaration emit.",
  },
  {
    slug: 'ts-code-9006',
    title: 'Ts Code 9006',
    description:
      "Declaration emit for this file requires using private name '{0}' from module '{1}'. An explicit type annotation may unblock declaration emit.",
  },
  {
    slug: 'ts-code-9007',
    title: 'Ts Code 9007',
    description:
      'Function must have an explicit return type annotation with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9008',
    title: 'Ts Code 9008',
    description:
      'Method must have an explicit return type annotation with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9009',
    title: 'Ts Code 9009',
    description:
      'At least one accessor must have an explicit type annotation with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9010',
    title: 'Ts Code 9010',
    description:
      'Variable must have an explicit type annotation with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9011',
    title: 'Ts Code 9011',
    description:
      'Parameter must have an explicit type annotation with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9012',
    title: 'Ts Code 9012',
    description:
      'Property must have an explicit type annotation with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9013',
    title: 'Ts Code 9013',
    description:
      "Expression type can't be inferred with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9014',
    title: 'Ts Code 9014',
    description:
      'Computed properties must be number or string literals, variables or dotted expressions with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9015',
    title: 'Ts Code 9015',
    description:
      "Objects that contain spread assignments can't be inferred with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9016',
    title: 'Ts Code 9016',
    description:
      "Objects that contain shorthand properties can't be inferred with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9017',
    title: 'Ts Code 9017',
    description:
      'Only const arrays can be inferred with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9018',
    title: 'Ts Code 9018',
    description:
      "Arrays with spread elements can't inferred with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9019',
    title: 'Ts Code 9019',
    description:
      "Binding elements can't be exported directly with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9020',
    title: 'Ts Code 9020',
    description:
      'Enum member initializers must be computable without references to external symbols with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9021',
    title: 'Ts Code 9021',
    description:
      "Extends clause can't contain an expression with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9022',
    title: 'Ts Code 9022',
    description:
      'Inference from class expressions is not supported with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9023',
    title: 'Ts Code 9023',
    description:
      'Assigning properties to functions without declaring them is not supported with --isolatedDeclarations. Add an explicit declaration for the properties assigned to this function.',
  },
  {
    slug: 'ts-code-9025',
    title: 'Ts Code 9025',
    description:
      'Declaration emit for this parameter requires implicitly adding undefined to its type. This is not supported with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9026',
    title: 'Ts Code 9026',
    description:
      'Declaration emit for this file requires preserving this import for augmentations. This is not supported with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9027',
    title: 'Ts Code 9027',
    description: 'Add a type annotation to the variable {0}.',
  },
  {
    slug: 'ts-code-9028',
    title: 'Ts Code 9028',
    description: 'Add a type annotation to the parameter {0}.',
  },
  {
    slug: 'ts-code-9029',
    title: 'Ts Code 9029',
    description: 'Add a type annotation to the property {0}.',
  },
  {
    slug: 'ts-code-9030',
    title: 'Ts Code 9030',
    description: 'Add a return type to the function expression.',
  },
  {
    slug: 'ts-code-9031',
    title: 'Ts Code 9031',
    description: 'Add a return type to the function declaration.',
  },
  {
    slug: 'ts-code-9032',
    title: 'Ts Code 9032',
    description: 'Add a return type to the get accessor declaration.',
  },
  {
    slug: 'ts-code-9033',
    title: 'Ts Code 9033',
    description: 'Add a type to parameter of the set accessor declaration.',
  },
  {
    slug: 'ts-code-9034',
    title: 'Ts Code 9034',
    description: 'Add a return type to the method',
  },
  {
    slug: 'ts-code-9035',
    title: 'Ts Code 9035',
    description:
      'Add satisfies and a type assertion to this expression (satisfies T as T) to make the type explicit.',
  },
  {
    slug: 'ts-code-9036',
    title: 'Ts Code 9036',
    description:
      'Move the expression in default export to a variable and add a type annotation to it.',
  },
  {
    slug: 'ts-code-9037',
    title: 'Ts Code 9037',
    description:
      "Default exports can't be inferred with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-9038',
    title: 'Ts Code 9038',
    description:
      'Computed property names on class or object literals cannot be inferred with --isolatedDeclarations.',
  },
  {
    slug: 'ts-code-9039',
    title: 'Ts Code 9039',
    description:
      "Type containing private name '{0}' can't be used with --isolatedDeclarations.",
  },
  {
    slug: 'ts-code-17000',
    title: 'Ts Code 17000',
    description:
      "JSX attributes must only be assigned a non-empty 'expression'.",
  },
  {
    slug: 'ts-code-17001',
    title: 'Ts Code 17001',
    description:
      'JSX elements cannot have multiple attributes with the same name.',
  },
  {
    slug: 'ts-code-17002',
    title: 'Ts Code 17002',
    description: "Expected corresponding JSX closing tag for '{0}'.",
  },
  {
    slug: 'ts-code-17004',
    title: 'Ts Code 17004',
    description: "Cannot use JSX unless the '--jsx' flag is provided.",
  },
  {
    slug: 'ts-code-17005',
    title: 'Ts Code 17005',
    description:
      "A constructor cannot contain a 'super' call when its class extends 'null'.",
  },
  {
    slug: 'ts-code-17006',
    title: 'Ts Code 17006',
    description:
      "An unary expression with the '{0}' operator is not allowed in the left-hand side of an exponentiation expression. Consider enclosing the expression in parentheses.",
  },
  {
    slug: 'ts-code-17007',
    title: 'Ts Code 17007',
    description:
      'A type assertion expression is not allowed in the left-hand side of an exponentiation expression. Consider enclosing the expression in parentheses.',
  },
  {
    slug: 'ts-code-17008',
    title: 'Ts Code 17008',
    description: "JSX element '{0}' has no corresponding closing tag.",
  },
  {
    slug: 'ts-code-17009',
    title: 'Ts Code 17009',
    description:
      "'super' must be called before accessing 'this' in the constructor of a derived class.",
  },
  {
    slug: 'ts-code-17010',
    title: 'Ts Code 17010',
    description: "Unknown type acquisition option '{0}'.",
  },
  {
    slug: 'ts-code-17011',
    title: 'Ts Code 17011',
    description:
      "'super' must be called before accessing a property of 'super' in the constructor of a derived class.",
  },
  {
    slug: 'ts-code-17012',
    title: 'Ts Code 17012',
    description:
      "'{0}' is not a valid meta-property for keyword '{1}'. Did you mean '{2}'?",
  },
  {
    slug: 'ts-code-17013',
    title: 'Ts Code 17013',
    description:
      "Meta-property '{0}' is only allowed in the body of a function declaration, function expression, or constructor.",
  },
  {
    slug: 'ts-code-17014',
    title: 'Ts Code 17014',
    description: 'JSX fragment has no corresponding closing tag.',
  },
  {
    slug: 'ts-code-17015',
    title: 'Ts Code 17015',
    description: 'Expected corresponding closing tag for JSX fragment.',
  },
  {
    slug: 'ts-code-17016',
    title: 'Ts Code 17016',
    description:
      "The 'jsxFragmentFactory' compiler option must be provided to use JSX fragments with the 'jsxFactory' compiler option.",
  },
  {
    slug: 'ts-code-17017',
    title: 'Ts Code 17017',
    description:
      'An @jsxFrag pragma is required when using an @jsx pragma with JSX fragments.',
  },
  {
    slug: 'ts-code-17018',
    title: 'Ts Code 17018',
    description: "Unknown type acquisition option '{0}'. Did you mean '{1}'?",
  },
  {
    slug: 'ts-code-17019',
    title: 'Ts Code 17019',
    description:
      "'{0}' at the end of a type is not valid TypeScript syntax. Did you mean to write '{1}'?",
  },
  {
    slug: 'ts-code-17020',
    title: 'Ts Code 17020',
    description:
      "'{0}' at the start of a type is not valid TypeScript syntax. Did you mean to write '{1}'?",
  },
  {
    slug: 'ts-code-17021',
    title: 'Ts Code 17021',
    description: 'Unicode escape sequence cannot appear here.',
  },
  {
    slug: 'ts-code-18000',
    title: 'Ts Code 18000',
    description: 'Circularity detected while resolving configuration: {0}',
  },
  {
    slug: 'ts-code-18002',
    title: 'Ts Code 18002',
    description: "The 'files' list in config file '{0}' is empty.",
  },
  {
    slug: 'ts-code-18003',
    title: 'Ts Code 18003',
    description:
      "No inputs were found in config file '{0}'. Specified 'include' paths were '{1}' and 'exclude' paths were '{2}'.",
  },
  {
    slug: 'ts-code-18004',
    title: 'Ts Code 18004',
    description:
      "No value exists in scope for the shorthand property '{0}'. Either declare one or provide an initializer.",
  },
  {
    slug: 'ts-code-18006',
    title: 'Ts Code 18006',
    description: "Classes may not have a field named 'constructor'.",
  },
  {
    slug: 'ts-code-18007',
    title: 'Ts Code 18007',
    description:
      'JSX expressions may not use the comma operator. Did you mean to write an array?',
  },
  {
    slug: 'ts-code-18009',
    title: 'Ts Code 18009',
    description: 'Private identifiers cannot be used as parameters.',
  },
  {
    slug: 'ts-code-18010',
    title: 'Ts Code 18010',
    description:
      'An accessibility modifier cannot be used with a private identifier.',
  },
  {
    slug: 'ts-code-18011',
    title: 'Ts Code 18011',
    description:
      "The operand of a 'delete' operator cannot be a private identifier.",
  },
  {
    slug: 'ts-code-18012',
    title: 'Ts Code 18012',
    description: "'#constructor' is a reserved word.",
  },
  {
    slug: 'ts-code-18013',
    title: 'Ts Code 18013',
    description:
      "Property '{0}' is not accessible outside class '{1}' because it has a private identifier.",
  },
  {
    slug: 'ts-code-18014',
    title: 'Ts Code 18014',
    description:
      "The property '{0}' cannot be accessed on type '{1}' within this class because it is shadowed by another private identifier with the same spelling.",
  },
  {
    slug: 'ts-code-18015',
    title: 'Ts Code 18015',
    description:
      "Property '{0}' in type '{1}' refers to a different member that cannot be accessed from within type '{2}'.",
  },
  {
    slug: 'ts-code-18016',
    title: 'Ts Code 18016',
    description: 'Private identifiers are not allowed outside class bodies.',
  },
  {
    slug: 'ts-code-18017',
    title: 'Ts Code 18017',
    description: "The shadowing declaration of '{0}' is defined here",
  },
  {
    slug: 'ts-code-18018',
    title: 'Ts Code 18018',
    description:
      "The declaration of '{0}' that you probably intended to use is defined here",
  },
  {
    slug: 'ts-code-18019',
    title: 'Ts Code 18019',
    description: "'{0}' modifier cannot be used with a private identifier.",
  },
  {
    slug: 'ts-code-18024',
    title: 'Ts Code 18024',
    description: 'An enum member cannot be named with a private identifier.',
  },
  {
    slug: 'ts-code-18026',
    title: 'Ts Code 18026',
    description: "'#!' can only be used at the start of a file.",
  },
  {
    slug: 'ts-code-18027',
    title: 'Ts Code 18027',
    description:
      "Compiler reserves name '{0}' when emitting private identifier downlevel.",
  },
  {
    slug: 'ts-code-18028',
    title: 'Ts Code 18028',
    description:
      'Private identifiers are only available when targeting ECMAScript 2015 and higher.',
  },
  {
    slug: 'ts-code-18029',
    title: 'Ts Code 18029',
    description:
      'Private identifiers are not allowed in variable declarations.',
  },
  {
    slug: 'ts-code-18030',
    title: 'Ts Code 18030',
    description: 'An optional chain cannot contain private identifiers.',
  },
  {
    slug: 'ts-code-18031',
    title: 'Ts Code 18031',
    description:
      "The intersection '{0}' was reduced to 'never' because property '{1}' has conflicting types in some constituents.",
  },
  {
    slug: 'ts-code-18032',
    title: 'Ts Code 18032',
    description:
      "The intersection '{0}' was reduced to 'never' because property '{1}' exists in multiple constituents and is private in some.",
  },
  {
    slug: 'ts-code-18033',
    title: 'Ts Code 18033',
    description:
      "Type '{0}' is not assignable to type '{1}' as required for computed enum member values.",
  },
  {
    slug: 'ts-code-18035',
    title: 'Ts Code 18035',
    description:
      "Invalid value for 'jsxFragmentFactory'. '{0}' is not a valid identifier or qualified-name.",
  },
  {
    slug: 'ts-code-18036',
    title: 'Ts Code 18036',
    description:
      "Class decorators can't be used with static private identifier. Consider removing the experimental decorator.",
  },
  {
    slug: 'ts-code-18037',
    title: 'Ts Code 18037',
    description:
      "'await' expression cannot be used inside a class static block.",
  },
  {
    slug: 'ts-code-18038',
    title: 'Ts Code 18038',
    description:
      "'for await' loops cannot be used inside a class static block.",
  },
  {
    slug: 'ts-code-18039',
    title: 'Ts Code 18039',
    description:
      "Invalid use of '{0}'. It cannot be used inside a class static block.",
  },
  {
    slug: 'ts-code-18041',
    title: 'Ts Code 18041',
    description:
      "A 'return' statement cannot be used inside a class static block.",
  },
  {
    slug: 'ts-code-18042',
    title: 'Ts Code 18042',
    description:
      "'{0}' is a type and cannot be imported in JavaScript files. Use '{1}' in a JSDoc type annotation.",
  },
  {
    slug: 'ts-code-18043',
    title: 'Ts Code 18043',
    description:
      'Types cannot appear in export declarations in JavaScript files.',
  },
  {
    slug: 'ts-code-18045',
    title: 'Ts Code 18045',
    description:
      "Properties with the 'accessor' modifier are only available when targeting ECMAScript 2015 and higher.",
  },
  {
    slug: 'ts-code-18046',
    title: 'Ts Code 18046',
    description: "'{0}' is of type 'unknown'.",
  },
  {
    slug: 'ts-code-18047',
    title: 'Ts Code 18047',
    description: "'{0}' is possibly 'null'.",
  },
  {
    slug: 'ts-code-18048',
    title: 'Ts Code 18048',
    description: "'{0}' is possibly 'undefined'.",
  },
  {
    slug: 'ts-code-18049',
    title: 'Ts Code 18049',
    description: "'{0}' is possibly 'null' or 'undefined'.",
  },
  {
    slug: 'ts-code-18050',
    title: 'Ts Code 18050',
    description: "The value '{0}' cannot be used here.",
  },
  {
    slug: 'ts-code-18051',
    title: 'Ts Code 18051',
    description: "Compiler option '{0}' cannot be given an empty string.",
  },
  {
    slug: 'ts-code-18053',
    title: 'Ts Code 18053',
    description: "Its type '{0}' is not a valid JSX element type.",
  },
  {
    slug: 'ts-code-18054',
    title: 'Ts Code 18054',
    description:
      "'await using' statements cannot be used inside a class static block.",
  },
  {
    slug: 'ts-code-18055',
    title: 'Ts Code 18055',
    description:
      "'{0}' has a string type, but must have syntactically recognizable string syntax when 'isolatedModules' is enabled.",
  },
  {
    slug: 'ts-code-18056',
    title: 'Ts Code 18056',
    description:
      "Enum member following a non-literal numeric member must have an initializer when 'isolatedModules' is enabled.",
  },
  {
    slug: 'ts-code-18057',
    title: 'Ts Code 18057',
    description:
      "String literal import and export names are not supported when the '--module' flag is set to 'es2015' or 'es2020'.",
  },
] as const satisfies Audit[];
/* eslint-enable max-lines */
