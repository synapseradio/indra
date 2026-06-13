# LangChain / LangGraph: Agentic Capability Catalog

## Design philosophy and division of labor

LangChain and LangGraph are two distinct but interlocking layers. LangChain is the component library: it provides the standardized chat-model interface, tool definitions, RAG primitives, structured-output helpers, and a high-level `create_agent` / `create_react_agent` harness that wires those pieces into a working agent without the caller touching a graph. LangGraph is the orchestration substrate: a low-level directed-graph runtime that executes stateful, long-running workflows with deterministic or agentic control flow, durable checkpointing, and first-class human-in-the-loop support. LangChain agents are ultimately compiled LangGraph graphs; you can use LangChain's harness without knowing that, or you can descend to LangGraph's graph API to take full control. LangSmith is the third layer — a hosted observability, evaluation, and deployment platform that wraps both. The overall bet is that the graph model is general enough to express every interesting agent topology, while the LangChain harness makes the 80-percent case nearly effortless.

---

## 1. Agent abstraction

**What it provides.** Two entry points coexist. The high-level LangChain harness (`create_agent`, recently superseded by `create_react_agent` from `langgraph.prebuilt`) binds a model, a list of tools, an optional system prompt, an optional structured-output schema, and an optional memory store into a ready-to-invoke agent in a single call. The low-level LangGraph path lets you build the same loop manually as a `StateGraph` — an explicit node for the LLM call, a node for tool execution, a conditional edge that checks whether the last message contained a tool call, and a back-edge from the tool node to the LLM node.

**Layer.** High-level harness: LangChain (`langchain.agents.create_agent`, `langgraph.prebuilt.create_react_agent`). Low-level graph-as-agent: LangGraph (`StateGraph`, nodes, conditional edges).

**Source.** <https://docs.langchain.com/oss/python/langchain/agents> · <https://docs.langchain.com/oss/python/langgraph/quickstart>

**INDRA note.** INDRA's conductor/actor loop is a structural analog to the ReAct loop, but it is declared in JSON IR rather than constructed in Python. The "graph-as-agent" flexibility — custom node topology, arbitrary loops, conditional branching — is not currently expressible in INDRA's fixed turn-cycle model. Gap: programmable graph topology.

---

## 2. Tools and function calling

**What it provides.** Tools are Python callables decorated with `@tool` (or defined as Pydantic/TypedDict schemas). Any decorated function becomes a typed callable the model can invoke. `BaseTool` is the base class for richer control. Tools are passed to `model.bind_tools(tools)` or directly to `create_agent`; the framework handles serializing the schema to the model's native function-calling format and deserializing the result.

**MCP support.** `langchain-mcp-adapters` provides a `MultiServerMCPClient` that connects to one or more MCP servers and converts their exposed tools into standard LangChain tools with `client.get_tools()`. Those tools then compose normally with any agent.

**Layer.** LangChain (`langchain.tools`, `langchain_mcp_adapters`).

**Source.** <https://docs.langchain.com/oss/python/langchain/mcp> · <https://docs.langchain.com/oss/python/langchain/rag>

**INDRA note.** INDRA's tool-calling/MCP integration is listed as not yet built. This is a direct, concrete gap.

---

## 3. Memory — short-term and long-term

**What it provides.** Two distinct systems serve different scopes.

Short-term (thread-level) memory is provided by checkpointers. Attaching an `InMemorySaver` (or a durable backend) to `builder.compile(checkpointer=...)` makes the graph automatically persist and restore its full state on every invocation when a `thread_id` is passed in config. The state includes the message list, so multi-turn conversation "just works."

Long-term (cross-session) memory is provided by stores (`langgraph.store.memory.InMemoryStore`, `PostgresStore`, Redis variants). A store is a namespaced key-value store. The agent reads from and writes to it via tools or directly within nodes via the `Runtime` object injected into node functions. Semantic search is supported when the store is initialized with an embedding model — `store.search(namespace, query=..., limit=n)` retrieves items by meaning rather than exact key.

**Layer.** LangGraph (`langgraph.checkpoint.*`, `langgraph.store.*`).

**Source.** <https://docs.langchain.com/oss/python/langgraph/add-memory> · <https://docs.langchain.com/oss/python/langgraph/persistence>

**INDRA note.** INDRA's STM whiteboard (`&context`/`&user`/`&signals`) handles short-term state within a session. It has no native long-term store, no semantic search, and no cross-session persistence. Gap: durable long-term store with semantic retrieval.

