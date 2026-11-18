import { afterAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";

vi.mock("@/lib/lnbits", () => {
  return {
    createLNBitsInvoice: vi.fn(async () => ({
      payment_hash: "ph_mock_integration_123",
      bolt11: "lnbc1mockinvoice",
    })),
    checkLNBitsPaymentStatus: vi.fn(async () => true),
  };
});

import { POST as createInvoice } from "@/app/api/payments/invoice/route";
import { GET as checkInvoiceStatus } from "@/app/api/payments/[paymentHash]/status/route";
import { GET as resumeInvoice } from "@/app/api/payments/resume/route";
import { POST as startCollectRound } from "@/app/api/collect-log/start/route";
import {
  PATCH as finalizeCollectRound,
  GET as listCollectRounds,
} from "@/app/api/collect-log/route";
import { POST as submitScore } from "@/app/api/game/score/route";
import { GET as getLeaderboard } from "@/app/api/leaderboard/route";

describe("integration: process -> verify -> game -> submit", () => {
  const playerId = `it_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const paymentHash = "ph_mock_integration_123";

  afterAll(async () => {
    await prisma.collectLog.deleteMany({ where: { playerId, paymentHash } });
    await prisma.score.deleteMany({ where: { playerId } });
    await prisma.invoice.deleteMany({ where: { paymentHash } });
    await prisma.player.deleteMany({ where: { playerId } });
  });

  it("creates invoice, confirms paid, logs round, submits selected round, and appears on leaderboard", async () => {
    const invoiceReq = new Request("http://localhost/api/payments/invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 100,
        memo: `integration ${playerId}`,
        playerId,
      }),
    });

    const invoiceRes = await createInvoice(invoiceReq);
    expect(invoiceRes.status).toBe(200);
    const invoiceJson = (await invoiceRes.json()) as { payment_hash: string };
    expect(invoiceJson.payment_hash).toBe(paymentHash);

    const statusRes = await checkInvoiceStatus(
      new Request(`http://localhost/api/payments/${paymentHash}/status`) as never,
      { params: Promise.resolve({ paymentHash }) }
    );
    const statusJson = (await statusRes.json()) as { dbPaid: boolean };
    expect(statusRes.status).toBe(200);
    expect(statusJson.dbPaid).toBe(true);

    const resumeRes = await resumeInvoice(
      new Request(
        `http://localhost/api/payments/resume?playerId=${encodeURIComponent(playerId)}`
      ) as never
    );
    const resumeJson = (await resumeRes.json()) as {
      activeInvoice: { paymentHash: string } | null;
    };
    expect(resumeRes.status).toBe(200);
    expect(resumeJson.activeInvoice?.paymentHash).toBe(paymentHash);

    const startRes = await startCollectRound(
      new Request("http://localhost/api/collect-log/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          paymentHash,
          round: 1,
        }),
      })
    );
    expect(startRes.status).toBe(200);

    const finalizeRes = await finalizeCollectRound(
      new Request("http://localhost/api/collect-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          paymentHash,
          round: 1,
          time_ms: 42123,
          collect_time: [1000, 2000, 3000],
          collect_move: [{ key: "right", t: 1200 }],
          collect_fruit: [{ x: 4, y: 5 }],
          end_play: new Date().toISOString(),
        }),
      })
    );
    expect(finalizeRes.status).toBe(200);

    const listRes = await listCollectRounds(
      new Request(
        `http://localhost/api/collect-log?playerId=${encodeURIComponent(playerId)}&paymentHash=${encodeURIComponent(paymentHash)}`
      ) as never
    );
    const listJson = (await listRes.json()) as {
      rounds: Array<{ round: number; timeMs: number | null }>;
    };
    expect(listRes.status).toBe(200);
    expect(listJson.rounds.some((r) => r.round === 1 && r.timeMs === 42123)).toBe(true);

    const submitRes = await submitScore(
      new Request("http://localhost/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          paymentHash,
          round: 1,
          name: "Integration Test",
        }),
      })
    );
    expect(submitRes.status).toBe(200);

    const boardRes = await getLeaderboard();
    const boardJson = (await boardRes.json()) as {
      leaderboard: Array<{ name: string; time: number }>;
    };
    expect(boardRes.status).toBe(200);
    expect(boardJson.leaderboard.some((r) => r.time === 42123)).toBe(true);

    const resumeAfterSubmitRes = await resumeInvoice(
      new Request(
        `http://localhost/api/payments/resume?playerId=${encodeURIComponent(playerId)}`
      ) as never
    );
    const resumeAfterSubmitJson = (await resumeAfterSubmitRes.json()) as {
      activeInvoice: unknown;
    };
    expect(resumeAfterSubmitJson.activeInvoice).toBeNull();
  });
});
