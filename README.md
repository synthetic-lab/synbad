![Synbad the legendary sailor](https://raw.githubusercontent.com/synthetic-lab/synbad/main/synbad.png)

Synbad is a tool for detecting bugs in LLM inference providers, especially
open-source ones. Synbad is maintained by
[Synthetic](https://synthetic.new), as part of our efforts to keep our
inference quality as high as possible.

If you find bugs in Synthetic's model hosting, please contribute the bugs here!
We will fix them.

## Results

We keep a running tally of provider+model results for GLM-4.6, Kimi K2
Thinking, and MiniMax M2. Feel free to add more provider results!

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Synthetic|GLM-4.6         |:white_check_mark: 100%|
|Synthetic|Kimi K2 Thinking|:white_check_mark: 100%|
|Synthetic|MiniMax M2      |:white_check_mark: 100%|

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Fireworks|GLM-4.6         |:white_check_mark: 100%|
|Fireworks|Kimi K2 Thinking|:x: 88%|
|Fireworks|MiniMax M2      |:x: 29%|

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Together |GLM-4.6         |:white_check_mark: 100%|
|Together |Kimi K2 Thinking|:x: 75%|

|Provider |Model           |Success Rate|
|---------|----------------|------------|
|Parasail |GLM-4.6         |:x: 71%|
|Parasail |Kimi K2 Thinking|:x: 62%|

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
2. A `test` function that runs some asserts on the output of the response,
   which detect the error.

For example, we can test reasoning parsing very simply (as we do in the
`evals/reasoning/reasoning-parsing.ts` file):

```typescript
import * as assert from "../../source/asserts.ts";
import { ChatResponse, getReasoning } from "../../source/chat-completion.ts";

export function test(response: ChatResponse) {
  const reasoning = getReasoning(response.choices[0].message);
  assert.isNotNullish(reasoning);
}

// Insert your JSON. You can paste your results from the Synbad proxy here.
export const json = {
  messages: [
    { role: "user", content: "Why does 1+1=2?" }
  ],
}
```

The `asserts.ts` file re-exports all of the built-in NodeJS assertion
functions, and also adds a few extra ones, e.g. `isNotNullish` which checks
whether an object is `null` or `undefined`.

To run your new eval, use the `synbad.sh` script in this repo, which
auto-recompiles everything (including your new test!) before running the evals.
Assuming you're testing the `evals/reasoning/reasoning-parsing` test, for
GLM-4.6 on Synthetic, and you want to run it 5 times since it isn't
consistently failing:

```bash
./synbad.sh eval --env-var SYNTHETIC_API_KEY \
  --base-url "https://api.synthetic.new/openai/v1" \
  --only evals/reasoning/reasoning-parsing \
  --model "hf:zai-org/GLM-4.6" \
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

const reasoning = getReasoning(response.choices[0].message);
```

This ensures your test will use the correct reasoning content data regardless
of which spec the underlying inference provider is using.

## Running Synbad

First, install it:

```bash
npm install -g @syntheticlab/synbad
```

Then run:

```bash
synbad eval --env-var SYNTHETIC_API_KEY \
  --base-url "https://api.synthetic.new/openai/v1" \
  --model "hf:zai-org/GLM-4.6"
```
