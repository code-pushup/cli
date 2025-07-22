import {
  extractConcreteSegments,
  extractPathSlice,
  findSegmentIndex,
  normalizePathForMatching,
  splitPathSegments,
} from './grouping-engine';

export function removeFileExtension(name: string): string {
  return name.replace(/\.(js|ts|jsx|tsx|css|scss|json)$/, '');
}

export function isGenericName(name: string): boolean {
  return name === 'index' || name === 'main' || name === '';
}

export function extractScopedPackage(
  path: string,
): { scope: string; package?: string } | null {
  const match = path.match(/@([^/]+)(?:\/([^/]+))?/);
  if (match) {
    return {
      scope: match[1]!,
      package: match[2],
    };
  }
  return null;
}

export function extractMeaningfulPathPart(path: string): string | null {
  const parts = splitPathSegments(path.replace(/^\.\//, ''));

  if (parts.length === 0) return null;

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    const withoutExt = removeFileExtension(lastPart);
    if (withoutExt && !isGenericName(withoutExt)) {
      return withoutExt;
    }
  }

  if (parts.length > 1) {
    const secondLast = parts[parts.length - 2];
    if (secondLast && !isGenericName(secondLast)) {
      return secondLast;
    }
  }

  return null;
}

export function cleanupGroupName(groupName: string): string {
  const scopedPackage = extractScopedPackage(groupName);
  if (scopedPackage) {
    return scopedPackage.package
      ? `@${scopedPackage.scope}/${scopedPackage.package}`
      : `@${scopedPackage.scope}`;
  }

  const segments = splitPathSegments(groupName);
  if (segments.length === 0) return groupName;

  // For scoped packages, try to extract the scope and package
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;

    // Handle scoped packages like @angular/router
    if (segment.startsWith('@') && i + 1 < segments.length) {
      const scopeName = segment.slice(1);
      const packageName = segments[i + 1];
      return packageName ? `@${scopeName}/${packageName}` : `@${scopeName}`;
    }
  }

  // Extract the last meaningful segment (the actual package/folder name)
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (!segment || isGenericName(segment)) continue;

    // Return the first meaningful segment we find from the end
    return segment;
  }

  const withoutExt = removeFileExtension(groupName);
  if (isGenericName(withoutExt)) {
    return groupName;
  }

  return withoutExt || groupName;
}

export function extractGroupKeyFromPattern(
  filePath: string,
  pattern: string,
  maxDepth?: number,
): string | null {
  const normalizedPath = normalizePathForMatching(filePath);
  const concreteSegments = extractConcreteSegments(pattern);

  if (concreteSegments.length === 0) {
    return extractMeaningfulPathPart(normalizedPath);
  }

  if (maxDepth && maxDepth > 0 && concreteSegments.length > 0) {
    const keyPart = concreteSegments[0]!;
    const keyIndex = findSegmentIndex(filePath, keyPart);

    if (keyIndex !== -1) {
      return extractPathSlice(filePath, keyIndex, maxDepth);
    }
  }

  for (const segment of concreteSegments) {
    const regex = new RegExp(`${segment}\/([^\/]+)`);
    const match = filePath.match(regex) || normalizedPath.match(regex);

    if (match?.[1]) {
      const extracted = match[1];
      const cleaned = removeFileExtension(extracted);
      if (cleaned && !isGenericName(cleaned)) {
        return cleaned;
      }
    }
  }

  return null;
}

export function deriveGroupTitle(
  path: string,
  patterns: readonly string[],
  fallbackTitle: string,
): string {
  for (const pattern of patterns) {
    const concreteSegments = extractConcreteSegments(pattern);

    if (concreteSegments.includes(fallbackTitle)) {
      return fallbackTitle;
    }

    const groupName = extractGroupKeyFromPattern(path, pattern);
    if (groupName) {
      return cleanupGroupName(groupName);
    }
  }

  return fallbackTitle;
}
