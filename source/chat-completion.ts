import { t } from "structural";
import OpenAI from "openai";

export function getReasoning(msg: { reasoning_content?: string, reasoning?: string }) {
  return msg.reasoning_content || msg.reasoning;
}

export type ChatResponse = OpenAI.ChatCompletion & {
  choices: Array<{
    message: {
      reasoning_content?: string,
      reasoning?: string,
    },
  }>
};

const TextContentPart =  t.subtype({
  type: t.value("text"),
  text: t.str,
});
const ImageContentPart =  t.subtype({
  type: t.value("image_url"),
  image_url: t.subtype({
    url: t.str,
  }),
});
const RefusalContentPart = t.subtype({
  type: t.value("refusal"),
  refusal: t.str,
});

const TextContent = t.str.or(t.array(TextContentPart));
const UserContent = t.str.or(t.array(TextContentPart.or(ImageContentPart)));
const AssistantContent = t.str.or(t.array(TextContentPart.or(RefusalContentPart)));

const ToolResultSchema = t.subtype({
  role: t.value("tool"),
  content: TextContent,
  tool_call_id: t.str,
});

const ToolCall = t.subtype({
  id: t.str,
  type: t.value("function"),
  function: t.subtype({
    name: t.str,
    arguments: t.str,
  }),
});
const AssistantMessageSchema = t.subtype({
  content: t.optional(AssistantContent.or(t.nil)),
  role: t.value("assistant"),
  tool_calls: t.optional(t.array(ToolCall)),
  function_call: t.optional(t.subtype({
    arguments: t.str,
    name: t.str,
  })),
  reasoning_content: t.optional(t.str.or(t.nil)),
});

const UserMessageSchema = t.subtype({
  content: UserContent,
  role: t.value("user"),
  name: t.optional(t.str),
});

const ChatCompletionMessage = t.subtype({
  content: TextContent,
  role: t.value("system"),
  name: t.optional(t.str),
}).or(
  UserMessageSchema
).or(
  AssistantMessageSchema
).or(
  ToolResultSchema
).or(t.subtype({
  role: t.value("function"),
  content: t.str.or(t.nil),
  name: t.str
}));

const ReasoningSchema = t.value("low").or(t.value("medium")).or(t.value("high"));

const ToolDef = t.subtype({
  type: t.value("function"),
  function: t.subtype({
    description: t.optional(t.str),
    name: t.str,
    parameters: t.optional(t.any),
    strict: t.optional(t.bool),
  }),
});

export const ChatCompletion = t.subtype({
  messages: t.array(ChatCompletionMessage),
  user: t.optional(t.str),

  tools: t.optional(t.array(ToolDef)),
  tool_choice: t.optional(t.value("auto").or(t.value("none").or(t.value("required"))).or(t.subtype({
    type: t.value("function"),
    function: t.subtype({
      name: t.str
    }),
  }))),
  parallel_tool_calls: t.optional(t.bool),
  function_call: t.optional(t.value("auto").or(t.value("none")).or(t.subtype({
    name: t.str,
  }))),
  functions: t.optional(t.array(t.subtype({
    description: t.optional(t.str),
    name: t.str,
    parameters: t.optional(t.any),
  }))),

  frequency_penalty: t.optional(t.num.or(t.nil)),
  logit_bias: t.optional(t.dict(t.num)),
  logprobs: t.optional(t.bool.or(t.nil).or(t.num)),
  top_k: t.optional(t.num.or(t.nil)),
  top_logprobs: t.optional(t.num.or(t.nil)),
  max_tokens: t.optional(t.num.or(t.nil)),
  max_completion_tokens: t.optional(t.num.or(t.nil)),
  n: t.optional(t.num.or(t.nil)),
  presence_penalty: t.optional(t.num.or(t.nil)),
  min_p: t.optional(t.num.or(t.nil)),
  response_format: t.optional(t.subtype({
    type: t.value("text").or(t.value("json_object")),
  }).or(t.subtype({
    type: t.value("json_schema"),
    json_schema: t.subtype({
      name: t.str,
      description: t.optional(t.str),
      schema: t.any,
      strict: t.optional(t.bool.or(t.nil)),
    }),
  }))),
  seed: t.optional(t.num.or(t.nil)),
  stop: t.optional(t.str.or(t.array(t.str)).or(t.nil)),
  stream: t.optional(t.bool.or(t.nil)),
  temperature: t.optional(t.num.or(t.nil)),
  top_p: t.optional(t.num.or(t.nil)),

  reasoning_effort: t.optional(ReasoningSchema),
  enable_thinking: t.optional(t.bool),
});
