import type { ActorDef, Program } from "@indra/runtime-contracts";

/**
 * The walking-skeleton program: `@explore`'s entry actor, derived from
 * legacy/commands/explore.in with the `tree_of_thought` delegation stripped out.
 *
 * It proves execution, not parsing — this is the AST the EBNF parser will one
 * day emit, hand-authored for now (task 1.2). The turn it drives is the
 * thinnest vertical that still touches all three layers: read `&dialogue`,
 * run one inference, stage one `set:`, and `say:` the typed result.
 *
 * Namespaces are normalized to top level (`context`, `dialogue`, `user`,
 * `signals`). The source file nests `dialogue`/`user` under `context:` in its
 * `with:` block while referencing them as `&dialogue`/`&user`; the seam log's
 * "repair semantics, preserve syntax" stance lets the skeleton resolve that to
 * the clean namespace model the read-only guard depends on.
 */
export const explore: ActorDef = {
  id: "@explore",
  identity:
    "I explore ideas by branching them into possibilities and following the most promising threads",
  rules: [
    "I welcome users by immediately inviting them to explore a topic",
    "I make the exploration process accessible and engaging",
  ],
  understands: [
    "users want to explore ideas naturally and thoroughly",
    "the journey of exploration is as valuable as the destination",
  ],
  perform: {
    method: "facilitating natural thought exploration",
    goal: "to provide an accessible interface to Tree of Thought reasoning",
    output: "*Explore Command initializing...*",
    then: [
      // State 1: no user input yet — welcome and invite.
      {
        when: {
          kind: "is",
          left: {
            kind: "ref",
            path: { ns: "dialogue", segments: ["latest_dialogue_entry"] },
          },
          right: { kind: "literal", value: "" },
        },
        sets: [],
        terminator: {
          kind: "say",
          to: "@user",
          what: {
            kind: "literal",
            value:
              "## Tree of Thought Explorer\n\nI can help you think through ideas by exploring multiple angles, following promising threads, and making natural connections.\n\nWhat would you like to explore together?",
          },
        },
      },
      // Otherwise: the user said something — capture it and welcome them into it.
      {
        sets: [
          {
            target: { ns: "context", segments: ["query"] },
            value: {
              kind: "ref",
              path: { ns: "dialogue", segments: ["latest_dialogue_entry"] },
            },
            level: "perform",
          },
        ],
        terminator: {
          kind: "say",
          to: "@user",
          what: {
            kind: "inference",
            ref: {
              fn: "WelcomeExplorer",
              input: {
                user_input: {
                  kind: "ref",
                  path: { ns: "dialogue", segments: ["latest_dialogue_entry"] },
                },
              },
              select: "message",
            },
          },
        },
      },
    ],
  },
};

export const skeleton: Program = {
  entry: "@explore",
  initialContext: {
    context: {
      query: "",
      explore: { exploration_style: "balanced" },
    },
    dialogue: { latest_dialogue_entry: "" },
    user: { latest: "", history: [] },
    signals: {},
  },
  actors: {
    "@explore": explore,
  },
};
