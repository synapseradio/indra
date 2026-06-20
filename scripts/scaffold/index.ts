#!/usr/bin/env bun
/**
 * The package scaffold CLI. Every config the workspace's packages carry is
 * generated from the manifest, either one part at a time or as a composed
 * package scaffold. The generators are pure (see `parts`); this entry resolves
 * a package from the manifest, renders the requested files, and writes them.
 *
 * It writes structure and configuration only. It never moves or authors source,
 * and it leaves any existing `src/` and `test/` contents untouched, so it is
 * safe to re-run. The root configs (root package.json, turbo.json, biome.jsonc,
 * tsconfig.base.json, vitest.*) are authored separately, not by this tool.
 *
 *   bun scripts/scaffold/index.ts <command> [args]
 *
 *   list                         list every package in the manifest
 *   all                          scaffold every package
 *   package <key>                scaffold one package: package.json, the src/
 *                                test/aggregate/build tsconfigs, rslib.config.ts,
 *                                vitest.config.ts, README.md, and the src/ + test/ dirs
 *   package-json <key>           regenerate one package.json
 *   tsconfig <key> [--kind K]    regenerate tsconfigs (K: src|test|aggregate|build)
 *   rslib <key>                  regenerate one rslib.config.ts
 *   vitest <key>                 regenerate one vitest.config.ts
 *   readme <key>                 regenerate one README.md
 *   root-tsconfig                regenerate the root solution + build tsconfigs
 *   dirs <key>                   ensure src/ and test/ exist
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findPackage,
  PACKAGES,
  type PackageSpec,
  packageKey,
} from "./manifest.ts";
import {
  type GeneratedFile,
  packageJson,
  packageScaffold,
  readme,
  rootBuild,
  rootSolution,
  rslibConfig,
  tsconfigAggregate,
  tsconfigBuild,
  tsconfigSrc,
  tsconfigs,
  tsconfigTest,
  vitestConfig,
} from "./parts.ts";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

async function writeGenerated(file: GeneratedFile): Promise<void> {
  const abs = join(REPO_ROOT, file.path);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, file.content);
  console.log(`wrote ${file.path}`);
}

async function ensurePackageDirs(spec: PackageSpec): Promise<void> {
  for (const sub of ["src", "test"]) {
    const abs = join(REPO_ROOT, spec.relpath, sub);
    await mkdir(abs, { recursive: true });
  }
  console.log(`ensured ${spec.relpath}/{src,test}`);
}

/** Resolve a package by key or exit with a usage error. */
function requirePackage(key: string | undefined): PackageSpec {
  if (key === undefined) {
    fail("expected a package key (try `list`)");
  }
  const spec = findPackage(key);
  if (spec === undefined) {
    fail(`unknown package "${key}" (try 'list')`);
  }
  return spec;
}

function fail(message: string): never {
  console.error(`scaffold: ${message}`);
  process.exit(1);
}

/** Pull `--kind <value>` out of an argument list, returning the value if present. */
function takeKind(args: string[]): string | undefined {
  const index = args.indexOf("--kind");
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined) fail("--kind expects a value");
  return value;
}

function tsconfigByKind(spec: PackageSpec, kind: string): GeneratedFile[] {
  switch (kind) {
    case "src":
      return [tsconfigSrc(spec)];
    case "test":
      return [tsconfigTest(spec)];
    case "aggregate":
      return [tsconfigAggregate(spec)];
    case "build":
      return [tsconfigBuild(spec)];
    default:
      fail(`unknown tsconfig kind "${kind}" (src|test|aggregate|build)`);
  }
}

async function scaffoldPackage(spec: PackageSpec): Promise<void> {
  await ensurePackageDirs(spec);
  for (const file of packageScaffold(spec)) {
    await writeGenerated(file);
  }
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  switch (command) {
    case undefined:
    case "list": {
      for (const spec of PACKAGES) {
        console.log(`${packageKey(spec).padEnd(16)} ${spec.name}`);
      }
      return;
    }
    case "all": {
      for (const spec of PACKAGES) {
        await scaffoldPackage(spec);
      }
      console.log(`done: ${PACKAGES.length} packages`);
      return;
    }
    case "package": {
      await scaffoldPackage(requirePackage(rest[0]));
      return;
    }
    case "package-json": {
      await writeGenerated(packageJson(requirePackage(rest[0])));
      return;
    }
    case "tsconfig": {
      const spec = requirePackage(rest[0]);
      const kind = takeKind(rest);
      const files =
        kind === undefined ? tsconfigs(spec) : tsconfigByKind(spec, kind);
      for (const file of files) await writeGenerated(file);
      return;
    }
    case "rslib": {
      await writeGenerated(rslibConfig(requirePackage(rest[0])));
      return;
    }
    case "vitest": {
      await writeGenerated(vitestConfig(requirePackage(rest[0])));
      return;
    }
    case "readme": {
      await writeGenerated(readme(requirePackage(rest[0])));
      return;
    }
    case "root-tsconfig": {
      await writeGenerated(rootSolution(PACKAGES));
      await writeGenerated(rootBuild(PACKAGES));
      return;
    }
    case "dirs": {
      await ensurePackageDirs(requirePackage(rest[0]));
      return;
    }
    default:
      fail(`unknown command "${command}"`);
  }
}

await main(process.argv.slice(2));
