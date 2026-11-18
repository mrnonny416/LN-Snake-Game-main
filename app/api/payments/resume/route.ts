import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/payments/resume?playerId=...
// Returns a paid invoice for this player that is not submitted and still has playable rounds.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  try {
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        playerId,
        status: "paid",
      },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      select: {
        paymentHash: true,
        bolt11: true,
        paidAt: true,
        collectLogs: { select: { round: true, submitted: true } },
      },
    });

    const active = paidInvoices.find((inv) => {
      const roundsPlayed = inv.collectLogs.length;
      const submitted = inv.collectLogs.some((l) => l.submitted);
      return roundsPlayed < 3 && !submitted;
    });

    if (!active) {
      return NextResponse.json({ activeInvoice: null });
    }

    return NextResponse.json({
      activeInvoice: {
        paymentHash: active.paymentHash,
        paymentRequest: active.bolt11,
        paidAt: active.paidAt,
        roundsPlayed: active.collectLogs.length,
        submitted: active.collectLogs.some((l) => l.submitted),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch resumable invoice.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
