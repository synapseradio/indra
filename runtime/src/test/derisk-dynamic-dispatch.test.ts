import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { type AnyActorRef, createActor } from "xstate";
import type { ActorDef, ContextPath, Program } from "../ast/types.ts";
import { InferenceStub } from "../baml/inference.ts";
import { ContextStoreTag } from "../effect/context-store.layer.ts";
import { makeActorSystem } from "../xstate/actors.ts";

/**
 * De-risking 7.1 — D10 dynamic dispatch.
 *
 * D10's claim is that one registered interpreter actor can play every INDRA
 * actor, with the variation carried entirely by serializable `input` data. Two
 * consequences get pinned here, beyond what await-delegation.test.ts already
 * proves about the happy path:
 *
 * 1. An actor instantiated mid-run from a blueprint has a real, observable
 *    lifecycle: it carries the blueprint it was given (input), it reaches its
 *    final state with the declared return value (output), and afterwards it is
 *    gone (stop).
 *
 * 2. A persisted conductor snapshot survives an actual JSON round-trip and
 *    rehydrates into a working system: the actor's logic is resolved by its
 *    registered `src` string ("indraActor") and its data is restored from the
 *    persisted input. This is the exact limit D10 exists to avoid — inline
 *    runtime-built logic cannot rehydrate, registered logic can.
 *
 * The fixtures tell one small story, and the tests place you where a reader
 * sits: watching it happen. Pip, a small boy with one pocket and one question,
 * asks a seed what it will become; night falls and the book closes; morning
 * comes and the story carries on exactly where it stopped. Each story beat is
 * a runtime claim. The seed that appears only when asked and vanishes after
 * answering is the mid-run spawn. The closed book is the JSON round-trip. The
 * garden that keeps the seed overnight is the world living in Effect (D1),
 * outside the snapshot entirely.
 */

const pipsPocket: ContextPath = { ns: "context", segments: ["pips_pocket"] };
const seedInTheGarden: ContextPath = {
  ns: "context",
  segments: ["garden", "seed"],
};

/**
 * Chapter one: Pip finds a seed and does the sensible thing nobody ever does.
 * He asks it. The seed exists only for the length of its answer — summoned
 * mid-story, one truth to tell, gone by the bottom of the page.
 */
const pip: ActorDef = {
  id: "@pip",
  identity: "I am a small boy with one pocket and one question",
  rules: ["I ask politely", "I keep what I am given"],
  understands: ["seeds know things that boys do not"],
  perform: {
    method: "wondering out loud at a seed",
    goal: "to learn what the seed will become",
    then: [
      {
        sets: [],
        terminator: {
          kind: "await",
          actor: "@the_seed",
          withInput: { kind: "literal", value: {} },
          storeIn: pipsPocket,
        },
      },
    ],
  },
};

const theSeed: ActorDef = {
  id: "@the_seed",
  identity: "I am a seed, and I know exactly one thing",
  rules: ["I answer once"],
  understands: ["patience is the whole trick"],
  perform: {
    method: "answering the one question seeds get asked",
    goal: "to tell the boy what is folded up inside me",
    then: [
      {
        sets: [],
        terminator: {
          kind: "return",
          output: { kind: "literal", value: "a moonflower, if you wait" },
        },
      },
    ],
  },
};

const chapterOne: Program = {
  entry: "@pip",
  initialContext: {
    context: { pips_pocket: "" },
    dialogue: {},
    user: {},
    signals: {},
  },
  actors: { "@pip": pip, "@the_seed": theSeed },
};

/**
 * Chapter two: planting and sleeping. The first turn presses the seed into the
 * earth (a staged write, committed when the day ends). Every turn after that
 * simply reports what the garden holds — which is how the morning proves the
 * night changed nothing it shouldn't have.
 */
const pipAtNightfall: ActorDef = {
  id: "@pip",
  identity: "I am the same small boy, one day older",
  rules: ["I finish what I plant"],
  understands: ["a story does not forget overnight"],
  perform: {
    method: "tending one small garden",
    goal: "to see the seed through the night",
    then: [
      {
        when: {
          kind: "is",
          left: { kind: "ref", path: seedInTheGarden },
          right: { kind: "literal", value: "" },
        },
        sets: [
          {
            target: seedInTheGarden,
            value: {
              kind: "literal",
              value: "one moonflower seed, planted",
            },
            level: "perform",
          },
        ],
        terminator: {
          kind: "say",
          to: "@user",
          what: {
            kind: "literal",
            value:
              "Pip pressed the seed into the dark earth, said goodnight, and the page grew heavy.",
          },
        },
      },
      {
        sets: [],
        terminator: {
          kind: "say",
          to: "@user",
          what: { kind: "ref", path: seedInTheGarden },
        },
      },
    ],
  },
};

const chapterTwo: Program = {
  entry: "@pip",
  initialContext: {
    context: { garden: { seed: "" } },
    dialogue: {},
    user: {},
    signals: {},
  },
  actors: { "@pip": pipAtNightfall },
};

const stub = { reasoning: "unused", message: "unused" };

