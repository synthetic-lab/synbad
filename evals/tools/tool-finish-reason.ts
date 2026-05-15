import { EvalTestParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";
import { ChatCompletionChunk } from "openai/resources";
import { ChatCompletionCreateParams } from "../../source/chat-completion.ts";

export function test({ chatCompletionChunks }: EvalTestParams) {
  if(chatCompletionChunks !== undefined) {
    assert.isNotEmptyArray(chatCompletionChunks);

    let lastFinishReason: ChatCompletionChunk.Choice["finish_reason"]  | null = null;
    for(const chunk of chatCompletionChunks) {
      for(const choice of chunk.choices) {
        if(choice.finish_reason != null) {
          lastFinishReason = choice.finish_reason;
        }
      }
    }
    assert.strictEqual(lastFinishReason, "tool_calls");
  }
}

export const json: ChatCompletionCreateParams = {
  "messages": [
    {
      "role": "user",
      "content": "What is the weather in San Francisco?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get the current weather for a location.",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
};
