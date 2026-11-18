// app/api/payments/invoice/route.ts

import { NextResponse } from "next/server";
import { createLNBitsInvoice } from "@/lib/lnbits";
import { prisma } from "@/lib/db";

/**
 * Handles POST requests to /api/payments/invoice.
 * Creates a Lightning Network invoice using LNBits.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const amount = payload?.amount;
    const memo = payload?.memo;
    const playerId = payload?.playerId ?? payload?.userId;

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount specified." }, { status: 400 });
    }
    if (typeof memo !== "string" || memo.trim() === "") {
      return NextResponse.json({ error: "Memo is required." }, { status: 400 });
    }
    if (typeof playerId !== "string" || playerId.trim() === "") {
      return NextResponse.json({ error: "playerId is required." }, { status: 400 });
    }

    const invoice = await createLNBitsInvoice(amount, memo);
    await prisma.invoice.create({
      data: {
        playerId,
        paymentHash: invoice.payment_hash,
        bolt11: invoice.bolt11,
        amountSats: amount,
        memo,
      },
    });

    return NextResponse.json({
      payment_request: invoice.bolt11,
      payment_hash: invoice.payment_hash,
    });
  } catch (error: unknown) {
    console.error("Error in /api/payments/invoice POST:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
