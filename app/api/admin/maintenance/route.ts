import { NextResponse } from "next/server";
import { getMaintenanceSettings } from "@/lib/site-config";

export async function GET() {
  const settings = await getMaintenanceSettings();
  return NextResponse.json(settings);
}

function readOnlyError() {
  return NextResponse.json(
    {
      error:
        "This service is read-only. Update maintenance config via ln-dashboard-nextjs admin panel.",
    },
    { status: 405 }
  );
}

export async function POST() {
  return readOnlyError();
}

export async function PUT() {
  return readOnlyError();
}

export async function PATCH() {
  return readOnlyError();
}

export async function DELETE() {
  return readOnlyError();
}
