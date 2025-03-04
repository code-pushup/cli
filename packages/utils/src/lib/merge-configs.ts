import type {
  CategoryConfig,
  CoreConfig,
  PersistConfig,
  PluginConfig,
  UploadConfig,
} from '@code-pushup/models';

export function mergeConfigs(
  config: CoreConfig,
  ...configs: Partial<CoreConfig>[]
): CoreConfig {
  return configs.reduce<CoreConfig>(
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

          refs: mergeByUniqueCategoryRefCombination(
            existingObject?.refs,
            newObject.refs,
          ),
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
      mergedMap.set(newObject.slug, newObject);
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

function mergeByUniqueCategoryRefCombination<
  T extends { slug: string; type: string; plugin: string },
>(a: T[] | undefined, b: T[] | undefined) {
  const map = new Map<string, T>();

  const addToMap = (refs: T[]) => {
    refs.forEach(ref => {
      const uniqueIdentification = `${ref.type}:${ref.plugin}:${ref.slug}`;
      if (map.has(uniqueIdentification)) {
        map.set(uniqueIdentification, {
          ...map.get(uniqueIdentification),
          ...ref,
        });
      } else {
        map.set(uniqueIdentification, ref);
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
