import {
  BUILD_EMIT_OPTIONS,
  CONTROL_FLOW_OPTIONS,
  INTEROP_CONSTRAINTS,
  LANGUAGE_ENVIRONMENT_OPTIONS,
  MODULE_RESOLUTION,
  PROJECT_REFERENCES,
  STRICT_CHECKS,
  TYPE_CHECKING_BEHAVIOR,
  WATCH_OPTIONS
} from './runner/ts-error-codes.js';
import type {Audit, Group} from "@code-pushup/models";
import {formatTitle, kebabCaseToCamelCase} from "./utils.js";

export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';

export const AUDITS = [
  STRICT_CHECKS, BUILD_EMIT_OPTIONS,
  CONTROL_FLOW_OPTIONS, TYPE_CHECKING_BEHAVIOR,
  MODULE_RESOLUTION, PROJECT_REFERENCES,
  WATCH_OPTIONS, INTEROP_CONSTRAINTS, LANGUAGE_ENVIRONMENT_OPTIONS
].flatMap(i => Object.entries(i)).reduce<Audit[]>(
  (audits, [slug]) => {
    const anchorText = kebabCaseToCamelCase(slug);
    const title = formatTitle(slug);
    return [
      ...audits,
      {
        slug,
        title,
        docsUrl: `https://www.typescriptlang.org/tsconfig/#${anchorText}`
      }];
  }, []);

export const GROUPS: Group[] = Object.entries({
  'strict-checks': Object.keys(STRICT_CHECKS).map((slug) => ({slug, weight: 3})),
  'type-checking-behavior': Object.keys(TYPE_CHECKING_BEHAVIOR).map((slug) => ({slug, weight: 2})),
  'control-flow-options': Object.keys(CONTROL_FLOW_OPTIONS).map((slug) => ({slug, weight: 2})),
  'interop-constraints': Object.keys(INTEROP_CONSTRAINTS).map((slug) => ({slug, weight: 2})),
  'module-resolution': Object.keys(MODULE_RESOLUTION).map((slug) => ({slug, weight: 2})),
  'build-emit-options': Object.keys(BUILD_EMIT_OPTIONS).map((slug) => ({slug, weight: 1})),
  'project-references': Object.keys(PROJECT_REFERENCES).map((slug) => ({slug, weight: 1})),
  'watch-options': Object.keys(WATCH_OPTIONS).map((slug) => ({slug, weight: 1})),
  'language-environment-options': Object.keys(LANGUAGE_ENVIRONMENT_OPTIONS).map((slug) => ({slug, weight: 1}))
})
  .reduce((groups, [slug, refs]) => {
    const group: Group = {
      slug,
      title: formatTitle(slug),
      refs
    };
    return [
      ...groups,
      group
    ]
  }, [] as Group[]);
