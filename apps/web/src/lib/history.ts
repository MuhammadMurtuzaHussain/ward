// The "Recent checks" list, as kept in localStorage. On a shared phone anyone who opens Ward can
// read that, so it holds no chat name and no verdict: only when a check happened and whether it
// went into the (encrypted) vault. While a check is still open in memory, Home shows its name and
// level from the session; once Ward is locked or closed, only "A check, 31 Oct" is left.

export interface CheckSummary {
  id: string;
  at: number;
  saved: boolean;
}

/** How long a line stays in the list. Saved chats stay in the vault however old they are. */
export const KEEP_DAYS = 30;
export const KEEP_MAX = 50;

/**
 * Only the neutral fields, nothing older than KEEP_DAYS. Also cleans lists written before this,
 * which carried the chat's title and Ward's verdict in plain text.
 */
export function neutral(checks: readonly Partial<CheckSummary>[] | undefined, now = Date.now()): CheckSummary[] {
  const since = now - KEEP_DAYS * 86_400_000;
  return (checks ?? [])
    .filter((c): c is CheckSummary => typeof c.id === "string" && typeof c.at === "number" && c.at >= since)
    .map(({ id, at, saved }) => ({ id, at, saved: saved === true }))
    .slice(0, KEEP_MAX);
}

/** A new check goes on top. */
export const recorded = (checks: readonly CheckSummary[], id: string, now = Date.now()) => neutral([{ id, at: now, saved: false }, ...checks], now);
