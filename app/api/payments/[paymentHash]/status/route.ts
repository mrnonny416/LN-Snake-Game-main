// app/api/payments/[paymentHash]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { checkLNBitsPaymentStatus } from "@/lib/lnbits";
import { prisma } from "@/lib/db";

/**
 * Handles GET requests to /api/payments/[paymentHash]/status.
 * Checks the payment status of an LNBits invoice.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ paymentHash: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { paymentHash } = resolvedParams;

    if (!paymentHash) {
      return NextResponse.json({ error: "Payment hash is required." }, { status: 400 });
    }

    const paid = await checkLNBitsPaymentStatus(paymentHash);

    if (paid) {
      await prisma.invoice.updateMany({
        where: {
          paymentHash,
          status: { not: "paid" },
        },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      });

      // Delete other pending invoices for the same player (cleanup stale ones)
      const paidInvoice = await prisma.invoice.findUnique({
        where: { paymentHash },
        select: { playerId: true },
      });
      if (paidInvoice?.playerId) {
        await prisma.invoice.deleteMany({
          where: {
            playerId: paidInvoice.playerId,
            paymentHash: { not: paymentHash },
            status: "pending",
          },
        });
      }
    }

    const dbInvoice = await prisma.invoice.findUnique({
      where: { paymentHash },
      select: { status: true, paidAt: true },
    });

    return NextResponse.json({
      paid,
      dbPaid: dbInvoice?.status === "paid",
      paidAt: dbInvoice?.paidAt ?? null,
    });
  } catch (error: unknown) {
    console.error("Error in /api/payments/[paymentHash]/status GET:", error);
    const message = error instanceof Error ? error.message : "Failed to check payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
