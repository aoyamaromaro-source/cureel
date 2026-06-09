import type { AnilistMedia } from "@/types";

export function detectSequels(
  candidates: AnilistMedia[],
  watchedIds: Set<number>
): Set<number> {
  const sequelIds = new Set<number>();
  for (const media of candidates) {
    const hasWatchedPrequel = media.relations.edges.some(
      (edge) =>
        (edge.relationType === "PREQUEL" || edge.relationType === "PARENT") &&
        edge.node.type === "ANIME" &&
        watchedIds.has(edge.node.id)
    );
    if (hasWatchedPrequel) sequelIds.add(media.id);
  }
  return sequelIds;
}
