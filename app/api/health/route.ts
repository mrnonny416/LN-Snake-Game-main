import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: "Database connected successfully" });
  } catch (error) {
    console.error("Database connection error:", error);
    const message = error instanceof Error ? error.message : "Database connection error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
