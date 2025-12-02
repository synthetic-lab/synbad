#!/usr/bin/env node
import * as http from "http";
import * as https from "https";
import fs from "fs/promises";
import path from "path";
import { Command } from "@commander-js/extra-typings";
import OpenAI from "openai";

const cli = new Command()
.name("synbad")
.description("A set of evals for LLM inference providers");

cli.command("proxy")
.requiredOption("-p, --port <number>", "Port to listen on")
.requiredOption("-t, --target <url>", "Target URL to proxy to")
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
      stderrLog(`[${timestamp}] 📦 Request data:`);

      // Choose the right module based on target protocol
      const httpModule = targetUrl.protocol === "https:" ? https : http;

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
        process.stdout.write(chunk);
        proxyReq.write(chunk);
      });

      req.on("end", () => {
        process.stdout.write("\n");
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
  "--only <eval path within synbad>", "Specific evals you want to run, e.g. evals/reasoning or evals/tools/claude-dash"
)
.option(
  "--count <num times>", "Number of times to run the eval. Any failures count as an overall failure",
)
.requiredOption("--model <model name>", "The model name to test")
.action(async ({ model, envVar, baseUrl, only, count }) => {
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
  ) : path.join(import.meta.dirname, "../evals");
  const maxRuns = count == null ? 1 : parseInt(count, 10);
  for await(const testFile of findTestFiles(evalPath)) {
    found++;
    const test = await import(testFile);
    const json = test.json;
    const name = evalName(testFile);
    process.stdout.write(`Running ${name}...`);
    try {
      for(let i = 0; i < maxRuns; i++) {
        if(maxRuns > 1) {
          process.stdout.write(` ${i + 1}/${maxRuns}`);
        }
        const response = await client.chat.completions.create({
          model,
          ...json,
        });
        try {
          test.test(response);
        } catch(e) {
          console.error("Response:");
          console.error(JSON.stringify(response.choices[0], null, 2));
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

function evalName(file: string) {
  return `${path.basename(path.dirname(file))}/${path.basename(file).replace(/.js$/, "")}`
}

async function* findTestFiles(dir: string): AsyncGenerator<string> {
  try {
    await fs.stat(dir);
  } catch(e) {
    const pathname = `${dir}.js`;
    const stat = await fs.stat(pathname);
    if(stat.isFile()) {
      yield pathname;
      return;
    }
    throw e;
  }
  const entryNames = await fs.readdir(dir);
  const entries = await Promise.all(entryNames.map(async (entry) => {
    return {
      path: path.join(dir, entry),
      stat: await fs.stat(path.join(dir, entry)),
    };
  }));
  for(const entry of entries) {
    if(entry.stat.isFile() && entry.path.endsWith(".js")) {
      yield entry.path;
    }
    if(entry.stat.isDirectory()) {
      yield* findTestFiles(entry.path);
    }
  }
}

function stderrLog(item: string, ...items: string[]) {
  let formatted = item;
  if(items.length > 0) {
    formatted += " " + items.join(" ");
  }
  process.stderr.write(formatted + "\n");
}

cli.parse();
