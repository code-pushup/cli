import type {
  BranchesDetails,
  FunctionsDetails,
  LCOVRecord,
  LinesDetails,
} from 'parse-lcov';

export function mergeLcovResults(records: LCOVRecord[]): LCOVRecord[] {
  // Skip if there are no files with multiple records
  const allFilenames = records.map(record => record.file);
  if (allFilenames.length === new Set(allFilenames).size) {
    return records;
  }

  return records.reduce<LCOVRecord[]>((accMerged, currRecord, currIndex) => {
    const filePath = currRecord.file;
    const lines = currRecord.lines.found;

    const duplicates = records.reduce<[LCOVRecord, number][]>(
      (acc, candidateRecord, candidateIndex) => {
        if (
          candidateRecord.file === filePath &&
          candidateRecord.lines.found === lines &&
          candidateIndex !== currIndex
        ) {
          return [...acc, [candidateRecord, candidateIndex]];
        }
        return acc;
      },
      [],
    );

    // This is not the first time the record has been identified as a duplicate
    if (
      duplicates.map(duplicate => duplicate[1]).some(index => index < currIndex)
    ) {
      return accMerged;
    }

    // Unique record
    if (duplicates.length === 0) {
      return [...accMerged, currRecord];
    }

    return [
      ...accMerged,
      mergeDuplicateLcovRecords([
        currRecord,
        ...duplicates.map(duplicate => duplicate[0]),
      ]),
    ];
  }, []);
}

export function mergeDuplicateLcovRecords(records: LCOVRecord[]): LCOVRecord {
  const linesDetails = mergeLcovLineDetails(
    records.map(record => record.lines.details),
  );
  const linesHit = linesDetails.reduce(
    (acc, line) => acc + (line.hit > 0 ? 1 : 0),
    0,
  );

  const branchesDetails = mergeLcovBranchesDetails(
    records.map(record => record.branches.details),
  );
  const branchesHit = branchesDetails.reduce(
    (acc, branch) => acc + (branch.taken > 0 ? 1 : 0),
    0,
  );

  const functionsDetails = mergeLcovFunctionsDetails(
    records.map(record => record.functions.details),
  );

  const functionsHit = functionsDetails.reduce(
    (acc, func) => acc + (func.hit != null && func.hit > 0 ? 1 : 0),
    0,
  );

  const mergedRecord: LCOVRecord = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    file: records[0]!.file,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    title: records[0]!.title,
    lines: {
      found: linesDetails.length,
      hit: linesHit,
      details: linesDetails,
    },
    branches: {
      found: branchesDetails.length,
      hit: branchesHit,
      details: branchesDetails,
    },
    functions: {
      found: functionsDetails.length,
      hit: functionsHit,
      details: functionsDetails,
    },
  };
  return mergedRecord;
}

export function mergeLcovLineDetails(
  details: LinesDetails[][],
): LinesDetails[] {
  const flatDetails = details.flat();

  const uniqueLines = [
    ...new Set(flatDetails.map(flatDetail => flatDetail.line)),
  ];

  return uniqueLines.map(line => {
    const hitSum = flatDetails
      .filter(lineDetail => lineDetail.line === line)
      .reduce((acc, lineDetail) => acc + lineDetail.hit, 0);

    return { line, hit: hitSum };
  });
}

export function mergeLcovBranchesDetails(
  details: BranchesDetails[][],
): BranchesDetails[] {
  const flatDetails = details.flat();

  const uniqueBranches = [
    ...new Set(
      flatDetails.map(({ line, block, branch }) =>
        JSON.stringify({ line, block, branch }),
      ),
    ),
  ].map(
    functionJSON =>
      JSON.parse(functionJSON) as Pick<
        BranchesDetails,
        'line' | 'block' | 'branch'
      >,
  );

  return uniqueBranches.map(({ line, block, branch }) => {
    const takenSum = flatDetails
      .filter(
        branchDetail =>
          branchDetail.line === line &&
          branchDetail.block === block &&
          branchDetail.branch === branch,
      )
      .reduce((acc, branchDetail) => acc + branchDetail.taken, 0);

    return { line, block, branch, taken: takenSum };
  });
}

export function mergeLcovFunctionsDetails(
  details: FunctionsDetails[][],
): FunctionsDetails[] {
  const flatDetails = details.flat();

  const uniqueFunctions = [
    ...new Set(
      flatDetails.map(({ line, name }) => JSON.stringify({ line, name })),
    ),
  ].map(
    functionJSON =>
      JSON.parse(functionJSON) as Pick<FunctionsDetails, 'line' | 'name'>,
  );

  return uniqueFunctions.map(({ line, name }) => {
    const hitSum = flatDetails
      .filter(
        functionDetail =>
          functionDetail.line === line && functionDetail.name === name,
      )
      .reduce((acc, functionDetail) => acc + (functionDetail.hit ?? 0), 0);

    return { line, name, hit: hitSum };
  });
}
