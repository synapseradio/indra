import { describe, expect, it } from "@effect/vitest";
import type { ContextPath, World } from "@indra/runtime-contracts";
import {
  getAt,
  makeStoreRefsSharing,
  storeFromRefs,
} from "@indra/runtime-core";
import { Effect, STM, TRef } from "effect";

/**
 * De-risking 7.2 — D2 STM under concurrency, with the commit attempts counted.
 *
 * The seam test (6.3) proved no update is lost when commits contend. This file
 * goes one level deeper and instruments the commit loop itself: every
 * execution of the commit transaction's body is one attempt, so attempts minus
 * successful commits equals retries.
 *
 * The instrumentation produced a structural finding, recorded in design.md
 * under D2. In effect 3.21.3 an STM body is evaluated synchronously and
 * atomically within one isolate: a journal invalidated mid-body is treated as
 * an impossible state (the runtime throws its own BUG invariant — verified
 * directly, node_modules/effect/src/internal/stm/core.ts, tryCommitSync), and
 * the retry/wake machinery activates only for `STM.retry` suspensions. So on
 * today's single-isolate runtime, journal-conflict retries are structurally
 * zero — not merely rare. What these tests can and do pin down is the half of
 * D2 that carries the correctness load: `commitTurn` reads the committed world
 * INSIDE its own transaction and folds onto whatever is latest, so interleaved
 * commits across yield points never write back a stale page. The attempt
 * counter is wired and proven accurate at one-per-commit; it becomes a retry
 * meter the day the parallel runtime makes commits genuinely simultaneous.
 *
 * The story reaches chapter three: the night of the rain. Pip keeps a diary of
 * the garden, but he is not the only one writing in it — the weather keeps its
 * own accounts. You are reading over both their shoulders. A boy who falls
 * asleep mid-sentence is a fiber parked at a yield point. The rain that writes
 * while he sleeps is a contending commit. And the page that cannot be snatched
 * away mid-word is the atomicity of the commit body itself.
 */

const diary = (leaf: string): ContextPath => ({
  ns: "context",
  segments: ["diary", leaf],
});

const emptyDiary: World = { context: { diary: {} } };

