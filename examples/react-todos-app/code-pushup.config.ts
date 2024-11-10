import dummyPlugin, {dummyCategory} from "./dummy.plugin";

export default {
  persist: {
    outputDir: "../../tmp/e2e/react-todos-app",
  },
  plugins: [dummyPlugin()],
  categories: [
    dummyCategory
  ],
};
