import type { ReactNode } from "react";

/**
 * Wraps search query tokens inside <mark> elements for in-card highlighting.
 * Only tokens >= 2 chars are highlighted to avoid noise from single letters.
 */
export function highlightTerms(text: string, query: string): ReactNode {
  if (!query?.trim() || !text) return text;

  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (tokens.length === 0) return text;

  // Capturing group keeps matched parts in the split result array
  const splitPattern = new RegExp(`(${tokens.join("|")})`, "gi");
  // Separate non-stateful check pattern (no global flag)
  const checkPattern = new RegExp(`^(${tokens.join("|")})$`, "i");

  const parts = text.split(splitPattern);

  return (
    <>
      {parts.map((part, i) =>
        checkPattern.test(part) ? (
          <mark
            key={i}
            className="rounded-[2px] bg-yellow-100 px-0.5 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
