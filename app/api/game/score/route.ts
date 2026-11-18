// app/api/game/score/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLeaderboard } from "@/lib/game-data";

/**
 * POST /api/game/score
 * Body: { playerId, paymentHash, round }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, paymentHash, round, name } = body as {
      playerId?: string;
      paymentHash?: string;
      round?: number;
      name?: string;
    };

    // --- Input validation ---
    if (typeof playerId !== "string" || playerId.trim() === "") {
      return NextResponse.json({ error: "playerId is required." }, { status: 400 });
    }
    if (typeof paymentHash !== "string" || paymentHash.trim() === "") {
      return NextResponse.json({ error: "paymentHash is required." }, { status: 400 });
    }
    if (typeof round !== "number" || round < 1 || round > 3) {
      return NextResponse.json({ error: "round must be between 1 and 3." }, { status: 400 });
    }
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name is required." }, { status: 400 });
    }
    const trimmedName = name.trim();

    // --- Verify Invoice is paid ---
    const invoice = await prisma.invoice.findUnique({
      where: { paymentHash },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    if (invoice.playerId !== playerId) {
      return NextResponse.json(
        { error: "Invoice does not belong to this player." },
        { status: 403 }
      );
    }
    if (invoice.status !== "paid") {
      return NextResponse.json(
        { error: "Payment has not been confirmed. Please pay the invoice first." },
        { status: 402 }
      );
    }

    // --- Get round payload from collect log ---
    const selectedRound = await prisma.collectLog.findUnique({
      where: {
        playerId_paymentHash_round: {
          playerId,
          paymentHash,
          round,
        },
      },
    });

    if (!selectedRound) {
      return NextResponse.json(
        { error: "Selected round not found in collect logs." },
        { status: 404 }
      );
    }

    if (selectedRound.submitted) {
      return NextResponse.json(
        { error: "This invoice has already been submitted." },
        { status: 409 }
      );
    }

    if (!selectedRound.endPlay || selectedRound.timeMs == null) {
      return NextResponse.json({ error: "Selected round is not finished yet." }, { status: 400 });
    }

    // --- Ensure player exists, update name ---
    await prisma.player.upsert({
      where: {
        playerId_paymentHash: {
          playerId,
          paymentHash,
        },
      },
      update: { name: trimmedName },
      create: {
        playerId,
        paymentHash,
        name: trimmedName,
      },
    });

    // --- Record score ---
    await prisma.score.create({
      data: {
        playerId,
        paymentHash,
        timeMs: selectedRound.timeMs,
      },
    });

    // --- Mark all rounds under this invoice as submitted ---
    await prisma.collectLog.updateMany({
      where: { playerId, paymentHash, submitted: false },
      data: {
        submitted: true,
        submittedAt: new Date(),
      },
    });

    const leaderboard = await getLeaderboard();

    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    console.error("Error in /api/game/score POST:", error);
    const message = error instanceof Error ? error.message : "Failed to submit score.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