---

## 4. RAG / retrievers / embeddings / vector stores

**What it provides.** LangChain ships `langchain-text-splitters` for document chunking, an `init_embeddings` factory that routes to any supported embedding provider, and a `VectorStore` interface implemented by dozens of backends (Chroma, Pinecone, pgvector, FAISS, etc.). The typical RAG pattern wraps a vector store's `similarity_search` in a `@tool` decorated function and passes that tool to an agent. The agent decides when to call the retriever and folds the returned context into its response.

**Layer.** LangChain (`langchain_core.documents`, `langchain_text_splitters`, `langchain.embeddings.init_embeddings`, `langchain_core.vectorstores`).

**Source.** <https://docs.langchain.com/oss/python/langchain/rag>

**INDRA note.** INDRA has no RAG machinery, no embeddings abstraction, and no vector store integration. This is a complete gap.

---

## 5. Multi-agent orchestration

**What it provides.** Three patterns are documented.

The **supervisor** pattern uses `langgraph-supervisor`'s `create_supervisor(agents, model, prompt)` to build a graph in which a central LLM routes work to specialist subagents via handoff tools (`create_handoff_tool`). Each handoff tool issues a `Command(goto=agent_name, graph=Command.PARENT, update={...})` that moves control to the target subagent while updating the shared parent state.

The **subgraph / agent-as-tool** pattern wraps each specialist in its own compiled `StateGraph`, then exposes it as a `@tool`-decorated Python function that the orchestrating agent calls. Each subgraph may maintain its own private state schema.

The **swarm / network** pattern uses direct `Command(goto=...)` returns from any node to route freely between agents in a flat graph, without a designated supervisor.

**Layer.** LangGraph (`StateGraph`, `Command`, subgraph nodes); `langgraph-supervisor` package for the prebuilt supervisor.

**Source.** <https://github.com/langchain-ai/langgraph-supervisor-py/blob/main/README.md> · <https://docs.langchain.com/oss/python/langgraph/use-subgraphs>

**INDRA note.** INDRA's `await:` / `become:` delegation is a call-stack model that structurally resembles subgraph spawning. It does not have a supervisor primitive, swarm routing, or shared state across parallel agents. Gap: parallel multi-agent fan-out, supervisor routing, swarm topology.

---

## 6. Workflows and control flow

**What it provides.** `StateGraph` is the primary primitive. You define a typed state schema (TypedDict or Pydantic), add nodes (Python functions that receive the state and return a partial update), add edges (unconditional or conditional), and call `builder.compile()` to get a runnable. Conditional edges are implemented via `add_conditional_edges(source_node, router_fn, [possible_targets])` where the router is an ordinary Python function. `Command` objects returned from nodes combine a state update with a goto in a single step, enabling in-node routing. Cycles are native — the ReAct loop is just a back-edge.

A Functional API (`@entrypoint` / `@task` decorators) provides a more imperative style for developers who prefer writing Python control flow (`while True`, `if/else`) over explicit graph edges, while still gaining checkpointing and streaming.

**Layer.** LangGraph.

**Source.** <https://docs.langchain.com/oss/python/langgraph/quickstart> · <https://docs.langchain.com/oss/python/langgraph/use-graph-api> · <https://docs.langchain.com/oss/python/langgraph/functional-api>

**INDRA note.** INDRA has a comparable JSON-IR-declared graph with actors, branches, `when:` guards, `say:` routing, and `await:`/`become:` for delegation. The key differences are: INDRA's graph is a versioned data document (not Python code), routing logic is declarative rather than functional, and loops must be expressed through the IR structure. INDRA has no direct analog to `Command`'s in-node routing. Partial gap: no imperative-style functional API, no in-node routing primitive.

---

## 7. Model-provider abstraction

**What it provides.** LangChain provides a uniform `BaseChatModel` interface implemented by every major provider (`ChatOpenAI`, `ChatAnthropic`, `ChatGoogleGenerativeAI`, `ChatOllama`, etc.). `init_chat_model(model_string)` dispatches to the correct provider based on a string like `"openai:gpt-4o"` or `"claude-sonnet-4-6"`. The model is configurable at runtime via the config's `configurable` key, so the same graph can be invoked against different providers without code changes. Fallback chains (`model.with_fallbacks([backup])`) let you handle provider outages declaratively.

