import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Leaderboard AI cohort insights — disabled for now.
 *
 * Re-enable: restore the POST implementation from git (MiMo + `lib/leaderboardInsights.ts`)
 * and wire `AiInsightsBlock` + `tab` prop back into `app/components/LeaderboardAnalytics.tsx`.
 */
export async function POST() {
  return NextResponse.json({ error: "Leaderboard insights are temporarily disabled." }, { status: 503 });
}
