import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { b } from "./baml_client/index.js";
import type {
  PossibilityExplorationBare,
  PossibilityExplorationReasoned,
  QueryBreakdownBare,
  QueryBreakdownReasoned,
  SynthesisRating,
} from "./baml_client/types.js";

/**
 * De-risking 7.3 — D8/D9 inference fidelity, pilot scale.
 *
 * The two adversarial files are ported two ways — bare-typed versus
 * reasoning-field-first (D8) — and run across two model families. A judge from
 * a third family blind-rates the rendered outputs: it sees only the person's
 * words and one response, shuffled and anonymized, never the condition.
 *
 * The scenarios carry the story the offline tests tell. Pip's snails lead;
 * the others are the same kind of small, human knot — the experiment exists
 * to see whether a typed port keeps the warmth these deserve.
 *
 * Design: 3 scenarios x 2 files x 2 styles x 2 families = 24 generations,
 * each judged once. Pilot numbers show a direction, not significance.
 */

interface Scenario {
  readonly id: string;
  readonly words: string;
  readonly thought: string;
}

const scenarios: readonly Scenario[] = [
  {
    id: "snails",
    words:
      "My little brother names the snails, so I can't just get rid of them — but they're eating my moonflower seedlings. I want the flowers and the snails to both be okay.",
    thought:
      "Maybe the snails could be invited somewhere better, instead of being kept out.",
  },
  {
    id: "apple-tree",
    words:
      "My grandfather's allotment is being split up next spring, and his apple tree is the last thing he planted. I want to save it somehow — a graft, a cutting, anything.",
    thought: "An old tree can continue in a young branch, if the graft takes.",
  },
  {
    id: "bedtime",
    words:
      "I want to read aloud to my daughter every night, but by bedtime I have no voice and no patience left. I don't want her to remember me skipping pages.",
    thought: "Perhaps the reading doesn't have to happen at bedtime at all.",
  },
];

type File_ = "query_analysis" | "thinking_primitives";
type Style = "bare" | "reasoned";
type Family = "claude" | "deepseek";

interface Generation {
  readonly scenario: string;
  readonly file: File_;
  readonly style: Style;
  readonly family: Family;
  readonly typed: unknown;
  readonly rendered: string;
}

/**
 * The composition layer (D9): the source template of `understand_query`,
 * rendered deterministically from the typed fields. In the real runtime this
 * template stays in the protocol language; here it lives in the harness, and
 * that displacement is itself one of the experiment's findings.
 */
const renderUnderstanding = (
  breakdown: QueryBreakdownBare | QueryBreakdownReasoned,
): string =>
  [
    `I'm making sure I understand this correctly. From what you're saying, you want to explore: **${breakdown.core_request}**`,
    "",
    "The most important points seem to be:",
    ...breakdown.key_points.map((point) => `- ${point}`),
    "",
    `In essence, the goal is to **${breakdown.desired_outcome}**.`,
  ].join("\n");

/**
 * The `explore_possibility` narrative: wondering, hunch, weighing — the same
 * three movements the source sequence emits as output blocks. The `reasoning`
 * field (when present) and the promise enum are deliberately NOT rendered:
 * `select` is the composition boundary, and discarded fields never reach
 * output, so the judge cannot tell the conditions apart by shape.
 */
const renderExploration = (
  exploration: PossibilityExplorationBare | PossibilityExplorationReasoned,
): string =>
  [
    exploration.wondering,
    exploration.developed_thought,
    exploration.assessment,
  ].join("\n\n");

const generators: Record<
  File_,
  Record<Style, Record<Family, (s: Scenario) => Promise<Generation>>>
> = {
  query_analysis: {
    bare: {
      claude: async (s) => {
        const typed = await b.QaBareClaude(s.words);
        return {
          scenario: s.id,
          file: "query_analysis",
          style: "bare",
          family: "claude",
          typed,
          rendered: renderUnderstanding(typed),
        };
      },
      deepseek: async (s) => {
        const typed = await b.QaBareDeepseek(s.words);
        return {
          scenario: s.id,
          file: "query_analysis",
          style: "bare",
          family: "deepseek",
          typed,
          rendered: renderUnderstanding(typed),
        };
      },
    },
    reasoned: {
      claude: async (s) => {
        const typed = await b.QaReasonedClaude(s.words);
        return {
          scenario: s.id,
          file: "query_analysis",
          style: "reasoned",
          family: "claude",
          typed,
          rendered: renderUnderstanding(typed),
        };
      },
      deepseek: async (s) => {
        const typed = await b.QaReasonedDeepseek(s.words);
        return {
          scenario: s.id,
          file: "query_analysis",
          style: "reasoned",
          family: "deepseek",
          typed,
          rendered: renderUnderstanding(typed),
        };
      },
    },
  },
  thinking_primitives: {
    bare: {
      claude: async (s) => {
        const typed = await b.TpBareClaude(s.thought, s.words);
        return {
          scenario: s.id,
          file: "thinking_primitives",
          style: "bare",
          family: "claude",
          typed,
          rendered: renderExploration(typed),
        };
      },
      deepseek: async (s) => {
        const typed = await b.TpBareDeepseek(s.thought, s.words);
        return {
          scenario: s.id,
          file: "thinking_primitives",
          style: "bare",
          family: "deepseek",
          typed,
          rendered: renderExploration(typed),
        };
      },
    },
    reasoned: {
      claude: async (s) => {
        const typed = await b.TpReasonedClaude(s.thought, s.words);
        return {
          scenario: s.id,
          file: "thinking_primitives",
          style: "reasoned",
          family: "claude",
          typed,
          rendered: renderExploration(typed),
        };
      },
      deepseek: async (s) => {
        const typed = await b.TpReasonedDeepseek(s.thought, s.words);
        return {
          scenario: s.id,
          file: "thinking_primitives",
          style: "reasoned",
          family: "deepseek",
          typed,
          rendered: renderExploration(typed),
        };
      },
    },
  },
};

