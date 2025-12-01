![Synbad the legendary pirate](./synbad.png)

Synbad is a tool for detecting bugs in LLM inference providers, especially
open-source ones. Synbad is maintained by
[Synthetic](https://synthetic.new), as part of our efforts to keep our
inference quality as high as possible.

If you find bugs in Synthetic's model hosting, please contribute the bugs here!
We will fix them.

## Contributing

All inference evals are stored in the `evals/` directory. They're written in
TypeScript. You need to export two things from an eval:

1. The JSON that reproduces the error, as the const `json`. It doesn't have to
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
