/**
 * The workspace manifest: the single edit point for which packages exist and
 * what each depends on. Everything the scaffold generates is derived from this
 * list. Adding a package here and running `scaffold package <key>` is the whole
 * ceremony for standing one up.
 *
 * `deps` mixes workspace packages (the `@indra/...` ones, which become
 * `workspace:*` dependencies and TypeScript project references) and external
 * packages (which become `catalog:` dependencies). The constant tooling
 * devDependencies live in the package-json generator, not here, because they
 * are identical for every package.
 */

export interface PackageSpec {
  /** Path from the repo root, e.g. `packages/runtime/core`. */
  readonly relpath: string;
  /** The published package name, e.g. `@indra/runtime-core`. */
  readonly name: string;
  /** Workspace and external dependencies, unscoped names as written in imports. */
  readonly deps: readonly string[];
}

export const PACKAGES: readonly PackageSpec[] = [
  {
    relpath: "packages/runtime/contracts",
    name: "@indra/runtime-contracts",
    deps: ["effect"],
  },
  {
    relpath: "packages/runtime/core",
    name: "@indra/runtime-core",
    deps: ["@indra/runtime-contracts", "effect", "@boundaryml/baml"],
  },
  {
    relpath: "packages/runtime/choreography",
    name: "@indra/runtime-choreography",
    deps: [
      "@indra/runtime-contracts",
      "@indra/runtime-core",
      "effect",
      "xstate",
    ],
  },
  {
    relpath: "packages/runtime/inference-baml",
    name: "@indra/runtime-inference-baml",
    deps: [
      "@indra/runtime-contracts",
      "@indra/runtime-core",
      "effect",
      "@boundaryml/baml",
    ],
  },
  {
    relpath: "packages/runtime/host",
    name: "@indra/runtime-host",
    deps: [
      "@indra/runtime-contracts",
      "@indra/runtime-core",
      "@indra/runtime-choreography",
      "effect",
      "xstate",
    ],
  },
];

/** The short key for a package, the basename of its relpath (e.g. `core`). */
export function packageKey(spec: PackageSpec): string {
  const segments = spec.relpath.split("/");
  return segments[segments.length - 1] ?? spec.relpath;
}

/** Find a package by its short key, or undefined if no entry matches. */
export function findPackage(key: string): PackageSpec | undefined {
  return PACKAGES.find((spec) => packageKey(spec) === key);
}

/** Whether a dependency token names another workspace package. */
export function isWorkspaceDep(dep: string): boolean {
  return dep.startsWith("@indra/");
}

/** The directory basename of a workspace dependency, e.g. `@indra/runtime-core` -> `core`. */
export function workspaceDepDir(dep: string): string {
  const segments = dep.split("runtime-");
  return segments[segments.length - 1] ?? dep;
}
