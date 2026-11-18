import { Manrope, Space_Grotesk } from "next/font/google";
import { getMaintenanceSettings } from "@/lib/site-config";
import { HiBolt, HiWrenchScrewdriver, HiClock } from "react-icons/hi2";

const headline = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export default async function MaintenancePage() {
  const { maintenanceNote, maintenanceStatus, maintenanceWindow } = await getMaintenanceSettings();

  return (
    <main
      className={`min-h-screen bg-[#fde047] bg-[linear-gradient(#facc15_1px,transparent_1px),linear-gradient(90deg,#facc15_1px,transparent_1px)] bg-[size:40px_40px] px-6 pt-16 pb-16 text-[#2e1065] ${body.className}`}
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-12">
        <section className="order-2 flex justify-center md:order-1 md:col-span-5">
          <div className="relative flex h-72 w-72 items-center justify-center rounded-[3rem] border-4 border-[#2e1065] bg-[#22c55e] shadow-[6px_6px_0px_#2e1065]">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#2e1065] bg-white">
                <HiWrenchScrewdriver className="h-16 w-16 animate-pulse text-[#4c1d95]" />
              </div>
              <div className="rounded-full border-4 border-[#2e1065] bg-[#4c1d95] px-6 py-2">
                <span className="text-lg font-extrabold tracking-wide text-white">
                  REBOOTING...
                </span>
              </div>
            </div>

            <HiBolt className="absolute top-8 -right-5 h-12 w-12 text-[#facc15]" />
          </div>
        </section>

        <section className="order-1 space-y-6 md:order-2 md:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border-4 border-[#2e1065] bg-white px-4 py-1.5">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#ec4899]" />
            <span className="text-xs font-black tracking-[0.2em] uppercase">CRITICAL STATUS</span>
          </div>

          <h1
            className={`${headline.className} text-5xl leading-[0.9] font-extrabold tracking-tight text-[#4c1d95] uppercase italic md:text-7xl`}
          >
            MAINTENANCE
            <br />
            <span className="text-[#22c55e]">MODE</span>
          </h1>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border-4 border-[#2e1065] bg-[#4c1d95] p-6 text-white shadow-[6px_6px_0px_#2e1065]">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-[#facc15] uppercase">
                  SYSTEM PROTOCOL
                </p>
                <p className="text-2xl font-extrabold tracking-tight uppercase">
                  {maintenanceStatus || "UPGRADING NODES"}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-[#2e1065] bg-[#facc15]">
                <HiWrenchScrewdriver className="h-8 w-8 text-[#2e1065]" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border-4 border-[#2e1065] bg-[#22c55e] p-6 shadow-[6px_6px_0px_#2e1065]">
              <div>
                <p className="text-xs font-extrabold tracking-[0.16em] text-[#2e1065]/80 uppercase">
                  EXPECTED DOWNTIME
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-[#2e1065]">
                  {maintenanceWindow || "02:00 - 04:00 UTC"}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-[#2e1065] bg-white">
                <HiClock className="h-8 w-8 text-[#22c55e]" />
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border-4 border-[#2e1065] bg-white p-6">
            <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#2e1065] bg-[#ec4899] text-white">
              <span className="text-xl font-extrabold">!</span>
            </div>

            <p className="mb-2 text-xs font-extrabold tracking-[0.16em] text-[#4c1d95] uppercase">
              หมายเหตุ
            </p>
            <p className="text-base leading-relaxed font-bold text-[#2e1065]">{maintenanceNote}</p>
          </div>

          <div className="pt-1 text-sm font-bold text-[#2e1065]">
            ระบบจะกลับมาออนไลน์โดยอัตโนมัติหลังงานบำรุงรักษาเสร็จสิ้น
          </div>
        </section>
      </div>
    </main>
  );
}
