![Synbad the legendary sailor](https://raw.githubusercontent.com/synthetic-lab/synbad/main/synbad.png)

Synbad is a tool for detecting bugs in LLM inference providers, especially
open-source ones. Synbad is maintained by
[Synthetic](https://synthetic.new), as part of our efforts to keep our
inference quality as high as possible.

If you find bugs in Synthetic's model hosting, please contribute the bugs here!
We will fix them.

## Install

Synbad is distributed through npm. Install it with:

```bash
npm install -g @syntheticlab/synbad
```

## Results

We keep a running tally of provider+model results for tool calling and
reasoning parsing for GLM-4.7, Kimi K2 Thinking, and MiniMax M2. Feel free to
add more provider results!

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Synthetic.new|GLM-4.7         |:white_check_mark: 100%|
|Synthetic.new|Kimi K2 Thinking|:white_check_mark: 100%|
|Synthetic.new|MiniMax M2      |:white_check_mark: 100%|

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Fireworks|GLM-4.7         |:x: 83%|
|Fireworks|Kimi K2 Thinking|:x: 92%|
|Fireworks|MiniMax M2      |:white_check_mark: 100%|

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Together |Kimi K2 Thinking|:x: 66%|

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Parasail |GLM-4.7         |:x: 83%|
|Parasail |Kimi K2 Thinking|:x: 75%|

Note for attempting reproductions: generally all tests are reproducible with
`--count 1` and `--count 1 --stream`, but for evaluating the
response-in-reasoning eval, you generally will need a high count to reproduce
the bug: `--count 40` and `--count 40 --stream` typically is sufficient.

All evals must pass both with and without Synbad's `--stream` parameter (which
tests streaming APIs) to be considered a pass.

## How do I contribute inference bugs?

If you already have some problematic JSON, head over to the
[Contributing](#Contributing) section. If you don't, don't worry! Synbad makes
it easy to capture the problematic JSON you're encountering.

First, run the Synbad Proxy, specifying the local port you want to use and the
inference host you want to target. For example, to forward requests from
`localhost:3000` to Synthetic's API, you'd do:

```bash
synbad proxy -p 3000 -t https://api.synthetic.new/openai/v1
```

Then, configure your coding agent — or whichever local tool you're using — to
point to `http://localhost:3000` (or whichever port you selected). The Synbad
Proxy will log all request bodies to `stdout`, so all you need to do is
reproduce the bug by using your tool or coding agent, and then copy the JSON it
printed to `stdout`.

Now you have reproducible JSON to file a bug via Synbad!

## Contributing

First, clone this repo from Github. Then `cd` into it and run:

```bash
npm install
```

All inference evals are stored in the `evals/` directory. They're written in
TypeScript. You need to export two things from an eval:

1. The JSON that reproduces the problem, as the const `json`. It doesn't have to
   reproduce it 100% of the time; if the bug appears even 5% of the time,
   that's fine.
2. A `test` function that runs some asserts on the returned assistant message,
   which detect the error.

For example, we can test parallel tool call support very simply (as we do in the
`evals/tools/parallel-tool.ts` file):

```typescript
import * as assert from "../../source/asserts.ts";
import { ChatMessage } from "../../source/chat-completion.ts";

export function test({ tool_calls }: ChatMessage) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 2);
}

export const json = {
  "messages": [
    {"role": "user", "content": "What's the weather in Paris and London?"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name"
            }
          },
          "required": ["location"]
        }
      }
    }
  ],
  "parallel_tool_calls": true,
  "tool_choice": "auto",
}
```

The `asserts.ts` file re-exports all of the built-in NodeJS assertion
functions, and also adds a few extra ones, e.g. `isNotNullish` which checks
whether an object is `null` or `undefined`.

To run your new eval, use the `synbad.sh` script in this repo, which
auto-recompiles everything (including your new test!) before running the evals.
Assuming you're testing the `evals/reasoning/reasoning-parsing` test, for
GLM-4.7 on Synthetic, and you want to run it 5 times since it isn't
consistently failing:

```bash
./synbad.sh eval --env-var SYNTHETIC_API_KEY \
  --base-url "https://api.synthetic.new/openai/v1" \
  --only evals/reasoning/reasoning-parsing \
  --model "hf:zai-org/GLM-4.7" \
  --count 5
```

### Handling reasoning parsing

The OpenAI spec didn't originally include reasoning content parsing, since the
original OpenAI models didn't reason. The open-source community added support
for reasoning later, but there are two competing specs:

1. Storing the reasoning content in `message.reasoning_content`, or
2. Storing the reasoning content in `message.reasoning`.

To make sure your evals work with a wider range of inference providers, use
the `getReasoning` function when testing reasoning parsing like so:

```typescript
import { getReasoning } from "../../source/chat-completion.ts";

// In your test:

const reasoning = getReasoning(message);
```

This ensures your test will use the correct reasoning content data regardless
of which spec the underlying inference provider is using.

## Running Synbad

First, install it:

```bash
npm install -g @syntheticlab/synbad
```

You have two modes, `proxy` and `eval`. The `proxy` mode is used to capture
inference requests and responses, while the `eval` mode is used to run evals
against a specific inference provider.

When troubleshooting and asked to provide reproduction steps, you will typically want to run
the `Proxy` mode first to capture the problematic JSON:

```bash
synbad proxy -p 8080 -t https://api.synthetic.new/anthropic
```
Then in another terminal point your coding agent or tool to `http://localhost:8080` and reproduce the
issue. For example with claude code:
```bash
   export ANTHROPIC_BASE_URL="http://localhost:8080"
   export ANTHROPIC_AUTH_TOKEN=${SYNTHETIC_API_KEY} 
   export ANTHROPIC_DEFAULT_OPUS_MODEL=hf:moonshotai/Kimi-K2.5
   export ANTHROPIC_DEFAULT_SONNET_MODEL=hf:zai-org/GLM-4.7 
   expot ANTHROPIC_DEFAULT_HAIKU_MODEL=hf:zai-org/GLM-4.7 
   export CLAUDE_CODE_SUBAGENT_MODEL=hf:zai-org/GLM-4.7 
   export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
   claude
```


```bash
synbad eval --env-var SYNTHETIC_API_KEY \
  --base-url "https://api.synthetic.new/openai/v1" \
  --model "hf:zai-org/GLM-4.7"
```
