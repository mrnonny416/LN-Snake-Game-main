"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FaBitcoin, FaCopy, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { startPaymentPoller } from "@/lib/payment-checker";
import { usePoolData } from "@/hooks/usePoolData";
import { getOrCreateUserId } from "@/hooks/useUserPlayLog";

const pixelBordersStyle: React.CSSProperties = {
  boxShadow: `
    -4px 0 0 0 black,
    4px 0 0 0 black,
    0 -4px 0 0 black,
    0 4px 0 0 black
  `,
  margin: "4px",
};

export default function ProcessTransactionPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(899); // 14 minutes 59 seconds in seconds
  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const { pool, loading: poolLoading } = usePoolData();
  const amountDue = "100 SATS";

  // Resume paid invoice (if still playable), otherwise create a new invoice.
  useEffect(() => {
    const bootstrapInvoice = async () => {
      const readResponse = async (response: Response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          return response.json();
        }

        const text = await response.text();
        throw new Error(text.slice(0, 200) || "Unexpected non-JSON response from server");
      };

      try {
        const userId = getOrCreateUserId();

        const resumeRes = await fetch(
          `/api/payments/resume?playerId=${encodeURIComponent(userId)}`
        );
        if (resumeRes.ok) {
          const resumeData = await readResponse(resumeRes);
          if (resumeData?.activeInvoice?.paymentHash) {
            const resumedHash = String(resumeData.activeInvoice.paymentHash);
            localStorage.setItem("snake_payment_hash", resumedHash);
            setPaymentHash(resumedHash);
            setInvoice(resumeData.activeInvoice.paymentRequest ?? null);
            setLoadingInvoice(false);

            // Check for unsubmitted collect logs
            const collectRes = await fetch(
              `/api/collect-log?playerId=${encodeURIComponent(userId)}&paymentHash=${encodeURIComponent(resumedHash)}`
            );
            if (collectRes.ok) {
              const collectData = await readResponse(collectRes);
              const unsubmittedRounds = (
                Array.isArray(collectData?.rounds) ? collectData.rounds : []
              ).filter((r: { submitted?: boolean }) => r.submitted !== true);
              // If there are unsubmitted rounds, redirect to game to complete submission
              if (unsubmittedRounds.length > 0) {
                router.push("/game/snake/v1");
                return;
              }
            }

            router.push("/game/snake/v1");
            return;
          }
        }

        const res = await fetch("/api/payments/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: 100,
            memo: `Unlock Snake Game ref.${userId}`,
            playerId: userId,
          }),
        });
        const data = await readResponse(res);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to create invoice");
        }
        setInvoice(data.payment_request); // bolt11
        setPaymentHash(data.payment_hash);
        localStorage.setItem("snake_payment_hash", data.payment_hash);
        setLoadingInvoice(false);
      } catch (error) {
        console.error("Failed to create invoice:", error);
        setLoadingInvoice(false);
      }
    };
    bootstrapInvoice();
  }, [router]);

  const qrCodeSrc = invoice
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(invoice)}&size=200x200`
    : "";

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check payment status on mount
  useEffect(() => {
    if (paymentHash) {
      const stopPoller = startPaymentPoller(paymentHash, () => {
        setPaid(true);
        router.push(`/transaction/verify?hash=${encodeURIComponent(paymentHash)}`);
      });
      return stopPoller;
    }
  }, [paymentHash, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCopyAddress = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice);
    }
  };

  const handlePaymentSent = () => {
    if (!paid) {
      alert("⏳ ยังไม่ได้รับชำระเงิน โปรดรอสักครู่...");
      return;
    }
    if (paymentHash) {
      router.push(`/transaction/verify?hash=${encodeURIComponent(paymentHash)}`);
      return;
    }
    router.push("/transaction/verify");
  };

  const handleCancelOrder = () => {
    router.push("/");
  };

  return (
    <div className="text- relative flex min-h-screen flex-col items-center overflow-x-hidden pb-10">
      {/* Background elements are assumed to be handled by layout.tsx */}
      <div className="relative z-10 mx-auto flex w-full max-w-md grow flex-col items-center px-4 pt-8">
        <div className="relative mb-6 w-full text-center">
          <div className="relative inline-block">
            <h1 className="text-stroke mb-2 -rotate-2 transform text-2xl leading-relaxed font-bold text-[#6A0DAD] md:text-3xl">
              CONFIRM
              <br />
              PAYMENT
            </h1>
            <div className="absolute -top-6 -right-8 animate-bounce text-4xl">🪙</div>
          </div>
          <div className="font-body shadow-retro mt-2 inline-block rotate-1 transform border-2 border-white bg-black px-4 py-1 text-3xl text-red-500">
            <span className="animate-pulse">⏱ {formatTime(timeLeft)}</span>
          </div>
          {!poolLoading && pool > 0 && (
            <div className="mt-3 text-center">
              <p className="text-sm font-bold text-[#32CD32]">🎁 Prize Pool: {pool} Sats</p>
            </div>
          )}
        </div>

        <div className="bg- shadow-retro-lg relative mb-8 w-full border-4 border-black bg-[#1A1A2E] p-6 text-center">
          <div className="absolute top-0 left-0 h-4 w-4 border-r-4 border-b-4 border-black bg-[#FFD700]"></div>
          <div className="absolute top-0 right-0 h-4 w-4 border-b-4 border-l-4 border-black bg-[#32CD32]"></div>
          <div className="absolute bottom-0 left-0 h-4 w-4 border-t-4 border-r-4 border-black bg-[#FF00FF]"></div>
          <div className="absolute right-0 bottom-0 h-4 w-4 border-t-4 border-l-4 border-black bg-[#6A0DAD]"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 w-full -rotate-1 transform rounded border-2 border-dashed border-[#32CD32] bg-[#32CD32]/10 p-3">
              <p className="font-body mb-0 text-2xl text-white">AMOUNT DUE</p>
              <h1 className="text-stroke text-4xl font-bold tracking-widest text-[#32CD32]">
                {amountDue}
              </h1>
            </div>

            <div className="group relative mb-6">
              <div
                className="shadow-retro inline-block border-4 border-black bg-white p-3"
                style={pixelBordersStyle}
              >
                {loadingInvoice ? (
                  <div className="flex h-48 w-48 items-center justify-center bg-gray-200">
                    <p className="text-center text-sm text-gray-600">Creating Invoice...</p>
                  </div>
                ) : qrCodeSrc ? (
                  <Image
                    alt="Payment QR"
                    src={qrCodeSrc}
                    width={192}
                    height={192}
                    className="image-rendering-pixelated mix-blend-multiply"
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center bg-gray-200">
                    <p className="text-center text-sm text-gray-600">Creating Invoice Fail</p>
                  </div>
                )}
              </div>
              <div className="absolute -right-4 -bottom-4 rotate-6 transform border-2 border-black bg-[#FFD700] px-2 shadow-sm">
                <span className="px-5 text-xl text-black uppercase">Scan Me!</span>
              </div>
            </div>

            <div className="mb-4 w-full text-left">
              <label className="mb-2 block text-center text-xl tracking-wider text-white uppercase">
                Payment Request / Invoice
              </label>
              <div
                className="group flex cursor-pointer items-center justify-between gap-2 border-2 border-gray-600 bg-black p-2 shadow-inner transition-colors hover:border-[#FFD700]"
                onClick={handleCopyAddress}
              >
                <code className="font-body truncate text-sm text-[#32CD32] select-all">
                  {invoice ? invoice.slice(0, 30) + "..." : "Loading..."}
                </code>
                <span className="text-lg text-gray-400 group-hover:text-[#FFD700]">
                  <FaCopy />
                </span>
              </div>
            </div>

            <div className="font-body text-md flex items-center justify-center gap-2 text-gray-400">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#FF00FF]"></span>
              Waiting for transaction...
            </div>
          </div>
        </div>

        <div className="mb-8 w-full">
          <div className="shadow-retro flex rotate-1 transform items-center justify-between gap-4 border-4 border-black bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#F7931A] font-bold text-white">
                <FaBitcoin size={30} />
              </div>
              <div>
                <h4 className="text-md font-bold text-black uppercase">Network</h4>
                <p className="font-body text-xl leading-none text-black">Bitcoin Mainnet</p>
              </div>
            </div>
            <div className="text-right">
              <h4 className="text-md font-bold text-black uppercase">Fee</h4>
              <p className="font-body text-xl leading-none text-black">~5 Sats/vB</p>
            </div>
          </div>
        </div>

        <div className="mt-auto w-full space-y-4 pb-4">
          <button
            disabled={!paid}
            className={`shadow-retro hover:shadow-retro-lg active:shadow-retro-active group relative w-full transform overflow-hidden border-4 border-black py-4 text-sm tracking-widest transition-all duration-100 ${
              paid
                ? "cursor-pointer bg-[#32CD32] text-black hover:-translate-y-1 active:translate-y-0"
                : "cursor-not-allowed bg-gray-400 text-gray-600 opacity-60"
            }`}
            onClick={handlePaymentSent}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-3xl">
              <FaCheckCircle />
              {paid ? "I SENT THE PAYMENT" : "WAITING FOR PAYMENT..."}
            </span>
            {paid && (
              <div className="absolute inset-0 -translate-x-full skew-x-12 transform bg-white/20 transition-transform duration-300 group-hover:translate-x-0"></div>
            )}
          </button>
          <button
            className="shadow-retro hover:shadow-retro-lg active:shadow-retro-active w-full transform border-4 border-black bg-[#FF00FF] py-3 text-3xl tracking-widest text-white transition-all duration-100 hover:-translate-y-1 active:translate-y-0"
            onClick={handleCancelOrder}
          >
            CANCEL ORDER
          </button>
        </div>

        <footer className="font-body mt-8 text-center text-3xl text-black/60">
          <p>Order ID: #GAME-8821-SNAKE</p>
          <p className="mt-1 text-2xl opacity-75">Do not close this window until confirmed.</p>
        </footer>
      </div>
    </div>
  );
}
