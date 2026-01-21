import fs from "fs/promises";
import path from "path";
import { ChatMessage } from "./chat-completion.ts";

export type Eval = {
  test: (response: ChatMessage) => any;
  json: any;
  name: string;
};

export async function getEvals(): Promise<Eval[]> {
  const evals: Eval[] = [];
  const evalsPath = path.join(import.meta.dirname, "..", "evals");

  for await (const testFile of findTestFiles(evalsPath, false)) {
    const { test, json } = await import(testFile);
    evals.push({ test, json, name: evalName(testFile) });
  }

  return evals;
}

export function evalName(file: string) {
  return `${path.basename(path.dirname(file))}/${path.basename(file).replace(/.js$/, "")}`
}

export async function* findTestFiles(dir: string, skipReasoning: boolean): AsyncGenerator<string> {
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
      if(skipReasoning && path.basename(entry.path) === "reasoning") continue;
      yield* findTestFiles(entry.path, skipReasoning);
    }
  }
}

