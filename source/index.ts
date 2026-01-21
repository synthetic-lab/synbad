#!/usr/bin/env node
import * as http from "http";
import * as https from "https";
import path from "path";
import { Command } from "@commander-js/extra-typings";
import OpenAI from "openai";
import { ChatMessage, getReasoning } from "./chat-completion.ts";
import { findTestFiles, evalName } from "./evals.ts";

const cli = new Command()
.name("synbad")
.description("A set of evals for LLM inference providers");

cli.command("eval")
.description("Runs the evals")
.requiredOption(
  "--env-var <env var name>", "The env var to use to authenticate with the inference provider"
)
.requiredOption(
  "--base-url <base url>", "The base URL for the inference provider"
)
.option(
  "--skip-reasoning", "Skip reasoning evals (set this for non-reasoning models)"
)
.option(
  "--reasoning-effort <level>", "Set the reasoning effort to high, medium, or low"
)
.option(
  "--only <eval path within synbad>", "Specific evals you want to run, e.g. evals/reasoning or evals/tools/claude-dash"
)
.option(
  "--count <num times>", "Number of times to run the eval. Any failures count as an overall failure",
)
.option(
  "--stream", "Test streaming API calls",
)
.requiredOption("--model <model name>", "The model name to test")
.action(async ({ model, envVar, baseUrl, only, count, skipReasoning, reasoningEffort, stream }) => {
  if(!process.env[envVar]) {
    console.error(`No env var named ${envVar} exists for the current process`);
    process.exit(1);
  }
  const client = new OpenAI({
    apiKey: process.env[envVar],
    baseURL: baseUrl,
  });
  let found = 0;
  const failures = new Set<string>();
  const evalPath = only ? path.join(
    import.meta.dirname, "..", only
  ) : path.join(import.meta.dirname, "..", "evals");
  const maxRuns = count == null ? 1 : parseInt(count, 10);
  for await(const testFile of findTestFiles(evalPath, !!skipReasoning)) {
    found++;
    const test = await import(testFile);
    const json = test.json;
    const name = evalName(testFile);
    process.stdout.write(`Running ${name}...`);

    async function respond(): Promise<ChatMessage> {
      const reasoning = reasoningEffort == null ? {} : {
        reasoning_effort: reasoningEffort,
      };
      if(!stream) {
        const response = await client.chat.completions.create({
          ...json,
          ...reasoning,
          stream: false,
          model,
        });
        return response.choices[0].message as ChatMessage;
      }

      const msg: Partial<ChatMessage> = {};

      const chunkStream = await (client.chat.completions.create({
        ...json,
        ...reasoning,
        model,
        stream: true,
      }) as unknown as Promise<AsyncIterable<OpenAI.ChatCompletionChunk & {
        choices: Array<{
          delta: {
            reasoning?: string,
            reasoning_content?: string,
          },
        }>
      }>>);

      let lastIndex: number | null = null;
      let toolBuffer: {
        id?: string,
        type: "function",
        index: number,
        function: {
          name?: string,
          arguments?: string,
        },
      } | null = null;
      for await(const chunk of chunkStream) {
        if(!chunk.choices) continue;
        const choice = chunk.choices[0];
        if(!choice) continue;
        const content = choice.delta.content;
        const tools = choice.delta.tool_calls;
        const reasoning = getReasoning(choice.delta);
        if(content) {
          if(!msg.content) msg.content = "";
          msg.content += content;
        }
        if(tools) {
          for(const toolDelta of tools) {
            if(lastIndex == null) lastIndex = toolDelta.index;
            if(lastIndex !== toolDelta.index && toolBuffer != null) {
              msg.tool_calls ||= [];
              // @ts-ignore
              msg.tool_calls.push(toolBuffer);
              toolBuffer = {
                index: toolDelta.index,
                type: "function",
                function: {},
              };
            }
            if(!toolBuffer) {
              toolBuffer = {
                index: toolDelta.index,
                type: "function",
                function: {}
              };
            }
            lastIndex = toolDelta.index;
            if(toolDelta.id) toolBuffer.id = toolDelta.id;
            if(toolDelta.function) {
              if(toolDelta.function.name) {
                toolBuffer.function.name ||= "";
                toolBuffer.function.name += toolDelta.function.name;
              }
              if(toolDelta.function.arguments) {
                toolBuffer.function.arguments ||= "";
                toolBuffer.function.arguments += toolDelta.function.arguments;
              }
            }
          }
        }
        if(reasoning) {
          if(!msg.reasoning_content) msg.reasoning_content = "";
          msg.reasoning_content += reasoning;
        }
      }

      if(toolBuffer) {
        msg.tool_calls ||= [];
        // @ts-ignore
        msg.tool_calls.push(toolBuffer);
      }

      return msg as ChatMessage;
    }

    try {
      for(let i = 0; i < maxRuns; i++) {
        if(maxRuns > 1) {
          process.stdout.write(` ${i + 1}/${maxRuns}`);
        }
        const response = await respond();
        try {
          test.test(response);
        } catch(e) {
          console.error("Response:");
          console.error(JSON.stringify(response, null, 2));
          throw e;
        }
      }
      process.stdout.write(" ✅ passed\n");
    } catch(e) {
      failures.add(testFile);
      console.error(e);
      console.error(`❌ ${name} failed`);
    }
  }
  const passed = found - failures.size
  if(passed === found) {
    console.log("\n✅ All evals passed!");
    process.exit(0);
  }

  console.log("");
  console.log(`
${passed}/${found} evals passed. Failures:

- ${Array.from(failures).map(evalName).join("\n- ")}
`.trim());
});

