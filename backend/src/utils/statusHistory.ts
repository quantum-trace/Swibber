export type HistoryActor = 'system' | 'user' | 'driver' | 'restaurant' | 'rider';

export interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
  actor: HistoryActor;
}

/** Build a single history entry stamped right now. */
export function makeHistoryEntry(
  status: string,
  actor: HistoryActor,
  note?: string,
): IStatusHistoryEntry {
  return { status, actor, timestamp: new Date(), ...(note ? { note } : {}) };
}

/**
 * Append to an in-memory statusHistory array (document save pattern).
 * Skips the push when the last recorded status already matches, preventing duplicates.
 */
export function appendToHistory(
  history: IStatusHistoryEntry[],
  status: string,
  actor: HistoryActor,
  note?: string,
): void {
  if (history[history.length - 1]?.status === status) return;
  history.push(makeHistoryEntry(status, actor, note));
}

/**
 * Returns a MongoDB $push payload for atomic findOneAndUpdate calls.
 * Pair with a { status: { $ne: newStatus } } filter to deduplicate at DB level.
 *
 * Usage:
 *   await Model.findOneAndUpdate(
 *     { _id: id, status: { $ne: newStatus } },
 *     { status: newStatus, ...pushHistory(newStatus, 'driver') },
 *     { new: true },
 *   );
 */
export function pushHistory(
  status: string,
  actor: HistoryActor,
  note?: string,
): { $push: { statusHistory: IStatusHistoryEntry } } {
  return { $push: { statusHistory: makeHistoryEntry(status, actor, note) } };
}
