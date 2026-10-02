import fs from "fs/promises";
import path from "path";
import { ChatCompletionChunkWithReasoning, ChatCompletionCreateParams, ChatCompletionMessage } from "./chat-completion.ts";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs";

// Directory containing binary assets (e.g. images) available to evals at
// runtime. The build copies it into dist/, so this resolves correctly both
// when running from source (via tsx/vitest) and from the compiled output.
export const STATIC_DIR = path.join(import.meta.dirname, "..", "static");

export type EvalTestParams = {
  chatCompletionMessage: ChatCompletionMessage,
  chatCompletionChunks?: ChatCompletionChunkWithReasoning[],
};


export type EvalModule = {
  test: (params: EvalTestParams) => any;
  json: ChatCompletionCreateParams;
};

export type Eval = EvalModule & {
  name: string;
};

// Directories under evals/modalities/ that are gated behind a --modalities
// flag, keyed by the modality name (e.g. evals/modalities/image requires
// --modalities image).
const MODALITY_DIRS = new Set(["image"]);

export type GetEvalsOptions = {
  modalities?: string[],
};

export async function getEvals(
  evalsPath?: string,
  skipReasoning?: boolean,
  options: GetEvalsOptions = {},
): Promise<Eval[]> {
  const evals: Eval[] = [];
  const resolvedPath = evalsPath ?? path.join(import.meta.dirname, "..", "evals");
  const modalities = options.modalities ?? [];

  for await (const testFile of findTestFiles(resolvedPath, skipReasoning ?? false, modalities)) {
    const module: EvalModule = await import(testFile);
    evals.push({ ...module, name: evalName(testFile) });
  }

  return evals;
}

export function evalName(file: string) {
  return `${path.basename(path.dirname(file))}/${path.basename(file).replace(/.js$/, "")}`
}

export async function* findTestFiles(dir: string, skipReasoning: boolean, modalities: string[]): AsyncGenerator<string> {
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
      const dirname = path.basename(entry.path);
      if(skipReasoning && dirname === "reasoning") continue;
      if(MODALITY_DIRS.has(dirname) && !modalities.includes(dirname)) continue;
      yield* findTestFiles(entry.path, skipReasoning, modalities);
    }
  }
}

