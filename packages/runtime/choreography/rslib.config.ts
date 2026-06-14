import { defineConfig } from "@rslib/core";

// Bundleless ESM so the published module structure matches the source tree and
// what tsc sees. tsc owns declarations (dts: false here); rslib emits JS only.
// Workspace and catalog dependencies are externalized by rslib's autoExternal.
export default defineConfig({
  source: {
    entry: {
      index: "./src/**",
    },
  },
  lib: [
    {
      format: "esm",
      bundle: false,
      dts: false,
    },
  ],
  output: {
    target: "node",
  },
});
