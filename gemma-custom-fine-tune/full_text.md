# <https://openai.github.io/openai-agents-python/> llms-full.txt

## OpenAI Agents Quickstart

[Skip to content](https://openai.github.io/openai-agents-python/quickstart/#quickstart)

## Create a project and virtual environment

You'll only need to do this once.

```md-code__content
mkdir my_project
cd my_project
python -m venv .venv

```

### Activate the virtual environment

Do this every time you start a new terminal session.

```md-code__content
source .venv/bin/activate

```

### Install the Agents SDK

```md-code__content
pip install openai-agents # or `uv add openai-agents`, etc

```

### Set an OpenAI API key

If you don't have one, follow [these instructions](https://platform.openai.com/docs/quickstart#create-and-export-an-api-key) to create an OpenAI API key.

```md-code__content
export OPENAI_API_KEY=sk-...

```

## Create your first agent

Agents are defined with instructions, a name, and optional config (such as `model_config`)

```md-code__content
from agents import Agent

agent = Agent(
    name="Math Tutor",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

```

## Add a few more agents

Additional agents can be defined in the same way. `handoff_descriptions` provide additional context for determining handoff routing

```md-code__content
from agents import Agent

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

```

## Define your handoffs

On each agent, you can define an inventory of outgoing handoff options that the agent can choose from to decide how to make progress on their task.

```md-code__content
triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent]
)

```

## Run the agent orchestration

Let's check that the workflow runs and the triage agent correctly routes between the two specialist agents.

```md-code__content
from agents import Runner

async def main():
    result = await Runner.run(triage_agent, "What is the capital of France?")
    print(result.final_output)

```

## Add a guardrail

You can define custom guardrails to run on the input or output.

```md-code__content
from agents import GuardrailFunctionOutput, Agent, Runner
from pydantic import BaseModel

class HomeworkOutput(BaseModel):
    is_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about homework.",
    output_type=HomeworkOutput,
)

async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HomeworkOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_homework,
    )

```

## Put it all together

Let's put it all together and run the entire workflow, using handoffs and the input guardrail.

```md-code__content
from agents import Agent, InputGuardrail,GuardrailFunctionOutput, Runner
from pydantic import BaseModel
import asyncio

class HomeworkOutput(BaseModel):
    is_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about homework.",
    output_type=HomeworkOutput,
)

math_tutor_agent = Agent(
    name="Math Tutor",
    handoff_description="Specialist agent for math questions",
    instructions="You provide help with math problems. Explain your reasoning at each step and include examples",
)

history_tutor_agent = Agent(
    name="History Tutor",
    handoff_description="Specialist agent for historical questions",
    instructions="You provide assistance with historical queries. Explain important events and context clearly.",
)

async def homework_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HomeworkOutput)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_homework,
    )

triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's homework question",
    handoffs=[history_tutor_agent, math_tutor_agent],
    input_guardrails=[\
        InputGuardrail(guardrail_function=homework_guardrail),\
    ],
)

async def main():
    result = await Runner.run(triage_agent, "who was the first president of the united states?")
    print(result.final_output)

    result = await Runner.run(triage_agent, "what is life")
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())

```

## View your traces

To review what happened during your agent run, navigate to the [Trace viewer in the OpenAI Dashboard](https://platform.openai.com/traces) to view traces of your agent runs.

## Next steps

Learn how to build more complex agentic flows:

- Learn about how to configure [Agents](https://openai.github.io/openai-agents-python/agents/).
- Learn about [running agents](https://openai.github.io/openai-agents-python/running_agents/).
- Learn about [tools](https://openai.github.io/openai-agents-python/tools/), [guardrails](https://openai.github.io/openai-agents-python/guardrails/) and [models](https://openai.github.io/openai-agents-python/models/).

## Understanding OpenAI Agents

[Skip to content](https://openai.github.io/openai-agents-python/agents/#agents)

# Agents

Agents are the core building block in your apps. An agent is a large language model (LLM), configured with instructions and tools.

## Basic configuration

The most common properties of an agent you'll configure are:

- `instructions`: also known as a developer message or system prompt.
- `model`: which LLM to use, and optional `model_settings` to configure model tuning parameters like temperature, top\_p, etc.
- `tools`: Tools that the agent can use to achieve its tasks.

```md-code__content
from agents import Agent, ModelSettings, function_tool

@function_tool
def get_weather(city: str) -> str:
    return f"The weather in {city} is sunny"

agent = Agent(
    name="Haiku agent",
    instructions="Always respond in haiku form",
    model="o3-mini",
    tools=[get_weather],
)

```

## Context

Agents are generic on their `context` type. Context is a dependency-injection tool: it's an object you create and pass to `Runner.run()`, that is passed to every agent, tool, handoff etc, and it serves as a grab bag of dependencies and state for the agent run. You can provide any Python object as the context.

```md-code__content
@dataclass
class UserContext:
  uid: str
  is_pro_user: bool

  async def fetch_purchases() -> list[Purchase]:
     return ...

agent = Agent[UserContext](
    ...,
)

```

## Output types

By default, agents produce plain text (i.e. `str`) outputs. If you want the agent to produce a particular type of output, you can use the `output_type` parameter. A common choice is to use [Pydantic](https://docs.pydantic.dev/) objects, but we support any type that can be wrapped in a Pydantic [TypeAdapter](https://docs.pydantic.dev/latest/api/type_adapter/) \- dataclasses, lists, TypedDict, etc.

```md-code__content
from pydantic import BaseModel
from agents import Agent

class CalendarEvent(BaseModel):
    name: str
    date: str
    participants: list[str]

agent = Agent(
    name="Calendar extractor",
    instructions="Extract calendar events from text",
    output_type=CalendarEvent,
)

```

Note

When you pass an `output_type`, that tells the model to use [structured outputs](https://platform.openai.com/docs/guides/structured-outputs) instead of regular plain text responses.

## Handoffs

Handoffs are sub-agents that the agent can delegate to. You provide a list of handoffs, and the agent can choose to delegate to them if relevant. This is a powerful pattern that allows orchestrating modular, specialized agents that excel at a single task. Read more in the [handoffs](https://openai.github.io/openai-agents-python/handoffs/) documentation.

```md-code__content
from agents import Agent

booking_agent = Agent(...)
refund_agent = Agent(...)

triage_agent = Agent(
    name="Triage agent",
    instructions=(
        "Help the user with their questions."
        "If they ask about booking, handoff to the booking agent."
        "If they ask about refunds, handoff to the refund agent."
    ),
    handoffs=[booking_agent, refund_agent],
)

```

## Dynamic instructions

In most cases, you can provide instructions when you create the agent. However, you can also provide dynamic instructions via a function. The function will receive the agent and context, and must return the prompt. Both regular and `async` functions are accepted.

```md-code__content
def dynamic_instructions(
    context: RunContextWrapper[UserContext], agent: Agent[UserContext]
) -> str:
    return f"The user's name is {context.context.name}. Help them with their questions."

agent = Agent[UserContext](
    name="Triage agent",
    instructions=dynamic_instructions,
)

```

## Lifecycle events (hooks)

Sometimes, you want to observe the lifecycle of an agent. For example, you may want to log events, or pre-fetch data when certain events occur. You can hook into the agent lifecycle with the `hooks` property. Subclass the [`AgentHooks`](https://openai.github.io/openai-agents-python/ref/lifecycle/#agents.lifecycle.AgentHooks "AgentHooks") class, and override the methods you're interested in.

## Guardrails

Guardrails allow you to run checks/validations on user input, in parallel to the agent running. For example, you could screen the user's input for relevance. Read more in the [guardrails](https://openai.github.io/openai-agents-python/guardrails/) documentation.

## Cloning/copying agents

By using the `clone()` method on an agent, you can duplicate an Agent, and optionally change any properties you like.

```md-code__content
pirate_agent = Agent(
    name="Pirate",
    instructions="Write like a pirate",
    model="o3-mini",
)

robot_agent = pirate_agent.clone(
    name="Robot",
    instructions="Write like a robot",
)

```

## Guardrails for Agents

[Skip to content](https://openai.github.io/openai-agents-python/guardrails/#guardrails)

# Guardrails

Guardrails run _in parallel_ to your agents, enabling you to do checks and validations of user input. For example, imagine you have an agent that uses a very smart (and hence slow/expensive) model to help with customer requests. You wouldn't want malicious users to ask the model to help them with their math homework. So, you can run a guardrail with a fast/cheap model. If the guardrail detects malicious usage, it can immediately raise an error, which stops the expensive model from running and saves you time/money.

There are two kinds of guardrails:

1. Input guardrails run on the initial user input
2. Output guardrails run on the final agent output

## Input guardrails

Input guardrails run in 3 steps:

1. First, the guardrail receives the same input passed to the agent.
2. Next, the guardrail function runs to produce a [`GuardrailFunctionOutput`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.GuardrailFunctionOutput "GuardrailFunctionOutput            dataclass   "), which is then wrapped in an [`InputGuardrailResult`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.InputGuardrailResult "InputGuardrailResult            dataclass   ")
3. Finally, we check if [`.tripwire_triggered`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.GuardrailFunctionOutput.tripwire_triggered "tripwire_triggered            instance-attribute   ") is true. If true, an [`InputGuardrailTripwireTriggered`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.InputGuardrailTripwireTriggered "InputGuardrailTripwireTriggered") exception is raised, so you can appropriately respond to the user or handle the exception.

Note

Input guardrails are intended to run on user input, so an agent's guardrails only run if the agent is the _first_ agent. You might wonder, why is the `guardrails` property on the agent instead of passed to `Runner.run`? It's because guardrails tend to be related to the actual Agent - you'd run different guardrails for different agents, so colocating the code is useful for readability.

## Output guardrails

Output guardrails run in 3 steps:

1. First, the guardrail receives the same input passed to the agent.
2. Next, the guardrail function runs to produce a [`GuardrailFunctionOutput`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.GuardrailFunctionOutput "GuardrailFunctionOutput            dataclass   "), which is then wrapped in an [`OutputGuardrailResult`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.OutputGuardrailResult "OutputGuardrailResult            dataclass   ")
3. Finally, we check if [`.tripwire_triggered`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.GuardrailFunctionOutput.tripwire_triggered "tripwire_triggered            instance-attribute   ") is true. If true, an [`OutputGuardrailTripwireTriggered`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.OutputGuardrailTripwireTriggered "OutputGuardrailTripwireTriggered") exception is raised, so you can appropriately respond to the user or handle the exception.

Note

Output guardrails are intended to run on the final agent input, so an agent's guardrails only run if the agent is the _last_ agent. Similar to the input guardrails, we do this because guardrails tend to be related to the actual Agent - you'd run different guardrails for different agents, so colocating the code is useful for readability.

## Tripwires

If the input or output fails the guardrail, the Guardrail can signal this with a tripwire. As soon as we see a guardrail that has triggered the tripwires, we immediately raise a `{Input,Output}GuardrailTripwireTriggered` exception and halt the Agent execution.

## Implementing a guardrail

You need to provide a function that receives input, and returns a [`GuardrailFunctionOutput`](https://openai.github.io/openai-agents-python/ref/guardrail/#agents.guardrail.GuardrailFunctionOutput "GuardrailFunctionOutput            dataclass   "). In this example, we'll do this by running an Agent under the hood.

```md-code__content
from pydantic import BaseModel
from agents import (
    Agent,
    GuardrailFunctionOutput,
    InputGuardrailTripwireTriggered,
    RunContextWrapper,
    Runner,
    TResponseInputItem,
    input_guardrail,
)

class MathHomeworkOutput(BaseModel):
    is_math_homework: bool
    reasoning: str

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking you to do their math homework.",
    output_type=MathHomeworkOutput,
)

@input_guardrail
async def math_guardrail(
    ctx: RunContextWrapper[None], agent: Agent, input: str | list[TResponseInputItem]
) -> GuardrailFunctionOutput:
    result = await Runner.run(guardrail_agent, input, context=ctx.context)

    return GuardrailFunctionOutput(
        output_info=result.final_output,
        tripwire_triggered=result.final_output.is_math_homework,
    )

agent = Agent(
    name="Customer support agent",
    instructions="You are a customer support agent. You help customers with their questions.",
    input_guardrails=[math_guardrail],
)

async def main():
    # This should trip the guardrail
    try:
        await Runner.run(agent, "Hello, can you help me solve for x: 2x + 3 = 11?")
        print("Guardrail didn't trip - this is unexpected")

    except InputGuardrailTripwireTriggered:
        print("Math homework guardrail tripped")

```

Output guardrails are similar.

```md-code__content
from pydantic import BaseModel
from agents import (
    Agent,
    GuardrailFunctionOutput,
    OutputGuardrailTripwireTriggered,
    RunContextWrapper,
    Runner,
    output_guardrail,
)
class MessageOutput(BaseModel):
    response: str

class MathOutput(BaseModel):
    reasoning: str
    is_math: bool

guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the output includes any math.",
    output_type=MathOutput,
)

@output_guardrail
async def math_guardrail(
    ctx: RunContextWrapper, agent: Agent, output: MessageOutput
) -> GuardrailFunctionOutput:
    result = await Runner.run(guardrail_agent, output.response, context=ctx.context)

    return GuardrailFunctionOutput(
        output_info=result.final_output,
        tripwire_triggered=result.final_output.is_math,
    )

agent = Agent(
    name="Customer support agent",
    instructions="You are a customer support agent. You help customers with their questions.",
    output_guardrails=[math_guardrail],
    output_type=MessageOutput,
)

async def main():
    # This should trip the guardrail
    try:
        await Runner.run(agent, "Hello, can you help me solve for x: 2x + 3 = 11?")
        print("Guardrail didn't trip - this is unexpected")

    except OutputGuardrailTripwireTriggered:
        print("Math output guardrail tripped")

```

## OpenAI Agents Tracing

[Skip to content](https://openai.github.io/openai-agents-python/tracing/#tracing)

# Tracing

The Agents SDK includes built-in tracing, collecting a comprehensive record of events during an agent run: LLM generations, tool calls, handoffs, guardrails, and even custom events that occur. Using the [Traces dashboard](https://platform.openai.com/traces), you can debug, visualize, and monitor your workflows during development and in production.

Note

Tracing is enabled by default. There are two ways to disable tracing:

1. You can globally disable tracing by setting the env var `OPENAI_AGENTS_DISABLE_TRACING=1`
2. You can disable tracing for a single run by setting [`agents.run.RunConfig.tracing_disabled`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.tracing_disabled "tracing_disabled            class-attribute       instance-attribute   ") to `True`

**_For organizations operating under a Zero Data Retention (ZDR) policy using OpenAI's APIs, tracing is unavailable._**

## Traces and spans

- **Traces** represent a single end-to-end operation of a "workflow". They're composed of Spans. Traces have the following properties:
  - `workflow_name`: This is the logical workflow or app. For example "Code generation" or "Customer service".
  - `trace_id`: A unique ID for the trace. Automatically generated if you don't pass one. Must have the format `trace_<32_alphanumeric>`.
  - `group_id`: Optional group ID, to link multiple traces from the same conversation. For example, you might use a chat thread ID.
  - `disabled`: If True, the trace will not be recorded.
  - `metadata`: Optional metadata for the trace.
- **Spans** represent operations that have a start and end time. Spans have:
  - `started_at` and `ended_at` timestamps.
  - `trace_id`, to represent the trace they belong to
  - `parent_id`, which points to the parent Span of this Span (if any)
  - `span_data`, which is information about the Span. For example, `AgentSpanData` contains information about the Agent, `GenerationSpanData` contains information about the LLM generation, etc.

## Default tracing

By default, the SDK traces the following:

- The entire `Runner.{run, run_sync, run_streamed}()` is wrapped in a `trace()`.
- Each time an agent runs, it is wrapped in `agent_span()`
- LLM generations are wrapped in `generation_span()`
- Function tool calls are each wrapped in `function_span()`
- Guardrails are wrapped in `guardrail_span()`
- Handoffs are wrapped in `handoff_span()`

By default, the trace is named "Agent trace". You can set this name if you use `trace`, or you can can configure the name and other properties with the [`RunConfig`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig "RunConfig            dataclass   ").

In addition, you can set up [custom trace processors](https://openai.github.io/openai-agents-python/tracing/#custom-tracing-processors) to push traces to other destinations (as a replacement, or secondary destination).

## Higher level traces

Sometimes, you might want multiple calls to `run()` to be part of a single trace. You can do this by wrapping the entire code in a `trace()`.

```md-code__content
from agents import Agent, Runner, trace

async def main():
    agent = Agent(name="Joke generator", instructions="Tell funny jokes.")

    with trace("Joke workflow"):
        first_result = await Runner.run(agent, "Tell me a joke")
        second_result = await Runner.run(agent, f"Rate this joke: {first_result.final_output}")
        print(f"Joke: {first_result.final_output}")
        print(f"Rating: {second_result.final_output}")

```

## Creating traces

You can use the [`trace()`](https://openai.github.io/openai-agents-python/ref/tracing/#agents.tracing.trace "trace") function to create a trace. Traces need to be started and finished. You have two options to do so:

1. **Recommended**: use the trace as a context manager, i.e. `with trace(...) as my_trace`. This will automatically start and end the trace at the right time.
2. You can also manually call [`trace.start()`](https://openai.github.io/openai-agents-python/ref/tracing/#agents.tracing.Trace.start "start            abstractmethod   ") and [`trace.finish()`](https://openai.github.io/openai-agents-python/ref/tracing/#agents.tracing.Trace.finish "finish            abstractmethod   ").

The current trace is tracked via a Python [`contextvar`](https://docs.python.org/3/library/contextvars.html). This means that it works with concurrency automatically. If you manually start/end a trace, you'll need to pass `mark_as_current` and `reset_current` to `start()`/ `finish()` to update the current trace.

## Creating spans

You can use the various [`*_span()`](https://openai.github.io/openai-agents-python/ref/tracing/create/#agents.tracing.create) methods to create a span. In general, you don't need to manually create spans. A [`custom_span()`](https://openai.github.io/openai-agents-python/ref/tracing/#agents.tracing.custom_span "custom_span") function is available for tracking custom span information.

Spans are automatically part of the current trace, and are nested under the nearest current span, which is tracked via a Python [`contextvar`](https://docs.python.org/3/library/contextvars.html).

## Sensitive data

Some spans track potentially sensitive data. For example, the `generation_span()` stores the inputs/outputs of the LLM generation, and `function_span()` stores the inputs/outputs of function calls. These may contain sensitive data, so you can disable capturing that data via [`RunConfig.trace_include_sensitive_data`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.trace_include_sensitive_data "trace_include_sensitive_data            class-attribute       instance-attribute   ").

## Custom tracing processors

The high level architecture for tracing is:

- At initialization, we create a global [`TraceProvider`](https://openai.github.io/openai-agents-python/ref/tracing/setup/#agents.tracing.setup.TraceProvider "TraceProvider"), which is responsible for creating traces.
- We configure the `TraceProvider` with a [`BatchTraceProcessor`](https://openai.github.io/openai-agents-python/ref/tracing/processors/#agents.tracing.processors.BatchTraceProcessor "BatchTraceProcessor") that sends traces/spans in batches to a [`BackendSpanExporter`](https://openai.github.io/openai-agents-python/ref/tracing/processors/#agents.tracing.processors.BackendSpanExporter "BackendSpanExporter"), which exports the spans and traces to the OpenAI backend in batches.

To customize this default setup, to send traces to alternative or additional backends or modifying exporter behavior, you have two options:

1. [`add_trace_processor()`](https://openai.github.io/openai-agents-python/ref/tracing/#agents.tracing.add_trace_processor "add_trace_processor") lets you add an **additional** trace processor that will receive traces and spans as they are ready. This lets you do your own processing in addition to sending traces to OpenAI's backend.
2. [`set_trace_processors()`](https://openai.github.io/openai-agents-python/ref/tracing/#agents.tracing.set_trace_processors "set_trace_processors") lets you **replace** the default processors with your own trace processors. This means traces will not be sent to the OpenAI backend unless you include a `TracingProcessor` that does so.

## External tracing processors list

- [Arize-Phoenix](https://docs.arize.com/phoenix/tracing/integrations-tracing/openai-agents-sdk)
- [MLflow](https://mlflow.org/docs/latest/tracing/integrations/openai-agent)
- [Braintrust](https://braintrust.dev/docs/guides/traces/integrations#openai-agents-sdk)
- [Pydantic Logfire](https://logfire.pydantic.dev/docs/integrations/llms/openai/#openai-agents)
- [AgentOps](https://docs.agentops.ai/v1/integrations/agentssdk)
- [Scorecard](https://docs.scorecard.io/docs/documentation/features/tracing#openai-agents-sdk-integration)
- [Keywords AI](https://docs.keywordsai.co/integration/development-frameworks/openai-agent)
- [LangSmith](https://docs.smith.langchain.com/observability/how_to_guides/trace_with_openai_agents_sdk)
- [Maxim AI](https://www.getmaxim.ai/docs/observe/integrations/openai-agents-sdk)

## Running Agents

[Skip to content](https://openai.github.io/openai-agents-python/running_agents/#running-agents)

# Running agents

You can run agents via the [`Runner`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner "Runner") class. You have 3 options:

1. [`Runner.run()`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner.run "run            async       classmethod   "), which runs async and returns a [`RunResult`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResult "RunResult            dataclass   ").
2. [`Runner.run_sync()`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner.run_sync "run_sync            classmethod   "), which is a sync method and just runs `.run()` under the hood.
3. [`Runner.run_streamed()`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner.run_streamed "run_streamed            classmethod   "), which runs async and returns a [`RunResultStreaming`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultStreaming "RunResultStreaming            dataclass   "). It calls the LLM in streaming mode, and streams those events to you as they are received.

```md-code__content
from agents import Agent, Runner

async def main():
    agent = Agent(name="Assistant", instructions="You are a helpful assistant")

    result = await Runner.run(agent, "Write a haiku about recursion in programming.")
    print(result.final_output)
    # Code within the code,
    # Functions calling themselves,
    # Infinite loop's dance.

```

Read more in the [results guide](https://openai.github.io/openai-agents-python/results/).

## The agent loop

When you use the run method in `Runner`, you pass in a starting agent and input. The input can either be a string (which is considered a user message), or a list of input items, which are the items in the OpenAI Responses API.

The runner then runs a loop:

1. We call the LLM for the current agent, with the current input.
2. The LLM produces its output.
1. If the LLM returns a `final_output`, the loop ends and we return the result.
2. If the LLM does a handoff, we update the current agent and input, and re-run the loop.
3. If the LLM produces tool calls, we run those tool calls, append the results, and re-run the loop.
3. If we exceed the `max_turns` passed, we raise a [`MaxTurnsExceeded`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.MaxTurnsExceeded "MaxTurnsExceeded") exception.

Note

The rule for whether the LLM output is considered as a "final output" is that it produces text output with the desired type, and there are no tool calls.

## Streaming

Streaming allows you to additionally receive streaming events as the LLM runs. Once the stream is done, the [`RunResultStreaming`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultStreaming "RunResultStreaming            dataclass   ") will contain the complete information about the run, including all the new outputs produces. You can call `.stream_events()` for the streaming events. Read more in the [streaming guide](https://openai.github.io/openai-agents-python/streaming/).

## Run config

The `run_config` parameter lets you configure some global settings for the agent run:

- [`model`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.model "model            class-attribute       instance-attribute   "): Allows setting a global LLM model to use, irrespective of what `model` each Agent has.
- [`model_provider`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.model_provider "model_provider            class-attribute       instance-attribute   "): A model provider for looking up model names, which defaults to OpenAI.
- [`model_settings`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.model_settings "model_settings            class-attribute       instance-attribute   "): Overrides agent-specific settings. For example, you can set a global `temperature` or `top_p`.
- [`input_guardrails`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.input_guardrails "input_guardrails            class-attribute       instance-attribute   "), [`output_guardrails`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.output_guardrails "output_guardrails            class-attribute       instance-attribute   "): A list of input or output guardrails to include on all runs.
- [`handoff_input_filter`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.handoff_input_filter "handoff_input_filter            class-attribute       instance-attribute   "): A global input filter to apply to all handoffs, if the handoff doesn't already have one. The input filter allows you to edit the inputs that are sent to the new agent. See the documentation in [`Handoff.input_filter`](https://openai.github.io/openai-agents-python/ref/handoffs/#agents.handoffs.Handoff.input_filter "input_filter            class-attribute       instance-attribute   ") for more details.
- [`tracing_disabled`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.tracing_disabled "tracing_disabled            class-attribute       instance-attribute   "): Allows you to disable [tracing](https://openai.github.io/openai-agents-python/tracing/) for the entire run.
- [`trace_include_sensitive_data`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.trace_include_sensitive_data "trace_include_sensitive_data            class-attribute       instance-attribute   "): Configures whether traces will include potentially sensitive data, such as LLM and tool call inputs/outputs.
- [`workflow_name`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.workflow_name "workflow_name            class-attribute       instance-attribute   "), [`trace_id`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.trace_id "trace_id            class-attribute       instance-attribute   "), [`group_id`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.group_id "group_id            class-attribute       instance-attribute   "): Sets the tracing workflow name, trace ID and trace group ID for the run. We recommend at least setting `workflow_name`. The session ID is an optional field that lets you link traces across multiple runs.
- [`trace_metadata`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.RunConfig.trace_metadata "trace_metadata            class-attribute       instance-attribute   "): Metadata to include on all traces.

## Conversations/chat threads

Calling any of the run methods can result in one or more agents running (and hence one or more LLM calls), but it represents a single logical turn in a chat conversation. For example:

1. User turn: user enter text
2. Runner run: first agent calls LLM, runs tools, does a handoff to a second agent, second agent runs more tools, and then produces an output.

At the end of the agent run, you can choose what to show to the user. For example, you might show the user every new item generated by the agents, or just the final output. Either way, the user might then ask a followup question, in which case you can call the run method again.

You can use the base [`RunResultBase.to_input_list()`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.to_input_list "to_input_list") method to get the inputs for the next turn.

```md-code__content
async def main():
    agent = Agent(name="Assistant", instructions="Reply very concisely.")

    with trace(workflow_name="Conversation", group_id=thread_id):
        # First turn
        result = await Runner.run(agent, "What city is the Golden Gate Bridge in?")
        print(result.final_output)
        # San Francisco

        # Second turn
        new_input = result.to_input_list() + [{"role": "user", "content": "What state is it in?"}]
        result = await Runner.run(agent, new_input)
        print(result.final_output)
        # California

```

## Exceptions

The SDK raises exceptions in certain cases. The full list is in [`agents.exceptions`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions). As an overview:

- [`AgentsException`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.AgentsException "AgentsException") is the base class for all exceptions raised in the SDK.
- [`MaxTurnsExceeded`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.MaxTurnsExceeded "MaxTurnsExceeded") is raised when the run exceeds the `max_turns` passed to the run methods.
- [`ModelBehaviorError`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.ModelBehaviorError "ModelBehaviorError") is raised when the model produces invalid outputs, e.g. malformed JSON or using non-existent tools.
- [`UserError`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.UserError "UserError") is raised when you (the person writing code using the SDK) make an error using the SDK.
- [`InputGuardrailTripwireTriggered`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.InputGuardrailTripwireTriggered "InputGuardrailTripwireTriggered"), [`OutputGuardrailTripwireTriggered`](https://openai.github.io/openai-agents-python/ref/exceptions/#agents.exceptions.OutputGuardrailTripwireTriggered "OutputGuardrailTripwireTriggered") is raised when a [guardrail](https://openai.github.io/openai-agents-python/guardrails/) is tripped.

## Agent Task Handoffs

[Skip to content](https://openai.github.io/openai-agents-python/handoffs/#handoffs)

# Handoffs

Handoffs allow an agent to delegate tasks to another agent. This is particularly useful in scenarios where different agents specialize in distinct areas. For example, a customer support app might have agents that each specifically handle tasks like order status, refunds, FAQs, etc.

Handoffs are represented as tools to the LLM. So if there's a handoff to an agent named `Refund Agent`, the tool would be called `transfer_to_refund_agent`.

## Creating a handoff

All agents have a [`handoffs`](https://openai.github.io/openai-agents-python/ref/agent/#agents.agent.Agent.handoffs "handoffs            class-attribute       instance-attribute   ") param, which can either take an `Agent` directly, or a `Handoff` object that customizes the Handoff.

You can create a handoff using the [`handoff()`](https://openai.github.io/openai-agents-python/ref/handoffs/#agents.handoffs.handoff "handoff") function provided by the Agents SDK. This function allows you to specify the agent to hand off to, along with optional overrides and input filters.

### Basic Usage

Here's how you can create a simple handoff:

```md-code__content
from agents import Agent, handoff

billing_agent = Agent(name="Billing agent")
refund_agent = Agent(name="Refund agent")

triage_agent = Agent(name="Triage agent", handoffs=[billing_agent, handoff(refund_agent)])

```

### Customizing handoffs via the `handoff()` function

The [`handoff()`](https://openai.github.io/openai-agents-python/ref/handoffs/#agents.handoffs.handoff "handoff") function lets you customize things.

- `agent`: This is the agent to which things will be handed off.
- `tool_name_override`: By default, the `Handoff.default_tool_name()` function is used, which resolves to `transfer_to_<agent_name>`. You can override this.
- `tool_description_override`: Override the default tool description from `Handoff.default_tool_description()`
- `on_handoff`: A callback function executed when the handoff is invoked. This is useful for things like kicking off some data fetching as soon as you know a handoff is being invoked. This function receives the agent context, and can optionally also receive LLM generated input. The input data is controlled by the `input_type` param.
- `input_type`: The type of input expected by the handoff (optional).
- `input_filter`: This lets you filter the input received by the next agent. See below for more.

```md-code__content
from agents import Agent, handoff, RunContextWrapper

def on_handoff(ctx: RunContextWrapper[None]):
    print("Handoff called")

agent = Agent(name="My agent")

handoff_obj = handoff(
    agent=agent,
    on_handoff=on_handoff,
    tool_name_override="custom_handoff_tool",
    tool_description_override="Custom description",
)

```

## Handoff inputs

In certain situations, you want the LLM to provide some data when it calls a handoff. For example, imagine a handoff to an "Escalation agent". You might want a reason to be provided, so you can log it.

```md-code__content
from pydantic import BaseModel

from agents import Agent, handoff, RunContextWrapper

class EscalationData(BaseModel):
    reason: str

async def on_handoff(ctx: RunContextWrapper[None], input_data: EscalationData):
    print(f"Escalation agent called with reason: {input_data.reason}")

agent = Agent(name="Escalation agent")

handoff_obj = handoff(
    agent=agent,
    on_handoff=on_handoff,
    input_type=EscalationData,
)

```

## Input filters

When a handoff occurs, it's as though the new agent takes over the conversation, and gets to see the entire previous conversation history. If you want to change this, you can set an [`input_filter`](https://openai.github.io/openai-agents-python/ref/handoffs/#agents.handoffs.Handoff.input_filter "input_filter            class-attribute       instance-attribute   "). An input filter is a function that receives the existing input via a [`HandoffInputData`](https://openai.github.io/openai-agents-python/ref/handoffs/#agents.handoffs.HandoffInputData "HandoffInputData            dataclass   "), and must return a new `HandoffInputData`.

There are some common patterns (for example removing all tool calls from the history), which are implemented for you in [`agents.extensions.handoff_filters`](https://openai.github.io/openai-agents-python/ref/extensions/handoff_filters/#agents.extensions.handoff_filters)

```md-code__content
from agents import Agent, handoff
from agents.extensions import handoff_filters

agent = Agent(name="FAQ agent")

handoff_obj = handoff(
    agent=agent,
    input_filter=handoff_filters.remove_all_tools,
)

```

## Recommended prompts

To make sure that LLMs understand handoffs properly, we recommend including information about handoffs in your agents. We have a suggested prefix in [`agents.extensions.handoff_prompt.RECOMMENDED_PROMPT_PREFIX`](https://openai.github.io/openai-agents-python/ref/extensions/handoff_prompt/#agents.extensions.handoff_prompt.RECOMMENDED_PROMPT_PREFIX "RECOMMENDED_PROMPT_PREFIX            module-attribute   "), or you can call [`agents.extensions.handoff_prompt.prompt_with_handoff_instructions`](https://openai.github.io/openai-agents-python/ref/extensions/handoff_prompt/#agents.extensions.handoff_prompt.prompt_with_handoff_instructions "prompt_with_handoff_instructions") to automatically add recommended data to your prompts.

```md-code__content
from agents import Agent
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

billing_agent = Agent(
    name="Billing agent",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    <Fill in the rest of your prompt here>.""",
)

```

## Context Management Overview

[Skip to content](https://openai.github.io/openai-agents-python/context/#context-management)

# Context management

Context is an overloaded term. There are two main classes of context you might care about:

1. Context available locally to your code: this is data and dependencies you might need when tool functions run, during callbacks like `on_handoff`, in lifecycle hooks, etc.
2. Context available to LLMs: this is data the LLM sees when generating a response.

## Local context

This is represented via the [`RunContextWrapper`](https://openai.github.io/openai-agents-python/ref/run_context/#agents.run_context.RunContextWrapper "RunContextWrapper            dataclass   ") class and the [`context`](https://openai.github.io/openai-agents-python/ref/run_context/#agents.run_context.RunContextWrapper.context "context            instance-attribute   ") property within it. The way this works is:

1. You create any Python object you want. A common pattern is to use a dataclass or a Pydantic object.
2. You pass that object to the various run methods (e.g. `Runner.run(..., **context=whatever**))`.
3. All your tool calls, lifecycle hooks etc will be passed a wrapper object, `RunContextWrapper[T]`, where `T` represents your context object type which you can access via `wrapper.context`.

The **most important** thing to be aware of: every agent, tool function, lifecycle etc for a given agent run must use the same _type_ of context.

You can use the context for things like:

- Contextual data for your run (e.g. things like a username/uid or other information about the user)
- Dependencies (e.g. logger objects, data fetchers, etc)
- Helper functions

Note

The context object is **not** sent to the LLM. It is purely a local object that you can read from, write to and call methods on it.

```md-code__content
import asyncio
from dataclasses import dataclass

from agents import Agent, RunContextWrapper, Runner, function_tool

@dataclass
class UserInfo:
    name: str
    uid: int

@function_tool
async def fetch_user_age(wrapper: RunContextWrapper[UserInfo]) -> str:
    return f"User {wrapper.context.name} is 47 years old"

async def main():
    user_info = UserInfo(name="John", uid=123)

    agent = Agent[UserInfo](
        name="Assistant",
        tools=[fetch_user_age],
    )

    result = await Runner.run(
        starting_agent=agent,
        input="What is the age of the user?",
        context=user_info,
    )

    print(result.final_output)
    # The user John is 47 years old.

if __name__ == "__main__":
    asyncio.run(main())

```

## Agent/LLM context

When an LLM is called, the **only** data it can see is from the conversation history. This means that if you want to make some new data available to the LLM, you must do it in a way that makes it available in that history. There are a few ways to do this:

1. You can add it to the Agent `instructions`. This is also known as a "system prompt" or "developer message". System prompts can be static strings, or they can be dynamic functions that receive the context and output a string. This is a common tactic for information that is always useful (for example, the user's name or the current date).
2. Add it to the `input` when calling the `Runner.run` functions. This is similar to the `instructions` tactic, but allows you to have messages that are lower in the [chain of command](https://cdn.openai.com/spec/model-spec-2024-05-08.html#follow-the-chain-of-command).
3. Expose it via function tools. This is useful for _on-demand_ context - the LLM decides when it needs some data, and can call the tool to fetch that data.
4. Use retrieval or web search. These are special tools that are able to fetch relevant data from files or databases (retrieval), or from the web (web search). This is useful for "grounding" the response in relevant contextual data.

## OpenAI Agents Models

[Skip to content](https://openai.github.io/openai-agents-python/models/#models)

# Models

The Agents SDK comes with out-of-the-box support for OpenAI models in two flavors:

- **Recommended**: the [`OpenAIResponsesModel`](https://openai.github.io/openai-agents-python/ref/models/openai_responses/#agents.models.openai_responses.OpenAIResponsesModel "OpenAIResponsesModel"), which calls OpenAI APIs using the new [Responses API](https://platform.openai.com/docs/api-reference/responses).
- The [`OpenAIChatCompletionsModel`](https://openai.github.io/openai-agents-python/ref/models/openai_chatcompletions/#agents.models.openai_chatcompletions.OpenAIChatCompletionsModel "OpenAIChatCompletionsModel"), which calls OpenAI APIs using the [Chat Completions API](https://platform.openai.com/docs/api-reference/chat).

## Mixing and matching models

Within a single workflow, you may want to use different models for each agent. For example, you could use a smaller, faster model for triage, while using a larger, more capable model for complex tasks. When configuring an [`Agent`](https://openai.github.io/openai-agents-python/ref/agent/#agents.agent.Agent "Agent            dataclass   "), you can select a specific model by either:

1. Passing the name of an OpenAI model.
2. Passing any model name + a [`ModelProvider`](https://openai.github.io/openai-agents-python/ref/models/interface/#agents.models.interface.ModelProvider "ModelProvider") that can map that name to a Model instance.
3. Directly providing a [`Model`](https://openai.github.io/openai-agents-python/ref/models/interface/#agents.models.interface.Model "Model") implementation.

Note

While our SDK supports both the [`OpenAIResponsesModel`](https://openai.github.io/openai-agents-python/ref/models/openai_responses/#agents.models.openai_responses.OpenAIResponsesModel "OpenAIResponsesModel") and the [`OpenAIChatCompletionsModel`](https://openai.github.io/openai-agents-python/ref/models/openai_chatcompletions/#agents.models.openai_chatcompletions.OpenAIChatCompletionsModel "OpenAIChatCompletionsModel") shapes, we recommend using a single model shape for each workflow because the two shapes support a different set of features and tools. If your workflow requires mixing and matching model shapes, make sure that all the features you're using are available on both.

```md-code__content
from agents import Agent, Runner, AsyncOpenAI, OpenAIChatCompletionsModel
import asyncio

spanish_agent = Agent(
    name="Spanish agent",
    instructions="You only speak Spanish.",
    model="o3-mini",
)

english_agent = Agent(
    name="English agent",
    instructions="You only speak English",
    model=OpenAIChatCompletionsModel(
        model="gpt-4o",
        openai_client=AsyncOpenAI()
    ),
)

triage_agent = Agent(
    name="Triage agent",
    instructions="Handoff to the appropriate agent based on the language of the request.",
    handoffs=[spanish_agent, english_agent],
    model="gpt-3.5-turbo",
)

async def main():
    result = await Runner.run(triage_agent, input="Hola, ¿cómo estás?")
    print(result.final_output)

```

## Using other LLM providers

You can use other LLM providers in 3 ways (examples [here](https://github.com/openai/openai-agents-python/tree/main/examples/model_providers/)):

1. [`set_default_openai_client`](https://openai.github.io/openai-agents-python/ref/#agents.set_default_openai_client "set_default_openai_client") is useful in cases where you want to globally use an instance of `AsyncOpenAI` as the LLM client. This is for cases where the LLM provider has an OpenAI compatible API endpoint, and you can set the `base_url` and `api_key`. See a configurable example in [examples/model\_providers/custom\_example\_global.py](https://github.com/openai/openai-agents-python/tree/main/examples/model_providers/custom_example_global.py).
2. [`ModelProvider`](https://openai.github.io/openai-agents-python/ref/models/interface/#agents.models.interface.ModelProvider "ModelProvider") is at the `Runner.run` level. This lets you say "use a custom model provider for all agents in this run". See a configurable example in [examples/model\_providers/custom\_example\_provider.py](https://github.com/openai/openai-agents-python/tree/main/examples/model_providers/custom_example_provider.py).
3. [`Agent.model`](https://openai.github.io/openai-agents-python/ref/agent/#agents.agent.Agent.model "model            class-attribute       instance-attribute   ") lets you specify the model on a specific Agent instance. This enables you to mix and match different providers for different agents. See a configurable example in [examples/model\_providers/custom\_example\_agent.py](https://github.com/openai/openai-agents-python/tree/main/examples/model_providers/custom_example_agent.py).

In cases where you do not have an API key from `platform.openai.com`, we recommend disabling tracing via `set_tracing_disabled()`, or setting up a [different tracing processor](https://openai.github.io/openai-agents-python/tracing/).

Note

In these examples, we use the Chat Completions API/model, because most LLM providers don't yet support the Responses API. If your LLM provider does support it, we recommend using Responses.

## Common issues with using other LLM providers

### Tracing client error 401

If you get errors related to tracing, this is because traces are uploaded to OpenAI servers, and you don't have an OpenAI API key. You have three options to resolve this:

1. Disable tracing entirely: [`set_tracing_disabled(True)`](https://openai.github.io/openai-agents-python/ref/#agents.set_tracing_disabled "set_tracing_disabled").
2. Set an OpenAI key for tracing: [`set_tracing_export_api_key(...)`](https://openai.github.io/openai-agents-python/ref/#agents.set_tracing_export_api_key "set_tracing_export_api_key"). This API key will only be used for uploading traces, and must be from [platform.openai.com](https://platform.openai.com/).
3. Use a non-OpenAI trace processor. See the [tracing docs](https://openai.github.io/openai-agents-python/tracing/#custom-tracing-processors).

### Responses API support

The SDK uses the Responses API by default, but most other LLM providers don't yet support it. You may see 404s or similar issues as a result. To resolve, you have two options:

1. Call [`set_default_openai_api("chat_completions")`](https://openai.github.io/openai-agents-python/ref/#agents.set_default_openai_api "set_default_openai_api"). This works if you are setting `OPENAI_API_KEY` and `OPENAI_BASE_URL` via environment vars.
2. Use [`OpenAIChatCompletionsModel`](https://openai.github.io/openai-agents-python/ref/models/openai_chatcompletions/#agents.models.openai_chatcompletions.OpenAIChatCompletionsModel "OpenAIChatCompletionsModel"). There are examples [here](https://github.com/openai/openai-agents-python/tree/main/examples/model_providers/).

### Structured outputs support

Some model providers don't have support for [structured outputs](https://platform.openai.com/docs/guides/structured-outputs). This sometimes results in an error that looks something like this:

```md-code__content
BadRequestError: Error code: 400 - {'error': {'message': "'response_format.type' : value is not one of the allowed values ['text','json_object']", 'type': 'invalid_request_error'}}

```

This is a shortcoming of some model providers - they support JSON outputs, but don't allow you to specify the `json_schema` to use for the output. We are working on a fix for this, but we suggest relying on providers that do have support for JSON schema output, because otherwise your app will often break because of malformed JSON.

## OpenAI SDK Configuration

[Skip to content](https://openai.github.io/openai-agents-python/config/#configuring-the-sdk)

# Configuring the SDK

## API keys and clients

By default, the SDK looks for the `OPENAI_API_KEY` environment variable for LLM requests and tracing, as soon as it is imported. If you are unable to set that environment variable before your app starts, you can use the [set\_default\_openai\_key()](https://openai.github.io/openai-agents-python/ref/#agents.set_default_openai_key "set_default_openai_key") function to set the key.

```md-code__content
from agents import set_default_openai_key

set_default_openai_key("sk-...")

```

Alternatively, you can also configure an OpenAI client to be used. By default, the SDK creates an `AsyncOpenAI` instance, using the API key from the environment variable or the default key set above. You can change this by using the [set\_default\_openai\_client()](https://openai.github.io/openai-agents-python/ref/#agents.set_default_openai_client "set_default_openai_client") function.

```md-code__content
from openai import AsyncOpenAI
from agents import set_default_openai_client

custom_client = AsyncOpenAI(base_url="...", api_key="...")
set_default_openai_client(custom_client)

```

Finally, you can also customize the OpenAI API that is used. By default, we use the OpenAI Responses API. You can override this to use the Chat Completions API by using the [set\_default\_openai\_api()](https://openai.github.io/openai-agents-python/ref/#agents.set_default_openai_api "set_default_openai_api") function.

```md-code__content
from agents import set_default_openai_api

set_default_openai_api("chat_completions")

```

## Tracing

Tracing is enabled by default. It uses the OpenAI API keys from the section above by default (i.e. the environment variable or the default key you set). You can specifically set the API key used for tracing by using the [`set_tracing_export_api_key`](https://openai.github.io/openai-agents-python/ref/#agents.set_tracing_export_api_key "set_tracing_export_api_key") function.

```md-code__content
from agents import set_tracing_export_api_key

set_tracing_export_api_key("sk-...")

```

You can also disable tracing entirely by using the [`set_tracing_disabled()`](https://openai.github.io/openai-agents-python/ref/#agents.set_tracing_disabled "set_tracing_disabled") function.

```md-code__content
from agents import set_tracing_disabled

set_tracing_disabled(True)

```

## Debug logging

The SDK has two Python loggers without any handlers set. By default, this means that warnings and errors are sent to `stdout`, but other logs are suppressed.

To enable verbose logging, use the [`enable_verbose_stdout_logging()`](https://openai.github.io/openai-agents-python/ref/#agents.enable_verbose_stdout_logging "enable_verbose_stdout_logging") function.

```md-code__content
from agents import enable_verbose_stdout_logging

enable_verbose_stdout_logging()

```

Alternatively, you can customize the logs by adding handlers, filters, formatters, etc. You can read more in the [Python logging guide](https://docs.python.org/3/howto/logging.html).

```md-code__content
import logging

logger =  logging.getLogger("openai.agents") # or openai.agents.tracing for the Tracing logger

# To make all logs show up
logger.setLevel(logging.DEBUG)
# To make info and above show up
logger.setLevel(logging.INFO)
# To make warning and above show up
logger.setLevel(logging.WARNING)
# etc

# You can customize this as needed, but this will output to `stderr` by default
logger.addHandler(logging.StreamHandler())

```

### Sensitive data in logs

Certain logs may contain sensitive data (for example, user data). If you want to disable this data from being logged, set the following environment variables.

To disable logging LLM inputs and outputs:

```md-code__content
export OPENAI_AGENTS_DONT_LOG_MODEL_DATA=1

```

To disable logging tool inputs and outputs:

```md-code__content
export OPENAI_AGENTS_DONT_LOG_TOOL_DATA=1

```

## OpenAI Agents Module

[Skip to content](https://openai.github.io/openai-agents-python/ref/#agents-module)

# Agents module

### set\_default\_openai\_key

```md-code__content
set_default_openai_key(
    key: str, use_for_tracing: bool = True
) -> None

```

Set the default OpenAI API key to use for LLM requests (and optionally tracing(). This is
only necessary if the OPENAI\_API\_KEY environment variable is not already set.

If provided, this key will be used instead of the OPENAI\_API\_KEY environment variable.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `key` | `str` | The OpenAI key to use. | _required_ |
| `use_for_tracing` | `bool` | Whether to also use this key to send traces to OpenAI. Defaults to True<br>If False, you'll either need to set the OPENAI\_API\_KEY environment variable or call<br>set\_tracing\_export\_api\_key() with the API key you want to use for tracing. | `True` |

Source code in `src/agents/__init__.py`

|     |     |
| --- | --- |
| ```<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>``` | ```md-code__content<br>def set_default_openai_key(key: str, use_for_tracing: bool = True) -> None:<br>    """Set the default OpenAI API key to use for LLM requests (and optionally tracing(). This is<br>    only necessary if the OPENAI_API_KEY environment variable is not already set.<br>    If provided, this key will be used instead of the OPENAI_API_KEY environment variable.<br>    Args:<br>        key: The OpenAI key to use.<br>        use_for_tracing: Whether to also use this key to send traces to OpenAI. Defaults to True<br>            If False, you'll either need to set the OPENAI_API_KEY environment variable or call<br>            set_tracing_export_api_key() with the API key you want to use for tracing.<br>    """<br>    _config.set_default_openai_key(key, use_for_tracing)<br>``` |

### set\_default\_openai\_client

```md-code__content
set_default_openai_client(
    client: AsyncOpenAI, use_for_tracing: bool = True
) -> None

```

Set the default OpenAI client to use for LLM requests and/or tracing. If provided, this
client will be used instead of the default OpenAI client.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `client` | `AsyncOpenAI` | The OpenAI client to use. | _required_ |
| `use_for_tracing` | `bool` | Whether to use the API key from this client for uploading traces. If False,<br>you'll either need to set the OPENAI\_API\_KEY environment variable or call<br>set\_tracing\_export\_api\_key() with the API key you want to use for tracing. | `True` |

Source code in `src/agents/__init__.py`

|     |     |
| --- | --- |
| ```<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>``` | ```md-code__content<br>def set_default_openai_client(client: AsyncOpenAI, use_for_tracing: bool = True) -> None:<br>    """Set the default OpenAI client to use for LLM requests and/or tracing. If provided, this<br>    client will be used instead of the default OpenAI client.<br>    Args:<br>        client: The OpenAI client to use.<br>        use_for_tracing: Whether to use the API key from this client for uploading traces. If False,<br>            you'll either need to set the OPENAI_API_KEY environment variable or call<br>            set_tracing_export_api_key() with the API key you want to use for tracing.<br>    """<br>    _config.set_default_openai_client(client, use_for_tracing)<br>``` |

### set\_default\_openai\_api

```md-code__content
set_default_openai_api(
    api: Literal["chat_completions", "responses"],
) -> None

```

Set the default API to use for OpenAI LLM requests. By default, we will use the responses API
but you can set this to use the chat completions API instead.

Source code in `src/agents/__init__.py`

|     |     |
| --- | --- |
| ```<br>124<br>125<br>126<br>127<br>128<br>``` | ```md-code__content<br>def set_default_openai_api(api: Literal["chat_completions", "responses"]) -> None:<br>    """Set the default API to use for OpenAI LLM requests. By default, we will use the responses API<br>    but you can set this to use the chat completions API instead.<br>    """<br>    _config.set_default_openai_api(api)<br>``` |

### set\_tracing\_export\_api\_key

```md-code__content
set_tracing_export_api_key(api_key: str) -> None

```

Set the OpenAI API key for the backend exporter.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>84<br>85<br>86<br>87<br>88<br>``` | ```md-code__content<br>def set_tracing_export_api_key(api_key: str) -> None:<br>    """<br>    Set the OpenAI API key for the backend exporter.<br>    """<br>    default_exporter().set_api_key(api_key)<br>``` |

### set\_tracing\_disabled

```md-code__content
set_tracing_disabled(disabled: bool) -> None

```

Set whether tracing is globally disabled.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>77<br>78<br>79<br>80<br>81<br>``` | ```md-code__content<br>def set_tracing_disabled(disabled: bool) -> None:<br>    """<br>    Set whether tracing is globally disabled.<br>    """<br>    GLOBAL_TRACE_PROVIDER.set_disabled(disabled)<br>``` |

### set\_trace\_processors

```md-code__content
set_trace_processors(
    processors: list[TracingProcessor],
) -> None

```

Set the list of trace processors. This will replace the current list of processors.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>70<br>71<br>72<br>73<br>74<br>``` | ```md-code__content<br>def set_trace_processors(processors: list[TracingProcessor]) -> None:<br>    """<br>    Set the list of trace processors. This will replace the current list of processors.<br>    """<br>    GLOBAL_TRACE_PROVIDER.set_processors(processors)<br>``` |

### enable\_verbose\_stdout\_logging

```md-code__content
enable_verbose_stdout_logging()

```

Enables verbose logging to stdout. This is useful for debugging.

Source code in `src/agents/__init__.py`

|     |     |
| --- | --- |
| ```<br>131<br>132<br>133<br>134<br>135<br>``` | ```md-code__content<br>def enable_verbose_stdout_logging():<br>    """Enables verbose logging to stdout. This is useful for debugging."""<br>    logger = logging.getLogger("openai.agents")<br>    logger.setLevel(logging.DEBUG)<br>    logger.addHandler(logging.StreamHandler(sys.stdout))<br>``` |

## Orchestrating Multiple Agents

[Skip to content](https://openai.github.io/openai-agents-python/multi_agent/#orchestrating-multiple-agents)

# Orchestrating multiple agents

Orchestration refers to the flow of agents in your app. Which agents run, in what order, and how do they decide what happens next? There are two main ways to orchestrate agents:

1. Allowing the LLM to make decisions: this uses the intelligence of an LLM to plan, reason, and decide on what steps to take based on that.
2. Orchestrating via code: determining the flow of agents via your code.

You can mix and match these patterns. Each has their own tradeoffs, described below.

## Orchestrating via LLM

An agent is an LLM equipped with instructions, tools and handoffs. This means that given an open-ended task, the LLM can autonomously plan how it will tackle the task, using tools to take actions and acquire data, and using handoffs to delegate tasks to sub-agents. For example, a research agent could be equipped with tools like:

- Web search to find information online
- File search and retrieval to search through proprietary data and connections
- Computer use to take actions on a computer
- Code execution to do data analysis
- Handoffs to specialized agents that are great at planning, report writing and more.

This pattern is great when the task is open-ended and you want to rely on the intelligence of an LLM. The most important tactics here are:

1. Invest in good prompts. Make it clear what tools are available, how to use them, and what parameters it must operate within.
2. Monitor your app and iterate on it. See where things go wrong, and iterate on your prompts.
3. Allow the agent to introspect and improve. For example, run it in a loop, and let it critique itself; or, provide error messages and let it improve.
4. Have specialized agents that excel in one task, rather than having a general purpose agent that is expected to be good at anything.
5. Invest in [evals](https://platform.openai.com/docs/guides/evals). This lets you train your agents to improve and get better at tasks.

## Orchestrating via code

While orchestrating via LLM is powerful, orchestrating via code makes tasks more deterministic and predictable, in terms of speed, cost and performance. Common patterns here are:

- Using [structured outputs](https://platform.openai.com/docs/guides/structured-outputs) to generate well formed data that you can inspect with your code. For example, you might ask an agent to classify the task into a few categories, and then pick the next agent based on the category.
- Chaining multiple agents by transforming the output of one into the input of the next. You can decompose a task like writing a blog post into a series of steps - do research, write an outline, write the blog post, critique it, and then improve it.
- Running the agent that performs the task in a `while` loop with an agent that evaluates and provides feedback, until the evaluator says the output passes certain criteria.
- Running multiple agents in parallel, e.g. via Python primitives like `asyncio.gather`. This is useful for speed when you have multiple tasks that don't depend on each other.

We have a number of examples in [`examples/agent_patterns`](https://github.com/openai/openai-agents-python/tree/main/examples/agent_patterns).

## OpenAI Agent Tools

[Skip to content](https://openai.github.io/openai-agents-python/tools/#tools)

# Tools

Tools let agents take actions: things like fetching data, running code, calling external APIs, and even using a computer. There are three classes of tools in the Agent SDK:

- Hosted tools: these run on LLM servers alongside the AI models. OpenAI offers retrieval, web search and computer use as hosted tools.
- Function calling: these allow you to use any Python function as a tool.
- Agents as tools: this allows you to use an agent as a tool, allowing Agents to call other agents without handing off to them.

## Hosted tools

OpenAI offers a few built-in tools when using the [`OpenAIResponsesModel`](https://openai.github.io/openai-agents-python/ref/models/openai_responses/#agents.models.openai_responses.OpenAIResponsesModel "OpenAIResponsesModel"):

- The [`WebSearchTool`](https://openai.github.io/openai-agents-python/ref/tool/#agents.tool.WebSearchTool "WebSearchTool            dataclass   ") lets an agent search the web.
- The [`FileSearchTool`](https://openai.github.io/openai-agents-python/ref/tool/#agents.tool.FileSearchTool "FileSearchTool            dataclass   ") allows retrieving information from your OpenAI Vector Stores.
- The [`ComputerTool`](https://openai.github.io/openai-agents-python/ref/tool/#agents.tool.ComputerTool "ComputerTool            dataclass   ") allows automating computer use tasks.

```md-code__content
from agents import Agent, FileSearchTool, Runner, WebSearchTool

agent = Agent(
    name="Assistant",
    tools=[\
        WebSearchTool(),\
        FileSearchTool(\
            max_num_results=3,\
            vector_store_ids=["VECTOR_STORE_ID"],\
        ),\
    ],
)

async def main():
    result = await Runner.run(agent, "Which coffee shop should I go to, taking into account my preferences and the weather today in SF?")
    print(result.final_output)

```

## Function tools

You can use any Python function as a tool. The Agents SDK will setup the tool automatically:

- The name of the tool will be the name of the Python function (or you can provide a name)
- Tool description will be taken from the docstring of the function (or you can provide a description)
- The schema for the function inputs is automatically created from the function's arguments
- Descriptions for each input are taken from the docstring of the function, unless disabled

We use Python's `inspect` module to extract the function signature, along with [`griffe`](https://mkdocstrings.github.io/griffe/) to parse docstrings and `pydantic` for schema creation.

```md-code__content
import json

from typing_extensions import TypedDict, Any

from agents import Agent, FunctionTool, RunContextWrapper, function_tool

class Location(TypedDict):
    lat: float
    long: float

@function_tool
async def fetch_weather(location: Location) -> str:

    """Fetch the weather for a given location.

    Args:
        location: The location to fetch the weather for.
    """
    # In real life, we'd fetch the weather from a weather API
    return "sunny"

@function_tool(name_override="fetch_data")
def read_file(ctx: RunContextWrapper[Any], path: str, directory: str | None = None) -> str:
    """Read the contents of a file.

    Args:
        path: The path to the file to read.
        directory: The directory to read the file from.
    """
    # In real life, we'd read the file from the file system
    return "<file contents>"

agent = Agent(
    name="Assistant",
    tools=[fetch_weather, read_file],
)

for tool in agent.tools:
    if isinstance(tool, FunctionTool):
        print(tool.name)
        print(tool.description)
        print(json.dumps(tool.params_json_schema, indent=2))
        print()

```

Expand to see output

```md-code__content
fetch_weather
Fetch the weather for a given location.
{
"$defs": {
  "Location": {
    "properties": {
      "lat": {
        "title": "Lat",
        "type": "number"
      },
      "long": {
        "title": "Long",
        "type": "number"
      }
    },
    "required": [\
      "lat",\
      "long"\
    ],
    "title": "Location",
    "type": "object"
  }
},
"properties": {
  "location": {
    "$ref": "#/$defs/Location",
    "description": "The location to fetch the weather for."
  }
},
"required": [\
  "location"\
],
"title": "fetch_weather_args",
"type": "object"
}

fetch_data
Read the contents of a file.
{
"properties": {
  "path": {
    "description": "The path to the file to read.",
    "title": "Path",
    "type": "string"
  },
  "directory": {
    "anyOf": [\
      {\
        "type": "string"\
      },\
      {\
        "type": "null"\
      }\
    ],
    "default": null,
    "description": "The directory to read the file from.",
    "title": "Directory"
  }
},
"required": [\
  "path"\
],
"title": "fetch_data_args",
"type": "object"
}

```

### Custom function tools

Sometimes, you don't want to use a Python function as a tool. You can directly create a [`FunctionTool`](https://openai.github.io/openai-agents-python/ref/tool/#agents.tool.FunctionTool "FunctionTool            dataclass   ") if you prefer. You'll need to provide:

- `name`
- `description`
- `params_json_schema`, which is the JSON schema for the arguments
- `on_invoke_tool`, which is an async function that receives the context and the arguments as a JSON string, and must return the tool output as a string.

```md-code__content
from typing import Any

from pydantic import BaseModel

from agents import RunContextWrapper, FunctionTool

def do_some_work(data: str) -> str:
    return "done"

class FunctionArgs(BaseModel):
    username: str
    age: int

async def run_function(ctx: RunContextWrapper[Any], args: str) -> str:
    parsed = FunctionArgs.model_validate_json(args)
    return do_some_work(data=f"{parsed.username} is {parsed.age} years old")

tool = FunctionTool(
    name="process_user",
    description="Processes extracted user data",
    params_json_schema=FunctionArgs.model_json_schema(),
    on_invoke_tool=run_function,
)

```

### Automatic argument and docstring parsing

As mentioned before, we automatically parse the function signature to extract the schema for the tool, and we parse the docstring to extract descriptions for the tool and for individual arguments. Some notes on that:

1. The signature parsing is done via the `inspect` module. We use type annotations to understand the types for the arguments, and dynamically build a Pydantic model to represent the overall schema. It supports most types, including Python primitives, Pydantic models, TypedDicts, and more.
2. We use `griffe` to parse docstrings. Supported docstring formats are `google`, `sphinx` and `numpy`. We attempt to automatically detect the docstring format, but this is best-effort and you can explicitly set it when calling `function_tool`. You can also disable docstring parsing by setting `use_docstring_info` to `False`.

The code for the schema extraction lives in [`agents.function_schema`](https://openai.github.io/openai-agents-python/ref/function_schema/#agents.function_schema).

## Agents as tools

In some workflows, you may want a central agent to orchestrate a network of specialized agents, instead of handing off control. You can do this by modeling agents as tools.

```md-code__content
from agents import Agent, Runner
import asyncio

spanish_agent = Agent(
    name="Spanish agent",
    instructions="You translate the user's message to Spanish",
)

french_agent = Agent(
    name="French agent",
    instructions="You translate the user's message to French",
)

orchestrator_agent = Agent(
    name="orchestrator_agent",
    instructions=(
        "You are a translation agent. You use the tools given to you to translate."
        "If asked for multiple translations, you call the relevant tools."
    ),
    tools=[\
        spanish_agent.as_tool(\
            tool_name="translate_to_spanish",\
            tool_description="Translate the user's message to Spanish",\
        ),\
        french_agent.as_tool(\
            tool_name="translate_to_french",\
            tool_description="Translate the user's message to French",\
        ),\
    ],
)

async def main():
    result = await Runner.run(orchestrator_agent, input="Say 'Hello, how are you?' in Spanish.")
    print(result.final_output)

```

## Handling errors in function tools

When you create a function tool via `@function_tool`, you can pass a `failure_error_function`. This is a function that provides an error response to the LLM in case the tool call crashes.

- By default (i.e. if you don't pass anything), it runs a `default_tool_error_function` which tells the LLM an error occurred.
- If you pass your own error function, it runs that instead, and sends the response to the LLM.
- If you explicitly pass `None`, then any tool call errors will be re-raised for you to handle. This could be a `ModelBehaviorError` if the model produced invalid JSON, or a `UserError` if your code crashed, etc.

If you are manually creating a `FunctionTool` object, then you must handle errors inside the `on_invoke_tool` function.

## OpenAI Agents Results

[Skip to content](https://openai.github.io/openai-agents-python/results/#results)

# Results

When you call the `Runner.run` methods, you either get a:

- [`RunResult`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResult "RunResult            dataclass   ") if you call `run` or `run_sync`
- [`RunResultStreaming`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultStreaming "RunResultStreaming            dataclass   ") if you call `run_streamed`

Both of these inherit from [`RunResultBase`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase "RunResultBase            dataclass   "), which is where most useful information is present.

## Final output

The [`final_output`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.final_output "final_output            instance-attribute   ") property contains the final output of the last agent that ran. This is either:

- a `str`, if the last agent didn't have an `output_type` defined
- an object of type `last_agent.output_type`, if the agent had an output type defined.

Note

`final_output` is of type `Any`. We can't statically type this, because of handoffs. If handoffs occur, that means any Agent might be the last agent, so we don't statically know the set of possible output types.

## Inputs for the next turn

You can use [`result.to_input_list()`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.to_input_list "to_input_list") to turn the result into an input list that concatenates the original input you provided, to the items generated during the agent run. This makes it convenient to take the outputs of one agent run and pass them into another run, or to run it in a loop and append new user inputs each time.

## Last agent

The [`last_agent`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.last_agent "last_agent            abstractmethod       property   ") property contains the last agent that ran. Depending on your application, this is often useful for the next time the user inputs something. For example, if you have a frontline triage agent that hands off to a language-specific agent, you can store the last agent, and re-use it the next time the user messages the agent.

## New items

The [`new_items`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.new_items "new_items            instance-attribute   ") property contains the new items generated during the run. The items are [`RunItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.RunItem "RunItem            module-attribute   ") s. A run item wraps the raw item generated by the LLM.

- [`MessageOutputItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.MessageOutputItem "MessageOutputItem            dataclass   ") indicates a message from the LLM. The raw item is the message generated.
- [`HandoffCallItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.HandoffCallItem "HandoffCallItem            dataclass   ") indicates that the LLM called the handoff tool. The raw item is the tool call item from the LLM.
- [`HandoffOutputItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.HandoffOutputItem "HandoffOutputItem            dataclass   ") indicates that a handoff occurred. The raw item is the tool response to the handoff tool call. You can also access the source/target agents from the item.
- [`ToolCallItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.ToolCallItem "ToolCallItem            dataclass   ") indicates that the LLM invoked a tool.
- [`ToolCallOutputItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.ToolCallOutputItem "ToolCallOutputItem            dataclass   ") indicates that a tool was called. The raw item is the tool response. You can also access the tool output from the item.
- [`ReasoningItem`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.ReasoningItem "ReasoningItem            dataclass   ") indicates a reasoning item from the LLM. The raw item is the reasoning generated.

## Other information

### Guardrail results

The [`input_guardrail_results`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.input_guardrail_results "input_guardrail_results            instance-attribute   ") and [`output_guardrail_results`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.output_guardrail_results "output_guardrail_results            instance-attribute   ") properties contain the results of the guardrails, if any. Guardrail results can sometimes contain useful information you want to log or store, so we make these available to you.

### Raw responses

The [`raw_responses`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.raw_responses "raw_responses            instance-attribute   ") property contains the [`ModelResponse`](https://openai.github.io/openai-agents-python/ref/items/#agents.items.ModelResponse "ModelResponse            dataclass   ") s generated by the LLM.

### Original input

The [`input`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultBase.input "input            instance-attribute   ") property contains the original input you provided to the `run` method. In most cases you won't need this, but it's available in case you do.

## Agent Streaming Guide

[Skip to content](https://openai.github.io/openai-agents-python/streaming/#streaming)

# Streaming

Streaming lets you subscribe to updates of the agent run as it proceeds. This can be useful for showing the end-user progress updates and partial responses.

To stream, you can call [`Runner.run_streamed()`](https://openai.github.io/openai-agents-python/ref/run/#agents.run.Runner.run_streamed "run_streamed            classmethod   "), which will give you a [`RunResultStreaming`](https://openai.github.io/openai-agents-python/ref/result/#agents.result.RunResultStreaming "RunResultStreaming            dataclass   "). Calling `result.stream_events()` gives you an async stream of [`StreamEvent`](https://openai.github.io/openai-agents-python/ref/stream_events/#agents.stream_events.StreamEvent "StreamEvent            module-attribute   ") objects, which are described below.

## Raw response events

[`RawResponsesStreamEvent`](https://openai.github.io/openai-agents-python/ref/stream_events/#agents.stream_events.RawResponsesStreamEvent "RawResponsesStreamEvent            dataclass   ") are raw events passed directly from the LLM. They are in OpenAI Responses API format, which means each event has a type (like `response.created`, `response.output_text.delta`, etc) and data. These events are useful if you want to stream response messages to the user as soon as they are generated.

For example, this will output the text generated by the LLM token-by-token.

```md-code__content
import asyncio
from openai.types.responses import ResponseTextDeltaEvent
from agents import Agent, Runner

async def main():
    agent = Agent(
        name="Joker",
        instructions="You are a helpful assistant.",
    )

    result = Runner.run_streamed(agent, input="Please tell me 5 jokes.")
    async for event in result.stream_events():
        if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
            print(event.data.delta, end="", flush=True)

if __name__ == "__main__":
    asyncio.run(main())

```

## Run item events and agent events

[`RunItemStreamEvent`](https://openai.github.io/openai-agents-python/ref/stream_events/#agents.stream_events.RunItemStreamEvent "RunItemStreamEvent            dataclass   ") s are higher level events. They inform you when an item has been fully generated. This allows you to push progress updates at the level of "message generated", "tool ran", etc, instead of each token. Similarly, [`AgentUpdatedStreamEvent`](https://openai.github.io/openai-agents-python/ref/stream_events/#agents.stream_events.AgentUpdatedStreamEvent "AgentUpdatedStreamEvent            dataclass   ") gives you updates when the current agent changes (e.g. as the result of a handoff).

For example, this will ignore raw events and stream updates to the user.

```md-code__content
import asyncio
import random
from agents import Agent, ItemHelpers, Runner, function_tool

@function_tool
def how_many_jokes() -> int:
    return random.randint(1, 10)

async def main():
    agent = Agent(
        name="Joker",
        instructions="First call the `how_many_jokes` tool, then tell that many jokes.",
        tools=[how_many_jokes],
    )

    result = Runner.run_streamed(
        agent,
        input="Hello",
    )
    print("=== Run starting ===")

    async for event in result.stream_events():
        # We'll ignore the raw responses event deltas
        if event.type == "raw_response_event":
            continue
        # When the agent updates, print that
        elif event.type == "agent_updated_stream_event":
            print(f"Agent updated: {event.new_agent.name}")
            continue
        # When items are generated, print them
        elif event.type == "run_item_stream_event":
            if event.item.type == "tool_call_item":
                print("-- Tool was called")
            elif event.item.type == "tool_call_output_item":
                print(f"-- Tool output: {event.item.output}")
            elif event.item.type == "message_output_item":
                print(f"-- Message output:\n {ItemHelpers.text_message_output(event.item)}")
            else:
                pass  # Ignore other event types

    print("=== Run complete ===")

if __name__ == "__main__":
    asyncio.run(main())

```

## Guardrails for Agents

[Skip to content](https://openai.github.io/openai-agents-python/ref/guardrail/#guardrails)

# `Guardrails`

### GuardrailFunctionOutput`dataclass`

The output of a guardrail function.

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>``` | ```md-code__content<br>@dataclass<br>class GuardrailFunctionOutput:<br>    """The output of a guardrail function."""<br>    output_info: Any<br>    """<br>    Optional information about the guardrail's output. For example, the guardrail could include<br>    information about the checks it performed and granular results.<br>    """<br>    tripwire_triggered: bool<br>    """<br>    Whether the tripwire was triggered. If triggered, the agent's execution will be halted.<br>    """<br>``` |

#### output\_info`instance-attribute`

```md-code__content
output_info: Any

```

Optional information about the guardrail's output. For example, the guardrail could include
information about the checks it performed and granular results.

#### tripwire\_triggered`instance-attribute`

```md-code__content
tripwire_triggered: bool

```

Whether the tripwire was triggered. If triggered, the agent's execution will be halted.

### InputGuardrailResult`dataclass`

The result of a guardrail run.

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>``` | ```md-code__content<br>@dataclass<br>class InputGuardrailResult:<br>    """The result of a guardrail run."""<br>    guardrail: InputGuardrail[Any]<br>    """<br>    The guardrail that was run.<br>    """<br>    output: GuardrailFunctionOutput<br>    """The output of the guardrail function."""<br>``` |

#### guardrail`instance-attribute`

```md-code__content
guardrail: InputGuardrail[Any]

```

The guardrail that was run.

#### output`instance-attribute`

```md-code__content
output: GuardrailFunctionOutput

```

The output of the guardrail function.

### OutputGuardrailResult`dataclass`

The result of a guardrail run.

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>``` | ```md-code__content<br>@dataclass<br>class OutputGuardrailResult:<br>    """The result of a guardrail run."""<br>    guardrail: OutputGuardrail[Any]<br>    """<br>    The guardrail that was run.<br>    """<br>    agent_output: Any<br>    """<br>    The output of the agent that was checked by the guardrail.<br>    """<br>    agent: Agent[Any]<br>    """<br>    The agent that was checked by the guardrail.<br>    """<br>    output: GuardrailFunctionOutput<br>    """The output of the guardrail function."""<br>``` |

#### guardrail`instance-attribute`

```md-code__content
guardrail: OutputGuardrail[Any]

```

The guardrail that was run.

#### agent\_output`instance-attribute`

```md-code__content
agent_output: Any

```

The output of the agent that was checked by the guardrail.

#### agent`instance-attribute`

```md-code__content
agent: Agent[Any]

```

The agent that was checked by the guardrail.

#### output`instance-attribute`

```md-code__content
output: GuardrailFunctionOutput

```

The output of the guardrail function.

### InputGuardrail`dataclass`

Bases: `Generic[TContext]`

Input guardrails are checks that run in parallel to the agent's execution.
They can be used to do things like:
\- Check if input messages are off-topic
\- Take over control of the agent's execution if an unexpected input is detected

You can use the `@input_guardrail()` decorator to turn a function into an `InputGuardrail`, or
create an `InputGuardrail` manually.

Guardrails return a `GuardrailResult`. If `result.tripwire_triggered` is `True`, the agent
execution will immediately stop and a `InputGuardrailTripwireTriggered` exception will be raised

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>``` | ```md-code__content<br>@dataclass<br>class InputGuardrail(Generic[TContext]):<br>    """Input guardrails are checks that run in parallel to the agent's execution.<br>    They can be used to do things like:<br>    - Check if input messages are off-topic<br>    - Take over control of the agent's execution if an unexpected input is detected<br>    You can use the `@input_guardrail()` decorator to turn a function into an `InputGuardrail`, or<br>    create an `InputGuardrail` manually.<br>    Guardrails return a `GuardrailResult`. If `result.tripwire_triggered` is `True`, the agent<br>    execution will immediately stop and a `InputGuardrailTripwireTriggered` exception will be raised<br>    """<br>    guardrail_function: Callable[<br>        [RunContextWrapper[TContext], Agent[Any], str | list[TResponseInputItem]],<br>        MaybeAwaitable[GuardrailFunctionOutput],<br>    ]<br>    """A function that receives the agent input and the context, and returns a<br>     `GuardrailResult`. The result marks whether the tripwire was triggered, and can optionally<br>     include information about the guardrail's output.<br>    """<br>    name: str | None = None<br>    """The name of the guardrail, used for tracing. If not provided, we'll use the guardrail<br>    function's name.<br>    """<br>    def get_name(self) -> str:<br>        if self.name:<br>            return self.name<br>        return self.guardrail_function.**name**<br>    async def run(<br>        self,<br>        agent: Agent[Any],<br>        input: str | list[TResponseInputItem],<br>        context: RunContextWrapper[TContext],<br>    ) -> InputGuardrailResult:<br>        if not callable(self.guardrail_function):<br>            raise UserError(f"Guardrail function must be callable, got {self.guardrail_function}")<br>        output = self.guardrail_function(context, agent, input)<br>        if inspect.isawaitable(output):<br>            return InputGuardrailResult(<br>                guardrail=self,<br>                output=await output,<br>            )<br>        return InputGuardrailResult(<br>            guardrail=self,<br>            output=output,<br>        )<br>``` |

#### guardrail\_function`instance-attribute`

```md-code__content
guardrail_function: Callable[\
    [\
        RunContextWrapper[TContext],\
        Agent[Any],\
        str | list[TResponseInputItem],\
    ],\
    MaybeAwaitable[GuardrailFunctionOutput],\
]

```

A function that receives the agent input and the context, and returns a
`GuardrailResult`. The result marks whether the tripwire was triggered, and can optionally
include information about the guardrail's output.

#### name`class-attribute``instance-attribute`

```md-code__content
name: str | None = None

```

The name of the guardrail, used for tracing. If not provided, we'll use the guardrail
function's name.

### OutputGuardrail`dataclass`

Bases: `Generic[TContext]`

Output guardrails are checks that run on the final output of an agent.
They can be used to do check if the output passes certain validation criteria

You can use the `@output_guardrail()` decorator to turn a function into an `OutputGuardrail`,
or create an `OutputGuardrail` manually.

Guardrails return a `GuardrailResult`. If `result.tripwire_triggered` is `True`, a
`OutputGuardrailTripwireTriggered` exception will be raised.

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>``` | ```md-code__content<br>@dataclass<br>class OutputGuardrail(Generic[TContext]):<br>    """Output guardrails are checks that run on the final output of an agent.<br>    They can be used to do check if the output passes certain validation criteria<br>    You can use the `@output_guardrail()` decorator to turn a function into an `OutputGuardrail`,<br>    or create an `OutputGuardrail` manually.<br>    Guardrails return a `GuardrailResult`. If `result.tripwire_triggered` is `True`, a<br>    `OutputGuardrailTripwireTriggered` exception will be raised.<br>    """<br>    guardrail_function: Callable[<br>        [RunContextWrapper[TContext], Agent[Any], Any],<br>        MaybeAwaitable[GuardrailFunctionOutput],<br>    ]<br>    """A function that receives the final agent, its output, and the context, and returns a<br>     `GuardrailResult`. The result marks whether the tripwire was triggered, and can optionally<br>     include information about the guardrail's output.<br>    """<br>    name: str | None = None<br>    """The name of the guardrail, used for tracing. If not provided, we'll use the guardrail<br>    function's name.<br>    """<br>    def get_name(self) -> str:<br>        if self.name:<br>            return self.name<br>        return self.guardrail_function.**name**<br>    async def run(<br>        self, context: RunContextWrapper[TContext], agent: Agent[Any], agent_output: Any<br>    ) -> OutputGuardrailResult:<br>        if not callable(self.guardrail_function):<br>            raise UserError(f"Guardrail function must be callable, got {self.guardrail_function}")<br>        output = self.guardrail_function(context, agent, agent_output)<br>        if inspect.isawaitable(output):<br>            return OutputGuardrailResult(<br>                guardrail=self,<br>                agent=agent,<br>                agent_output=agent_output,<br>                output=await output,<br>            )<br>        return OutputGuardrailResult(<br>            guardrail=self,<br>            agent=agent,<br>            agent_output=agent_output,<br>            output=output,<br>        )<br>``` |

#### guardrail\_function`instance-attribute`

```md-code__content
guardrail_function: Callable[\
    [RunContextWrapper[TContext], Agent[Any], Any],\
    MaybeAwaitable[GuardrailFunctionOutput],\
]

```

A function that receives the final agent, its output, and the context, and returns a
`GuardrailResult`. The result marks whether the tripwire was triggered, and can optionally
include information about the guardrail's output.

#### name`class-attribute``instance-attribute`

```md-code__content
name: str | None = None

```

The name of the guardrail, used for tracing. If not provided, we'll use the guardrail
function's name.

### input\_guardrail

```md-code__content
input_guardrail(
    func: _InputGuardrailFuncSync[TContext_co],
) -> InputGuardrail[TContext_co]

```

```md-code__content
input_guardrail(
    func: _InputGuardrailFuncAsync[TContext_co],
) -> InputGuardrail[TContext_co]

```

```md-code__content
input_guardrail(
    *, name: str | None = None
) -> Callable[\
    [\
        _InputGuardrailFuncSync[TContext_co]\
        | _InputGuardrailFuncAsync[TContext_co]\
    ],\
    InputGuardrail[TContext_co],\
]

```

```md-code__content
input_guardrail(
    func: _InputGuardrailFuncSync[TContext_co]
    | _InputGuardrailFuncAsync[TContext_co]
    | None = None,
    *,
    name: str | None = None,
) -> (
    InputGuardrail[TContext_co]
    | Callable[\
        [\
            _InputGuardrailFuncSync[TContext_co]\
            | _InputGuardrailFuncAsync[TContext_co]\
        ],\
        InputGuardrail[TContext_co],\
    ]
)

```

Decorator that transforms a sync or async function into an `InputGuardrail`.
It can be used directly (no parentheses) or with keyword args, e.g.:

```
@input_guardrail
def my_sync_guardrail(...): ...

@input_guardrail(name="guardrail_name")
async def my_async_guardrail(...): ...

```

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>``` | ```md-code__content<br>def input_guardrail(<br>    func:_InputGuardrailFuncSync[TContext_co]<br>    | _InputGuardrailFuncAsync[TContext_co]<br>    | None = None,<br>    *,<br>    name: str | None = None,<br>) -> (<br>    InputGuardrail[TContext_co]<br>    | Callable[<br>        [_InputGuardrailFuncSync[TContext_co] | _InputGuardrailFuncAsync[TContext_co]],<br>        InputGuardrail[TContext_co],<br>    ]<br>):<br>    """<br>    Decorator that transforms a sync or async function into an `InputGuardrail`.<br>    It can be used directly (no parentheses) or with keyword args, e.g.:<br>        @input_guardrail<br>        def my_sync_guardrail(...): ...<br>        @input_guardrail(name="guardrail_name")<br>        async def my_async_guardrail(...): ...<br>    """<br>    def decorator(<br>        f: _InputGuardrailFuncSync[TContext_co] | _InputGuardrailFuncAsync[TContext_co],<br>    ) -> InputGuardrail[TContext_co]:<br>        return InputGuardrail(guardrail_function=f, name=name)<br>    if func is not None:<br>        # Decorator was used without parentheses<br>        return decorator(func)<br>    # Decorator used with keyword arguments<br>    return decorator<br>``` |

### output\_guardrail

```md-code__content
output_guardrail(
    func: _OutputGuardrailFuncSync[TContext_co],
) -> OutputGuardrail[TContext_co]

```

```md-code__content
output_guardrail(
    func: _OutputGuardrailFuncAsync[TContext_co],
) -> OutputGuardrail[TContext_co]

```

```md-code__content
output_guardrail(
    *, name: str | None = None
) -> Callable[\
    [\
        _OutputGuardrailFuncSync[TContext_co]\
        | _OutputGuardrailFuncAsync[TContext_co]\
    ],\
    OutputGuardrail[TContext_co],\
]

```

```md-code__content
output_guardrail(
    func: _OutputGuardrailFuncSync[TContext_co]
    | _OutputGuardrailFuncAsync[TContext_co]
    | None = None,
    *,
    name: str | None = None,
) -> (
    OutputGuardrail[TContext_co]
    | Callable[\
        [\
            _OutputGuardrailFuncSync[TContext_co]\
            | _OutputGuardrailFuncAsync[TContext_co]\
        ],\
        OutputGuardrail[TContext_co],\
    ]
)

```

Decorator that transforms a sync or async function into an `OutputGuardrail`.
It can be used directly (no parentheses) or with keyword args, e.g.:

```
@output_guardrail
def my_sync_guardrail(...): ...

@output_guardrail(name="guardrail_name")
async def my_async_guardrail(...): ...

```

Source code in `src/agents/guardrail.py`

|     |     |
| --- | --- |
| ```<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>``` | ```md-code__content<br>def output_guardrail(<br>    func:_OutputGuardrailFuncSync[TContext_co]<br>    | _OutputGuardrailFuncAsync[TContext_co]<br>    | None = None,<br>    *,<br>    name: str | None = None,<br>) -> (<br>    OutputGuardrail[TContext_co]<br>    | Callable[<br>        [_OutputGuardrailFuncSync[TContext_co] | _OutputGuardrailFuncAsync[TContext_co]],<br>        OutputGuardrail[TContext_co],<br>    ]<br>):<br>    """<br>    Decorator that transforms a sync or async function into an `OutputGuardrail`.<br>    It can be used directly (no parentheses) or with keyword args, e.g.:<br>        @output_guardrail<br>        def my_sync_guardrail(...): ...<br>        @output_guardrail(name="guardrail_name")<br>        async def my_async_guardrail(...): ...<br>    """<br>    def decorator(<br>        f: _OutputGuardrailFuncSync[TContext_co] | _OutputGuardrailFuncAsync[TContext_co],<br>    ) -> OutputGuardrail[TContext_co]:<br>        return OutputGuardrail(guardrail_function=f, name=name)<br>    if func is not None:<br>        # Decorator was used without parentheses<br>        return decorator(func)<br>    # Decorator used with keyword arguments<br>    return decorator<br>``` |

## Agents SDK Exceptions

[Skip to content](https://openai.github.io/openai-agents-python/ref/exceptions/#exceptions)

# `Exceptions`

### AgentsException

Bases: `Exception`

Base class for all exceptions in the Agents SDK.

Source code in `src/agents/exceptions.py`

|     |     |
| --- | --- |
| ```<br>7<br>8<br>``` | ```md-code__content<br>class AgentsException(Exception):<br>    """Base class for all exceptions in the Agents SDK."""<br>``` |

### MaxTurnsExceeded

Bases: `AgentsException`

Exception raised when the maximum number of turns is exceeded.

Source code in `src/agents/exceptions.py`

|     |     |
| --- | --- |
| ```<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>``` | ```md-code__content<br>class MaxTurnsExceeded(AgentsException):<br>    """Exception raised when the maximum number of turns is exceeded."""<br>    message: str<br>    def __init__(self, message: str):<br>        self.message = message<br>``` |

### ModelBehaviorError

Bases: `AgentsException`

Exception raised when the model does something unexpected, e.g. calling a tool that doesn't
exist, or providing malformed JSON.

Source code in `src/agents/exceptions.py`

|     |     |
| --- | --- |
| ```<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>``` | ```md-code__content<br>class ModelBehaviorError(AgentsException):<br>    """Exception raised when the model does something unexpected, e.g. calling a tool that doesn't<br>    exist, or providing malformed JSON.<br>    """<br>    message: str<br>    def __init__(self, message: str):<br>        self.message = message<br>``` |

### UserError

Bases: `AgentsException`

Exception raised when the user makes an error using the SDK.

Source code in `src/agents/exceptions.py`

|     |     |
| --- | --- |
| ```<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>``` | ```md-code__content<br>class UserError(AgentsException):<br>    """Exception raised when the user makes an error using the SDK."""<br>    message: str<br>    def __init__(self, message: str):<br>        self.message = message<br>``` |

### InputGuardrailTripwireTriggered

Bases: `AgentsException`

Exception raised when a guardrail tripwire is triggered.

Source code in `src/agents/exceptions.py`

|     |     |
| --- | --- |
| ```<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>``` | ```md-code__content<br>class InputGuardrailTripwireTriggered(AgentsException):<br>    """Exception raised when a guardrail tripwire is triggered."""<br>    guardrail_result: "InputGuardrailResult"<br>    """The result data of the guardrail that was triggered."""<br>    def __init__(self, guardrail_result: "InputGuardrailResult"):<br>        self.guardrail_result = guardrail_result<br>        super().__init__(<br>            f"Guardrail {guardrail_result.guardrail.__class__.__name__} triggered tripwire"<br>        )<br>``` |

#### guardrail\_result`instance-attribute`

```md-code__content
guardrail_result: InputGuardrailResult = guardrail_result

```

The result data of the guardrail that was triggered.

### OutputGuardrailTripwireTriggered

Bases: `AgentsException`

Exception raised when a guardrail tripwire is triggered.

Source code in `src/agents/exceptions.py`

|     |     |
| --- | --- |
| ```<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>``` | ```md-code__content<br>class OutputGuardrailTripwireTriggered(AgentsException):<br>    """Exception raised when a guardrail tripwire is triggered."""<br>    guardrail_result: "OutputGuardrailResult"<br>    """The result data of the guardrail that was triggered."""<br>    def __init__(self, guardrail_result: "OutputGuardrailResult"):<br>        self.guardrail_result = guardrail_result<br>        super().__init__(<br>            f"Guardrail {guardrail_result.guardrail.__class__.__name__} triggered tripwire"<br>        )<br>``` |

#### guardrail\_result`instance-attribute`

```md-code__content
guardrail_result: OutputGuardrailResult = guardrail_result

```

The result data of the guardrail that was triggered.

## Agent Output Schema

[Skip to content](https://openai.github.io/openai-agents-python/ref/agent_output/#agent-output)

# `Agent output`

### AgentOutputSchema`dataclass`

An object that captures the JSON schema of the output, as well as validating/parsing JSON
produced by the LLM into the output type.

Source code in `src/agents/agent_output.py`

|     |     |
| --- | --- |
| ```<br> 15<br> 16<br> 17<br> 18<br> 19<br> 20<br> 21<br> 22<br> 23<br> 24<br> 25<br> 26<br> 27<br> 28<br> 29<br> 30<br> 31<br> 32<br> 33<br> 34<br> 35<br> 36<br> 37<br> 38<br> 39<br> 40<br> 41<br> 42<br> 43<br> 44<br> 45<br> 46<br> 47<br> 48<br> 49<br> 50<br> 51<br> 52<br> 53<br> 54<br> 55<br> 56<br> 57<br> 58<br> 59<br> 60<br> 61<br> 62<br> 63<br> 64<br> 65<br> 66<br> 67<br> 68<br> 69<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>``` | ```md-code__content<br>@dataclass(init=False)<br>class AgentOutputSchema:<br>    """An object that captures the JSON schema of the output, as well as validating/parsing JSON<br>    produced by the LLM into the output type.<br>    """<br>    output_type: type[Any]<br>    """The type of the output."""<br>    _type_adapter: TypeAdapter[Any]<br>    """A type adapter that wraps the output type, so that we can validate JSON."""<br>    _is_wrapped: bool<br>    """Whether the output type is wrapped in a dictionary. This is generally done if the base<br>    output type cannot be represented as a JSON Schema object.<br>    """<br>    _output_schema: dict[str, Any]<br>    """The JSON schema of the output."""<br>    strict_json_schema: bool<br>    """Whether the JSON schema is in strict mode. We **strongly** recommend setting this to True,<br>    as it increases the likelihood of correct JSON input.<br>    """<br>    def __init__(self, output_type: type[Any], strict_json_schema: bool = True):<br>        """<br>        Args:<br>            output_type: The type of the output.<br>            strict_json_schema: Whether the JSON schema is in strict mode. We **strongly** recommend<br>                setting this to True, as it increases the likelihood of correct JSON input.<br>        """<br>        self.output_type = output_type<br>        self.strict_json_schema = strict_json_schema<br>        if output_type is None or output_type is str:<br>            self._is_wrapped = False<br>            self._type_adapter = TypeAdapter(output_type)<br>            self._output_schema = self._type_adapter.json_schema()<br>            return<br>        # We should wrap for things that are not plain text, and for things that would definitely<br>        # not be a JSON Schema object.<br>        self._is_wrapped = not _is_subclass_of_base_model_or_dict(output_type)<br>        if self._is_wrapped:<br>            OutputType = TypedDict(<br>                "OutputType",<br>                {<br>                    _WRAPPER_DICT_KEY: output_type,  # type: ignore<br>                },<br>            )<br>            self._type_adapter = TypeAdapter(OutputType)<br>            self._output_schema = self._type_adapter.json_schema()<br>        else:<br>            self._type_adapter = TypeAdapter(output_type)<br>            self._output_schema = self._type_adapter.json_schema()<br>        if self.strict_json_schema:<br>            self._output_schema = ensure_strict_json_schema(self._output_schema)<br>    def is_plain_text(self) -> bool:<br>        """Whether the output type is plain text (versus a JSON object)."""<br>        return self.output_type is None or self.output_type is str<br>    def json_schema(self) -> dict[str, Any]:<br>        """The JSON schema of the output type."""<br>        if self.is_plain_text():<br>            raise UserError("Output type is plain text, so no JSON schema is available")<br>        return self._output_schema<br>    def validate_json(self, json_str: str, partial: bool = False) -> Any:<br>        """Validate a JSON string against the output type. Returns the validated object, or raises<br>        a `ModelBehaviorError` if the JSON is invalid.<br>        """<br>        validated = _json.validate_json(json_str, self._type_adapter, partial)<br>        if self._is_wrapped:<br>            if not isinstance(validated, dict):<br>                _error_tracing.attach_error_to_current_span(<br>                    SpanError(<br>                        message="Invalid JSON",<br>                        data={"details": f"Expected a dict, got {type(validated)}"},<br>                    )<br>                )<br>                raise ModelBehaviorError(<br>                    f"Expected a dict, got {type(validated)} for JSON: {json_str}"<br>                )<br>            if _WRAPPER_DICT_KEY not in validated:<br>                _error_tracing.attach_error_to_current_span(<br>                    SpanError(<br>                        message="Invalid JSON",<br>                        data={"details": f"Could not find key {_WRAPPER_DICT_KEY} in JSON"},<br>                    )<br>                )<br>                raise ModelBehaviorError(<br>                    f"Could not find key {_WRAPPER_DICT_KEY} in JSON: {json_str}"<br>                )<br>            return validated[_WRAPPER_DICT_KEY]<br>        return validated<br>    def output_type_name(self) -> str:<br>        """The name of the output type."""<br>        return _type_to_str(self.output_type)<br>``` |

#### \_type\_adapter`instance-attribute`

```md-code__content
_type_adapter: TypeAdapter[Any]

```

A type adapter that wraps the output type, so that we can validate JSON.

#### \_output\_schema`instance-attribute`

```md-code__content
_output_schema: dict[str, Any]

```

The JSON schema of the output.

#### output\_type`instance-attribute`

```md-code__content
output_type: type[Any] = output_type

```

The type of the output.

#### strict\_json\_schema`instance-attribute`

```md-code__content
strict_json_schema: bool = strict_json_schema

```

Whether the JSON schema is in strict mode. We **strongly** recommend setting this to True,
as it increases the likelihood of correct JSON input.

#### \_is\_wrapped`instance-attribute`

```md-code__content
_is_wrapped: bool = not _is_subclass_of_base_model_or_dict(
    output_type
)

```

Whether the output type is wrapped in a dictionary. This is generally done if the base
output type cannot be represented as a JSON Schema object.

#### \_\_init\_\_

```md-code__content
__init__(
    output_type: type[Any], strict_json_schema: bool = True
)

```

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `output_type` | `type[Any]` | The type of the output. | _required_ |
| `strict_json_schema` | `bool` | Whether the JSON schema is in strict mode. We **strongly** recommend<br>setting this to True, as it increases the likelihood of correct JSON input. | `True` |

Source code in `src/agents/agent_output.py`

|     |     |
| --- | --- |
| ```<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>``` | ```md-code__content<br>def __init__(self, output_type: type[Any], strict_json_schema: bool = True):<br>    """<br>    Args:<br>        output_type: The type of the output.<br>        strict_json_schema: Whether the JSON schema is in strict mode. We **strongly** recommend<br>            setting this to True, as it increases the likelihood of correct JSON input.<br>    """<br>    self.output_type = output_type<br>    self.strict_json_schema = strict_json_schema<br>    if output_type is None or output_type is str:<br>        self._is_wrapped = False<br>        self._type_adapter = TypeAdapter(output_type)<br>        self._output_schema = self._type_adapter.json_schema()<br>        return<br>    # We should wrap for things that are not plain text, and for things that would definitely<br>    # not be a JSON Schema object.<br>    self._is_wrapped = not _is_subclass_of_base_model_or_dict(output_type)<br>    if self._is_wrapped:<br>        OutputType = TypedDict(<br>            "OutputType",<br>            {<br>                _WRAPPER_DICT_KEY: output_type,  # type: ignore<br>            },<br>        )<br>        self._type_adapter = TypeAdapter(OutputType)<br>        self._output_schema = self._type_adapter.json_schema()<br>    else:<br>        self._type_adapter = TypeAdapter(output_type)<br>        self._output_schema = self._type_adapter.json_schema()<br>    if self.strict_json_schema:<br>        self._output_schema = ensure_strict_json_schema(self._output_schema)<br>``` |

#### is\_plain\_text

```md-code__content
is_plain_text() -> bool

```

Whether the output type is plain text (versus a JSON object).

Source code in `src/agents/agent_output.py`

|     |     |
| --- | --- |
| ```<br>76<br>77<br>78<br>``` | ```md-code__content<br>def is_plain_text(self) -> bool:<br>    """Whether the output type is plain text (versus a JSON object)."""<br>    return self.output_type is None or self.output_type is str<br>``` |

#### json\_schema

```md-code__content
json_schema() -> dict[str, Any]

```

The JSON schema of the output type.

Source code in `src/agents/agent_output.py`

|     |     |
| --- | --- |
| ```<br>80<br>81<br>82<br>83<br>84<br>``` | ```md-code__content<br>def json_schema(self) -> dict[str, Any]:<br>    """The JSON schema of the output type."""<br>    if self.is_plain_text():<br>        raise UserError("Output type is plain text, so no JSON schema is available")<br>    return self._output_schema<br>``` |

#### validate\_json

```md-code__content
validate_json(json_str: str, partial: bool = False) -> Any

```

Validate a JSON string against the output type. Returns the validated object, or raises
a `ModelBehaviorError` if the JSON is invalid.

Source code in `src/agents/agent_output.py`

|     |     |
| --- | --- |
| ```<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>``` | ```md-code__content<br>def validate_json(self, json_str: str, partial: bool = False) -> Any:<br>    """Validate a JSON string against the output type. Returns the validated object, or raises<br>    a `ModelBehaviorError` if the JSON is invalid.<br>    """<br>    validated = _json.validate_json(json_str, self._type_adapter, partial)<br>    if self._is_wrapped:<br>        if not isinstance(validated, dict):<br>            _error_tracing.attach_error_to_current_span(<br>                SpanError(<br>                    message="Invalid JSON",<br>                    data={"details": f"Expected a dict, got {type(validated)}"},<br>                )<br>            )<br>            raise ModelBehaviorError(<br>                f"Expected a dict, got {type(validated)} for JSON: {json_str}"<br>            )<br>        if _WRAPPER_DICT_KEY not in validated:<br>            _error_tracing.attach_error_to_current_span(<br>                SpanError(<br>                    message="Invalid JSON",<br>                    data={"details": f"Could not find key {_WRAPPER_DICT_KEY} in JSON"},<br>                )<br>            )<br>            raise ModelBehaviorError(<br>                f"Could not find key {_WRAPPER_DICT_KEY} in JSON: {json_str}"<br>            )<br>        return validated[_WRAPPER_DICT_KEY]<br>    return validated<br>``` |

#### output\_type\_name

```md-code__content
output_type_name() -> str

```

The name of the output type.

Source code in `src/agents/agent_output.py`

|     |     |
| --- | --- |
| ```<br>116<br>117<br>118<br>``` | ```md-code__content<br>def output_type_name(self) -> str:<br>    """The name of the output type."""<br>    return _type_to_str(self.output_type)<br>``` |

## AI Agents Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/agent/#agents)

# `Agents`

### Agent`dataclass`

Bases: `Generic[TContext]`

An agent is an AI model configured with instructions, tools, guardrails, handoffs and more.

We strongly recommend passing `instructions`, which is the "system prompt" for the agent. In
addition, you can pass `handoff_description`, which is a human-readable description of the
agent, used when the agent is used inside tools/handoffs.

Agents are generic on the context type. The context is a (mutable) object you create. It is
passed to tool functions, handoffs, guardrails, etc.

Source code in `src/agents/agent.py`

|     |     |
| --- | --- |
| ```<br> 25<br> 26<br> 27<br> 28<br> 29<br> 30<br> 31<br> 32<br> 33<br> 34<br> 35<br> 36<br> 37<br> 38<br> 39<br> 40<br> 41<br> 42<br> 43<br> 44<br> 45<br> 46<br> 47<br> 48<br> 49<br> 50<br> 51<br> 52<br> 53<br> 54<br> 55<br> 56<br> 57<br> 58<br> 59<br> 60<br> 61<br> 62<br> 63<br> 64<br> 65<br> 66<br> 67<br> 68<br> 69<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>``` | ````md-code__content<br>@dataclass<br>class Agent(Generic[TContext]):<br>    """An agent is an AI model configured with instructions, tools, guardrails, handoffs and more.<br>    We strongly recommend passing `instructions`, which is the "system prompt" for the agent. In<br>    addition, you can pass `handoff_description`, which is a human-readable description of the<br>    agent, used when the agent is used inside tools/handoffs.<br>    Agents are generic on the context type. The context is a (mutable) object you create. It is<br>    passed to tool functions, handoffs, guardrails, etc.<br>    """<br>    name: str<br>    """The name of the agent."""<br>    instructions: (<br>        str<br>        | Callable[<br>            [RunContextWrapper[TContext], Agent[TContext]],<br>            MaybeAwaitable[str],<br>        ]<br>        | None<br>    ) = None<br>    """The instructions for the agent. Will be used as the "system prompt" when this agent is<br>    invoked. Describes what the agent should do, and how it responds.<br>    Can either be a string, or a function that dynamically generates instructions for the agent. If<br>    you provide a function, it will be called with the context and the agent instance. It must<br>    return a string.<br>    """<br>    handoff_description: str | None = None<br>    """A description of the agent. This is used when the agent is used as a handoff, so that an<br>    LLM knows what it does and when to invoke it.<br>    """<br>    handoffs: list[Agent[Any] | Handoff[TContext]] = field(default_factory=list)<br>    """Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,<br>    and the agent can choose to delegate to them if relevant. Allows for separation of concerns and<br>    modularity.<br>    """<br>    model: str | Model | None = None<br>    """The model implementation to use when invoking the LLM.<br>    By default, if not set, the agent will use the default model configured in<br>    `model_settings.DEFAULT_MODEL`.<br>    """<br>    model_settings: ModelSettings = field(default_factory=ModelSettings)<br>    """Configures model-specific tuning parameters (e.g. temperature, top_p).<br>    """<br>    tools: list[Tool] = field(default_factory=list)<br>    """A list of tools that the agent can use."""<br>    input_guardrails: list[InputGuardrail[TContext]] = field(default_factory=list)<br>    """A list of checks that run in parallel to the agent's execution, before generating a<br>    response. Runs only if the agent is the first agent in the chain.<br>    """<br>    output_guardrails: list[OutputGuardrail[TContext]] = field(default_factory=list)<br>    """A list of checks that run on the final output of the agent, after generating a response.<br>    Runs only if the agent produces a final output.<br>    """<br>    output_type: type[Any] | None = None<br>    """The type of the output object. If not provided, the output will be `str`."""<br>    hooks: AgentHooks[TContext] | None = None<br>    """A class that receives callbacks on various lifecycle events for this agent.<br>    """<br>    def clone(self, **kwargs: Any) -> Agent[TContext]:<br>        """Make a copy of the agent, with the given arguments changed. For example, you could do:<br>        ```<br>        new_agent = agent.clone(instructions="New instructions")<br>```<br>        """<br>        return dataclasses.replace(self,**kwargs)<br>    def as_tool(<br>        self,<br>        tool_name: str | None,<br>        tool_description: str | None,<br>        custom_output_extractor: Callable[[RunResult], Awaitable[str]] | None = None,<br>    ) -> Tool:<br>        """Transform this agent into a tool, callable by other agents.<br>        This is different from handoffs in two ways:<br>        1. In handoffs, the new agent receives the conversation history. In this tool, the new agent<br>           receives generated input.<br>        2. In handoffs, the new agent takes over the conversation. In this tool, the new agent is<br>           called as a tool, and the conversation is continued by the original agent.<br>        Args:<br>            tool_name: The name of the tool. If not provided, the agent's name will be used.<br>            tool_description: The description of the tool, which should indicate what it does and<br>                when to use it.<br>            custom_output_extractor: A function that extracts the output from the agent. If not<br>                provided, the last message from the agent will be used.<br>        """<br>        @function_tool(<br>            name_override=tool_name or_transforms.transform_string_function_style(self.name),<br>            description_override=tool_description or "",<br>        )<br>        async def run_agent(context: RunContextWrapper, input: str) -> str:<br>            from .run import Runner<br>            output = await Runner.run(<br>                starting_agent=self,<br>                input=input,<br>                context=context.context,<br>            )<br>            if custom_output_extractor:<br>                return await custom_output_extractor(output)<br>            return ItemHelpers.text_message_outputs(output.new_items)<br>        return run_agent<br>    async def get_system_prompt(self, run_context: RunContextWrapper[TContext]) -> str | None:<br>        """Get the system prompt for the agent."""<br>        if isinstance(self.instructions, str):<br>            return self.instructions<br>        elif callable(self.instructions):<br>            if inspect.iscoroutinefunction(self.instructions):<br>                return await cast(Awaitable[str], self.instructions(run_context, self))<br>            else:<br>                return cast(str, self.instructions(run_context, self))<br>        elif self.instructions is not None:<br>            logger.error(f"Instructions must be a string or a function, got {self.instructions}")<br>        return None<br>```` |

#### name`instance-attribute`

```md-code__content
name: str

```

The name of the agent.

#### instructions`class-attribute``instance-attribute`

```md-code__content
instructions: (
    str
    | Callable[\
        [RunContextWrapper[TContext], Agent[TContext]],\
        MaybeAwaitable[str],\
    ]
    | None
) = None

```

The instructions for the agent. Will be used as the "system prompt" when this agent is
invoked. Describes what the agent should do, and how it responds.

Can either be a string, or a function that dynamically generates instructions for the agent. If
you provide a function, it will be called with the context and the agent instance. It must
return a string.

#### handoff\_description`class-attribute``instance-attribute`

```md-code__content
handoff_description: str | None = None

```

A description of the agent. This is used when the agent is used as a handoff, so that an
LLM knows what it does and when to invoke it.

#### handoffs`class-attribute``instance-attribute`

```md-code__content
handoffs: list[Agent[Any] | Handoff[TContext]] = field(
    default_factory=list
)

```

Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,
and the agent can choose to delegate to them if relevant. Allows for separation of concerns and
modularity.

#### model`class-attribute``instance-attribute`

```md-code__content
model: str | Model | None = None

```

The model implementation to use when invoking the LLM.

By default, if not set, the agent will use the default model configured in
`model_settings.DEFAULT_MODEL`.

#### model\_settings`class-attribute``instance-attribute`

```md-code__content
model_settings: ModelSettings = field(
    default_factory=ModelSettings
)

```

Configures model-specific tuning parameters (e.g. temperature, top\_p).

#### tools`class-attribute``instance-attribute`

```md-code__content
tools: list[Tool] = field(default_factory=list)

```

A list of tools that the agent can use.

#### input\_guardrails`class-attribute``instance-attribute`

```md-code__content
input_guardrails: list[InputGuardrail[TContext]] = field(
    default_factory=list
)

```

A list of checks that run in parallel to the agent's execution, before generating a
response. Runs only if the agent is the first agent in the chain.

#### output\_guardrails`class-attribute``instance-attribute`

```md-code__content
output_guardrails: list[OutputGuardrail[TContext]] = field(
    default_factory=list
)

```

A list of checks that run on the final output of the agent, after generating a response.
Runs only if the agent produces a final output.

#### output\_type`class-attribute``instance-attribute`

```md-code__content
output_type: type[Any] | None = None

```

The type of the output object. If not provided, the output will be `str`.

#### hooks`class-attribute``instance-attribute`

```md-code__content
hooks: AgentHooks[TContext] | None = None

```

A class that receives callbacks on various lifecycle events for this agent.

#### clone

```md-code__content
clone(**kwargs: Any) -> Agent[TContext]

```

Make a copy of the agent, with the given arguments changed. For example, you could do:

```md-code__content
new_agent = agent.clone(instructions="New instructions")

```

Source code in `src/agents/agent.py`

|     |     |
| --- | --- |
| ```<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>``` | ````md-code__content<br>def clone(self, **kwargs: Any) -> Agent[TContext]:<br>    """Make a copy of the agent, with the given arguments changed. For example, you could do:<br>    ```<br>    new_agent = agent.clone(instructions="New instructions")<br>    ```<br>    """<br>    return dataclasses.replace(self, **kwargs)<br>```` |

#### as\_tool

```md-code__content
as_tool(
    tool_name: str | None,
    tool_description: str | None,
    custom_output_extractor: Callable[\
        [RunResult], Awaitable[str]\
    ]
    | None = None,
) -> Tool

```

Transform this agent into a tool, callable by other agents.

This is different from handoffs in two ways:
1\. In handoffs, the new agent receives the conversation history. In this tool, the new agent
receives generated input.
2\. In handoffs, the new agent takes over the conversation. In this tool, the new agent is
called as a tool, and the conversation is continued by the original agent.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `tool_name` | `str | None` | The name of the tool. If not provided, the agent's name will be used. | _required_ |
| `tool_description` | `str | None` | The description of the tool, which should indicate what it does and<br>when to use it. | _required_ |
| `custom_output_extractor` | `Callable[[RunResult], Awaitable[str]] | None` | A function that extracts the output from the agent. If not<br>provided, the last message from the agent will be used. | `None` |

Source code in `src/agents/agent.py`

|     |     |
| --- | --- |
| ```<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>``` | ```md-code__content<br>def as_tool(<br>    self,<br>    tool_name: str | None,<br>    tool_description: str | None,<br>    custom_output_extractor: Callable[[RunResult], Awaitable[str]] | None = None,<br>) -> Tool:<br>    """Transform this agent into a tool, callable by other agents.<br>    This is different from handoffs in two ways:<br>    1. In handoffs, the new agent receives the conversation history. In this tool, the new agent<br>       receives generated input.<br>    2. In handoffs, the new agent takes over the conversation. In this tool, the new agent is<br>       called as a tool, and the conversation is continued by the original agent.<br>    Args:<br>        tool_name: The name of the tool. If not provided, the agent's name will be used.<br>        tool_description: The description of the tool, which should indicate what it does and<br>            when to use it.<br>        custom_output_extractor: A function that extracts the output from the agent. If not<br>            provided, the last message from the agent will be used.<br>    """<br>    @function_tool(<br>        name_override=tool_name or_transforms.transform_string_function_style(self.name),<br>        description_override=tool_description or "",<br>    )<br>    async def run_agent(context: RunContextWrapper, input: str) -> str:<br>        from .run import Runner<br>        output = await Runner.run(<br>            starting_agent=self,<br>            input=input,<br>            context=context.context,<br>        )<br>        if custom_output_extractor:<br>            return await custom_output_extractor(output)<br>        return ItemHelpers.text_message_outputs(output.new_items)<br>    return run_agent<br>``` |

#### get\_system\_prompt`async`

```md-code__content
get_system_prompt(
    run_context: RunContextWrapper[TContext],
) -> str | None

```

Get the system prompt for the agent.

Source code in `src/agents/agent.py`

|     |     |
| --- | --- |
| ```<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>``` | ```md-code__content<br>async def get_system_prompt(self, run_context: RunContextWrapper[TContext]) -> str | None:<br>    """Get the system prompt for the agent."""<br>    if isinstance(self.instructions, str):<br>        return self.instructions<br>    elif callable(self.instructions):<br>        if inspect.iscoroutinefunction(self.instructions):<br>            return await cast(Awaitable[str], self.instructions(run_context, self))<br>        else:<br>            return cast(str, self.instructions(run_context, self))<br>    elif self.instructions is not None:<br>        logger.error(f"Instructions must be a string or a function, got {self.instructions}")<br>    return None<br>``` |

## Agent Handoffs Guide

[Skip to content](https://openai.github.io/openai-agents-python/ref/handoffs/#handoffs)

# `Handoffs`

### HandoffInputFilter`module-attribute`

```md-code__content
HandoffInputFilter: TypeAlias = Callable[\
    [HandoffInputData], HandoffInputData\
]

```

A function that filters the input data passed to the next agent.

### HandoffInputData`dataclass`

Source code in `src/agents/handoffs.py`

|     |     |
| --- | --- |
| ```<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>``` | ```md-code__content<br>@dataclass(frozen=True)<br>class HandoffInputData:<br>    input_history: str | tuple[TResponseInputItem, ...]<br>    """<br>    The input history before `Runner.run()` was called.<br>    """<br>    pre_handoff_items: tuple[RunItem, ...]<br>    """<br>    The items generated before the agent turn where the handoff was invoked.<br>    """<br>    new_items: tuple[RunItem, ...]<br>    """<br>    The new items generated during the current agent turn, including the item that triggered the<br>    handoff and the tool output message representing the response from the handoff output.<br>    """<br>``` |

#### input\_history`instance-attribute`

```md-code__content
input_history: str | tuple[TResponseInputItem, ...]

```

The input history before `Runner.run()` was called.

#### pre\_handoff\_items`instance-attribute`

```md-code__content
pre_handoff_items: tuple[RunItem, ...]

```

The items generated before the agent turn where the handoff was invoked.

#### new\_items`instance-attribute`

```md-code__content
new_items: tuple[RunItem, ...]

```

The new items generated during the current agent turn, including the item that triggered the
handoff and the tool output message representing the response from the handoff output.

### Handoff`dataclass`

Bases: `Generic[TContext]`

A handoff is when an agent delegates a task to another agent.
For example, in a customer support scenario you might have a "triage agent" that determines
which agent should handle the user's request, and sub-agents that specialize in different
areas like billing, account management, etc.

Source code in `src/agents/handoffs.py`

|     |     |
| --- | --- |
| ```<br> 52<br> 53<br> 54<br> 55<br> 56<br> 57<br> 58<br> 59<br> 60<br> 61<br> 62<br> 63<br> 64<br> 65<br> 66<br> 67<br> 68<br> 69<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>``` | ```md-code__content<br>@dataclass<br>class Handoff(Generic[TContext]):<br>    """A handoff is when an agent delegates a task to another agent.<br>    For example, in a customer support scenario you might have a "triage agent" that determines<br>    which agent should handle the user's request, and sub-agents that specialize in different<br>    areas like billing, account management, etc.<br>    """<br>    tool_name: str<br>    """The name of the tool that represents the handoff."""<br>    tool_description: str<br>    """The description of the tool that represents the handoff."""<br>    input_json_schema: dict[str, Any]<br>    """The JSON schema for the handoff input. Can be empty if the handoff does not take an input.<br>    """<br>    on_invoke_handoff: Callable[[RunContextWrapper[Any], str], Awaitable[Agent[TContext]]]<br>    """The function that invokes the handoff. The parameters passed are:<br>    1. The handoff run context<br>    2. The arguments from the LLM, as a JSON string. Empty string if input_json_schema is empty.<br>    Must return an agent.<br>    """<br>    agent_name: str<br>    """The name of the agent that is being handed off to."""<br>    input_filter: HandoffInputFilter | None = None<br>    """A function that filters the inputs that are passed to the next agent. By default, the new<br>    agent sees the entire conversation history. In some cases, you may want to filter inputs e.g.<br>    to remove older inputs, or remove tools from existing inputs.<br>    The function will receive the entire conversation history so far, including the input item<br>    that triggered the handoff and a tool call output item representing the handoff tool's output.<br>    You are free to modify the input history or new items as you see fit. The next agent that<br>    runs will receive `handoff_input_data.all_items`.<br>    IMPORTANT: in streaming mode, we will not stream anything as a result of this function. The<br>    items generated before will already have been streamed.<br>    """<br>    strict_json_schema: bool = True<br>    """Whether the input JSON schema is in strict mode. We **strongly** recommend setting this to<br>    True, as it increases the likelihood of correct JSON input.<br>    """<br>    def get_transfer_message(self, agent: Agent[Any]) -> str:<br>        base = f"{{'assistant': '{agent.name}'}}"<br>        return base<br>    @classmethod<br>    def default_tool_name(cls, agent: Agent[Any]) -> str:<br>        return _transforms.transform_string_function_style(f"transfer_to_{agent.name}")<br>    @classmethod<br>    def default_tool_description(cls, agent: Agent[Any]) -> str:<br>        return (<br>            f"Handoff to the {agent.name} agent to handle the request. "<br>            f"{agent.handoff_description or ''}"<br>        )<br>``` |

#### tool\_name`instance-attribute`

```md-code__content
tool_name: str

```

The name of the tool that represents the handoff.

#### tool\_description`instance-attribute`

```md-code__content
tool_description: str

```

The description of the tool that represents the handoff.

#### input\_json\_schema`instance-attribute`

```md-code__content
input_json_schema: dict[str, Any]

```

The JSON schema for the handoff input. Can be empty if the handoff does not take an input.

#### on\_invoke\_handoff`instance-attribute`

```md-code__content
on_invoke_handoff: Callable[\
    [RunContextWrapper[Any], str],\
    Awaitable[Agent[TContext]],\
]

```

The function that invokes the handoff. The parameters passed are:
1\. The handoff run context
2\. The arguments from the LLM, as a JSON string. Empty string if input\_json\_schema is empty.

Must return an agent.

#### agent\_name`instance-attribute`

```md-code__content
agent_name: str

```

The name of the agent that is being handed off to.

#### input\_filter`class-attribute``instance-attribute`

```md-code__content
input_filter: HandoffInputFilter | None = None

```

A function that filters the inputs that are passed to the next agent. By default, the new
agent sees the entire conversation history. In some cases, you may want to filter inputs e.g.
to remove older inputs, or remove tools from existing inputs.

The function will receive the entire conversation history so far, including the input item
that triggered the handoff and a tool call output item representing the handoff tool's output.

You are free to modify the input history or new items as you see fit. The next agent that
runs will receive `handoff_input_data.all_items`.

IMPORTANT: in streaming mode, we will not stream anything as a result of this function. The
items generated before will already have been streamed.

#### strict\_json\_schema`class-attribute``instance-attribute`

```md-code__content
strict_json_schema: bool = True

```

Whether the input JSON schema is in strict mode. We **strongly** recommend setting this to
True, as it increases the likelihood of correct JSON input.

### handoff

```md-code__content
handoff(
    agent: Agent[TContext],
    *,
    tool_name_override: str | None = None,
    tool_description_override: str | None = None,
    input_filter: Callable[\
        [HandoffInputData], HandoffInputData\
    ]
    | None = None,
) -> Handoff[TContext]

```

```md-code__content
handoff(
    agent: Agent[TContext],
    *,
    on_handoff: OnHandoffWithInput[THandoffInput],
    input_type: type[THandoffInput],
    tool_description_override: str | None = None,
    tool_name_override: str | None = None,
    input_filter: Callable[\
        [HandoffInputData], HandoffInputData\
    ]
    | None = None,
) -> Handoff[TContext]

```

```md-code__content
handoff(
    agent: Agent[TContext],
    *,
    on_handoff: OnHandoffWithoutInput,
    tool_description_override: str | None = None,
    tool_name_override: str | None = None,
    input_filter: Callable[\
        [HandoffInputData], HandoffInputData\
    ]
    | None = None,
) -> Handoff[TContext]

```

```md-code__content
handoff(
    agent: Agent[TContext],
    tool_name_override: str | None = None,
    tool_description_override: str | None = None,
    on_handoff: OnHandoffWithInput[THandoffInput]
    | OnHandoffWithoutInput
    | None = None,
    input_type: type[THandoffInput] | None = None,
    input_filter: Callable[\
        [HandoffInputData], HandoffInputData\
    ]
    | None = None,
) -> Handoff[TContext]

```

Create a handoff from an agent.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `agent` | `Agent[TContext]` | The agent to handoff to, or a function that returns an agent. | _required_ |
| `tool_name_override` | `str | None` | Optional override for the name of the tool that represents the handoff. | `None` |
| `tool_description_override` | `str | None` | Optional override for the description of the tool that<br>represents the handoff. | `None` |
| `on_handoff` | `OnHandoffWithInput[THandoffInput] | OnHandoffWithoutInput | None` | A function that runs when the handoff is invoked. | `None` |
| `input_type` | `type[THandoffInput] | None` | the type of the input to the handoff. If provided, the input will be validated<br>against this type. Only relevant if you pass a function that takes an input. | `None` |
| `input_filter` | `Callable[[HandoffInputData], HandoffInputData] | None` | a function that filters the inputs that are passed to the next agent. | `None` |

Source code in `src/agents/handoffs.py`

|     |     |
| --- | --- |
| ```<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>``` | ```md-code__content<br>def handoff(<br>    agent: Agent[TContext],<br>    tool_name_override: str | None = None,<br>    tool_description_override: str | None = None,<br>    on_handoff: OnHandoffWithInput[THandoffInput] | OnHandoffWithoutInput | None = None,<br>    input_type: type[THandoffInput] | None = None,<br>    input_filter: Callable[[HandoffInputData], HandoffInputData] | None = None,<br>) -> Handoff[TContext]:<br>    """Create a handoff from an agent.<br>    Args:<br>        agent: The agent to handoff to, or a function that returns an agent.<br>        tool_name_override: Optional override for the name of the tool that represents the handoff.<br>        tool_description_override: Optional override for the description of the tool that<br>            represents the handoff.<br>        on_handoff: A function that runs when the handoff is invoked.<br>        input_type: the type of the input to the handoff. If provided, the input will be validated<br>            against this type. Only relevant if you pass a function that takes an input.<br>        input_filter: a function that filters the inputs that are passed to the next agent.<br>    """<br>    assert (on_handoff and input_type) or not (on_handoff and input_type), (<br>        "You must provide either both on_input and input_type, or neither"<br>    )<br>    type_adapter: TypeAdapter[Any] | None<br>    if input_type is not None:<br>        assert callable(on_handoff), "on_handoff must be callable"<br>        sig = inspect.signature(on_handoff)<br>        if len(sig.parameters) != 2:<br>            raise UserError("on_handoff must take two arguments: context and input")<br>        type_adapter = TypeAdapter(input_type)<br>        input_json_schema = type_adapter.json_schema()<br>    else:<br>        type_adapter = None<br>        input_json_schema = {}<br>        if on_handoff is not None:<br>            sig = inspect.signature(on_handoff)<br>            if len(sig.parameters) != 1:<br>                raise UserError("on_handoff must take one argument: context")<br>    async def_invoke_handoff(<br>        ctx: RunContextWrapper[Any], input_json: str | None = None<br>    ) -> Agent[Any]:<br>        if input_type is not None and type_adapter is not None:<br>            if input_json is None:<br>_error_tracing.attach_error_to_current_span(<br>                    SpanError(<br>                        message="Handoff function expected non-null input, but got None",<br>                        data={"details": "input_json is None"},<br>                    )<br>                )<br>                raise ModelBehaviorError("Handoff function expected non-null input, but got None")<br>            validated_input =_json.validate_json(<br>                json_str=input_json,<br>                type_adapter=type_adapter,<br>                partial=False,<br>            )<br>            input_func = cast(OnHandoffWithInput[THandoffInput], on_handoff)<br>            if inspect.iscoroutinefunction(input_func):<br>                await input_func(ctx, validated_input)<br>            else:<br>                input_func(ctx, validated_input)<br>        elif on_handoff is not None:<br>            no_input_func = cast(OnHandoffWithoutInput, on_handoff)<br>            if inspect.iscoroutinefunction(no_input_func):<br>                await no_input_func(ctx)<br>            else:<br>                no_input_func(ctx)<br>        return agent<br>    tool_name = tool_name_override or Handoff.default_tool_name(agent)<br>    tool_description = tool_description_override or Handoff.default_tool_description(agent)<br>    # Always ensure the input JSON schema is in strict mode<br>    # If there is a need, we can make this configurable in the future<br>    input_json_schema = ensure_strict_json_schema(input_json_schema)<br>    return Handoff(<br>        tool_name=tool_name,<br>        tool_description=tool_description,<br>        input_json_schema=input_json_schema,<br>        on_invoke_handoff=_invoke_handoff,<br>        input_filter=input_filter,<br>        agent_name=agent.name,<br>    )<br>``` |

## OpenAI Python Tools

[Skip to content](https://openai.github.io/openai-agents-python/ref/tool/#tools)

# `Tools`

### Tool`module-attribute`

```md-code__content
Tool = Union[\
    FunctionTool,\
    FileSearchTool,\
    WebSearchTool,\
    ComputerTool,\
]

```

A tool that can be used in an agent.

### FunctionTool`dataclass`

A tool that wraps a function. In most cases, you should use the `function_tool` helpers to
create a FunctionTool, as they let you easily wrap a Python function.

Source code in `src/agents/tool.py`

|     |     |
| --- | --- |
| ```<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>``` | ```md-code__content<br>@dataclass<br>class FunctionTool:<br>    """A tool that wraps a function. In most cases, you should use  the `function_tool` helpers to<br>    create a FunctionTool, as they let you easily wrap a Python function.<br>    """<br>    name: str<br>    """The name of the tool, as shown to the LLM. Generally the name of the function."""<br>    description: str<br>    """A description of the tool, as shown to the LLM."""<br>    params_json_schema: dict[str, Any]<br>    """The JSON schema for the tool's parameters."""<br>    on_invoke_tool: Callable[[RunContextWrapper[Any], str], Awaitable[str]]<br>    """A function that invokes the tool with the given context and parameters. The params passed<br>    are:<br>    1. The tool run context.<br>    2. The arguments from the LLM, as a JSON string.<br>    You must return a string representation of the tool output. In case of errors, you can either<br>    raise an Exception (which will cause the run to fail) or return a string error message (which<br>    will be sent back to the LLM).<br>    """<br>    strict_json_schema: bool = True<br>    """Whether the JSON schema is in strict mode. We **strongly** recommend setting this to True,<br>    as it increases the likelihood of correct JSON input."""<br>``` |

#### name`instance-attribute`

```md-code__content
name: str

```

The name of the tool, as shown to the LLM. Generally the name of the function.

#### description`instance-attribute`

```md-code__content
description: str

```

A description of the tool, as shown to the LLM.

#### params\_json\_schema`instance-attribute`

```md-code__content
params_json_schema: dict[str, Any]

```

The JSON schema for the tool's parameters.

#### on\_invoke\_tool`instance-attribute`

```md-code__content
on_invoke_tool: Callable[\
    [RunContextWrapper[Any], str], Awaitable[str]\
]

```

A function that invokes the tool with the given context and parameters. The params passed
are:
1\. The tool run context.
2\. The arguments from the LLM, as a JSON string.

You must return a string representation of the tool output. In case of errors, you can either
raise an Exception (which will cause the run to fail) or return a string error message (which
will be sent back to the LLM).

#### strict\_json\_schema`class-attribute``instance-attribute`

```md-code__content
strict_json_schema: bool = True

```

Whether the JSON schema is in strict mode. We **strongly** recommend setting this to True,
as it increases the likelihood of correct JSON input.

### FileSearchTool`dataclass`

A hosted tool that lets the LLM search through a vector store. Currently only supported with
OpenAI models, using the Responses API.

Source code in `src/agents/tool.py`

|     |     |
| --- | --- |
| ```<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>82<br>83<br>84<br>85<br>86<br>``` | ```md-code__content<br>@dataclass<br>class FileSearchTool:<br>    """A hosted tool that lets the LLM search through a vector store. Currently only supported with<br>    OpenAI models, using the Responses API.<br>    """<br>    vector_store_ids: list[str]<br>    """The IDs of the vector stores to search."""<br>    max_num_results: int | None = None<br>    """The maximum number of results to return."""<br>    include_search_results: bool = False<br>    """Whether to include the search results in the output produced by the LLM."""<br>    ranking_options: RankingOptions | None = None<br>    """Ranking options for search."""<br>    filters: Filters | None = None<br>    """A filter to apply based on file attributes."""<br>    @property<br>    def name(self):<br>        return "file_search"<br>``` |

#### vector\_store\_ids`instance-attribute`

```md-code__content
vector_store_ids: list[str]

```

The IDs of the vector stores to search.

#### max\_num\_results`class-attribute``instance-attribute`

```md-code__content
max_num_results: int | None = None

```

The maximum number of results to return.

#### include\_search\_results`class-attribute``instance-attribute`

```md-code__content
include_search_results: bool = False

```

Whether to include the search results in the output produced by the LLM.

#### ranking\_options`class-attribute``instance-attribute`

```md-code__content
ranking_options: RankingOptions | None = None

```

Ranking options for search.

#### filters`class-attribute``instance-attribute`

```md-code__content
filters: Filters | None = None

```

A filter to apply based on file attributes.

### WebSearchTool`dataclass`

A hosted tool that lets the LLM search the web. Currently only supported with OpenAI models,
using the Responses API.

Source code in `src/agents/tool.py`

|     |     |
| --- | --- |
| ```<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>``` | ```md-code__content<br>@dataclass<br>class WebSearchTool:<br>    """A hosted tool that lets the LLM search the web. Currently only supported with OpenAI models,<br>    using the Responses API.<br>    """<br>    user_location: UserLocation | None = None<br>    """Optional location for the search. Lets you customize results to be relevant to a location."""<br>    search_context_size: Literal["low", "medium", "high"] = "medium"<br>    """The amount of context to use for the search."""<br>    @property<br>    def name(self):<br>        return "web_search_preview"<br>``` |

#### user\_location`class-attribute``instance-attribute`

```md-code__content
user_location: UserLocation | None = None

```

Optional location for the search. Lets you customize results to be relevant to a location.

#### search\_context\_size`class-attribute``instance-attribute`

```md-code__content
search_context_size: Literal["low", "medium", "high"] = (
    "medium"
)

```

The amount of context to use for the search.

### ComputerTool`dataclass`

A hosted tool that lets the LLM control a computer.

Source code in `src/agents/tool.py`

|     |     |
| --- | --- |
| ```<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>``` | ```md-code__content<br>@dataclass<br>class ComputerTool:<br>    """A hosted tool that lets the LLM control a computer."""<br>    computer: Computer | AsyncComputer<br>    """The computer implementation, which describes the environment and dimensions of the computer,<br>    as well as implements the computer actions like click, screenshot, etc.<br>    """<br>    @property<br>    def name(self):<br>        return "computer_use_preview"<br>``` |

#### computer`instance-attribute`

```md-code__content
computer: Computer | AsyncComputer

```

The computer implementation, which describes the environment and dimensions of the computer,
as well as implements the computer actions like click, screenshot, etc.

### default\_tool\_error\_function

```md-code__content
default_tool_error_function(
    ctx: RunContextWrapper[Any], error: Exception
) -> str

```

The default tool error function, which just returns a generic error message.

Source code in `src/agents/tool.py`

|     |     |
| --- | --- |
| ```<br>124<br>125<br>126<br>``` | ```md-code__content<br>def default_tool_error_function(ctx: RunContextWrapper[Any], error: Exception) -> str:<br>    """The default tool error function, which just returns a generic error message."""<br>    return f"An error occurred while running the tool. Please try again. Error: {str(error)}"<br>``` |

### function\_tool

```md-code__content
function_tool(
    func: ToolFunction[...],
    *,
    name_override: str | None = None,
    description_override: str | None = None,
    docstring_style: DocstringStyle | None = None,
    use_docstring_info: bool = True,
    failure_error_function: ToolErrorFunction | None = None,
    strict_mode: bool = True,
) -> FunctionTool

```

```md-code__content
function_tool(
    *,
    name_override: str | None = None,
    description_override: str | None = None,
    docstring_style: DocstringStyle | None = None,
    use_docstring_info: bool = True,
    failure_error_function: ToolErrorFunction | None = None,
    strict_mode: bool = True,
) -> Callable[[ToolFunction[...]], FunctionTool]

```

```md-code__content
function_tool(
    func: ToolFunction[...] | None = None,
    *,
    name_override: str | None = None,
    description_override: str | None = None,
    docstring_style: DocstringStyle | None = None,
    use_docstring_info: bool = True,
    failure_error_function: ToolErrorFunction
    | None = default_tool_error_function,
    strict_mode: bool = True,
) -> (
    FunctionTool
    | Callable[[ToolFunction[...]], FunctionTool]
)

```

Decorator to create a FunctionTool from a function. By default, we will:
1\. Parse the function signature to create a JSON schema for the tool's parameters.
2\. Use the function's docstring to populate the tool's description.
3\. Use the function's docstring to populate argument descriptions.
The docstring style is detected automatically, but you can override it.

If the function takes a `RunContextWrapper` as the first argument, it _must_ match the
context type of the agent that uses the tool.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `func` | `ToolFunction[...] | None` | The function to wrap. | `None` |
| `name_override` | `str | None` | If provided, use this name for the tool instead of the function's name. | `None` |
| `description_override` | `str | None` | If provided, use this description for the tool instead of the<br>function's docstring. | `None` |
| `docstring_style` | `DocstringStyle | None` | If provided, use this style for the tool's docstring. If not provided,<br>we will attempt to auto-detect the style. | `None` |
| `use_docstring_info` | `bool` | If True, use the function's docstring to populate the tool's<br>description and argument descriptions. | `True` |
| `failure_error_function` | `ToolErrorFunction | None` | If provided, use this function to generate an error message when<br>the tool call fails. The error message is sent to the LLM. If you pass None, then no<br>error message will be sent and instead an Exception will be raised. | `default_tool_error_function` |
| `strict_mode` | `bool` | Whether to enable strict mode for the tool's JSON schema. We _strongly_<br>recommend setting this to True, as it increases the likelihood of correct JSON input.<br>If False, it allows non-strict JSON schemas. For example, if a parameter has a default<br>value, it will be optional, additional properties are allowed, etc. See here for more:<br><https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses#supported-schemas> | `True` |

Source code in `src/agents/tool.py`

|     |     |
| --- | --- |
| ```<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>``` | ```md-code__content<br>def function_tool(<br>    func: ToolFunction[...] | None = None,<br>    *,<br>    name_override: str | None = None,<br>    description_override: str | None = None,<br>    docstring_style: DocstringStyle | None = None,<br>    use_docstring_info: bool = True,<br>    failure_error_function: ToolErrorFunction | None = default_tool_error_function,<br>    strict_mode: bool = True,<br>) -> FunctionTool | Callable[[ToolFunction[...]], FunctionTool]:<br>    """<br>    Decorator to create a FunctionTool from a function. By default, we will:<br>    1. Parse the function signature to create a JSON schema for the tool's parameters.<br>    2. Use the function's docstring to populate the tool's description.<br>    3. Use the function's docstring to populate argument descriptions.<br>    The docstring style is detected automatically, but you can override it.<br>    If the function takes a `RunContextWrapper` as the first argument, it _must_ match the<br>    context type of the agent that uses the tool.<br>    Args:<br>        func: The function to wrap.<br>        name_override: If provided, use this name for the tool instead of the function's name.<br>        description_override: If provided, use this description for the tool instead of the<br>            function's docstring.<br>        docstring_style: If provided, use this style for the tool's docstring. If not provided,<br>            we will attempt to auto-detect the style.<br>        use_docstring_info: If True, use the function's docstring to populate the tool's<br>            description and argument descriptions.<br>        failure_error_function: If provided, use this function to generate an error message when<br>            the tool call fails. The error message is sent to the LLM. If you pass None, then no<br>            error message will be sent and instead an Exception will be raised.<br>        strict_mode: Whether to enable strict mode for the tool's JSON schema. We _strongly_<br>            recommend setting this to True, as it increases the likelihood of correct JSON input.<br>            If False, it allows non-strict JSON schemas. For example, if a parameter has a default<br>            value, it will be optional, additional properties are allowed, etc. See here for more:<br>            <https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses#supported-schemas><br>    """<br>    def _create_function_tool(the_func: ToolFunction[...]) -> FunctionTool:<br>        schema = function_schema(<br>            func=the_func,<br>            name_override=name_override,<br>            description_override=description_override,<br>            docstring_style=docstring_style,<br>            use_docstring_info=use_docstring_info,<br>            strict_json_schema=strict_mode,<br>        )<br>        async def_on_invoke_tool_impl(ctx: RunContextWrapper[Any], input: str) -> str:<br>            try:<br>                json_data: dict[str, Any] = json.loads(input) if input else {}<br>            except Exception as e:<br>                if _debug.DONT_LOG_TOOL_DATA:<br>                    logger.debug(f"Invalid JSON input for tool {schema.name}")<br>                else:<br>                    logger.debug(f"Invalid JSON input for tool {schema.name}: {input}")<br>                raise ModelBehaviorError(<br>                    f"Invalid JSON input for tool {schema.name}: {input}"<br>                ) from e<br>            if _debug.DONT_LOG_TOOL_DATA:<br>                logger.debug(f"Invoking tool {schema.name}")<br>            else:<br>                logger.debug(f"Invoking tool {schema.name} with input {input}")<br>            try:<br>                parsed = (<br>                    schema.params_pydantic_model(**json_data)<br>                    if json_data<br>                    else schema.params_pydantic_model()<br>                )<br>            except ValidationError as e:<br>                raise ModelBehaviorError(f"Invalid JSON input for tool {schema.name}: {e}") from e<br>            args, kwargs_dict = schema.to_call_args(parsed)<br>            if not_debug.DONT_LOG_TOOL_DATA:<br>                logger.debug(f"Tool call args: {args}, kwargs: {kwargs_dict}")<br>            if inspect.iscoroutinefunction(the_func):<br>                if schema.takes_context:<br>                    result = await the_func(ctx, *args,**kwargs_dict)<br>                else:<br>                    result = await the_func(*args, **kwargs_dict)<br>            else:<br>                if schema.takes_context:<br>                    result = the_func(ctx, *args,**kwargs_dict)<br>                else:<br>                    result = the_func(*args, **kwargs_dict)<br>            if_debug.DONT_LOG_TOOL_DATA:<br>                logger.debug(f"Tool {schema.name} completed.")<br>            else:<br>                logger.debug(f"Tool {schema.name} returned {result}")<br>            return str(result)<br>        async def_on_invoke_tool(ctx: RunContextWrapper[Any], input: str) -> str:<br>            try:<br>                return await _on_invoke_tool_impl(ctx, input)<br>            except Exception as e:<br>                if failure_error_function is None:<br>                    raise<br>                result = failure_error_function(ctx, e)<br>                if inspect.isawaitable(result):<br>                    return await result<br>                _error_tracing.attach_error_to_current_span(<br>                    SpanError(<br>                        message="Error running tool (non-fatal)",<br>                        data={<br>                            "tool_name": schema.name,<br>                            "error": str(e),<br>                        },<br>                    )<br>                )<br>                return result<br>        return FunctionTool(<br>            name=schema.name,<br>            description=schema.description or "",<br>            params_json_schema=schema.params_json_schema,<br>            on_invoke_tool=_on_invoke_tool,<br>            strict_json_schema=strict_mode,<br>        )<br>    # If func is actually a callable, we were used as @function_tool with no parentheses<br>    if callable(func):<br>        return _create_function_tool(func)<br>    # Otherwise, we were used as @function_tool(...), so return a decorator<br>    def decorator(real_func: ToolFunction[...]) -> FunctionTool:<br>        return_create_function_tool(real_func)<br>    return decorator<br>``` |

## OpenAI Agents Lifecycle

[Skip to content](https://openai.github.io/openai-agents-python/ref/lifecycle/#lifecycle)

# `Lifecycle`

### RunHooks

Bases: `Generic[TContext]`

A class that receives callbacks on various lifecycle events in an agent run. Subclass and
override the methods you need.

#### on\_agent\_start`async`

```md-code__content
on_agent_start(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
) -> None

```

Called before the agent is invoked. Called each time the current agent changes.

#### on\_agent\_end`async`

```md-code__content
on_agent_end(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    output: Any,
) -> None

```

Called when the agent produces a final output.

#### on\_handoff`async`

```md-code__content
on_handoff(
    context: RunContextWrapper[TContext],
    from_agent: Agent[TContext],
    to_agent: Agent[TContext],
) -> None

```

Called when a handoff occurs.

#### on\_tool\_start`async`

```md-code__content
on_tool_start(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    tool: Tool,
) -> None

```

Called before a tool is invoked.

#### on\_tool\_end`async`

```md-code__content
on_tool_end(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    tool: Tool,
    result: str,
) -> None

```

Called after a tool is invoked.

### AgentHooks

Bases: `Generic[TContext]`

A class that receives callbacks on various lifecycle events for a specific agent. You can
set this on `agent.hooks` to receive events for that specific agent.

Subclass and override the methods you need.

#### on\_start`async`

```md-code__content
on_start(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
) -> None

```

Called before the agent is invoked. Called each time the running agent is changed to this
agent.

#### on\_end`async`

```md-code__content
on_end(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    output: Any,
) -> None

```

Called when the agent produces a final output.

#### on\_handoff`async`

```md-code__content
on_handoff(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    source: Agent[TContext],
) -> None

```

Called when the agent is being handed off to. The `source` is the agent that is handing
off to this agent.

#### on\_tool\_start`async`

```md-code__content
on_tool_start(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    tool: Tool,
) -> None

```

Called before a tool is invoked.

#### on\_tool\_end`async`

```md-code__content
on_tool_end(
    context: RunContextWrapper[TContext],
    agent: Agent[TContext],
    tool: Tool,
    result: str,
) -> None

```

Called after a tool is invoked.

## RunResultBase Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/result/#results)

# `Results`

### RunResultBase`dataclass`

Bases: `ABC`

Source code in `src/agents/result.py`

|     |     |
| --- | --- |
| ```<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>``` | ```md-code__content<br>@dataclass<br>class RunResultBase(abc.ABC):<br>    input: str | list[TResponseInputItem]<br>    """The original input items i.e. the items before run() was called. This may be a mutated<br>    version of the input, if there are handoff input filters that mutate the input.<br>    """<br>    new_items: list[RunItem]<br>    """The new items generated during the agent run. These include things like new messages, tool<br>    calls and their outputs, etc.<br>    """<br>    raw_responses: list[ModelResponse]<br>    """The raw LLM responses generated by the model during the agent run."""<br>    final_output: Any<br>    """The output of the last agent."""<br>    input_guardrail_results: list[InputGuardrailResult]<br>    """Guardrail results for the input messages."""<br>    output_guardrail_results: list[OutputGuardrailResult]<br>    """Guardrail results for the final output of the agent."""<br>    @property<br>    @abc.abstractmethod<br>    def last_agent(self) -> Agent[Any]:<br>        """The last agent that was run."""<br>    def final_output_as(self, cls: type[T], raise_if_incorrect_type: bool = False) -> T:<br>        """A convenience method to cast the final output to a specific type. By default, the cast<br>        is only for the typechecker. If you set `raise_if_incorrect_type` to True, we'll raise a<br>        TypeError if the final output is not of the given type.<br>        Args:<br>            cls: The type to cast the final output to.<br>            raise_if_incorrect_type: If True, we'll raise a TypeError if the final output is not of<br>                the given type.<br>        Returns:<br>            The final output casted to the given type.<br>        """<br>        if raise_if_incorrect_type and not isinstance(self.final_output, cls):<br>            raise TypeError(f"Final output is not of type {cls.**name**}")<br>        return cast(T, self.final_output)<br>    def to_input_list(self) -> list[TResponseInputItem]:<br>        """Creates a new input list, merging the original input with all the new items generated."""<br>        original_items: list[TResponseInputItem] = ItemHelpers.input_to_new_input_list(self.input)<br>        new_items = [item.to_input_item() for item in self.new_items]<br>        return original_items + new_items<br>``` |

#### input`instance-attribute`

```md-code__content
input: str | list[TResponseInputItem]

```

The original input items i.e. the items before run() was called. This may be a mutated
version of the input, if there are handoff input filters that mutate the input.

#### new\_items`instance-attribute`

```md-code__content
new_items: list[RunItem]

```

The new items generated during the agent run. These include things like new messages, tool
calls and their outputs, etc.

#### raw\_responses`instance-attribute`

```md-code__content
raw_responses: list[ModelResponse]

```

The raw LLM responses generated by the model during the agent run.

#### final\_output`instance-attribute`

```md-code__content
final_output: Any

```

The output of the last agent.

#### input\_guardrail\_results`instance-attribute`

```md-code__content
input_guardrail_results: list[InputGuardrailResult]

```

Guardrail results for the input messages.

#### output\_guardrail\_results`instance-attribute`

```md-code__content
output_guardrail_results: list[OutputGuardrailResult]

```

Guardrail results for the final output of the agent.

#### last\_agent`abstractmethod``property`

```md-code__content
last_agent: Agent[Any]

```

The last agent that was run.

#### final\_output\_as

```md-code__content
final_output_as(
    cls: type[T], raise_if_incorrect_type: bool = False
) -> T

```

A convenience method to cast the final output to a specific type. By default, the cast
is only for the typechecker. If you set `raise_if_incorrect_type` to True, we'll raise a
TypeError if the final output is not of the given type.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `cls` | `type[T]` | The type to cast the final output to. | _required_ |
| `raise_if_incorrect_type` | `bool` | If True, we'll raise a TypeError if the final output is not of<br>the given type. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `T` | The final output casted to the given type. |

Source code in `src/agents/result.py`

|     |     |
| --- | --- |
| ```<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>``` | ```md-code__content<br>def final_output_as(self, cls: type[T], raise_if_incorrect_type: bool = False) -> T:<br>    """A convenience method to cast the final output to a specific type. By default, the cast<br>    is only for the typechecker. If you set `raise_if_incorrect_type` to True, we'll raise a<br>    TypeError if the final output is not of the given type.<br>    Args:<br>        cls: The type to cast the final output to.<br>        raise_if_incorrect_type: If True, we'll raise a TypeError if the final output is not of<br>            the given type.<br>    Returns:<br>        The final output casted to the given type.<br>    """<br>    if raise_if_incorrect_type and not isinstance(self.final_output, cls):<br>        raise TypeError(f"Final output is not of type {cls.__name__}")<br>    return cast(T, self.final_output)<br>``` |

#### to\_input\_list

```md-code__content
to_input_list() -> list[TResponseInputItem]

```

Creates a new input list, merging the original input with all the new items generated.

Source code in `src/agents/result.py`

|     |     |
| --- | --- |
| ```<br>76<br>77<br>78<br>79<br>80<br>81<br>``` | ```md-code__content<br>def to_input_list(self) -> list[TResponseInputItem]:<br>    """Creates a new input list, merging the original input with all the new items generated."""<br>    original_items: list[TResponseInputItem] = ItemHelpers.input_to_new_input_list(self.input)<br>    new_items = [item.to_input_item() for item in self.new_items]<br>    return original_items + new_items<br>``` |

### RunResult`dataclass`

Bases: `RunResultBase`

Source code in `src/agents/result.py`

|     |     |
| --- | --- |
| ```<br>84<br>85<br>86<br>87<br>88<br>89<br>90<br>91<br>92<br>93<br>94<br>``` | ```md-code__content<br>@dataclass<br>class RunResult(RunResultBase):<br>    _last_agent: Agent[Any]<br>    @property<br>    def last_agent(self) -> Agent[Any]:<br>        """The last agent that was run."""<br>        return self._last_agent<br>    def __str__(self) -> str:<br>        return pretty_print_result(self)<br>``` |

#### last\_agent`property`

```md-code__content
last_agent: Agent[Any]

```

The last agent that was run.

### RunResultStreaming`dataclass`

Bases: `RunResultBase`

The result of an agent run in streaming mode. You can use the `stream_events` method to
receive semantic events as they are generated.

The streaming method will raise:
\- A MaxTurnsExceeded exception if the agent exceeds the max\_turns limit.
\- A GuardrailTripwireTriggered exception if a guardrail is tripped.

Source code in `src/agents/result.py`

|     |     |
| --- | --- |
| ```<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>``` | ```md-code__content<br>@dataclass<br>class RunResultStreaming(RunResultBase):<br>    """The result of an agent run in streaming mode. You can use the `stream_events` method to<br>    receive semantic events as they are generated.<br>    The streaming method will raise:<br>    - A MaxTurnsExceeded exception if the agent exceeds the max_turns limit.<br>    - A GuardrailTripwireTriggered exception if a guardrail is tripped.<br>    """<br>    current_agent: Agent[Any]<br>    """The current agent that is running."""<br>    current_turn: int<br>    """The current turn number."""<br>    max_turns: int<br>    """The maximum number of turns the agent can run for."""<br>    final_output: Any<br>    """The final output of the agent. This is None until the agent has finished running."""<br>_current_agent_output_schema: AgentOutputSchema | None = field(repr=False)<br>    _trace: Trace | None = field(repr=False)<br>    is_complete: bool = False<br>    """Whether the agent has finished running."""<br>    # Queues that the background run_loop writes to<br>    _event_queue: asyncio.Queue[StreamEvent | QueueCompleteSentinel] = field(<br>        default_factory=asyncio.Queue, repr=False<br>    )<br>_input_guardrail_queue: asyncio.Queue[InputGuardrailResult] = field(<br>        default_factory=asyncio.Queue, repr=False<br>    )<br>    # Store the asyncio tasks that we're waiting on<br>_run_impl_task: asyncio.Task[Any] | None = field(default=None, repr=False)<br>    _input_guardrails_task: asyncio.Task[Any] | None = field(default=None, repr=False)<br>    _output_guardrails_task: asyncio.Task[Any] | None = field(default=None, repr=False)<br>    _stored_exception: Exception | None = field(default=None, repr=False)<br>    @property<br>    def last_agent(self) -> Agent[Any]:<br>        """The last agent that was run. Updates as the agent run progresses, so the true last agent<br>        is only available after the agent run is complete.<br>        """<br>        return self.current_agent<br>    async def stream_events(self) -> AsyncIterator[StreamEvent]:<br>        """Stream deltas for new items as they are generated. We're using the types from the<br>        OpenAI Responses API, so these are semantic events: each event has a `type` field that<br>        describes the type of the event, along with the data for that event.<br>        This will raise:<br>        - A MaxTurnsExceeded exception if the agent exceeds the max_turns limit.<br>        - A GuardrailTripwireTriggered exception if a guardrail is tripped.<br>        """<br>        while True:<br>            self._check_errors()<br>            if self._stored_exception:<br>                logger.debug("Breaking due to stored exception")<br>                self.is_complete = True<br>                break<br>            if self.is_complete and self._event_queue.empty():<br>                break<br>            try:<br>                item = await self._event_queue.get()<br>            except asyncio.CancelledError:<br>                break<br>            if isinstance(item, QueueCompleteSentinel):<br>                self._event_queue.task_done()<br>                # Check for errors, in case the queue was completed due to an exception<br>                self._check_errors()<br>                break<br>            yield item<br>            self._event_queue.task_done()<br>        if self._trace:<br>            self._trace.finish(reset_current=True)<br>        self._cleanup_tasks()<br>        if self._stored_exception:<br>            raise self._stored_exception<br>    def_check_errors(self):<br>        if self.current_turn > self.max_turns:<br>            self._stored_exception = MaxTurnsExceeded(f"Max turns ({self.max_turns}) exceeded")<br>        # Fetch all the completed guardrail results from the queue and raise if needed<br>        while not self._input_guardrail_queue.empty():<br>            guardrail_result = self._input_guardrail_queue.get_nowait()<br>            if guardrail_result.output.tripwire_triggered:<br>                self._stored_exception = InputGuardrailTripwireTriggered(guardrail_result)<br>        # Check the tasks for any exceptions<br>        if self._run_impl_task and self._run_impl_task.done():<br>            exc = self._run_impl_task.exception()<br>            if exc and isinstance(exc, Exception):<br>                self._stored_exception = exc<br>        if self._input_guardrails_task and self._input_guardrails_task.done():<br>            exc = self._input_guardrails_task.exception()<br>            if exc and isinstance(exc, Exception):<br>                self._stored_exception = exc<br>        if self._output_guardrails_task and self._output_guardrails_task.done():<br>            exc = self._output_guardrails_task.exception()<br>            if exc and isinstance(exc, Exception):<br>                self._stored_exception = exc<br>    def _cleanup_tasks(self):<br>        if self._run_impl_task and not self._run_impl_task.done():<br>            self._run_impl_task.cancel()<br>        if self._input_guardrails_task and not self._input_guardrails_task.done():<br>            self._input_guardrails_task.cancel()<br>        if self._output_guardrails_task and not self._output_guardrails_task.done():<br>            self._output_guardrails_task.cancel()<br>    def **str**(self) -> str:<br>        return pretty_print_run_result_streaming(self)<br>``` |

#### current\_agent`instance-attribute`

```md-code__content
current_agent: Agent[Any]

```

The current agent that is running.

#### current\_turn`instance-attribute`

```md-code__content
current_turn: int

```

The current turn number.

#### max\_turns`instance-attribute`

```md-code__content
max_turns: int

```

The maximum number of turns the agent can run for.

#### final\_output`instance-attribute`

```md-code__content
final_output: Any

```

The final output of the agent. This is None until the agent has finished running.

#### is\_complete`class-attribute``instance-attribute`

```md-code__content
is_complete: bool = False

```

Whether the agent has finished running.

#### last\_agent`property`

```md-code__content
last_agent: Agent[Any]

```

The last agent that was run. Updates as the agent run progresses, so the true last agent
is only available after the agent run is complete.

#### stream\_events`async`

```md-code__content
stream_events() -> AsyncIterator[StreamEvent]

```

Stream deltas for new items as they are generated. We're using the types from the
OpenAI Responses API, so these are semantic events: each event has a `type` field that
describes the type of the event, along with the data for that event.

This will raise:
\- A MaxTurnsExceeded exception if the agent exceeds the max\_turns limit.
\- A GuardrailTripwireTriggered exception if a guardrail is tripped.

Source code in `src/agents/result.py`

|     |     |
| --- | --- |
| ```<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>``` | ```md-code__content<br>async def stream_events(self) -> AsyncIterator[StreamEvent]:<br>    """Stream deltas for new items as they are generated. We're using the types from the<br>    OpenAI Responses API, so these are semantic events: each event has a `type` field that<br>    describes the type of the event, along with the data for that event.<br>    This will raise:<br>    - A MaxTurnsExceeded exception if the agent exceeds the max_turns limit.<br>    - A GuardrailTripwireTriggered exception if a guardrail is tripped.<br>    """<br>    while True:<br>        self._check_errors()<br>        if self._stored_exception:<br>            logger.debug("Breaking due to stored exception")<br>            self.is_complete = True<br>            break<br>        if self.is_complete and self._event_queue.empty():<br>            break<br>        try:<br>            item = await self._event_queue.get()<br>        except asyncio.CancelledError:<br>            break<br>        if isinstance(item, QueueCompleteSentinel):<br>            self._event_queue.task_done()<br>            # Check for errors, in case the queue was completed due to an exception<br>            self._check_errors()<br>            break<br>        yield item<br>        self._event_queue.task_done()<br>    if self._trace:<br>        self._trace.finish(reset_current=True)<br>    self._cleanup_tasks()<br>    if self._stored_exception:<br>        raise self._stored_exception<br>``` |

## Python Function Schema

[Skip to content](https://openai.github.io/openai-agents-python/ref/function_schema/#function-schema)

# `Function schema`

### FuncSchema`dataclass`

Captures the schema for a python function, in preparation for sending it to an LLM as a tool.

Source code in `src/agents/function_schema.py`

|     |     |
| --- | --- |
| ```<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>``` | ```md-code__content<br>@dataclass<br>class FuncSchema:<br>    """<br>    Captures the schema for a python function, in preparation for sending it to an LLM as a tool.<br>    """<br>    name: str<br>    """The name of the function."""<br>    description: str | None<br>    """The description of the function."""<br>    params_pydantic_model: type[BaseModel]<br>    """A Pydantic model that represents the function's parameters."""<br>    params_json_schema: dict[str, Any]<br>    """The JSON schema for the function's parameters, derived from the Pydantic model."""<br>    signature: inspect.Signature<br>    """The signature of the function."""<br>    takes_context: bool = False<br>    """Whether the function takes a RunContextWrapper argument (must be the first argument)."""<br>    strict_json_schema: bool = True<br>    """Whether the JSON schema is in strict mode. We **strongly** recommend setting this to True,<br>    as it increases the likelihood of correct JSON input."""<br>    def to_call_args(self, data: BaseModel) -> tuple[list[Any], dict[str, Any]]:<br>        """<br>        Converts validated data from the Pydantic model into (args, kwargs), suitable for calling<br>        the original function.<br>        """<br>        positional_args: list[Any] = []<br>        keyword_args: dict[str, Any] = {}<br>        seen_var_positional = False<br>        # Use enumerate() so we can skip the first parameter if it's context.<br>        for idx, (name, param) in enumerate(self.signature.parameters.items()):<br>            # If the function takes a RunContextWrapper and this is the first parameter, skip it.<br>            if self.takes_context and idx == 0:<br>                continue<br>            value = getattr(data, name, None)<br>            if param.kind == param.VAR_POSITIONAL:<br>                # e.g. *args: extend positional args and mark that*args is now seen<br>                positional_args.extend(value or [])<br>                seen_var_positional = True<br>            elif param.kind == param.VAR_KEYWORD:<br>                # e.g. **kwargs handling<br>                keyword_args.update(value or {})<br>            elif param.kind in (param.POSITIONAL_ONLY, param.POSITIONAL_OR_KEYWORD):<br>                # Before *args, add to positional args. After*args, add to keyword args.<br>                if not seen_var_positional:<br>                    positional_args.append(value)<br>                else:<br>                    keyword_args[name] = value<br>            else:<br>                # For KEYWORD_ONLY parameters, always use keyword args.<br>                keyword_args[name] = value<br>        return positional_args, keyword_args<br>``` |

#### name`instance-attribute`

```md-code__content
name: str

```

The name of the function.

#### description`instance-attribute`

```md-code__content
description: str | None

```

The description of the function.

#### params\_pydantic\_model`instance-attribute`

```md-code__content
params_pydantic_model: type[BaseModel]

```

A Pydantic model that represents the function's parameters.

#### params\_json\_schema`instance-attribute`

```md-code__content
params_json_schema: dict[str, Any]

```

The JSON schema for the function's parameters, derived from the Pydantic model.

#### signature`instance-attribute`

```md-code__content
signature: Signature

```

The signature of the function.

#### takes\_context`class-attribute``instance-attribute`

```md-code__content
takes_context: bool = False

```

Whether the function takes a RunContextWrapper argument (must be the first argument).

#### strict\_json\_schema`class-attribute``instance-attribute`

```md-code__content
strict_json_schema: bool = True

```

Whether the JSON schema is in strict mode. We **strongly** recommend setting this to True,
as it increases the likelihood of correct JSON input.

#### to\_call\_args

```md-code__content
to_call_args(
    data: BaseModel,
) -> tuple[list[Any], dict[str, Any]]

```

Converts validated data from the Pydantic model into (args, kwargs), suitable for calling
the original function.

Source code in `src/agents/function_schema.py`

|     |     |
| --- | --- |
| ```<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>``` | ```md-code__content<br>def to_call_args(self, data: BaseModel) -> tuple[list[Any], dict[str, Any]]:<br>    """<br>    Converts validated data from the Pydantic model into (args, kwargs), suitable for calling<br>    the original function.<br>    """<br>    positional_args: list[Any] = []<br>    keyword_args: dict[str, Any] = {}<br>    seen_var_positional = False<br>    # Use enumerate() so we can skip the first parameter if it's context.<br>    for idx, (name, param) in enumerate(self.signature.parameters.items()):<br>        # If the function takes a RunContextWrapper and this is the first parameter, skip it.<br>        if self.takes_context and idx == 0:<br>            continue<br>        value = getattr(data, name, None)<br>        if param.kind == param.VAR_POSITIONAL:<br>            # e.g. *args: extend positional args and mark that *args is now seen<br>            positional_args.extend(value or [])<br>            seen_var_positional = True<br>        elif param.kind == param.VAR_KEYWORD:<br>            # e.g. **kwargs handling<br>            keyword_args.update(value or {})<br>        elif param.kind in (param.POSITIONAL_ONLY, param.POSITIONAL_OR_KEYWORD):<br>            # Before *args, add to positional args. After *args, add to keyword args.<br>            if not seen_var_positional:<br>                positional_args.append(value)<br>            else:<br>                keyword_args[name] = value<br>        else:<br>            # For KEYWORD_ONLY parameters, always use keyword args.<br>            keyword_args[name] = value<br>    return positional_args, keyword_args<br>``` |

### FuncDocumentation`dataclass`

Contains metadata about a python function, extracted from its docstring.

Source code in `src/agents/function_schema.py`

|     |     |
| --- | --- |
| ```<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>82<br>83<br>84<br>``` | ```md-code__content<br>@dataclass<br>class FuncDocumentation:<br>    """Contains metadata about a python function, extracted from its docstring."""<br>    name: str<br>    """The name of the function, via `__name__`."""<br>    description: str | None<br>    """The description of the function, derived from the docstring."""<br>    param_descriptions: dict[str, str] | None<br>    """The parameter descriptions of the function, derived from the docstring."""<br>``` |

#### name`instance-attribute`

```md-code__content
name: str

```

The name of the function, via `__name__`.

#### description`instance-attribute`

```md-code__content
description: str | None

```

The description of the function, derived from the docstring.

#### param\_descriptions`instance-attribute`

```md-code__content
param_descriptions: dict[str, str] | None

```

The parameter descriptions of the function, derived from the docstring.

### generate\_func\_documentation

```md-code__content
generate_func_documentation(
    func: Callable[..., Any],
    style: DocstringStyle | None = None,
) -> FuncDocumentation

```

Extracts metadata from a function docstring, in preparation for sending it to an LLM as a tool.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `func` | `Callable[..., Any]` | The function to extract documentation from. | _required_ |
| `style` | `DocstringStyle | None` | The style of the docstring to use for parsing. If not provided, we will attempt to<br>auto-detect the style. | `None` |

Returns:

| Type | Description |
| --- | --- |
| `FuncDocumentation` | A FuncDocumentation object containing the function's name, description, and parameter |
| `FuncDocumentation` | descriptions. |

Source code in `src/agents/function_schema.py`

|     |     |
| --- | --- |
| ```<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>``` | ```md-code__content<br>def generate_func_documentation(<br>    func: Callable[..., Any], style: DocstringStyle | None = None<br>) -> FuncDocumentation:<br>    """<br>    Extracts metadata from a function docstring, in preparation for sending it to an LLM as a tool.<br>    Args:<br>        func: The function to extract documentation from.<br>        style: The style of the docstring to use for parsing. If not provided, we will attempt to<br>            auto-detect the style.<br>    Returns:<br>        A FuncDocumentation object containing the function's name, description, and parameter<br>        descriptions.<br>    """<br>    name = func.**name**<br>    doc = inspect.getdoc(func)<br>    if not doc:<br>        return FuncDocumentation(name=name, description=None, param_descriptions=None)<br>    with_suppress_griffe_logging():<br>        docstring = Docstring(doc, lineno=1, parser=style or _detect_docstring_style(doc))<br>        parsed = docstring.parse()<br>    description: str | None = next(<br>        (section.value for section in parsed if section.kind == DocstringSectionKind.text), None<br>    )<br>    param_descriptions: dict[str, str] = {<br>        param.name: param.description<br>        for section in parsed<br>        if section.kind == DocstringSectionKind.parameters<br>        for param in section.value<br>    }<br>    return FuncDocumentation(<br>        name=func.**name**,<br>        description=description,<br>        param_descriptions=param_descriptions or None,<br>    )<br>``` |

### function\_schema

```md-code__content
function_schema(
    func: Callable[..., Any],
    docstring_style: DocstringStyle | None = None,
    name_override: str | None = None,
    description_override: str | None = None,
    use_docstring_info: bool = True,
    strict_json_schema: bool = True,
) -> FuncSchema

```

Given a python function, extracts a `FuncSchema` from it, capturing the name, description,
parameter descriptions, and other metadata.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `func` | `Callable[..., Any]` | The function to extract the schema from. | _required_ |
| `docstring_style` | `DocstringStyle | None` | The style of the docstring to use for parsing. If not provided, we will<br>attempt to auto-detect the style. | `None` |
| `name_override` | `str | None` | If provided, use this name instead of the function's `__name__`. | `None` |
| `description_override` | `str | None` | If provided, use this description instead of the one derived from the<br>docstring. | `None` |
| `use_docstring_info` | `bool` | If True, uses the docstring to generate the description and parameter<br>descriptions. | `True` |
| `strict_json_schema` | `bool` | Whether the JSON schema is in strict mode. If True, we'll ensure that<br>the schema adheres to the "strict" standard the OpenAI API expects. We **strongly**<br>recommend setting this to True, as it increases the likelihood of the LLM providing<br>correct JSON input. | `True` |

Returns:

| Type | Description |
| --- | --- |
| `FuncSchema` | A `FuncSchema` object containing the function's name, description, parameter descriptions, |
| `FuncSchema` | and other metadata. |

Source code in `src/agents/function_schema.py`

|     |     |
| --- | --- |
| ```<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>321<br>322<br>323<br>324<br>325<br>326<br>327<br>328<br>329<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>``` | ```md-code__content<br>def function_schema(<br>    func: Callable[..., Any],<br>    docstring_style: DocstringStyle | None = None,<br>    name_override: str | None = None,<br>    description_override: str | None = None,<br>    use_docstring_info: bool = True,<br>    strict_json_schema: bool = True,<br>) -> FuncSchema:<br>    """<br>    Given a python function, extracts a `FuncSchema` from it, capturing the name, description,<br>    parameter descriptions, and other metadata.<br>    Args:<br>        func: The function to extract the schema from.<br>        docstring_style: The style of the docstring to use for parsing. If not provided, we will<br>            attempt to auto-detect the style.<br>        name_override: If provided, use this name instead of the function's `__name__`.<br>        description_override: If provided, use this description instead of the one derived from the<br>            docstring.<br>        use_docstring_info: If True, uses the docstring to generate the description and parameter<br>            descriptions.<br>        strict_json_schema: Whether the JSON schema is in strict mode. If True, we'll ensure that<br>            the schema adheres to the "strict" standard the OpenAI API expects. We **strongly**<br>            recommend setting this to True, as it increases the likelihood of the LLM providing<br>            correct JSON input.<br>    Returns:<br>        A `FuncSchema` object containing the function's name, description, parameter descriptions,<br>        and other metadata.<br>    """<br>    # 1. Grab docstring info<br>    if use_docstring_info:<br>        doc_info = generate_func_documentation(func, docstring_style)<br>        param_descs = doc_info.param_descriptions or {}<br>    else:<br>        doc_info = None<br>        param_descs = {}<br>    func_name = name_override or doc_info.name if doc_info else func.**name**<br>    # 2. Inspect function signature and get type hints<br>    sig = inspect.signature(func)<br>    type_hints = get_type_hints(func)<br>    params = list(sig.parameters.items())<br>    takes_context = False<br>    filtered_params = []<br>    if params:<br>        first_name, first_param = params[0]<br>        # Prefer the evaluated type hint if available<br>        ann = type_hints.get(first_name, first_param.annotation)<br>        if ann != inspect._empty:<br>            origin = get_origin(ann) or ann<br>            if origin is RunContextWrapper:<br>                takes_context = True  # Mark that the function takes context<br>            else:<br>                filtered_params.append((first_name, first_param))<br>        else:<br>            filtered_params.append((first_name, first_param))<br>    # For parameters other than the first, raise error if any use RunContextWrapper.<br>    for name, param in params[1:]:<br>        ann = type_hints.get(name, param.annotation)<br>        if ann != inspect._empty:<br>            origin = get_origin(ann) or ann<br>            if origin is RunContextWrapper:<br>                raise UserError(<br>                    f"RunContextWrapper param found at non-first position in function"<br>                    f" {func.**name**}"<br>                )<br>        filtered_params.append((name, param))<br>    # We will collect field definitions for create_model as a dict:<br>    #   field_name -> (type_annotation, default_value_or_Field(...))<br>    fields: dict[str, Any] = {}<br>    for name, param in filtered_params:<br>        ann = type_hints.get(name, param.annotation)<br>        default = param.default<br>        # If there's no type hint, assume `Any`<br>        if ann == inspect._empty:<br>            ann = Any<br>        # If a docstring param description exists, use it<br>        field_description = param_descs.get(name, None)<br>        # Handle different parameter kinds<br>        if param.kind == param.VAR_POSITIONAL:<br>            # e.g. *args: extend positional args<br>            if get_origin(ann) is tuple:<br>                # e.g. def foo(*args: tuple[int, ...]) -> treat as List[int]<br>                args_of_tuple = get_args(ann)<br>                if len(args_of_tuple) == 2 and args_of_tuple[1] is Ellipsis:<br>                    ann = list[args_of_tuple[0]]  # type: ignore<br>                else:<br>                    ann = list[Any]<br>            else:<br>                # If user wrote *args: int, treat as List[int]<br>                ann = list[ann]  # type: ignore<br>            # Default factory to empty list<br>            fields[name] = (<br>                ann,<br>                Field(default_factory=list, description=field_description),  # type: ignore<br>            )<br>        elif param.kind == param.VAR_KEYWORD:<br>            # **kwargs handling<br>            if get_origin(ann) is dict:<br>                # e.g. def foo(**kwargs: dict[str, int])<br>                dict_args = get_args(ann)<br>                if len(dict_args) == 2:<br>                    ann = dict[dict_args[0], dict_args[1]]  # type: ignore<br>                else:<br>                    ann = dict[str, Any]<br>            else:<br>                # e.g. def foo(**kwargs: int) -> Dict[str, int]<br>                ann = dict[str, ann]  # type: ignore<br>            fields[name] = (<br>                ann,<br>                Field(default_factory=dict, description=field_description),  # type: ignore<br>            )<br>        else:<br>            # Normal parameter<br>            if default == inspect._empty:<br>                # Required field<br>                fields[name] = (<br>                    ann,<br>                    Field(..., description=field_description),<br>                )<br>            else:<br>                # Parameter with a default value<br>                fields[name] = (<br>                    ann,<br>                    Field(default=default, description=field_description),<br>                )<br>    # 3. Dynamically build a Pydantic model<br>    dynamic_model = create_model(f"{func_name}_args", **base**=BaseModel,**fields)<br>    # 4. Build JSON schema from that model<br>    json_schema = dynamic_model.model_json_schema()<br>    if strict_json_schema:<br>        json_schema = ensure_strict_json_schema(json_schema)<br>    # 5. Return as a FuncSchema dataclass<br>    return FuncSchema(<br>        name=func_name,<br>        description=description_override or doc_info.description if doc_info else None,<br>        params_pydantic_model=dynamic_model,<br>        params_json_schema=json_schema,<br>        signature=sig,<br>        takes_context=takes_context,<br>        strict_json_schema=strict_json_schema,<br>    )<br>``` |

## Tracing Module Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/#tracing-module)

# Tracing module

### TracingProcessor

Bases: `ABC`

Interface for processing spans.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br> 9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>``` | ```md-code__content<br>class TracingProcessor(abc.ABC):<br>    """Interface for processing spans."""<br>    @abc.abstractmethod<br>    def on_trace_start(self, trace: "Trace") -> None:<br>        """Called when a trace is started.<br>        Args:<br>            trace: The trace that started.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def on_trace_end(self, trace: "Trace") -> None:<br>        """Called when a trace is finished.<br>        Args:<br>            trace: The trace that started.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def on_span_start(self, span: "Span[Any]") -> None:<br>        """Called when a span is started.<br>        Args:<br>            span: The span that started.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def on_span_end(self, span: "Span[Any]") -> None:<br>        """Called when a span is finished. Should not block or raise exceptions.<br>        Args:<br>            span: The span that finished.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def shutdown(self) -> None:<br>        """Called when the application stops."""<br>        pass<br>    @abc.abstractmethod<br>    def force_flush(self) -> None:<br>        """Forces an immediate flush of all queued spans/traces."""<br>        pass<br>``` |

#### on\_trace\_start`abstractmethod`

```md-code__content
on_trace_start(trace: Trace) -> None

```

Called when a trace is started.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `trace` | `Trace` | The trace that started. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_trace_start(self, trace: "Trace") -> None:<br>    """Called when a trace is started.<br>    Args:<br>        trace: The trace that started.<br>    """<br>    pass<br>``` |

#### on\_trace\_end`abstractmethod`

```md-code__content
on_trace_end(trace: Trace) -> None

```

Called when a trace is finished.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `trace` | `Trace` | The trace that started. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_trace_end(self, trace: "Trace") -> None:<br>    """Called when a trace is finished.<br>    Args:<br>        trace: The trace that started.<br>    """<br>    pass<br>``` |

#### on\_span\_start`abstractmethod`

```md-code__content
on_span_start(span: Span[Any]) -> None

```

Called when a span is started.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `span` | `Span[Any]` | The span that started. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_span_start(self, span: "Span[Any]") -> None:<br>    """Called when a span is started.<br>    Args:<br>        span: The span that started.<br>    """<br>    pass<br>``` |

#### on\_span\_end`abstractmethod`

```md-code__content
on_span_end(span: Span[Any]) -> None

```

Called when a span is finished. Should not block or raise exceptions.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `span` | `Span[Any]` | The span that finished. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_span_end(self, span: "Span[Any]") -> None:<br>    """Called when a span is finished. Should not block or raise exceptions.<br>    Args:<br>        span: The span that finished.<br>    """<br>    pass<br>``` |

#### shutdown`abstractmethod`

```md-code__content
shutdown() -> None

```

Called when the application stops.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>48<br>49<br>50<br>51<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def shutdown(self) -> None:<br>    """Called when the application stops."""<br>    pass<br>``` |

#### force\_flush`abstractmethod`

```md-code__content
force_flush() -> None

```

Forces an immediate flush of all queued spans/traces.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>53<br>54<br>55<br>56<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def force_flush(self) -> None:<br>    """Forces an immediate flush of all queued spans/traces."""<br>    pass<br>``` |

### Span

Bases: `ABC`, `Generic[TSpanData]`

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>82<br>83<br>84<br>85<br>86<br>87<br>88<br>89<br>90<br>91<br>92<br>93<br>``` | ```md-code__content<br>class Span(abc.ABC, Generic[TSpanData]):<br>    @property<br>    @abc.abstractmethod<br>    def trace_id(self) -> str:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def span_id(self) -> str:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def span_data(self) -> TSpanData:<br>        pass<br>    @abc.abstractmethod<br>    def start(self, mark_as_current: bool = False):<br>        """<br>        Start the span.<br>        Args:<br>            mark_as_current: If true, the span will be marked as the current span.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def finish(self, reset_current: bool = False) -> None:<br>        """<br>        Finish the span.<br>        Args:<br>            reset_current: If true, the span will be reset as the current span.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def **enter**(self) -> Span[TSpanData]:<br>        pass<br>    @abc.abstractmethod<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def parent_id(self) -> str | None:<br>        pass<br>    @abc.abstractmethod<br>    def set_error(self, error: SpanError) -> None:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def error(self) -> SpanError | None:<br>        pass<br>    @abc.abstractmethod<br>    def export(self) -> dict[str, Any] | None:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def started_at(self) -> str | None:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def ended_at(self) -> str | None:<br>        pass<br>``` |

#### start`abstractmethod`

```md-code__content
start(mark_as_current: bool = False)

```

Start the span.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `mark_as_current` | `bool` | If true, the span will be marked as the current span. | `False` |

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def start(self, mark_as_current: bool = False):<br>    """<br>    Start the span.<br>    Args:<br>        mark_as_current: If true, the span will be marked as the current span.<br>    """<br>    pass<br>``` |

#### finish`abstractmethod`

```md-code__content
finish(reset_current: bool = False) -> None

```

Finish the span.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `reset_current` | `bool` | If true, the span will be reset as the current span. | `False` |

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def finish(self, reset_current: bool = False) -> None:<br>    """<br>    Finish the span.<br>    Args:<br>        reset_current: If true, the span will be reset as the current span.<br>    """<br>    pass<br>``` |

### Trace

A trace is the root level object that tracing creates. It represents a logical "workflow".

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>class Trace:<br>    """<br>    A trace is the root level object that tracing creates. It represents a logical "workflow".<br>    """<br>    @abc.abstractmethod<br>    def **enter**(self) -> Trace:<br>        pass<br>    @abc.abstractmethod<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        pass<br>    @abc.abstractmethod<br>    def start(self, mark_as_current: bool = False):<br>        """<br>        Start the trace.<br>        Args:<br>            mark_as_current: If true, the trace will be marked as the current trace.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def finish(self, reset_current: bool = False):<br>        """<br>        Finish the trace.<br>        Args:<br>            reset_current: If true, the trace will be reset as the current trace.<br>        """<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def trace_id(self) -> str:<br>        """<br>        The trace ID.<br>        """<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def name(self) -> str:<br>        """<br>        The name of the workflow being traced.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def export(self) -> dict[str, Any] | None:<br>        """<br>        Export the trace as a dictionary.<br>        """<br>        pass<br>``` |

#### trace\_id`abstractmethod``property`

```md-code__content
trace_id: str

```

The trace ID.

#### name`abstractmethod``property`

```md-code__content
name: str

```

The name of the workflow being traced.

#### start`abstractmethod`

```md-code__content
start(mark_as_current: bool = False)

```

Start the trace.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `mark_as_current` | `bool` | If true, the trace will be marked as the current trace. | `False` |

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def start(self, mark_as_current: bool = False):<br>    """<br>    Start the trace.<br>    Args:<br>        mark_as_current: If true, the trace will be marked as the current trace.<br>    """<br>    pass<br>``` |

#### finish`abstractmethod`

```md-code__content
finish(reset_current: bool = False)

```

Finish the trace.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `reset_current` | `bool` | If true, the trace will be reset as the current trace. | `False` |

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def finish(self, reset_current: bool = False):<br>    """<br>    Finish the trace.<br>    Args:<br>        reset_current: If true, the trace will be reset as the current trace.<br>    """<br>    pass<br>``` |

#### export`abstractmethod`

```md-code__content
export() -> dict[str, Any] | None

```

Export the trace as a dictionary.

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def export(self) -> dict[str, Any] | None:<br>    """<br>    Export the trace as a dictionary.<br>    """<br>    pass<br>``` |

### agent\_span

```md-code__content
agent_span(
    name: str,
    handoffs: list[str] | None = None,
    tools: list[str] | None = None,
    output_type: str | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[AgentSpanData]

```

Create a new agent span. The span will not be started automatically, you should either do
`with agent_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the agent. | _required_ |
| `handoffs` | `list[str] | None` | Optional list of agent names to which this agent could hand off control. | `None` |
| `tools` | `list[str] | None` | Optional list of tool names available to this agent. | `None` |
| `output_type` | `str | None` | Optional name of the output type produced by the agent. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[AgentSpanData]` | The newly created agent span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>``` | ```md-code__content<br>def agent_span(<br>    name: str,<br>    handoffs: list[str] | None = None,<br>    tools: list[str] | None = None,<br>    output_type: str | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[AgentSpanData]:<br>    """Create a new agent span. The span will not be started automatically, you should either do<br>    `with agent_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the agent.<br>        handoffs: Optional list of agent names to which this agent could hand off control.<br>        tools: Optional list of tool names available to this agent.<br>        output_type: Optional name of the output type produced by the agent.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created agent span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=AgentSpanData(name=name, handoffs=handoffs, tools=tools, output_type=output_type),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### custom\_span

```md-code__content
custom_span(
    name: str,
    data: dict[str, Any] | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[CustomSpanData]

```

Create a new custom span, to which you can add your own metadata. The span will not be
started automatically, you should either do `with custom_span() ...` or call
`span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the custom span. | _required_ |
| `data` | `dict[str, Any] | None` | Arbitrary structured data to associate with the span. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[CustomSpanData]` | The newly created custom span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>``` | ```md-code__content<br>def custom_span(<br>    name: str,<br>    data: dict[str, Any] | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[CustomSpanData]:<br>    """Create a new custom span, to which you can add your own metadata. The span will not be<br>    started automatically, you should either do `with custom_span() ...` or call<br>    `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the custom span.<br>        data: Arbitrary structured data to associate with the span.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created custom span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=CustomSpanData(name=name, data=data or {}),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### function\_span

```md-code__content
function_span(
    name: str,
    input: str | None = None,
    output: str | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[FunctionSpanData]

```

Create a new function span. The span will not be started automatically, you should either do
`with function_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the function. | _required_ |
| `input` | `str | None` | The input to the function. | `None` |
| `output` | `str | None` | The output of the function. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[FunctionSpanData]` | The newly created function span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>``` | ```md-code__content<br>def function_span(<br>    name: str,<br>    input: str | None = None,<br>    output: str | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[FunctionSpanData]:<br>    """Create a new function span. The span will not be started automatically, you should either do<br>    `with function_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the function.<br>        input: The input to the function.<br>        output: The output of the function.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created function span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=FunctionSpanData(name=name, input=input, output=output),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### generation\_span

```md-code__content
generation_span(
    input: Sequence[Mapping[str, Any]] | None = None,
    output: Sequence[Mapping[str, Any]] | None = None,
    model: str | None = None,
    model_config: Mapping[str, Any] | None = None,
    usage: dict[str, Any] | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[GenerationSpanData]

```

Create a new generation span. The span will not be started automatically, you should either
do `with generation_span() ...` or call `span.start()` \+ `span.finish()` manually.

This span captures the details of a model generation, including the
input message sequence, any generated outputs, the model name and
configuration, and usage data. If you only need to capture a model
response identifier, use `response_span()` instead.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `input` | `Sequence[Mapping[str, Any]] | None` | The sequence of input messages sent to the model. | `None` |
| `output` | `Sequence[Mapping[str, Any]] | None` | The sequence of output messages received from the model. | `None` |
| `model` | `str | None` | The model identifier used for the generation. | `None` |
| `model_config` | `Mapping[str, Any] | None` | The model configuration (hyperparameters) used. | `None` |
| `usage` | `dict[str, Any] | None` | A dictionary of usage information (input tokens, output tokens, etc.). | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[GenerationSpanData]` | The newly created generation span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>``` | ```md-code__content<br>def generation_span(<br>    input: Sequence[Mapping[str, Any]] | None = None,<br>    output: Sequence[Mapping[str, Any]] | None = None,<br>    model: str | None = None,<br>    model_config: Mapping[str, Any] | None = None,<br>    usage: dict[str, Any] | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[GenerationSpanData]:<br>    """Create a new generation span. The span will not be started automatically, you should either<br>    do `with generation_span() ...` or call `span.start()` + `span.finish()` manually.<br>    This span captures the details of a model generation, including the<br>    input message sequence, any generated outputs, the model name and<br>    configuration, and usage data. If you only need to capture a model<br>    response identifier, use `response_span()` instead.<br>    Args:<br>        input: The sequence of input messages sent to the model.<br>        output: The sequence of output messages received from the model.<br>        model: The model identifier used for the generation.<br>        model_config: The model configuration (hyperparameters) used.<br>        usage: A dictionary of usage information (input tokens, output tokens, etc.).<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created generation span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=GenerationSpanData(<br>            input=input, output=output, model=model, model_config=model_config, usage=usage<br>        ),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### get\_current\_span

```md-code__content
get_current_span() -> Span[Any] | None

```

Returns the currently active span, if present.

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>75<br>76<br>77<br>``` | ```md-code__content<br>def get_current_span() -> Span[Any] | None:<br>    """Returns the currently active span, if present."""<br>    return GLOBAL_TRACE_PROVIDER.get_current_span()<br>``` |

### get\_current\_trace

```md-code__content
get_current_trace() -> Trace | None

```

Returns the currently active trace, if present.

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>70<br>71<br>72<br>``` | ```md-code__content<br>def get_current_trace() -> Trace | None:<br>    """Returns the currently active trace, if present."""<br>    return GLOBAL_TRACE_PROVIDER.get_current_trace()<br>``` |

### guardrail\_span

```md-code__content
guardrail_span(
    name: str,
    triggered: bool = False,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[GuardrailSpanData]

```

Create a new guardrail span. The span will not be started automatically, you should either
do `with guardrail_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the guardrail. | _required_ |
| `triggered` | `bool` | Whether the guardrail was triggered. | `False` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>``` | ```md-code__content<br>def guardrail_span(<br>    name: str,<br>    triggered: bool = False,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[GuardrailSpanData]:<br>    """Create a new guardrail span. The span will not be started automatically, you should either<br>    do `with guardrail_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the guardrail.<br>        triggered: Whether the guardrail was triggered.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=GuardrailSpanData(name=name, triggered=triggered),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### handoff\_span

```md-code__content
handoff_span(
    from_agent: str | None = None,
    to_agent: str | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[HandoffSpanData]

```

Create a new handoff span. The span will not be started automatically, you should either do
`with handoff_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `from_agent` | `str | None` | The name of the agent that is handing off. | `None` |
| `to_agent` | `str | None` | The name of the agent that is receiving the handoff. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[HandoffSpanData]` | The newly created handoff span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>``` | ```md-code__content<br>def handoff_span(<br>    from_agent: str | None = None,<br>    to_agent: str | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[HandoffSpanData]:<br>    """Create a new handoff span. The span will not be started automatically, you should either do<br>    `with handoff_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        from_agent: The name of the agent that is handing off.<br>        to_agent: The name of the agent that is receiving the handoff.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created handoff span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=HandoffSpanData(from_agent=from_agent, to_agent=to_agent),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### response\_span

```md-code__content
response_span(
    response: Response | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[ResponseSpanData]

```

Create a new response span. The span will not be started automatically, you should either do
`with response_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `response` | `Response | None` | The OpenAI Response object. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>``` | ```md-code__content<br>def response_span(<br>    response: Response | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[ResponseSpanData]:<br>    """Create a new response span. The span will not be started automatically, you should either do<br>    `with response_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        response: The OpenAI Response object.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=ResponseSpanData(response=response),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### trace

```md-code__content
trace(
    workflow_name: str,
    trace_id: str | None = None,
    group_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    disabled: bool = False,
) -> Trace

```

Create a new trace. The trace will not be started automatically; you should either use
it as a context manager ( `with trace(...):`) or call `trace.start()` \+ `trace.finish()`
manually.

In addition to the workflow name and optional grouping identifier, you can provide
an arbitrary metadata dictionary to attach additional user-defined information to
the trace.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `workflow_name` | `str` | The name of the logical app or workflow. For example, you might provide<br>"code\_bot" for a coding agent, or "customer\_support\_agent" for a customer support agent. | _required_ |
| `trace_id` | `str | None` | The ID of the trace. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_trace_id()` to generate a trace ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `group_id` | `str | None` | Optional grouping identifier to link multiple traces from the same conversation<br>or process. For instance, you might use a chat thread ID. | `None` |
| `metadata` | `dict[str, Any] | None` | Optional dictionary of additional metadata to attach to the trace. | `None` |
| `disabled` | `bool` | If True, we will return a Trace but the Trace will not be recorded. This will<br>not be checked if there's an existing trace and `even_if_trace_running` is True. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Trace` | The newly created trace object. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>def trace(<br>    workflow_name: str,<br>    trace_id: str | None = None,<br>    group_id: str | None = None,<br>    metadata: dict[str, Any] | None = None,<br>    disabled: bool = False,<br>) -> Trace:<br>    """<br>    Create a new trace. The trace will not be started automatically; you should either use<br>    it as a context manager (`with trace(...):`) or call `trace.start()` + `trace.finish()`<br>    manually.<br>    In addition to the workflow name and optional grouping identifier, you can provide<br>    an arbitrary metadata dictionary to attach additional user-defined information to<br>    the trace.<br>    Args:<br>        workflow_name: The name of the logical app or workflow. For example, you might provide<br>            "code_bot" for a coding agent, or "customer_support_agent" for a customer support agent.<br>        trace_id: The ID of the trace. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_trace_id()` to generate a trace ID, to guarantee that IDs are<br>            correctly formatted.<br>        group_id: Optional grouping identifier to link multiple traces from the same conversation<br>            or process. For instance, you might use a chat thread ID.<br>        metadata: Optional dictionary of additional metadata to attach to the trace.<br>        disabled: If True, we will return a Trace but the Trace will not be recorded. This will<br>            not be checked if there's an existing trace and `even_if_trace_running` is True.<br>    Returns:<br>        The newly created trace object.<br>    """<br>    current_trace = GLOBAL_TRACE_PROVIDER.get_current_trace()<br>    if current_trace:<br>        logger.warning(<br>            "Trace already exists. Creating a new trace, but this is probably a mistake."<br>        )<br>    return GLOBAL_TRACE_PROVIDER.create_trace(<br>        name=workflow_name,<br>        trace_id=trace_id,<br>        group_id=group_id,<br>        metadata=metadata,<br>        disabled=disabled,<br>    )<br>``` |

### gen\_span\_id

```md-code__content
gen_span_id() -> str

```

Generates a new span ID.

Source code in `src/agents/tracing/util.py`

|     |     |
| --- | --- |
| ```<br>15<br>16<br>17<br>``` | ```md-code__content<br>def gen_span_id() -> str:<br>    """Generates a new span ID."""<br>    return f"span_{uuid.uuid4().hex[:24]}"<br>``` |

### gen\_trace\_id

```md-code__content
gen_trace_id() -> str

```

Generates a new trace ID.

Source code in `src/agents/tracing/util.py`

|     |     |
| --- | --- |
| ```<br>10<br>11<br>12<br>``` | ```md-code__content<br>def gen_trace_id() -> str:<br>    """Generates a new trace ID."""<br>    return f"trace_{uuid.uuid4().hex}"<br>``` |

### add\_trace\_processor

```md-code__content
add_trace_processor(
    span_processor: TracingProcessor,
) -> None

```

Adds a new trace processor. This processor will receive all traces/spans.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>def add_trace_processor(span_processor: TracingProcessor) -> None:<br>    """<br>    Adds a new trace processor. This processor will receive all traces/spans.<br>    """<br>    GLOBAL_TRACE_PROVIDER.register_processor(span_processor)<br>``` |

### set\_trace\_processors

```md-code__content
set_trace_processors(
    processors: list[TracingProcessor],
) -> None

```

Set the list of trace processors. This will replace the current list of processors.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>70<br>71<br>72<br>73<br>74<br>``` | ```md-code__content<br>def set_trace_processors(processors: list[TracingProcessor]) -> None:<br>    """<br>    Set the list of trace processors. This will replace the current list of processors.<br>    """<br>    GLOBAL_TRACE_PROVIDER.set_processors(processors)<br>``` |

### set\_tracing\_disabled

```md-code__content
set_tracing_disabled(disabled: bool) -> None

```

Set whether tracing is globally disabled.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>77<br>78<br>79<br>80<br>81<br>``` | ```md-code__content<br>def set_tracing_disabled(disabled: bool) -> None:<br>    """<br>    Set whether tracing is globally disabled.<br>    """<br>    GLOBAL_TRACE_PROVIDER.set_disabled(disabled)<br>``` |

### set\_tracing\_export\_api\_key

```md-code__content
set_tracing_export_api_key(api_key: str) -> None

```

Set the OpenAI API key for the backend exporter.

Source code in `src/agents/tracing/__init__.py`

|     |     |
| --- | --- |
| ```<br>84<br>85<br>86<br>87<br>88<br>``` | ```md-code__content<br>def set_tracing_export_api_key(api_key: str) -> None:<br>    """<br>    Set the OpenAI API key for the backend exporter.<br>    """<br>    default_exporter().set_api_key(api_key)<br>``` |

## Agent Workflow Runner

[Skip to content](https://openai.github.io/openai-agents-python/ref/run/#runner)

# `Runner`

### Runner

Source code in `src/agents/run.py`

|     |     |
| --- | --- |
| ```<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>321<br>322<br>323<br>324<br>325<br>326<br>327<br>328<br>329<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>345<br>346<br>347<br>348<br>349<br>350<br>351<br>352<br>353<br>354<br>355<br>356<br>357<br>358<br>359<br>360<br>361<br>362<br>363<br>364<br>365<br>366<br>367<br>368<br>369<br>370<br>371<br>372<br>373<br>374<br>375<br>376<br>377<br>378<br>379<br>380<br>381<br>382<br>383<br>384<br>385<br>386<br>387<br>388<br>389<br>390<br>391<br>392<br>393<br>394<br>395<br>396<br>397<br>398<br>399<br>400<br>401<br>402<br>403<br>404<br>405<br>406<br>407<br>408<br>409<br>410<br>411<br>412<br>413<br>414<br>415<br>416<br>417<br>418<br>419<br>420<br>421<br>422<br>423<br>424<br>425<br>426<br>427<br>428<br>429<br>430<br>431<br>432<br>433<br>434<br>435<br>436<br>437<br>438<br>439<br>440<br>441<br>442<br>443<br>444<br>445<br>446<br>447<br>448<br>449<br>450<br>451<br>452<br>453<br>454<br>455<br>456<br>457<br>458<br>459<br>460<br>461<br>462<br>463<br>464<br>465<br>466<br>467<br>468<br>469<br>470<br>471<br>472<br>473<br>474<br>475<br>476<br>477<br>478<br>479<br>480<br>481<br>482<br>483<br>484<br>485<br>486<br>487<br>488<br>489<br>490<br>491<br>492<br>493<br>494<br>495<br>496<br>497<br>498<br>499<br>500<br>501<br>502<br>503<br>504<br>505<br>506<br>507<br>508<br>509<br>510<br>511<br>512<br>513<br>514<br>515<br>516<br>517<br>518<br>519<br>520<br>521<br>522<br>523<br>524<br>525<br>526<br>527<br>528<br>529<br>530<br>531<br>532<br>533<br>534<br>535<br>536<br>537<br>538<br>539<br>540<br>541<br>542<br>543<br>544<br>545<br>546<br>547<br>548<br>549<br>550<br>551<br>552<br>553<br>554<br>555<br>556<br>557<br>558<br>559<br>560<br>561<br>562<br>563<br>564<br>565<br>566<br>567<br>568<br>569<br>570<br>571<br>572<br>573<br>574<br>575<br>576<br>577<br>578<br>579<br>580<br>581<br>582<br>583<br>584<br>585<br>586<br>587<br>588<br>589<br>590<br>591<br>592<br>593<br>594<br>595<br>596<br>597<br>598<br>599<br>600<br>601<br>602<br>603<br>604<br>605<br>606<br>607<br>608<br>609<br>610<br>611<br>612<br>613<br>614<br>615<br>616<br>617<br>618<br>619<br>620<br>621<br>622<br>623<br>624<br>625<br>626<br>627<br>628<br>629<br>630<br>631<br>632<br>633<br>634<br>635<br>636<br>637<br>638<br>639<br>640<br>641<br>642<br>643<br>644<br>645<br>646<br>647<br>648<br>649<br>650<br>651<br>652<br>653<br>654<br>655<br>656<br>657<br>658<br>659<br>660<br>661<br>662<br>663<br>664<br>665<br>666<br>667<br>668<br>669<br>670<br>671<br>672<br>673<br>674<br>675<br>676<br>677<br>678<br>679<br>680<br>681<br>682<br>683<br>684<br>685<br>686<br>687<br>688<br>689<br>690<br>691<br>692<br>693<br>694<br>695<br>696<br>697<br>698<br>699<br>700<br>701<br>702<br>703<br>704<br>705<br>706<br>707<br>708<br>709<br>710<br>711<br>712<br>713<br>714<br>715<br>716<br>717<br>718<br>719<br>720<br>721<br>722<br>723<br>724<br>725<br>726<br>727<br>728<br>729<br>730<br>731<br>732<br>733<br>734<br>735<br>736<br>737<br>738<br>739<br>740<br>741<br>742<br>743<br>744<br>745<br>746<br>747<br>748<br>749<br>750<br>751<br>752<br>753<br>754<br>755<br>756<br>757<br>758<br>759<br>760<br>761<br>762<br>763<br>764<br>765<br>766<br>767<br>768<br>769<br>770<br>771<br>772<br>773<br>774<br>775<br>776<br>777<br>778<br>779<br>780<br>781<br>782<br>783<br>784<br>785<br>786<br>787<br>788<br>789<br>790<br>791<br>792<br>793<br>794<br>795<br>796<br>797<br>798<br>799<br>800<br>801<br>802<br>803<br>804<br>805<br>806<br>807<br>808<br>809<br>810<br>811<br>812<br>813<br>814<br>815<br>816<br>817<br>818<br>819<br>820<br>821<br>822<br>823<br>824<br>825<br>826<br>827<br>828<br>829<br>830<br>831<br>832<br>833<br>834<br>835<br>836<br>837<br>838<br>839<br>840<br>841<br>842<br>843<br>844<br>845<br>846<br>847<br>848<br>849<br>850<br>851<br>852<br>853<br>854<br>855<br>856<br>857<br>858<br>859<br>860<br>861<br>862<br>863<br>864<br>865<br>866<br>867<br>868<br>869<br>870<br>871<br>872<br>873<br>874<br>875<br>876<br>877<br>878<br>879<br>880<br>881<br>882<br>883<br>884<br>885<br>886<br>887<br>888<br>889<br>890<br>891<br>892<br>893<br>894<br>895<br>896<br>897<br>898<br>899<br>900<br>901<br>902<br>903<br>904<br>``` | ```md-code__content<br>class Runner:<br>    @classmethod<br>    async def run(<br>        cls,<br>        starting_agent: Agent[TContext],<br>        input: str | list[TResponseInputItem],<br>        *,<br>        context: TContext | None = None,<br>        max_turns: int = DEFAULT_MAX_TURNS,<br>        hooks: RunHooks[TContext] | None = None,<br>        run_config: RunConfig | None = None,<br>    ) -> RunResult:<br>        """Run a workflow starting at the given agent. The agent will run in a loop until a final<br>        output is generated. The loop runs like so:<br>        1. The agent is invoked with the given input.<br>        2. If there is a final output (i.e. the agent produces something of type<br>            `agent.output_type`, the loop terminates.<br>        3. If there's a handoff, we run the loop again, with the new agent.<br>        4. Else, we run tool calls (if any), and re-run the loop.<br>        In two cases, the agent may raise an exception:<br>        1. If the max_turns is exceeded, a MaxTurnsExceeded exception is raised.<br>        2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.<br>        Note that only the first agent's input guardrails are run.<br>        Args:<br>            starting_agent: The starting agent to run.<br>            input: The initial input to the agent. You can pass a single string for a user message,<br>                or a list of input items.<br>            context: The context to run the agent with.<br>            max_turns: The maximum number of turns to run the agent for. A turn is defined as one<br>                AI invocation (including any tool calls that might occur).<br>            hooks: An object that receives callbacks on various lifecycle events.<br>            run_config: Global settings for the entire agent run.<br>        Returns:<br>            A run result containing all the inputs, guardrail results and the output of the last<br>            agent. Agents may perform handoffs, so we don't know the specific type of the output.<br>        """<br>        if hooks is None:<br>            hooks = RunHooks[Any]()<br>        if run_config is None:<br>            run_config = RunConfig()<br>        with TraceCtxManager(<br>            workflow_name=run_config.workflow_name,<br>            trace_id=run_config.trace_id,<br>            group_id=run_config.group_id,<br>            metadata=run_config.trace_metadata,<br>            disabled=run_config.tracing_disabled,<br>        ):<br>            current_turn = 0<br>            original_input: str | list[TResponseInputItem] = copy.deepcopy(input)<br>            generated_items: list[RunItem] = []<br>            model_responses: list[ModelResponse] = []<br>            context_wrapper: RunContextWrapper[TContext] = RunContextWrapper(<br>                context=context,  # type: ignore<br>            )<br>            input_guardrail_results: list[InputGuardrailResult] = []<br>            current_span: Span[AgentSpanData] | None = None<br>            current_agent = starting_agent<br>            should_run_agent_start_hooks = True<br>            try:<br>                while True:<br>                    # Start an agent span if we don't have one. This span is ended if the current<br>                    # agent changes, or if the agent loop ends.<br>                    if current_span is None:<br>                        handoff_names = [h.agent_name for h in cls._get_handoffs(current_agent)]<br>                        tool_names = [t.name for t in current_agent.tools]<br>                        if output_schema := cls._get_output_schema(current_agent):<br>                            output_type_name = output_schema.output_type_name()<br>                        else:<br>                            output_type_name = "str"<br>                        current_span = agent_span(<br>                            name=current_agent.name,<br>                            handoffs=handoff_names,<br>                            tools=tool_names,<br>                            output_type=output_type_name,<br>                        )<br>                        current_span.start(mark_as_current=True)<br>                    current_turn += 1<br>                    if current_turn > max_turns:<br>                        _error_tracing.attach_error_to_span(<br>                            current_span,<br>                            SpanError(<br>                                message="Max turns exceeded",<br>                                data={"max_turns": max_turns},<br>                            ),<br>                        )<br>                        raise MaxTurnsExceeded(f"Max turns ({max_turns}) exceeded")<br>                    logger.debug(<br>                        f"Running agent {current_agent.name} (turn {current_turn})",<br>                    )<br>                    if current_turn == 1:<br>                        input_guardrail_results, turn_result = await asyncio.gather(<br>                            cls._run_input_guardrails(<br>                                starting_agent,<br>                                starting_agent.input_guardrails<br>                                + (run_config.input_guardrails or []),<br>                                copy.deepcopy(input),<br>                                context_wrapper,<br>                            ),<br>                            cls._run_single_turn(<br>                                agent=current_agent,<br>                                original_input=original_input,<br>                                generated_items=generated_items,<br>                                hooks=hooks,<br>                                context_wrapper=context_wrapper,<br>                                run_config=run_config,<br>                                should_run_agent_start_hooks=should_run_agent_start_hooks,<br>                            ),<br>                        )<br>                    else:<br>                        turn_result = await cls._run_single_turn(<br>                            agent=current_agent,<br>                            original_input=original_input,<br>                            generated_items=generated_items,<br>                            hooks=hooks,<br>                            context_wrapper=context_wrapper,<br>                            run_config=run_config,<br>                            should_run_agent_start_hooks=should_run_agent_start_hooks,<br>                        )<br>                    should_run_agent_start_hooks = False<br>                    model_responses.append(turn_result.model_response)<br>                    original_input = turn_result.original_input<br>                    generated_items = turn_result.generated_items<br>                    if isinstance(turn_result.next_step, NextStepFinalOutput):<br>                        output_guardrail_results = await cls._run_output_guardrails(<br>                            current_agent.output_guardrails + (run_config.output_guardrails or []),<br>                            current_agent,<br>                            turn_result.next_step.output,<br>                            context_wrapper,<br>                        )<br>                        return RunResult(<br>                            input=original_input,<br>                            new_items=generated_items,<br>                            raw_responses=model_responses,<br>                            final_output=turn_result.next_step.output,<br>_last_agent=current_agent,<br>                            input_guardrail_results=input_guardrail_results,<br>                            output_guardrail_results=output_guardrail_results,<br>                        )<br>                    elif isinstance(turn_result.next_step, NextStepHandoff):<br>                        current_agent = cast(Agent[TContext], turn_result.next_step.new_agent)<br>                        current_span.finish(reset_current=True)<br>                        current_span = None<br>                        should_run_agent_start_hooks = True<br>                    elif isinstance(turn_result.next_step, NextStepRunAgain):<br>                        pass<br>                    else:<br>                        raise AgentsException(<br>                            f"Unknown next step type: {type(turn_result.next_step)}"<br>                        )<br>            finally:<br>                if current_span:<br>                    current_span.finish(reset_current=True)<br>    @classmethod<br>    def run_sync(<br>        cls,<br>        starting_agent: Agent[TContext],<br>        input: str | list[TResponseInputItem],<br>        *,<br>        context: TContext | None = None,<br>        max_turns: int = DEFAULT_MAX_TURNS,<br>        hooks: RunHooks[TContext] | None = None,<br>        run_config: RunConfig | None = None,<br>    ) -> RunResult:<br>        """Run a workflow synchronously, starting at the given agent. Note that this just wraps the<br>        `run` method, so it will not work if there's already an event loop (e.g. inside an async<br>        function, or in a Jupyter notebook or async context like FastAPI). For those cases, use<br>        the `run` method instead.<br>        The agent will run in a loop until a final output is generated. The loop runs like so:<br>        1. The agent is invoked with the given input.<br>        2. If there is a final output (i.e. the agent produces something of type<br>            `agent.output_type`, the loop terminates.<br>        3. If there's a handoff, we run the loop again, with the new agent.<br>        4. Else, we run tool calls (if any), and re-run the loop.<br>        In two cases, the agent may raise an exception:<br>        1. If the max_turns is exceeded, a MaxTurnsExceeded exception is raised.<br>        2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.<br>        Note that only the first agent's input guardrails are run.<br>        Args:<br>            starting_agent: The starting agent to run.<br>            input: The initial input to the agent. You can pass a single string for a user message,<br>                or a list of input items.<br>            context: The context to run the agent with.<br>            max_turns: The maximum number of turns to run the agent for. A turn is defined as one<br>                AI invocation (including any tool calls that might occur).<br>            hooks: An object that receives callbacks on various lifecycle events.<br>            run_config: Global settings for the entire agent run.<br>        Returns:<br>            A run result containing all the inputs, guardrail results and the output of the last<br>            agent. Agents may perform handoffs, so we don't know the specific type of the output.<br>        """<br>        return asyncio.get_event_loop().run_until_complete(<br>            cls.run(<br>                starting_agent,<br>                input,<br>                context=context,<br>                max_turns=max_turns,<br>                hooks=hooks,<br>                run_config=run_config,<br>            )<br>        )<br>    @classmethod<br>    def run_streamed(<br>        cls,<br>        starting_agent: Agent[TContext],<br>        input: str | list[TResponseInputItem],<br>        context: TContext | None = None,<br>        max_turns: int = DEFAULT_MAX_TURNS,<br>        hooks: RunHooks[TContext] | None = None,<br>        run_config: RunConfig | None = None,<br>    ) -> RunResultStreaming:<br>        """Run a workflow starting at the given agent in streaming mode. The returned result object<br>        contains a method you can use to stream semantic events as they are generated.<br>        The agent will run in a loop until a final output is generated. The loop runs like so:<br>        1. The agent is invoked with the given input.<br>        2. If there is a final output (i.e. the agent produces something of type<br>            `agent.output_type`, the loop terminates.<br>        3. If there's a handoff, we run the loop again, with the new agent.<br>        4. Else, we run tool calls (if any), and re-run the loop.<br>        In two cases, the agent may raise an exception:<br>        1. If the max_turns is exceeded, a MaxTurnsExceeded exception is raised.<br>        2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.<br>        Note that only the first agent's input guardrails are run.<br>        Args:<br>            starting_agent: The starting agent to run.<br>            input: The initial input to the agent. You can pass a single string for a user message,<br>                or a list of input items.<br>            context: The context to run the agent with.<br>            max_turns: The maximum number of turns to run the agent for. A turn is defined as one<br>                AI invocation (including any tool calls that might occur).<br>            hooks: An object that receives callbacks on various lifecycle events.<br>            run_config: Global settings for the entire agent run.<br>        Returns:<br>            A result object that contains data about the run, as well as a method to stream events.<br>        """<br>        if hooks is None:<br>            hooks = RunHooks[Any]()<br>        if run_config is None:<br>            run_config = RunConfig()<br>        # If there's already a trace, we don't create a new one. In addition, we can't end the<br>        # trace here, because the actual work is done in `stream_events` and this method ends<br>        # before that.<br>        new_trace = (<br>            None<br>            if get_current_trace()<br>            else trace(<br>                workflow_name=run_config.workflow_name,<br>                trace_id=run_config.trace_id,<br>                group_id=run_config.group_id,<br>                metadata=run_config.trace_metadata,<br>                disabled=run_config.tracing_disabled,<br>            )<br>        )<br>        # Need to start the trace here, because the current trace contextvar is captured at<br>        # asyncio.create_task time<br>        if new_trace:<br>            new_trace.start(mark_as_current=True)<br>        output_schema = cls._get_output_schema(starting_agent)<br>        context_wrapper: RunContextWrapper[TContext] = RunContextWrapper(<br>            context=context  # type: ignore<br>        )<br>        streamed_result = RunResultStreaming(<br>            input=copy.deepcopy(input),<br>            new_items=[],<br>            current_agent=starting_agent,<br>            raw_responses=[],<br>            final_output=None,<br>            is_complete=False,<br>            current_turn=0,<br>            max_turns=max_turns,<br>            input_guardrail_results=[],<br>            output_guardrail_results=[],<br>_current_agent_output_schema=output_schema,<br>            _trace=new_trace,<br>        )<br>        # Kick off the actual agent loop in the background and return the streamed result object.<br>        streamed_result._run_impl_task = asyncio.create_task(<br>            cls._run_streamed_impl(<br>                starting_input=input,<br>                streamed_result=streamed_result,<br>                starting_agent=starting_agent,<br>                max_turns=max_turns,<br>                hooks=hooks,<br>                context_wrapper=context_wrapper,<br>                run_config=run_config,<br>            )<br>        )<br>        return streamed_result<br>    @classmethod<br>    async def _run_input_guardrails_with_queue(<br>        cls,<br>        agent: Agent[Any],<br>        guardrails: list[InputGuardrail[TContext]],<br>        input: str | list[TResponseInputItem],<br>        context: RunContextWrapper[TContext],<br>        streamed_result: RunResultStreaming,<br>        parent_span: Span[Any],<br>    ):<br>        queue = streamed_result._input_guardrail_queue<br>        # We'll run the guardrails and push them onto the queue as they complete<br>        guardrail_tasks = [<br>            asyncio.create_task(<br>                RunImpl.run_single_input_guardrail(agent, guardrail, input, context)<br>            )<br>            for guardrail in guardrails<br>        ]<br>        guardrail_results = []<br>        try:<br>            for done in asyncio.as_completed(guardrail_tasks):<br>                result = await done<br>                if result.output.tripwire_triggered:<br>_error_tracing.attach_error_to_span(<br>                        parent_span,<br>                        SpanError(<br>                            message="Guardrail tripwire triggered",<br>                            data={<br>                                "guardrail": result.guardrail.get_name(),<br>                                "type": "input_guardrail",<br>                            },<br>                        ),<br>                    )<br>                queue.put_nowait(result)<br>                guardrail_results.append(result)<br>        except Exception:<br>            for t in guardrail_tasks:<br>                t.cancel()<br>            raise<br>        streamed_result.input_guardrail_results = guardrail_results<br>    @classmethod<br>    async def _run_streamed_impl(<br>        cls,<br>        starting_input: str | list[TResponseInputItem],<br>        streamed_result: RunResultStreaming,<br>        starting_agent: Agent[TContext],<br>        max_turns: int,<br>        hooks: RunHooks[TContext],<br>        context_wrapper: RunContextWrapper[TContext],<br>        run_config: RunConfig,<br>    ):<br>        current_span: Span[AgentSpanData] | None = None<br>        current_agent = starting_agent<br>        current_turn = 0<br>        should_run_agent_start_hooks = True<br>        streamed_result._event_queue.put_nowait(AgentUpdatedStreamEvent(new_agent=current_agent))<br>        try:<br>            while True:<br>                if streamed_result.is_complete:<br>                    break<br>                # Start an agent span if we don't have one. This span is ended if the current<br>                # agent changes, or if the agent loop ends.<br>                if current_span is None:<br>                    handoff_names = [h.agent_name for h in cls._get_handoffs(current_agent)]<br>                    tool_names = [t.name for t in current_agent.tools]<br>                    if output_schema := cls._get_output_schema(current_agent):<br>                        output_type_name = output_schema.output_type_name()<br>                    else:<br>                        output_type_name = "str"<br>                    current_span = agent_span(<br>                        name=current_agent.name,<br>                        handoffs=handoff_names,<br>                        tools=tool_names,<br>                        output_type=output_type_name,<br>                    )<br>                    current_span.start(mark_as_current=True)<br>                current_turn += 1<br>                streamed_result.current_turn = current_turn<br>                if current_turn > max_turns:<br>                    _error_tracing.attach_error_to_span(<br>                        current_span,<br>                        SpanError(<br>                            message="Max turns exceeded",<br>                            data={"max_turns": max_turns},<br>                        ),<br>                    )<br>                    streamed_result._event_queue.put_nowait(QueueCompleteSentinel())<br>                    break<br>                if current_turn == 1:<br>                    # Run the input guardrails in the background and put the results on the queue<br>                    streamed_result._input_guardrails_task = asyncio.create_task(<br>                        cls._run_input_guardrails_with_queue(<br>                            starting_agent,<br>                            starting_agent.input_guardrails + (run_config.input_guardrails or []),<br>                            copy.deepcopy(ItemHelpers.input_to_new_input_list(starting_input)),<br>                            context_wrapper,<br>                            streamed_result,<br>                            current_span,<br>                        )<br>                    )<br>                try:<br>                    turn_result = await cls._run_single_turn_streamed(<br>                        streamed_result,<br>                        current_agent,<br>                        hooks,<br>                        context_wrapper,<br>                        run_config,<br>                        should_run_agent_start_hooks,<br>                    )<br>                    should_run_agent_start_hooks = False<br>                    streamed_result.raw_responses = streamed_result.raw_responses + [<br>                        turn_result.model_response<br>                    ]<br>                    streamed_result.input = turn_result.original_input<br>                    streamed_result.new_items = turn_result.generated_items<br>                    if isinstance(turn_result.next_step, NextStepHandoff):<br>                        current_agent = turn_result.next_step.new_agent<br>                        current_span.finish(reset_current=True)<br>                        current_span = None<br>                        should_run_agent_start_hooks = True<br>                        streamed_result._event_queue.put_nowait(<br>                            AgentUpdatedStreamEvent(new_agent=current_agent)<br>                        )<br>                    elif isinstance(turn_result.next_step, NextStepFinalOutput):<br>                        streamed_result._output_guardrails_task = asyncio.create_task(<br>                            cls._run_output_guardrails(<br>                                current_agent.output_guardrails<br>                                + (run_config.output_guardrails or []),<br>                                current_agent,<br>                                turn_result.next_step.output,<br>                                context_wrapper,<br>                            )<br>                        )<br>                        try:<br>                            output_guardrail_results = await streamed_result._output_guardrails_task<br>                        except Exception:<br>                            # Exceptions will be checked in the stream_events loop<br>                            output_guardrail_results = []<br>                        streamed_result.output_guardrail_results = output_guardrail_results<br>                        streamed_result.final_output = turn_result.next_step.output<br>                        streamed_result.is_complete = True<br>                        streamed_result._event_queue.put_nowait(QueueCompleteSentinel())<br>                    elif isinstance(turn_result.next_step, NextStepRunAgain):<br>                        pass<br>                except Exception as e:<br>                    if current_span:<br>                        _error_tracing.attach_error_to_span(<br>                            current_span,<br>                            SpanError(<br>                                message="Error in agent run",<br>                                data={"error": str(e)},<br>                            ),<br>                        )<br>                    streamed_result.is_complete = True<br>                    streamed_result._event_queue.put_nowait(QueueCompleteSentinel())<br>                    raise<br>            streamed_result.is_complete = True<br>        finally:<br>            if current_span:<br>                current_span.finish(reset_current=True)<br>    @classmethod<br>    async def_run_single_turn_streamed(<br>        cls,<br>        streamed_result: RunResultStreaming,<br>        agent: Agent[TContext],<br>        hooks: RunHooks[TContext],<br>        context_wrapper: RunContextWrapper[TContext],<br>        run_config: RunConfig,<br>        should_run_agent_start_hooks: bool,<br>    ) -> SingleStepResult:<br>        if should_run_agent_start_hooks:<br>            await asyncio.gather(<br>                hooks.on_agent_start(context_wrapper, agent),<br>                (<br>                    agent.hooks.on_start(context_wrapper, agent)<br>                    if agent.hooks<br>                    else_coro.noop_coroutine()<br>                ),<br>            )<br>        output_schema = cls._get_output_schema(agent)<br>        streamed_result.current_agent = agent<br>        streamed_result._current_agent_output_schema = output_schema<br>        system_prompt = await agent.get_system_prompt(context_wrapper)<br>        handoffs = cls._get_handoffs(agent)<br>        model = cls._get_model(agent, run_config)<br>        model_settings = agent.model_settings.resolve(run_config.model_settings)<br>        final_response: ModelResponse | None = None<br>        input = ItemHelpers.input_to_new_input_list(streamed_result.input)<br>        input.extend([item.to_input_item() for item in streamed_result.new_items])<br>        # 1. Stream the output events<br>        async for event in model.stream_response(<br>            system_prompt,<br>            input,<br>            model_settings,<br>            agent.tools,<br>            output_schema,<br>            handoffs,<br>            get_model_tracing_impl(<br>                run_config.tracing_disabled, run_config.trace_include_sensitive_data<br>            ),<br>        ):<br>            if isinstance(event, ResponseCompletedEvent):<br>                usage = (<br>                    Usage(<br>                        requests=1,<br>                        input_tokens=event.response.usage.input_tokens,<br>                        output_tokens=event.response.usage.output_tokens,<br>                        total_tokens=event.response.usage.total_tokens,<br>                    )<br>                    if event.response.usage<br>                    else Usage()<br>                )<br>                final_response = ModelResponse(<br>                    output=event.response.output,<br>                    usage=usage,<br>                    referenceable_id=event.response.id,<br>                )<br>            streamed_result._event_queue.put_nowait(RawResponsesStreamEvent(data=event))<br>        # 2. At this point, the streaming is complete for this turn of the agent loop.<br>        if not final_response:<br>            raise ModelBehaviorError("Model did not produce a final response!")<br>        # 3. Now, we can process the turn as we do in the non-streaming case<br>        single_step_result = await cls._get_single_step_result_from_response(<br>            agent=agent,<br>            original_input=streamed_result.input,<br>            pre_step_items=streamed_result.new_items,<br>            new_response=final_response,<br>            output_schema=output_schema,<br>            handoffs=handoffs,<br>            hooks=hooks,<br>            context_wrapper=context_wrapper,<br>            run_config=run_config,<br>        )<br>        RunImpl.stream_step_result_to_queue(single_step_result, streamed_result._event_queue)<br>        return single_step_result<br>    @classmethod<br>    async def _run_single_turn(<br>        cls,<br>        *,<br>        agent: Agent[TContext],<br>        original_input: str | list[TResponseInputItem],<br>        generated_items: list[RunItem],<br>        hooks: RunHooks[TContext],<br>        context_wrapper: RunContextWrapper[TContext],<br>        run_config: RunConfig,<br>        should_run_agent_start_hooks: bool,<br>    ) -> SingleStepResult:<br>        # Ensure we run the hooks before anything else<br>        if should_run_agent_start_hooks:<br>            await asyncio.gather(<br>                hooks.on_agent_start(context_wrapper, agent),<br>                (<br>                    agent.hooks.on_start(context_wrapper, agent)<br>                    if agent.hooks<br>                    else _coro.noop_coroutine()<br>                ),<br>            )<br>        system_prompt = await agent.get_system_prompt(context_wrapper)<br>        output_schema = cls._get_output_schema(agent)<br>        handoffs = cls._get_handoffs(agent)<br>        input = ItemHelpers.input_to_new_input_list(original_input)<br>        input.extend([generated_item.to_input_item() for generated_item in generated_items])<br>        new_response = await cls._get_new_response(<br>            agent,<br>            system_prompt,<br>            input,<br>            output_schema,<br>            handoffs,<br>            context_wrapper,<br>            run_config,<br>        )<br>        return await cls._get_single_step_result_from_response(<br>            agent=agent,<br>            original_input=original_input,<br>            pre_step_items=generated_items,<br>            new_response=new_response,<br>            output_schema=output_schema,<br>            handoffs=handoffs,<br>            hooks=hooks,<br>            context_wrapper=context_wrapper,<br>            run_config=run_config,<br>        )<br>    @classmethod<br>    async def_get_single_step_result_from_response(<br>        cls,<br>        *,<br>        agent: Agent[TContext],<br>        original_input: str | list[TResponseInputItem],<br>        pre_step_items: list[RunItem],<br>        new_response: ModelResponse,<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        hooks: RunHooks[TContext],<br>        context_wrapper: RunContextWrapper[TContext],<br>        run_config: RunConfig,<br>    ) -> SingleStepResult:<br>        processed_response = RunImpl.process_model_response(<br>            agent=agent,<br>            response=new_response,<br>            output_schema=output_schema,<br>            handoffs=handoffs,<br>        )<br>        return await RunImpl.execute_tools_and_side_effects(<br>            agent=agent,<br>            original_input=original_input,<br>            pre_step_items=pre_step_items,<br>            new_response=new_response,<br>            processed_response=processed_response,<br>            output_schema=output_schema,<br>            hooks=hooks,<br>            context_wrapper=context_wrapper,<br>            run_config=run_config,<br>        )<br>    @classmethod<br>    async def _run_input_guardrails(<br>        cls,<br>        agent: Agent[Any],<br>        guardrails: list[InputGuardrail[TContext]],<br>        input: str | list[TResponseInputItem],<br>        context: RunContextWrapper[TContext],<br>    ) -> list[InputGuardrailResult]:<br>        if not guardrails:<br>            return []<br>        guardrail_tasks = [<br>            asyncio.create_task(<br>                RunImpl.run_single_input_guardrail(agent, guardrail, input, context)<br>            )<br>            for guardrail in guardrails<br>        ]<br>        guardrail_results = []<br>        for done in asyncio.as_completed(guardrail_tasks):<br>            result = await done<br>            if result.output.tripwire_triggered:<br>                # Cancel all guardrail tasks if a tripwire is triggered.<br>                for t in guardrail_tasks:<br>                    t.cancel()<br>                _error_tracing.attach_error_to_current_span(<br>                    SpanError(<br>                        message="Guardrail tripwire triggered",<br>                        data={"guardrail": result.guardrail.get_name()},<br>                    )<br>                )<br>                raise InputGuardrailTripwireTriggered(result)<br>            else:<br>                guardrail_results.append(result)<br>        return guardrail_results<br>    @classmethod<br>    async def_run_output_guardrails(<br>        cls,<br>        guardrails: list[OutputGuardrail[TContext]],<br>        agent: Agent[TContext],<br>        agent_output: Any,<br>        context: RunContextWrapper[TContext],<br>    ) -> list[OutputGuardrailResult]:<br>        if not guardrails:<br>            return []<br>        guardrail_tasks = [<br>            asyncio.create_task(<br>                RunImpl.run_single_output_guardrail(guardrail, agent, agent_output, context)<br>            )<br>            for guardrail in guardrails<br>        ]<br>        guardrail_results = []<br>        for done in asyncio.as_completed(guardrail_tasks):<br>            result = await done<br>            if result.output.tripwire_triggered:<br>                # Cancel all guardrail tasks if a tripwire is triggered.<br>                for t in guardrail_tasks:<br>                    t.cancel()<br>                _error_tracing.attach_error_to_current_span(<br>                    SpanError(<br>                        message="Guardrail tripwire triggered",<br>                        data={"guardrail": result.guardrail.get_name()},<br>                    )<br>                )<br>                raise OutputGuardrailTripwireTriggered(result)<br>            else:<br>                guardrail_results.append(result)<br>        return guardrail_results<br>    @classmethod<br>    async def_get_new_response(<br>        cls,<br>        agent: Agent[TContext],<br>        system_prompt: str | None,<br>        input: list[TResponseInputItem],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        context_wrapper: RunContextWrapper[TContext],<br>        run_config: RunConfig,<br>    ) -> ModelResponse:<br>        model = cls._get_model(agent, run_config)<br>        model_settings = agent.model_settings.resolve(run_config.model_settings)<br>        new_response = await model.get_response(<br>            system_instructions=system_prompt,<br>            input=input,<br>            model_settings=model_settings,<br>            tools=agent.tools,<br>            output_schema=output_schema,<br>            handoffs=handoffs,<br>            tracing=get_model_tracing_impl(<br>                run_config.tracing_disabled, run_config.trace_include_sensitive_data<br>            ),<br>        )<br>        context_wrapper.usage.add(new_response.usage)<br>        return new_response<br>    @classmethod<br>    def_get_output_schema(cls, agent: Agent[Any]) -> AgentOutputSchema | None:<br>        if agent.output_type is None or agent.output_type is str:<br>            return None<br>        return AgentOutputSchema(agent.output_type)<br>    @classmethod<br>    def_get_handoffs(cls, agent: Agent[Any]) -> list[Handoff]:<br>        handoffs = []<br>        for handoff_item in agent.handoffs:<br>            if isinstance(handoff_item, Handoff):<br>                handoffs.append(handoff_item)<br>            elif isinstance(handoff_item, Agent):<br>                handoffs.append(handoff(handoff_item))<br>        return handoffs<br>    @classmethod<br>    def _get_model(cls, agent: Agent[Any], run_config: RunConfig) -> Model:<br>        if isinstance(run_config.model, Model):<br>            return run_config.model<br>        elif isinstance(run_config.model, str):<br>            return run_config.model_provider.get_model(run_config.model)<br>        elif isinstance(agent.model, Model):<br>            return agent.model<br>        return run_config.model_provider.get_model(agent.model)<br>``` |

#### run`async``classmethod`

```md-code__content
run(
    starting_agent: Agent[TContext],
    input: str | list[TResponseInputItem],
    *,
    context: TContext | None = None,
    max_turns: int = DEFAULT_MAX_TURNS,
    hooks: RunHooks[TContext] | None = None,
    run_config: RunConfig | None = None,
) -> RunResult

```

Run a workflow starting at the given agent. The agent will run in a loop until a final
output is generated. The loop runs like so:
1\. The agent is invoked with the given input.
2\. If there is a final output (i.e. the agent produces something of type
`agent.output_type`, the loop terminates.
3\. If there's a handoff, we run the loop again, with the new agent.
4\. Else, we run tool calls (if any), and re-run the loop.

In two cases, the agent may raise an exception:
1\. If the max\_turns is exceeded, a MaxTurnsExceeded exception is raised.
2\. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.

Note that only the first agent's input guardrails are run.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `starting_agent` | `Agent[TContext]` | The starting agent to run. | _required_ |
| `input` | `str | list[TResponseInputItem]` | The initial input to the agent. You can pass a single string for a user message,<br>or a list of input items. | _required_ |
| `context` | `TContext | None` | The context to run the agent with. | `None` |
| `max_turns` | `int` | The maximum number of turns to run the agent for. A turn is defined as one<br>AI invocation (including any tool calls that might occur). | `DEFAULT_MAX_TURNS` |
| `hooks` | `RunHooks[TContext] | None` | An object that receives callbacks on various lifecycle events. | `None` |
| `run_config` | `RunConfig | None` | Global settings for the entire agent run. | `None` |

Returns:

| Type | Description |
| --- | --- |
| `RunResult` | A run result containing all the inputs, guardrail results and the output of the last |
| `RunResult` | agent. Agents may perform handoffs, so we don't know the specific type of the output. |

Source code in `src/agents/run.py`

|     |     |
| --- | --- |
| ```<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>``` | ```md-code__content<br>@classmethod<br>async def run(<br>    cls,<br>    starting_agent: Agent[TContext],<br>    input: str | list[TResponseInputItem],<br>    *,<br>    context: TContext | None = None,<br>    max_turns: int = DEFAULT_MAX_TURNS,<br>    hooks: RunHooks[TContext] | None = None,<br>    run_config: RunConfig | None = None,<br>) -> RunResult:<br>    """Run a workflow starting at the given agent. The agent will run in a loop until a final<br>    output is generated. The loop runs like so:<br>    1. The agent is invoked with the given input.<br>    2. If there is a final output (i.e. the agent produces something of type<br>        `agent.output_type`, the loop terminates.<br>    3. If there's a handoff, we run the loop again, with the new agent.<br>    4. Else, we run tool calls (if any), and re-run the loop.<br>    In two cases, the agent may raise an exception:<br>    1. If the max_turns is exceeded, a MaxTurnsExceeded exception is raised.<br>    2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.<br>    Note that only the first agent's input guardrails are run.<br>    Args:<br>        starting_agent: The starting agent to run.<br>        input: The initial input to the agent. You can pass a single string for a user message,<br>            or a list of input items.<br>        context: The context to run the agent with.<br>        max_turns: The maximum number of turns to run the agent for. A turn is defined as one<br>            AI invocation (including any tool calls that might occur).<br>        hooks: An object that receives callbacks on various lifecycle events.<br>        run_config: Global settings for the entire agent run.<br>    Returns:<br>        A run result containing all the inputs, guardrail results and the output of the last<br>        agent. Agents may perform handoffs, so we don't know the specific type of the output.<br>    """<br>    if hooks is None:<br>        hooks = RunHooks[Any]()<br>    if run_config is None:<br>        run_config = RunConfig()<br>    with TraceCtxManager(<br>        workflow_name=run_config.workflow_name,<br>        trace_id=run_config.trace_id,<br>        group_id=run_config.group_id,<br>        metadata=run_config.trace_metadata,<br>        disabled=run_config.tracing_disabled,<br>    ):<br>        current_turn = 0<br>        original_input: str | list[TResponseInputItem] = copy.deepcopy(input)<br>        generated_items: list[RunItem] = []<br>        model_responses: list[ModelResponse] = []<br>        context_wrapper: RunContextWrapper[TContext] = RunContextWrapper(<br>            context=context,  # type: ignore<br>        )<br>        input_guardrail_results: list[InputGuardrailResult] = []<br>        current_span: Span[AgentSpanData] | None = None<br>        current_agent = starting_agent<br>        should_run_agent_start_hooks = True<br>        try:<br>            while True:<br>                # Start an agent span if we don't have one. This span is ended if the current<br>                # agent changes, or if the agent loop ends.<br>                if current_span is None:<br>                    handoff_names = [h.agent_name for h in cls._get_handoffs(current_agent)]<br>                    tool_names = [t.name for t in current_agent.tools]<br>                    if output_schema := cls._get_output_schema(current_agent):<br>                        output_type_name = output_schema.output_type_name()<br>                    else:<br>                        output_type_name = "str"<br>                    current_span = agent_span(<br>                        name=current_agent.name,<br>                        handoffs=handoff_names,<br>                        tools=tool_names,<br>                        output_type=output_type_name,<br>                    )<br>                    current_span.start(mark_as_current=True)<br>                current_turn += 1<br>                if current_turn > max_turns:<br>                    _error_tracing.attach_error_to_span(<br>                        current_span,<br>                        SpanError(<br>                            message="Max turns exceeded",<br>                            data={"max_turns": max_turns},<br>                        ),<br>                    )<br>                    raise MaxTurnsExceeded(f"Max turns ({max_turns}) exceeded")<br>                logger.debug(<br>                    f"Running agent {current_agent.name} (turn {current_turn})",<br>                )<br>                if current_turn == 1:<br>                    input_guardrail_results, turn_result = await asyncio.gather(<br>                        cls._run_input_guardrails(<br>                            starting_agent,<br>                            starting_agent.input_guardrails<br>                            + (run_config.input_guardrails or []),<br>                            copy.deepcopy(input),<br>                            context_wrapper,<br>                        ),<br>                        cls._run_single_turn(<br>                            agent=current_agent,<br>                            original_input=original_input,<br>                            generated_items=generated_items,<br>                            hooks=hooks,<br>                            context_wrapper=context_wrapper,<br>                            run_config=run_config,<br>                            should_run_agent_start_hooks=should_run_agent_start_hooks,<br>                        ),<br>                    )<br>                else:<br>                    turn_result = await cls._run_single_turn(<br>                        agent=current_agent,<br>                        original_input=original_input,<br>                        generated_items=generated_items,<br>                        hooks=hooks,<br>                        context_wrapper=context_wrapper,<br>                        run_config=run_config,<br>                        should_run_agent_start_hooks=should_run_agent_start_hooks,<br>                    )<br>                should_run_agent_start_hooks = False<br>                model_responses.append(turn_result.model_response)<br>                original_input = turn_result.original_input<br>                generated_items = turn_result.generated_items<br>                if isinstance(turn_result.next_step, NextStepFinalOutput):<br>                    output_guardrail_results = await cls._run_output_guardrails(<br>                        current_agent.output_guardrails + (run_config.output_guardrails or []),<br>                        current_agent,<br>                        turn_result.next_step.output,<br>                        context_wrapper,<br>                    )<br>                    return RunResult(<br>                        input=original_input,<br>                        new_items=generated_items,<br>                        raw_responses=model_responses,<br>                        final_output=turn_result.next_step.output,<br>_last_agent=current_agent,<br>                        input_guardrail_results=input_guardrail_results,<br>                        output_guardrail_results=output_guardrail_results,<br>                    )<br>                elif isinstance(turn_result.next_step, NextStepHandoff):<br>                    current_agent = cast(Agent[TContext], turn_result.next_step.new_agent)<br>                    current_span.finish(reset_current=True)<br>                    current_span = None<br>                    should_run_agent_start_hooks = True<br>                elif isinstance(turn_result.next_step, NextStepRunAgain):<br>                    pass<br>                else:<br>                    raise AgentsException(<br>                        f"Unknown next step type: {type(turn_result.next_step)}"<br>                    )<br>        finally:<br>            if current_span:<br>                current_span.finish(reset_current=True)<br>``` |

#### run\_sync`classmethod`

```md-code__content
run_sync(
    starting_agent: Agent[TContext],
    input: str | list[TResponseInputItem],
    *,
    context: TContext | None = None,
    max_turns: int = DEFAULT_MAX_TURNS,
    hooks: RunHooks[TContext] | None = None,
    run_config: RunConfig | None = None,
) -> RunResult

```

Run a workflow synchronously, starting at the given agent. Note that this just wraps the
`run` method, so it will not work if there's already an event loop (e.g. inside an async
function, or in a Jupyter notebook or async context like FastAPI). For those cases, use
the `run` method instead.

The agent will run in a loop until a final output is generated. The loop runs like so:
1\. The agent is invoked with the given input.
2\. If there is a final output (i.e. the agent produces something of type
`agent.output_type`, the loop terminates.
3\. If there's a handoff, we run the loop again, with the new agent.
4\. Else, we run tool calls (if any), and re-run the loop.

In two cases, the agent may raise an exception:
1\. If the max\_turns is exceeded, a MaxTurnsExceeded exception is raised.
2\. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.

Note that only the first agent's input guardrails are run.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `starting_agent` | `Agent[TContext]` | The starting agent to run. | _required_ |
| `input` | `str | list[TResponseInputItem]` | The initial input to the agent. You can pass a single string for a user message,<br>or a list of input items. | _required_ |
| `context` | `TContext | None` | The context to run the agent with. | `None` |
| `max_turns` | `int` | The maximum number of turns to run the agent for. A turn is defined as one<br>AI invocation (including any tool calls that might occur). | `DEFAULT_MAX_TURNS` |
| `hooks` | `RunHooks[TContext] | None` | An object that receives callbacks on various lifecycle events. | `None` |
| `run_config` | `RunConfig | None` | Global settings for the entire agent run. | `None` |

Returns:

| Type | Description |
| --- | --- |
| `RunResult` | A run result containing all the inputs, guardrail results and the output of the last |
| `RunResult` | agent. Agents may perform handoffs, so we don't know the specific type of the output. |

Source code in `src/agents/run.py`

|     |     |
| --- | --- |
| ```<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>321<br>322<br>323<br>324<br>325<br>326<br>327<br>``` | ```md-code__content<br>@classmethod<br>def run_sync(<br>    cls,<br>    starting_agent: Agent[TContext],<br>    input: str | list[TResponseInputItem],<br>    *,<br>    context: TContext | None = None,<br>    max_turns: int = DEFAULT_MAX_TURNS,<br>    hooks: RunHooks[TContext] | None = None,<br>    run_config: RunConfig | None = None,<br>) -> RunResult:<br>    """Run a workflow synchronously, starting at the given agent. Note that this just wraps the<br>    `run` method, so it will not work if there's already an event loop (e.g. inside an async<br>    function, or in a Jupyter notebook or async context like FastAPI). For those cases, use<br>    the `run` method instead.<br>    The agent will run in a loop until a final output is generated. The loop runs like so:<br>    1. The agent is invoked with the given input.<br>    2. If there is a final output (i.e. the agent produces something of type<br>        `agent.output_type`, the loop terminates.<br>    3. If there's a handoff, we run the loop again, with the new agent.<br>    4. Else, we run tool calls (if any), and re-run the loop.<br>    In two cases, the agent may raise an exception:<br>    1. If the max_turns is exceeded, a MaxTurnsExceeded exception is raised.<br>    2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.<br>    Note that only the first agent's input guardrails are run.<br>    Args:<br>        starting_agent: The starting agent to run.<br>        input: The initial input to the agent. You can pass a single string for a user message,<br>            or a list of input items.<br>        context: The context to run the agent with.<br>        max_turns: The maximum number of turns to run the agent for. A turn is defined as one<br>            AI invocation (including any tool calls that might occur).<br>        hooks: An object that receives callbacks on various lifecycle events.<br>        run_config: Global settings for the entire agent run.<br>    Returns:<br>        A run result containing all the inputs, guardrail results and the output of the last<br>        agent. Agents may perform handoffs, so we don't know the specific type of the output.<br>    """<br>    return asyncio.get_event_loop().run_until_complete(<br>        cls.run(<br>            starting_agent,<br>            input,<br>            context=context,<br>            max_turns=max_turns,<br>            hooks=hooks,<br>            run_config=run_config,<br>        )<br>    )<br>``` |

#### run\_streamed`classmethod`

```md-code__content
run_streamed(
    starting_agent: Agent[TContext],
    input: str | list[TResponseInputItem],
    context: TContext | None = None,
    max_turns: int = DEFAULT_MAX_TURNS,
    hooks: RunHooks[TContext] | None = None,
    run_config: RunConfig | None = None,
) -> RunResultStreaming

```

Run a workflow starting at the given agent in streaming mode. The returned result object
contains a method you can use to stream semantic events as they are generated.

The agent will run in a loop until a final output is generated. The loop runs like so:
1\. The agent is invoked with the given input.
2\. If there is a final output (i.e. the agent produces something of type
`agent.output_type`, the loop terminates.
3\. If there's a handoff, we run the loop again, with the new agent.
4\. Else, we run tool calls (if any), and re-run the loop.

In two cases, the agent may raise an exception:
1\. If the max\_turns is exceeded, a MaxTurnsExceeded exception is raised.
2\. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.

Note that only the first agent's input guardrails are run.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `starting_agent` | `Agent[TContext]` | The starting agent to run. | _required_ |
| `input` | `str | list[TResponseInputItem]` | The initial input to the agent. You can pass a single string for a user message,<br>or a list of input items. | _required_ |
| `context` | `TContext | None` | The context to run the agent with. | `None` |
| `max_turns` | `int` | The maximum number of turns to run the agent for. A turn is defined as one<br>AI invocation (including any tool calls that might occur). | `DEFAULT_MAX_TURNS` |
| `hooks` | `RunHooks[TContext] | None` | An object that receives callbacks on various lifecycle events. | `None` |
| `run_config` | `RunConfig | None` | Global settings for the entire agent run. | `None` |

Returns:

| Type | Description |
| --- | --- |
| `RunResultStreaming` | A result object that contains data about the run, as well as a method to stream events. |

Source code in `src/agents/run.py`

|     |     |
| --- | --- |
| ```<br>329<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>345<br>346<br>347<br>348<br>349<br>350<br>351<br>352<br>353<br>354<br>355<br>356<br>357<br>358<br>359<br>360<br>361<br>362<br>363<br>364<br>365<br>366<br>367<br>368<br>369<br>370<br>371<br>372<br>373<br>374<br>375<br>376<br>377<br>378<br>379<br>380<br>381<br>382<br>383<br>384<br>385<br>386<br>387<br>388<br>389<br>390<br>391<br>392<br>393<br>394<br>395<br>396<br>397<br>398<br>399<br>400<br>401<br>402<br>403<br>404<br>405<br>406<br>407<br>408<br>409<br>410<br>411<br>412<br>413<br>414<br>415<br>416<br>417<br>418<br>419<br>420<br>421<br>422<br>423<br>424<br>``` | ```md-code__content<br>@classmethod<br>def run_streamed(<br>    cls,<br>    starting_agent: Agent[TContext],<br>    input: str | list[TResponseInputItem],<br>    context: TContext | None = None,<br>    max_turns: int = DEFAULT_MAX_TURNS,<br>    hooks: RunHooks[TContext] | None = None,<br>    run_config: RunConfig | None = None,<br>) -> RunResultStreaming:<br>    """Run a workflow starting at the given agent in streaming mode. The returned result object<br>    contains a method you can use to stream semantic events as they are generated.<br>    The agent will run in a loop until a final output is generated. The loop runs like so:<br>    1. The agent is invoked with the given input.<br>    2. If there is a final output (i.e. the agent produces something of type<br>        `agent.output_type`, the loop terminates.<br>    3. If there's a handoff, we run the loop again, with the new agent.<br>    4. Else, we run tool calls (if any), and re-run the loop.<br>    In two cases, the agent may raise an exception:<br>    1. If the max_turns is exceeded, a MaxTurnsExceeded exception is raised.<br>    2. If a guardrail tripwire is triggered, a GuardrailTripwireTriggered exception is raised.<br>    Note that only the first agent's input guardrails are run.<br>    Args:<br>        starting_agent: The starting agent to run.<br>        input: The initial input to the agent. You can pass a single string for a user message,<br>            or a list of input items.<br>        context: The context to run the agent with.<br>        max_turns: The maximum number of turns to run the agent for. A turn is defined as one<br>            AI invocation (including any tool calls that might occur).<br>        hooks: An object that receives callbacks on various lifecycle events.<br>        run_config: Global settings for the entire agent run.<br>    Returns:<br>        A result object that contains data about the run, as well as a method to stream events.<br>    """<br>    if hooks is None:<br>        hooks = RunHooks[Any]()<br>    if run_config is None:<br>        run_config = RunConfig()<br>    # If there's already a trace, we don't create a new one. In addition, we can't end the<br>    # trace here, because the actual work is done in `stream_events` and this method ends<br>    # before that.<br>    new_trace = (<br>        None<br>        if get_current_trace()<br>        else trace(<br>            workflow_name=run_config.workflow_name,<br>            trace_id=run_config.trace_id,<br>            group_id=run_config.group_id,<br>            metadata=run_config.trace_metadata,<br>            disabled=run_config.tracing_disabled,<br>        )<br>    )<br>    # Need to start the trace here, because the current trace contextvar is captured at<br>    # asyncio.create_task time<br>    if new_trace:<br>        new_trace.start(mark_as_current=True)<br>    output_schema = cls._get_output_schema(starting_agent)<br>    context_wrapper: RunContextWrapper[TContext] = RunContextWrapper(<br>        context=context  # type: ignore<br>    )<br>    streamed_result = RunResultStreaming(<br>        input=copy.deepcopy(input),<br>        new_items=[],<br>        current_agent=starting_agent,<br>        raw_responses=[],<br>        final_output=None,<br>        is_complete=False,<br>        current_turn=0,<br>        max_turns=max_turns,<br>        input_guardrail_results=[],<br>        output_guardrail_results=[],<br>_current_agent_output_schema=output_schema,<br>        _trace=new_trace,<br>    )<br>    # Kick off the actual agent loop in the background and return the streamed result object.<br>    streamed_result._run_impl_task = asyncio.create_task(<br>        cls._run_streamed_impl(<br>            starting_input=input,<br>            streamed_result=streamed_result,<br>            starting_agent=starting_agent,<br>            max_turns=max_turns,<br>            hooks=hooks,<br>            context_wrapper=context_wrapper,<br>            run_config=run_config,<br>        )<br>    )<br>    return streamed_result<br>``` |

### RunConfig`dataclass`

Configures settings for the entire agent run.

Source code in `src/agents/run.py`

|     |     |
| --- | --- |
| ```<br> 48<br> 49<br> 50<br> 51<br> 52<br> 53<br> 54<br> 55<br> 56<br> 57<br> 58<br> 59<br> 60<br> 61<br> 62<br> 63<br> 64<br> 65<br> 66<br> 67<br> 68<br> 69<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>``` | ```md-code__content<br>@dataclass<br>class RunConfig:<br>    """Configures settings for the entire agent run."""<br>    model: str | Model | None = None<br>    """The model to use for the entire agent run. If set, will override the model set on every<br>    agent. The model_provider passed in below must be able to resolve this model name.<br>    """<br>    model_provider: ModelProvider = field(default_factory=OpenAIProvider)<br>    """The model provider to use when looking up string model names. Defaults to OpenAI."""<br>    model_settings: ModelSettings | None = None<br>    """Configure global model settings. Any non-null values will override the agent-specific model<br>    settings.<br>    """<br>    handoff_input_filter: HandoffInputFilter | None = None<br>    """A global input filter to apply to all handoffs. If `Handoff.input_filter` is set, then that<br>    will take precedence. The input filter allows you to edit the inputs that are sent to the new<br>    agent. See the documentation in `Handoff.input_filter` for more details.<br>    """<br>    input_guardrails: list[InputGuardrail[Any]] | None = None<br>    """A list of input guardrails to run on the initial run input."""<br>    output_guardrails: list[OutputGuardrail[Any]] | None = None<br>    """A list of output guardrails to run on the final output of the run."""<br>    tracing_disabled: bool = False<br>    """Whether tracing is disabled for the agent run. If disabled, we will not trace the agent run.<br>    """<br>    trace_include_sensitive_data: bool = True<br>    """Whether we include potentially sensitive data (for example: inputs/outputs of tool calls or<br>    LLM generations) in traces. If False, we'll still create spans for these events, but the<br>    sensitive data will not be included.<br>    """<br>    workflow_name: str = "Agent workflow"<br>    """The name of the run, used for tracing. Should be a logical name for the run, like<br>    "Code generation workflow" or "Customer support agent".<br>    """<br>    trace_id: str | None = None<br>    """A custom trace ID to use for tracing. If not provided, we will generate a new trace ID."""<br>    group_id: str | None = None<br>    """<br>    A grouping identifier to use for tracing, to link multiple traces from the same conversation<br>    or process. For example, you might use a chat thread ID.<br>    """<br>    trace_metadata: dict[str, Any] | None = None<br>    """<br>    An optional dictionary of additional metadata to include with the trace.<br>    """<br>``` |

#### model`class-attribute``instance-attribute`

```md-code__content
model: str | Model | None = None

```

The model to use for the entire agent run. If set, will override the model set on every
agent. The model\_provider passed in below must be able to resolve this model name.

#### model\_provider`class-attribute``instance-attribute`

```md-code__content
model_provider: ModelProvider = field(
    default_factory=OpenAIProvider
)

```

The model provider to use when looking up string model names. Defaults to OpenAI.

#### model\_settings`class-attribute``instance-attribute`

```md-code__content
model_settings: ModelSettings | None = None

```

Configure global model settings. Any non-null values will override the agent-specific model
settings.

#### handoff\_input\_filter`class-attribute``instance-attribute`

```md-code__content
handoff_input_filter: HandoffInputFilter | None = None

```

A global input filter to apply to all handoffs. If `Handoff.input_filter` is set, then that
will take precedence. The input filter allows you to edit the inputs that are sent to the new
agent. See the documentation in `Handoff.input_filter` for more details.

#### input\_guardrails`class-attribute``instance-attribute`

```md-code__content
input_guardrails: list[InputGuardrail[Any]] | None = None

```

A list of input guardrails to run on the initial run input.

#### output\_guardrails`class-attribute``instance-attribute`

```md-code__content
output_guardrails: list[OutputGuardrail[Any]] | None = None

```

A list of output guardrails to run on the final output of the run.

#### tracing\_disabled`class-attribute``instance-attribute`

```md-code__content
tracing_disabled: bool = False

```

Whether tracing is disabled for the agent run. If disabled, we will not trace the agent run.

#### trace\_include\_sensitive\_data`class-attribute``instance-attribute`

```md-code__content
trace_include_sensitive_data: bool = True

```

Whether we include potentially sensitive data (for example: inputs/outputs of tool calls or
LLM generations) in traces. If False, we'll still create spans for these events, but the
sensitive data will not be included.

#### workflow\_name`class-attribute``instance-attribute`

```md-code__content
workflow_name: str = 'Agent workflow'

```

The name of the run, used for tracing. Should be a logical name for the run, like
"Code generation workflow" or "Customer support agent".

#### trace\_id`class-attribute``instance-attribute`

```md-code__content
trace_id: str | None = None

```

A custom trace ID to use for tracing. If not provided, we will generate a new trace ID.

#### group\_id`class-attribute``instance-attribute`

```md-code__content
group_id: str | None = None

```

A grouping identifier to use for tracing, to link multiple traces from the same conversation
or process. For example, you might use a chat thread ID.

#### trace\_metadata`class-attribute``instance-attribute`

```md-code__content
trace_metadata: dict[str, Any] | None = None

```

An optional dictionary of additional metadata to include with the trace.

## OpenAI SDK Item Types

[Skip to content](https://openai.github.io/openai-agents-python/ref/items/#items)

# `Items`

### TResponse`module-attribute`

```md-code__content
TResponse = Response

```

A type alias for the Response type from the OpenAI SDK.

### TResponseInputItem`module-attribute`

```md-code__content
TResponseInputItem = ResponseInputItemParam

```

A type alias for the ResponseInputItemParam type from the OpenAI SDK.

### TResponseOutputItem`module-attribute`

```md-code__content
TResponseOutputItem = ResponseOutputItem

```

A type alias for the ResponseOutputItem type from the OpenAI SDK.

### TResponseStreamEvent`module-attribute`

```md-code__content
TResponseStreamEvent = ResponseStreamEvent

```

A type alias for the ResponseStreamEvent type from the OpenAI SDK.

### ToolCallItemTypes`module-attribute`

```md-code__content
ToolCallItemTypes: TypeAlias = Union[\
    ResponseFunctionToolCall,\
    ResponseComputerToolCall,\
    ResponseFileSearchToolCall,\
    ResponseFunctionWebSearch,\
]

```

A type that represents a tool call item.

### RunItem`module-attribute`

```md-code__content
RunItem: TypeAlias = Union[\
    MessageOutputItem,\
    HandoffCallItem,\
    HandoffOutputItem,\
    ToolCallItem,\
    ToolCallOutputItem,\
    ReasoningItem,\
]

```

An item generated by an agent.

### RunItemBase`dataclass`

Bases: `Generic[T]`, `ABC`

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>@dataclass<br>class RunItemBase(Generic[T], abc.ABC):<br>    agent: Agent[Any]<br>    """The agent whose run caused this item to be generated."""<br>    raw_item: T<br>    """The raw Responses item from the run. This will always be a either an output item (i.e.<br>    `openai.types.responses.ResponseOutputItem` or an input item<br>    (i.e. `openai.types.responses.ResponseInputItemParam`).<br>    """<br>    def to_input_item(self) -> TResponseInputItem:<br>        """Converts this item into an input item suitable for passing to the model."""<br>        if isinstance(self.raw_item, dict):<br>            # We know that input items are dicts, so we can ignore the type error<br>            return self.raw_item  # type: ignore<br>        elif isinstance(self.raw_item, BaseModel):<br>            # All output items are Pydantic models that can be converted to input items.<br>            return self.raw_item.model_dump(exclude_unset=True)  # type: ignore<br>        else:<br>            raise AgentsException(f"Unexpected raw item type: {type(self.raw_item)}")<br>``` |

#### agent`instance-attribute`

```md-code__content
agent: Agent[Any]

```

The agent whose run caused this item to be generated.

#### raw\_item`instance-attribute`

```md-code__content
raw_item: T

```

The raw Responses item from the run. This will always be a either an output item (i.e.
`openai.types.responses.ResponseOutputItem` or an input item
(i.e. `openai.types.responses.ResponseInputItemParam`).

#### to\_input\_item

```md-code__content
to_input_item() -> TResponseInputItem

```

Converts this item into an input item suitable for passing to the model.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>def to_input_item(self) -> TResponseInputItem:<br>    """Converts this item into an input item suitable for passing to the model."""<br>    if isinstance(self.raw_item, dict):<br>        # We know that input items are dicts, so we can ignore the type error<br>        return self.raw_item  # type: ignore<br>    elif isinstance(self.raw_item, BaseModel):<br>        # All output items are Pydantic models that can be converted to input items.<br>        return self.raw_item.model_dump(exclude_unset=True)  # type: ignore<br>    else:<br>        raise AgentsException(f"Unexpected raw item type: {type(self.raw_item)}")<br>``` |

### MessageOutputItem`dataclass`

Bases: `RunItemBase[ResponseOutputMessage]`

Represents a message from the LLM.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>``` | ```md-code__content<br>@dataclass<br>class MessageOutputItem(RunItemBase[ResponseOutputMessage]):<br>    """Represents a message from the LLM."""<br>    raw_item: ResponseOutputMessage<br>    """The raw response output message."""<br>    type: Literal["message_output_item"] = "message_output_item"<br>``` |

#### raw\_item`instance-attribute`

```md-code__content
raw_item: ResponseOutputMessage

```

The raw response output message.

### HandoffCallItem`dataclass`

Bases: `RunItemBase[ResponseFunctionToolCall]`

Represents a tool call for a handoff from one agent to another.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>80<br>81<br>82<br>83<br>84<br>85<br>86<br>87<br>``` | ```md-code__content<br>@dataclass<br>class HandoffCallItem(RunItemBase[ResponseFunctionToolCall]):<br>    """Represents a tool call for a handoff from one agent to another."""<br>    raw_item: ResponseFunctionToolCall<br>    """The raw response function tool call that represents the handoff."""<br>    type: Literal["handoff_call_item"] = "handoff_call_item"<br>``` |

#### raw\_item`instance-attribute`

```md-code__content
raw_item: ResponseFunctionToolCall

```

The raw response function tool call that represents the handoff.

### HandoffOutputItem`dataclass`

Bases: `RunItemBase[TResponseInputItem]`

Represents the output of a handoff.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>``` | ```md-code__content<br>@dataclass<br>class HandoffOutputItem(RunItemBase[TResponseInputItem]):<br>    """Represents the output of a handoff."""<br>    raw_item: TResponseInputItem<br>    """The raw input item that represents the handoff taking place."""<br>    source_agent: Agent[Any]<br>    """The agent that made the handoff."""<br>    target_agent: Agent[Any]<br>    """The agent that is being handed off to."""<br>    type: Literal["handoff_output_item"] = "handoff_output_item"<br>``` |

#### raw\_item`instance-attribute`

```md-code__content
raw_item: TResponseInputItem

```

The raw input item that represents the handoff taking place.

#### source\_agent`instance-attribute`

```md-code__content
source_agent: Agent[Any]

```

The agent that made the handoff.

#### target\_agent`instance-attribute`

```md-code__content
target_agent: Agent[Any]

```

The agent that is being handed off to.

### ToolCallItem`dataclass`

Bases: `RunItemBase[ToolCallItemTypes]`

Represents a tool call e.g. a function call or computer action call.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>``` | ```md-code__content<br>@dataclass<br>class ToolCallItem(RunItemBase[ToolCallItemTypes]):<br>    """Represents a tool call e.g. a function call or computer action call."""<br>    raw_item: ToolCallItemTypes<br>    """The raw tool call item."""<br>    type: Literal["tool_call_item"] = "tool_call_item"<br>``` |

#### raw\_item`instance-attribute`

```md-code__content
raw_item: ToolCallItemTypes

```

The raw tool call item.

### ToolCallOutputItem`dataclass`

Bases: `RunItemBase[Union[FunctionCallOutput, ComputerCallOutput]]`

Represents the output of a tool call.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>``` | ```md-code__content<br>@dataclass<br>class ToolCallOutputItem(RunItemBase[Union[FunctionCallOutput, ComputerCallOutput]]):<br>    """Represents the output of a tool call."""<br>    raw_item: FunctionCallOutput | ComputerCallOutput<br>    """The raw item from the model."""<br>    output: str<br>    """The output of the tool call."""<br>    type: Literal["tool_call_output_item"] = "tool_call_output_item"<br>``` |

#### raw\_item`instance-attribute`

```md-code__content
raw_item: FunctionCallOutput | ComputerCallOutput

```

The raw item from the model.

#### output`instance-attribute`

```md-code__content
output: str

```

The output of the tool call.

### ReasoningItem`dataclass`

Bases: `RunItemBase[ResponseReasoningItem]`

Represents a reasoning item.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>``` | ```md-code__content<br>@dataclass<br>class ReasoningItem(RunItemBase[ResponseReasoningItem]):<br>    """Represents a reasoning item."""<br>    raw_item: ResponseReasoningItem<br>    """The raw reasoning item."""<br>    type: Literal["reasoning_item"] = "reasoning_item"<br>``` |

#### raw\_item`instance-attribute`

```md-code__content
raw_item: ResponseReasoningItem

```

The raw reasoning item.

### ModelResponse`dataclass`

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>``` | ```md-code__content<br>@dataclass<br>class ModelResponse:<br>    output: list[TResponseOutputItem]<br>    """A list of outputs (messages, tool calls, etc) generated by the model"""<br>    usage: Usage<br>    """The usage information for the response."""<br>    referenceable_id: str | None<br>    """An ID for the response which can be used to refer to the response in subsequent calls to the<br>    model. Not supported by all model providers.<br>    """<br>    def to_input_items(self) -> list[TResponseInputItem]:<br>        """Convert the output into a list of input items suitable for passing to the model."""<br>        # We happen to know that the shape of the Pydantic output items are the same as the<br>        # equivalent TypedDict input items, so we can just convert each one.<br>        # This is also tested via unit tests.<br>        return [it.model_dump(exclude_unset=True) for it in self.output]  # type: ignore<br>``` |

#### output`instance-attribute`

```md-code__content
output: list[TResponseOutputItem]

```

A list of outputs (messages, tool calls, etc) generated by the model

#### usage`instance-attribute`

```md-code__content
usage: Usage

```

The usage information for the response.

#### referenceable\_id`instance-attribute`

```md-code__content
referenceable_id: str | None

```

An ID for the response which can be used to refer to the response in subsequent calls to the
model. Not supported by all model providers.

#### to\_input\_items

```md-code__content
to_input_items() -> list[TResponseInputItem]

```

Convert the output into a list of input items suitable for passing to the model.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>172<br>173<br>174<br>175<br>176<br>177<br>``` | ```md-code__content<br>def to_input_items(self) -> list[TResponseInputItem]:<br>    """Convert the output into a list of input items suitable for passing to the model."""<br>    # We happen to know that the shape of the Pydantic output items are the same as the<br>    # equivalent TypedDict input items, so we can just convert each one.<br>    # This is also tested via unit tests.<br>    return [it.model_dump(exclude_unset=True) for it in self.output]  # type: ignore<br>``` |

### ItemHelpers

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>``` | ```md-code__content<br>class ItemHelpers:<br>    @classmethod<br>    def extract_last_content(cls, message: TResponseOutputItem) -> str:<br>        """Extracts the last text content or refusal from a message."""<br>        if not isinstance(message, ResponseOutputMessage):<br>            return ""<br>        last_content = message.content[-1]<br>        if isinstance(last_content, ResponseOutputText):<br>            return last_content.text<br>        elif isinstance(last_content, ResponseOutputRefusal):<br>            return last_content.refusal<br>        else:<br>            raise ModelBehaviorError(f"Unexpected content type: {type(last_content)}")<br>    @classmethod<br>    def extract_last_text(cls, message: TResponseOutputItem) -> str | None:<br>        """Extracts the last text content from a message, if any. Ignores refusals."""<br>        if isinstance(message, ResponseOutputMessage):<br>            last_content = message.content[-1]<br>            if isinstance(last_content, ResponseOutputText):<br>                return last_content.text<br>        return None<br>    @classmethod<br>    def input_to_new_input_list(<br>        cls, input: str | list[TResponseInputItem]<br>    ) -> list[TResponseInputItem]:<br>        """Converts a string or list of input items into a list of input items."""<br>        if isinstance(input, str):<br>            return [<br>                {<br>                    "content": input,<br>                    "role": "user",<br>                }<br>            ]<br>        return copy.deepcopy(input)<br>    @classmethod<br>    def text_message_outputs(cls, items: list[RunItem]) -> str:<br>        """Concatenates all the text content from a list of message output items."""<br>        text = ""<br>        for item in items:<br>            if isinstance(item, MessageOutputItem):<br>                text += cls.text_message_output(item)<br>        return text<br>    @classmethod<br>    def text_message_output(cls, message: MessageOutputItem) -> str:<br>        """Extracts all the text content from a single message output item."""<br>        text = ""<br>        for item in message.raw_item.content:<br>            if isinstance(item, ResponseOutputText):<br>                text += item.text<br>        return text<br>    @classmethod<br>    def tool_call_output_item(<br>        cls, tool_call: ResponseFunctionToolCall, output: str<br>    ) -> FunctionCallOutput:<br>        """Creates a tool call output item from a tool call and its output."""<br>        return {<br>            "call_id": tool_call.call_id,<br>            "output": output,<br>            "type": "function_call_output",<br>        }<br>``` |

#### extract\_last\_content`classmethod`

```md-code__content
extract_last_content(message: TResponseOutputItem) -> str

```

Extracts the last text content or refusal from a message.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>``` | ```md-code__content<br>@classmethod<br>def extract_last_content(cls, message: TResponseOutputItem) -> str:<br>    """Extracts the last text content or refusal from a message."""<br>    if not isinstance(message, ResponseOutputMessage):<br>        return ""<br>    last_content = message.content[-1]<br>    if isinstance(last_content, ResponseOutputText):<br>        return last_content.text<br>    elif isinstance(last_content, ResponseOutputRefusal):<br>        return last_content.refusal<br>    else:<br>        raise ModelBehaviorError(f"Unexpected content type: {type(last_content)}")<br>``` |

#### extract\_last\_text`classmethod`

```md-code__content
extract_last_text(
    message: TResponseOutputItem,
) -> str | None

```

Extracts the last text content from a message, if any. Ignores refusals.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>``` | ```md-code__content<br>@classmethod<br>def extract_last_text(cls, message: TResponseOutputItem) -> str | None:<br>    """Extracts the last text content from a message, if any. Ignores refusals."""<br>    if isinstance(message, ResponseOutputMessage):<br>        last_content = message.content[-1]<br>        if isinstance(last_content, ResponseOutputText):<br>            return last_content.text<br>    return None<br>``` |

#### input\_to\_new\_input\_list`classmethod`

```md-code__content
input_to_new_input_list(
    input: str | list[TResponseInputItem],
) -> list[TResponseInputItem]

```

Converts a string or list of input items into a list of input items.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>``` | ```md-code__content<br>@classmethod<br>def input_to_new_input_list(<br>    cls, input: str | list[TResponseInputItem]<br>) -> list[TResponseInputItem]:<br>    """Converts a string or list of input items into a list of input items."""<br>    if isinstance(input, str):<br>        return [<br>            {<br>                "content": input,<br>                "role": "user",<br>            }<br>        ]<br>    return copy.deepcopy(input)<br>``` |

#### text\_message\_outputs`classmethod`

```md-code__content
text_message_outputs(items: list[RunItem]) -> str

```

Concatenates all the text content from a list of message output items.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>``` | ```md-code__content<br>@classmethod<br>def text_message_outputs(cls, items: list[RunItem]) -> str:<br>    """Concatenates all the text content from a list of message output items."""<br>    text = ""<br>    for item in items:<br>        if isinstance(item, MessageOutputItem):<br>            text += cls.text_message_output(item)<br>    return text<br>``` |

#### text\_message\_output`classmethod`

```md-code__content
text_message_output(message: MessageOutputItem) -> str

```

Extracts all the text content from a single message output item.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>``` | ```md-code__content<br>@classmethod<br>def text_message_output(cls, message: MessageOutputItem) -> str:<br>    """Extracts all the text content from a single message output item."""<br>    text = ""<br>    for item in message.raw_item.content:<br>        if isinstance(item, ResponseOutputText):<br>            text += item.text<br>    return text<br>``` |

#### tool\_call\_output\_item`classmethod`

```md-code__content
tool_call_output_item(
    tool_call: ResponseFunctionToolCall, output: str
) -> FunctionCallOutput

```

Creates a tool call output item from a tool call and its output.

Source code in `src/agents/items.py`

|     |     |
| --- | --- |
| ```<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>``` | ```md-code__content<br>@classmethod<br>def tool_call_output_item(<br>    cls, tool_call: ResponseFunctionToolCall, output: str<br>) -> FunctionCallOutput:<br>    """Creates a tool call output item from a tool call and its output."""<br>    return {<br>        "call_id": tool_call.call_id,<br>        "output": output,<br>        "type": "function_call_output",<br>    }<br>``` |

## Model Settings Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/model_settings/#model-settings)

# `Model settings`

### ModelSettings`dataclass`

Settings to use when calling an LLM.

This class holds optional model configuration parameters (e.g. temperature,
top\_p, penalties, truncation, etc.).

Not all models/providers support all of these parameters, so please check the API documentation
for the specific model and provider you are using.

Source code in `src/agents/model_settings.py`

|     |     |
| --- | --- |
| ```<br> 7<br> 8<br> 9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>``` | ```md-code__content<br>@dataclass<br>class ModelSettings:<br>    """Settings to use when calling an LLM.<br>    This class holds optional model configuration parameters (e.g. temperature,<br>    top_p, penalties, truncation, etc.).<br>    Not all models/providers support all of these parameters, so please check the API documentation<br>    for the specific model and provider you are using.<br>    """<br>    temperature: float | None = None<br>    """The temperature to use when calling the model."""<br>    top_p: float | None = None<br>    """The top_p to use when calling the model."""<br>    frequency_penalty: float | None = None<br>    """The frequency penalty to use when calling the model."""<br>    presence_penalty: float | None = None<br>    """The presence penalty to use when calling the model."""<br>    tool_choice: Literal["auto", "required", "none"] | str | None = None<br>    """The tool choice to use when calling the model."""<br>    parallel_tool_calls: bool | None = False<br>    """Whether to use parallel tool calls when calling the model."""<br>    truncation: Literal["auto", "disabled"] | None = None<br>    """The truncation strategy to use when calling the model."""<br>    max_tokens: int | None = None<br>    """The maximum number of output tokens to generate."""<br>    def resolve(self, override: ModelSettings | None) -> ModelSettings:<br>        """Produce a new ModelSettings by overlaying any non-None values from the<br>        override on top of this instance."""<br>        if override is None:<br>            return self<br>        return ModelSettings(<br>            temperature=override.temperature or self.temperature,<br>            top_p=override.top_p or self.top_p,<br>            frequency_penalty=override.frequency_penalty or self.frequency_penalty,<br>            presence_penalty=override.presence_penalty or self.presence_penalty,<br>            tool_choice=override.tool_choice or self.tool_choice,<br>            parallel_tool_calls=override.parallel_tool_calls or self.parallel_tool_calls,<br>            truncation=override.truncation or self.truncation,<br>            max_tokens=override.max_tokens or self.max_tokens,<br>        )<br>``` |

#### temperature`class-attribute``instance-attribute`

```md-code__content
temperature: float | None = None

```

The temperature to use when calling the model.

#### top\_p`class-attribute``instance-attribute`

```md-code__content
top_p: float | None = None

```

The top\_p to use when calling the model.

#### frequency\_penalty`class-attribute``instance-attribute`

```md-code__content
frequency_penalty: float | None = None

```

The frequency penalty to use when calling the model.

#### presence\_penalty`class-attribute``instance-attribute`

```md-code__content
presence_penalty: float | None = None

```

The presence penalty to use when calling the model.

#### tool\_choice`class-attribute``instance-attribute`

```md-code__content
tool_choice: (
    Literal["auto", "required", "none"] | str | None
) = None

```

The tool choice to use when calling the model.

#### parallel\_tool\_calls`class-attribute``instance-attribute`

```md-code__content
parallel_tool_calls: bool | None = False

```

Whether to use parallel tool calls when calling the model.

#### truncation`class-attribute``instance-attribute`

```md-code__content
truncation: Literal['auto', 'disabled'] | None = None

```

The truncation strategy to use when calling the model.

#### max\_tokens`class-attribute``instance-attribute`

```md-code__content
max_tokens: int | None = None

```

The maximum number of output tokens to generate.

#### resolve

```md-code__content
resolve(override: ModelSettings | None) -> ModelSettings

```

Produce a new ModelSettings by overlaying any non-None values from the
override on top of this instance.

Source code in `src/agents/model_settings.py`

|     |     |
| --- | --- |
| ```<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>``` | ```md-code__content<br>def resolve(self, override: ModelSettings | None) -> ModelSettings:<br>    """Produce a new ModelSettings by overlaying any non-None values from the<br>    override on top of this instance."""<br>    if override is None:<br>        return self<br>    return ModelSettings(<br>        temperature=override.temperature or self.temperature,<br>        top_p=override.top_p or self.top_p,<br>        frequency_penalty=override.frequency_penalty or self.frequency_penalty,<br>        presence_penalty=override.presence_penalty or self.presence_penalty,<br>        tool_choice=override.tool_choice or self.tool_choice,<br>        parallel_tool_calls=override.parallel_tool_calls or self.parallel_tool_calls,<br>        truncation=override.truncation or self.truncation,<br>        max_tokens=override.max_tokens or self.max_tokens,<br>    )<br>``` |

## OpenAI Agents Streaming Events

[Skip to content](https://openai.github.io/openai-agents-python/ref/stream_events/#streaming-events)

# `Streaming events`

### StreamEvent`module-attribute`

```md-code__content
StreamEvent: TypeAlias = Union[\
    RawResponsesStreamEvent,\
    RunItemStreamEvent,\
    AgentUpdatedStreamEvent,\
]

```

A streaming event from an agent.

### RawResponsesStreamEvent`dataclass`

Streaming event from the LLM. These are 'raw' events, i.e. they are directly passed through
from the LLM.

Source code in `src/agents/stream_events.py`

|     |     |
| --- | --- |
| ```<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>``` | ```md-code__content<br>@dataclass<br>class RawResponsesStreamEvent:<br>    """Streaming event from the LLM. These are 'raw' events, i.e. they are directly passed through<br>    from the LLM.<br>    """<br>    data: TResponseStreamEvent<br>    """The raw responses streaming event from the LLM."""<br>    type: Literal["raw_response_event"] = "raw_response_event"<br>    """The type of the event."""<br>``` |

#### data`instance-attribute`

```md-code__content
data: TResponseStreamEvent

```

The raw responses streaming event from the LLM.

#### type`class-attribute``instance-attribute`

```md-code__content
type: Literal['raw_response_event'] = 'raw_response_event'

```

The type of the event.

### RunItemStreamEvent`dataclass`

Streaming events that wrap a `RunItem`. As the agent processes the LLM response, it will
generate these events for new messages, tool calls, tool outputs, handoffs, etc.

Source code in `src/agents/stream_events.py`

|     |     |
| --- | --- |
| ```<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>``` | ```md-code__content<br>@dataclass<br>class RunItemStreamEvent:<br>    """Streaming events that wrap a `RunItem`. As the agent processes the LLM response, it will<br>    generate these events for new messages, tool calls, tool outputs, handoffs, etc.<br>    """<br>    name: Literal[<br>        "message_output_created",<br>        "handoff_requested",<br>        "handoff_occured",<br>        "tool_called",<br>        "tool_output",<br>        "reasoning_item_created",<br>    ]<br>    """The name of the event."""<br>    item: RunItem<br>    """The item that was created."""<br>    type: Literal["run_item_stream_event"] = "run_item_stream_event"<br>``` |

#### name`instance-attribute`

```md-code__content
name: Literal[\
    "message_output_created",\
    "handoff_requested",\
    "handoff_occured",\
    "tool_called",\
    "tool_output",\
    "reasoning_item_created",\
]

```

The name of the event.

#### item`instance-attribute`

```md-code__content
item: RunItem

```

The item that was created.

### AgentUpdatedStreamEvent`dataclass`

Event that notifies that there is a new agent running.

Source code in `src/agents/stream_events.py`

|     |     |
| --- | --- |
| ```<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>``` | ```md-code__content<br>@dataclass<br>class AgentUpdatedStreamEvent:<br>    """Event that notifies that there is a new agent running."""<br>    new_agent: Agent[Any]<br>    """The new agent."""<br>    type: Literal["agent_updated_stream_event"] = "agent_updated_stream_event"<br>``` |

#### new\_agent`instance-attribute`

```md-code__content
new_agent: Agent[Any]

```

The new agent.

## Usage dataclass overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/usage/#usage)

# `Usage`

### Usage`dataclass`

Source code in `src/agents/usage.py`

|     |     |
| --- | --- |
| ```<br> 4<br> 5<br> 6<br> 7<br> 8<br> 9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>``` | ```md-code__content<br>@dataclass<br>class Usage:<br>    requests: int = 0<br>    """Total requests made to the LLM API."""<br>    input_tokens: int = 0<br>    """Total input tokens sent, across all requests."""<br>    output_tokens: int = 0<br>    """Total output tokens received, across all requests."""<br>    total_tokens: int = 0<br>    """Total tokens sent and received, across all requests."""<br>    def add(self, other: "Usage") -> None:<br>        self.requests += other.requests if other.requests else 0<br>        self.input_tokens += other.input_tokens if other.input_tokens else 0<br>        self.output_tokens += other.output_tokens if other.output_tokens else 0<br>        self.total_tokens += other.total_tokens if other.total_tokens else 0<br>``` |

#### requests`class-attribute``instance-attribute`

```md-code__content
requests: int = 0

```

Total requests made to the LLM API.

#### input\_tokens`class-attribute``instance-attribute`

```md-code__content
input_tokens: int = 0

```

Total input tokens sent, across all requests.

#### output\_tokens`class-attribute``instance-attribute`

```md-code__content
output_tokens: int = 0

```

Total output tokens received, across all requests.

#### total\_tokens`class-attribute``instance-attribute`

```md-code__content
total_tokens: int = 0

```

Total tokens sent and received, across all requests.

## Run Context Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/run_context/#run-context)

# `Run context`

### RunContextWrapper`dataclass`

Bases: `Generic[TContext]`

This wraps the context object that you passed to `Runner.run()`. It also contains
information about the usage of the agent run so far.

NOTE: Contexts are not passed to the LLM. They're a way to pass dependencies and data to code
you implement, like tool functions, callbacks, hooks, etc.

Source code in `src/agents/run_context.py`

|     |     |
| --- | --- |
| ```<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>``` | ```md-code__content<br>@dataclass<br>class RunContextWrapper(Generic[TContext]):<br>    """This wraps the context object that you passed to `Runner.run()`. It also contains<br>    information about the usage of the agent run so far.<br>    NOTE: Contexts are not passed to the LLM. They're a way to pass dependencies and data to code<br>    you implement, like tool functions, callbacks, hooks, etc.<br>    """<br>    context: TContext<br>    """The context object (or None), passed by you to `Runner.run()`"""<br>    usage: Usage = field(default_factory=Usage)<br>    """The usage of the agent run so far. For streamed responses, the usage will be stale until the<br>    last chunk of the stream is processed.<br>    """<br>``` |

#### context`instance-attribute`

```md-code__content
context: TContext

```

The context object (or None), passed by you to `Runner.run()`

#### usage`class-attribute``instance-attribute`

```md-code__content
usage: Usage = field(default_factory=Usage)

```

The usage of the agent run so far. For streamed responses, the usage will be stale until the
last chunk of the stream is processed.

## Tracing Setup Guide

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/setup/#setup)

# `Setup`

### SynchronousMultiTracingProcessor

Bases: `TracingProcessor`

Forwards all calls to a list of TracingProcessors, in order of registration.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>``` | ```md-code__content<br>class SynchronousMultiTracingProcessor(TracingProcessor):<br>    """<br>    Forwards all calls to a list of TracingProcessors, in order of registration.<br>    """<br>    def __init__(self):<br>        # Using a tuple to avoid race conditions when iterating over processors<br>        self._processors: tuple[TracingProcessor, ...] = ()<br>        self._lock = threading.Lock()<br>    def add_tracing_processor(self, tracing_processor: TracingProcessor):<br>        """<br>        Add a processor to the list of processors. Each processor will receive all traces/spans.<br>        """<br>        with self._lock:<br>            self._processors += (tracing_processor,)<br>    def set_processors(self, processors: list[TracingProcessor]):<br>        """<br>        Set the list of processors. This will replace the current list of processors.<br>        """<br>        with self._lock:<br>            self._processors = tuple(processors)<br>    def on_trace_start(self, trace: Trace) -> None:<br>        """<br>        Called when a trace is started.<br>        """<br>        for processor in self._processors:<br>            processor.on_trace_start(trace)<br>    def on_trace_end(self, trace: Trace) -> None:<br>        """<br>        Called when a trace is finished.<br>        """<br>        for processor in self._processors:<br>            processor.on_trace_end(trace)<br>    def on_span_start(self, span: Span[Any]) -> None:<br>        """<br>        Called when a span is started.<br>        """<br>        for processor in self._processors:<br>            processor.on_span_start(span)<br>    def on_span_end(self, span: Span[Any]) -> None:<br>        """<br>        Called when a span is finished.<br>        """<br>        for processor in self._processors:<br>            processor.on_span_end(span)<br>    def shutdown(self) -> None:<br>        """<br>        Called when the application stops.<br>        """<br>        for processor in self._processors:<br>            logger.debug(f"Shutting down trace processor {processor}")<br>            processor.shutdown()<br>    def force_flush(self):<br>        """<br>        Force the processors to flush their buffers.<br>        """<br>        for processor in self._processors:<br>            processor.force_flush()<br>``` |

#### add\_tracing\_processor

```md-code__content
add_tracing_processor(tracing_processor: TracingProcessor)

```

Add a processor to the list of processors. Each processor will receive all traces/spans.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>25<br>26<br>27<br>28<br>29<br>30<br>``` | ```md-code__content<br>def add_tracing_processor(self, tracing_processor: TracingProcessor):<br>    """<br>    Add a processor to the list of processors. Each processor will receive all traces/spans.<br>    """<br>    with self._lock:<br>        self._processors += (tracing_processor,)<br>``` |

#### set\_processors

```md-code__content
set_processors(processors: list[TracingProcessor])

```

Set the list of processors. This will replace the current list of processors.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>32<br>33<br>34<br>35<br>36<br>37<br>``` | ```md-code__content<br>def set_processors(self, processors: list[TracingProcessor]):<br>    """<br>    Set the list of processors. This will replace the current list of processors.<br>    """<br>    with self._lock:<br>        self._processors = tuple(processors)<br>``` |

#### on\_trace\_start

```md-code__content
on_trace_start(trace: Trace) -> None

```

Called when a trace is started.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>39<br>40<br>41<br>42<br>43<br>44<br>``` | ```md-code__content<br>def on_trace_start(self, trace: Trace) -> None:<br>    """<br>    Called when a trace is started.<br>    """<br>    for processor in self._processors:<br>        processor.on_trace_start(trace)<br>``` |

#### on\_trace\_end

```md-code__content
on_trace_end(trace: Trace) -> None

```

Called when a trace is finished.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>46<br>47<br>48<br>49<br>50<br>51<br>``` | ```md-code__content<br>def on_trace_end(self, trace: Trace) -> None:<br>    """<br>    Called when a trace is finished.<br>    """<br>    for processor in self._processors:<br>        processor.on_trace_end(trace)<br>``` |

#### on\_span\_start

```md-code__content
on_span_start(span: Span[Any]) -> None

```

Called when a span is started.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>53<br>54<br>55<br>56<br>57<br>58<br>``` | ```md-code__content<br>def on_span_start(self, span: Span[Any]) -> None:<br>    """<br>    Called when a span is started.<br>    """<br>    for processor in self._processors:<br>        processor.on_span_start(span)<br>``` |

#### on\_span\_end

```md-code__content
on_span_end(span: Span[Any]) -> None

```

Called when a span is finished.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>60<br>61<br>62<br>63<br>64<br>65<br>``` | ```md-code__content<br>def on_span_end(self, span: Span[Any]) -> None:<br>    """<br>    Called when a span is finished.<br>    """<br>    for processor in self._processors:<br>        processor.on_span_end(span)<br>``` |

#### shutdown

```md-code__content
shutdown() -> None

```

Called when the application stops.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>``` | ```md-code__content<br>def shutdown(self) -> None:<br>    """<br>    Called when the application stops.<br>    """<br>    for processor in self._processors:<br>        logger.debug(f"Shutting down trace processor {processor}")<br>        processor.shutdown()<br>``` |

#### force\_flush

```md-code__content
force_flush()

```

Force the processors to flush their buffers.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>75<br>76<br>77<br>78<br>79<br>80<br>``` | ```md-code__content<br>def force_flush(self):<br>    """<br>    Force the processors to flush their buffers.<br>    """<br>    for processor in self._processors:<br>        processor.force_flush()<br>``` |

### TraceProvider

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>``` | ```md-code__content<br>class TraceProvider:<br>    def **init**(self):<br>        self._multi_processor = SynchronousMultiTracingProcessor()<br>        self._disabled = os.environ.get("OPENAI_AGENTS_DISABLE_TRACING", "false").lower() in (<br>            "true",<br>            "1",<br>        )<br>    def register_processor(self, processor: TracingProcessor):<br>        """<br>        Add a processor to the list of processors. Each processor will receive all traces/spans.<br>        """<br>        self._multi_processor.add_tracing_processor(processor)<br>    def set_processors(self, processors: list[TracingProcessor]):<br>        """<br>        Set the list of processors. This will replace the current list of processors.<br>        """<br>        self._multi_processor.set_processors(processors)<br>    def get_current_trace(self) -> Trace | None:<br>        """<br>        Returns the currently active trace, if any.<br>        """<br>        return Scope.get_current_trace()<br>    def get_current_span(self) -> Span[Any] | None:<br>        """<br>        Returns the currently active span, if any.<br>        """<br>        return Scope.get_current_span()<br>    def set_disabled(self, disabled: bool) -> None:<br>        """<br>        Set whether tracing is disabled.<br>        """<br>        self._disabled = disabled<br>    def create_trace(<br>        self,<br>        name: str,<br>        trace_id: str | None = None,<br>        group_id: str | None = None,<br>        metadata: dict[str, Any] | None = None,<br>        disabled: bool = False,<br>    ) -> Trace:<br>        """<br>        Create a new trace.<br>        """<br>        if self._disabled or disabled:<br>            logger.debug(f"Tracing is disabled. Not creating trace {name}")<br>            return NoOpTrace()<br>        trace_id = trace_id or util.gen_trace_id()<br>        logger.debug(f"Creating trace {name} with id {trace_id}")<br>        return TraceImpl(<br>            name=name,<br>            trace_id=trace_id,<br>            group_id=group_id,<br>            metadata=metadata,<br>            processor=self._multi_processor,<br>        )<br>    def create_span(<br>        self,<br>        span_data: TSpanData,<br>        span_id: str | None = None,<br>        parent: Trace | Span[Any] | None = None,<br>        disabled: bool = False,<br>    ) -> Span[TSpanData]:<br>        """<br>        Create a new span.<br>        """<br>        if self._disabled or disabled:<br>            logger.debug(f"Tracing is disabled. Not creating span {span_data}")<br>            return NoOpSpan(span_data)<br>        if not parent:<br>            current_span = Scope.get_current_span()<br>            current_trace = Scope.get_current_trace()<br>            if current_trace is None:<br>                logger.error(<br>                    "No active trace. Make sure to start a trace with `trace()` first"<br>                    "Returning NoOpSpan."<br>                )<br>                return NoOpSpan(span_data)<br>            elif isinstance(current_trace, NoOpTrace) or isinstance(current_span, NoOpSpan):<br>                logger.debug(<br>                    f"Parent {current_span} or {current_trace} is no-op, returning NoOpSpan"<br>                )<br>                return NoOpSpan(span_data)<br>            parent_id = current_span.span_id if current_span else None<br>            trace_id = current_trace.trace_id<br>        elif isinstance(parent, Trace):<br>            if isinstance(parent, NoOpTrace):<br>                logger.debug(f"Parent {parent} is no-op, returning NoOpSpan")<br>                return NoOpSpan(span_data)<br>            trace_id = parent.trace_id<br>            parent_id = None<br>        elif isinstance(parent, Span):<br>            if isinstance(parent, NoOpSpan):<br>                logger.debug(f"Parent {parent} is no-op, returning NoOpSpan")<br>                return NoOpSpan(span_data)<br>            parent_id = parent.span_id<br>            trace_id = parent.trace_id<br>        logger.debug(f"Creating span {span_data} with id {span_id}")<br>        return SpanImpl(<br>            trace_id=trace_id,<br>            span_id=span_id,<br>            parent_id=parent_id,<br>            processor=self._multi_processor,<br>            span_data=span_data,<br>        )<br>    def shutdown(self) -> None:<br>        try:<br>            logger.debug("Shutting down trace provider")<br>            self._multi_processor.shutdown()<br>        except Exception as e:<br>            logger.error(f"Error shutting down trace provider: {e}")<br>``` |

#### register\_processor

```md-code__content
register_processor(processor: TracingProcessor)

```

Add a processor to the list of processors. Each processor will receive all traces/spans.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>91<br>92<br>93<br>94<br>95<br>``` | ```md-code__content<br>def register_processor(self, processor: TracingProcessor):<br>    """<br>    Add a processor to the list of processors. Each processor will receive all traces/spans.<br>    """<br>    self._multi_processor.add_tracing_processor(processor)<br>``` |

#### set\_processors

```md-code__content
set_processors(processors: list[TracingProcessor])

```

Set the list of processors. This will replace the current list of processors.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br> 97<br> 98<br> 99<br>100<br>101<br>``` | ```md-code__content<br>def set_processors(self, processors: list[TracingProcessor]):<br>    """<br>    Set the list of processors. This will replace the current list of processors.<br>    """<br>    self._multi_processor.set_processors(processors)<br>``` |

#### get\_current\_trace

```md-code__content
get_current_trace() -> Trace | None

```

Returns the currently active trace, if any.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>103<br>104<br>105<br>106<br>107<br>``` | ```md-code__content<br>def get_current_trace(self) -> Trace | None:<br>    """<br>    Returns the currently active trace, if any.<br>    """<br>    return Scope.get_current_trace()<br>``` |

#### get\_current\_span

```md-code__content
get_current_span() -> Span[Any] | None

```

Returns the currently active span, if any.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>109<br>110<br>111<br>112<br>113<br>``` | ```md-code__content<br>def get_current_span(self) -> Span[Any] | None:<br>    """<br>    Returns the currently active span, if any.<br>    """<br>    return Scope.get_current_span()<br>``` |

#### set\_disabled

```md-code__content
set_disabled(disabled: bool) -> None

```

Set whether tracing is disabled.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>115<br>116<br>117<br>118<br>119<br>``` | ```md-code__content<br>def set_disabled(self, disabled: bool) -> None:<br>    """<br>    Set whether tracing is disabled.<br>    """<br>    self._disabled = disabled<br>``` |

#### create\_trace

```md-code__content
create_trace(
    name: str,
    trace_id: str | None = None,
    group_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    disabled: bool = False,
) -> Trace

```

Create a new trace.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>``` | ```md-code__content<br>def create_trace(<br>    self,<br>    name: str,<br>    trace_id: str | None = None,<br>    group_id: str | None = None,<br>    metadata: dict[str, Any] | None = None,<br>    disabled: bool = False,<br>) -> Trace:<br>    """<br>    Create a new trace.<br>    """<br>    if self._disabled or disabled:<br>        logger.debug(f"Tracing is disabled. Not creating trace {name}")<br>        return NoOpTrace()<br>    trace_id = trace_id or util.gen_trace_id()<br>    logger.debug(f"Creating trace {name} with id {trace_id}")<br>    return TraceImpl(<br>        name=name,<br>        trace_id=trace_id,<br>        group_id=group_id,<br>        metadata=metadata,<br>        processor=self._multi_processor,<br>    )<br>``` |

#### create\_span

```md-code__content
create_span(
    span_data: TSpanData,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[TSpanData]

```

Create a new span.

Source code in `src/agents/tracing/setup.py`

|     |     |
| --- | --- |
| ```<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>``` | ```md-code__content<br>def create_span(<br>    self,<br>    span_data: TSpanData,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[TSpanData]:<br>    """<br>    Create a new span.<br>    """<br>    if self._disabled or disabled:<br>        logger.debug(f"Tracing is disabled. Not creating span {span_data}")<br>        return NoOpSpan(span_data)<br>    if not parent:<br>        current_span = Scope.get_current_span()<br>        current_trace = Scope.get_current_trace()<br>        if current_trace is None:<br>            logger.error(<br>                "No active trace. Make sure to start a trace with `trace()` first"<br>                "Returning NoOpSpan."<br>            )<br>            return NoOpSpan(span_data)<br>        elif isinstance(current_trace, NoOpTrace) or isinstance(current_span, NoOpSpan):<br>            logger.debug(<br>                f"Parent {current_span} or {current_trace} is no-op, returning NoOpSpan"<br>            )<br>            return NoOpSpan(span_data)<br>        parent_id = current_span.span_id if current_span else None<br>        trace_id = current_trace.trace_id<br>    elif isinstance(parent, Trace):<br>        if isinstance(parent, NoOpTrace):<br>            logger.debug(f"Parent {parent} is no-op, returning NoOpSpan")<br>            return NoOpSpan(span_data)<br>        trace_id = parent.trace_id<br>        parent_id = None<br>    elif isinstance(parent, Span):<br>        if isinstance(parent, NoOpSpan):<br>            logger.debug(f"Parent {parent} is no-op, returning NoOpSpan")<br>            return NoOpSpan(span_data)<br>        parent_id = parent.span_id<br>        trace_id = parent.trace_id<br>    logger.debug(f"Creating span {span_data} with id {span_id}")<br>    return SpanImpl(<br>        trace_id=trace_id,<br>        span_id=span_id,<br>        parent_id=parent_id,<br>        processor=self._multi_processor,<br>        span_data=span_data,<br>    )<br>``` |

## Processor Interface

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/processor_interface/#processor-interface)

# `Processor interface`

### TracingProcessor

Bases: `ABC`

Interface for processing spans.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br> 9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>``` | ```md-code__content<br>class TracingProcessor(abc.ABC):<br>    """Interface for processing spans."""<br>    @abc.abstractmethod<br>    def on_trace_start(self, trace: "Trace") -> None:<br>        """Called when a trace is started.<br>        Args:<br>            trace: The trace that started.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def on_trace_end(self, trace: "Trace") -> None:<br>        """Called when a trace is finished.<br>        Args:<br>            trace: The trace that started.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def on_span_start(self, span: "Span[Any]") -> None:<br>        """Called when a span is started.<br>        Args:<br>            span: The span that started.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def on_span_end(self, span: "Span[Any]") -> None:<br>        """Called when a span is finished. Should not block or raise exceptions.<br>        Args:<br>            span: The span that finished.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def shutdown(self) -> None:<br>        """Called when the application stops."""<br>        pass<br>    @abc.abstractmethod<br>    def force_flush(self) -> None:<br>        """Forces an immediate flush of all queued spans/traces."""<br>        pass<br>``` |

#### on\_trace\_start`abstractmethod`

```md-code__content
on_trace_start(trace: Trace) -> None

```

Called when a trace is started.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `trace` | `Trace` | The trace that started. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_trace_start(self, trace: "Trace") -> None:<br>    """Called when a trace is started.<br>    Args:<br>        trace: The trace that started.<br>    """<br>    pass<br>``` |

#### on\_trace\_end`abstractmethod`

```md-code__content
on_trace_end(trace: Trace) -> None

```

Called when a trace is finished.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `trace` | `Trace` | The trace that started. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_trace_end(self, trace: "Trace") -> None:<br>    """Called when a trace is finished.<br>    Args:<br>        trace: The trace that started.<br>    """<br>    pass<br>``` |

#### on\_span\_start`abstractmethod`

```md-code__content
on_span_start(span: Span[Any]) -> None

```

Called when a span is started.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `span` | `Span[Any]` | The span that started. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_span_start(self, span: "Span[Any]") -> None:<br>    """Called when a span is started.<br>    Args:<br>        span: The span that started.<br>    """<br>    pass<br>``` |

#### on\_span\_end`abstractmethod`

```md-code__content
on_span_end(span: Span[Any]) -> None

```

Called when a span is finished. Should not block or raise exceptions.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `span` | `Span[Any]` | The span that finished. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def on_span_end(self, span: "Span[Any]") -> None:<br>    """Called when a span is finished. Should not block or raise exceptions.<br>    Args:<br>        span: The span that finished.<br>    """<br>    pass<br>``` |

#### shutdown`abstractmethod`

```md-code__content
shutdown() -> None

```

Called when the application stops.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>48<br>49<br>50<br>51<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def shutdown(self) -> None:<br>    """Called when the application stops."""<br>    pass<br>``` |

#### force\_flush`abstractmethod`

```md-code__content
force_flush() -> None

```

Forces an immediate flush of all queued spans/traces.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>53<br>54<br>55<br>56<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def force_flush(self) -> None:<br>    """Forces an immediate flush of all queued spans/traces."""<br>    pass<br>``` |

### TracingExporter

Bases: `ABC`

Exports traces and spans. For example, could log them or send them to a backend.

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>``` | ```md-code__content<br>class TracingExporter(abc.ABC):<br>    """Exports traces and spans. For example, could log them or send them to a backend."""<br>    @abc.abstractmethod<br>    def export(self, items: list["Trace | Span[Any]"]) -> None:<br>        """Exports a list of traces and spans.<br>        Args:<br>            items: The items to export.<br>        """<br>        pass<br>``` |

#### export`abstractmethod`

```md-code__content
export(items: list[Trace | Span[Any]]) -> None

```

Exports a list of traces and spans.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `items` | `list[Trace | Span[Any]]` | The items to export. | _required_ |

Source code in `src/agents/tracing/processor_interface.py`

|     |     |
| --- | --- |
| ```<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def export(self, items: list["Trace | Span[Any]"]) -> None:<br>    """Exports a list of traces and spans.<br>    Args:<br>        items: The items to export.<br>    """<br>    pass<br>``` |

## Creating Traces and Spans

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/create/#creating-tracesspans)

# `Creating traces/spans`

### trace

```md-code__content
trace(
    workflow_name: str,
    trace_id: str | None = None,
    group_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    disabled: bool = False,
) -> Trace

```

Create a new trace. The trace will not be started automatically; you should either use
it as a context manager ( `with trace(...):`) or call `trace.start()` \+ `trace.finish()`
manually.

In addition to the workflow name and optional grouping identifier, you can provide
an arbitrary metadata dictionary to attach additional user-defined information to
the trace.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `workflow_name` | `str` | The name of the logical app or workflow. For example, you might provide<br>"code\_bot" for a coding agent, or "customer\_support\_agent" for a customer support agent. | _required_ |
| `trace_id` | `str | None` | The ID of the trace. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_trace_id()` to generate a trace ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `group_id` | `str | None` | Optional grouping identifier to link multiple traces from the same conversation<br>or process. For instance, you might use a chat thread ID. | `None` |
| `metadata` | `dict[str, Any] | None` | Optional dictionary of additional metadata to attach to the trace. | `None` |
| `disabled` | `bool` | If True, we will return a Trace but the Trace will not be recorded. This will<br>not be checked if there's an existing trace and `even_if_trace_running` is True. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Trace` | The newly created trace object. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>def trace(<br>    workflow_name: str,<br>    trace_id: str | None = None,<br>    group_id: str | None = None,<br>    metadata: dict[str, Any] | None = None,<br>    disabled: bool = False,<br>) -> Trace:<br>    """<br>    Create a new trace. The trace will not be started automatically; you should either use<br>    it as a context manager (`with trace(...):`) or call `trace.start()` + `trace.finish()`<br>    manually.<br>    In addition to the workflow name and optional grouping identifier, you can provide<br>    an arbitrary metadata dictionary to attach additional user-defined information to<br>    the trace.<br>    Args:<br>        workflow_name: The name of the logical app or workflow. For example, you might provide<br>            "code_bot" for a coding agent, or "customer_support_agent" for a customer support agent.<br>        trace_id: The ID of the trace. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_trace_id()` to generate a trace ID, to guarantee that IDs are<br>            correctly formatted.<br>        group_id: Optional grouping identifier to link multiple traces from the same conversation<br>            or process. For instance, you might use a chat thread ID.<br>        metadata: Optional dictionary of additional metadata to attach to the trace.<br>        disabled: If True, we will return a Trace but the Trace will not be recorded. This will<br>            not be checked if there's an existing trace and `even_if_trace_running` is True.<br>    Returns:<br>        The newly created trace object.<br>    """<br>    current_trace = GLOBAL_TRACE_PROVIDER.get_current_trace()<br>    if current_trace:<br>        logger.warning(<br>            "Trace already exists. Creating a new trace, but this is probably a mistake."<br>        )<br>    return GLOBAL_TRACE_PROVIDER.create_trace(<br>        name=workflow_name,<br>        trace_id=trace_id,<br>        group_id=group_id,<br>        metadata=metadata,<br>        disabled=disabled,<br>    )<br>``` |

### get\_current\_trace

```md-code__content
get_current_trace() -> Trace | None

```

Returns the currently active trace, if present.

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>70<br>71<br>72<br>``` | ```md-code__content<br>def get_current_trace() -> Trace | None:<br>    """Returns the currently active trace, if present."""<br>    return GLOBAL_TRACE_PROVIDER.get_current_trace()<br>``` |

### get\_current\_span

```md-code__content
get_current_span() -> Span[Any] | None

```

Returns the currently active span, if present.

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>75<br>76<br>77<br>``` | ```md-code__content<br>def get_current_span() -> Span[Any] | None:<br>    """Returns the currently active span, if present."""<br>    return GLOBAL_TRACE_PROVIDER.get_current_span()<br>``` |

### agent\_span

```md-code__content
agent_span(
    name: str,
    handoffs: list[str] | None = None,
    tools: list[str] | None = None,
    output_type: str | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[AgentSpanData]

```

Create a new agent span. The span will not be started automatically, you should either do
`with agent_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the agent. | _required_ |
| `handoffs` | `list[str] | None` | Optional list of agent names to which this agent could hand off control. | `None` |
| `tools` | `list[str] | None` | Optional list of tool names available to this agent. | `None` |
| `output_type` | `str | None` | Optional name of the output type produced by the agent. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[AgentSpanData]` | The newly created agent span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>``` | ```md-code__content<br>def agent_span(<br>    name: str,<br>    handoffs: list[str] | None = None,<br>    tools: list[str] | None = None,<br>    output_type: str | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[AgentSpanData]:<br>    """Create a new agent span. The span will not be started automatically, you should either do<br>    `with agent_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the agent.<br>        handoffs: Optional list of agent names to which this agent could hand off control.<br>        tools: Optional list of tool names available to this agent.<br>        output_type: Optional name of the output type produced by the agent.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created agent span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=AgentSpanData(name=name, handoffs=handoffs, tools=tools, output_type=output_type),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### function\_span

```md-code__content
function_span(
    name: str,
    input: str | None = None,
    output: str | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[FunctionSpanData]

```

Create a new function span. The span will not be started automatically, you should either do
`with function_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the function. | _required_ |
| `input` | `str | None` | The input to the function. | `None` |
| `output` | `str | None` | The output of the function. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[FunctionSpanData]` | The newly created function span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>``` | ```md-code__content<br>def function_span(<br>    name: str,<br>    input: str | None = None,<br>    output: str | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[FunctionSpanData]:<br>    """Create a new function span. The span will not be started automatically, you should either do<br>    `with function_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the function.<br>        input: The input to the function.<br>        output: The output of the function.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created function span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=FunctionSpanData(name=name, input=input, output=output),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### generation\_span

```md-code__content
generation_span(
    input: Sequence[Mapping[str, Any]] | None = None,
    output: Sequence[Mapping[str, Any]] | None = None,
    model: str | None = None,
    model_config: Mapping[str, Any] | None = None,
    usage: dict[str, Any] | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[GenerationSpanData]

```

Create a new generation span. The span will not be started automatically, you should either
do `with generation_span() ...` or call `span.start()` \+ `span.finish()` manually.

This span captures the details of a model generation, including the
input message sequence, any generated outputs, the model name and
configuration, and usage data. If you only need to capture a model
response identifier, use `response_span()` instead.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `input` | `Sequence[Mapping[str, Any]] | None` | The sequence of input messages sent to the model. | `None` |
| `output` | `Sequence[Mapping[str, Any]] | None` | The sequence of output messages received from the model. | `None` |
| `model` | `str | None` | The model identifier used for the generation. | `None` |
| `model_config` | `Mapping[str, Any] | None` | The model configuration (hyperparameters) used. | `None` |
| `usage` | `dict[str, Any] | None` | A dictionary of usage information (input tokens, output tokens, etc.). | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[GenerationSpanData]` | The newly created generation span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>``` | ```md-code__content<br>def generation_span(<br>    input: Sequence[Mapping[str, Any]] | None = None,<br>    output: Sequence[Mapping[str, Any]] | None = None,<br>    model: str | None = None,<br>    model_config: Mapping[str, Any] | None = None,<br>    usage: dict[str, Any] | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[GenerationSpanData]:<br>    """Create a new generation span. The span will not be started automatically, you should either<br>    do `with generation_span() ...` or call `span.start()` + `span.finish()` manually.<br>    This span captures the details of a model generation, including the<br>    input message sequence, any generated outputs, the model name and<br>    configuration, and usage data. If you only need to capture a model<br>    response identifier, use `response_span()` instead.<br>    Args:<br>        input: The sequence of input messages sent to the model.<br>        output: The sequence of output messages received from the model.<br>        model: The model identifier used for the generation.<br>        model_config: The model configuration (hyperparameters) used.<br>        usage: A dictionary of usage information (input tokens, output tokens, etc.).<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created generation span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=GenerationSpanData(<br>            input=input, output=output, model=model, model_config=model_config, usage=usage<br>        ),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### response\_span

```md-code__content
response_span(
    response: Response | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[ResponseSpanData]

```

Create a new response span. The span will not be started automatically, you should either do
`with response_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `response` | `Response | None` | The OpenAI Response object. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>``` | ```md-code__content<br>def response_span(<br>    response: Response | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[ResponseSpanData]:<br>    """Create a new response span. The span will not be started automatically, you should either do<br>    `with response_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        response: The OpenAI Response object.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=ResponseSpanData(response=response),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### handoff\_span

```md-code__content
handoff_span(
    from_agent: str | None = None,
    to_agent: str | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[HandoffSpanData]

```

Create a new handoff span. The span will not be started automatically, you should either do
`with handoff_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `from_agent` | `str | None` | The name of the agent that is handing off. | `None` |
| `to_agent` | `str | None` | The name of the agent that is receiving the handoff. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[HandoffSpanData]` | The newly created handoff span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>``` | ```md-code__content<br>def handoff_span(<br>    from_agent: str | None = None,<br>    to_agent: str | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[HandoffSpanData]:<br>    """Create a new handoff span. The span will not be started automatically, you should either do<br>    `with handoff_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        from_agent: The name of the agent that is handing off.<br>        to_agent: The name of the agent that is receiving the handoff.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created handoff span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=HandoffSpanData(from_agent=from_agent, to_agent=to_agent),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### custom\_span

```md-code__content
custom_span(
    name: str,
    data: dict[str, Any] | None = None,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[CustomSpanData]

```

Create a new custom span, to which you can add your own metadata. The span will not be
started automatically, you should either do `with custom_span() ...` or call
`span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the custom span. | _required_ |
| `data` | `dict[str, Any] | None` | Arbitrary structured data to associate with the span. | `None` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Returns:

| Type | Description |
| --- | --- |
| `Span[CustomSpanData]` | The newly created custom span. |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>``` | ```md-code__content<br>def custom_span(<br>    name: str,<br>    data: dict[str, Any] | None = None,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[CustomSpanData]:<br>    """Create a new custom span, to which you can add your own metadata. The span will not be<br>    started automatically, you should either do `with custom_span() ...` or call<br>    `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the custom span.<br>        data: Arbitrary structured data to associate with the span.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    Returns:<br>        The newly created custom span.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=CustomSpanData(name=name, data=data or {}),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

### guardrail\_span

```md-code__content
guardrail_span(
    name: str,
    triggered: bool = False,
    span_id: str | None = None,
    parent: Trace | Span[Any] | None = None,
    disabled: bool = False,
) -> Span[GuardrailSpanData]

```

Create a new guardrail span. The span will not be started automatically, you should either
do `with guardrail_span() ...` or call `span.start()` \+ `span.finish()` manually.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `name` | `str` | The name of the guardrail. | _required_ |
| `triggered` | `bool` | Whether the guardrail was triggered. | `False` |
| `span_id` | `str | None` | The ID of the span. Optional. If not provided, we will generate an ID. We<br>recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>correctly formatted. | `None` |
| `parent` | `Trace | Span[Any] | None` | The parent span or trace. If not provided, we will automatically use the current<br>trace/span as the parent. | `None` |
| `disabled` | `bool` | If True, we will return a Span but the Span will not be recorded. | `False` |

Source code in `src/agents/tracing/create.py`

|     |     |
| --- | --- |
| ```<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>``` | ```md-code__content<br>def guardrail_span(<br>    name: str,<br>    triggered: bool = False,<br>    span_id: str | None = None,<br>    parent: Trace | Span[Any] | None = None,<br>    disabled: bool = False,<br>) -> Span[GuardrailSpanData]:<br>    """Create a new guardrail span. The span will not be started automatically, you should either<br>    do `with guardrail_span() ...` or call `span.start()` + `span.finish()` manually.<br>    Args:<br>        name: The name of the guardrail.<br>        triggered: Whether the guardrail was triggered.<br>        span_id: The ID of the span. Optional. If not provided, we will generate an ID. We<br>            recommend using `util.gen_span_id()` to generate a span ID, to guarantee that IDs are<br>            correctly formatted.<br>        parent: The parent span or trace. If not provided, we will automatically use the current<br>            trace/span as the parent.<br>        disabled: If True, we will return a Span but the Span will not be recorded.<br>    """<br>    return GLOBAL_TRACE_PROVIDER.create_span(<br>        span_data=GuardrailSpanData(name=name, triggered=triggered),<br>        span_id=span_id,<br>        parent=parent,<br>        disabled=disabled,<br>    )<br>``` |

## OpenAI Responses Model

[Skip to content](https://openai.github.io/openai-agents-python/ref/models/openai_responses/#openai-responses-model)

# `OpenAI Responses model`

### OpenAIResponsesModel

Bases: `Model`

Implementation of `Model` that uses the OpenAI Responses API.

Source code in `src/agents/models/openai_responses.py`

|     |     |
| --- | --- |
| ```<br> 47<br> 48<br> 49<br> 50<br> 51<br> 52<br> 53<br> 54<br> 55<br> 56<br> 57<br> 58<br> 59<br> 60<br> 61<br> 62<br> 63<br> 64<br> 65<br> 66<br> 67<br> 68<br> 69<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>``` | ```md-code__content<br>class OpenAIResponsesModel(Model):<br>    """<br>    Implementation of `Model` that uses the OpenAI Responses API.<br>    """<br>    def **init**(<br>        self,<br>        model: str | ChatModel,<br>        openai_client: AsyncOpenAI,<br>    ) -> None:<br>        self.model = model<br>        self._client = openai_client<br>    def_non_null_or_not_given(self, value: Any) -> Any:<br>        return value if value is not None else NOT_GIVEN<br>    async def get_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        tracing: ModelTracing,<br>    ) -> ModelResponse:<br>        with response_span(disabled=tracing.is_disabled()) as span_response:<br>            try:<br>                response = await self._fetch_response(<br>                    system_instructions,<br>                    input,<br>                    model_settings,<br>                    tools,<br>                    output_schema,<br>                    handoffs,<br>                    stream=False,<br>                )<br>                if _debug.DONT_LOG_MODEL_DATA:<br>                    logger.debug("LLM responsed")<br>                else:<br>                    logger.debug(<br>                        "LLM resp:\n"<br>                        f"{json.dumps([x.model_dump() for x in response.output], indent=2)}\n"<br>                    )<br>                usage = (<br>                    Usage(<br>                        requests=1,<br>                        input_tokens=response.usage.input_tokens,<br>                        output_tokens=response.usage.output_tokens,<br>                        total_tokens=response.usage.total_tokens,<br>                    )<br>                    if response.usage<br>                    else Usage()<br>                )<br>                if tracing.include_data():<br>                    span_response.span_data.response = response<br>                    span_response.span_data.input = input<br>            except Exception as e:<br>                span_response.set_error(<br>                    SpanError(<br>                        message="Error getting response",<br>                        data={<br>                            "error": str(e) if tracing.include_data() else e.**class**.**name**,<br>                        },<br>                    )<br>                )<br>                request_id = e.request_id if isinstance(e, APIStatusError) else None<br>                logger.error(f"Error getting response: {e}. (request_id: {request_id})")<br>                raise<br>        return ModelResponse(<br>            output=response.output,<br>            usage=usage,<br>            referenceable_id=response.id,<br>        )<br>    async def stream_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        tracing: ModelTracing,<br>    ) -> AsyncIterator[ResponseStreamEvent]:<br>        """<br>        Yields a partial message as it is generated, as well as the usage information.<br>        """<br>        with response_span(disabled=tracing.is_disabled()) as span_response:<br>            try:<br>                stream = await self._fetch_response(<br>                    system_instructions,<br>                    input,<br>                    model_settings,<br>                    tools,<br>                    output_schema,<br>                    handoffs,<br>                    stream=True,<br>                )<br>                final_response: Response | None = None<br>                async for chunk in stream:<br>                    if isinstance(chunk, ResponseCompletedEvent):<br>                        final_response = chunk.response<br>                    yield chunk<br>                if final_response and tracing.include_data():<br>                    span_response.span_data.response = final_response<br>                    span_response.span_data.input = input<br>            except Exception as e:<br>                span_response.set_error(<br>                    SpanError(<br>                        message="Error streaming response",<br>                        data={<br>                            "error": str(e) if tracing.include_data() else e.**class**.**name**,<br>                        },<br>                    )<br>                )<br>                logger.error(f"Error streaming response: {e}")<br>                raise<br>    @overload<br>    async def_fetch_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        stream: Literal[True],<br>    ) -> AsyncStream[ResponseStreamEvent]: ...<br>    @overload<br>    async def _fetch_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        stream: Literal[False],<br>    ) -> Response: ...<br>    async def _fetch_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        stream: Literal[True] | Literal[False] = False,<br>    ) -> Response | AsyncStream[ResponseStreamEvent]:<br>        list_input = ItemHelpers.input_to_new_input_list(input)<br>        parallel_tool_calls = (<br>            True if model_settings.parallel_tool_calls and tools and len(tools) > 0 else NOT_GIVEN<br>        )<br>        tool_choice = Converter.convert_tool_choice(model_settings.tool_choice)<br>        converted_tools = Converter.convert_tools(tools, handoffs)<br>        response_format = Converter.get_response_format(output_schema)<br>        if _debug.DONT_LOG_MODEL_DATA:<br>            logger.debug("Calling LLM")<br>        else:<br>            logger.debug(<br>                f"Calling LLM {self.model} with input:\n"<br>                f"{json.dumps(list_input, indent=2)}\n"<br>                f"Tools:\n{json.dumps(converted_tools.tools, indent=2)}\n"<br>                f"Stream: {stream}\n"<br>                f"Tool choice: {tool_choice}\n"<br>                f"Response format: {response_format}\n"<br>            )<br>        return await self._client.responses.create(<br>            instructions=self._non_null_or_not_given(system_instructions),<br>            model=self.model,<br>            input=list_input,<br>            include=converted_tools.includes,<br>            tools=converted_tools.tools,<br>            temperature=self._non_null_or_not_given(model_settings.temperature),<br>            top_p=self._non_null_or_not_given(model_settings.top_p),<br>            truncation=self._non_null_or_not_given(model_settings.truncation),<br>            max_output_tokens=self._non_null_or_not_given(model_settings.max_tokens),<br>            tool_choice=tool_choice,<br>            parallel_tool_calls=parallel_tool_calls,<br>            stream=stream,<br>            extra_headers=_HEADERS,<br>            text=response_format,<br>        )<br>    def _get_client(self) -> AsyncOpenAI:<br>        if self._client is None:<br>            self._client = AsyncOpenAI()<br>        return self._client<br>``` |

#### stream\_response`async`

```md-code__content
stream_response(
    system_instructions: str | None,
    input: str | list[TResponseInputItem],
    model_settings: ModelSettings,
    tools: list[Tool],
    output_schema: AgentOutputSchema | None,
    handoffs: list[Handoff],
    tracing: ModelTracing,
) -> AsyncIterator[ResponseStreamEvent]

```

Yields a partial message as it is generated, as well as the usage information.

Source code in `src/agents/models/openai_responses.py`

|     |     |
| --- | --- |
| ```<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>``` | ```md-code__content<br>async def stream_response(<br>    self,<br>    system_instructions: str | None,<br>    input: str | list[TResponseInputItem],<br>    model_settings: ModelSettings,<br>    tools: list[Tool],<br>    output_schema: AgentOutputSchema | None,<br>    handoffs: list[Handoff],<br>    tracing: ModelTracing,<br>) -> AsyncIterator[ResponseStreamEvent]:<br>    """<br>    Yields a partial message as it is generated, as well as the usage information.<br>    """<br>    with response_span(disabled=tracing.is_disabled()) as span_response:<br>        try:<br>            stream = await self._fetch_response(<br>                system_instructions,<br>                input,<br>                model_settings,<br>                tools,<br>                output_schema,<br>                handoffs,<br>                stream=True,<br>            )<br>            final_response: Response | None = None<br>            async for chunk in stream:<br>                if isinstance(chunk, ResponseCompletedEvent):<br>                    final_response = chunk.response<br>                yield chunk<br>            if final_response and tracing.include_data():<br>                span_response.span_data.response = final_response<br>                span_response.span_data.input = input<br>        except Exception as e:<br>            span_response.set_error(<br>                SpanError(<br>                    message="Error streaming response",<br>                    data={<br>                        "error": str(e) if tracing.include_data() else e.**class**.**name**,<br>                    },<br>                )<br>            )<br>            logger.error(f"Error streaming response: {e}")<br>            raise<br>``` |

### Converter

Source code in `src/agents/models/openai_responses.py`

|     |     |
| --- | --- |
| ```<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>321<br>322<br>323<br>324<br>325<br>326<br>327<br>328<br>329<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>345<br>346<br>347<br>348<br>349<br>350<br>351<br>352<br>353<br>354<br>355<br>356<br>357<br>358<br>359<br>360<br>361<br>362<br>363<br>364<br>365<br>366<br>367<br>368<br>369<br>370<br>371<br>372<br>373<br>374<br>375<br>376<br>377<br>378<br>379<br>380<br>381<br>382<br>383<br>384<br>385<br>386<br>``` | ```md-code__content<br>class Converter:<br>    @classmethod<br>    def convert_tool_choice(<br>        cls, tool_choice: Literal["auto", "required", "none"] | str | None<br>    ) -> response_create_params.ToolChoice | NotGiven:<br>        if tool_choice is None:<br>            return NOT_GIVEN<br>        elif tool_choice == "required":<br>            return "required"<br>        elif tool_choice == "auto":<br>            return "auto"<br>        elif tool_choice == "none":<br>            return "none"<br>        elif tool_choice == "file_search":<br>            return {<br>                "type": "file_search",<br>            }<br>        elif tool_choice == "web_search_preview":<br>            return {<br>                "type": "web_search_preview",<br>            }<br>        elif tool_choice == "computer_use_preview":<br>            return {<br>                "type": "computer_use_preview",<br>            }<br>        else:<br>            return {<br>                "type": "function",<br>                "name": tool_choice,<br>            }<br>    @classmethod<br>    def get_response_format(<br>        cls, output_schema: AgentOutputSchema | None<br>    ) -> ResponseTextConfigParam | NotGiven:<br>        if output_schema is None or output_schema.is_plain_text():<br>            return NOT_GIVEN<br>        else:<br>            return {<br>                "format": {<br>                    "type": "json_schema",<br>                    "name": "final_output",<br>                    "schema": output_schema.json_schema(),<br>                    "strict": output_schema.strict_json_schema,<br>                }<br>            }<br>    @classmethod<br>    def convert_tools(<br>        cls,<br>        tools: list[Tool],<br>        handoffs: list[Handoff[Any]],<br>    ) -> ConvertedTools:<br>        converted_tools: list[ToolParam] = []<br>        includes: list[IncludeLiteral] = []<br>        computer_tools = [tool for tool in tools if isinstance(tool, ComputerTool)]<br>        if len(computer_tools) > 1:<br>            raise UserError(f"You can only provide one computer tool. Got {len(computer_tools)}")<br>        for tool in tools:<br>            converted_tool, include = cls._convert_tool(tool)<br>            converted_tools.append(converted_tool)<br>            if include:<br>                includes.append(include)<br>        for handoff in handoffs:<br>            converted_tools.append(cls._convert_handoff_tool(handoff))<br>        return ConvertedTools(tools=converted_tools, includes=includes)<br>    @classmethod<br>    def_convert_tool(cls, tool: Tool) -> tuple[ToolParam, IncludeLiteral | None]:<br>        """Returns converted tool and includes"""<br>        if isinstance(tool, FunctionTool):<br>            converted_tool: ToolParam = {<br>                "name": tool.name,<br>                "parameters": tool.params_json_schema,<br>                "strict": tool.strict_json_schema,<br>                "type": "function",<br>                "description": tool.description,<br>            }<br>            includes: IncludeLiteral | None = None<br>        elif isinstance(tool, WebSearchTool):<br>            ws: WebSearchToolParam = {<br>                "type": "web_search_preview",<br>                "user_location": tool.user_location,<br>                "search_context_size": tool.search_context_size,<br>            }<br>            converted_tool = ws<br>            includes = None<br>        elif isinstance(tool, FileSearchTool):<br>            converted_tool = {<br>                "type": "file_search",<br>                "vector_store_ids": tool.vector_store_ids,<br>            }<br>            if tool.max_num_results:<br>                converted_tool["max_num_results"] = tool.max_num_results<br>            if tool.ranking_options:<br>                converted_tool["ranking_options"] = tool.ranking_options<br>            if tool.filters:<br>                converted_tool["filters"] = tool.filters<br>            includes = "file_search_call.results" if tool.include_search_results else None<br>        elif isinstance(tool, ComputerTool):<br>            converted_tool = {<br>                "type": "computer_use_preview",<br>                "environment": tool.computer.environment,<br>                "display_width": tool.computer.dimensions[0],<br>                "display_height": tool.computer.dimensions[1],<br>            }<br>            includes = None<br>        else:<br>            raise UserError(f"Unknown tool type: {type(tool)}, tool")<br>        return converted_tool, includes<br>    @classmethod<br>    def_convert_handoff_tool(cls, handoff: Handoff) -> ToolParam:<br>        return {<br>            "name": handoff.tool_name,<br>            "parameters": handoff.input_json_schema,<br>            "strict": handoff.strict_json_schema,<br>            "type": "function",<br>            "description": handoff.tool_description,<br>        }<br>``` |

#### \_convert\_tool`classmethod`

```md-code__content
_convert_tool(
    tool: Tool,
) -> tuple[ToolParam, IncludeLiteral | None]

```

Returns converted tool and includes

Source code in `src/agents/models/openai_responses.py`

|     |     |
| --- | --- |
| ```<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>345<br>346<br>347<br>348<br>349<br>350<br>351<br>352<br>353<br>354<br>355<br>356<br>357<br>358<br>359<br>360<br>361<br>362<br>363<br>364<br>365<br>366<br>367<br>368<br>369<br>370<br>371<br>372<br>373<br>374<br>375<br>376<br>``` | ```md-code__content<br>@classmethod<br>def _convert_tool(cls, tool: Tool) -> tuple[ToolParam, IncludeLiteral | None]:<br>    """Returns converted tool and includes"""<br>    if isinstance(tool, FunctionTool):<br>        converted_tool: ToolParam = {<br>            "name": tool.name,<br>            "parameters": tool.params_json_schema,<br>            "strict": tool.strict_json_schema,<br>            "type": "function",<br>            "description": tool.description,<br>        }<br>        includes: IncludeLiteral | None = None<br>    elif isinstance(tool, WebSearchTool):<br>        ws: WebSearchToolParam = {<br>            "type": "web_search_preview",<br>            "user_location": tool.user_location,<br>            "search_context_size": tool.search_context_size,<br>        }<br>        converted_tool = ws<br>        includes = None<br>    elif isinstance(tool, FileSearchTool):<br>        converted_tool = {<br>            "type": "file_search",<br>            "vector_store_ids": tool.vector_store_ids,<br>        }<br>        if tool.max_num_results:<br>            converted_tool["max_num_results"] = tool.max_num_results<br>        if tool.ranking_options:<br>            converted_tool["ranking_options"] = tool.ranking_options<br>        if tool.filters:<br>            converted_tool["filters"] = tool.filters<br>        includes = "file_search_call.results" if tool.include_search_results else None<br>    elif isinstance(tool, ComputerTool):<br>        converted_tool = {<br>            "type": "computer_use_preview",<br>            "environment": tool.computer.environment,<br>            "display_width": tool.computer.dimensions[0],<br>            "display_height": tool.computer.dimensions[1],<br>        }<br>        includes = None<br>    else:<br>        raise UserError(f"Unknown tool type: {type(tool)}, tool")<br>    return converted_tool, includes<br>``` |

## OpenAI Model Interface

[Skip to content](https://openai.github.io/openai-agents-python/ref/models/interface/#model-interface)

# `Model interface`

### ModelTracing

Bases: `Enum`

Source code in `src/agents/models/interface.py`

|     |     |
| --- | --- |
| ```<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>``` | ```md-code__content<br>class ModelTracing(enum.Enum):<br>    DISABLED = 0<br>    """Tracing is disabled entirely."""<br>    ENABLED = 1<br>    """Tracing is enabled, and all data is included."""<br>    ENABLED_WITHOUT_DATA = 2<br>    """Tracing is enabled, but inputs/outputs are not included."""<br>    def is_disabled(self) -> bool:<br>        return self == ModelTracing.DISABLED<br>    def include_data(self) -> bool:<br>        return self == ModelTracing.ENABLED<br>``` |

#### DISABLED`class-attribute``instance-attribute`

```md-code__content
DISABLED = 0

```

Tracing is disabled entirely.

#### ENABLED`class-attribute``instance-attribute`

```md-code__content
ENABLED = 1

```

Tracing is enabled, and all data is included.

#### ENABLED\_WITHOUT\_DATA`class-attribute``instance-attribute`

```md-code__content
ENABLED_WITHOUT_DATA = 2

```

Tracing is enabled, but inputs/outputs are not included.

### Model

Bases: `ABC`

The base interface for calling an LLM.

Source code in `src/agents/models/interface.py`

|     |     |
| --- | --- |
| ```<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>82<br>83<br>84<br>85<br>86<br>87<br>88<br>89<br>``` | ```md-code__content<br>class Model(abc.ABC):<br>    """The base interface for calling an LLM."""<br>    @abc.abstractmethod<br>    async def get_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        tracing: ModelTracing,<br>    ) -> ModelResponse:<br>        """Get a response from the model.<br>        Args:<br>            system_instructions: The system instructions to use.<br>            input: The input items to the model, in OpenAI Responses format.<br>            model_settings: The model settings to use.<br>            tools: The tools available to the model.<br>            output_schema: The output schema to use.<br>            handoffs: The handoffs available to the model.<br>            tracing: Tracing configuration.<br>        Returns:<br>            The full model response.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def stream_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        tracing: ModelTracing,<br>    ) -> AsyncIterator[TResponseStreamEvent]:<br>        """Stream a response from the model.<br>        Args:<br>            system_instructions: The system instructions to use.<br>            input: The input items to the model, in OpenAI Responses format.<br>            model_settings: The model settings to use.<br>            tools: The tools available to the model.<br>            output_schema: The output schema to use.<br>            handoffs: The handoffs available to the model.<br>            tracing: Tracing configuration.<br>        Returns:<br>            An iterator of response stream events, in OpenAI Responses format.<br>        """<br>        pass<br>``` |

#### get\_response`abstractmethod``async`

```md-code__content
get_response(
    system_instructions: str | None,
    input: str | list[TResponseInputItem],
    model_settings: ModelSettings,
    tools: list[Tool],
    output_schema: AgentOutputSchema | None,
    handoffs: list[Handoff],
    tracing: ModelTracing,
) -> ModelResponse

```

Get a response from the model.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `system_instructions` | `str | None` | The system instructions to use. | _required_ |
| `input` | `str | list[TResponseInputItem]` | The input items to the model, in OpenAI Responses format. | _required_ |
| `model_settings` | `ModelSettings` | The model settings to use. | _required_ |
| `tools` | `list[Tool]` | The tools available to the model. | _required_ |
| `output_schema` | `AgentOutputSchema | None` | The output schema to use. | _required_ |
| `handoffs` | `list[Handoff]` | The handoffs available to the model. | _required_ |
| `tracing` | `ModelTracing` | Tracing configuration. | _required_ |

Returns:

| Type | Description |
| --- | --- |
| `ModelResponse` | The full model response. |

Source code in `src/agents/models/interface.py`

|     |     |
| --- | --- |
| ```<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>``` | ```md-code__content<br>@abc.abstractmethod<br>async def get_response(<br>    self,<br>    system_instructions: str | None,<br>    input: str | list[TResponseInputItem],<br>    model_settings: ModelSettings,<br>    tools: list[Tool],<br>    output_schema: AgentOutputSchema | None,<br>    handoffs: list[Handoff],<br>    tracing: ModelTracing,<br>) -> ModelResponse:<br>    """Get a response from the model.<br>    Args:<br>        system_instructions: The system instructions to use.<br>        input: The input items to the model, in OpenAI Responses format.<br>        model_settings: The model settings to use.<br>        tools: The tools available to the model.<br>        output_schema: The output schema to use.<br>        handoffs: The handoffs available to the model.<br>        tracing: Tracing configuration.<br>    Returns:<br>        The full model response.<br>    """<br>    pass<br>``` |

#### stream\_response`abstractmethod`

```md-code__content
stream_response(
    system_instructions: str | None,
    input: str | list[TResponseInputItem],
    model_settings: ModelSettings,
    tools: list[Tool],
    output_schema: AgentOutputSchema | None,
    handoffs: list[Handoff],
    tracing: ModelTracing,
) -> AsyncIterator[TResponseStreamEvent]

```

Stream a response from the model.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `system_instructions` | `str | None` | The system instructions to use. | _required_ |
| `input` | `str | list[TResponseInputItem]` | The input items to the model, in OpenAI Responses format. | _required_ |
| `model_settings` | `ModelSettings` | The model settings to use. | _required_ |
| `tools` | `list[Tool]` | The tools available to the model. | _required_ |
| `output_schema` | `AgentOutputSchema | None` | The output schema to use. | _required_ |
| `handoffs` | `list[Handoff]` | The handoffs available to the model. | _required_ |
| `tracing` | `ModelTracing` | Tracing configuration. | _required_ |

Returns:

| Type | Description |
| --- | --- |
| `AsyncIterator[TResponseStreamEvent]` | An iterator of response stream events, in OpenAI Responses format. |

Source code in `src/agents/models/interface.py`

|     |     |
| --- | --- |
| ```<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>82<br>83<br>84<br>85<br>86<br>87<br>88<br>89<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def stream_response(<br>    self,<br>    system_instructions: str | None,<br>    input: str | list[TResponseInputItem],<br>    model_settings: ModelSettings,<br>    tools: list[Tool],<br>    output_schema: AgentOutputSchema | None,<br>    handoffs: list[Handoff],<br>    tracing: ModelTracing,<br>) -> AsyncIterator[TResponseStreamEvent]:<br>    """Stream a response from the model.<br>    Args:<br>        system_instructions: The system instructions to use.<br>        input: The input items to the model, in OpenAI Responses format.<br>        model_settings: The model settings to use.<br>        tools: The tools available to the model.<br>        output_schema: The output schema to use.<br>        handoffs: The handoffs available to the model.<br>        tracing: Tracing configuration.<br>    Returns:<br>        An iterator of response stream events, in OpenAI Responses format.<br>    """<br>    pass<br>``` |

### ModelProvider

Bases: `ABC`

The base interface for a model provider.

Model provider is responsible for looking up Models by name.

Source code in `src/agents/models/interface.py`

|     |     |
| --- | --- |
| ```<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>``` | ```md-code__content<br>class ModelProvider(abc.ABC):<br>    """The base interface for a model provider.<br>    Model provider is responsible for looking up Models by name.<br>    """<br>    @abc.abstractmethod<br>    def get_model(self, model_name: str | None) -> Model:<br>        """Get a model by name.<br>        Args:<br>            model_name: The name of the model to get.<br>        Returns:<br>            The model.<br>        """<br>``` |

#### get\_model`abstractmethod`

```md-code__content
get_model(model_name: str | None) -> Model

```

Get a model by name.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `model_name` | `str | None` | The name of the model to get. | _required_ |

Returns:

| Type | Description |
| --- | --- |
| `Model` | The model. |

Source code in `src/agents/models/interface.py`

|     |     |
| --- | --- |
| ```<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def get_model(self, model_name: str | None) -> Model:<br>    """Get a model by name.<br>    Args:<br>        model_name: The name of the model to get.<br>    Returns:<br>        The model.<br>    """<br>``` |

## Tracing Processors Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/processors/#processors)

# `Processors`

### ConsoleSpanExporter

Bases: `TracingExporter`

Prints the traces and spans to the console.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>``` | ```md-code__content<br>class ConsoleSpanExporter(TracingExporter):<br>    """Prints the traces and spans to the console."""<br>    def export(self, items: list[Trace | Span[Any]]) -> None:<br>        for item in items:<br>            if isinstance(item, Trace):<br>                print(f"[Exporter] Export trace_id={item.trace_id}, name={item.name}, ")<br>            else:<br>                print(f"[Exporter] Export span: {item.export()}")<br>``` |

### BackendSpanExporter

Bases: `TracingExporter`

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br> 29<br> 30<br> 31<br> 32<br> 33<br> 34<br> 35<br> 36<br> 37<br> 38<br> 39<br> 40<br> 41<br> 42<br> 43<br> 44<br> 45<br> 46<br> 47<br> 48<br> 49<br> 50<br> 51<br> 52<br> 53<br> 54<br> 55<br> 56<br> 57<br> 58<br> 59<br> 60<br> 61<br> 62<br> 63<br> 64<br> 65<br> 66<br> 67<br> 68<br> 69<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>``` | ```md-code__content<br>class BackendSpanExporter(TracingExporter):<br>    def **init**(<br>        self,<br>        api_key: str | None = None,<br>        organization: str | None = None,<br>        project: str | None = None,<br>        endpoint: str = "<https://api.openai.com/v1/traces/ingest>",<br>        max_retries: int = 3,<br>        base_delay: float = 1.0,<br>        max_delay: float = 30.0,<br>    ):<br>        """<br>        Args:<br>            api_key: The API key for the "Authorization" header. Defaults to<br>                `os.environ["OPENAI_API_KEY"]` if not provided.<br>            organization: The OpenAI organization to use. Defaults to<br>                `os.environ["OPENAI_ORG_ID"]` if not provided.<br>            project: The OpenAI project to use. Defaults to<br>                `os.environ["OPENAI_PROJECT_ID"]` if not provided.<br>            endpoint: The HTTP endpoint to which traces/spans are posted.<br>            max_retries: Maximum number of retries upon failures.<br>            base_delay: Base delay (in seconds) for the first backoff.<br>            max_delay: Maximum delay (in seconds) for backoff growth.<br>        """<br>        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")<br>        self.organization = organization or os.environ.get("OPENAI_ORG_ID")<br>        self.project = project or os.environ.get("OPENAI_PROJECT_ID")<br>        self.endpoint = endpoint<br>        self.max_retries = max_retries<br>        self.base_delay = base_delay<br>        self.max_delay = max_delay<br>        # Keep a client open for connection pooling across multiple export calls<br>        self._client = httpx.Client(timeout=httpx.Timeout(timeout=60, connect=5.0))<br>    def set_api_key(self, api_key: str):<br>        """Set the OpenAI API key for the exporter.<br>        Args:<br>            api_key: The OpenAI API key to use. This is the same key used by the OpenAI Python<br>                client.<br>        """<br>        self.api_key = api_key<br>    def export(self, items: list[Trace | Span[Any]]) -> None:<br>        if not items:<br>            return<br>        if not self.api_key:<br>            logger.warning("OPENAI_API_KEY is not set, skipping trace export")<br>            return<br>        data = [item.export() for item in items if item.export()]<br>        payload = {"data": data}<br>        headers = {<br>            "Authorization": f"Bearer {self.api_key}",<br>            "Content-Type": "application/json",<br>            "OpenAI-Beta": "traces=v1",<br>        }<br>        # Exponential backoff loop<br>        attempt = 0<br>        delay = self.base_delay<br>        while True:<br>            attempt += 1<br>            try:<br>                response = self._client.post(url=self.endpoint, headers=headers, json=payload)<br>                # If the response is successful, break out of the loop<br>                if response.status_code < 300:<br>                    logger.debug(f"Exported {len(items)} items")<br>                    return<br>                # If the response is a client error (4xx), we wont retry<br>                if 400 <= response.status_code < 500:<br>                    logger.error(f"Tracing client error {response.status_code}: {response.text}")<br>                    return<br>                # For 5xx or other unexpected codes, treat it as transient and retry<br>                logger.warning(f"Server error {response.status_code}, retrying.")<br>            except httpx.RequestError as exc:<br>                # Network or other I/O error, we'll retry<br>                logger.warning(f"Request failed: {exc}")<br>            # If we reach here, we need to retry or give up<br>            if attempt >= self.max_retries:<br>                logger.error("Max retries reached, giving up on this batch.")<br>                return<br>            # Exponential backoff + jitter<br>            sleep_time = delay + random.uniform(0, 0.1 *delay)  # 10% jitter<br>            time.sleep(sleep_time)<br>            delay = min(delay* 2, self.max_delay)<br>    def close(self):<br>        """Close the underlying HTTP client."""<br>        self._client.close()<br>``` |

#### \_\_init\_\_

```md-code__content
__init__(
    api_key: str | None = None,
    organization: str | None = None,
    project: str | None = None,
    endpoint: str = "https://api.openai.com/v1/traces/ingest",
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
)

```

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `api_key` | `str | None` | The API key for the "Authorization" header. Defaults to<br>`os.environ["OPENAI_API_KEY"]` if not provided. | `None` |
| `organization` | `str | None` | The OpenAI organization to use. Defaults to<br>`os.environ["OPENAI_ORG_ID"]` if not provided. | `None` |
| `project` | `str | None` | The OpenAI project to use. Defaults to<br>`os.environ["OPENAI_PROJECT_ID"]` if not provided. | `None` |
| `endpoint` | `str` | The HTTP endpoint to which traces/spans are posted. | `'https://api.openai.com/v1/traces/ingest'` |
| `max_retries` | `int` | Maximum number of retries upon failures. | `3` |
| `base_delay` | `float` | Base delay (in seconds) for the first backoff. | `1.0` |
| `max_delay` | `float` | Maximum delay (in seconds) for backoff growth. | `30.0` |

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>``` | ```md-code__content<br>def **init**(<br>    self,<br>    api_key: str | None = None,<br>    organization: str | None = None,<br>    project: str | None = None,<br>    endpoint: str = "<https://api.openai.com/v1/traces/ingest>",<br>    max_retries: int = 3,<br>    base_delay: float = 1.0,<br>    max_delay: float = 30.0,<br>):<br>    """<br>    Args:<br>        api_key: The API key for the "Authorization" header. Defaults to<br>            `os.environ["OPENAI_API_KEY"]` if not provided.<br>        organization: The OpenAI organization to use. Defaults to<br>            `os.environ["OPENAI_ORG_ID"]` if not provided.<br>        project: The OpenAI project to use. Defaults to<br>            `os.environ["OPENAI_PROJECT_ID"]` if not provided.<br>        endpoint: The HTTP endpoint to which traces/spans are posted.<br>        max_retries: Maximum number of retries upon failures.<br>        base_delay: Base delay (in seconds) for the first backoff.<br>        max_delay: Maximum delay (in seconds) for backoff growth.<br>    """<br>    self.api_key = api_key or os.environ.get("OPENAI_API_KEY")<br>    self.organization = organization or os.environ.get("OPENAI_ORG_ID")<br>    self.project = project or os.environ.get("OPENAI_PROJECT_ID")<br>    self.endpoint = endpoint<br>    self.max_retries = max_retries<br>    self.base_delay = base_delay<br>    self.max_delay = max_delay<br>    # Keep a client open for connection pooling across multiple export calls<br>    self._client = httpx.Client(timeout=httpx.Timeout(timeout=60, connect=5.0))<br>``` |

#### set\_api\_key

```md-code__content
set_api_key(api_key: str)

```

Set the OpenAI API key for the exporter.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `api_key` | `str` | The OpenAI API key to use. This is the same key used by the OpenAI Python<br>client. | _required_ |

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>``` | ```md-code__content<br>def set_api_key(self, api_key: str):<br>    """Set the OpenAI API key for the exporter.<br>    Args:<br>        api_key: The OpenAI API key to use. This is the same key used by the OpenAI Python<br>            client.<br>    """<br>    self.api_key = api_key<br>``` |

#### close

```md-code__content
close()

```

Close the underlying HTTP client.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>124<br>125<br>126<br>``` | ```md-code__content<br>def close(self):<br>    """Close the underlying HTTP client."""<br>    self._client.close()<br>``` |

### BatchTraceProcessor

Bases: `TracingProcessor`

Some implementation notes:
1\. Using Queue, which is thread-safe.
2\. Using a background thread to export spans, to minimize any performance issues.
3\. Spans are stored in memory until they are exported.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>``` | ```md-code__content<br>class BatchTraceProcessor(TracingProcessor):<br>    """Some implementation notes:<br>    1. Using Queue, which is thread-safe.<br>    2. Using a background thread to export spans, to minimize any performance issues.<br>    3. Spans are stored in memory until they are exported.<br>    """<br>    def **init**(<br>        self,<br>        exporter: TracingExporter,<br>        max_queue_size: int = 8192,<br>        max_batch_size: int = 128,<br>        schedule_delay: float = 5.0,<br>        export_trigger_ratio: float = 0.7,<br>    ):<br>        """<br>        Args:<br>            exporter: The exporter to use.<br>            max_queue_size: The maximum number of spans to store in the queue. After this, we will<br>                start dropping spans.<br>            max_batch_size: The maximum number of spans to export in a single batch.<br>            schedule_delay: The delay between checks for new spans to export.<br>            export_trigger_ratio: The ratio of the queue size at which we will trigger an export.<br>        """<br>        self._exporter = exporter<br>        self._queue: queue.Queue[Trace | Span[Any]] = queue.Queue(maxsize=max_queue_size)<br>        self._max_queue_size = max_queue_size<br>        self._max_batch_size = max_batch_size<br>        self._schedule_delay = schedule_delay<br>        self._shutdown_event = threading.Event()<br>        # The queue size threshold at which we export immediately.<br>        self._export_trigger_size = int(max_queue_size * export_trigger_ratio)<br>        # Track when we next _must_ perform a scheduled export<br>        self._next_export_time = time.time() + self._schedule_delay<br>        self._shutdown_event = threading.Event()<br>        self._worker_thread = threading.Thread(target=self._run, daemon=True)<br>        self._worker_thread.start()<br>    def on_trace_start(self, trace: Trace) -> None:<br>        try:<br>            self._queue.put_nowait(trace)<br>        except queue.Full:<br>            logger.warning("Queue is full, dropping trace.")<br>    def on_trace_end(self, trace: Trace) -> None:<br>        # We send traces via on_trace_start, so we don't need to do anything here.<br>        pass<br>    def on_span_start(self, span: Span[Any]) -> None:<br>        # We send spans via on_span_end, so we don't need to do anything here.<br>        pass<br>    def on_span_end(self, span: Span[Any]) -> None:<br>        try:<br>            self._queue.put_nowait(span)<br>        except queue.Full:<br>            logger.warning("Queue is full, dropping span.")<br>    def shutdown(self, timeout: float | None = None):<br>        """<br>        Called when the application stops. We signal our thread to stop, then join it.<br>        """<br>        self._shutdown_event.set()<br>        self._worker_thread.join(timeout=timeout)<br>    def force_flush(self):<br>        """<br>        Forces an immediate flush of all queued spans.<br>        """<br>        self._export_batches(force=True)<br>    def_run(self):<br>        while not self._shutdown_event.is_set():<br>            current_time = time.time()<br>            queue_size = self._queue.qsize()<br>            # If it's time for a scheduled flush or queue is above the trigger threshold<br>            if current_time >= self._next_export_time or queue_size >= self._export_trigger_size:<br>                self._export_batches(force=False)<br>                # Reset the next scheduled flush time<br>                self._next_export_time = time.time() + self._schedule_delay<br>            else:<br>                # Sleep a short interval so we don't busy-wait.<br>                time.sleep(0.2)<br>        # Final drain after shutdown<br>        self._export_batches(force=True)<br>    def_export_batches(self, force: bool = False):<br>        """Drains the queue and exports in batches. If force=True, export everything.<br>        Otherwise, export up to `max_batch_size` repeatedly until the queue is empty or below a<br>        certain threshold.<br>        """<br>        while True:<br>            items_to_export: list[Span[Any] | Trace] = []<br>            # Gather a batch of spans up to max_batch_size<br>            while not self._queue.empty() and (<br>                force or len(items_to_export) < self._max_batch_size<br>            ):<br>                try:<br>                    items_to_export.append(self._queue.get_nowait())<br>                except queue.Empty:<br>                    # Another thread might have emptied the queue between checks<br>                    break<br>            # If we collected nothing, we're done<br>            if not items_to_export:<br>                break<br>            # Export the batch<br>            self._exporter.export(items_to_export)<br>``` |

#### \_\_init\_\_

```md-code__content
__init__(
    exporter: TracingExporter,
    max_queue_size: int = 8192,
    max_batch_size: int = 128,
    schedule_delay: float = 5.0,
    export_trigger_ratio: float = 0.7,
)

```

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `exporter` | `TracingExporter` | The exporter to use. | _required_ |
| `max_queue_size` | `int` | The maximum number of spans to store in the queue. After this, we will<br>start dropping spans. | `8192` |
| `max_batch_size` | `int` | The maximum number of spans to export in a single batch. | `128` |
| `schedule_delay` | `float` | The delay between checks for new spans to export. | `5.0` |
| `export_trigger_ratio` | `float` | The ratio of the queue size at which we will trigger an export. | `0.7` |

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>``` | ```md-code__content<br>def **init**(<br>    self,<br>    exporter: TracingExporter,<br>    max_queue_size: int = 8192,<br>    max_batch_size: int = 128,<br>    schedule_delay: float = 5.0,<br>    export_trigger_ratio: float = 0.7,<br>):<br>    """<br>    Args:<br>        exporter: The exporter to use.<br>        max_queue_size: The maximum number of spans to store in the queue. After this, we will<br>            start dropping spans.<br>        max_batch_size: The maximum number of spans to export in a single batch.<br>        schedule_delay: The delay between checks for new spans to export.<br>        export_trigger_ratio: The ratio of the queue size at which we will trigger an export.<br>    """<br>    self._exporter = exporter<br>    self._queue: queue.Queue[Trace | Span[Any]] = queue.Queue(maxsize=max_queue_size)<br>    self._max_queue_size = max_queue_size<br>    self._max_batch_size = max_batch_size<br>    self._schedule_delay = schedule_delay<br>    self._shutdown_event = threading.Event()<br>    # The queue size threshold at which we export immediately.<br>    self._export_trigger_size = int(max_queue_size * export_trigger_ratio)<br>    # Track when we next _must_ perform a scheduled export<br>    self._next_export_time = time.time() + self._schedule_delay<br>    self._shutdown_event = threading.Event()<br>    self._worker_thread = threading.Thread(target=self._run, daemon=True)<br>    self._worker_thread.start()<br>``` |

#### shutdown

```md-code__content
shutdown(timeout: float | None = None)

```

Called when the application stops. We signal our thread to stop, then join it.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>190<br>191<br>192<br>193<br>194<br>195<br>``` | ```md-code__content<br>def shutdown(self, timeout: float | None = None):<br>    """<br>    Called when the application stops. We signal our thread to stop, then join it.<br>    """<br>    self._shutdown_event.set()<br>    self._worker_thread.join(timeout=timeout)<br>``` |

#### force\_flush

```md-code__content
force_flush()

```

Forces an immediate flush of all queued spans.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>197<br>198<br>199<br>200<br>201<br>``` | ```md-code__content<br>def force_flush(self):<br>    """<br>    Forces an immediate flush of all queued spans.<br>    """<br>    self._export_batches(force=True)<br>``` |

#### \_export\_batches

```md-code__content
_export_batches(force: bool = False)

```

Drains the queue and exports in batches. If force=True, export everything.
Otherwise, export up to `max_batch_size` repeatedly until the queue is empty or below a
certain threshold.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>``` | ```md-code__content<br>def _export_batches(self, force: bool = False):<br>    """Drains the queue and exports in batches. If force=True, export everything.<br>    Otherwise, export up to `max_batch_size` repeatedly until the queue is empty or below a<br>    certain threshold.<br>    """<br>    while True:<br>        items_to_export: list[Span[Any] | Trace] = []<br>        # Gather a batch of spans up to max_batch_size<br>        while not self._queue.empty() and (<br>            force or len(items_to_export) < self._max_batch_size<br>        ):<br>            try:<br>                items_to_export.append(self._queue.get_nowait())<br>            except queue.Empty:<br>                # Another thread might have emptied the queue between checks<br>                break<br>        # If we collected nothing, we're done<br>        if not items_to_export:<br>            break<br>        # Export the batch<br>        self._exporter.export(items_to_export)<br>``` |

### default\_exporter

```md-code__content
default_exporter() -> BackendSpanExporter

```

The default exporter, which exports traces and spans to the backend in batches.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>251<br>252<br>253<br>``` | ```md-code__content<br>def default_exporter() -> BackendSpanExporter:<br>    """The default exporter, which exports traces and spans to the backend in batches."""<br>    return _global_exporter<br>``` |

### default\_processor

```md-code__content
default_processor() -> BatchTraceProcessor

```

The default processor, which exports traces and spans to the backend in batches.

Source code in `src/agents/tracing/processors.py`

|     |     |
| --- | --- |
| ```<br>256<br>257<br>258<br>``` | ```md-code__content<br>def default_processor() -> BatchTraceProcessor:<br>    """The default processor, which exports traces and spans to the backend in batches."""<br>    return _global_processor<br>``` |

## Tracing Workflows Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/traces/#traces)

# `Traces`

### Trace

A trace is the root level object that tracing creates. It represents a logical "workflow".

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>class Trace:<br>    """<br>    A trace is the root level object that tracing creates. It represents a logical "workflow".<br>    """<br>    @abc.abstractmethod<br>    def **enter**(self) -> Trace:<br>        pass<br>    @abc.abstractmethod<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        pass<br>    @abc.abstractmethod<br>    def start(self, mark_as_current: bool = False):<br>        """<br>        Start the trace.<br>        Args:<br>            mark_as_current: If true, the trace will be marked as the current trace.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def finish(self, reset_current: bool = False):<br>        """<br>        Finish the trace.<br>        Args:<br>            reset_current: If true, the trace will be reset as the current trace.<br>        """<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def trace_id(self) -> str:<br>        """<br>        The trace ID.<br>        """<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def name(self) -> str:<br>        """<br>        The name of the workflow being traced.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def export(self) -> dict[str, Any] | None:<br>        """<br>        Export the trace as a dictionary.<br>        """<br>        pass<br>``` |

#### trace\_id`abstractmethod``property`

```md-code__content
trace_id: str

```

The trace ID.

#### name`abstractmethod``property`

```md-code__content
name: str

```

The name of the workflow being traced.

#### start`abstractmethod`

```md-code__content
start(mark_as_current: bool = False)

```

Start the trace.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `mark_as_current` | `bool` | If true, the trace will be marked as the current trace. | `False` |

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def start(self, mark_as_current: bool = False):<br>    """<br>    Start the trace.<br>    Args:<br>        mark_as_current: If true, the trace will be marked as the current trace.<br>    """<br>    pass<br>``` |

#### finish`abstractmethod`

```md-code__content
finish(reset_current: bool = False)

```

Finish the trace.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `reset_current` | `bool` | If true, the trace will be reset as the current trace. | `False` |

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def finish(self, reset_current: bool = False):<br>    """<br>    Finish the trace.<br>    Args:<br>        reset_current: If true, the trace will be reset as the current trace.<br>    """<br>    pass<br>``` |

#### export`abstractmethod`

```md-code__content
export() -> dict[str, Any] | None

```

Export the trace as a dictionary.

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>62<br>63<br>64<br>65<br>66<br>67<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def export(self) -> dict[str, Any] | None:<br>    """<br>    Export the trace as a dictionary.<br>    """<br>    pass<br>``` |

### NoOpTrace

Bases: `Trace`

A no-op trace that will not be recorded.

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br> 70<br> 71<br> 72<br> 73<br> 74<br> 75<br> 76<br> 77<br> 78<br> 79<br> 80<br> 81<br> 82<br> 83<br> 84<br> 85<br> 86<br> 87<br> 88<br> 89<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>``` | ```md-code__content<br>class NoOpTrace(Trace):<br>    """<br>    A no-op trace that will not be recorded.<br>    """<br>    def **init**(self):<br>        self._started = False<br>        self._prev_context_token: contextvars.Token[Trace | None] | None = None<br>    def **enter**(self) -> Trace:<br>        if self._started:<br>            if not self._prev_context_token:<br>                logger.error("Trace already started but no context token set")<br>            return self<br>        self._started = True<br>        self.start(mark_as_current=True)<br>        return self<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        self.finish(reset_current=True)<br>    def start(self, mark_as_current: bool = False):<br>        if mark_as_current:<br>            self._prev_context_token = Scope.set_current_trace(self)<br>    def finish(self, reset_current: bool = False):<br>        if reset_current and self._prev_context_token is not None:<br>            Scope.reset_current_trace(self._prev_context_token)<br>            self._prev_context_token = None<br>    @property<br>    def trace_id(self) -> str:<br>        return "no-op"<br>    @property<br>    def name(self) -> str:<br>        return "no-op"<br>    def export(self) -> dict[str, Any] | None:<br>        return None<br>``` |

### TraceImpl

Bases: `Trace`

A trace that will be recorded by the tracing library.

Source code in `src/agents/tracing/traces.py`

|     |     |
| --- | --- |
| ```<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>``` | ```md-code__content<br>class TraceImpl(Trace):<br>    """<br>    A trace that will be recorded by the tracing library.<br>    """<br>    **slots** = (<br>        "_name",<br>        "_trace_id",<br>        "group_id",<br>        "metadata",<br>        "_prev_context_token",<br>        "_processor",<br>        "_started",<br>    )<br>    def **init**(<br>        self,<br>        name: str,<br>        trace_id: str | None,<br>        group_id: str | None,<br>        metadata: dict[str, Any] | None,<br>        processor: TracingProcessor,<br>    ):<br>        self._name = name<br>        self._trace_id = trace_id or util.gen_trace_id()<br>        self.group_id = group_id<br>        self.metadata = metadata<br>        self._prev_context_token: contextvars.Token[Trace | None] | None = None<br>        self._processor = processor<br>        self._started = False<br>    @property<br>    def trace_id(self) -> str:<br>        return self._trace_id<br>    @property<br>    def name(self) -> str:<br>        return self._name<br>    def start(self, mark_as_current: bool = False):<br>        if self._started:<br>            return<br>        self._started = True<br>        self._processor.on_trace_start(self)<br>        if mark_as_current:<br>            self._prev_context_token = Scope.set_current_trace(self)<br>    def finish(self, reset_current: bool = False):<br>        if not self._started:<br>            return<br>        self._processor.on_trace_end(self)<br>        if reset_current and self._prev_context_token is not None:<br>            Scope.reset_current_trace(self._prev_context_token)<br>            self._prev_context_token = None<br>    def **enter**(self) -> Trace:<br>        if self._started:<br>            if not self._prev_context_token:<br>                logger.error("Trace already started but no context token set")<br>            return self<br>        self.start(mark_as_current=True)<br>        return self<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        self.finish(reset_current=exc_type is not GeneratorExit)<br>    def export(self) -> dict[str, Any] | None:<br>        return {<br>            "object": "trace",<br>            "id": self.trace_id,<br>            "workflow_name": self.name,<br>            "group_id": self.group_id,<br>            "metadata": self.metadata,<br>        }<br>``` |

## OpenAI Chat Completions

[Skip to content](https://openai.github.io/openai-agents-python/ref/models/openai_chatcompletions/#openai-chat-completions-model)

# `OpenAI Chat Completions model`

### OpenAIChatCompletionsModel

Bases: `Model`

Source code in `src/agents/models/openai_chatcompletions.py`

|     |     |
| --- | --- |
| ```<br> 90<br> 91<br> 92<br> 93<br> 94<br> 95<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>157<br>158<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>321<br>322<br>323<br>324<br>325<br>326<br>327<br>328<br>329<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>345<br>346<br>347<br>348<br>349<br>350<br>351<br>352<br>353<br>354<br>355<br>356<br>357<br>358<br>359<br>360<br>361<br>362<br>363<br>364<br>365<br>366<br>367<br>368<br>369<br>370<br>371<br>372<br>373<br>374<br>375<br>376<br>377<br>378<br>379<br>380<br>381<br>382<br>383<br>384<br>385<br>386<br>387<br>388<br>389<br>390<br>391<br>392<br>393<br>394<br>395<br>396<br>397<br>398<br>399<br>400<br>401<br>402<br>403<br>404<br>405<br>406<br>407<br>408<br>409<br>410<br>411<br>412<br>413<br>414<br>415<br>416<br>417<br>418<br>419<br>420<br>421<br>422<br>423<br>424<br>425<br>426<br>427<br>428<br>429<br>430<br>431<br>432<br>433<br>434<br>435<br>436<br>437<br>438<br>439<br>440<br>441<br>442<br>443<br>444<br>445<br>446<br>447<br>448<br>449<br>450<br>451<br>452<br>453<br>454<br>455<br>456<br>457<br>458<br>459<br>460<br>461<br>462<br>463<br>464<br>465<br>466<br>467<br>468<br>469<br>470<br>471<br>472<br>473<br>474<br>475<br>476<br>477<br>478<br>479<br>480<br>481<br>482<br>483<br>484<br>485<br>486<br>487<br>488<br>489<br>490<br>491<br>492<br>493<br>494<br>495<br>496<br>497<br>498<br>499<br>500<br>501<br>502<br>503<br>504<br>505<br>506<br>507<br>508<br>509<br>510<br>511<br>512<br>513<br>514<br>515<br>516<br>517<br>518<br>519<br>520<br>521<br>522<br>523<br>524<br>525<br>526<br>527<br>528<br>529<br>530<br>531<br>532<br>533<br>534<br>535<br>536<br>537<br>538<br>539<br>540<br>541<br>542<br>543<br>544<br>545<br>546<br>547<br>548<br>549<br>550<br>551<br>552<br>553<br>554<br>555<br>``` | ```md-code__content<br>class OpenAIChatCompletionsModel(Model):<br>    def **init**(<br>        self,<br>        model: str | ChatModel,<br>        openai_client: AsyncOpenAI,<br>    ) -> None:<br>        self.model = model<br>        self._client = openai_client<br>    def_non_null_or_not_given(self, value: Any) -> Any:<br>        return value if value is not None else NOT_GIVEN<br>    async def get_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        tracing: ModelTracing,<br>    ) -> ModelResponse:<br>        with generation_span(<br>            model=str(self.model),<br>            model_config=dataclasses.asdict(model_settings)<br>            | {"base_url": str(self._client.base_url)},<br>            disabled=tracing.is_disabled(),<br>        ) as span_generation:<br>            response = await self._fetch_response(<br>                system_instructions,<br>                input,<br>                model_settings,<br>                tools,<br>                output_schema,<br>                handoffs,<br>                span_generation,<br>                tracing,<br>                stream=False,<br>            )<br>            if_debug.DONT_LOG_MODEL_DATA:<br>                logger.debug("Received model response")<br>            else:<br>                logger.debug(<br>                    f"LLM resp:\n{json.dumps(response.choices[0].message.model_dump(), indent=2)}\n"<br>                )<br>            usage = (<br>                Usage(<br>                    requests=1,<br>                    input_tokens=response.usage.prompt_tokens,<br>                    output_tokens=response.usage.completion_tokens,<br>                    total_tokens=response.usage.total_tokens,<br>                )<br>                if response.usage<br>                else Usage()<br>            )<br>            if tracing.include_data():<br>                span_generation.span_data.output = [response.choices[0].message.model_dump()]<br>            span_generation.span_data.usage = {<br>                "input_tokens": usage.input_tokens,<br>                "output_tokens": usage.output_tokens,<br>            }<br>            items = _Converter.message_to_output_items(response.choices[0].message)<br>            return ModelResponse(<br>                output=items,<br>                usage=usage,<br>                referenceable_id=None,<br>            )<br>    async def stream_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        tracing: ModelTracing,<br>    ) -> AsyncIterator[TResponseStreamEvent]:<br>        """<br>        Yields a partial message as it is generated, as well as the usage information.<br>        """<br>        with generation_span(<br>            model=str(self.model),<br>            model_config=dataclasses.asdict(model_settings)<br>            | {"base_url": str(self._client.base_url)},<br>            disabled=tracing.is_disabled(),<br>        ) as span_generation:<br>            response, stream = await self._fetch_response(<br>                system_instructions,<br>                input,<br>                model_settings,<br>                tools,<br>                output_schema,<br>                handoffs,<br>                span_generation,<br>                tracing,<br>                stream=True,<br>            )<br>            usage: CompletionUsage | None = None<br>            state = _StreamingState()<br>            async for chunk in stream:<br>                if not state.started:<br>                    state.started = True<br>                    yield ResponseCreatedEvent(<br>                        response=response,<br>                        type="response.created",<br>                    )<br>                # The usage is only available in the last chunk<br>                usage = chunk.usage<br>                if not chunk.choices or not chunk.choices[0].delta:<br>                    continue<br>                delta = chunk.choices[0].delta<br>                # Handle text<br>                if delta.content:<br>                    if not state.text_content_index_and_output:<br>                        # Initialize a content tracker for streaming text<br>                        state.text_content_index_and_output = (<br>                            0 if not state.refusal_content_index_and_output else 1,<br>                            ResponseOutputText(<br>                                text="",<br>                                type="output_text",<br>                                annotations=[],<br>                            ),<br>                        )<br>                        # Start a new assistant message stream<br>                        assistant_item = ResponseOutputMessage(<br>                            id=FAKE_RESPONSES_ID,<br>                            content=[],<br>                            role="assistant",<br>                            type="message",<br>                            status="in_progress",<br>                        )<br>                        # Notify consumers of the start of a new output message + first content part<br>                        yield ResponseOutputItemAddedEvent(<br>                            item=assistant_item,<br>                            output_index=0,<br>                            type="response.output_item.added",<br>                        )<br>                        yield ResponseContentPartAddedEvent(<br>                            content_index=state.text_content_index_and_output[0],<br>                            item_id=FAKE_RESPONSES_ID,<br>                            output_index=0,<br>                            part=ResponseOutputText(<br>                                text="",<br>                                type="output_text",<br>                                annotations=[],<br>                            ),<br>                            type="response.content_part.added",<br>                        )<br>                    # Emit the delta for this segment of content<br>                    yield ResponseTextDeltaEvent(<br>                        content_index=state.text_content_index_and_output[0],<br>                        delta=delta.content,<br>                        item_id=FAKE_RESPONSES_ID,<br>                        output_index=0,<br>                        type="response.output_text.delta",<br>                    )<br>                    # Accumulate the text into the response part<br>                    state.text_content_index_and_output[1].text += delta.content<br>                # Handle refusals (model declines to answer)<br>                if delta.refusal:<br>                    if not state.refusal_content_index_and_output:<br>                        # Initialize a content tracker for streaming refusal text<br>                        state.refusal_content_index_and_output = (<br>                            0 if not state.text_content_index_and_output else 1,<br>                            ResponseOutputRefusal(refusal="", type="refusal"),<br>                        )<br>                        # Start a new assistant message if one doesn't exist yet (in-progress)<br>                        assistant_item = ResponseOutputMessage(<br>                            id=FAKE_RESPONSES_ID,<br>                            content=[],<br>                            role="assistant",<br>                            type="message",<br>                            status="in_progress",<br>                        )<br>                        # Notify downstream that assistant message + first content part are starting<br>                        yield ResponseOutputItemAddedEvent(<br>                            item=assistant_item,<br>                            output_index=0,<br>                            type="response.output_item.added",<br>                        )<br>                        yield ResponseContentPartAddedEvent(<br>                            content_index=state.refusal_content_index_and_output[0],<br>                            item_id=FAKE_RESPONSES_ID,<br>                            output_index=0,<br>                            part=ResponseOutputText(<br>                                text="",<br>                                type="output_text",<br>                                annotations=[],<br>                            ),<br>                            type="response.content_part.added",<br>                        )<br>                    # Emit the delta for this segment of refusal<br>                    yield ResponseRefusalDeltaEvent(<br>                        content_index=state.refusal_content_index_and_output[0],<br>                        delta=delta.refusal,<br>                        item_id=FAKE_RESPONSES_ID,<br>                        output_index=0,<br>                        type="response.refusal.delta",<br>                    )<br>                    # Accumulate the refusal string in the output part<br>                    state.refusal_content_index_and_output[1].refusal += delta.refusal<br>                # Handle tool calls<br>                # Because we don't know the name of the function until the end of the stream, we'll<br>                # save everything and yield events at the end<br>                if delta.tool_calls:<br>                    for tc_delta in delta.tool_calls:<br>                        if tc_delta.index not in state.function_calls:<br>                            state.function_calls[tc_delta.index] = ResponseFunctionToolCall(<br>                                id=FAKE_RESPONSES_ID,<br>                                arguments="",<br>                                name="",<br>                                type="function_call",<br>                                call_id="",<br>                            )<br>                        tc_function = tc_delta.function<br>                        state.function_calls[tc_delta.index].arguments += (<br>                            tc_function.arguments if tc_function else ""<br>                        ) or ""<br>                        state.function_calls[tc_delta.index].name += (<br>                            tc_function.name if tc_function else ""<br>                        ) or ""<br>                        state.function_calls[tc_delta.index].call_id += tc_delta.id or ""<br>            function_call_starting_index = 0<br>            if state.text_content_index_and_output:<br>                function_call_starting_index += 1<br>                # Send end event for this content part<br>                yield ResponseContentPartDoneEvent(<br>                    content_index=state.text_content_index_and_output[0],<br>                    item_id=FAKE_RESPONSES_ID,<br>                    output_index=0,<br>                    part=state.text_content_index_and_output[1],<br>                    type="response.content_part.done",<br>                )<br>            if state.refusal_content_index_and_output:<br>                function_call_starting_index += 1<br>                # Send end event for this content part<br>                yield ResponseContentPartDoneEvent(<br>                    content_index=state.refusal_content_index_and_output[0],<br>                    item_id=FAKE_RESPONSES_ID,<br>                    output_index=0,<br>                    part=state.refusal_content_index_and_output[1],<br>                    type="response.content_part.done",<br>                )<br>            # Actually send events for the function calls<br>            for function_call in state.function_calls.values():<br>                # First, a ResponseOutputItemAdded for the function call<br>                yield ResponseOutputItemAddedEvent(<br>                    item=ResponseFunctionToolCall(<br>                        id=FAKE_RESPONSES_ID,<br>                        call_id=function_call.call_id,<br>                        arguments=function_call.arguments,<br>                        name=function_call.name,<br>                        type="function_call",<br>                    ),<br>                    output_index=function_call_starting_index,<br>                    type="response.output_item.added",<br>                )<br>                # Then, yield the args<br>                yield ResponseFunctionCallArgumentsDeltaEvent(<br>                    delta=function_call.arguments,<br>                    item_id=FAKE_RESPONSES_ID,<br>                    output_index=function_call_starting_index,<br>                    type="response.function_call_arguments.delta",<br>                )<br>                # Finally, the ResponseOutputItemDone<br>                yield ResponseOutputItemDoneEvent(<br>                    item=ResponseFunctionToolCall(<br>                        id=FAKE_RESPONSES_ID,<br>                        call_id=function_call.call_id,<br>                        arguments=function_call.arguments,<br>                        name=function_call.name,<br>                        type="function_call",<br>                    ),<br>                    output_index=function_call_starting_index,<br>                    type="response.output_item.done",<br>                )<br>            # Finally, send the Response completed event<br>            outputs: list[ResponseOutputItem] = []<br>            if state.text_content_index_and_output or state.refusal_content_index_and_output:<br>                assistant_msg = ResponseOutputMessage(<br>                    id=FAKE_RESPONSES_ID,<br>                    content=[],<br>                    role="assistant",<br>                    type="message",<br>                    status="completed",<br>                )<br>                if state.text_content_index_and_output:<br>                    assistant_msg.content.append(state.text_content_index_and_output[1])<br>                if state.refusal_content_index_and_output:<br>                    assistant_msg.content.append(state.refusal_content_index_and_output[1])<br>                outputs.append(assistant_msg)<br>                # send a ResponseOutputItemDone for the assistant message<br>                yield ResponseOutputItemDoneEvent(<br>                    item=assistant_msg,<br>                    output_index=0,<br>                    type="response.output_item.done",<br>                )<br>            for function_call in state.function_calls.values():<br>                outputs.append(function_call)<br>            final_response = response.model_copy()<br>            final_response.output = outputs<br>            final_response.usage = (<br>                ResponseUsage(<br>                    input_tokens=usage.prompt_tokens,<br>                    output_tokens=usage.completion_tokens,<br>                    total_tokens=usage.total_tokens,<br>                    output_tokens_details=OutputTokensDetails(<br>                        reasoning_tokens=usage.completion_tokens_details.reasoning_tokens<br>                        if usage.completion_tokens_details<br>                        and usage.completion_tokens_details.reasoning_tokens<br>                        else 0<br>                    ),<br>                )<br>                if usage<br>                else None<br>            )<br>            yield ResponseCompletedEvent(<br>                response=final_response,<br>                type="response.completed",<br>            )<br>            if tracing.include_data():<br>                span_generation.span_data.output = [final_response.model_dump()]<br>            if usage:<br>                span_generation.span_data.usage = {<br>                    "input_tokens": usage.prompt_tokens,<br>                    "output_tokens": usage.completion_tokens,<br>                }<br>    @overload<br>    async def _fetch_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        span: Span[GenerationSpanData],<br>        tracing: ModelTracing,<br>        stream: Literal[True],<br>    ) -> tuple[Response, AsyncStream[ChatCompletionChunk]]: ...<br>    @overload<br>    async def _fetch_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        span: Span[GenerationSpanData],<br>        tracing: ModelTracing,<br>        stream: Literal[False],<br>    ) -> ChatCompletion: ...<br>    async def _fetch_response(<br>        self,<br>        system_instructions: str | None,<br>        input: str | list[TResponseInputItem],<br>        model_settings: ModelSettings,<br>        tools: list[Tool],<br>        output_schema: AgentOutputSchema | None,<br>        handoffs: list[Handoff],<br>        span: Span[GenerationSpanData],<br>        tracing: ModelTracing,<br>        stream: bool = False,<br>    ) -> ChatCompletion | tuple[Response, AsyncStream[ChatCompletionChunk]]:<br>        converted_messages =_Converter.items_to_messages(input)<br>        if system_instructions:<br>            converted_messages.insert(<br>                0,<br>                {<br>                    "content": system_instructions,<br>                    "role": "system",<br>                },<br>            )<br>        if tracing.include_data():<br>            span.span_data.input = converted_messages<br>        parallel_tool_calls = (<br>            True if model_settings.parallel_tool_calls and tools and len(tools) > 0 else NOT_GIVEN<br>        )<br>        tool_choice =_Converter.convert_tool_choice(model_settings.tool_choice)<br>        response_format =_Converter.convert_response_format(output_schema)<br>        converted_tools = [ToolConverter.to_openai(tool) for tool in tools] if tools else []<br>        for handoff in handoffs:<br>            converted_tools.append(ToolConverter.convert_handoff_tool(handoff))<br>        if _debug.DONT_LOG_MODEL_DATA:<br>            logger.debug("Calling LLM")<br>        else:<br>            logger.debug(<br>                f"{json.dumps(converted_messages, indent=2)}\n"<br>                f"Tools:\n{json.dumps(converted_tools, indent=2)}\n"<br>                f"Stream: {stream}\n"<br>                f"Tool choice: {tool_choice}\n"<br>                f"Response format: {response_format}\n"<br>            )<br>        ret = await self._get_client().chat.completions.create(<br>            model=self.model,<br>            messages=converted_messages,<br>            tools=converted_tools or NOT_GIVEN,<br>            temperature=self._non_null_or_not_given(model_settings.temperature),<br>            top_p=self._non_null_or_not_given(model_settings.top_p),<br>            frequency_penalty=self._non_null_or_not_given(model_settings.frequency_penalty),<br>            presence_penalty=self._non_null_or_not_given(model_settings.presence_penalty),<br>            max_tokens=self._non_null_or_not_given(model_settings.max_tokens),<br>            tool_choice=tool_choice,<br>            response_format=response_format,<br>            parallel_tool_calls=parallel_tool_calls,<br>            stream=stream,<br>            stream_options={"include_usage": True} if stream else NOT_GIVEN,<br>            extra_headers=_HEADERS,<br>        )<br>        if isinstance(ret, ChatCompletion):<br>            return ret<br>        response = Response(<br>            id=FAKE_RESPONSES_ID,<br>            created_at=time.time(),<br>            model=self.model,<br>            object="response",<br>            output=[],<br>            tool_choice=cast(Literal["auto", "required", "none"], tool_choice)<br>            if tool_choice != NOT_GIVEN<br>            else "auto",<br>            top_p=model_settings.top_p,<br>            temperature=model_settings.temperature,<br>            tools=[],<br>            parallel_tool_calls=parallel_tool_calls or False,<br>        )<br>        return response, ret<br>    def_get_client(self) -> AsyncOpenAI:<br>        if self._client is None:<br>            self._client = AsyncOpenAI()<br>        return self._client<br>``` |

#### stream\_response`async`

```md-code__content
stream_response(
    system_instructions: str | None,
    input: str | list[TResponseInputItem],
    model_settings: ModelSettings,
    tools: list[Tool],
    output_schema: AgentOutputSchema | None,
    handoffs: list[Handoff],
    tracing: ModelTracing,
) -> AsyncIterator[TResponseStreamEvent]

```

Yields a partial message as it is generated, as well as the usage information.

Source code in `src/agents/models/openai_chatcompletions.py`

|     |     |
| --- | --- |
| ```<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>265<br>266<br>267<br>268<br>269<br>270<br>271<br>272<br>273<br>274<br>275<br>276<br>277<br>278<br>279<br>280<br>281<br>282<br>283<br>284<br>285<br>286<br>287<br>288<br>289<br>290<br>291<br>292<br>293<br>294<br>295<br>296<br>297<br>298<br>299<br>300<br>301<br>302<br>303<br>304<br>305<br>306<br>307<br>308<br>309<br>310<br>311<br>312<br>313<br>314<br>315<br>316<br>317<br>318<br>319<br>320<br>321<br>322<br>323<br>324<br>325<br>326<br>327<br>328<br>329<br>330<br>331<br>332<br>333<br>334<br>335<br>336<br>337<br>338<br>339<br>340<br>341<br>342<br>343<br>344<br>345<br>346<br>347<br>348<br>349<br>350<br>351<br>352<br>353<br>354<br>355<br>356<br>357<br>358<br>359<br>360<br>361<br>362<br>363<br>364<br>365<br>366<br>367<br>368<br>369<br>370<br>371<br>372<br>373<br>374<br>375<br>376<br>377<br>378<br>379<br>380<br>381<br>382<br>383<br>384<br>385<br>386<br>387<br>388<br>389<br>390<br>391<br>392<br>393<br>394<br>395<br>396<br>397<br>398<br>399<br>400<br>401<br>402<br>403<br>404<br>405<br>406<br>407<br>408<br>409<br>410<br>411<br>412<br>413<br>414<br>415<br>416<br>417<br>418<br>419<br>420<br>421<br>422<br>423<br>424<br>425<br>426<br>427<br>428<br>429<br>430<br>431<br>432<br>433<br>434<br>435<br>436<br>437<br>438<br>439<br>``` | ```md-code__content<br>async def stream_response(<br>    self,<br>    system_instructions: str | None,<br>    input: str | list[TResponseInputItem],<br>    model_settings: ModelSettings,<br>    tools: list[Tool],<br>    output_schema: AgentOutputSchema | None,<br>    handoffs: list[Handoff],<br>    tracing: ModelTracing,<br>) -> AsyncIterator[TResponseStreamEvent]:<br>    """<br>    Yields a partial message as it is generated, as well as the usage information.<br>    """<br>    with generation_span(<br>        model=str(self.model),<br>        model_config=dataclasses.asdict(model_settings)<br>        | {"base_url": str(self._client.base_url)},<br>        disabled=tracing.is_disabled(),<br>    ) as span_generation:<br>        response, stream = await self._fetch_response(<br>            system_instructions,<br>            input,<br>            model_settings,<br>            tools,<br>            output_schema,<br>            handoffs,<br>            span_generation,<br>            tracing,<br>            stream=True,<br>        )<br>        usage: CompletionUsage | None = None<br>        state = _StreamingState()<br>        async for chunk in stream:<br>            if not state.started:<br>                state.started = True<br>                yield ResponseCreatedEvent(<br>                    response=response,<br>                    type="response.created",<br>                )<br>            # The usage is only available in the last chunk<br>            usage = chunk.usage<br>            if not chunk.choices or not chunk.choices[0].delta:<br>                continue<br>            delta = chunk.choices[0].delta<br>            # Handle text<br>            if delta.content:<br>                if not state.text_content_index_and_output:<br>                    # Initialize a content tracker for streaming text<br>                    state.text_content_index_and_output = (<br>                        0 if not state.refusal_content_index_and_output else 1,<br>                        ResponseOutputText(<br>                            text="",<br>                            type="output_text",<br>                            annotations=[],<br>                        ),<br>                    )<br>                    # Start a new assistant message stream<br>                    assistant_item = ResponseOutputMessage(<br>                        id=FAKE_RESPONSES_ID,<br>                        content=[],<br>                        role="assistant",<br>                        type="message",<br>                        status="in_progress",<br>                    )<br>                    # Notify consumers of the start of a new output message + first content part<br>                    yield ResponseOutputItemAddedEvent(<br>                        item=assistant_item,<br>                        output_index=0,<br>                        type="response.output_item.added",<br>                    )<br>                    yield ResponseContentPartAddedEvent(<br>                        content_index=state.text_content_index_and_output[0],<br>                        item_id=FAKE_RESPONSES_ID,<br>                        output_index=0,<br>                        part=ResponseOutputText(<br>                            text="",<br>                            type="output_text",<br>                            annotations=[],<br>                        ),<br>                        type="response.content_part.added",<br>                    )<br>                # Emit the delta for this segment of content<br>                yield ResponseTextDeltaEvent(<br>                    content_index=state.text_content_index_and_output[0],<br>                    delta=delta.content,<br>                    item_id=FAKE_RESPONSES_ID,<br>                    output_index=0,<br>                    type="response.output_text.delta",<br>                )<br>                # Accumulate the text into the response part<br>                state.text_content_index_and_output[1].text += delta.content<br>            # Handle refusals (model declines to answer)<br>            if delta.refusal:<br>                if not state.refusal_content_index_and_output:<br>                    # Initialize a content tracker for streaming refusal text<br>                    state.refusal_content_index_and_output = (<br>                        0 if not state.text_content_index_and_output else 1,<br>                        ResponseOutputRefusal(refusal="", type="refusal"),<br>                    )<br>                    # Start a new assistant message if one doesn't exist yet (in-progress)<br>                    assistant_item = ResponseOutputMessage(<br>                        id=FAKE_RESPONSES_ID,<br>                        content=[],<br>                        role="assistant",<br>                        type="message",<br>                        status="in_progress",<br>                    )<br>                    # Notify downstream that assistant message + first content part are starting<br>                    yield ResponseOutputItemAddedEvent(<br>                        item=assistant_item,<br>                        output_index=0,<br>                        type="response.output_item.added",<br>                    )<br>                    yield ResponseContentPartAddedEvent(<br>                        content_index=state.refusal_content_index_and_output[0],<br>                        item_id=FAKE_RESPONSES_ID,<br>                        output_index=0,<br>                        part=ResponseOutputText(<br>                            text="",<br>                            type="output_text",<br>                            annotations=[],<br>                        ),<br>                        type="response.content_part.added",<br>                    )<br>                # Emit the delta for this segment of refusal<br>                yield ResponseRefusalDeltaEvent(<br>                    content_index=state.refusal_content_index_and_output[0],<br>                    delta=delta.refusal,<br>                    item_id=FAKE_RESPONSES_ID,<br>                    output_index=0,<br>                    type="response.refusal.delta",<br>                )<br>                # Accumulate the refusal string in the output part<br>                state.refusal_content_index_and_output[1].refusal += delta.refusal<br>            # Handle tool calls<br>            # Because we don't know the name of the function until the end of the stream, we'll<br>            # save everything and yield events at the end<br>            if delta.tool_calls:<br>                for tc_delta in delta.tool_calls:<br>                    if tc_delta.index not in state.function_calls:<br>                        state.function_calls[tc_delta.index] = ResponseFunctionToolCall(<br>                            id=FAKE_RESPONSES_ID,<br>                            arguments="",<br>                            name="",<br>                            type="function_call",<br>                            call_id="",<br>                        )<br>                    tc_function = tc_delta.function<br>                    state.function_calls[tc_delta.index].arguments += (<br>                        tc_function.arguments if tc_function else ""<br>                    ) or ""<br>                    state.function_calls[tc_delta.index].name += (<br>                        tc_function.name if tc_function else ""<br>                    ) or ""<br>                    state.function_calls[tc_delta.index].call_id += tc_delta.id or ""<br>        function_call_starting_index = 0<br>        if state.text_content_index_and_output:<br>            function_call_starting_index += 1<br>            # Send end event for this content part<br>            yield ResponseContentPartDoneEvent(<br>                content_index=state.text_content_index_and_output[0],<br>                item_id=FAKE_RESPONSES_ID,<br>                output_index=0,<br>                part=state.text_content_index_and_output[1],<br>                type="response.content_part.done",<br>            )<br>        if state.refusal_content_index_and_output:<br>            function_call_starting_index += 1<br>            # Send end event for this content part<br>            yield ResponseContentPartDoneEvent(<br>                content_index=state.refusal_content_index_and_output[0],<br>                item_id=FAKE_RESPONSES_ID,<br>                output_index=0,<br>                part=state.refusal_content_index_and_output[1],<br>                type="response.content_part.done",<br>            )<br>        # Actually send events for the function calls<br>        for function_call in state.function_calls.values():<br>            # First, a ResponseOutputItemAdded for the function call<br>            yield ResponseOutputItemAddedEvent(<br>                item=ResponseFunctionToolCall(<br>                    id=FAKE_RESPONSES_ID,<br>                    call_id=function_call.call_id,<br>                    arguments=function_call.arguments,<br>                    name=function_call.name,<br>                    type="function_call",<br>                ),<br>                output_index=function_call_starting_index,<br>                type="response.output_item.added",<br>            )<br>            # Then, yield the args<br>            yield ResponseFunctionCallArgumentsDeltaEvent(<br>                delta=function_call.arguments,<br>                item_id=FAKE_RESPONSES_ID,<br>                output_index=function_call_starting_index,<br>                type="response.function_call_arguments.delta",<br>            )<br>            # Finally, the ResponseOutputItemDone<br>            yield ResponseOutputItemDoneEvent(<br>                item=ResponseFunctionToolCall(<br>                    id=FAKE_RESPONSES_ID,<br>                    call_id=function_call.call_id,<br>                    arguments=function_call.arguments,<br>                    name=function_call.name,<br>                    type="function_call",<br>                ),<br>                output_index=function_call_starting_index,<br>                type="response.output_item.done",<br>            )<br>        # Finally, send the Response completed event<br>        outputs: list[ResponseOutputItem] = []<br>        if state.text_content_index_and_output or state.refusal_content_index_and_output:<br>            assistant_msg = ResponseOutputMessage(<br>                id=FAKE_RESPONSES_ID,<br>                content=[],<br>                role="assistant",<br>                type="message",<br>                status="completed",<br>            )<br>            if state.text_content_index_and_output:<br>                assistant_msg.content.append(state.text_content_index_and_output[1])<br>            if state.refusal_content_index_and_output:<br>                assistant_msg.content.append(state.refusal_content_index_and_output[1])<br>            outputs.append(assistant_msg)<br>            # send a ResponseOutputItemDone for the assistant message<br>            yield ResponseOutputItemDoneEvent(<br>                item=assistant_msg,<br>                output_index=0,<br>                type="response.output_item.done",<br>            )<br>        for function_call in state.function_calls.values():<br>            outputs.append(function_call)<br>        final_response = response.model_copy()<br>        final_response.output = outputs<br>        final_response.usage = (<br>            ResponseUsage(<br>                input_tokens=usage.prompt_tokens,<br>                output_tokens=usage.completion_tokens,<br>                total_tokens=usage.total_tokens,<br>                output_tokens_details=OutputTokensDetails(<br>                    reasoning_tokens=usage.completion_tokens_details.reasoning_tokens<br>                    if usage.completion_tokens_details<br>                    and usage.completion_tokens_details.reasoning_tokens<br>                    else 0<br>                ),<br>            )<br>            if usage<br>            else None<br>        )<br>        yield ResponseCompletedEvent(<br>            response=final_response,<br>            type="response.completed",<br>        )<br>        if tracing.include_data():<br>            span_generation.span_data.output = [final_response.model_dump()]<br>        if usage:<br>            span_generation.span_data.usage = {<br>                "input_tokens": usage.prompt_tokens,<br>                "output_tokens": usage.completion_tokens,<br>            }<br>``` |

### \_Converter

Source code in `src/agents/models/openai_chatcompletions.py`

|     |     |
| --- | --- |
| ```<br>558<br>559<br>560<br>561<br>562<br>563<br>564<br>565<br>566<br>567<br>568<br>569<br>570<br>571<br>572<br>573<br>574<br>575<br>576<br>577<br>578<br>579<br>580<br>581<br>582<br>583<br>584<br>585<br>586<br>587<br>588<br>589<br>590<br>591<br>592<br>593<br>594<br>595<br>596<br>597<br>598<br>599<br>600<br>601<br>602<br>603<br>604<br>605<br>606<br>607<br>608<br>609<br>610<br>611<br>612<br>613<br>614<br>615<br>616<br>617<br>618<br>619<br>620<br>621<br>622<br>623<br>624<br>625<br>626<br>627<br>628<br>629<br>630<br>631<br>632<br>633<br>634<br>635<br>636<br>637<br>638<br>639<br>640<br>641<br>642<br>643<br>644<br>645<br>646<br>647<br>648<br>649<br>650<br>651<br>652<br>653<br>654<br>655<br>656<br>657<br>658<br>659<br>660<br>661<br>662<br>663<br>664<br>665<br>666<br>667<br>668<br>669<br>670<br>671<br>672<br>673<br>674<br>675<br>676<br>677<br>678<br>679<br>680<br>681<br>682<br>683<br>684<br>685<br>686<br>687<br>688<br>689<br>690<br>691<br>692<br>693<br>694<br>695<br>696<br>697<br>698<br>699<br>700<br>701<br>702<br>703<br>704<br>705<br>706<br>707<br>708<br>709<br>710<br>711<br>712<br>713<br>714<br>715<br>716<br>717<br>718<br>719<br>720<br>721<br>722<br>723<br>724<br>725<br>726<br>727<br>728<br>729<br>730<br>731<br>732<br>733<br>734<br>735<br>736<br>737<br>738<br>739<br>740<br>741<br>742<br>743<br>744<br>745<br>746<br>747<br>748<br>749<br>750<br>751<br>752<br>753<br>754<br>755<br>756<br>757<br>758<br>759<br>760<br>761<br>762<br>763<br>764<br>765<br>766<br>767<br>768<br>769<br>770<br>771<br>772<br>773<br>774<br>775<br>776<br>777<br>778<br>779<br>780<br>781<br>782<br>783<br>784<br>785<br>786<br>787<br>788<br>789<br>790<br>791<br>792<br>793<br>794<br>795<br>796<br>797<br>798<br>799<br>800<br>801<br>802<br>803<br>804<br>805<br>806<br>807<br>808<br>809<br>810<br>811<br>812<br>813<br>814<br>815<br>816<br>817<br>818<br>819<br>820<br>821<br>822<br>823<br>824<br>825<br>826<br>827<br>828<br>829<br>830<br>831<br>832<br>833<br>834<br>835<br>836<br>837<br>838<br>839<br>840<br>841<br>842<br>843<br>844<br>845<br>846<br>847<br>848<br>849<br>850<br>851<br>852<br>853<br>854<br>855<br>856<br>857<br>858<br>859<br>860<br>861<br>862<br>863<br>864<br>865<br>866<br>867<br>868<br>869<br>870<br>871<br>872<br>873<br>874<br>875<br>876<br>877<br>878<br>879<br>880<br>881<br>882<br>883<br>884<br>885<br>886<br>887<br>888<br>889<br>890<br>891<br>892<br>893<br>894<br>895<br>896<br>897<br>898<br>899<br>900<br>901<br>902<br>903<br>904<br>905<br>906<br>907<br>908<br>909<br>910<br>911<br>912<br>913<br>914<br>915<br>916<br>917<br>918<br>919<br>920<br>921<br>922<br>923<br>924<br>925<br>926<br>927<br>928<br>929<br>930<br>931<br>932<br>933<br>934<br>935<br>936<br>937<br>938<br>939<br>940<br>941<br>942<br>943<br>944<br>945<br>946<br>947<br>948<br>``` | ```md-code__content<br>class _Converter:<br>    @classmethod<br>    def convert_tool_choice(<br>        cls, tool_choice: Literal["auto", "required", "none"] | str | None<br>    ) -> ChatCompletionToolChoiceOptionParam | NotGiven:<br>        if tool_choice is None:<br>            return NOT_GIVEN<br>        elif tool_choice == "auto":<br>            return "auto"<br>        elif tool_choice == "required":<br>            return "required"<br>        elif tool_choice == "none":<br>            return "none"<br>        else:<br>            return {<br>                "type": "function",<br>                "function": {<br>                    "name": tool_choice,<br>                },<br>            }<br>    @classmethod<br>    def convert_response_format(<br>        cls, final_output_schema: AgentOutputSchema | None<br>    ) -> ResponseFormat | NotGiven:<br>        if not final_output_schema or final_output_schema.is_plain_text():<br>            return NOT_GIVEN<br>        return {<br>            "type": "json_schema",<br>            "json_schema": {<br>                "name": "final_output",<br>                "strict": final_output_schema.strict_json_schema,<br>                "schema": final_output_schema.json_schema(),<br>            },<br>        }<br>    @classmethod<br>    def message_to_output_items(cls, message: ChatCompletionMessage) -> list[TResponseOutputItem]:<br>        items: list[TResponseOutputItem] = []<br>        message_item = ResponseOutputMessage(<br>            id=FAKE_RESPONSES_ID,<br>            content=[],<br>            role="assistant",<br>            type="message",<br>            status="completed",<br>        )<br>        if message.content:<br>            message_item.content.append(<br>                ResponseOutputText(text=message.content, type="output_text", annotations=[])<br>            )<br>        if message.refusal:<br>            message_item.content.append(<br>                ResponseOutputRefusal(refusal=message.refusal, type="refusal")<br>            )<br>        if message.audio:<br>            raise AgentsException("Audio is not currently supported")<br>        if message_item.content:<br>            items.append(message_item)<br>        if message.tool_calls:<br>            for tool_call in message.tool_calls:<br>                items.append(<br>                    ResponseFunctionToolCall(<br>                        id=FAKE_RESPONSES_ID,<br>                        call_id=tool_call.id,<br>                        arguments=tool_call.function.arguments,<br>                        name=tool_call.function.name,<br>                        type="function_call",<br>                    )<br>                )<br>        return items<br>    @classmethod<br>    def maybe_easy_input_message(cls, item: Any) -> EasyInputMessageParam | None:<br>        if not isinstance(item, dict):<br>            return None<br>        keys = item.keys()<br>        # EasyInputMessageParam only has these two keys<br>        if keys != {"content", "role"}:<br>            return None<br>        role = item.get("role", None)<br>        if role not in ("user", "assistant", "system", "developer"):<br>            return None<br>        if "content" not in item:<br>            return None<br>        return cast(EasyInputMessageParam, item)<br>    @classmethod<br>    def maybe_input_message(cls, item: Any) -> Message | None:<br>        if (<br>            isinstance(item, dict)<br>            and item.get("type") == "message"<br>            and item.get("role")<br>            in (<br>                "user",<br>                "system",<br>                "developer",<br>            )<br>        ):<br>            return cast(Message, item)<br>        return None<br>    @classmethod<br>    def maybe_file_search_call(cls, item: Any) -> ResponseFileSearchToolCallParam | None:<br>        if isinstance(item, dict) and item.get("type") == "file_search_call":<br>            return cast(ResponseFileSearchToolCallParam, item)<br>        return None<br>    @classmethod<br>    def maybe_function_tool_call(cls, item: Any) -> ResponseFunctionToolCallParam | None:<br>        if isinstance(item, dict) and item.get("type") == "function_call":<br>            return cast(ResponseFunctionToolCallParam, item)<br>        return None<br>    @classmethod<br>    def maybe_function_tool_call_output(<br>        cls,<br>        item: Any,<br>    ) -> FunctionCallOutput | None:<br>        if isinstance(item, dict) and item.get("type") == "function_call_output":<br>            return cast(FunctionCallOutput, item)<br>        return None<br>    @classmethod<br>    def maybe_item_reference(cls, item: Any) -> ItemReference | None:<br>        if isinstance(item, dict) and item.get("type") == "item_reference":<br>            return cast(ItemReference, item)<br>        return None<br>    @classmethod<br>    def maybe_response_output_message(cls, item: Any) -> ResponseOutputMessageParam | None:<br>        # ResponseOutputMessage is only used for messages with role assistant<br>        if (<br>            isinstance(item, dict)<br>            and item.get("type") == "message"<br>            and item.get("role") == "assistant"<br>        ):<br>            return cast(ResponseOutputMessageParam, item)<br>        return None<br>    @classmethod<br>    def extract_text_content(<br>        cls, content: str | Iterable[ResponseInputContentParam]<br>    ) -> str | list[ChatCompletionContentPartTextParam]:<br>        all_content = cls.extract_all_content(content)<br>        if isinstance(all_content, str):<br>            return all_content<br>        out: list[ChatCompletionContentPartTextParam] = []<br>        for c in all_content:<br>            if c.get("type") == "text":<br>                out.append(cast(ChatCompletionContentPartTextParam, c))<br>        return out<br>    @classmethod<br>    def extract_all_content(<br>        cls, content: str | Iterable[ResponseInputContentParam]<br>    ) -> str | list[ChatCompletionContentPartParam]:<br>        if isinstance(content, str):<br>            return content<br>        out: list[ChatCompletionContentPartParam] = []<br>        for c in content:<br>            if isinstance(c, dict) and c.get("type") == "input_text":<br>                casted_text_param = cast(ResponseInputTextParam, c)<br>                out.append(<br>                    ChatCompletionContentPartTextParam(<br>                        type="text",<br>                        text=casted_text_param["text"],<br>                    )<br>                )<br>            elif isinstance(c, dict) and c.get("type") == "input_image":<br>                casted_image_param = cast(ResponseInputImageParam, c)<br>                if "image_url" not in casted_image_param or not casted_image_param["image_url"]:<br>                    raise UserError(<br>                        f"Only image URLs are supported for input_image {casted_image_param}"<br>                    )<br>                out.append(<br>                    ChatCompletionContentPartImageParam(<br>                        type="image_url",<br>                        image_url={<br>                            "url": casted_image_param["image_url"],<br>                            "detail": casted_image_param["detail"],<br>                        },<br>                    )<br>                )<br>            elif isinstance(c, dict) and c.get("type") == "input_file":<br>                raise UserError(f"File uploads are not supported for chat completions {c}")<br>            else:<br>                raise UserError(f"Unknonw content: {c}")<br>        return out<br>    @classmethod<br>    def items_to_messages(<br>        cls,<br>        items: str | Iterable[TResponseInputItem],<br>    ) -> list[ChatCompletionMessageParam]:<br>        """<br>        Convert a sequence of 'Item' objects into a list of ChatCompletionMessageParam.<br>        Rules:<br>        - EasyInputMessage or InputMessage (role=user) => ChatCompletionUserMessageParam<br>        - EasyInputMessage or InputMessage (role=system) => ChatCompletionSystemMessageParam<br>        - EasyInputMessage or InputMessage (role=developer) => ChatCompletionDeveloperMessageParam<br>        - InputMessage (role=assistant) => Start or flush a ChatCompletionAssistantMessageParam<br>        - response_output_message => Also produces/flushes a ChatCompletionAssistantMessageParam<br>        - tool calls get attached to the _current_ assistant message, or create one if none.<br>        - tool outputs => ChatCompletionToolMessageParam<br>        """<br>        if isinstance(items, str):<br>            return [<br>                ChatCompletionUserMessageParam(<br>                    role="user",<br>                    content=items,<br>                )<br>            ]<br>        result: list[ChatCompletionMessageParam] = []<br>        current_assistant_msg: ChatCompletionAssistantMessageParam | None = None<br>        def flush_assistant_message() -> None:<br>            nonlocal current_assistant_msg<br>            if current_assistant_msg is not None:<br>                # The API doesn't support empty arrays for tool_calls<br>                if not current_assistant_msg.get("tool_calls"):<br>                    del current_assistant_msg["tool_calls"]<br>                result.append(current_assistant_msg)<br>                current_assistant_msg = None<br>        def ensure_assistant_message() -> ChatCompletionAssistantMessageParam:<br>            nonlocal current_assistant_msg<br>            if current_assistant_msg is None:<br>                current_assistant_msg = ChatCompletionAssistantMessageParam(role="assistant")<br>                current_assistant_msg["tool_calls"] = []<br>            return current_assistant_msg<br>        for item in items:<br>            # 1) Check easy input message<br>            if easy_msg := cls.maybe_easy_input_message(item):<br>                role = easy_msg["role"]<br>                content = easy_msg["content"]<br>                if role == "user":<br>                    flush_assistant_message()<br>                    msg_user: ChatCompletionUserMessageParam = {<br>                        "role": "user",<br>                        "content": cls.extract_all_content(content),<br>                    }<br>                    result.append(msg_user)<br>                elif role == "system":<br>                    flush_assistant_message()<br>                    msg_system: ChatCompletionSystemMessageParam = {<br>                        "role": "system",<br>                        "content": cls.extract_text_content(content),<br>                    }<br>                    result.append(msg_system)<br>                elif role == "developer":<br>                    flush_assistant_message()<br>                    msg_developer: ChatCompletionDeveloperMessageParam = {<br>                        "role": "developer",<br>                        "content": cls.extract_text_content(content),<br>                    }<br>                    result.append(msg_developer)<br>                elif role == "assistant":<br>                    flush_assistant_message()<br>                    msg_assistant: ChatCompletionAssistantMessageParam = {<br>                        "role": "assistant",<br>                        "content": cls.extract_text_content(content),<br>                    }<br>                    result.append(msg_assistant)<br>                else:<br>                    raise UserError(f"Unexpected role in easy_input_message: {role}")<br>            # 2) Check input message<br>            elif in_msg := cls.maybe_input_message(item):<br>                role = in_msg["role"]<br>                content = in_msg["content"]<br>                flush_assistant_message()<br>                if role == "user":<br>                    msg_user = {<br>                        "role": "user",<br>                        "content": cls.extract_all_content(content),<br>                    }<br>                    result.append(msg_user)<br>                elif role == "system":<br>                    msg_system = {<br>                        "role": "system",<br>                        "content": cls.extract_text_content(content),<br>                    }<br>                    result.append(msg_system)<br>                elif role == "developer":<br>                    msg_developer = {<br>                        "role": "developer",<br>                        "content": cls.extract_text_content(content),<br>                    }<br>                    result.append(msg_developer)<br>                else:<br>                    raise UserError(f"Unexpected role in input_message: {role}")<br>            # 3) response output message => assistant<br>            elif resp_msg := cls.maybe_response_output_message(item):<br>                flush_assistant_message()<br>                new_asst = ChatCompletionAssistantMessageParam(role="assistant")<br>                contents = resp_msg["content"]<br>                text_segments = []<br>                for c in contents:<br>                    if c["type"] == "output_text":<br>                        text_segments.append(c["text"])<br>                    elif c["type"] == "refusal":<br>                        new_asst["refusal"] = c["refusal"]<br>                    elif c["type"] == "output_audio":<br>                        # Can't handle this, b/c chat completions expects an ID which we dont have<br>                        raise UserError(<br>                            f"Only audio IDs are supported for chat completions, but got: {c}"<br>                        )<br>                    else:<br>                        raise UserError(f"Unknown content type in ResponseOutputMessage: {c}")<br>                if text_segments:<br>                    combined = "\n".join(text_segments)<br>                    new_asst["content"] = combined<br>                new_asst["tool_calls"] = []<br>                current_assistant_msg = new_asst<br>            # 4) function/file-search calls => attach to assistant<br>            elif file_search := cls.maybe_file_search_call(item):<br>                asst = ensure_assistant_message()<br>                tool_calls = list(asst.get("tool_calls", []))<br>                new_tool_call = ChatCompletionMessageToolCallParam(<br>                    id=file_search["id"],<br>                    type="function",<br>                    function={<br>                        "name": "file_search_call",<br>                        "arguments": json.dumps(<br>                            {<br>                                "queries": file_search.get("queries", []),<br>                                "status": file_search.get("status"),<br>                            }<br>                        ),<br>                    },<br>                )<br>                tool_calls.append(new_tool_call)<br>                asst["tool_calls"] = tool_calls<br>            elif func_call := cls.maybe_function_tool_call(item):<br>                asst = ensure_assistant_message()<br>                tool_calls = list(asst.get("tool_calls", []))<br>                new_tool_call = ChatCompletionMessageToolCallParam(<br>                    id=func_call["call_id"],<br>                    type="function",<br>                    function={<br>                        "name": func_call["name"],<br>                        "arguments": func_call["arguments"],<br>                    },<br>                )<br>                tool_calls.append(new_tool_call)<br>                asst["tool_calls"] = tool_calls<br>            # 5) function call output => tool message<br>            elif func_output := cls.maybe_function_tool_call_output(item):<br>                flush_assistant_message()<br>                msg: ChatCompletionToolMessageParam = {<br>                    "role": "tool",<br>                    "tool_call_id": func_output["call_id"],<br>                    "content": func_output["output"],<br>                }<br>                result.append(msg)<br>            # 6) item reference => handle or raise<br>            elif item_ref := cls.maybe_item_reference(item):<br>                raise UserError(<br>                    f"Encountered an item_reference, which is not supported: {item_ref}"<br>                )<br>            # 7) If we haven't recognized it => fail or ignore<br>            else:<br>                raise UserError(f"Unhandled item type or structure: {item}")<br>        flush_assistant_message()<br>        return result<br>``` |

#### items\_to\_messages`classmethod`

```md-code__content
items_to_messages(
    items: str | Iterable[TResponseInputItem],
) -> list[ChatCompletionMessageParam]

```

Convert a sequence of 'Item' objects into a list of ChatCompletionMessageParam.

Rules:
\- EasyInputMessage or InputMessage (role=user) => ChatCompletionUserMessageParam
\- EasyInputMessage or InputMessage (role=system) => ChatCompletionSystemMessageParam
\- EasyInputMessage or InputMessage (role=developer) => ChatCompletionDeveloperMessageParam
\- InputMessage (role=assistant) => Start or flush a ChatCompletionAssistantMessageParam
\- response\_output\_message => Also produces/flushes a ChatCompletionAssistantMessageParam
\- tool calls get attached to the _current_ assistant message, or create one if none.
\- tool outputs => ChatCompletionToolMessageParam

Source code in `src/agents/models/openai_chatcompletions.py`

|     |     |
| --- | --- |
| ```<br>758<br>759<br>760<br>761<br>762<br>763<br>764<br>765<br>766<br>767<br>768<br>769<br>770<br>771<br>772<br>773<br>774<br>775<br>776<br>777<br>778<br>779<br>780<br>781<br>782<br>783<br>784<br>785<br>786<br>787<br>788<br>789<br>790<br>791<br>792<br>793<br>794<br>795<br>796<br>797<br>798<br>799<br>800<br>801<br>802<br>803<br>804<br>805<br>806<br>807<br>808<br>809<br>810<br>811<br>812<br>813<br>814<br>815<br>816<br>817<br>818<br>819<br>820<br>821<br>822<br>823<br>824<br>825<br>826<br>827<br>828<br>829<br>830<br>831<br>832<br>833<br>834<br>835<br>836<br>837<br>838<br>839<br>840<br>841<br>842<br>843<br>844<br>845<br>846<br>847<br>848<br>849<br>850<br>851<br>852<br>853<br>854<br>855<br>856<br>857<br>858<br>859<br>860<br>861<br>862<br>863<br>864<br>865<br>866<br>867<br>868<br>869<br>870<br>871<br>872<br>873<br>874<br>875<br>876<br>877<br>878<br>879<br>880<br>881<br>882<br>883<br>884<br>885<br>886<br>887<br>888<br>889<br>890<br>891<br>892<br>893<br>894<br>895<br>896<br>897<br>898<br>899<br>900<br>901<br>902<br>903<br>904<br>905<br>906<br>907<br>908<br>909<br>910<br>911<br>912<br>913<br>914<br>915<br>916<br>917<br>918<br>919<br>920<br>921<br>922<br>923<br>924<br>925<br>926<br>927<br>928<br>929<br>930<br>931<br>932<br>933<br>934<br>935<br>936<br>937<br>938<br>939<br>940<br>941<br>942<br>943<br>944<br>945<br>946<br>947<br>948<br>``` | ```md-code__content<br>@classmethod<br>def items_to_messages(<br>    cls,<br>    items: str | Iterable[TResponseInputItem],<br>) -> list[ChatCompletionMessageParam]:<br>    """<br>    Convert a sequence of 'Item' objects into a list of ChatCompletionMessageParam.<br>    Rules:<br>    - EasyInputMessage or InputMessage (role=user) => ChatCompletionUserMessageParam<br>    - EasyInputMessage or InputMessage (role=system) => ChatCompletionSystemMessageParam<br>    - EasyInputMessage or InputMessage (role=developer) => ChatCompletionDeveloperMessageParam<br>    - InputMessage (role=assistant) => Start or flush a ChatCompletionAssistantMessageParam<br>    - response_output_message => Also produces/flushes a ChatCompletionAssistantMessageParam<br>    - tool calls get attached to the _current_ assistant message, or create one if none.<br>    - tool outputs => ChatCompletionToolMessageParam<br>    """<br>    if isinstance(items, str):<br>        return [<br>            ChatCompletionUserMessageParam(<br>                role="user",<br>                content=items,<br>            )<br>        ]<br>    result: list[ChatCompletionMessageParam] = []<br>    current_assistant_msg: ChatCompletionAssistantMessageParam | None = None<br>    def flush_assistant_message() -> None:<br>        nonlocal current_assistant_msg<br>        if current_assistant_msg is not None:<br>            # The API doesn't support empty arrays for tool_calls<br>            if not current_assistant_msg.get("tool_calls"):<br>                del current_assistant_msg["tool_calls"]<br>            result.append(current_assistant_msg)<br>            current_assistant_msg = None<br>    def ensure_assistant_message() -> ChatCompletionAssistantMessageParam:<br>        nonlocal current_assistant_msg<br>        if current_assistant_msg is None:<br>            current_assistant_msg = ChatCompletionAssistantMessageParam(role="assistant")<br>            current_assistant_msg["tool_calls"] = []<br>        return current_assistant_msg<br>    for item in items:<br>        # 1) Check easy input message<br>        if easy_msg := cls.maybe_easy_input_message(item):<br>            role = easy_msg["role"]<br>            content = easy_msg["content"]<br>            if role == "user":<br>                flush_assistant_message()<br>                msg_user: ChatCompletionUserMessageParam = {<br>                    "role": "user",<br>                    "content": cls.extract_all_content(content),<br>                }<br>                result.append(msg_user)<br>            elif role == "system":<br>                flush_assistant_message()<br>                msg_system: ChatCompletionSystemMessageParam = {<br>                    "role": "system",<br>                    "content": cls.extract_text_content(content),<br>                }<br>                result.append(msg_system)<br>            elif role == "developer":<br>                flush_assistant_message()<br>                msg_developer: ChatCompletionDeveloperMessageParam = {<br>                    "role": "developer",<br>                    "content": cls.extract_text_content(content),<br>                }<br>                result.append(msg_developer)<br>            elif role == "assistant":<br>                flush_assistant_message()<br>                msg_assistant: ChatCompletionAssistantMessageParam = {<br>                    "role": "assistant",<br>                    "content": cls.extract_text_content(content),<br>                }<br>                result.append(msg_assistant)<br>            else:<br>                raise UserError(f"Unexpected role in easy_input_message: {role}")<br>        # 2) Check input message<br>        elif in_msg := cls.maybe_input_message(item):<br>            role = in_msg["role"]<br>            content = in_msg["content"]<br>            flush_assistant_message()<br>            if role == "user":<br>                msg_user = {<br>                    "role": "user",<br>                    "content": cls.extract_all_content(content),<br>                }<br>                result.append(msg_user)<br>            elif role == "system":<br>                msg_system = {<br>                    "role": "system",<br>                    "content": cls.extract_text_content(content),<br>                }<br>                result.append(msg_system)<br>            elif role == "developer":<br>                msg_developer = {<br>                    "role": "developer",<br>                    "content": cls.extract_text_content(content),<br>                }<br>                result.append(msg_developer)<br>            else:<br>                raise UserError(f"Unexpected role in input_message: {role}")<br>        # 3) response output message => assistant<br>        elif resp_msg := cls.maybe_response_output_message(item):<br>            flush_assistant_message()<br>            new_asst = ChatCompletionAssistantMessageParam(role="assistant")<br>            contents = resp_msg["content"]<br>            text_segments = []<br>            for c in contents:<br>                if c["type"] == "output_text":<br>                    text_segments.append(c["text"])<br>                elif c["type"] == "refusal":<br>                    new_asst["refusal"] = c["refusal"]<br>                elif c["type"] == "output_audio":<br>                    # Can't handle this, b/c chat completions expects an ID which we dont have<br>                    raise UserError(<br>                        f"Only audio IDs are supported for chat completions, but got: {c}"<br>                    )<br>                else:<br>                    raise UserError(f"Unknown content type in ResponseOutputMessage: {c}")<br>            if text_segments:<br>                combined = "\n".join(text_segments)<br>                new_asst["content"] = combined<br>            new_asst["tool_calls"] = []<br>            current_assistant_msg = new_asst<br>        # 4) function/file-search calls => attach to assistant<br>        elif file_search := cls.maybe_file_search_call(item):<br>            asst = ensure_assistant_message()<br>            tool_calls = list(asst.get("tool_calls", []))<br>            new_tool_call = ChatCompletionMessageToolCallParam(<br>                id=file_search["id"],<br>                type="function",<br>                function={<br>                    "name": "file_search_call",<br>                    "arguments": json.dumps(<br>                        {<br>                            "queries": file_search.get("queries", []),<br>                            "status": file_search.get("status"),<br>                        }<br>                    ),<br>                },<br>            )<br>            tool_calls.append(new_tool_call)<br>            asst["tool_calls"] = tool_calls<br>        elif func_call := cls.maybe_function_tool_call(item):<br>            asst = ensure_assistant_message()<br>            tool_calls = list(asst.get("tool_calls", []))<br>            new_tool_call = ChatCompletionMessageToolCallParam(<br>                id=func_call["call_id"],<br>                type="function",<br>                function={<br>                    "name": func_call["name"],<br>                    "arguments": func_call["arguments"],<br>                },<br>            )<br>            tool_calls.append(new_tool_call)<br>            asst["tool_calls"] = tool_calls<br>        # 5) function call output => tool message<br>        elif func_output := cls.maybe_function_tool_call_output(item):<br>            flush_assistant_message()<br>            msg: ChatCompletionToolMessageParam = {<br>                "role": "tool",<br>                "tool_call_id": func_output["call_id"],<br>                "content": func_output["output"],<br>            }<br>            result.append(msg)<br>        # 6) item reference => handle or raise<br>        elif item_ref := cls.maybe_item_reference(item):<br>            raise UserError(<br>                f"Encountered an item_reference, which is not supported: {item_ref}"<br>            )<br>        # 7) If we haven't recognized it => fail or ignore<br>        else:<br>            raise UserError(f"Unhandled item type or structure: {item}")<br>    flush_assistant_message()<br>    return result<br>``` |

## Span Class Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/spans/#spans)

# `Spans`

### Span

Bases: `ABC`, `Generic[TSpanData]`

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>33<br>34<br>35<br>36<br>37<br>38<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>48<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>58<br>59<br>60<br>61<br>62<br>63<br>64<br>65<br>66<br>67<br>68<br>69<br>70<br>71<br>72<br>73<br>74<br>75<br>76<br>77<br>78<br>79<br>80<br>81<br>82<br>83<br>84<br>85<br>86<br>87<br>88<br>89<br>90<br>91<br>92<br>93<br>``` | ```md-code__content<br>class Span(abc.ABC, Generic[TSpanData]):<br>    @property<br>    @abc.abstractmethod<br>    def trace_id(self) -> str:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def span_id(self) -> str:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def span_data(self) -> TSpanData:<br>        pass<br>    @abc.abstractmethod<br>    def start(self, mark_as_current: bool = False):<br>        """<br>        Start the span.<br>        Args:<br>            mark_as_current: If true, the span will be marked as the current span.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def finish(self, reset_current: bool = False) -> None:<br>        """<br>        Finish the span.<br>        Args:<br>            reset_current: If true, the span will be reset as the current span.<br>        """<br>        pass<br>    @abc.abstractmethod<br>    def **enter**(self) -> Span[TSpanData]:<br>        pass<br>    @abc.abstractmethod<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def parent_id(self) -> str | None:<br>        pass<br>    @abc.abstractmethod<br>    def set_error(self, error: SpanError) -> None:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def error(self) -> SpanError | None:<br>        pass<br>    @abc.abstractmethod<br>    def export(self) -> dict[str, Any] | None:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def started_at(self) -> str | None:<br>        pass<br>    @property<br>    @abc.abstractmethod<br>    def ended_at(self) -> str | None:<br>        pass<br>``` |

#### start`abstractmethod`

```md-code__content
start(mark_as_current: bool = False)

```

Start the span.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `mark_as_current` | `bool` | If true, the span will be marked as the current span. | `False` |

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>39<br>40<br>41<br>42<br>43<br>44<br>45<br>46<br>47<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def start(self, mark_as_current: bool = False):<br>    """<br>    Start the span.<br>    Args:<br>        mark_as_current: If true, the span will be marked as the current span.<br>    """<br>    pass<br>``` |

#### finish`abstractmethod`

```md-code__content
finish(reset_current: bool = False) -> None

```

Finish the span.

Parameters:

| Name | Type | Description | Default |
| --- | --- | --- | --- |
| `reset_current` | `bool` | If true, the span will be reset as the current span. | `False` |

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>49<br>50<br>51<br>52<br>53<br>54<br>55<br>56<br>57<br>``` | ```md-code__content<br>@abc.abstractmethod<br>def finish(self, reset_current: bool = False) -> None:<br>    """<br>    Finish the span.<br>    Args:<br>        reset_current: If true, the span will be reset as the current span.<br>    """<br>    pass<br>``` |

### NoOpSpan

Bases: `Span[TSpanData]`

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br> 96<br> 97<br> 98<br> 99<br>100<br>101<br>102<br>103<br>104<br>105<br>106<br>107<br>108<br>109<br>110<br>111<br>112<br>113<br>114<br>115<br>116<br>117<br>118<br>119<br>120<br>121<br>122<br>123<br>124<br>125<br>126<br>127<br>128<br>129<br>130<br>131<br>132<br>133<br>134<br>135<br>136<br>137<br>138<br>139<br>140<br>141<br>142<br>143<br>144<br>145<br>146<br>147<br>148<br>149<br>150<br>151<br>152<br>153<br>154<br>155<br>156<br>``` | ```md-code__content<br>class NoOpSpan(Span[TSpanData]):<br>    **slots** = ("_span_data", "_prev_span_token")<br>    def **init**(self, span_data: TSpanData):<br>        self._span_data = span_data<br>        self._prev_span_token: contextvars.Token[Span[TSpanData] | None] | None = None<br>    @property<br>    def trace_id(self) -> str:<br>        return "no-op"<br>    @property<br>    def span_id(self) -> str:<br>        return "no-op"<br>    @property<br>    def span_data(self) -> TSpanData:<br>        return self._span_data<br>    @property<br>    def parent_id(self) -> str | None:<br>        return None<br>    def start(self, mark_as_current: bool = False):<br>        if mark_as_current:<br>            self._prev_span_token = Scope.set_current_span(self)<br>    def finish(self, reset_current: bool = False) -> None:<br>        if reset_current and self._prev_span_token is not None:<br>            Scope.reset_current_span(self._prev_span_token)<br>            self._prev_span_token = None<br>    def **enter**(self) -> Span[TSpanData]:<br>        self.start(mark_as_current=True)<br>        return self<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        reset_current = True<br>        if exc_type is GeneratorExit:<br>            logger.debug("GeneratorExit, skipping span reset")<br>            reset_current = False<br>        self.finish(reset_current=reset_current)<br>    def set_error(self, error: SpanError) -> None:<br>        pass<br>    @property<br>    def error(self) -> SpanError | None:<br>        return None<br>    def export(self) -> dict[str, Any] | None:<br>        return None<br>    @property<br>    def started_at(self) -> str | None:<br>        return None<br>    @property<br>    def ended_at(self) -> str | None:<br>        return None<br>``` |

### SpanImpl

Bases: `Span[TSpanData]`

Source code in `src/agents/tracing/spans.py`

|     |     |
| --- | --- |
| ```<br>159<br>160<br>161<br>162<br>163<br>164<br>165<br>166<br>167<br>168<br>169<br>170<br>171<br>172<br>173<br>174<br>175<br>176<br>177<br>178<br>179<br>180<br>181<br>182<br>183<br>184<br>185<br>186<br>187<br>188<br>189<br>190<br>191<br>192<br>193<br>194<br>195<br>196<br>197<br>198<br>199<br>200<br>201<br>202<br>203<br>204<br>205<br>206<br>207<br>208<br>209<br>210<br>211<br>212<br>213<br>214<br>215<br>216<br>217<br>218<br>219<br>220<br>221<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>235<br>236<br>237<br>238<br>239<br>240<br>241<br>242<br>243<br>244<br>245<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261<br>262<br>263<br>264<br>``` | ```md-code__content<br>class SpanImpl(Span[TSpanData]):<br>    **slots** = (<br>        "_trace_id",<br>        "_span_id",<br>        "_parent_id",<br>        "_started_at",<br>        "_ended_at",<br>        "_error",<br>        "_prev_span_token",<br>        "_processor",<br>        "_span_data",<br>    )<br>    def **init**(<br>        self,<br>        trace_id: str,<br>        span_id: str | None,<br>        parent_id: str | None,<br>        processor: TracingProcessor,<br>        span_data: TSpanData,<br>    ):<br>        self._trace_id = trace_id<br>        self._span_id = span_id or util.gen_span_id()<br>        self._parent_id = parent_id<br>        self._started_at: str | None = None<br>        self._ended_at: str | None = None<br>        self._processor = processor<br>        self._error: SpanError | None = None<br>        self._prev_span_token: contextvars.Token[Span[TSpanData] | None] | None = None<br>        self._span_data = span_data<br>    @property<br>    def trace_id(self) -> str:<br>        return self._trace_id<br>    @property<br>    def span_id(self) -> str:<br>        return self._span_id<br>    @property<br>    def span_data(self) -> TSpanData:<br>        return self._span_data<br>    @property<br>    def parent_id(self) -> str | None:<br>        return self._parent_id<br>    def start(self, mark_as_current: bool = False):<br>        if self.started_at is not None:<br>            logger.warning("Span already started")<br>            return<br>        self._started_at = util.time_iso()<br>        self._processor.on_span_start(self)<br>        if mark_as_current:<br>            self._prev_span_token = Scope.set_current_span(self)<br>    def finish(self, reset_current: bool = False) -> None:<br>        if self.ended_at is not None:<br>            logger.warning("Span already finished")<br>            return<br>        self._ended_at = util.time_iso()<br>        self._processor.on_span_end(self)<br>        if reset_current and self._prev_span_token is not None:<br>            Scope.reset_current_span(self._prev_span_token)<br>            self._prev_span_token = None<br>    def **enter**(self) -> Span[TSpanData]:<br>        self.start(mark_as_current=True)<br>        return self<br>    def **exit**(self, exc_type, exc_val, exc_tb):<br>        reset_current = True<br>        if exc_type is GeneratorExit:<br>            logger.debug("GeneratorExit, skipping span reset")<br>            reset_current = False<br>        self.finish(reset_current=reset_current)<br>    def set_error(self, error: SpanError) -> None:<br>        self._error = error<br>    @property<br>    def error(self) -> SpanError | None:<br>        return self._error<br>    @property<br>    def started_at(self) -> str | None:<br>        return self._started_at<br>    @property<br>    def ended_at(self) -> str | None:<br>        return self._ended_at<br>    def export(self) -> dict[str, Any] | None:<br>        return {<br>            "object": "trace.span",<br>            "id": self.span_id,<br>            "trace_id": self.trace_id,<br>            "parent_id": self._parent_id,<br>            "started_at": self._started_at,<br>            "ended_at": self._ended_at,<br>            "span_data": self.span_data.export(),<br>            "error": self._error,<br>        }<br>``` |

## Handoff Prompt Instructions

[Skip to content](https://openai.github.io/openai-agents-python/ref/extensions/handoff_prompt/#handoff-prompt)

# `Handoff prompt`

### RECOMMENDED\_PROMPT\_PREFIX`module-attribute`

```md-code__content
RECOMMENDED_PROMPT_PREFIX = "# System context\nYou are part of a multi-agent system called the Agents SDK, designed to make agent coordination and execution easy. Agents uses two primary abstraction: **Agents** and **Handoffs**. An agent encompasses instructions and tools and can hand off a conversation to another agent when appropriate. Handoffs are achieved by calling a handoff function, generally named `transfer_to_<agent_name>`. Transfers between agents are handled seamlessly in the background; do not mention or draw attention to these transfers in your conversation with the user.\n"

```

### prompt\_with\_handoff\_instructions

```md-code__content
prompt_with_handoff_instructions(prompt: str) -> str

```

Add recommended instructions to the prompt for agents that use handoffs.

Source code in `src/agents/extensions/handoff_prompt.py`

|     |     |
| --- | --- |
| ```<br>15<br>16<br>17<br>18<br>19<br>``` | ```md-code__content<br>def prompt_with_handoff_instructions(prompt: str) -> str:<br>    """<br>    Add recommended instructions to the prompt for agents that use handoffs.<br>    """<br>    return f"{RECOMMENDED_PROMPT_PREFIX}\n\n{prompt}"<br>``` |

## Tracing Utility Functions

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/util/#util)

# `Util`

### time\_iso

```md-code__content
time_iso() -> str

```

Returns the current time in ISO 8601 format.

Source code in `src/agents/tracing/util.py`

|     |     |
| --- | --- |
| ```<br>5<br>6<br>7<br>``` | ```md-code__content<br>def time_iso() -> str:<br>    """Returns the current time in ISO 8601 format."""<br>    return datetime.now(timezone.utc).isoformat()<br>``` |

### gen\_trace\_id

```md-code__content
gen_trace_id() -> str

```

Generates a new trace ID.

Source code in `src/agents/tracing/util.py`

|     |     |
| --- | --- |
| ```<br>10<br>11<br>12<br>``` | ```md-code__content<br>def gen_trace_id() -> str:<br>    """Generates a new trace ID."""<br>    return f"trace_{uuid.uuid4().hex}"<br>``` |

### gen\_span\_id

```md-code__content
gen_span_id() -> str

```

Generates a new span ID.

Source code in `src/agents/tracing/util.py`

|     |     |
| --- | --- |
| ```<br>15<br>16<br>17<br>``` | ```md-code__content<br>def gen_span_id() -> str:<br>    """Generates a new span ID."""<br>    return f"span_{uuid.uuid4().hex[:24]}"<br>``` |

## Handoff Filters

[Skip to content](https://openai.github.io/openai-agents-python/ref/extensions/handoff_filters/#handoff-filters)

# `Handoff filters`

### remove\_all\_tools

```md-code__content
remove_all_tools(
    handoff_input_data: HandoffInputData,
) -> HandoffInputData

```

Filters out all tool items: file search, web search and function calls+output.

Source code in `src/agents/extensions/handoff_filters.py`

|     |     |
| --- | --- |
| ```<br>16<br>17<br>18<br>19<br>20<br>21<br>22<br>23<br>24<br>25<br>26<br>27<br>28<br>29<br>30<br>31<br>32<br>``` | ```md-code__content<br>def remove_all_tools(handoff_input_data: HandoffInputData) -> HandoffInputData:<br>    """Filters out all tool items: file search, web search and function calls+output."""<br>    history = handoff_input_data.input_history<br>    new_items = handoff_input_data.new_items<br>    filtered_history = (<br>        _remove_tool_types_from_input(history) if isinstance(history, tuple) else history<br>    )<br>    filtered_pre_handoff_items = _remove_tools_from_items(handoff_input_data.pre_handoff_items)<br>    filtered_new_items = _remove_tools_from_items(new_items)<br>    return HandoffInputData(<br>        input_history=filtered_history,<br>        pre_handoff_items=filtered_pre_handoff_items,<br>        new_items=filtered_new_items,<br>    )<br>``` |

## OpenAI Agents Scope

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/scope/#scope)

# `Scope`

## Span Data Overview

[Skip to content](https://openai.github.io/openai-agents-python/ref/tracing/span_data/#span-data)

# `Span data`

## 404 Not Found

# 404 - Not found
