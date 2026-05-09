import * as assert from "../../source/asserts.ts";
import { EvalParams } from "../../source/evals.ts";
import { getReasoning } from "../../source/chat-completion.ts";

export function test({ chatCompletionMessage: message }: EvalParams) {
  const reasoning = getReasoning(message);
  assert.isNotNullish(reasoning);
}

export const json = {
  messages: [
    { role: "user", content: "Why does 1+1=2?" },
    {
      role: "assistant",
      reasoning_content: "Because it does",
      content: "Consider the successor function",
    },
    { role: "user", content: "please explain that much more deeply" },
  ],
}
