import { normalizeInput, heuristicsPromptSafety } from "../src/normalize";

describe("normalizeInput", () => {
  it("normalizes unicode and strips control chars", () => {
    const s = "ＡＢＣ\u0001\u0002\u0003";
    expect(normalizeInput(s)).toBe("ABC");
  });

  it("collapses whitespace by default", () => {
    const s = "a\t\t b\n\n c";
    expect(normalizeInput(s)).toBe("a b c");
  });

  it("respects clamp", () => {
    const s = "x".repeat(100);
    expect(normalizeInput(s, { clamp: 10 })).toBe("x".repeat(10));
  });
});

describe("heuristicsPromptSafety", () => {
  it("flags base64-like payload", () => {
    const payload = "A".repeat(64);
    const [ok, reason] = heuristicsPromptSafety(payload);
    expect(ok).toBe(false);
    expect(reason).toMatch(/base64/i);
  });

  it("accepts normal text", () => {
    const [ok] = heuristicsPromptSafety("hello world");
    expect(ok).toBe(true);
  });
});
