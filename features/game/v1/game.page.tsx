"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateUserId } from "@/hooks/useUserPlayLog";
import { usePoolData } from "@/hooks/usePoolData";
import SnakeGameCanvas from "@/features/game/v1/game.canvas";
import type { GameCanvasHandle } from "@/features/game/v1/game.canvas";
import { FaBitcoin } from "react-icons/fa";
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowUp } from "react-icons/fa";
import { FaAppleWhole } from "react-icons/fa6";
import ScoreSubmissionModal from "@/features/game/v1/score-submission-modal";
import {
  playSound,
  playBGM,
  stopBGM,
  stopCountdownSound,
  stopVictorySound,
} from "@/lib/sound-utils";

export default function SnakeGamePage() {
  const router = useRouter();
  const [logLoading, setLogLoading] = useState(true);
  const userId = typeof window !== "undefined" ? getOrCreateUserId() : "";
  const { pool, loading: poolLoading } = usePoolData();

  const [timeRec, setTimeRec] = useState(0);
  const [fruitsCollected, setFruitsCollected] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showScoreSubmission, setShowScoreSubmission] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [playTimes, setPlayTimes] = useState<number[]>([]);
  const [canvasKey, setCanvasKey] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [pendingBgmStart, setPendingBgmStart] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [paymentHash, setPaymentHash] = useState("");
  const [invoiceSubmitted, setInvoiceSubmitted] = useState(false);
  const [invoicePaid, setInvoicePaid] = useState(false);

  const canvasRef = useRef<GameCanvasHandle>(null);
  const gameOverSavedRef = useRef(false);
  const timeRecRef = useRef(0);
  const timerStartedAtRef = useRef<number | null>(null);
  const countdownPlayedRef = useRef<Set<number>>(new Set());
  const isMutedRef = useRef(isMuted);
  const MAX_PLAYS = 3;
  const showBootstrapOverlay = logLoading || redirecting;

  const fetchRounds = useCallback(async (playerId: string, hash: string): Promise<boolean> => {
    const roundsRes = await fetch(
      `/api/collect-log?playerId=${encodeURIComponent(playerId)}&paymentHash=${encodeURIComponent(hash)}`
    );
    const roundsData = await roundsRes.json();
    const rounds = Array.isArray(roundsData?.rounds) ? roundsData.rounds : [];
    setPlayCount(rounds.length);
    setPlayTimes(
      rounds
        .filter((r: { timeMs?: number | null }) => typeof r.timeMs === "number")
        .map((r: { timeMs: number }) => r.timeMs)
    );

    const submitted = rounds.some((r: { submitted?: boolean }) => r.submitted === true);
    setInvoiceSubmitted(submitted);

    const hasUnsubmitted = rounds.length > 0 && !submitted;
    return hasUnsubmitted;
  }, []);

  // Mount checks: invoice must be paid, then load rounds from CollectLog.
  useEffect(() => {
    const bootstrap = async () => {
      if (!userId) return;
      setLogLoading(true);

      try {
        const hash = localStorage.getItem("snake_payment_hash") ?? "";
        if (!hash) {
          setRedirecting(true);
          router.push("/transaction/process");
          return;
        }

        setPaymentHash(hash);

        const statusRes = await fetch(`/api/payments/${encodeURIComponent(hash)}/status`);
        const statusData = await statusRes.json();
        if (!statusRes.ok || statusData.dbPaid !== true) {
          setRedirecting(true);
          router.push("/transaction/process");
          return;
        }

        setInvoicePaid(true);
        const hasUnsubmitted = await fetchRounds(userId, hash);
        // If there are unfinished/unsubmitted rounds from previous session, open submission modal.
        if (hasUnsubmitted) {
          setShowModal(false);
          setShowScoreSubmission(true);
        } else {
          setShowCountdown(true);
        }
      } catch (error) {
        console.error("Failed to bootstrap game session:", error);
        setRedirecting(true);
        router.push("/transaction/process");
      } finally {
        setLogLoading(false);
      }
    };

    bootstrap();
  }, [userId, router, fetchRounds]);

  // Keep isMutedRef in sync with isMuted state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Hydrate from localStorage after client mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gameMuted");
      const savedValue = saved ? JSON.parse(saved) : false;
      isMutedRef.current = savedValue;
      const hash = localStorage.getItem("snake_payment_hash") ?? "";
      queueMicrotask(() => {
        setIsMuted(savedValue);
        setPaymentHash(hash);
        setIsHydrated(true);
      });
      // Countdown is started by the bootstrap effect after checking for existing rounds
    }
  }, []);

  // Save isMuted to localStorage
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem("gameMuted", JSON.stringify(isMuted));
    }
  }, [isMuted, isHydrated]);

  // Timer uses monotonic clock so throttled intervals (e.g. Safari low power mode)
  // still report accurate elapsed time.
  useEffect(() => {
    if (gameOver) return;
    if (timerStartedAtRef.current === null) {
      timerStartedAtRef.current = performance.now() - timeRecRef.current;
    }

    const updateElapsed = () => {
      if (timerStartedAtRef.current === null) return;
      const elapsed = Math.max(0, Math.round(performance.now() - timerStartedAtRef.current));
      timeRecRef.current = elapsed;
      setTimeRec(elapsed);
    };

    const timer = setInterval(updateElapsed, 50);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateElapsed();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameOver]);

  // Simple countdown logic - just decrement and play sound once at 3 seconds
  // Guard: do not tick while any modal is visible
  useEffect(() => {
    if (!showCountdown || !isHydrated || showModal || showScoreSubmission) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        const next = prev - 1;

        // Play countdown sound only once when reaching 3 seconds
        if (!isMutedRef.current && next === 3 && !countdownPlayedRef.current.has(3)) {
          countdownPlayedRef.current.add(3);
          playSound("countdown");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown, isHydrated, showModal, showScoreSubmission]);

  // When countdown reaches 0, start the game (only if no modal is blocking)
  useEffect(() => {
    if (countdownSeconds <= 0 && showCountdown && !showModal && !showScoreSubmission) {
      stopCountdownSound();
      queueMicrotask(() => {
        setShowCountdown(false);
        setGameStarted(true);
        canvasRef.current?.startGame();
      });
    }
  }, [countdownSeconds, showCountdown, showModal, showScoreSubmission]);

  // Handle modal display and save playtime after game ends
  useEffect(() => {
    if (gameOver && !gameOverSavedRef.current) {
      gameOverSavedRef.current = true;
      setPlayTimes((prev) => [...prev, timeRecRef.current]);
      setShowModal(true);
    }
  }, [gameOver]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    canvasRef.current?.setDirection(direction);
  };

  const handleCollectFruit = useCallback(() => {
    if (!isMutedRef.current) playSound("collect");
  }, []);

  const handleGameWin = useCallback(() => {
    if (!isMutedRef.current) playSound("victory");
  }, []);

  const handleGameEnd = useCallback(() => {
    stopBGM();
  }, []);

  const handleGameStart = useCallback(() => {
    if (!isMutedRef.current) {
      playBGM().then((ok) => {
        if (!ok) {
          // Autoplay likely blocked; defer until next user gesture
          setPendingBgmStart(true);
        }
      });
    }
    setFruitsCollected(0);
    timeRecRef.current = 0;
    timerStartedAtRef.current = performance.now();
    setTimeRec(0);
    setGameOver(false);

    if (userId && paymentHash) {
      const round = playCount + 1;
      void fetch("/api/collect-log/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: userId, paymentHash, round }),
      });
    }
  }, [paymentHash, playCount, userId]);

  // If autoplay blocked, start BGM on the next user gesture
  useEffect(() => {
    if (!pendingBgmStart) return;

    const tryStart = () => {
      if (isMutedRef.current) return;
      playBGM().then((ok) => {
        if (ok) {
          cleanup();
          setPendingBgmStart(false);
        }
      });
    };

    const onGesture = () => tryStart();
    const cleanup = () => {
      document.removeEventListener("click", onGesture);
      document.removeEventListener("keydown", onGesture);
      document.removeEventListener("touchstart", onGesture);
    };

    document.addEventListener("click", onGesture, { once: true });
    document.addEventListener("keydown", onGesture, { once: true });
    document.addEventListener("touchstart", onGesture, { once: true });

    return cleanup;
  }, [pendingBgmStart]);

  const handleSkipCountdown = () => {
    stopCountdownSound();
    setShowCountdown(false);
    setGameStarted(true);
    canvasRef.current?.startGame();
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // If game is currently playing, immediately control BGM
    if (gameStarted && !gameOver) {
      if (newMutedState) {
        stopBGM();
      } else {
        playBGM().then((ok) => {
          if (!ok) {
            setPendingBgmStart(true);
          }
        });
      }
    }
  };

  const handlePlayAgain = async () => {
    stopVictorySound();
    stopBGM();
    gameOverSavedRef.current = false;
    timeRecRef.current = 0;
    timerStartedAtRef.current = null;
    countdownPlayedRef.current.clear();
    setShowModal(false);
    setShowScoreSubmission(false);
    setGameOver(false);
    setFruitsCollected(0);
    setTimeRec(0);
    setCountdownSeconds(10);
    setShowCountdown(true);
    setGameStarted(false);
    setCanvasKey((prev) => prev + 1);
  };

  const handleSubmitScore = () => {
    setShowModal(false);
    setShowCountdown(false);
    setShowScoreSubmission(true);
  };

  // When cancelling score submission: if player still has rounds, start the countdown
  const handleCancelScoreSubmission = () => {
    setShowScoreSubmission(false);
    // Don't auto-start countdown if the game-over modal is still showing
    if (!showModal && invoicePaid && playCount < MAX_PLAYS && !invoiceSubmitted) {
      setCountdownSeconds(10);
      setShowCountdown(true);
    }
  };

  const handleScoreSubmitSuccess = () => {
    setShowScoreSubmission(false);
    setShowModal(false);
    // Stop countdown when closing the modal to prevent interference
    setShowCountdown(false);
    setCountdownSeconds(10);
  };

  // ป้องกันเล่นเกินรอบหรือยังไม่ได้จ่ายเงิน
  const canPlay = invoicePaid && playCount < MAX_PLAYS && !invoiceSubmitted;
  // แจ้งเตือนถ้าเล่นครบ 3 ครั้งหรือยังไม่ได้จ่ายเงิน
  let playBlockMsg = "";
  if (!invoicePaid) playBlockMsg = "กรุณาชำระเงินก่อนเล่น";
  else if (playCount >= MAX_PLAYS) playBlockMsg = "เล่นครบ 3 ครั้งแล้ว";
  else if (invoiceSubmitted) playBlockMsg = "คุณส่งคะแนนไปแล้ว";

  return (
    <div className="relative flex min-h-dvh touch-manipulation flex-col items-center overflow-hidden text-[#1A1A2E] select-none">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col px-4 py-4">
        {!redirecting && !logLoading && !canPlay && (
          <div className="mb-4 text-center text-lg font-bold text-red-600">{playBlockMsg}</div>
        )}
        <div className="relative hidden md:inline-block">
          <h1 className="text-stroke mb-4 -rotate-2 transform text-3xl leading-relaxed font-bold text-[#6A0DAD] md:text-4xl">
            BITCOIN
            <br />
            SNAKE GAME
          </h1>
          <div className="absolute top-9 right-7 animate-bounce text-4xl">🐍</div>
        </div>
        <div
          className="flex"
          style={!canPlay || redirecting ? { pointerEvents: "none", opacity: 0.5 } : {}}
        >
          <SnakeGameCanvas
            key={canvasKey}
            ref={canvasRef}
            autoStart={false}
            onFruitCollected={(count) => setFruitsCollected(count)}
            onCollectFruit={handleCollectFruit}
            onGameWin={handleGameWin}
            onGameEnd={handleGameEnd}
            onGameStart={handleGameStart}
            onGameOver={(_elapsed, roundLog) => {
              setGameOver(true);

              const currentRound = playCount + 1;
              setPlayCount((prev) => Math.max(prev, currentRound));
              if (userId && paymentHash) {
                void fetch("/api/collect-log", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    playerId: userId,
                    paymentHash,
                    round: currentRound,
                    time_ms: roundLog.time_ms,
                    collect_time: roundLog.collect_time,
                    collect_move: roundLog.collect_move,
                    collect_fruit: roundLog.collect_fruit,
                  }),
                }).then(() => fetchRounds(userId, paymentHash));
              }
            }}
          />
        </div>
        <div className="flex justify-center md:hidden">
          <div className="mt-1 bg-black px-6 py-1">
            <p className="text-md leading-none tracking-widest text-[#32CD32] md:text-4xl">
              {formatTime(timeRec)}
            </p>
          </div>
        </div>
        <div className="shadow-retro flex transform flex-row items-center justify-center gap-2 border-4 border-black bg-white md:hidden">
          <div className="flex items-center">
            <div className="flex items-center">
              <FaAppleWhole size={20} className="md:h-6 md:w-6" />
              <span className="pt-1 pl-1 text-xs font-bold text-black md:pl-2 md:text-lg">
                ผลไม้:
              </span>
            </div>
            <span className="font-display pt-0.5 text-base text-[#6A0DAD] md:pt-1 md:text-2xl">
              {fruitsCollected} / 21
            </span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-1 md:gap-2">
              <FaBitcoin size={20} className="md:h-6 md:w-6" />
              <span className="pt-1 text-xs font-bold text-shadow-sm md:text-lg">รางวัล:</span>
            </div>
            <span className="font-display pt-0.5 text-base text-[#FFD700] md:pt-1 md:text-2xl">
              {poolLoading ? "..." : pool} sats
            </span>
          </div>
        </div>

        <div className="pb-safe flex grow flex-col gap-3">
          <div className="mt-4 mb-2 hidden justify-center md:flex">
            <div className="shadow-retro -rotate-2 transform rounded border-4 border-black bg-white px-6 py-1">
              <p className="text-md leading-none tracking-widest text-[#32CD32] md:text-4xl">
                {formatTime(timeRec)}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-row gap-2 md:flex-col md:gap-3">
            <div className="shadow-retro hidden flex-1 transform flex-row items-center justify-center border-4 border-black bg-white p-2 transition-transform hover:-translate-y-0.5 md:flex md:flex-row md:justify-between md:p-3">
              <div className="flex items-center">
                <FaAppleWhole size={20} className="md:h-6 md:w-6" />
                <span className="pt-1 pl-1 text-xs font-bold text-black md:pl-2 md:text-lg">
                  ผลไม้:
                </span>
              </div>
              <span className="font-display pt-0.5 text-base text-[#6A0DAD] md:pt-1 md:text-2xl">
                {fruitsCollected} / 21
              </span>
            </div>

            <div className="shadow-retro hidden flex-1 transform flex-col items-center justify-center border-4 border-black bg-[#6A0DAD] p-2 text-white transition-transform hover:-translate-y-0.5 md:flex md:flex-row md:justify-between md:p-3">
              <div className="flex items-center gap-1 md:gap-2">
                <FaBitcoin size={20} className="md:h-6 md:w-6" />
                <span className="pt-1 text-xs font-bold text-shadow-sm md:text-lg">รางวัล:</span>
              </div>
              <span className="font-display pt-0.5 text-base text-[#FFD700] md:pt-1 md:text-2xl">
                {poolLoading ? "..." : pool} sats
              </span>
            </div>
          </div>

          <div className="relative mt-auto w-full pb-2">
            <div className="mb-3 hidden justify-center md:flex">
              <div className="rotate-1 transform border-2 border-black bg-white px-4 py-1.5 shadow-[3px_3px_0px_0px_#000000]">
                <p className="font-body pt-0.5 text-xl leading-none text-[#1A1A2E]">
                  <span className="font-bold text-[#6A0DAD] uppercase">HOW TO PLAY:</span> Use
                  arrows or WASD
                </p>
              </div>
            </div>
            <div className="flex w-full justify-center">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-start-2">
                  <button
                    className="shadow-retro active:shadow-retro-active group flex h-20 w-18 touch-manipulation items-center justify-center rounded-lg border-4 border-black bg-white transition-all active:translate-x-1 active:translate-y-1"
                    onClick={() => handleMove("up")}
                  >
                    <span className="material-symbols-outlined text-4xl font-bold text-black select-none">
                      <FaArrowUp size={30} />W
                    </span>
                  </button>
                </div>

                <div className="col-start-1 row-start-2">
                  <button
                    className="shadow-retro active:shadow-retro-active group flex h-20 w-18 touch-manipulation items-center justify-center rounded-lg border-4 border-black bg-white transition-all active:translate-x-1 active:translate-y-1 active:scale-95"
                    onClick={() => handleMove("left")}
                  >
                    <span className="material-symbols-outlined text-4xl font-bold text-black select-none">
                      <FaArrowLeft size={30} />A
                    </span>
                  </button>
                </div>
                <div className="col-start-2 row-start-2">
                  <button
                    className="shadow-retro active:shadow-retro-active group flex h-20 w-18 touch-manipulation items-center justify-center rounded-lg border-4 border-black bg-white transition-all active:translate-x-1 active:translate-y-1 active:scale-95"
                    onClick={() => handleMove("down")}
                  >
                    <span className="material-symbols-outlined text-4xl font-bold text-black select-none">
                      <FaArrowDown size={30} />S
                    </span>
                  </button>
                </div>
                <div className="col-start-3 row-start-2">
                  <button
                    className="shadow-retro active:shadow-retro-active group flex h-20 w-18 touch-manipulation items-center justify-center rounded-lg border-4 border-black bg-white transition-all active:translate-x-1 active:translate-y-1 active:scale-95"
                    onClick={() => handleMove("right")}
                  >
                    <span className="material-symbols-outlined text-4xl font-bold text-black select-none">
                      <FaArrowRight size={30} />D
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute right-0 bottom-2">
              <button
                className="shadow-retro active:shadow-retro-active group flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border-4 border-black bg-white transition-all active:translate-x-1 active:translate-y-1"
                onClick={toggleMute}
              >
                <span className="text-xl select-none">{isMuted ? "🔇" : "🔊"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBootstrapOverlay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1A1A2E]/88 backdrop-blur-sm">
          <div className="shadow-retro mx-4 w-full max-w-sm border-4 border-black bg-white p-6 text-center">
            <div className="mb-4 text-5xl">🐍</div>
            <p className="text-stroke mb-2 text-2xl font-bold text-[#6A0DAD]">
              {redirecting ? "กำลังพาไปหน้าชำระเงิน" : "กำลังตรวจสอบข้อมูลการเล่น"}
            </p>
            <p className="text-sm font-bold text-black/70">
              {redirecting
                ? "รอสักครู่ ระบบกำลังเปลี่ยนหน้าให้"
                : "กำลังเช็ค invoice และ collect log ของรอบล่าสุด"}
            </p>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {showCountdown && !gameStarted && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="mb-6 text-9xl font-bold text-[#32CD32]">
              {countdownSeconds > 0 ? countdownSeconds : "ไป!"}
            </div>
            <p className="mb-8 text-2xl font-bold text-white">
              {countdownSeconds > 0 ? "เตรียมตัวให้พร้อม!" : "เกมเริ่ม!"}
            </p>
          </div>
          <button
            onClick={handleSkipCountdown}
            className="shadow-retro border-4 border-white bg-[#6A0DAD] px-8 py-4 text-xl font-bold text-white transition-all hover:-translate-y-1 active:translate-x-1 active:translate-y-1"
          >
            ▶ เริ่มเกมเลย
          </button>
        </div>
      )}

      {/* Game Over Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="shadow-retro mx-4 w-full max-w-md transform border-4 border-black bg-white p-6 text-center">
            <div className="mb-4 text-4xl">⚡</div>
            <h2 className="text-stroke mb-2 text-3xl font-bold text-[#6A0DAD]">ยินดีด้วย!</h2>
            <p className="mb-2 text-lg font-bold text-black">คุณเก็บครบทั้ง 21 ลูก</p>
            <p className="mb-4 text-base text-black">คุณใช้เวลา {formatTime(timeRec)}</p>
            <p className="mb-6 text-sm text-gray-600">
              รอบที่เล่น: {playCount}/{MAX_PLAYS}
            </p>

            <div className="flex flex-col gap-3">
              {playCount < MAX_PLAYS && (
                <button
                  onClick={handlePlayAgain}
                  className="shadow-retro w-full transform border-4 border-black bg-[#32CD32] px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1"
                >
                  🔄 เล่นใหม่ ({playCount}/{MAX_PLAYS})
                </button>
              )}
              <button
                onClick={handleSubmitScore}
                className="shadow-retro w-full transform border-4 border-black bg-[#6A0DAD] px-6 py-3 text-lg font-bold text-white transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1"
              >
                ✅ ออกเพื่อส่งแต้ม
              </button>
            </div>

            {timeRec > 0 && (
              <div className="mt-4 border-t-2 border-black pt-4">
                <p className="mb-2 text-sm font-bold text-[#6A0DAD]">เวลาของแต่ละรอบ:</p>
                {playTimes.map((time, idx) => (
                  <p key={idx} className="text-sm text-gray-700">
                    รอบที่ {idx + 1}: {formatTime(time)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Submission Modal */}
      {showScoreSubmission && (
        <ScoreSubmissionModal
          playerId={userId}
          paymentHash={paymentHash}
          onSubmitSuccess={handleScoreSubmitSuccess}
          onCancel={handleCancelScoreSubmission}
        />
      )}
    </div>
  );
}
