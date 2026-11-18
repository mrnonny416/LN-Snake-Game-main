import type { Metadata } from "next";
import "@/styles/globals.css";
import { LuGamepad2 } from "react-icons/lu";
import { SiGamejolt } from "react-icons/si";
import { GrBitcoin } from "react-icons/gr";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isMaintenanceMode } from "@/lib/site-config";
export const metadata: Metadata = {
  title: "Bitcoin Snake Game",
  description: "เล่นเกมงู ลุ้นรับ Bitcoin Sats ทุกวันที่ 21",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  const skipMaintenance = pathname === "/maintenance" || pathname.startsWith("/api/");

  if (!skipMaintenance && (await isMaintenanceMode())) {
    redirect("/maintenance");
  }

  return (
    <html lang="th">
      <body className="font-['VT323']">
        <div className="pointer-events-none fixed top-0 left-0 z-0 h-full w-full overflow-hidden">
          <span className="material-symbols-outlined absolute top-[10%] left-[5%] -rotate-12 transform text-6xl text-[#6A0DAD] opacity-20">
            <LuGamepad2 size={150} />
          </span>
          <span className="material-symbols-outlined absolute right-[25%] bottom-[10%] rotate-12 transform text-6xl text-[#f86700] opacity-20">
            <SiGamejolt size={150} />
          </span>
          <span className="material-symbols-outlined absolute top-[30%] right-[10%] text-5xl text-[#FF00FF] opacity-20">
            <GrBitcoin size={150} />
          </span>
          <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 transform font-['Press_Start_2P'] text-[200px] font-bold text-black opacity-[0.05] select-none">
            SNAKE
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