**Layer.** LangChain (`langchain.chat_models.init_chat_model`, provider integration packages).

**Source.** <https://docs.langchain.com/oss/python/langchain/models>

**INDRA note.** INDRA's inference points are typed function calls; the model/provider behind them is not yet abstracted at the framework level. Gap: multi-provider routing, runtime model switching, fallback chains.

---

## 8. Structured output / typed responses

**What it provides.** `llm.with_structured_output(Schema)` forces the model to return a validated instance of a Pydantic model, dataclass, TypedDict, or JSON schema dict. At the agent level, `create_agent(..., response_format=Schema)` adds a structured-output layer so the agent's final response is a typed object accessible at `result["structured_response"]`. Two strategies are available: `ProviderStrategy` (uses the model's native structured-output mode) and `ToolStrategy` (uses tool-calling to elicit the schema, with automatic retry on malformed output).

**Layer.** LangChain (`langchain_core.language_models`, `langchain.agents`).

**Source.** <https://docs.langchain.com/oss/python/langchain/structured-output>

**INDRA note.** INDRA's inference points already declare a typed, schema-validated return — this is a core design principle. INDRA has a structural analog here, though it applies only to its bounded inference points rather than to arbitrary agent outputs.

---

## 9. Streaming

**What it provides.** LangGraph's `graph.stream_events(input, config, version="v3")` returns a run stream with typed projections. `stream_mode` selects the projection: `"messages"` for token-level chat output, `"values"` for full state snapshots after each step, `"updates"` for per-node state deltas, `"custom"` for application-defined events, `"tools"` for tool lifecycle events, `"debug"` for internal Pregel diagnostics, and `"checkpoints"` for branching/time-travel envelopes. Multiple projections can be consumed concurrently without event loss. The LangChain model layer surfaces `astream_events()` and the `stream_mode="messages"` agent API for token streaming, including reasoning tokens from extended-thinking models.

**Layer.** LangGraph (`graph.stream`, `graph.stream_events`); LangChain (`model.astream_events`).

**Source.** <https://docs.langchain.com/oss/python/langgraph/event-streaming>

**INDRA note.** INDRA has no streaming layer. Token streaming, state-update events, and progress observability are all absent. This is a complete gap for any production UI use case.

---

## 10. Human-in-the-loop

**What it provides.** Any node can call `interrupt(payload)` to pause the graph at that point and surface the payload to the caller. The graph state is checkpointed at the interrupt. The caller reads `stream.interrupts`, presents the payload to a human, and resumes by invoking the graph again with `Command(resume=human_response)`. The `Command` primitive also supports `goto` routing in the resume path, so a human can approve, reject, or redirect the workflow. Time-travel (described below under persistence) allows replaying from any prior checkpoint, which subsumes rollback and retry for human review scenarios.

**Layer.** LangGraph (`langgraph.types.interrupt`, `Command`).

**Source.** <https://docs.langchain.com/oss/python/langgraph/interrupts>

**INDRA note.** INDRA has no interrupt mechanism. The `say:` primitive yields to a user turn, but it cannot pause mid-turn, serialize state, and resume later from an external trigger. Gap: durable mid-execution pause-and-resume for human oversight.

---

## 11. State and persistence / durable execution

**What it provides.** Every LangGraph graph can be compiled with a checkpointer that saves the full graph state — all state keys, the message list, pending tasks — as a checkpoint after each step. A `thread_id` scopes checkpoints to a conversation. Backends include `InMemorySaver` (development), `langgraph-checkpoint-postgres` (production relational), and Redis variants. `graph.get_state(config)` retrieves the current snapshot; `graph.get_state_history(config)` returns the full checkpoint history. `graph.update_state(config, values)` manually patches state, enabling fork-from-history workflows. This is the time-travel feature: you can replay from any historical checkpoint with or without modifications.

**Layer.** LangGraph (`langgraph.checkpoint.*`, `langgraph.store.*`).

**Source.** <https://docs.langchain.com/oss/python/langgraph/persistence> · <https://docs.langchain.com/oss/python/langgraph/use-time-travel>

**INDRA note.** INDRA's STM whiteboard provides staged-vs-immediate writes committed atomically at turn boundaries — this is a form of transactional state management. However, INDRA has no durable checkpointing, no cross-turn state replay, no time-travel, and no named-thread model for persistence. Gap: durable execution, resume after failure, time-travel.

---

## 12. Observability, tracing, and evaluation

