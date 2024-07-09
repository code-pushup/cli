import {
  CategoryConfig,
  CoreConfig,
  Group,
  GroupRef,
  PersistConfig,
  PluginConfig,
  UploadConfig,
} from '@code-pushup/models';

export function mergeConfigs(
  config: CoreConfig,
  ...configs: Partial<CoreConfig>[]
): Partial<CoreConfig> {
  return configs.reduce(
    (acc, obj) => ({
      ...acc,
      ...mergeCategories(acc.categories, obj.categories),
      ...mergePlugins(acc.plugins, obj.plugins),
      ...mergePersist(acc.persist, obj.persist),
      ...mergeUpload(acc.upload, obj.upload),
    }),
    config,
  );
}

function mergeCategories(
  a: CategoryConfig[] | undefined,
  b: CategoryConfig[] | undefined,
): Pick<CoreConfig, 'categories'> {
  if (!a && !b) {
    return {};
  }

  const mergedMap = new Map<string, CategoryConfig>();

  const addToMap = (categories: CategoryConfig[]) => {
    categories.forEach(newObject => {
      if (mergedMap.has(newObject.slug)) {
        const existingObject: CategoryConfig | undefined = mergedMap.get(
          newObject.slug,
        );

        mergedMap.set(newObject.slug, {
          ...existingObject,
          ...newObject,

          refs: mergeBySlugs(existingObject?.refs, newObject.refs),
        });
      } else {
        mergedMap.set(newObject.slug, newObject);
      }
    });
  };

  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  // Convert the map back to an array
  return { categories: [...mergedMap.values()] };
}

function mergePlugins(
  a: PluginConfig[] | undefined,
  b: PluginConfig[] | undefined,
): Pick<CoreConfig, 'plugins'> {
  if (!a && !b) {
    return { plugins: [] };
  }

  const mergedMap = new Map<string, PluginConfig>();

  const addToMap = (plugins: PluginConfig[]) => {
    plugins.forEach(newObject => {
      if (mergedMap.has(newObject.slug)) {
        const existingObject: PluginConfig | undefined = mergedMap.get(
          newObject.slug,
        );

        mergedMap.set(newObject.slug, {
          ...existingObject,
          ...newObject,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          ...(newObject.audits && {
            audits: mergeBySlugs(existingObject?.audits, newObject.audits),
          }),
          ...((existingObject?.groups ?? newObject.groups) && {
            groups: mergeGroupsBySlugs(
              existingObject?.groups,
              newObject.groups,
            ),
          }),
        });
      } else {
        mergedMap.set(newObject.slug, newObject);
      }
    });
  };

  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  return { plugins: [...mergedMap.values()] };
}

function mergeGroupRefsBySlugs<T extends GroupRef>(
  a: T[] | undefined,
  b: T[] | undefined,
): T[] {
  const map = new Map<string, T>();

  const addToMap = (groups: T[]) => {
    groups.forEach(group => {
      if (map.has(group.slug)) {
        map.set(group.slug, { ...map.get(group.slug), ...group });
      } else {
        map.set(group.slug, group);
      }
    });
  };

  // Add objects from both arrays to the map
  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  return [...map.values()];
}

function mergeGroupsBySlugs<T extends Group>(
  a: T[] | undefined,
  b: T[] | undefined,
) {
  const map = new Map<string, T>();

  const addToMap = (groups: T[]) => {
    groups.forEach(newGroup => {
      const existingGroup: Group | undefined = map.get(newGroup.slug);

      if (map.has(newGroup.slug)) {
        map.set(newGroup.slug, {
          ...map.get(newGroup.slug),
          ...newGroup,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          ...(newGroup.refs && {
            refs: mergeGroupRefsBySlugs(existingGroup?.refs, newGroup.refs),
          }),
        });
      } else {
        map.set(newGroup.slug, newGroup);
      }
    });
  };

  // Add objects from both arrays to the map
  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  return [...map.values()];
}

function mergePersist(
  a: PersistConfig | undefined,
  b: PersistConfig | undefined,
): Pick<CoreConfig, 'persist'> {
  if (!a && !b) {
    return {};
  }

  if (a) {
    return b ? { persist: { ...a, ...b } } : {};
  } else {
    return { persist: b };
  }
}

function mergeBySlugs<T extends { slug: string }>(
  a: T[] | undefined,
  b: T[] | undefined,
) {
  const map = new Map<string, T>();

  const addToMap = (refs: T[]) => {
    refs.forEach(ref => {
      if (map.has(ref.slug)) {
        map.set(ref.slug, { ...map.get(ref.slug), ...ref });
      } else {
        map.set(ref.slug, ref);
      }
    });
  };

  // Add objects from both arrays to the map
  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  return [...map.values()];
}

function mergeUpload(
  a: UploadConfig | undefined,
  b: UploadConfig | undefined,
): Pick<CoreConfig, 'upload'> {
  if (!a && !b) {
    return {};
  }

  if (a) {
    return b ? { upload: { ...a, ...b } } : {};
  } else {
    return { upload: b };
  }
}
