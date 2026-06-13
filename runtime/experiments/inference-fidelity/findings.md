# Inference fidelity pilot — findings (de-risk 7.3, D8/D9)

## What ran

The two adversarial files were ported and run two ways each, across two fast-tier model families, with a third-family judge rating blind.

- **Files.** `legacy/lib/prism/query_analysis.in` (multi-splice: one prose template with three `<...>` inferences woven in) and `legacy/lib/prism/thinking_primitives.in` (same-stream back-reference: a later capture refers to prose generated earlier in the same output).
- **Port styles.** Bare-typed (just the typed slots) versus reasoning-field-first (a free-form `reasoning` field declared before the typed fields, per D8).
- **Families.** Claude Haiku 4.5 and DeepSeek (the API resolves `deepseek-chat` to `deepseek-v4-flash`). Fast tiers are deliberate: they are the models principle 7 ("weak models suffice", `docs/principles.md`) says these leaves must work on.
- **Judge.** `google/gemini-3.5-flash` via OpenRouter — from neither contestant family. It saw only the person's words and one rendered response, shuffled (seed 20260611) and anonymized. Discarded fields (`reasoning`, the promise enum) were never rendered, so conditions are indistinguishable by shape.
- **Scale.** 3 scenarios x 2 files x 2 styles x 2 families = 24 generations, each judged once. Pilot numbers show a direction, not significance: three observations per cell.

Raw data: `results/run-2026-06-10T23-21-45-766Z.json`. Reproduce with `BAML_LOG=warn bun run run.ts` after `npx baml-cli generate --from baml_src` (keys: `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`).

## Headline: the typed contract holds on weak models

Every one of the 24 generations parsed against its declared schema on the first attempt — no retries, no `InferenceParseError`, across both families and both port styles, including the class with five fields and an enum. For the weak-model intention this is the load-bearing result: the D4 typed-return contract is not a tax that only flagship models can pay.

## D8: the reasoning field helps only where the shape is tight

Mean overall (1–7), with the reasoned-minus-bare delta per family:

| File | Style | Haiku | DeepSeek |
|---|---|---|---|
| query_analysis | bare | 4.00 | 4.67 |
| query_analysis | reasoned | 5.00 | 4.33 |
| thinking_primitives | bare | 5.33 | 5.00 |
| thinking_primitives | reasoned | 4.67 | 5.00 |

Deltas: query_analysis +1.00 (Haiku) and −0.33 (DeepSeek); thinking_primitives −0.67 (Haiku) and 0.00 (DeepSeek).

The direction the pilot suggests: the reasoning-first mitigation earns its place where the declared output is tight summary slots, and adds nothing where the declared output already opens with expressive prose. Query_analysis's fields are compressed summaries — on Haiku, leading with reasoning lifted fidelity from 4.67 to 6.00 and overall by a full point. Thinking_primitives' fields (`wondering` → `developed_thought` → `assessment`) are themselves free-flowing prose emitted before any constrained value, so the model effectively gets its chain-of-thought inside the declared shape, and an extra reasoning field on top was neutral to slightly negative. This is consistent with the picture D8 already cites: the degradation is tied to format restriction, and it largely disappears once prose can flow before the committed value — whether that prose is a dedicated reasoning field or simply the shape's own leading fields.

The effect is also family-specific: DeepSeek was flat everywhere (−0.33 to 0.00), so the residual model-dependence D8 flags (Castillo) is visible even at pilot scale. Reasoning-first should be a per-shape, measured choice rather than a blanket rule: lead with reasoning when the typed fields are compressed; skip it when the shape's first fields are already free prose.

One more signal worth keeping: naturalness is the weakest judged dimension for query_analysis in every cell (3.33–4.00, versus 4.00–5.00 for thinking_primitives). The multi-splice template — three independently generated slots rendered into fixed prose — reads more "filled in" than the single-stream exploration. The composition seam, not the model, looks like the binding constraint on warmth.

## D9: where composition went, file by file

**query_analysis — low leakage, bounded to renderer placement.** The three splices were absorbed into one class (the per-operator recipe), and everything else the operator does — the prose template, the `each:` loop over key points, the `until:` confirmation loop — remains expressible in the protocol. In this harness the template render is a TypeScript function, but nothing about the port requires that: the runtime can keep the template in the protocol language and interpolate typed fields. The D9 boundary holds, provided the runtime renders protocol templates rather than host ones.

**thinking_primitives — real leakage, and a real choice.** The single-call port collapsed `explore_possibility`'s three persona-voiced steps into one prompt. What left the protocol: the step sequencing (became field declaration order), the two same-stream back-references (became within-call field dependencies), and — the costliest — the per-step `as:` persona switching, whose three voices (@curious_explorer, self, @careful_evaluator) blended into one system prompt. Essentially the whole sequence body except the enum extraction now lives inside a single inference. The alternative port keeps composition in the protocol: three chained typed calls, with the runtime passing `wondering` → `developed_thought` → `assessment` as data between them. That trades same-stream coherence for protocol-visible composition, restores true persona switching, and yields smaller leaves — which is also the more weak-model-friendly shape. Choosing between these (or supporting both, with the single-call form as an optimization) is the concrete decision the composition seam owes; the pilot's contribution is that the trade is now named and priced.

## Limitations

- Three observations per cell; a one-point delta is suggestive, not established.
- The promise enum returned `QuitePromising` for all twelve explorations — every fixture's thought seed was genuinely promising, so the enum's discrimination was never exercised. A follow-up needs deliberately weak seeds.
- One judge, one pass, no inter-rater check; the "both" judging option (an anonymized human sheet) remains open if the deltas ever need to carry weight.
