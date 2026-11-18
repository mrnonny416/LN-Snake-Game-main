"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";

// Match the legacy pure JS game visuals: 20px cells on a 20x20 black grid with lime snake and red fruit.
const CELL_SIZE = 20;

/** Data captured for one completed round, sent to the backend for anti-cheat analysis. */
export interface RoundLog {
  collect_time: number[]; // ms from game start when each fruit was eaten
  collect_move: { key: string; t: number }[]; // direction changes with timestamps
  collect_fruit: { x: number; y: number }[]; // canvas cell position of each fruit collected
  start_play: string; // ISO UTC when startGame() was called
  end_play: string; // ISO UTC when the 21st fruit was eaten
  time_ms: number; // total elapsed ms
}
const BOARD_SIZE = 20;
const DEFAULT_TICK_MS = 150; // Same as the original setInterval timing
const TARGET_FRUITS = 21; // Keep the classic win condition

type Direction = { dx: number; dy: number };

interface GameCanvasProps {
  onFruitCollected?: (count: number) => void;
  onGameOver?: (finalTimeMs: number, log: RoundLog) => void;
  onGameStart?: () => void;
  onCollectFruit?: () => void;
  onGameWin?: () => void;
  onGameEnd?: () => void;
  tickMs?: number; // allow adjusting game speed; defaults to legacy 150ms
  autoStart?: boolean; // whether to auto-start on mount, defaults to true
}

export interface GameCanvasHandle {
  startGame: () => void;
  setDirection: (dir: "up" | "down" | "left" | "right") => void;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  (
    {
      onFruitCollected,
      onGameOver,
      onGameStart,
      onCollectFruit,
      onGameWin,
      onGameEnd,
      tickMs = DEFAULT_TICK_MS,
      autoStart = true,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Refs to keep the latest state for fast key presses without restarting intervals
    const dirRef = useRef<Direction>({ dx: 1, dy: 0 });
    const snakeRef = useRef<{ x: number; y: number }[]>([{ x: 10, y: 10 }]);
    const fruitRef = useRef<{ x: number; y: number }>(spawnFruit([{ x: 10, y: 10 }]));
    const collectedRef = useRef(0);
    const gameOverRef = useRef(false);

    const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
    const [fruit, setFruit] = useState(() => spawnFruit([{ x: 10, y: 10 }]));
    const [, setDir] = useState<Direction>({ dx: 1, dy: 0 });
    const [, setCollected] = useState(0);
    const [, setIsGameOver] = useState(false);
    const [isGameActive, setIsGameActive] = useState(false);

    // --- Collect-log tracking refs ---
    const collectTimesRef = useRef<number[]>([]);
    const collectFruitsRef = useRef<{ x: number; y: number }[]>([]);
    const moveHistoryRef = useRef<{ key: string; t: number }[]>([]);
    const startPlayUtcRef = useRef<string>("");
    const gameStartMsRef = useRef<number>(0);

    // Spawn fruit ensuring it does not sit on the snake
    const placeFruit = useCallback((currentSnake: { x: number; y: number }[]) => {
      const next = spawnFruit(currentSnake);
      setFruit(next);
      fruitRef.current = next;
      return next;
    }, []);

    // Draw the entire game frame
    const drawFrame = useCallback(
      (nextSnake: { x: number; y: number }[], nextFruit?: { x: number; y: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "lime";
        nextSnake.forEach((s) =>
          ctx.fillRect(s.x * CELL_SIZE, s.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        );

        ctx.fillStyle = "red";
        const fruitToDraw = nextFruit ?? fruitRef.current;
        ctx.fillRect(fruitToDraw.x * CELL_SIZE, fruitToDraw.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      },
      []
    );

    // End game helper
    const endGame = useCallback(
      (latestSnake: { x: number; y: number }[]) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const elapsed = gameStartMsRef.current ? Date.now() - gameStartMsRef.current : 0;
        const roundLog: RoundLog = {
          collect_time: [...collectTimesRef.current],
          collect_move: [...moveHistoryRef.current],
          collect_fruit: [...collectFruitsRef.current],
          start_play: startPlayUtcRef.current,
          end_play: new Date().toISOString(),
          time_ms: elapsed,
        };
        setIsGameOver(true);
        gameOverRef.current = true;
        setIsGameActive(false);
        onGameEnd?.();
        onGameWin?.();
        drawFrame(latestSnake);
        onGameOver?.(elapsed, roundLog);
      },
      [drawFrame, onGameOver, onGameWin, onGameEnd]
    );

    // Core game tick (movement, collisions, fruit handling)
    // Uses timestamp-based logic to be robust against throttled setInterval
    // (e.g., Safari low power mode, browser tab backgrounding)
    const tick = useCallback(() => {
      if (gameOverRef.current) return;

      const prevSnake = snakeRef.current;
      const head = {
        x: (prevSnake[0].x + dirRef.current.dx + BOARD_SIZE) % BOARD_SIZE,
        y: (prevSnake[0].y + dirRef.current.dy + BOARD_SIZE) % BOARD_SIZE,
      };

      const nextSnake = [head, ...prevSnake];

      if (head.x === fruitRef.current.x && head.y === fruitRef.current.y) {
        const nextCount = collectedRef.current + 1;
        collectedRef.current = nextCount;
        setCollected(nextCount);
        // Record collection data before fruit is repositioned
        collectTimesRef.current.push(Date.now() - gameStartMsRef.current);
        collectFruitsRef.current.push({ x: fruitRef.current.x, y: fruitRef.current.y });
        onCollectFruit?.();
        onFruitCollected?.(nextCount);
        const newFruit = placeFruit(nextSnake);
        drawFrame(nextSnake, newFruit);

        if (nextCount >= TARGET_FRUITS) {
          endGame(nextSnake);
          return;
        }

        snakeRef.current = nextSnake;
        setSnake(nextSnake);
        return;
      }

      nextSnake.pop();
      snakeRef.current = nextSnake;
      drawFrame(nextSnake);
      setSnake(nextSnake);
    }, [drawFrame, endGame, onFruitCollected, onCollectFruit, placeFruit]);

    // Wrapper to enforce tick timing via timestamp, independent of setInterval throttling
    const tickWithTiming = useCallback(() => {
      if (gameOverRef.current) return;
      tick();
    }, [tick]);

    // Start or restart game
    const startGame = useCallback(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Reset collect-log tracking for this round
      collectTimesRef.current = [];
      collectFruitsRef.current = [];
      moveHistoryRef.current = [];
      const nowMs = Date.now();
      gameStartMsRef.current = nowMs;
      startPlayUtcRef.current = new Date(nowMs).toISOString();
      const initialSnake = [{ x: 10, y: 10 }];
      const initialFruit = spawnFruit(initialSnake);
      setSnake(initialSnake);
      setFruit(initialFruit);
      setDir({ dx: 1, dy: 0 });
      setCollected(0);
      setIsGameOver(false);
      setIsGameActive(true);
      dirRef.current = { dx: 1, dy: 0 };
      snakeRef.current = initialSnake;
      fruitRef.current = initialFruit;
      collectedRef.current = 0;
      gameOverRef.current = false;
      onGameStart?.();
      drawFrame(initialSnake, initialFruit);

      // Timestamp-based game loop to handle setInterval throttling in low power modes
      let lastTickAt = performance.now();
      intervalRef.current = setInterval(
        () => {
          const now = performance.now();
          const elapsed = now - lastTickAt;
          // Only tick if enough time has passed, accounting for throttled intervals
          if (elapsed >= tickMs * 0.95) {
            lastTickAt = now;
            tickWithTiming();
          }
        },
        Math.max(10, tickMs / 4)
      ); // Check 4x per expected tick to catch throttled intervals
    }, [drawFrame, onGameStart, tickWithTiming, tickMs]);

    const applyDirection = useCallback((dir: "up" | "down" | "left" | "right") => {
      const current = dirRef.current;
      if (dir === "up" && current.dy === 0) {
        const nextDir = { dx: 0, dy: -1 };
        dirRef.current = nextDir;
        setDir(nextDir);
        moveHistoryRef.current.push({ key: "up", t: Date.now() - gameStartMsRef.current });
      }
      if (dir === "down" && current.dy === 0) {
        const nextDir = { dx: 0, dy: 1 };
        dirRef.current = nextDir;
        setDir(nextDir);
        moveHistoryRef.current.push({ key: "down", t: Date.now() - gameStartMsRef.current });
      }
      if (dir === "left" && current.dx === 0) {
        const nextDir = { dx: -1, dy: 0 };
        dirRef.current = nextDir;
        setDir(nextDir);
        moveHistoryRef.current.push({ key: "left", t: Date.now() - gameStartMsRef.current });
      }
      if (dir === "right" && current.dx === 0) {
        const nextDir = { dx: 1, dy: 0 };
        dirRef.current = nextDir;
        setDir(nextDir);
        moveHistoryRef.current.push({ key: "right", t: Date.now() - gameStartMsRef.current });
      }
    }, []);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        startGame,
        setDirection: applyDirection,
      }),
      [startGame, applyDirection]
    );

