import * as assert from "../../source/asserts.ts";
import { ChatCompletionCreateParams } from "../../source/chat-completion.ts";
import { EvalTestParams } from "../../source/evals.ts";

const prefix = '{"content":"1,2,3,4,5,';

export function test({ chatCompletionMessage: message }: EvalTestParams) {
  assert.isNotNullish(message.content);
  assert.ok(message.content.length > 0, "Expected a continuation in assistant content");
  assert.isEmptyArray(message.tool_calls ?? []);
  assert.deepStrictEqual(JSON.parse(prefix + message.content), {
    content: "1,2,3,4,5,6,7,8,9,10",
  });
}

export const json: ChatCompletionCreateParams = {
  messages: [
    {
      role: "user",
      content: 'Count from 1 through 10 in ascending order. Return a JSON object with a single "content" field containing the numbers as a comma-separated string with no spaces. Do not include markdown or explanations.',
    },
    {
      role: "assistant",
      content: prefix,
    },
  ],
  continue_final_message: true,
  max_tokens: 4096,
};

