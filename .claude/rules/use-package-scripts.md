# Use Package Scripts, Not Tooling CLIs

When about to run any tooling CLI in this repo — type-checker, linter, formatter,
bundler, test runner, codegen, or the like.

Check `package.json` first. Before invoking a tool, look for a script that wraps
it and run that script instead. The script is the single source of truth for how
a tool runs here; it pins the flags, config discovery, and turbo task graph in
one place.

Never invoke the underlying CLI directly when a script exists — no `bunx tsc`, no
`biome check`, no `markdownlint-cli2`, and the same for every other tool. This
holds for all tooling CLIs, not a fixed list.

When a fix script exists for a check, you use the fix version every time —
and so does any other agent. This is not qualified by intent. If `lint:fix`
exists, you run `lint:fix`, never the bare `lint`. The bare check is for humans
and CI, not for an agent that can apply the fix.

The current scripts are the wrappers in the root `package.json`. Read them there
each time rather than trusting a copy: `check:types`, `lint`, `lint:fix`,
`lint:fix:unsafe`, `format`, `lint:docs`, `lint:docs:fix`, `check`, `build`,
`test`, `generate`.

Why: a direct CLI call drifts from the configured behavior and skips the caching
and ordering the scripts encode.
