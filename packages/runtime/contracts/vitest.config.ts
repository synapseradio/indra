import { fileURLToPath } from "node:url";
import { baseConfig } from "@indra/configs/vitest";
import { mergeConfig } from "vitest/config";

// Extends the shared base test config from @indra/configs; sets this package's
// project name and pins the test root to this directory.
export default mergeConfig(baseConfig, {
  test: {
    name: "contracts",
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
});
