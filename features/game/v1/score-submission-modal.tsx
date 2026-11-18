"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ScoreSubmissionModalProps {
  playerId: string;
  paymentHash: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

interface CollectRound {
  round: number;
  timeMs: number | null;
  submitted: boolean;
}

const WALLET_DOMAIN = "walletofsatoshi.com";

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
};

export default function ScoreSubmissionModal({
  playerId,
  paymentHash,
  onSubmitSuccess,
  onCancel,
}: ScoreSubmissionModalProps) {
  const router = useRouter();
  const [rounds, setRounds] = useState<CollectRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [showNameSuggestion, setShowNameSuggestion] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const res = await fetch(
          `/api/collect-log?playerId=${encodeURIComponent(playerId)}&paymentHash=${encodeURIComponent(paymentHash)}`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to fetch rounds");
        }

        const available = (Array.isArray(data?.rounds) ? data.rounds : []).filter(
          (r: CollectRound) => r.timeMs !== null && r.submitted !== true
        );
        setRounds(available);
        setSelectedRound(available.length > 0 ? available[0].round : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลดข้อมูลรอบไม่สำเร็จ");
      } finally {
        setLoadingRounds(false);
      }
    };

    if (playerId && paymentHash) {
      fetchRounds();
      return;
    }

    queueMicrotask(() => {
      setLoadingRounds(false);
      setError("Missing player or invoice context.");
    });
  }, [playerId, paymentHash]);

  const bestRound = useMemo(() => {
    if (rounds.length === 0) return null;
    return rounds.reduce((best, current) => {
      if (best.timeMs == null) return current;
      if (current.timeMs == null) return best;
      return current.timeMs < best.timeMs ? current : best;
    });
  }, [rounds]);

  const nameSuggestion = useMemo(() => {
    const raw = name.trim();
    if (!raw) return null;

    const atIndex = raw.indexOf("@");

    if (atIndex === -1) {
      return `${raw}@${WALLET_DOMAIN}`;
    }

    const localPart = raw.slice(0, atIndex).trim();
    if (!localPart) return null;

    const domainPart = raw
      .slice(atIndex + 1)
      .trim()
      .toLowerCase();

    if (domainPart === WALLET_DOMAIN) {
      return null;
    }

    if (WALLET_DOMAIN.startsWith(domainPart) || domainPart.startsWith("wallet")) {
      return `${localPart}@${WALLET_DOMAIN}`;
    }

    return null;
  }, [name]);

  const applyNameSuggestion = () => {
    if (!nameSuggestion) return;
    setName(nameSuggestion);
    setShowNameSuggestion(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    if (selectedRound == null) {
      setError("กรุณาเลือกรอบที่ต้องการส่ง");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          paymentHash,
          round: selectedRound,
          name: name.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to submit score");
      }
      router.push("/");
      onSubmitSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งคะแนน กรุณาลองใหม่");
      console.error("Score submission error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="shadow-retro w-full max-w-md border-4 border-black bg-white p-6 text-center">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex justify-center">
            <span className="text-5xl">🏆</span>
          </div>
          <h2 className="text-stroke mb-3 text-3xl font-bold text-[#6A0DAD]">ส่งคะแนนของคุณ</h2>
          <div className="inline-block rotate-1 transform border-2 border-black bg-black px-3 py-1">
            <p className="text-lg font-bold text-[#32CD32]">ยินดีด้วย!</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold tracking-wider text-black" htmlFor="player-name">
              ชื่อของคุณ
            </label>
            <div className="relative">
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowNameSuggestion(true);
                }}
                onFocus={() => setShowNameSuggestion(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowNameSuggestion(false);
                  }, 100);
                }}
                onKeyDown={(e) => {
                  if (!nameSuggestion) return;
                  if (e.key === "Tab" || e.key === "ArrowDown") {
                    e.preventDefault();
                    applyNameSuggestion();
                  }
                }}
                placeholder="กรอกชื่อเพื่อลงลีดเดอร์บอร์ด"
                maxLength={50}
                disabled={isLoading}
                className="shadow-retro w-full border-4 border-black px-3 py-2 text-sm font-bold text-black placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A0DAD] focus:outline-none disabled:opacity-50"
                autoComplete="off"
              />

              {showNameSuggestion && nameSuggestion && (
                <div className="shadow-retro absolute z-10 mt-1 w-full border-4 border-black bg-white">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={applyNameSuggestion}
                    className="w-full px-3 py-2 text-left text-sm font-bold text-black hover:bg-[#f3e8ff]"
                  >
                    {nameSuggestion}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Round Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wider text-black">เลือกเวลาที่ต้องการส่ง</label>
            {loadingRounds && <p className="text-sm text-gray-600">Loading rounds...</p>}
            <div className="space-y-2">
              {rounds.map((round) => {
                const isSelected = selectedRound === round.round;
                const isBest = bestRound?.round === round.round;
                const time = round.timeMs ?? 0;

                return (
                  <label key={round.round} className="group block cursor-pointer">
                    <input
                      type="radio"
                      name="round"
                      value={round.round}
                      checked={isSelected}
                      onChange={() => setSelectedRound(round.round)}
                      className="peer sr-only"
                      disabled={isLoading || loadingRounds}
                    />
                    <div
                      className={`shadow-retro flex items-center justify-between border-4 border-black p-4 transition-all ${
                        isSelected
                          ? "translate-x-1 translate-y-1 bg-[#6A0DAD] text-white"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center border-2 border-black transition-all ${
                            isSelected ? "border-white bg-[#32CD32]" : "bg-white"
                          }`}
                        >
                          {isSelected && <span className="font-bold text-black">✓</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-md opacity-70">รอบที่ {round.round}</span>
                          <span
                            className={`text-xl font-bold tracking-widest ${
                              isSelected ? "text-[#FFD700]" : "text-[#6A0DAD]"
                            }`}
                          >
                            {formatTime(time)}
                          </span>
                        </div>
                      </div>
                      {isBest && <span className="animate-pulse text-2xl">⭐</span>}
                    </div>
                  </label>
                );
              })}
              {!loadingRounds && rounds.length === 0 && (
                <p className="text-sm text-gray-600">ยังไม่มีรอบที่ส่งคะแนนได้</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm font-bold text-red-600">{error}</p>}

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={
                isLoading ||
                loadingRounds ||
                rounds.length === 0 ||
                selectedRound == null ||
                !name.trim()
              }
              className="shadow-retro w-full border-4 border-black bg-[#32CD32] px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "⏳ กำลังส่ง..." : "✅ ส่งคะแนน"}
            </button>
            {rounds.length < 3 && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="font-body text-center text-black/60 underline decoration-2 underline-offset-4 hover:text-[#6A0DAD] disabled:cursor-not-allowed disabled:opacity-50"
              >
                เล่นต่อ
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
