export function parseTimeMs(value: unknown): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) && time > 0 ? time : null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    // Heuristic: treat small numbers as epoch seconds.
    return value < 1e12 ? value * 1000 : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Numeric timestamps (seconds or ms) sometimes arrive as strings.
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) return null;
    return num < 1e12 ? num * 1000 : num;
  }

  const direct = Date.parse(trimmed);
  if (Number.isFinite(direct)) return direct;

  // Common timezone abbreviations that `Date.parse` doesn't reliably understand.
  const normalized =
    trimmed
      .replace(/\s+IST$/i, " GMT+0530")
      .replace(/\s+UTC$/i, " GMT")
      .replace(/\s+GMT$/i, " GMT");

  const retry = Date.parse(normalized);
  if (Number.isFinite(retry)) return retry;

  return null;
}