cli.command("proxy")
.requiredOption("-p, --port <number>", "Port to listen on")
.requiredOption("-t, --target <url>", "Target URL to proxy to")
.option("--pretty", "Pretty-print the JSON")
.action(async (options) => {
  const port = parseInt(options.port, 10);
  const targetUrl = new URL(options.target);

  stderrLog(`🚀 Starting proxy on port ${port}`);
  stderrLog(`📯 Proxying to: ${targetUrl.origin}`);

  const server = http.createServer(async (req, res) => {
    try {
      const timestamp = new Date().toISOString();

      // Log request metadata
      stderrLog(`\n[${timestamp}] 📥 ${req.method} ${req.url}`);

      // Construct target URL - handle target path correctly
      const incomingPath = req.url || "";
      const targetBasePath = targetUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
      const targetPath = targetBasePath + incomingPath;
      const target = `${targetUrl.origin}${targetPath}`;

      // Prepare request headers (remove problematic ones)
      const requestHeaders = { ...req.headers };
      delete requestHeaders["host"];
      delete requestHeaders["content-length"];
      delete requestHeaders["transfer-encoding"];

      stderrLog(`[${timestamp}] ➡️  Forwarding to: ${target}`);
      stderrLog(`[${timestamp}] 📦 Writing request data to stdout...`);

      // Choose the right module based on target protocol
      const httpModule = targetUrl.protocol === "https:" ? https : http;

      const buffer: string[] = [];

      // Create proxy request
      const proxyReq = httpModule.request(
        {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
          path: targetPath,
          method: req.method,
          headers: requestHeaders,
        },
        (proxyRes) => {
          // Log response status and headers
          stderrLog(
            `[${timestamp}] 📤 Response to ${req.url}: ${proxyRes.statusCode} ${proxyRes.statusMessage}`
          );
          stderrLog(`[${timestamp}] 📦 Loading response...`);

          // Filter problematic response headers
          const responseHeaders = { ...proxyRes.headers };
          delete responseHeaders["transfer-encoding"];
          delete responseHeaders["content-length"];

          res.writeHead(proxyRes.statusCode || 200, responseHeaders);

          // Stream response data immediately to client
          proxyRes.on("data", (chunk) => {
            res.write(chunk);
          });

          proxyRes.on("end", () => {
            stderrLog(`[${timestamp}] ✅ Response complete`);
            res.end();
          });
        }
      );

      // Handle proxy request errors
      proxyReq.on("error", (e) => {
        console.error(`[${timestamp}] ❌ Proxy request error:`, e);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Proxy error", message: e.message }));
        }
      });

      // Handle client request errors
      req.on("error", (e) => {
        console.error(`[${timestamp}] ❌ Client request error:`, e);
        proxyReq.destroy();
        if (!res.headersSent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Client error", message: e.message }));
        }
      });

      req.on("data", (chunk) => {
        buffer.push(chunk);
        if(!options.pretty) process.stdout.write(chunk);
        proxyReq.write(chunk);
      });

      req.on("end", () => {
        if(options.pretty) console.log(JSON.stringify(JSON.parse(buffer.join()), null, 2));
        else process.stdout.write("\n");
        console.log(`[${timestamp}] ✅ Request complete`);
        proxyReq.end();
      });

    } catch (e) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ❌ Server error:`, e);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error", message: (e as Error).message }));
      }
    }
  });

  server.on("error", (e) => {
    console.error("❌ Server error:", e);
  });

  server.listen(port, () => {
    stderrLog(`✅ Server listening on http://localhost:${port}`);
    stderrLog(`📡 All HTTP request data will be logged to stdout`);
    stderrLog("🤓 Terminal UI messages (such as this one) will be logged to stderr");
  });
});

function stderrLog(item: string, ...items: string[]) {
  let formatted = item;
  if(items.length > 0) {
    formatted += " " + items.join(" ");
  }
  process.stderr.write(formatted + "\n");
}

cli.parse();
