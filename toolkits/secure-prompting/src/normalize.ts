/**
 * Secure input normalization utilities.
 * - Unicode NFKC normalization
 * - Strip control characters
 * - Collapse whitespace
 * - Optional length clamp
 */
export interface NormalizeOptions {
  clamp?: number; // maximum length after normalization
  collapseWhitespace?: boolean; // default true
}

export function normalizeInput(input: string, opts: NormalizeOptions = {}): string {
  const { clamp, collapseWhitespace = true } = opts;
  let s = input == null ? "" : String(input);

  // Unicode normalization
  s = s.normalize("NFKC");

  // Strip C0 control chars (except newline/tab if needed later)
  s = s.replace(/[\u0000-\u001F]/g, "");

  // Collapse whitespace to single spaces if requested
  if (collapseWhitespace) {
    s = s.replace(/\s+/g, " ").trim();
  } else {
    s = s.trim();
  }

  // Optional clamp
  if (typeof clamp === "number" && clamp > 0 && s.length > clamp) {
    s = s.slice(0, clamp);
  }

  return s;
}

/**
 * Ensure the prompt contains no raw binary or obvious base64 blobs beyond a threshold.
 * Returns a tuple [safe, reason]
 */
export function heuristicsPromptSafety(input: string): [boolean, string] {
  const s = normalizeInput(input, { collapseWhitespace: true, clamp: 20000 });

  // Heuristic: detect long base64-like runs
  const base64Like = /(?:[A-Za-z0-9+/]{64,}={0,2})/;
  if (base64Like.test(s)) {
    return [false, "Possible embedded base64 payload detected"];
  }

  // Heuristic: excessive non-printable ratio already stripped -> if original lost >5%
  // (Callers may compute before/after length delta; here we just flag if suspicious markers appear)
  const morseLike = /^(?:[\.\-\s]{40,})$/m;
  if (morseLike.test(s)) {
    return [false, "Morse-like payload detected"];
  }

  // Heuristic: zero-width chars (after NFKC most are removed, but guard anyway)
  const zeroWidth = /[\u200B-\u200D\u2060\uFEFF]/;
  if (zeroWidth.test(input)) {
    return [false, "Zero-width characters detected"];
  }

  return [true, "OK"];
}
