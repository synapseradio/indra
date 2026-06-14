# @indra/configs

Shared build and test configuration for the INDRA workspace.

## Overview

This package holds configuration that every workspace package extends, so the
shape of a package's tooling lives in one place rather than being copied into
each package. Today it provides the base Vitest configuration; it is structured
so other shared configuration can move in alongside it later.

## Usage

Import the base test configuration into a package's `vitest.config.ts` and merge
in the per-package overrides:

```ts
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import { baseConfig } from "@indra/configs/vitest";

export default mergeConfig(baseConfig, {
  test: {
    name: "core",
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
});
```