    // Keyboard controls + prevent page scroll
    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (!isGameActive) return;
        const code = e.code;
        // Arrow keys and WASD physical keys (regardless of layout)
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
          ].includes(code)
        ) {
          e.preventDefault();
        }
        if (code === "ArrowUp" || code === "KeyW") applyDirection("up");
        if (code === "ArrowDown" || code === "KeyS") applyDirection("down");
        if (code === "ArrowLeft" || code === "KeyA") applyDirection("left");
        if (code === "ArrowRight" || code === "KeyD") applyDirection("right");
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [applyDirection, isGameActive]);

    // Mount: size canvas and start game once
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = BOARD_SIZE * CELL_SIZE;
      canvas.height = BOARD_SIZE * CELL_SIZE;
      drawFrame(snake, fruit);
      if (autoStart) {
        startGame();
      }
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
      // We intentionally start once on mount to mirror the legacy game behavior.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="mx-auto block overflow-hidden"
        style={{ width: BOARD_SIZE * CELL_SIZE, height: BOARD_SIZE * CELL_SIZE }}
      />
    );
  }
);

GameCanvas.displayName = "GameCanvas";

// Helper: spawn fruit not colliding with the snake
function spawnFruit(currentSnake: { x: number; y: number }[]) {
  let newFruit: { x: number; y: number };
  let collision = false;
  do {
    newFruit = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
    collision = currentSnake.some((s) => s.x === newFruit.x && s.y === newFruit.y);
  } while (collision);
  return newFruit;
}

export default GameCanvas;
