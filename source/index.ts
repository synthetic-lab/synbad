#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const cli = new Command()
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
.argument("<model name>", "The model name to test")
.action(async (modelName, { envVar, baseUrl }) => {
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
  for await(const testFile of findTestFiles(path.join(import.meta.dirname, "../evals"))) {
    found++;
    const test = await import(testFile);
    const json = test.json;
    const name = evalName(testFile);
    process.stdout.write(`Running ${name}...`);
    try {
      const response = await client.chat.completions.create({
        model: modelName,
        ...json,
      });
      test.test(response);
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
