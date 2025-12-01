#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

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

cli.parse();