**What it provides.** LangSmith is the dedicated observability layer. Setting `LANGSMITH_TRACING=true` automatically traces every run (LLM calls, tool calls, graph steps) to the LangSmith platform, where they are visualized as structured trees. LangSmith Engine applies automated heuristics over traces to detect anomalies and propose fixes. The evaluation API allows defining test datasets and running LLM-as-judge or deterministic evaluators against them. Traces can be annotated, shared, and used to build fine-tuning datasets. Sensitive fields can be masked with anonymizer callbacks before traces are sent.

**Layer.** LangSmith (external platform); LangChain provides the callback/tracer integration (`LangChainTracer`).

**Source.** <https://docs.langchain.com/oss/python/langgraph/observability>

**INDRA note.** INDRA has no tracing, no evaluation framework, and no integration with any observability platform. Gap: complete.

---

## 13. Deployment and serving

**What it provides.** `langgraph dev` starts an in-process development server at `localhost:2024` with a local Studio UI. For production, LangGraph Platform (hosted on LangSmith Cloud, or self-hosted) wraps a compiled graph in a REST API that exposes `/runs/stream`, `/runs`, and thread management endpoints. The `langgraph-sdk` Python client (`get_sync_client` / `get_client`) provides a typed wrapper over those endpoints. Deployed graphs are referenced by an `assistant_id` defined in `langgraph.json`. The platform handles persistent storage, background runs, and (per the docs) cron scheduling. The same streaming modes available in-process are exposed over HTTP.

**Layer.** LangGraph Platform / LangSmith (external infrastructure); `langgraph-sdk` (client library).

**Source.** <https://docs.langchain.com/oss/python/langgraph/deploy> · <https://docs.langchain.com/oss/python/langgraph/local-server>

**INDRA note.** INDRA has no serving layer, no REST API, no deployment infrastructure. Gap: complete.

---

## What INDRA appears to lack relative to LangChain/LangGraph

The following capabilities are present in LangChain/LangGraph and absent or only partially present in INDRA's current walking-skeleton implementation.

**Tool calling and MCP integration.** LangChain tools are first-class, schema-validated, and executable. MCP servers are natively bridged. INDRA lists this as not yet built.

**Programmable graph topology.** LangGraph's `StateGraph` lets developers express arbitrary loop, branch, and fan-out topologies in Python (or JSON via the functional API). INDRA's IR expresses a fixed conductor-driven turn cycle; the topology is data-declared but the range of expressible shapes is narrower.

**Durable checkpointing and time-travel.** Checkpointers persist and restore full graph state across failures, enabling resume-after-crash and replay-from-any-checkpoint. INDRA's STM commits state atomically within a session but has no cross-session durable backend and no replay mechanism.

**Long-term memory store with semantic search.** The `Store` abstraction provides namespaced, cross-session key-value storage with optional vector-similarity retrieval. INDRA has no equivalent.

**RAG pipeline primitives.** Document loaders, text splitters, embedding factories, and vector-store adapters are all provided by LangChain. INDRA has none of these.

**Token streaming and event observability.** LangGraph's `stream_events` API surfaces token-level output, per-node state deltas, tool lifecycle events, and custom application events as a typed stream. INDRA has no streaming layer.

**Human-in-the-loop interrupts.** The `interrupt()` / `Command(resume=...)` pair allows durable mid-execution pause-and-resume with external human input. INDRA's `say:` primitive yields to a user turn within a session but cannot serialize state and wait for an asynchronous external resume.

**Multi-provider model abstraction.** `init_chat_model` and `BaseChatModel` implementations provide a uniform interface across OpenAI, Anthropic, Google, Ollama, and many others, with runtime switching and fallback chains. INDRA's model binding is not yet abstracted at the framework level.

**Multi-agent supervisor and swarm topologies.** `langgraph-supervisor`'s `create_supervisor` and the `Command(goto=..., graph=Command.PARENT)` handoff pattern enable hierarchical and peer-to-peer multi-agent systems with shared parent state. INDRA's `await:`/`become:` is a strict call stack — no fan-out, no supervisor, no peer handoff with state sharing.

**Observability, tracing, and evaluation.** LangSmith provides full execution traces, automated anomaly detection, and a structured evaluation framework. INDRA has nothing comparable.

**Deployment and serving.** LangGraph Platform exposes a REST API over any compiled graph with background runs, persistent storage, and a management UI. INDRA has no serving layer.
