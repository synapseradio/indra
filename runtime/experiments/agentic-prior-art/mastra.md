# Mastra: Agentic Capability Catalog

> Prior art survey for INDRA gap analysis. Every load-bearing capability claim is cited to a live doc URL. Claims that could not be verified with a live source are marked `[?]`.

## Design philosophy

Mastra is an opinionated TypeScript framework whose central bet is that production-grade AI applications need *both* an open-ended agent loop and a deterministic workflow engine, and that those two primitives should compose freely rather than live in separate systems. It builds on top of the Vercel AI SDK (`LanguageModelV2`) and exposes a model router that unifies 124+ providers behind a single `"provider/model-name"` string. Memory, RAG, MCP tool access, observability, and evals are all first-class packages within the same monorepo, so the framework covers the full path from prototype to production deployment without requiring external orchestration infrastructure — though it can delegate workflow execution to Inngest for managed durability.

---

## 1. Agent abstraction

**What it provides.** An `Agent` is an instantiation of the `Agent` class from `@mastra/core/agent`. It holds an instruction set (system prompt), a model reference, a tool registry, optional memory, optional subagents, optional scorers, and optional processors. At runtime the agent runs an LLM-driven tool-call loop: `generate()` returns a complete response after all tool calls and steps finish; `stream()` returns incremental tokens. The loop continues until the model emits a final answer or an optional stop condition is met.

**Primitive / API.** `new Agent({ id, name, instructions, model, tools, agents, memory, scorers, hooks })` — source: https://mastra.ai/docs/agents/overview

**INDRA analog / gap.** INDRA has actors with persona/role, and a conductor that runs a turn cycle — but the turn cycle is a deterministic interpreter driven by a Program IR, not a free LLM loop. The bounded inference points (BAML calls) inside INDRA steps are closer to Mastra's individual tool executions than to Mastra's full agentic loop.

---

## 2. Tools / function calling / MCP

**What it provides.**

- Native tools are defined with `createTool({ id, description, inputSchema, outputSchema, execute })` from `@mastra/core/tools`. Schemas accept Zod, Valibot, ArkType, or raw JSON Schema (Standard JSON Schema). Tools carry `toModelOutput` (control what the model sees) and `transform` (control what the UI/transcript sees) hooks.
- Tool hooks: `beforeToolCall` / `afterToolCall` at agent level or per-execution; `{ proceed: false, output }` from `beforeToolCall` blocks the call entirely.
- MCP support: `MCPClient` connects to external MCP servers (stdio via `command:` or HTTP via `url:`). `mcp.listTools()` loads static tools; `mcp.listToolsets()` supports per-request dynamic credentials. `MCPServer` exposes Mastra tools, agents, and workflows as an MCP endpoint. `requireToolApproval` on a server definition triggers human-in-the-loop approval before execution.
- Agents as tools: adding subagents via `agents: { writer }` in the `Agent` constructor auto-wraps each as a tool named `agent-<key>`.
- Workflows as tools: adding workflows via `workflows: { researchWorkflow }` wraps each as `workflow-<key>`.
- Runtime control: `toolChoice` and `activeTools` can be passed to `.generate()` or `.stream()`.

**Primitive / API.** `createTool`, `MCPClient`, `MCPServer`, `agent.hooks` — sources: https://mastra.ai/docs/agents/using-tools, https://mastra.ai/docs/mcp/overview

**INDRA analog / gap.** INDRA has no tool-calling or MCP integration — identified as a current gap.

---

## 3. Memory

**What it provides.** Memory is a distinct `@mastra/memory` package attached to `Agent` via `memory: new Memory({...})`. It provides four composable layers:

- **Message history**: scoped by `resource` + `thread` identifiers; `lastMessages: N` controls the window.
- **Observational memory** (recommended for long sessions): background agents compress old messages into dense observation logs, keeping context window small while preserving long-term recall.
- **Working memory**: persistent structured state (name, preferences, goals) written as a template into context; the agent updates it as facts are learned.
- **Semantic recall**: embeds messages into a vector store and retrieves semantically similar past messages at query time; configurable `topK` and `messageRange`.

Storage backends are pluggable: `LibSQLStore`, `PgStore`, others. Vector backends: `LibSQLVector`, `PgVector`, Pinecone, Qdrant, MongoDB. Memory processors can filter, trim, or prioritize before context injection. In multi-agent systems, delegation automatically scopes subagent memory (unique `threadId` per delegation, stable deterministic `resourceId` per user–agent pair).

**Primitive / API.** `new Memory({ storage, vector, embedder, options: { lastMessages, observationalMemory, workingMemory, semanticRecall } })` — source: https://mastra.ai/docs/memory/overview

