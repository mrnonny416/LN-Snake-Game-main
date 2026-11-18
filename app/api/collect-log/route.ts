import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/collect-log?playerId=...&paymentHash=...
// List rounds for a player+invoice.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  const paymentHash = searchParams.get("paymentHash");

  if (!playerId || !paymentHash) {
    return NextResponse.json({ error: "Missing playerId or paymentHash" }, { status: 400 });
  }

  try {
    const rounds = await prisma.collectLog.findMany({
      where: { playerId, paymentHash },
      orderBy: { round: "asc" },
      select: {
        round: true,
        timeMs: true,
        submitted: true,
      },
    });

    return NextResponse.json({ rounds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch collect logs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/collect-log
// Body: { playerId, paymentHash, round, time_ms, collect_time, collect_move, collect_fruit }
// Finalize one round. endPlay is set server-side at request time.
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { playerId, paymentHash, round, time_ms, collect_time, collect_move, collect_fruit } =
      body as {
        playerId?: string;
        paymentHash?: string;
        round?: number;
        time_ms?: number;
        collect_time?: unknown;
        collect_move?: unknown;
        collect_fruit?: unknown;
      };

    if (!playerId || !paymentHash || typeof round !== "number") {
      return NextResponse.json(
        { error: "playerId, paymentHash and round are required." },
        { status: 400 }
      );
    }

    await prisma.collectLog.update({
      where: {
        playerId_paymentHash_round: {
          playerId,
          paymentHash,
          round,
        },
      },
      data: {
        timeMs: typeof time_ms === "number" ? Math.max(0, Math.floor(time_ms)) : null,
        collectTime: collect_time ? JSON.stringify(collect_time) : null,
        collectMove: collect_move ? JSON.stringify(collect_move) : null,
        collectFruit: collect_fruit ? JSON.stringify(collect_fruit) : null,
        endPlay: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update collect log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
