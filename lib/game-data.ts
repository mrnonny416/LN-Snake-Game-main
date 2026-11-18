// lib/game-data.ts

import { prisma } from "./db";

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;
const CUTOFF_DAY = 21;
const CUTOFF_HOUR = 21;

export interface ScoreEntry {
  name: string;
  time: number; // Time in milliseconds
}

function toThaiPseudoDate(date: Date) {
  return new Date(date.getTime() + THAI_OFFSET_MS);
}

function hasPassedThaiCutoff(date: Date) {
  const thaiDate = toThaiPseudoDate(date);
  const day = thaiDate.getUTCDate();
  const hour = thaiDate.getUTCHours();
  const minute = thaiDate.getUTCMinutes();
  const second = thaiDate.getUTCSeconds();
  const millisecond = thaiDate.getUTCMilliseconds();

  return (
    day > CUTOFF_DAY ||
    (day === CUTOFF_DAY &&
      (hour > CUTOFF_HOUR ||
        (hour === CUTOFF_HOUR && (minute > 0 || second > 0 || millisecond > 0))))
  );
}

function getCurrentRoundBoundariesByThaiCutoff(now = new Date()) {
  const thaiNow = toThaiPseudoDate(now);

  let year = thaiNow.getUTCFullYear();
  let month = thaiNow.getUTCMonth() + 1;

  if (hasPassedThaiCutoff(now)) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  const endUtc = Date.UTC(year, month - 1, CUTOFF_DAY, CUTOFF_HOUR, 0, 0, 0) - THAI_OFFSET_MS;
  const startUtc = Date.UTC(year, month - 2, CUTOFF_DAY, CUTOFF_HOUR, 0, 0, 1) - THAI_OFFSET_MS;

  return {
    start: new Date(startUtc),
    end: new Date(endUtc),
  };
}

export async function submitScore({
  name,
  time,
  playerId,
  paymentHash,
}: {
  name: string;
  time: number;
  playerId: string;
  paymentHash: string;
}): Promise<ScoreEntry[]> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Player name is required");

  await prisma.player.upsert({
    where: {
      playerId_paymentHash: {
        playerId,
        paymentHash,
      },
    },
    update: { name: trimmed },
    create: { playerId, paymentHash, name: trimmed },
  });

  // Insert score
  await prisma.score.create({
    data: {
      playerId,
      paymentHash,
      timeMs: Math.max(0, Math.floor(time)),
    },
  });

  // Return updated leaderboard
  return await getLeaderboard();
}

export async function getLeaderboard(): Promise<ScoreEntry[]> {
  const currentRound = getCurrentRoundBoundariesByThaiCutoff();

  const grouped = await prisma.score.groupBy({
    by: ["playerId", "paymentHash"],
    where: {
      visible: true,
      createdAt: {
        gte: currentRound.start,
        lte: currentRound.end,
      },
    },
    _min: {
      timeMs: true,
    },
    orderBy: {
      _min: {
        timeMs: "asc",
      },
    },
    take: 10,
  });

  if (grouped.length === 0) return [];

  const players = await prisma.player.findMany({
    where: {
      OR: grouped.map((g) => ({
        playerId: g.playerId,
        paymentHash: g.paymentHash,
      })),
    },
    select: {
      playerId: true,
      paymentHash: true,
      name: true,
    },
  });

  const playerNameMap = new Map(players.map((p) => [`${p.playerId}:${p.paymentHash}`, p.name]));

  return grouped
    .filter((g) => typeof g._min.timeMs === "number")
    .map((g) => ({
      name: playerNameMap.get(`${g.playerId}:${g.paymentHash}`) ?? g.playerId.slice(0, 10),
      time: g._min.timeMs as number,
    }));
}