**INDRA analog / gap.** INDRA has a namespaced STM whiteboard (`&context`, `&user`, `&signals`) that provides turn-scoped state, but has no message history persistence, no semantic recall, no vector store, and no long-term memory across sessions. All four Mastra memory layers are gaps.

---

## 4. RAG / knowledge / embeddings / vector stores

**What it provides.** `@mastra/rag` provides `MDocument` for document ingestion. Chunking strategies include recursive, sliding window, and others. Embeddings are generated via `embedMany()` using `ModelRouterEmbeddingModel('provider/model')`. GraphRAG is a named variant that builds a knowledge graph over chunks. Vector stores: pgvector (`@mastra/pg`), Pinecone, Qdrant, MongoDB, LibSQL. Retrieval is a separate documented step: `pgVector.query({ indexName, queryVector, topK })`. RAG results are typically injected into agent context via a tool or a workflow step.

**Primitive / API.** `MDocument`, `doc.chunk()`, `embedMany()`, `pgVector.upsert()`, `pgVector.query()` — source: https://mastra.ai/docs/rag/overview

**INDRA analog / gap.** INDRA has no RAG, embeddings, or vector store integration — full gap.

---

## 5. Multi-agent orchestration

**What it provides.** Mastra supports several patterns:

- **Supervisor / subagent**: add `agents: { writer }` to a parent `Agent`; Mastra wraps each as a tool. The supervisor LLM decides when to delegate.
- **Handoffs**: transfer control from one agent to another via workflows; ownership moves to the next agent rather than returning through a coordinator.
- **Agent networks** (deprecated `networks`, superseded by supervisor + A2A/ACP): `agent.network()` and `agent.autonomousNetwork()` methods exist in current code for streaming multi-agent interactions with completion validation, `maxIterations`, and `maxTokens` safety limits.
- **A2A / ACP** (new, flagged): agent-to-agent protocol and agent communication protocol pages exist in the current doc nav.
- Memory is automatically scoped per delegation: each subagent gets a fresh thread and a deterministic `resourceId`.

**Primitive / API.** `Agent({ agents: { subagent } })`, `agent.autonomousNetwork()`, A2A/ACP — sources: https://mastra.ai/docs/agents/supervisor-agents, https://mastra.ai/docs/agents/a2a, https://github.com/mastra-ai/mastra/blob/main/docs/src/content/en/guides/concepts/multi-agent-systems.mdx

**INDRA analog / gap.** INDRA has `await:` (call stack delegation — spawn child interpreter, resume parent) and `become:` (same with persona change), which is a structural analog to Mastra's supervisor pattern. INDRA lacks: LLM-driven routing decisions between agents, network-level patterns, A2A/ACP protocol support.

---

## 6. Workflows / control flow

**What it provides.** Workflows (`createWorkflow` / `createStep` from `@mastra/core/workflows`) are the deterministic execution primitive. Steps have `inputSchema`, `outputSchema`, and `stateSchema`; data flows typed between steps. Control flow operators: `.then()` (sequential), `.parallel()`, `.branch()` / conditional branching, `.map()` for fan-out, nested workflows via `cloneWorkflow()`. Workflows can be used as steps in larger workflows.

Suspend/resume: any step can call `await suspend(payload)`, which snapshots the full execution state to storage (a "snapshot") and parks the run. `workflow.resume(runId, stepId, resumeData)` restores from snapshot and continues. `suspendSchema` and `resumeSchema` are typed. Workflow run status is a discriminated union: `success | failed | suspended | tripwire | paused`. `restartAllActiveWorkflowRuns()` handles server-restart recovery.

Scheduled workflows are a documented feature (cron-like triggers). Inngest is a supported external workflow runner providing step memoization and automatic retries.

**Primitive / API.** `createWorkflow`, `createStep`, `suspend()`, `resume()`, `stateSchema`, `setState()` — sources: https://mastra.ai/docs/workflows/overview, https://mastra.ai/docs/workflows/suspend-and-resume, https://mastra.ai/docs/workflows/snapshots

**INDRA analog / gap.** INDRA has a rich IR-based control flow (branches, `when:` guards, `await:` for sub-programs, `become:`, `say:` for routing). State lives on the STM whiteboard. INDRA lacks: durable snapshot-to-storage, cross-restart resume, typed suspend/resume payloads, scheduled triggers, external runner integration (Inngest).

---

## 7. Model-provider abstraction

**What it provides.** A unified model router supports 124 providers and 4,243+ models (as of the live docs) via a `"provider/model-name"` string. Reads provider API keys from environment variables automatically. Features: dynamic model selection via `requestContext`, model fallback chains (try primary → fallback list, each with `maxRetries`), per-fallback `modelSettings` and `providerOptions`, provider-specific options (`reasoningEffort`, `cacheControl`, etc.), local model support via OpenAI-compatible endpoints, and AI SDK provider modules (`groq('...')`) as a direct escape hatch. Auto-refreshes local model list hourly in development.

