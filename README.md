![Synbad the legendary sailor](./synbad.png)

Synbad is a tool for detecting bugs in LLM inference providers, especially
open-source ones. Synbad is maintained by
[Synthetic](https://synthetic.new), as part of our efforts to keep our
inference quality as high as possible.

If you find bugs in Synthetic's model hosting, please contribute the bugs here!
We will fix them.

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
import { ChatResponse } from "../../source/chat-completion.ts";

export function test(response: ChatResponse) {
  const reasoning = response.choices[0].message.reasoning_content;
  assert.isNotNullish(reasoning);
}

export const json = {
  messages: [
    { role: "user", content: "Why does 1+1=2?" },
  ],
}
```

The `asserts.ts` file re-exports all of the built-in NodeJS assertion
functions, and also adds a few extra ones, e.g. `isNotNullish` which checks
whether an object is `null` or `undefined`.

To run your new eval, use the `synbad.sh` script in this repo. Assuming you're
testing the `evals/reasoning/reasoning-parsing` test, for GLM-4.6 on Synthetic,
and you want to run it 5 times since it isn't consistently failing:

```bash
synbad.sh --env-var SYNTHETIC_API_KEY \
  --base-url "https://api.synthetic.new/openai/v1" \
  --only evals/reasoning/reasoning-parsing \
  --model "hf:zai-org/GLM-4.6" \
  --count 5
```

## Running Synbad

First, install it:

```bash
npm install synbad
```

Then run:

```bash
synbad --env-var SYNTHETIC_API_KEY \
  --base-url "https://api.synthetic.new/openai/v1" \
  --model "hf:zai-org/GLM-4.6"
```
