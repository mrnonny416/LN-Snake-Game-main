import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/collect-log/start
// Body: { playerId, paymentHash, round }
// Creates (or reuses) a round slot and stores startPlay immediately.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, paymentHash, round } = body as {
      playerId?: string;
      paymentHash?: string;
      round?: number;
    };

    if (!playerId || !paymentHash || typeof round !== "number") {
      return NextResponse.json(
        { error: "playerId, paymentHash and round are required." },
        { status: 400 }
      );
    }

    if (round < 1 || round > 3) {
      return NextResponse.json({ error: "round must be between 1 and 3." }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { paymentHash } });
    if (!invoice || invoice.playerId !== playerId) {
      return NextResponse.json({ error: "Invalid invoice for this player." }, { status: 403 });
    }

    if (invoice.status !== "paid") {
      return NextResponse.json({ error: "Invoice is not paid yet." }, { status: 402 });
    }

    await prisma.player.upsert({
      where: {
        playerId_paymentHash: {
          playerId,
          paymentHash,
        },
      },
      update: {},
      create: {
        playerId,
        paymentHash,
      },
    });

    const existing = await prisma.collectLog.findUnique({
      where: {
        playerId_paymentHash_round: {
          playerId,
          paymentHash,
          round,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ ok: true });
    }

    await prisma.collectLog.create({
      data: {
        playerId,
        paymentHash,
        round,
        startPlay: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start collect log.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
