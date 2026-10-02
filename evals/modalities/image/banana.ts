import fs from "fs";
import path from "path";
import * as assert from "../../../source/asserts.ts";
import { EvalTestParams } from "../../../source/evals.ts";
import { ChatCompletionCreateParams } from "../../../source/chat-completion.ts";

// Public domain image (by Titus Tscharntke), from:
// https://commons.wikimedia.org/wiki/File:Banana_fruit_on_white_background.jpg
//
// The build (synbad.sh / npm run build) copies banana.png next to the
// compiled module in dist/, so we can reference it relative to this file.
const imagePath = path.join(import.meta.dirname, "banana.png");
const imageDataUrl = `data:image/png;base64,${fs.readFileSync(imagePath).toString("base64")}`;

export function test({ chatCompletionMessage: message }: EvalTestParams) {
  assert.isNotNullish(message.content);
  assert.match(message.content, /banana/i);
}

export const json: ChatCompletionCreateParams = {
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What is the object in this image?" },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ],
};
