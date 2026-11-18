"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaBitcoin, FaCheckCircle, FaWallet } from "react-icons/fa";
import { IoGameController } from "react-icons/io5";
import { IoIosPaper } from "react-icons/io";

function VerifyTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentHash = searchParams.get("hash");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string>("");

  useEffect(() => {
    const verifyStatus = async () => {
      const hash = paymentHash ?? localStorage.getItem("snake_payment_hash");
      if (!hash) {
        router.push("/transaction/process");
        return;
      }

      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(hash)}/status`);
        const data = await res.json();
        if (!res.ok || data.dbPaid !== true) {
          setStatusError("Payment is not confirmed yet.");
          router.push("/transaction/process");
          return;
        }
        localStorage.setItem("snake_payment_hash", hash);
      } catch (error) {
        console.error("Failed to verify invoice status:", error);
        setStatusError("Failed to verify payment status.");
        router.push("/transaction/process");
      } finally {
        setStatusLoading(false);
      }
    };

    verifyStatus();
  }, [paymentHash, router]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        // Fetch wallet balance from pool endpoint
        const res = await fetch("/api/pool");
        const data = await res.json();
        setBalance(data.total || 0);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, []);

  const handleContinueGame = () => {
    if (statusLoading || statusError) return;
    router.push("/game/snake/v1");
  };

  const handleViewTransaction = () => {
    if (paymentHash) {
      // Link to Lightning transaction viewer
      window.open(`https://mempool.space/lightning/tx/${paymentHash}`, "_blank");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden pb-10 text-[#1A1A2E]">
      <div className="relative z-10 mx-auto flex w-full max-w-md grow flex-col items-center px-4 pt-8">
        {/* Header */}
        <div className="relative mb-6 w-full text-center">
          <div className="relative inline-block">
            <h1 className="text-stroke mb-2 -rotate-2 transform text-2xl leading-relaxed font-bold text-[#6A0DAD] md:text-3xl">
              PAYMENT
              <br />
              CONFIRMED!
            </h1>
            <div className="absolute -top-3 -right-2 animate-bounce text-4xl">✨</div>
            <div
              className="absolute -bottom-2 -left-9 animate-bounce text-4xl"
              style={{ animationDelay: "0.2s" }}
            >
              ✨
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="shadow-retro-lg relative mb-8 w-full border-4 border-black bg-[#1A1A2E] p-6 text-center">
          <div className="absolute top-0 left-0 h-4 w-4 border-r-4 border-b-4 border-black bg-[#FFD700]"></div>
          <div className="absolute top-0 right-0 h-4 w-4 border-b-4 border-l-4 border-black bg-[#32CD32]"></div>
          <div className="absolute bottom-0 left-0 h-4 w-4 border-t-4 border-r-4 border-black bg-[#FF00FF]"></div>
          <div className="absolute right-0 bottom-0 h-4 w-4 border-t-4 border-l-4 border-black bg-[#6A0DAD]"></div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Success Badge */}
            <div className="mb-6 w-full rotate-1 transform rounded border-2 border-[#32CD32] bg-[#32CD32]/20 p-2">
              <p className="mb-0 flex items-center justify-center gap-2 text-3xl font-bold text-[#32CD32]">
                <FaCheckCircle />
                SUCCESS
              </p>
            </div>
            {/* Animated Sats Drop Animation */}
            <div className="relative mt-3 mb-8 flex h-48 w-full items-center justify-center">
              <div className="absolute top-0 z-20 flex animate-bounce flex-col items-center">
                <span className="mb-1 text-xl text-[#FFD700]">+100 SATS</span>
                <div className="rounded-full bg-white font-bold text-[#F7931A]">
                  <FaBitcoin size={60} />
                </div>
              </div>
              <div className="absolute bottom-0 z-10 pt-10">
                <div className="relative h-16 w-32 border-4 border-black bg-[#6A0DAD]">
                  <div className="absolute -top-4 left-0 h-4 w-full skew-x-12 border-x-4 border-t-4 border-black bg-[#6A0DAD] opacity-50"></div>
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-black bg-[#FFD700]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="mb-6 w-full text-center">
              <p className="font-body mb-2 text-2xl leading-none text-white">Sats In!</p>
              <p className="font-body text-lg text-white opacity-80">
                Your payment has been received and 100 sats have been added to your prize pool.
              </p>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="mb-8 w-full">
          <div className="shadow-retro flex -rotate-1 transform items-center justify-between gap-4 border-4 border-black bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#32CD32] text-black">
                <FaWallet size={25} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-black uppercase">New Balance</h4>
                <p className="font-body text-2xl leading-none text-black">
                  {loading ? "Loading..." : `${balance} Sats`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="animate-pulse text-5xl font-bold text-[#32CD32]">Ready!</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto w-full space-y-4 pb-4">
          <button
            className="shadow-retro hover:shadow-retro-lg active:shadow-retro-active group relative w-full transform overflow-hidden border-4 border-black bg-[#32CD32] py-4 text-sm tracking-widest text-black transition-all duration-100 hover:-translate-y-1 active:translate-y-0"
            onClick={handleContinueGame}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-4xl">
              <IoGameController />
              CONTINUE TO GAME
            </span>
            <div className="absolute inset-0 -translate-x-full skew-x-12 transform bg-white/20 transition-transform duration-300 group-hover:translate-x-0"></div>
          </button>
          <button
            className="shadow-retro hover:shadow-retro-lg active:shadow-retro-active flex w-full transform items-center justify-center gap-2 border-4 border-black bg-[#FF00FF] py-3 text-2xl tracking-widest text-white transition-all duration-100 hover:-translate-y-1 active:translate-y-0"
            onClick={handleViewTransaction}
          >
            <IoIosPaper size={30} />
            VIEW TRANSACTION DETAILS
          </button>
        </div>

        {/* Footer */}
        <footer className="font-body mt-8 text-center text-3xl text-black/60">
          <p>Order ID: #GAME-8821-SNAKE</p>
          <p className="mt-1 text-2xl opacity-75">Thank you for playing!</p>
        </footer>
      </div>
    </div>
  );
}

export default function VerifyTransaction() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}
    >
      <VerifyTransactionContent />
    </Suspense>
  );
}
