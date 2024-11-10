import dummyPlugin, {dummyAudit, dummyPluginSlug} from "./dummy.plugin";

export default {
  persist: {
    outputDir: "../../tmp/e2e/react-todos-app",
  },
  plugins: [dummyPlugin()],
  categories: [
    {
      slug: 'dummy-category',
      title: 'Dummy Category',
      refs: [
        {
          type: 'audit',
          plugin: dummyPluginSlug,
          audit: dummyAudit.slug,
          weight: 1
        }
      ]
    }
  ],
};