describe("STM contention with counted retries (7.2, D2)", () => {
  it.effect(
    "the rain writes while Pip sleeps, and morning finds both lines on the page",
    () =>
      Effect.gen(function* () {
        const committed = yield* STM.commit(TRef.make<World>(emptyDiary));

        let pipAttempts = 0;
        let rainAttempts = 0;
        const pip = storeFromRefs(
          yield* STM.commit(makeStoreRefsSharing(committed)),
          () => {
            pipAttempts += 1;
          },
        );
        const rain = storeFromRefs(
          yield* STM.commit(makeStoreRefsSharing(committed)),
          () => {
            rainAttempts += 1;
          },
        );

        // Pip writes his line and falls asleep before the day is committed —
        // a fiber parked at a yield point, pen still in hand.
        const pipsEvening = Effect.gen(function* () {
          yield* pip.beginTurn;
          yield* pip.setStaged(
            diary("pips_line"),
            "I planted something good today.",
          );
          yield* Effect.yieldNow();
          yield* pip.commitTurn;
        });

        // The rain does not wait for boys. It writes its own line and commits
        // while he sleeps.
        const rainsNight = Effect.gen(function* () {
          yield* rain.beginTurn;
          yield* rain.setStaged(
            diary("rains_line"),
            "It rained all night, softly.",
          );
          yield* rain.commitTurn;
        });

        yield* Effect.all([pipsEvening, rainsNight], {
          concurrency: "unbounded",
        });

        // Morning: both lines are on the page. Pip's later commit folded onto
        // the world the rain left, instead of writing back the stale page he
        // fell asleep holding.
        const world = yield* pip.committed;
        expect(getAt(world, diary("pips_line"))).toBe(
          "I planted something good today.",
        );
        expect(getAt(world, diary("rains_line"))).toBe(
          "It rained all night, softly.",
        );

        // Every commit was counted. On one thread neither small transaction
        // was preempted, so the instrument should read clean single attempts —
        // the baseline the injected-conflict test below moves away from.
        expect(pipAttempts).toBe(1);
        expect(rainAttempts).toBe(1);
      }),
  );

  it.effect(
    "Pip and the rain write on the same line; the last hand wins and no other line is lost",
    () =>
      Effect.gen(function* () {
        const committed = yield* STM.commit(TRef.make<World>(emptyDiary));
        const pip = storeFromRefs(
          yield* STM.commit(makeStoreRefsSharing(committed)),
        );
        const rain = storeFromRefs(
          yield* STM.commit(makeStoreRefsSharing(committed)),
        );

        // Both write in the margin — the same leaf of the same page. Pip
        // parks; the rain commits first, along with a second line of its own.
        const pipsEvening = Effect.gen(function* () {
          yield* pip.beginTurn;
          yield* pip.setStaged(diary("margin"), "Pip was here.");
          yield* Effect.yieldNow();
          yield* pip.commitTurn;
        });
        const rainsNight = Effect.gen(function* () {
          yield* rain.beginTurn;
          yield* rain.setStaged(diary("margin"), "The rain was here first.");
          yield* rain.setStaged(diary("rains_line"), "Puddles by the gate.");
          yield* rain.commitTurn;
        });

        yield* Effect.all([pipsEvening, rainsNight], {
          concurrency: "unbounded",
        });

        // The contended margin belongs to the later commit — serialized, not
        // torn. And the rain's other line survives Pip's commit untouched,
        // which is the actual no-lost-update guarantee: a commit overwrites
        // only the paths it wrote, never the page wholesale.
        const world = yield* pip.committed;
        expect(getAt(world, diary("margin"))).toBe("Pip was here.");
        expect(getAt(world, diary("rains_line"))).toBe("Puddles by the gate.");
      }),
  );

  it.effect(
    "a whole week of weather contends for the diary, and every commit lands on its first attempt",
    () =>
      Effect.gen(function* () {
        const committed = yield* STM.commit(TRef.make<World>(emptyDiary));

        // Seven nights of weather and one boy, all writing at once, every
        // pen parked mid-sentence at least once. In a bigger world — the
        // parallel runtime D2 is built for — some of these commits would
        // collide mid-body and the instrument would count the do-overs. In
        // this world the page cannot be snatched mid-word: the commit body is
        // atomic by construction, so the honest measurement is that every
        // commit lands on its first attempt, and the no-stale-writeback fold
        // is doing all of the correctness work.
        const writers = [
          { name: "pip", line: "I checked on the seed twice." },
          { name: "rain", line: "Fell till the gutters sang." },
          { name: "wind", line: "Took one sock from the line." },
          { name: "frost", line: "Drew ferns on the glass." },
          { name: "fog", line: "Sat in the lane till noon." },
          { name: "hail", line: "Rattled the shed like a drum." },
          { name: "sleet", line: "Could not decide what to be." },
          { name: "dew", line: "Beaded every web by the gate." },
        ];

        const attempts = new Map<string, number>();
        const nights = writers.map((writer) =>
          Effect.gen(function* () {
            const store = storeFromRefs(
              yield* STM.commit(makeStoreRefsSharing(committed)),
              () => {
                attempts.set(writer.name, (attempts.get(writer.name) ?? 0) + 1);
              },
            );
            yield* store.beginTurn;
            yield* store.setStaged(diary(writer.name), writer.line);
            yield* Effect.yieldNow();
            yield* store.commitTurn;
          }),
        );

        yield* Effect.all(nights, { concurrency: "unbounded" });

        // Every line made it into the diary — eight interleaved commits, one
        // shared world, nothing overwritten by a stale fold.
        const world = yield* STM.commit(TRef.get(committed));
        for (const writer of writers) {
          expect(getAt(world, diary(writer.name))).toBe(writer.line);
        }

        // And the meter read: one attempt per commit, zero retries — the
        // structural baseline this runtime guarantees, and the number to
        // re-measure when commits become genuinely simultaneous.
        for (const writer of writers) {
          expect(attempts.get(writer.name)).toBe(1);
        }
      }),
  );
});