**Primitive / API.** `model: "provider/model-name"` or `model: [{ model, maxRetries }, ...]` on `Agent` constructor — source: https://mastra.ai/models

**INDRA analog / gap.** INDRA has bounded BAML inference points but no runtime model-provider abstraction, no provider routing, no fallback chains, and no unified multi-provider registry.

---

## 8. Structured output / typed responses

**What it provides.** `agent.generate(prompt, { structuredOutput: { schema } })` returns `response.object` validated against the schema (Zod, Valibot, ArkType, or raw JSON Schema). Three error strategies: `strict` (throw), `warn` (log and continue), `fallback` (return `fallbackValue`). For models that do not support `response_format`, `jsonPromptInjection: true` injects the schema into the system prompt instead. A separate structuring model can be provided via `structuredOutput.model` for two-pass extraction. Tools and structured output can be combined in separate steps via `prepareStep`. Streaming structured output emits `object-result` chunks and resolves `stream.object`.

**Primitive / API.** `agent.generate(prompt, { structuredOutput: { schema, model?, jsonPromptInjection?, errorStrategy? } })` — source: https://mastra.ai/docs/agents/structured-output

**INDRA analog / gap.** INDRA has typed inference points via BAML (schema-validated return types on every LLM call) — this is a direct functional analog. INDRA's approach is more rigorous (every inference is typed by construction) but less ergonomic for ad-hoc structured extraction during a free agent loop.

---

## 9. Streaming

**What it provides.** `agent.stream()` returns `textStream` (incremental token chunks), `stream.text` (full-text promise), `stream.finishReason`, `stream.usage`, `stream.toolCalls`, `stream.toolResults`, `stream.steps`, and `stream.object` (for structured output). Workflow `run.stream()` emits structured lifecycle events (`workflow-start`, step status events, etc.) rather than raw text. AI SDK v5 compatibility via `toAISdkV5Stream()` from `@mastra/ai-sdk`. `streamLegacy()` supports AI SDK v4 models. Background task streaming via `agent.streamUntilIdle()`.

**Primitive / API.** `agent.stream()`, `run.stream()`, `stream.textStream`, `stream.fullStream` — source: https://mastra.ai/docs/streaming/overview

**INDRA analog / gap.** INDRA has no token streaming — identified as a current gap.

---

## 10. Human-in-the-loop

**What it provides.** Implemented at two levels:

- **Workflow level**: any step can `await suspend(payload)` with a typed `suspendSchema`. The workflow parks with status `suspended`. An external system calls `run.resume(runId, stepId, resumeData)` after human action. `bail()` is an escape hatch for rejection paths. The approval workflow pattern is a documented first-class example.
- **Agent level**: `agent-approval` page documents pausing agent execution for human approval before continuing. MCP tool approval: `requireToolApproval: true` on a server definition triggers the approval flow before any tool from that server executes.

**Primitive / API.** `suspend()`, `resume()`, `bail()`, `suspendSchema`, `resumeSchema`, `requireToolApproval` — sources: https://mastra.ai/docs/workflows/human-in-the-loop, https://mastra.ai/docs/agents/agent-approval, https://mastra.ai/docs/mcp/overview

**INDRA analog / gap.** INDRA has no human-in-the-loop interrupt mechanism — full gap.

---

## 11. State & persistence / durable execution

**What it provides.** Workflow state (`stateSchema`, `setState()`, `state`) is shared across steps and survives suspend/resume cycles. Snapshots are the underlying persistence mechanism: when a step suspends, the full execution state serializes to the configured storage backend. On resume the snapshot restores execution at the exact suspension point. Active runs can be listed and restarted after server restarts via `restartAllActiveWorkflowRuns()`. Storage backends are pluggable (LibSQL, PostgreSQL, DuckDB for metrics, ClickHouse for production logs). For advanced durability (step memoization, automatic retries, external monitoring), workflows can be deployed to Inngest.

**Primitive / API.** `stateSchema`, `setState()`, snapshot-to-storage, `restartAllActiveWorkflowRuns()`, Inngest runner — sources: https://mastra.ai/docs/workflows/snapshots, https://mastra.ai/docs/workflows/workflow-state, https://mastra.ai/docs/deployment/workflow-runners

**INDRA analog / gap.** INDRA has STM-backed state with staged-vs-immediate writes committed atomically at turn boundaries — this is an analog for within-turn state. INDRA has no cross-restart durability, no snapshot persistence, and no external durable execution runner.

---

## 12. Observability / tracing / evals

**What it provides.**

