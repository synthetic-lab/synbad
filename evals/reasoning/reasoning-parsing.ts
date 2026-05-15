import * as assert from "../../source/asserts.ts";
import { EvalTestParams } from "../../source/evals.ts";
import { ChatCompletionCreateParams, getReasoning } from "../../source/chat-completion.ts";

export function test({ chatCompletionMessage: message }: EvalTestParams) {
  const reasoning = getReasoning(message);
  assert.isNotNullish(reasoning);
}

export const json: ChatCompletionCreateParams = {
  messages: [
    { role: "user", content: "Why does 1+1=2?" }
  ],
}
