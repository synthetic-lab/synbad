import * as assert from "../../source/asserts.ts";
import { ChatResponse, getReasoning } from "../../source/chat-completion.ts";

export function test(response: ChatResponse) {
  const reasoning = getReasoning(response.choices[0].message);
  assert.isNotNullish(reasoning);
}

export const json = {
  messages: [
    { role: "user", content: "Why does 1+1=2?" }
  ],
}
