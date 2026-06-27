import { EvalTestParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";
import { ChatCompletionCreateParams, getReasoning } from "../../source/chat-completion.ts";

export function test({ chatCompletionMessage: message }: EvalTestParams) {
  const content = message.content;
  assert.isNotNullish(content);

  const referencesNumbers = (text: string) => /37/.test(text) && /84/.test(text);

  assert.or(
    () => assert.ok(referencesNumbers(content)),
    () => {
      const reasoning = getReasoning(message);
      assert.isNotNullish(reasoning);
      assert.ok(referencesNumbers(reasoning));
    },
  );
}

export const json: ChatCompletionCreateParams = {
  messages: [
    {
      role: "user",
      content:
        "Think of 2 numbers. Dont tell me. I am trying to test the thinking capabilities of this harness. Choose between 1 and 100. I will ask you questions and you better keep them in mind",
    },
    {
      role: "assistant",
      reasoning_content:
        'The user wants me to think of 2 numbers between 1 and 100 and keep them in mind for a guessing game. Let me pick two numbers. I\'ll choose 37 and 84. I\'ll keep these in my "memory" (my context) so I can answer questions about them.',
      content:
        "Got it. I've picked two numbers between 1 and 100 and I'm keeping them in mind. Go ahead and ask your questions.",
    },
    {
      role: "user",
      content: "is 50 between them?",
    },
  ],
  chat_template_kwargs: {
    clear_thinking: false,
  },
};