/** Seeded PRNG so the blind shuffle is reproducible across runs. */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const shuffled = <T>(items: readonly T[], random: () => number): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};

/** Run thunks with a small concurrency cap, preserving order of results. */
const pool = async <T>(
  thunks: readonly (() => Promise<T>)[],
  width: number,
): Promise<T[]> => {
  const results: T[] = new Array(thunks.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(width, thunks.length) },
    async () => {
      while (next < thunks.length) {
        const index = next++;
        results[index] = await thunks[index]!();
      }
    },
  );
  await Promise.all(workers);
  return results;
};

const mean = (values: readonly number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

const main = async () => {
  const files: File_[] = ["query_analysis", "thinking_primitives"];
  const styles: Style[] = ["bare", "reasoned"];
  const families: Family[] = ["claude", "deepseek"];

  console.log(
    "Generating 24 responses (3 scenarios x 2 files x 2 styles x 2 families)...",
  );
  const generationThunks = scenarios.flatMap((scenario) =>
    files.flatMap((file) =>
      styles.flatMap((style) =>
        families.map(
          (family) => () => generators[file][style][family](scenario),
        ),
      ),
    ),
  );
  const generations = await pool(generationThunks, 4);

  console.log("Judging blind (shuffled, anonymized, third-family judge)...");
  const random = mulberry32(20260611);
  const judgingOrder = shuffled(generations, random);
  const ratings = await pool(
    judgingOrder.map((generation) => async () => {
      const scenario = scenarios.find((s) => s.id === generation.scenario)!;
      const rating: SynthesisRating = await b.RateSynthesis(
        scenario.words,
        generation.rendered,
      );
      return { generation, rating };
    }),
    4,
  );

  // Aggregate: mean overall per condition cell, and the D8 delta
  // (reasoned minus bare) per file and family.
  const cellScores = new Map<string, number[]>();
  for (const { generation, rating } of ratings) {
    const key = `${generation.file}/${generation.style}/${generation.family}`;
    cellScores.set(key, [...(cellScores.get(key) ?? []), rating.overall]);
  }
  const cells = Object.fromEntries(
    [...cellScores.entries()].map(([key, scores]) => [key, mean(scores)]),
  );
  const deltas = Object.fromEntries(
    files.flatMap((file) =>
      families.map((family) => [
        `${file}/${family}: reasoned - bare`,
        (cells[`${file}/reasoned/${family}`] ?? 0) -
          (cells[`${file}/bare/${family}`] ?? 0),
      ]),
    ),
  );

  const outDir = join(import.meta.dirname, "results");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(outDir, `run-${stamp}.json`);
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        design: {
          scenarios: scenarios.length,
          files,
          styles,
          families,
          judge: "google/gemini-3.5-flash via OpenRouter (third family, blind)",
          shuffleSeed: 20260611,
        },
        cells,
        deltas,
        ratings: ratings.map(({ generation, rating }) => ({
          scenario: generation.scenario,
          file: generation.file,
          style: generation.style,
          family: generation.family,
          rating,
          typed: generation.typed,
          rendered: generation.rendered,
        })),
      },
      null,
      2,
    ),
  );

  console.log(`\nResults written to ${outPath}\n`);
  console.log("Mean overall (1-7) per condition:");
  for (const [key, value] of Object.entries(cells).sort()) {
    console.log(`  ${key}: ${value.toFixed(2)}`);
  }
  console.log("\nD8 deltas (reasoned minus bare):");
  for (const [key, value] of Object.entries(deltas)) {
    console.log(`  ${key}: ${value >= 0 ? "+" : ""}${value.toFixed(2)}`);
  }
};

await main();
