import { Project } from 'ts-morph';
import type { UndocumentedItem } from '../models.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable functional/immutable-data */
/* eslint-disable @typescript-eslint/max-params */
/* eslint-disable functional/no-let */

export function processDocCoverage(toInclude: string): {
  undocumentedItems: UndocumentedItem[];
  coverage: number;
} {
  const project = new Project();
  project.addSourceFilesAtPaths(toInclude);

  let itsDocumented = 0;
  const undocumentedItems: UndocumentedItem[] = [];

  project.getSourceFiles().forEach(sourceFile => {
    if (isTestFile(sourceFile.getFilePath())) {
      return;
    }

    processClassDeclarations(
      sourceFile,
      undocumentedItems,
      count => (itsDocumented += count),
    );
    processDeclarations(
      sourceFile,
      undocumentedItems,
      count => (itsDocumented += count),
    );
  });

  return calculateCoverage(undocumentedItems, itsDocumented);
}

function isTestFile(filePath: string): boolean {
  return filePath.includes('.spec.') || filePath.includes('.test.');
}

function addUndocumentedItem(
  file: string,
  type: string,
  name: string,
  line: number,
): UndocumentedItem {
  return {
    file,
    type,
    name,
    line,
  };
}

function processClassDeclarations(
  sourceFile: any,
  undocumentedItems: UndocumentedItem[],
  onDocumented: (count: number) => void,
): void {
  sourceFile.getClasses().forEach((classDeclaration: any) => {
    const className = classDeclaration.getName() || 'Anonymous Class';
    const filePath = sourceFile.getFilePath();

    // Process class itself
    if (classDeclaration.getJsDocs().length === 0) {
      undocumentedItems.push(
        addUndocumentedItem(
          filePath,
          'class',
          className,
          classDeclaration.getStartLineNumber(),
        ),
      );
    } else {
      onDocumented(1);
    }

    // Process properties
    classDeclaration.getProperties().forEach((property: any) => {
      if (property.getJsDocs().length === 0) {
        undocumentedItems.push(
          addUndocumentedItem(
            filePath,
            'property',
            property.getName(),
            property.getStartLineNumber(),
          ),
        );
      } else {
        onDocumented(1);
      }
    });

    // Process methods
    classDeclaration.getMethods().forEach((method: any) => {
      if (method.getJsDocs().length === 0) {
        undocumentedItems.push(
          addUndocumentedItem(
            filePath,
            'method',
            method.getName(),
            method.getStartLineNumber(),
          ),
        );
      } else {
        onDocumented(1);
      }
    });
  });
}

function processDeclarations(
  sourceFile: any,
  undocumentedItems: UndocumentedItem[],
  onDocumented: (count: number) => void,
): void {
  const filePath = sourceFile.getFilePath();

  // Process functions
  processItems(
    sourceFile.getFunctions(),
    'function',
    item => item.getName() || 'Anonymous Function',
    filePath,
    undocumentedItems,
    onDocumented,
  );

  // Process variables
  sourceFile.getVariableStatements().forEach((statement: any) => {
    statement.getDeclarations().forEach((declaration: any) => {
      if (statement.getJsDocs().length === 0) {
        undocumentedItems.push(
          addUndocumentedItem(
            filePath,
            'variable',
            declaration.getName(),
            declaration.getStartLineNumber(),
          ),
        );
      } else {
        onDocumented(1);
      }
    });
  });

  // Process interfaces and types
  processItems(
    sourceFile.getInterfaces(),
    'interface',
    item => item.getName(),
    filePath,
    undocumentedItems,
    onDocumented,
  );
  processItems(
    sourceFile.getTypeAliases(),
    'type',
    item => item.getName(),
    filePath,
    undocumentedItems,
    onDocumented,
  );
}

function processItems(
  items: any[],
  type: string,
  getName: (item: any) => string,
  filePath: string,
  undocumentedItems: UndocumentedItem[],
  onDocumented: (count: number) => void,
): void {
  items.forEach(item => {
    if (item.getJsDocs().length === 0) {
      undocumentedItems.push(
        addUndocumentedItem(
          filePath,
          type,
          getName(item),
          item.getStartLineNumber(),
        ),
      );
    } else {
      onDocumented(1);
    }
  });
}

function calculateCoverage(
  undocumentedItems: UndocumentedItem[],
  documented: number,
) {
  const coverage = (documented / (documented + undocumentedItems.length)) * 100;
  return { undocumentedItems, coverage };
}
