import { describe, expect, it } from "vitest";
import { getEvals } from "./evals.ts";

describe("get-evals", () => {
  it("works", async () => {
    const evals = await getEvals();
    evals.map(({ test, json, name }) => {
      expect(name).toBeTypeOf("string");
      expect(json).toBeTruthy();
      expect(test).toBeTypeOf("function");
    });
  });
})
