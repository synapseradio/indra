# Workspace scripts

The root `package.json` holds the commands you run across the whole workspace.
They follow a small naming convention so that related commands sort and read
together, and so that a new command's name tells you what it touches before you
read what it does.

## Naming convention

A script name is `intent` optionally followed by `:scope` and `:capability`.

The **intent** is the verb — what kind of work the command does (`build`,
`check`, `lint`, `test`, `format`, `generate`). The **scope** narrows the
intent to one surface (`check:types`, `lint:docs`). The **capability** narrows
it further when one scope needs variants (`lint:fix`, `lint:fix:unsafe`). An
intent on its own runs the broad version; the bare `lint` checks everything,
while `lint:docs` checks only Markdown.

Most cross-package work runs through Turbo, which orders packages by their
dependency graph and caches results. The typecheck, build, and test intents
delegate to `turbo run <task>`, so each package's own script does the work and
Turbo decides what can be skipped.

## The scripts

| Script | What it does |
| --- | --- |
| `generate` | Run every package's code generation (today, the BAML client in `runtime-core`). |
| `build` | Build every package's JavaScript with rslib, in dependency order. |
| `check` | The full gate: typecheck, lint the docs, and run Biome over the tree. |
| `check:types` | Typecheck the whole project with `tsc -b` from the root solution config. |
| `lint` | Check formatting and lint rules across the workspace with Biome. |
| `lint:fix` | Apply Biome's safe fixes, formatting, and import sorting. |
| `lint:fix:unsafe` | Also apply Biome's unsafe fixes; review the result before committing. |
| `lint:docs` | Check Markdown with markdownlint-cli2. |
| `lint:docs:fix` | Apply every fixable Markdown rule. |
| `format` | Format the tree with Biome without touching lint rules. |
| `test` | Run every package's offline test suite through Turbo. |

## Per-package scripts

Each package carries the same three scripts, which the root commands invoke
through Turbo: `build` (rslib), `check:types` (`tsc -b` of that package's
aggregate config), and `test` (`vitest run`). The package that owns code
generation also carries a `generate` script. Running a script inside a package
directory does that one package's work; running the root script does the whole
graph.
