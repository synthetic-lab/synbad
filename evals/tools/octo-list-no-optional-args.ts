import { EvalParams } from "../../source/evals.ts";
import * as assert from "../../source/asserts.ts";

export function test({ chatCompletionMessage: { tool_calls } }: EvalParams) {
  assert.isNotNullish(tool_calls);
  assert.isNotEmptyArray(tool_calls);
  assert.strictEqual(tool_calls.length, 1);
  assert.strictEqual(tool_calls[0].type, "function");
  const parsed = JSON.parse(tool_calls[0].function.arguments);
  assert.or(
    () => assert.isNullish(parsed),
    () => assert.deepEqual(parsed, {}),
    () => assert.isNullish(parsed.dirPath),
    () => assert.strictEqual(parsed.dirPath, ""),
  );
}

export const json = {
  "messages":[
    {
      "role":"system",
      "content":"You are a coding assistant called Octo."
    },
    {
      "role":"user",
      "content":"call the list tool with no args"
    }
  ],
  tools: [
    {
      "type":"function",
      "function":{
        "name":"append",
        "description":"The append tool",
        "parameters":{
          "type":"object",
          "required":["filePath","text"],
          "properties":{
            "filePath":{
              "description":"The path to the file",
              "type":"string"
            },
            "text":{
              "description":"The text to append",
              "type":"string"
            }
          }
        },
        "strict":true
      }
    },
    {
      "type":"function",
      "function":{
        "name":"create",
        "description":"The create tool",
        "parameters":{
          "type":"object",
          "required":["filePath","content"],
          "properties":{
            "filePath":{
              "description":"Path where the file should be created",
              "type":"string"
            },"content":{
              "description":"Content to write to the file",
              "type":"string"
            }
          }
        },
        "strict":true
      }
    },
    {"type":"function","function":{"name":"edit","description":"The edit tool","parameters":{"type":"object","required":["filePath","search","replace"],"properties":{"filePath":{"description":"The path to the file","type":"string"},"search":{"description":"The search string to replace. Must EXACTLY match the text you intend to replace, including\nwhitespace, punctuation, etc. Make sure to give a few lines of context above and below so you\ndon't accidentally replace a different matching substring in the same file.","type":"string"},"replace":{"description":"The string you want to insert into the file","type":"string"}}},"strict":true}},
    {"type":"function","function":{"name":"fetch","description":"The fetch tool","parameters":{"type":"object","required":["url"],"properties":{"url":{"description":"Full url to fetch, e.g. https://...","type":"string"},"includeMarkup":{"description":"Include the HTML markup? Defaults to false. By default or when set to false, markup will be\nstripped and converted to plain text. Prefer markup stripping, and only set this to true if the\noutput is confusing: otherwise you may download a massive amount of data","type":"boolean"}}},"strict":true}},
    {"type":"function","function":{"name":"list","description":"The list tool","parameters":{"type":"object","required":[],"properties":{"dirPath":{"description":"Path to the directory","type":"string"}}},"strict":true}},
    {"type":"function","function":{"name":"prepend","description":"The prepend tool","parameters":{"type":"object","required":["filePath","text"],"properties":{"filePath":{"description":"The path to the file","type":"string"},"text":{"description":"The text to prepend","type":"string"}}},"strict":true}},
    {"type":"function","function":{"name":"read","description":"The read tool","parameters":{"type":"object","required":["filePath"],"properties":{"filePath":{"description":"Path to file to read","type":"string"}}},"strict":true}},
    {"type":"function","function":{"name":"rewrite","description":"The rewrite tool","parameters":{"type":"object","required":["filePath","text"],"properties":{"filePath":{"description":"The path to the file","type":"string"},"text":{"description":"The replaced file contents. This will rewrite and replace the entire file","type":"string"}}},"strict":true}},
    {"type":"function","function":{"name":"shell","description":"The shell tool","parameters":{"type":"object","required":["timeout","cmd"],"properties":{"timeout":{"description":"A timeout for the command, in milliseconds. Be generous. You MUST specify this.","type":"number"},"cmd":{"description":"The command to run","type":"string"}}},"strict":true}}
  ],
};