/** Turn one page: drive the conductor from idle through one full turn and back to idle. */
const turnThePage = (conductor: AnyActorRef, text: string): Promise<void> =>
  new Promise((resolve, reject) => {
    let sent = false;
    conductor.subscribe((snapshot) => {
      if (snapshot.value === "halted") {
        reject(new Error("conductor halted: the story broke"));
        return;
      }
      if (snapshot.value !== "idle") return;
      if (!sent) {
        sent = true;
        conductor.send({ type: "USER_INPUT", text });
      } else {
        resolve();
      }
    });
    conductor.start();
  });

describe("D10 dynamic dispatch (7.1)", () => {
  it("summons the seed mid-story, hears its answer, and watches it go (input, output, stop)", async () => {
    const { machine, runtime } = makeActorSystem(
      chapterOne,
      InferenceStub(stub),
    );
    const conductor = createActor(machine, { input: { program: chapterOne } });

    // The seed does not exist when the story opens. It is created mid-run by
    // Pip's `await:`, so the only way to witness its whole life is to watch
    // through the inspection window and keep a hand on each interpreter the
    // system creates, keyed by the blueprint it was given.
    const cast = new Map<string, AnyActorRef>();
    conductor.system.inspect((event) => {
      if (event.type !== "@xstate.snapshot") return;
      const snapshot = event.snapshot as { context?: { blueprint?: ActorDef } };
      const blueprintId = snapshot.context?.blueprint?.id;
      if (blueprintId !== undefined && !cast.has(blueprintId)) {
        cast.set(blueprintId, event.actorRef as AnyActorRef);
      }
    });

    await turnThePage(conductor, "Once upon a time —");

    // Output: the seed's answer landed in Pip's pocket through the boundary
    // commit, word for word.
    const pocket = await runtime.runPromise(
      Effect.flatMap(ContextStoreTag, (store) => store.get(pipsPocket)),
    );
    expect(pocket).toBe("a moonflower, if you wait");

    // Input: both characters were played by the one registered interpreter,
    // and each instance carried the blueprint it was summoned with.
    const seedRef = cast.get("@the_seed");
    const pipRef = cast.get("@pip");
    expect(seedRef).toBeDefined();
    expect(pipRef).toBeDefined();

    // Stop: the seed said its one thing and finished. So did Pip, whose whole
    // chapter was the asking. A finished interpreter leaves the system's
    // registry — the story lets its characters go.
    const seedSnapshot = seedRef!.getSnapshot() as {
      status: string;
      output: unknown;
    };
    expect(seedSnapshot.status).toBe("done");
    expect(seedSnapshot.output).toEqual({
      output: "a moonflower, if you wait",
    });
    const pipSnapshot = pipRef!.getSnapshot() as {
      status: string;
      output: unknown;
    };
    expect(pipSnapshot.status).toBe("done");
    expect(pipSnapshot.output).toEqual({
      output: "a moonflower, if you wait",
    });
    expect(conductor.system.get("@pip")).toBeUndefined();

    conductor.stop();
  });

  it("closes the book at nightfall and reopens it to the same story (logic by src, data by input)", async () => {
    const { machine, runtime } = makeActorSystem(
      chapterTwo,
      InferenceStub(stub),
    );

    // The first evening: Pip plants the seed. The write is staged during the
    // turn and committed when the day ends, the way all honest days end.
    const firstEvening = createActor(machine, {
      input: { program: chapterTwo },
    });
    const eveningLines: string[] = [];
    firstEvening.on("OUTPUT", (event) => eveningLines.push(event.text));
    await turnThePage(firstEvening, "Once upon a time —");
    expect(eveningLines).toEqual([
      "Pip pressed the seed into the dark earth, said goodnight, and the page grew heavy.",
    ]);

    // Night falls. The book closes, and the story is pressed flat between the
    // pages — a real JSON round-trip, because an in-memory object that happens
    // to restore proves nothing about durable execution.
    const pressedFlat = JSON.parse(
      JSON.stringify(firstEvening.getPersistedSnapshot()),
    );
    firstEvening.stop();

    // Morning. The same machine reopens the book (so the registered
    // "indraActor" src resolves the logic) against the same runtime (the
    // garden lives in Effect, not between the pages).
    const nextMorning = createActor(machine, {
      input: { program: chapterTwo },
      snapshot: pressedFlat,
    });
    const morningLines: string[] = [];
    nextMorning.on("OUTPUT", (event) => morningLines.push(event.text));
    await turnThePage(nextMorning, "And then?");

    // The story carried on exactly where it stopped: Pip woke up as Pip
    // (logic by src, blueprint by input) and found yesterday in the garden,
    // because the world was never inside the snapshot at all (D1).
    expect(morningLines).toEqual(["one moonflower seed, planted"]);
    const rehydratedPip = nextMorning.system.get("@pip") as AnyActorRef;
    expect(
      (rehydratedPip.getSnapshot() as { context: { blueprint: ActorDef } })
        .context.blueprint.id,
    ).toBe("@pip");

    const garden = await runtime.runPromise(
      Effect.flatMap(ContextStoreTag, (store) => store.get(seedInTheGarden)),
    );
    expect(garden).toBe("one moonflower seed, planted");

    nextMorning.stop();
  });
});
