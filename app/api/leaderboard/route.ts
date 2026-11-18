// app/api/leaderboard/route.ts

import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/game-data";

/**
 * Handles GET requests to /api/leaderboard.
 * Returns the current top 10 leaderboard.
 */
export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error in /api/leaderboard GET:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve leaderboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
