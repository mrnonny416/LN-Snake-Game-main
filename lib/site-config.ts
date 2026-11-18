import { prisma } from "@/lib/db";

const DEFAULT_MAINTENANCE_WINDOW = "02:00 - 04:00 UTC";
const DEFAULT_MAINTENANCE_STATUS = "UPGRADING NODES";
const DEFAULT_MAINTENANCE_NOTE =
  "กำลังอัปเกรดระบบ Lightning และประสิทธิภาพการเล่นเกม เพื่อให้ธุรกรรมเร็วและเสถียรมากขึ้น";

export type MaintenanceSettings = {
  maintenanceMode: boolean;
  maintenanceWindow: string;
  maintenanceStatus: string;
  maintenanceNote: string;
};

export async function isMaintenanceMode(): Promise<boolean> {
  const maintenance = await prisma.maintenanceConfig.findUnique({
    where: { id: "main" },
    select: { maintenanceMode: true },
  });
  return maintenance?.maintenanceMode ?? false;
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettings> {
  const maintenance = await prisma.maintenanceConfig.findUnique({
    where: { id: "main" },
    select: {
      maintenanceMode: true,
      maintenanceWindow: true,
      maintenanceStatus: true,
      maintenanceNote: true,
    },
  });

  return {
    maintenanceMode: maintenance?.maintenanceMode ?? false,
    maintenanceWindow: maintenance?.maintenanceWindow ?? DEFAULT_MAINTENANCE_WINDOW,
    maintenanceStatus: maintenance?.maintenanceStatus ?? DEFAULT_MAINTENANCE_STATUS,
    maintenanceNote: maintenance?.maintenanceNote ?? DEFAULT_MAINTENANCE_NOTE,
  };
}
