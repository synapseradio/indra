# INDRA general-purpose agentic gap — executive summary

Grounded in three prior-art catalogs (`mastra.md`, `langchain.md`, `agno.md`) and verified against
INDRA's specs (`openspec/specs/`), the decision ledger
(`openspec/changes/extract-deterministic-runtime/design.md`), and the IR design
(`openspec/changes/define-program-ir/design.md`).

## Thesis

INDRA's deterministic-IR design is **not** what blocks general-purpose agentic use. Most of the
floor is orthogonal capability the architecture already reserves space for. One gap is the clear
blocker (tools/MCP); one gap genuinely stretches the model (semantic memory/RAG); the rest is
build-it, not rethink-it.

## What "the floor" is (verified, cross-framework)

Three frameworks of different philosophy converge on the same table-stakes. The three claims that
shape the roadmap are each backed by primary sources in all three catalogs:

- **Tool calling, MCP as the interop standard** — Mastra `MCPClient`/`MCPServer`
  (mastra.ai/docs/mcp/overview); LangChain `langchain-mcp-adapters` `MultiServerMCPClient`
  (docs.langchain.com/oss/python/langchain/mcp); Agno `MCPTools`/`MultiMCPTools`
  (docs.agno.com/tools/mcp).
- **Durable checkpoint-and-resume** — LangGraph checkpointers persist full state per `thread_id`
  (docs.langchain.com/oss/python/langgraph/persistence); Mastra `suspend()`/`resume()` +
  snapshot-to-storage (mastra.ai/docs/workflows/snapshots). First-class in both; lighter and
  session-oriented in Agno.
- **Vector/semantic memory + RAG** — Mastra `Memory({vector, embedder, semanticRecall})` + RAG
  pipeline (mastra.ai/docs/memory/overview, /rag/overview); LangGraph `Store` semantic search
  (docs.langchain.com/oss/python/langgraph/add-memory); Agno `Knowledge` over 20+ vector DBs
  (docs.agno.com/knowledge/introduction).

The remaining floor items — multi-provider models, streaming, human-in-the-loop, observability/evals,
serving — are present in all three but are conventional and uncontested; their exact API surfaces are
not load-bearing for INDRA's decisions.

## Not a gap: the open agent loop

All three center an open-ended, LLM-driven control loop (the model picks the next action until it
judges itself done). INDRA deliberately rejects this: judgment is confined to bounded typed inference
points and control flow is authored IR (`docs/principles.md`). "General-purpose" for INDRA means
expressing the same *applications*, not adopting the open loop. Read every gap below through that
lens.

## The gaps, by architectural relationship

### Anticipated by the design, not yet built (fill a reserved slot)

| Gap | INDRA's reserved hook | Status |
| --- | --- | --- |
| Tool calling / MCP | IR5 registry seats MCP tools beside inference, by name, bound at load; S18 specifies the non-fatal tool-leaf failure rule | Slot cut, capability unbuilt — **the blocker** |
| Durable persistence + resume across restarts | D10 chose one-generic-interpreter so XState snapshots/rehydrate; IR6 specifies rehydration revalidation | Mechanism designed, backend + resume path unbuilt |
| Multi-provider models + fallback | Inference reference is a name resolved through a registry (IR5) — providers are a supplier concern | Unbuilt; one BAML path wired |
| Parallel / shared-state multi-agent | D2 built the STM whiteboard expressly for parallel actors on a shared transactional world | Substrate *structurally* present (shared world + atomic commit + serialize-retry mechanism), but its parallel guarantee is **unexercised** — de-risk 7.2 measured zero journal-conflict retries on the single-threaded runtime, so lost-update prevention is proven interleaved, not simultaneous (`extract-deterministic-runtime/design.md:59`). Prereqs to advance: a genuinely-parallel runtime, a re-read of the instrumented commit meter under simultaneous load, plus `await:` resume (S17) and the orchestration constructs — all unbuilt |

### Genuinely absent (no current home — a real design decision)

- **Long-term + semantic memory and RAG.** No embeddings, vector store, retrieval, ingestion, or
  cross-session memory. `&context` is structured key-value state, not a retrieval substrate. This is
  the one addition that stretches the thesis: approximate retrieval has no analog in the
  namespaced-whiteboard model and raises a determinism question. Most natural resolution — make
  retrieval itself a **bounded typed leaf** (like inference), not ambient context.
- **Streaming (tokens + events).** Output is a completed value at the boundary commit; no token or
  lifecycle stream. Mild tension with D3 (staged writes invisible until boundary) — stream output,
  never uncommitted state.
- **Mid-run human-in-the-loop.** `say: to: @user` yields only *between* turns; no within-turn
  interrupt, approval gate, or durable mid-turn pause. Becomes important once tools land
  (tool approval is the canonical case) and couples to durable execution.
- **Observability / tracing / evals.** Only a trace *toggle* exists (S10, debug switch). No spans,
  token/cost metrics, or standing eval harness.
- **Serving / deployment.** Embedded interpreter, no transport, sessions API, or multi-tenancy. The
  most clearly orthogonal, least philosophically loaded gap.

## Prioritized next steps

1. **Tier 1 — unblocks most agentic apps.** Tool calling / MCP (build the IR5 registry's tool
   supplier + the S18 non-fatal failure path); durable persistence + resume (realize D10/IR6 against
   a snapshot store); multi-provider model abstraction (multiple registry suppliers).
2. **Tier 2 — the common application shapes.** Semantic memory / RAG as a typed-leaf retrieval
   primitive (the one workstream needing an architectural decision); streaming; mid-run
   human-in-the-loop (depends on tools + persistence); parallel / shared-state multi-agent
   (the STM substrate is structurally present but its parallel guarantee is unexercised — see the
   readiness note in the table; needs a parallel runtime + S17 resume before it bears weight).
3. **Tier 3 — production and operations.** Observability + evals; a serving layer.

## The one decision to make before Tier 2

Whether semantic retrieval enters as a **bounded typed leaf** (preserving the
deterministic-assembly thesis — retrieval is a named, host-bound, schema-returning call like
inference) or as ambient retrieved context (closer to the prior-art frameworks, but in tension with
the thesis). Everything else is implementation against hooks the architecture already defines.
