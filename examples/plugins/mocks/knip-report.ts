export const input = {
  "files": ["src/unused.ts"],
  "issues": [
    {
      "file": "package.json",
      "owners": ["@org/admin"],
      "dependencies": ["jquery", "moment"],
      "devDependencies": [],
      "unlisted": [{ "name": "react" }, { "name": "@org/unresolved" }],
      "exports": [],
      "types": [],
      "duplicates": []
    },
    {
      "file": "src/Registration.tsx",
      "owners": ["@org/owner"],
      "dependencies": [],
      "devDependencies": [],
      "binaries": [],
      "unresolved": [
        { "name": "./unresolved", "line": 8, "col": 23, "pos": 403 }
      ],
      "exports": [{ "name": "unusedExport", "line": 1, "col": 14, "pos": 13 }],
      "types": [
        { "name": "unusedEnum", "line": 3, "col": 13, "pos": 71 },
        { "name": "unusedType", "line": 8, "col": 14, "pos": 145 }
      ],
      "enumMembers": {
        "MyEnum": [
          { "name": "unusedMember", "line": 13, "col": 3, "pos": 167 },
          { "name": "unusedKey", "line": 15, "col": 3, "pos": 205 }
        ]
      },
      "classMembers": {
        "MyClass": [
          { "name": "unusedMember", "line": 40, "col": 3, "pos": 687 },
          { "name": "unusedSetter", "line": 61, "col": 14, "pos": 1071 }
        ]
      },
      "duplicates": ["Registration", "default"]
    }
  ]
}


const output = [
  {
    slug: 'unused-files',
    value: 1,
    displayValue: '1 unused files',
    score: 0,
    details: {
      issues: [
        {
          message: 'File "src/unused.ts" unused',
          severity: 'warning',
          source: {
            file: 'src/unused.ts'
          }
        }
      ]
    }
  },
  {
    slug: 'unlisted',
    value: 2,
    displayValue: '2 unlisted',
    score: 0,
    details: {
      issues: [
        {
          message: 'react',
          severity: 'warning',
          source: {
            file: '???'
          }
        },
        {
          message: '@org/unresolved',
          severity: 'warning',
          source: {
            file: '???'
          }
        }
      ]
    }
  },
  {
    slug: 'dependencies',
    value: 2,
    displayValue: '2 dependencies',
    score: 0,
    details: {
      issues: [
        {
          message: 'jquery',
          severity: 'warning',
          source: {
            file: 'package.json'
          }
        },
        {
          message: 'moment',
          severity: 'warning',
          source: {
            file: 'package.json'
          }
        }
      ]
    }
  },
  {
    slug: 'unresolved',
    value: 2,
    displayValue: '2 unresolved',
    score: 0,
    details: {
      issues: [
        {
          message: 'jquery',
          severity: 'warning',
          source: {
            file: 'src/Registration.tsx',
            position: {
              startLine: 8,
              startColumn: 23
            }
          }
        }
      ]
    }
  }
]
