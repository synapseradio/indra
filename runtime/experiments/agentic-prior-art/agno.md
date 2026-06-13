# Agno — Agentic Prior Art Catalog

> Produced for INDRA gap analysis. Every load-bearing capability claim carries a cited URL or is marked `[?]`. Claims that cannot be verified from live docs are not made.

---

## Design Philosophy

Agno (formerly Phidata) positions itself as a high-performance, "pure Python" agent framework — "no graphs, chains, or convoluted patterns — just pure Python." Its central claim is minimal instantiation overhead: agents are created in approximately 3 microseconds using 6.6 KiB of memory each, benchmarked against LangGraph (1,587 µs / 161 KiB) and PydanticAI (170 µs / 29 KiB) on an Apple M4, by instantiating an agent with one tool 1,000 times. The authors caveat that inference latency dominates real-world runtime and that "accuracy and reliability matter more than speed." Architecturally, Agno layers three concerns: the SDK (pure-Python agent/team/workflow construction), AgentOS (a FastAPI-based production runtime that serves agents as REST APIs with SSE streaming, RBAC, and scheduling), and a control-plane UI (browser-based management). Data sovereignty is a first-class design goal: sessions, memories, traces, and knowledge live in the operator's own database, not Agno's cloud.

Sources: [Performance](https://docs.agno.com/performance) · [Introduction](https://docs.agno.com/introduction) · [AgentOS introduction](https://docs.agno.com/agent-os/introduction)

---

## 1. Agent Abstraction

**What it provides.** The core primitive is `agno.agent.Agent` — a stateful control loop wrapping a stateless language model. An agent builds context (system message, chat history, user memories, session state, knowledge references), sends it to the model, executes any tool calls the model returns, and repeats until the model emits a final response without tool calls.

**Key constructor parameters** (from the full API reference):
- `model` — any `Model` instance or `"provider:model_id"` string
- `tools`, `instructions`, `knowledge`, `memory_manager`, `storage`/`db`
- `reasoning`, `reasoning_model`, `reasoning_agent`, `reasoning_min_steps`, `reasoning_max_steps`
- `session_id`, `user_id`, `session_state`, `add_history_to_context`, `num_history_runs`
- `output_schema` — Pydantic model or JSON schema
- `stream`, `stream_events`, `pre_hooks`, `post_hooks`

**Reasoning agents.** Three distinct modes:
1. `reasoning=True` — activates the model's built-in chain-of-thought (works with OpenAI `o`-series, Gemini thinking, Anthropic extended thinking)
2. `reasoning_model=Model(thinking={"type": "enabled", "budget_tokens": N})` — delegates a separate model/call for the reasoning pass, then uses its output in the final answer
3. `ReasoningTools` — tool-based explicit chain-of-thought (think, analyze steps) that works with any model

**Run model.** `Agent.run()` (sync) / `Agent.arun()` (async) return a `RunOutput`. `background=True` makes long runs resumable even after client disconnect.

**INDRA analog / gap.** INDRA's conductor/turn-cycle + inference-points pattern is architecturally similar but is a *deterministic interpreter* of a JSON IR rather than an open-ended Python loop. INDRA has no reasoning-model delegation or `ReasoningTools` equivalent. INDRA's `become:` / `await:` delegation stack is more constrained than Agno's recursive team calls.

Sources: [Agents introduction](https://docs.agno.com/agents/introduction) · [Building agents](https://docs.agno.com/agents/building-agents) · [Running agents](https://docs.agno.com/agents/running-agents) · [Agent API reference](https://docs.agno.com/reference/agents/agent) · [Reasoning overview](https://github.com/agno-agi/docs/blob/main/reasoning/overview.mdx)

---

## 2. Tools / Function Calling

**What it provides.** Tools are ordinary Python functions with type hints and docstrings; Agno converts them to JSON schema automatically. The framework ships 120+ pre-built toolkits (web search, SQL, email, HackerNews, calculator, etc.). The run loop is: model decides → tool executes → result returned → model continues.

**Concurrency.** Tools execute concurrently when using `arun` or `aprint_response`.

**MCP support.** `MCPTools` (in `agno.tools.mcp`) connects to any MCP server via stdio, Streamable HTTP, or SSE. `MultiMCPTools` connects multiple servers simultaneously. Connection lifecycle: manual (`connect()`/`close()`), automatic context manager, or fully managed inside AgentOS.

**Dynamic toolkits.** The `tools` parameter accepts callable factories — tools are injected at runtime based on user role, session state, or other context.

**Built-in special parameters.** Tools can declare `run_context`, `agent`/`team` parameters and receive them automatically; also media parameters (`images`, `video`, `audio`, `files`) for multimodal tools.

**INDRA analog / gap.** INDRA's tool-calling is listed as not yet built. This is the most critical functional gap relative to Agno's first-class, deeply integrated tool system.

Sources: [Tools overview](https://docs.agno.com/agents/tools) · [MCP tools](https://docs.agno.com/tools/mcp)

---

## 3. Memory

**What it provides.** Agno distinguishes two memory dimensions:

- **Session history** — conversation messages stored per session, surfaced to the model via `add_history_to_context=True` / `num_history_runs`.
- **User memories** — facts extracted about a user across sessions ("Sarah prefers email"), stored in a dedicated database table (`agno_memories` by default; configurable). Postgres, SQLite, and MongoDB are named backends.

**Two extraction modes:**
- `update_memory_on_run=True` — automatic background extraction after every run
- `enable_agentic_memory=True` — agent decides what to remember, with full tool control over memory CRUD

**Session summaries** — `enable_session_summaries=True` auto-generates a summary after each run and can inject it into subsequent contexts.

**INDRA analog / gap.** INDRA's `&user` namespace on the STM whiteboard is a structural analog to user memories (keyed facts persisted per user), and `&context` is analogous to session state. Neither persistent cross-session user memory extraction nor vector-backed semantic recall exists in INDRA today.

Sources: [Agent memory](https://docs.agno.com/agents/memory) · [Agent API reference](https://docs.agno.com/reference/agents/agent)

---

## 4. RAG / Knowledge / Embeddings / Vector DBs

**What it provides.** `Knowledge` objects attach a retrieval-augmented context layer to an agent. Documents (PDF, DOCX, CSV, Markdown, URLs, raw text) are ingested, chunked, embedded, and stored in a vector database. At query time the agent autonomously decides whether to search the knowledge base (agentic RAG — the default).

**Write-back.** Agents can save discovered insights back to the knowledge base via `update_knowledge=True`, enabling incremental learning.

**Knowledge filters.** `knowledge_filters` pass metadata constraints; `enable_agentic_knowledge_filters=True` lets the agent choose its own filters.

**Supported vector databases.** The docs claim 20+ vector databases; named examples include LanceDB, ChromaDB, Pinecone, and Weaviate.

**INDRA analog / gap.** INDRA has no RAG, embeddings, knowledge base, or vector DB layer.

Sources: [Knowledge introduction](https://docs.agno.com/knowledge/introduction) · [Agent API reference](https://docs.agno.com/reference/agents/agent)

---

## 5. Multi-Agent Orchestration

**What it provides.** The `Team` primitive composes agents into a leader/member hierarchy. The leader receives the request and orchestrates members.

**TeamMode options:**
- `Route` — leader picks one member; that member responds directly (`respond_directly=True`)
- `Coordinate` (default) — leader evaluates, selectively involves members, synthesizes
- `Broadcast` — leader sends to all members in parallel
- `Collaborate` — members work together with shared coordination

**Agent-as-tool.** The callable-factory pattern for `members` enables agents to serve as reusable components in larger pipelines.

**Why teams.** Specialization (each agent masters a narrow domain), parallelism, clear accountability, and extending past a single context window.

**INDRA analog / gap.** INDRA's `await:` / `become:` delegation is a call-stack model but does not have named orchestration modes, team-level shared context, or true parallel-member execution. INDRA has no broadcast or route-mode equivalent.

Sources: [Teams introduction](https://docs.agno.com/teams/introduction) · [Teams overview](https://docs.agno.com/teams/overview)

---

## 6. Workflows / Control Flow

**What it provides.** `Workflow` is a first-class orchestration primitive that composes agents, teams, Python functions, and nested workflows as an ordered collection of steps. Execution can be sequential, parallel, conditional (on prior step output), or looped. Step output flows to the next step.

**Determinism emphasis.** The docs position Workflows as the choice for "predictable, repeatable execution" with "consistent results across runs" — contrasted with Teams, which are preferred when agents need to "coordinate dynamically."

**State.** Steps share output via flow; `session_state` on individual agents can persist state across steps. Specific workflow-level state-variable API beyond pass-through is not detailed in the docs reviewed.

**INDRA analog / gap.** INDRA's Program IR (actors, branches, `when:` guards, `set:` statements, terminators) is architecturally closer to Agno Workflows than to Agno Teams — both are deterministic, versioned, and explicit about control flow. Key differences: INDRA's IR is a versioned JSON document (schema-validated, diffable), whereas Agno Workflows are Python class instances. INDRA lacks parallel step execution.

Sources: [Workflows introduction](https://docs.agno.com/workflows/introduction) · [Workflows overview](https://docs.agno.com/workflows/overview)

---

## 7. Model-Provider Abstraction

**What it provides.** Every agent takes a `model` parameter accepting either a provider-specific `Model` subclass or a `"provider:model_id"` string. Provider classes share a common interface; switching providers is a one-line change.

**Supported providers (49+ total at last count):**

| Category | Examples |
|---|---|
| Native providers | Anthropic, OpenAI, OpenAI Responses, Google Gemini, Mistral, Cohere, DeepSeek, xAI, Meta, Perplexity |
| Local inference | Ollama, LlamaCpp, LM Studio, vLLM |
| Cloud-managed | AWS Bedrock, Azure OpenAI, Azure AI Foundry, Vertex AI, IBM WatsonX |
| Gateways / aggregators | LiteLLM, OpenRouter, Groq, Fireworks, Together, Cerebras, Portkey, Hugging Face, NVIDIA, and more |

**Retry / resilience.** `Model` classes accept `retries`, `retry_delay`, `exponential_backoff`.

**Reasoning-model delegation.** A separate `reasoning_model` (or `reasoning_agent`) can be a different provider than the response model.

**INDRA analog / gap.** INDRA's inference points are model-agnostic in principle but currently have no multi-provider abstraction layer. Switching providers requires external wiring outside the runtime.

Sources: [Models introduction](https://docs.agno.com/models/introduction) · [Model index](https://docs.agno.com/models/providers/model-index)

---

## 8. Structured Output / Typed Responses

**What it provides.** The `output_schema` parameter on `Agent` accepts a Pydantic `BaseModel` subclass or a plain JSON schema dict. The agent returns a validated instance of that model rather than raw text. The parameter `structured_outputs=True` uses model-native structured output enforcement (where available); `use_json_mode=True` falls back to JSON enforcement.

**Secondary parsing.** `parser_model` / `output_model` designate a separate model pass to coerce responses into the schema, useful when the primary model does not support native structured output.

**INDRA analog / gap.** INDRA's inference points return schema-validated typed values — this is structurally equivalent and is a deliberate design match. INDRA does not have a fallback parser-model pattern for coercion.

Sources: [Structured output](https://docs.agno.com/agents/structured-output) · [Agent API reference](https://docs.agno.com/reference/agents/agent)

---

## 9. Streaming

**What it provides.** Two streaming modes:

- `stream=True` — standard token streaming; returns an iterator of `RunOutputEvent` objects (model response chunks)
- `stream_events=True` — full event streaming; exposes all internal states as a typed event stream

**Named event types** (from `agno.run.agent.RunEvent`):
- Core: `RunStarted`, `RunContent`, `RunCompleted`, `RunError`, `RunCancelled`
- Tool: `ToolCallStarted`, `ToolCallCompleted`
- Reasoning: `ReasoningStarted`, `ReasoningStep`, `ReasoningCompleted`
- Memory: `MemoryUpdateStarted`, `MemoryUpdateCompleted`
- Control: `RunPaused`, `RunContinued`

**Custom events.** Tools can yield `CustomEvent` subclasses into the stream.

**Background streaming.** `background=True` enables resumable SSE streaming — the agent continues running even if the client disconnects, with automatic event buffering and reconnection.

**INDRA analog / gap.** INDRA does not have token streaming or an event streaming model. No equivalent of `RunPaused` / `RunContinued` for resumable streaming exists.

Sources: [Running agents](https://docs.agno.com/agents/running-agents)

---

## 10. Human-in-the-Loop

**What it provides.** The `@tool(requires_confirmation=True)` decorator pauses agent execution before a tool call and surfaces an `active_requirements` list on the `RunResponse`. The calling code inspects these requirements, gets user input, sets `requirement.confirmed = True/False`, then calls `agent.continue_run(run_id=..., requirements=...)` to resume.

**Async support.** `acontinue_run()` for async flows.

**Audit approvals.** The `@approval(type="audit")` decorator persists an approval record to the database after resolution, providing an auditable log of confirmed and rejected tool calls.

**RunPaused event.** The `RunPaused` stream event integrates HITL into the event streaming model — UIs can intercept it and render a confirmation dialog.

**INDRA analog / gap.** INDRA currently has no human-in-the-loop interrupt mechanism. The `say:` router yields to the user between turns, but there is no within-turn pause-on-tool-call primitive.

Sources: [Human-in-the-loop](https://github.com/agno-agi/docs/blob/main/hitl/user-confirmation.mdx) · [Examples/basics/human-in-the-loop](https://github.com/agno-agi/docs/blob/main/examples/basics/human-in-the-loop.mdx) · [Audit approval async](https://github.com/agno-agi/docs/blob/main/examples/agents/approvals/audit-approval-async.mdx)

---

## 11. State and Persistence / Durable Execution

**What it provides.** Session persistence is controlled by the `db` parameter on `Agent` — any `BaseDb` implementation (SQLite, Postgres, MongoDB named). On each run, Agno stores conversation history, session state, tool call history, and learned memories to the attached database. Resumption: pass the same `session_id` on subsequent runs to restore full context.

**Session state.** `session_state: Dict[str, Any]` on the `Agent` is mutable per-run state persisted across runs and optionally included in the model prompt. `enable_agentic_state=True` gives the agent tool-level write access to update session state during execution.

**Durability.** AgentOS adds infrastructure-level durability: stateless runtime nodes with state in the database, horizontal scaling, leader-election, and resilience across restarts and replica failures.

**INDRA analog / gap.** INDRA's STM-backed whiteboard (`&context`, `&user`, `&signals`) is the conceptual analog to session state. INDRA currently lacks a persistence backend — all state is in-process and ephemeral across sessions. No durable execution / session-resume layer exists.

Sources: [Agent storage](https://docs.agno.com/agents/storage) · [AgentOS introduction](https://docs.agno.com/agent-os/introduction) · [Agent API reference](https://docs.agno.com/reference/agents/agent)

---

## 12. Observability / Tracing / Evals

### Observability and tracing

**Native tracing.** Every `agent.run()` / `arun()` call produces a hierarchical trace: spans for model interactions (prompts, responses, token counts), tool invocations (arguments, results), team coordination, and workflow steps. Traces are stored in the operator's SQLite or Postgres database. Session ID, run ID, and agent ID annotate every span.

**OpenTelemetry.** Agno uses OpenTelemetry as its primary observability transport. Auto-instrumentation covers agents and tools. Supported OTLP backends: Langfuse, LangSmith, Arize Phoenix, Langtrace, Logfire, Maxim, MLflow, OpenLIT, Traceloop, Weave.

**Debug mode.** `debug_mode=True` on the agent or `AGNO_DEBUG=True` env var prints messages sent to the model, intermediate steps, token usage, execution time, and tool call/error details. `debug_level=2` increases verbosity.

### Evaluation framework

Three eval primitives:
- `AccuracyEval` — measures whether agent output matches expected output, with a configurable LLM-as-judge evaluator agent (`AccuracyAgentResponse` schema)
- `AgentAsJudgeEval` — flexible scoring (binary or numeric) against a natural-language criteria string; supports custom evaluator agents, async, batch evaluation, and database-persisted results
- Performance and reliability evals (referenced in the docs sitemap) — [?] details not retrieved

Evals integrate as `pre_hooks` / `post_hooks` on agents, enabling automatic evaluation on every run with token tracking separated by model.

**INDRA analog / gap.** INDRA has no observability layer, no tracing, and no evaluation framework.

Sources: [Observability overview / OpenTelemetry](https://docs.agno.com/observability/overview) · [Tracing overview](https://docs.agno.com/tracing/overview) · [Debugging agents](https://docs.agno.com/agents/debugging-agents) · [Langfuse](https://docs.agno.com/observability/langfuse) · [LangSmith](https://docs.agno.com/observability/langsmith) · [AgentAsJudge eval](https://github.com/agno-agi/docs/blob/main/evals/agent-as-judge/overview.mdx) · [AccuracyEval overview](https://github.com/agno-agi/docs/blob/main/evals/accuracy/overview.mdx)

---

## 13. Deployment / Serving / Runtime

**AgentOS.** A FastAPI application that serves the agent platform as a live REST + SSE service. Key characteristics:
- 50+ pre-built REST endpoints with SSE-compatible streaming
- JWT-based RBAC with hierarchical scopes; multi-tenant session isolation
- Built-in scheduler, worker pools, and leader-election for multi-replica deployments
- Every run and action logged; traces stored locally (no third-party data egress)
- Human-in-the-loop approval flows and guardrails built in
- Interfaces: Slack, Telegram, WhatsApp, Discord, AG-UI protocol
- Framework-agnostic: supports Agno SDK, Claude Agent SDK, LangGraph, DSPy agents in the same runtime

**Custom FastAPI.** The `Bring Your Own FastAPI App` path lets teams embed Agno agents into an existing FastAPI service.

**Deployment targets.** Docker, AWS, Railway templates provided.

**INDRA analog / gap.** INDRA has no serving layer, no HTTP/REST transport, no RBAC, no scheduler, and no production runtime. It is a library-level interpreter with no deployment story.

Sources: [AgentOS overview](https://docs.agno.com/agent-os/overview) · [AgentOS introduction](https://docs.agno.com/agent-os/introduction) · [Bring your own FastAPI](https://docs.agno.com/agent-os/custom-fastapi/overview) · [Deploy](https://docs.agno.com/runtime/deploy)

---

## What INDRA Appears to Lack Relative to Agno

The following capabilities exist in Agno as production-grade, documented features and are absent or only nascent in INDRA:

**Critical functional gaps (nothing analogous in INDRA today):**

1. **Tool calling / MCP.** Agno's entire tool system — automatic JSON-schema generation, 120+ toolkits, concurrent tool execution, and MCP client — is the beating heart of its agents. INDRA has no tool-execution layer.

2. **RAG / Knowledge / Vector DBs.** Agno provides document ingestion, chunking, embedding, and 20+ vector DB backends as a first-class `Knowledge` primitive. INDRA has no retrieval layer.

3. **Streaming.** Token streaming (`stream=True`) and full event streaming (`stream_events=True`) with a typed event model and resumable background runs. INDRA has no streaming.

4. **Multi-provider model abstraction.** 49+ provider classes sharing a common interface. INDRA has no provider abstraction layer.

5. **Persistent sessions / durable execution.** Database-backed session resumption (SQLite, Postgres, MongoDB). INDRA's whiteboard is in-process and ephemeral.

6. **Human-in-the-loop interrupts.** `@tool(requires_confirmation=True)` + `continue_run()` for within-turn approval gates. INDRA has no mid-turn interrupt primitive.

7. **Observability and tracing.** Native span-level traces + OpenTelemetry export to 10+ backends + LLM-as-judge eval framework. INDRA has none.

8. **Production serving (AgentOS).** FastAPI runtime with 50+ endpoints, JWT RBAC, multi-tenancy, scheduling, SSE streaming, and horizontal scaling. INDRA has no serving layer.

**Structural differences (INDRA has analogs but the shapes differ):**

9. **Multi-agent orchestration modes.** Agno Teams have named coordination modes (Route / Coordinate / Broadcast / Collaborate) and parallel member execution. INDRA's `await:`/`become:` is a serial call stack with no parallel-branch semantics.

10. **Long-term user memory extraction.** Agno extracts and persists user-fact memories across sessions automatically. INDRA's `&user` namespace exists but has no automatic extraction or cross-session persistence.

11. **Reasoning-model delegation.** Separate model or thinking budget for the reasoning pass. INDRA has no equivalent meta-cognitive routing.
