/** Zero-based row index → 🥇🥈🥉 for 1–3, otherwise 1-based rank number for display */
export function podiumRankContent(index: number): string | number {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

export function podiumRankIsMedal(index: number): boolean {
  return index < 3;
}
