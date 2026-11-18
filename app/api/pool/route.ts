// app/api/pool/route.ts

import { NextResponse } from "next/server";
import { getLNBitsWalletDetails } from "@/lib/lnbits";

/**
 * Handles GET requests to /api/pool.
 * Retrieves the prize pool amount based on the LNBits wallet balance.
 */
export async function GET() {
  try {
    const walletInfo = await getLNBitsWalletDetails();
    const balance = walletInfo.balance; // Balance is in millisats
    const sats = Math.floor(balance / 1000);

    // Calculate 70% of wallet balance after deducting 100 sats (as per original logic)
    const seventyPercent = Math.max(0, Math.floor((sats - 100) * 0.7));

    return NextResponse.json({ total: seventyPercent });
  } catch (error) {
    console.error("Error in /api/pool GET:", error);
    const message = error instanceof Error ? error.message : "Failed to retrieve prize pool.";
    return NextResponse.json(
      { error: `Failed to retrieve prize pool:${message}` },
      { status: 500 }
    );
  }
}
