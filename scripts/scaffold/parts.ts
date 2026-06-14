/**
 * The scaffold's generators. Each part is a pure function from a package spec
 * to the file it owns, so a part can be regenerated in isolation and the full
 * package scaffold is just the concatenation of every part. Nothing here writes
 * to disk or moves source; rendering and writing are separate concerns (see
 * `render` and the CLI).
 *
 * The tsconfig parts encode the Effect-style project-reference layout: a
 * `composite` source build that emits declarations only, a non-emitting test
 * typecheck, an aggregating solution config, and a build config. Cross-package
 * type edges are project references to each dependency's source tsconfig.
 */

import {
  isWorkspaceDep,
  type PackageSpec,
  packageKey,
  workspaceDepDir,
} from "./manifest.ts";

export interface GeneratedFile {
  /** Path from the repo root. */
  readonly path: string;
  /** Full file contents, newline-terminated. */
  readonly content: string;
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const workspaceDeps = (spec: PackageSpec): readonly string[] =>
  spec.deps.filter(isWorkspaceDep);

const srcReferences = (spec: PackageSpec): { path: string }[] =>
  workspaceDeps(spec).map((dep) => ({
    path: `../${workspaceDepDir(dep)}/tsconfig.src.json`,
  }));

export function packageJson(spec: PackageSpec): GeneratedFile {
  const dependencies: Record<string, string> = {};
  for (const dep of spec.deps) {
    dependencies[dep] = isWorkspaceDep(dep) ? "workspace:*" : "catalog:";
  }
  return {
    path: `${spec.relpath}/package.json`,
    content: json({
      name: spec.name,
      version: "0.0.0",
      private: true,
      type: "module",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          bun: "./src/index.ts",
          import: "./dist/index.js",
          default: "./dist/index.js",
        },
      },
      scripts: {
        build: "rslib build",
        "check:types": "tsc -b tsconfig.json",
        test: "vitest run",
      },
      dependencies,
      devDependencies: {
        "@effect/vitest": "catalog:tooling",
        "@indra/configs": "workspace:*",
        "@rslib/core": "catalog:tooling",
        "@types/node": "catalog:tooling",
        typescript: "catalog:tooling",
        vitest: "catalog:tooling",
      },
    }),
  };
}

export function tsconfigSrc(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/tsconfig.src.json`,
    content: json({
      extends: "../../../tsconfig.base.json",
      compilerOptions: {
        composite: true,
        rootDir: "src",
        outDir: "dist",
        tsBuildInfoFile: "dist/tsconfig.src.tsbuildinfo",
        emitDeclarationOnly: true,
        paths: { "~/*": ["./src/*"] },
      },
      include: ["src"],
      references: srcReferences(spec),
    }),
  };
}

export function tsconfigTest(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/tsconfig.test.json`,
    content: json({
      extends: "../../../tsconfig.base.json",
      compilerOptions: {
        noEmit: true,
        paths: { "~/*": ["./src/*"] },
      },
      include: ["test"],
      references: [{ path: "./tsconfig.src.json" }, ...srcReferences(spec)],
    }),
  };
}

export function tsconfigAggregate(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/tsconfig.json`,
    content: json({
      files: [],
      references: [
        { path: "./tsconfig.src.json" },
        { path: "./tsconfig.test.json" },
      ],
    }),
  };
}

export function tsconfigBuild(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/tsconfig.build.json`,
    content: json({
      extends: "./tsconfig.src.json",
      compilerOptions: { tsBuildInfoFile: "dist/tsconfig.build.tsbuildinfo" },
      references: workspaceDeps(spec).map((dep) => ({
        path: `../${workspaceDepDir(dep)}/tsconfig.build.json`,
      })),
    }),
  };
}

/** All four tsconfig files for a package. */
export function tsconfigs(spec: PackageSpec): GeneratedFile[] {
  return [
    tsconfigSrc(spec),
    tsconfigTest(spec),
    tsconfigAggregate(spec),
    tsconfigBuild(spec),
  ];
}

export function rslibConfig(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/rslib.config.ts`,
    content: `import { defineConfig } from "@rslib/core";

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
`,
  };
}

export function vitestConfig(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/vitest.config.ts`,
    content: `import { fileURLToPath } from "node:url";
import { baseConfig } from "@indra/configs/vitest";
import { mergeConfig } from "vitest/config";

// Extends the shared base test config from @indra/configs; sets this package's
// project name and pins the test root to this directory.
export default mergeConfig(baseConfig, {
  test: {
    name: "${packageKey(spec)}",
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
});
`,
  };
}

export function readme(spec: PackageSpec): GeneratedFile {
  return {
    path: `${spec.relpath}/README.md`,
    content: `# ${spec.name}

## Overview

Describe what this package owns and the boundary it sits on.

## Usage

Document how other packages depend on and import from this one.
`,
  };
}

/** Every generated file for a package, the composition of all parts. */
export function packageScaffold(spec: PackageSpec): GeneratedFile[] {
  return [
    packageJson(spec),
    ...tsconfigs(spec),
    rslibConfig(spec),
    vitestConfig(spec),
    readme(spec),
  ];
}

/**
 * The root solution `tsconfig.json` — a non-emitting project that references
 * every package's aggregating tsconfig, so `tsc -b` from the repo root builds
 * the whole graph in dependency order.
 */
export function rootSolution(packages: readonly PackageSpec[]): GeneratedFile {
  return {
    path: "tsconfig.json",
    content: json({
      files: [],
      references: packages.map((spec) => ({ path: spec.relpath })),
    }),
  };
}

/**
 * The root build solution — references every package's `tsconfig.build.json`,
 * the declaration-emitting build of the whole graph.
 */
export function rootBuild(packages: readonly PackageSpec[]): GeneratedFile {
  return {
    path: "tsconfig.build.json",
    content: json({
      files: [],
      references: packages.map((spec) => ({
        path: `${spec.relpath}/tsconfig.build.json`,
      })),
    }),
  };
}