- **Observability** (`@mastra/observability`): three correlated signals — OpenTelemetry-compatible traces (spans for every agent run, workflow step, tool call, model interaction), structured logs (auto-correlated to trace/span IDs), and metrics (duration, token counts, cost — derived from traces automatically). Exporters: `MastraStorageExporter` (local), `MastraPlatformExporter` (hosted), plus Langfuse, Datadog, and any OTel-compatible platform. `SensitiveDataFilter` span processor redacts passwords/tokens/keys.
- **Evals** (`@mastra/evals`): scorers are automated evaluators that return numeric scores (0–1). Types: textual (answer relevancy, toxicity, etc.), classification, prompt engineering. Scorers run live (async, sampling-controlled) or against historical traces. Scorers can be attached to agents or individual workflow steps. Results stored in `mastra_scorers` table. Studio UI provides score browsing, trace scoring, and experiment management.

**Primitive / API.** `new Observability({ configs: { default: { exporters, spanOutputProcessors } } })`, `createAnswerRelevancyScorer()`, `agent.scorers`, `step.scorers` — sources: https://mastra.ai/docs/observability/overview, https://mastra.ai/docs/evals/overview

**INDRA analog / gap.** INDRA has no observability, tracing, or eval infrastructure — full gap.

---

## 13. Deployment / serving / runtime

**What it provides.** Mastra applications build to a Hono-based HTTP server (`mastra build`). Runtime targets: Node.js ≥22.13.0, Bun, Deno, Cloudflare Workers. Deployment targets: Vercel, Netlify, Cloudflare (built-in deployers), Amazon EC2, AWS Lambda, Azure App Services, Digital Ocean, and any Node-compatible container/PaaS. Monorepo deployment follows the same path. The Mastra platform (hosted) provides server deployment, Studio (visual testing/debugging UI), and hosted observability across projects. Studio runs locally at `localhost:4111` via `npm run dev`.

**Primitive / API.** `mastra build`, `Mastra({ agents, workflows, storage, observability, mcpServers })`, platform deployer — source: https://mastra.ai/docs/deployment/overview

**INDRA analog / gap.** INDRA is currently a walking skeleton with no HTTP serving layer, no deployment targets, and no Studio-equivalent UI.

---

## What INDRA appears to lack relative to Mastra

The following capabilities are present in Mastra and absent or minimal in the current INDRA walking skeleton:

1. **Tool calling and MCP integration.** Mastra's `createTool` / `MCPClient` / `MCPServer` ecosystem is entirely absent from INDRA. This is the most immediately blocking gap for building real agents.

2. **Token streaming.** Mastra streams tokens incrementally from both agents and workflows. INDRA has no streaming path.

3. **Persistent memory across sessions.** Mastra's four-layer memory system (message history, observational memory, working memory, semantic recall) all require storage + optionally vector backends. INDRA's STM whiteboard is turn-scoped only.

4. **RAG and vector stores.** Document chunking, embedding, vector persistence, and semantic retrieval are completely absent from INDRA.

5. **Human-in-the-loop interrupts.** Mastra's `suspend()` / `resume()` pattern with typed payloads and MCP tool approval has no analog in INDRA.

6. **Cross-restart durable execution.** Mastra snapshots workflow state to storage and can restart from the last active step after a server failure. INDRA has no durability layer.

7. **Observability and tracing.** OTel-compatible spans, correlated logs, automatic token/cost metrics, and the live/trace eval scorer system are fully absent.

8. **Multi-provider model routing and fallback.** Mastra unifies 124+ providers behind a string; INDRA's BAML inference points are powerful for type safety but have no equivalent provider-routing, fallback chain, or dynamic model selection.

9. **Deployment / serving.** Mastra compiles to a deployable Hono server with cloud provider targets and a local Studio. INDRA has no serving layer.

10. **LLM-driven agent loop.** Mastra's open-ended `Agent` loop (tool-call → reason → continue until done) is architecturally separate from INDRA's deterministic IR interpreter with bounded inference points. INDRA's design is intentional — determinism is a goal — but it means INDRA cannot currently execute open-ended multi-step agent tasks without a human-authored Program IR.

---

*Sources consulted: https://mastra.ai/docs/agents/overview, https://mastra.ai/docs/agents/using-tools, https://mastra.ai/docs/mcp/overview, https://mastra.ai/docs/memory/overview, https://mastra.ai/docs/rag/overview, https://mastra.ai/docs/workflows/overview, https://mastra.ai/docs/workflows/suspend-and-resume, https://mastra.ai/docs/workflows/snapshots, https://mastra.ai/docs/streaming/overview, https://mastra.ai/docs/agents/structured-output, https://mastra.ai/docs/observability/overview, https://mastra.ai/docs/evals/overview, https://mastra.ai/docs/deployment/overview, https://mastra.ai/models*
