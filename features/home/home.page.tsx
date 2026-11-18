"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePoolData } from "@/hooks/usePoolData";

interface LeaderboardEntry {
  name: string;
  time: number; // milliseconds
}

export default function HomeComponent() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { pool, loading: poolLoading } = usePoolData();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  function handleStartGame() {
    router.push("/transaction/process");
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-10 text-[#1A1A2E]">
      {/* Background Decorative Elements */}

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center px-4 pt-10">
        {/* Header */}
        <div className="relative mb-8 w-full text-center">
          <div className="relative inline-block">
            <h1 className="text-stroke mb-4 -rotate-2 transform text-3xl leading-relaxed font-bold text-[#6A0DAD] md:text-4xl">
              BITCOIN
              <br />
              SNAKE GAME
            </h1>
            <div className="absolute -top-4 right-7 animate-bounce text-4xl">🐍</div>
          </div>
          <div className="shadow-retro mt-2 inline-block rotate-1 transform border-4 border-black bg-white p-3">
            <p className="font-['VT323'] text-xl font-bold tracking-wider text-black md:text-2xl">
              ลุ้นรับ Bitcoin Sats <br />
              ทุกวันที่ 21
            </p>
          </div>
          {!poolLoading && pool > 0 && (
            <div className="mt-3">
              <div className="shadow-retro inline-block border-2 border-black bg-[#32CD32] px-4 py-2">
                <p className="font-['VT323'] text-lg font-bold tracking-wide text-black">
                  🎁 Prize Pool: {pool} Sats
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartGame}
          className="shadow-retro-lg hover:shadow-retro active:shadow-retro-active group wiggle relative mb-10 w-56 transform overflow-hidden border-4 border-black bg-[#6A0DAD] py-4 font-['Press_Start_2P'] text-3xl tracking-widest text-white transition-all duration-100 hover:translate-y-1 active:translate-y-2"
        >
          <span className="relative z-10 uppercase">START GAME</span>
        </button>

        {/* Insert Coin Card */}
        <div className="shadow-retro-lg relative mb-12 w-full border-4 border-black bg-[#1A1A2E] p-6 text-center">
          <div className="absolute top-0 left-0 h-4 w-4 border-r-4 border-b-4 border-black bg-[#FFD700]"></div>
          <div className="absolute top-0 right-0 h-4 w-4 border-b-4 border-l-4 border-black bg-[#32CD32]"></div>
          <div className="absolute bottom-0 left-0 h-4 w-4 border-t-4 border-r-4 border-black bg-[#FF00FF]"></div>
          <div className="absolute right-0 bottom-0 h-4 w-4 border-t-4 border-l-4 border-black bg-[#6A0DAD]"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex -rotate-2 items-center justify-center gap-3 bg-black px-4 py-1">
              <span className="animate-pulse text-2xl">💰</span>
              <h2 className="font-['Press_Start_2P'] text-lg font-bold tracking-wider text-[#FFD700] uppercase md:text-xl">
                INSERT COIN
              </h2>
            </div>
            <div className="mb-4 rounded border-2 border-dashed border-[#32CD32] bg-[#32CD32]/10 p-4">
              <p className="mb-1 font-['VT323'] text-xl text-[#FFF8E7]">ENTRY FEE</p>
              <h1 className="text-stroke font-['Press_Start_2P'] text-4xl font-bold tracking-widest text-[#32CD32] text-shadow-lg">
                100 SATS
              </h1>
            </div>
            <div className="inline-block rotate-1 transform border-2 border-black bg-[#6A0DAD] px-4 py-2">
              <p className="font-['VT323'] text-lg font-bold tracking-wide text-white uppercase">
                🏆 High Score = Big Prize!
              </p>
            </div>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="mb-12 w-full">
          <h3 className="shadow-retro mx-auto mb-8 inline-block w-max -rotate-1 transform border-4 border-black bg-white px-4 py-2 text-center font-['Press_Start_2P'] text-xl font-bold text-black md:text-2xl">
            HOW TO PLAY
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="shadow-retro group relative flex items-center gap-4 border-4 border-black bg-white p-4 transition-colors hover:bg-[#FFF8E7]">
              <div className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center border-2 border-black bg-[#FF00FF] font-['Press_Start_2P'] text-xs text-white shadow-sm">
                1
              </div>
              <div className="text-4xl grayscale filter transition-all group-hover:grayscale-0">
                💳
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-['Press_Start_2P'] text-xs font-bold text-black uppercase md:text-sm">
                  PAY ENTRY
                </h4>
                <p className="font-['VT323'] text-lg leading-tight text-gray-600">
                  Pay 100 Sats to unlock 3 credits.
                </p>
              </div>
            </div>
            <div className="shadow-retro group relative flex items-center gap-4 border-4 border-black bg-white p-4 transition-colors hover:bg-[#FFF8E7]">
              <div className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center border-2 border-black bg-[#6A0DAD] font-['Press_Start_2P'] text-xs text-white shadow-sm">
                2
              </div>
              <div className="text-4xl grayscale filter transition-all group-hover:grayscale-0">
                🎮
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-['Press_Start_2P'] text-xs font-bold text-black uppercase md:text-sm">
                  3 LIVES
                </h4>
                <p className="font-['VT323'] text-lg leading-tight text-gray-600">
                  You get 3 rounds. Make them count!
                </p>
              </div>
            </div>
            <div className="shadow-retro group relative flex items-center gap-4 border-4 border-black bg-white p-4 transition-colors hover:bg-[#FFF8E7]">
              <div className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center border-2 border-black bg-[#32CD32] font-['Press_Start_2P'] text-xs text-white shadow-sm">
                3
              </div>
              <div className="text-4xl grayscale filter transition-all group-hover:grayscale-0">
                🍎
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-['Press_Start_2P'] text-xs font-bold text-black uppercase md:text-sm">
                  COLLECT 21
                </h4>
                <p className="font-['VT323'] text-lg leading-tight text-gray-600">
                  Eat 21 fruits per round. Speed is key.
                </p>
              </div>
            </div>
            <div className="shadow-retro group relative flex items-center gap-4 border-4 border-black bg-white p-4 transition-colors hover:bg-[#FFF8E7]">
              <div className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center border-2 border-black bg-[#FFD700] font-['Press_Start_2P'] text-xs text-black shadow-sm">
                4
              </div>
              <div className="text-4xl grayscale filter transition-all group-hover:grayscale-0">
                ⚡
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-['Press_Start_2P'] text-xs font-bold text-black uppercase md:text-sm">
                  TOP SCORE
                </h4>
                <p className="font-['VT323'] text-lg leading-tight text-gray-600">
                  Only your best time goes to Leaderboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Rules Section */}
        <div className="mb-16 w-full">
          <h3 className="shadow-retro mx-auto mb-8 inline-block w-max rotate-1 transform border-4 border-black bg-[#FF00FF] px-4 py-2 text-center font-['Press_Start_2P'] text-xl font-bold text-white md:text-2xl">
            GAME RULES
          </h3>
          <div className="shadow-retro-lg relative overflow-hidden border-4 border-black bg-[#1A1A2E] p-4">
            <div className="absolute top-0 left-0 h-1 w-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="space-y-4 font-['VT323'] text-xl">
              <div className="flex items-start gap-3 border-b-2 border-dashed border-gray-700 pb-2">
                <span className="min-w-7.5 font-bold text-[#32CD32]">&gt;01</span>
                <div>
                  <h4 className="mb-0 text-[#FFD700] uppercase">Fee</h4>
                  <p className="text-[#FFF8E7]">100 Sats to play.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-b-2 border-dashed border-gray-700 pb-2">
                <span className="min-w-7.5 font-bold text-[#32CD32]">&gt;02</span>
                <div>
                  <h4 className="mb-0 text-[#FFD700] uppercase">Rounds</h4>
                  <p className="text-[#FFF8E7]">3 attempts per entry.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-b-2 border-dashed border-gray-700 pb-2">
                <span className="min-w-7.5 font-bold text-[#32CD32]">&gt;03</span>
                <div>
                  <h4 className="mb-0 text-[#FFD700] uppercase">Goal</h4>
                  <p className="text-[#FFF8E7]">21 fruits per round.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-b-2 border-dashed border-gray-700 pb-2">
                <span className="min-w-7.5 font-bold text-[#32CD32]">&gt;04</span>
                <div>
                  <h4 className="mb-0 text-[#FFD700] uppercase">Rank</h4>
                  <p className="text-[#FFF8E7]">Fastest time wins.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-b-2 border-dashed border-gray-700 pb-2">
                <span className="min-w-7.5 font-bold text-[#32CD32]">&gt;05</span>
                <div>
                  <h4 className="mb-0 text-[#FFD700] uppercase">Pool</h4>
                  <p className="text-[#FFF8E7]">More players = Bigger pot.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="min-w-7.5 font-bold text-[#32CD32]">&gt;06</span>
                <div>
                  <h4 className="mb-0 text-[#FFD700] uppercase">Payout</h4>
                  <p className="text-[#FFF8E7]">Every 21st of month.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prize Pool Section */}
        <div className="shadow-retro-lg relative mb-24 w-full overflow-visible border-4 border-black bg-[#6A0DAD] p-6 text-center">
          <div className="text-md absolute -top-5 left-1/2 z-20 -translate-x-1/2 border-2 border-white bg-black px-4 py-1 font-['Press_Start_2P'] text-white">
            LEVEL UP!
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex items-center gap-2">
              <span className="animate-bounce text-3xl">🎁</span>
              <h3 className="text-stroke font-['Press_Start_2P'] text-xl font-bold tracking-widest text-white md:text-2xl">
                PRIZE POOL
              </h3>
            </div>
            <p className="mb-6 rounded border border-white/20 bg-black/20 p-2 font-['VT323'] text-xl leading-relaxed text-white">
              Entry fees from{" "}
              <span className="font-bold text-[#FFD700] underline decoration-wavy">
                ALL PLAYERS
              </span>{" "}
              fill the treasure chest!
            </p>
            <div className="mb-8 w-full">
              <div className="mb-4 border-2 border-white/50 bg-black p-2">
                <p className="font-['VT323'] text-lg text-white uppercase">OVERALL POOL SPLIT</p>
                <div className="mt-2 flex justify-around">
                  <span className="font-['Press_Start_2P'] text-xl text-[#32CD32]">
                    70% TO PRIZES
                  </span>
                  <span className="font-['Press_Start_2P'] text-xl text-[#FF00FF]">
                    30% TO DEV FUND
                  </span>
                </div>
              </div>
              <div className="border-retro-yellow rounded border-2 border-dashed p-4 text-white">
                <p className="text-retro-yellow mb-2 font-['Press_Start_2P'] text-lg">
                  PRIZE DISTRIBUTION:
                </p>
                <p className="mb-1 font-['VT323'] text-xl">First place receives 80% of the prize</p>
                <p className="mb-1 font-['VT323'] text-xl">
                  Second place receives 15% of the prize
                </p>
                <p className="font-['VT323'] text-xl">Third place receives 5% of the prize </p>
              </div>
            </div>
            <div className="shadow-retro mb-8 w-full -rotate-1 transform border-4 border-black bg-[#FFD700] px-6 py-3">
              <p className="font-['Press_Start_2P'] text-2xl font-bold tracking-wide text-black uppercase md:text-5xl">
                More Players = More Loot!
              </p>
            </div>
            <div className="w-full space-y-4 rounded-lg border-2 border-dashed border-white/30 bg-black/40 p-4">
              <p className="font-['VT323'] text-lg text-gray-300">
                Fastest player of the month wins
              </p>
              <div>
                <h4 className="text-stroke mb-2 font-['Press_Start_2P'] text-5xl text-[#FFD700]">
                  {poolLoading ? "..." : `${pool} SATS`}
                </h4>
              </div>
              <div className="mt-3 border-t border-white/20 pt-3">
                <p className="mb-1 font-['VT323'] text-lg text-gray-300">PAYOUT DATE:</p>
                <h4 className="font-['Press_Start_2P'] text-xl font-bold text-white">
                  21st <span className="text-sm font-normal text-[#32CD32]">MONTHLY</span>
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="shadow-retro-lg relative mb-16 w-full overflow-hidden border-4 border-black bg-white p-6 text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="animate-pulse text-4xl">🏆</span>
            <h3 className="text-stroke font-['Press_Start_2P'] text-2xl font-bold tracking-widest text-[#6A0DAD] uppercase">
              Top Players
            </h3>
            <span className="animate-pulse text-4xl">🏆</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center font-['VT323'] text-xl text-[#6A0DAD]">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-8 text-center font-['VT323'] text-xl text-[#6A0DAD]">
                No scores yet. Be the first! 🚀
              </div>
            ) : (
              leaderboard.map((player, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={rank}
                    className={`shadow-retro flex items-center justify-between border-4 border-black p-4 transition-all ${
                      rank === 1
                        ? "scale-105 bg-[#FFD700]"
                        : rank === 2
                          ? "bg-[#C0C0C0]"
                          : rank === 3
                            ? "bg-[#CD7F32]"
                            : "bg-[#F5F5F5]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-['Press_Start_2P'] text-3xl font-bold ${
                          rank === 1 ? "text-black" : "text-[#6A0DAD]"
                        }`}
                      >
                        #{rank}
                      </span>
                      <div className="w-48 overflow-hidden">
                        <div className="marquee font-['VT323'] text-2xl font-bold whitespace-nowrap text-black uppercase">
                          {player.name}
                        </div>
                      </div>
                    </div>
                    <span className="font-['Press_Start_2P'] text-xl font-bold tracking-wider text-black">
                      {formatTime(player.time)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-8 border-t-4 border-black pt-6">
            <p className="font-['VT323'] text-lg text-gray-600">
              💡 <span className="font-bold text-black">TIP:</span> Fastest time of the month wins
              big!
            </p>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="pointer-events-none fixed bottom-0 left-0 z-50 flex w-full justify-center bg-linear-to-t from-[#FFD700] via-[#FFD700] to-transparent p-4 pt-10 pb-8">
          <button
            onClick={handleStartGame}
            className="shadow-retro hover:shadow-retro-lg wiggle pointer-events-auto w-64 transform border-4 border-black bg-[#32CD32] py-4 font-['Press_Start_2P'] text-3xl font-bold text-black uppercase transition-all duration-200 hover:-translate-y-1"
          >
            Insert Coin
          </button>
        </div>

        {/* Footer */}
        <footer className="pb-24 text-center font-['VT323'] text-sm text-black/60">
          <p>
            © 2024 Bitcoin Snake Game. <br />
            Game Over. Continue?
          </p>
        </footer>
      </div>
    </div>
  );
}
