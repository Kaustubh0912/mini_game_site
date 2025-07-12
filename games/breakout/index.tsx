// games/breakout/index.tsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

// --- Constants ---
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 480;
const PADDLE_HEIGHT = 10;
const PADDLE_WIDTH = 100;
const BALL_RADIUS = 10;
const INITIAL_BALL_SPEED = 4;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 9;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;

// --- Types ---
type Brick = { x: number; y: number; status: 1 | 0 };
type Pattern = "pyramid" | "wall" | "checkerboard" | "spaced";

// --- Brick Generator ---
const createBricks = (): Brick[][] => {
  const pattern = ["pyramid", "wall", "checkerboard", "spaced"][
    Math.floor(Math.random() * 4)
  ] as Pattern;

  return Array.from({ length: BRICK_COLUMN_COUNT }, (_, c) =>
    Array.from({ length: BRICK_ROW_COUNT }, (_, r) => {
      let status: 1 | 0 = 0;

      if (
        pattern === "wall" ||
        (pattern === "checkerboard" && (c + r) % 2 === 0) ||
        (pattern === "pyramid" &&
          c >= Math.floor(BRICK_COLUMN_COUNT / 2) - r &&
          c <= Math.floor(BRICK_COLUMN_COUNT / 2) + r) ||
        (pattern === "spaced" && c % 2 === 0)
      ) {
        status = 1;
      }

      return { x: 0, y: 0, status };
    }),
  );
};

// --- Main Game Component ---
const BreakoutGame = () => {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- Game State ---
  const [paddleX, setPaddleX] = useState((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
  const [ballX, setBallX] = useState(CANVAS_WIDTH / 2);
  const [ballY, setBallY] = useState(CANVAS_HEIGHT - 30);
  const [ballDX, setBallDX] = useState(INITIAL_BALL_SPEED);
  const [ballDY, setBallDY] = useState(-INITIAL_BALL_SPEED);
  const [ballSpeed, setBallSpeed] = useState(INITIAL_BALL_SPEED);

  const [bricks, setBricks] = useState(createBricks());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [fps, setFps] = useState(0);

  // --- Ball & Collision Logic ---
  const runGameLogic = useCallback(() => {
    let nextBallX = ballX + ballDX;
    let nextBallY = ballY + ballDY;

    if (nextBallX < BALL_RADIUS || nextBallX > CANVAS_WIDTH - BALL_RADIUS) {
      setBallDX((prev) => -prev);
    }
    if (nextBallY < BALL_RADIUS) {
      setBallDY((prev) => -prev);
    } else if (nextBallY > CANVAS_HEIGHT - BALL_RADIUS) {
      if (
        nextBallY + BALL_RADIUS >= CANVAS_HEIGHT - PADDLE_HEIGHT &&
        nextBallX > paddleX &&
        nextBallX < paddleX + PADDLE_WIDTH
      ) {
        const relativeIntersectX = nextBallX - (paddleX + PADDLE_WIDTH / 2);
        const normalized = relativeIntersectX / (PADDLE_WIDTH / 2);
        const bounceAngle = normalized * (Math.PI / 3);
        const speed = Math.hypot(ballDX, ballDY);

        setBallDX(speed * Math.sin(bounceAngle));
        setBallDY(-Math.abs(speed * Math.cos(bounceAngle)));
      } else {
        setLives((prev) => {
          if (prev - 1 <= 0) {
            setIsGameOver(true);
            return 0;
          }
          resetBall();
          return prev - 1;
        });
      }
    }

    // Brick Collision
    let bricksLeft = 0;
    const newBricks = bricks.map((col, c) =>
      col.map((brick, r) => {
        if (brick.status === 1) {
          const hit =
            nextBallX + BALL_RADIUS > brick.x &&
            nextBallX - BALL_RADIUS < brick.x + BRICK_WIDTH &&
            nextBallY + BALL_RADIUS > brick.y &&
            nextBallY - BALL_RADIUS < brick.y + BRICK_HEIGHT;

          if (hit) {
            setBallDY((prev) => -prev); // Basic collision
            setScore((prev) => prev + 10);
            return { ...brick, status: 0 as 0 | 1 };
          }
          bricksLeft++;
        }
        return brick;
      }),
    );

    setBricks(newBricks);
    if (bricksLeft === 0) {
      setLevel((prev) => prev + 1);
      setBricks(createBricks());
      resetBall(true);
      return;
    }

    setBallX((prev) => prev + ballDX);
    setBallY((prev) => prev + ballDY);
  }, [ballX, ballY, ballDX, ballDY, paddleX, bricks]);

  const resetBall = (speedUp = false) => {
    const newSpeed = speedUp ? ballSpeed * 1.25 : ballSpeed;
    setBallSpeed(newSpeed); // Save new speed for next time
    setBallX(CANVAS_WIDTH / 2);
    setBallY(CANVAS_HEIGHT - 30);
    setPaddleX((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
    const angle = Math.atan2(ballDY, ballDX); // keep angle
    setBallDX(newSpeed * Math.cos(angle));
    setBallDY(-Math.abs(newSpeed * Math.sin(angle))); // ensure it goes upward
  };

  // --- Game Loop ---
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !hasStarted || isGameOver) return;

    const loop = () => {
      runGameLogic();
      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Bricks
      bricks.forEach((col, c) =>
        col.forEach((brick, r) => {
          if (brick.status === 1) {
            brick.x ||= c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            brick.y ||= r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

            const gradient = context.createRadialGradient(
              brick.x + BRICK_WIDTH / 2,
              brick.y + BRICK_HEIGHT / 2,
              5,
              brick.x + BRICK_WIDTH / 2,
              brick.y + BRICK_HEIGHT / 2,
              BRICK_WIDTH,
            );

            gradient.addColorStop(0, "#a855f7");
            gradient.addColorStop(1, "#6d28d9");

            context.fillStyle = gradient;
            context.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
          }
        }),
      );

      // Paddle
      context.fillStyle = "#a855f7";
      context.fillRect(
        paddleX,
        CANVAS_HEIGHT - PADDLE_HEIGHT,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
      );

      // Ball
      context.beginPath();
      context.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
      context.fillStyle = "#f87171";
      context.fill();
      context.closePath();

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId.current!);
  }, [runGameLogic, isGameOver, hasStarted]);

  // --- Mouse Controls ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const relativeX = e.clientX - canvas.getBoundingClientRect().left;
      let newX = relativeX - PADDLE_WIDTH / 2;
      if (newX < 0) newX = 0;
      if (newX + PADDLE_WIDTH > CANVAS_WIDTH)
        newX = CANVAS_WIDTH - PADDLE_WIDTH;
      setPaddleX(newX);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // --- Touch Controls ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling when touching the canvas
      const touch = e.touches[0];
      const relativeX = touch.clientX - canvas.getBoundingClientRect().left;
      let newX = relativeX - PADDLE_WIDTH / 2;
      if (newX < 0) newX = 0;
      if (newX + PADDLE_WIDTH > CANVAS_WIDTH)
        newX = CANVAS_WIDTH - PADDLE_WIDTH;
      setPaddleX(newX);
    };

    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => canvas.removeEventListener("touchmove", handleTouchMove);
  }, []);

  // --- Score Submission ---
  useEffect(() => {
    if (isGameOver && session?.user?.id) {
      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          gameSlug: "breakout",
          score,
        }),
      }).catch((e) => console.error("Score submit failed", e));
    }
  }, [isGameOver, score, session]);

  // --- FPS Counter ---
  useEffect(() => {
    let last = performance.now();
    let frames = 0;
    const loop = () => {
      const now = performance.now();
      frames++;
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const restartGame = () => {
    setIsGameOver(false);
    setIsWin(false);
    setBallSpeed(INITIAL_BALL_SPEED);
    resetBall();
    setScore(0);
    setLives(3);
    setLevel(1);
    setBricks(createBricks());
  };

  // --- UI ---
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Breakout
      </h2>

      <div
        className="flex justify-between w-full px-4 py-2 rounded-md bg-white/10 backdrop-blur-sm shadow-md mb-2"
        style={{ maxWidth: `${CANVAS_WIDTH}px` }}
      >
        <p className="text-primary font-semibold">🎯 Score: {score}</p>
        <p className="text-yellow-400 font-semibold">🧱 Level: {level}</p>
        <p className="text-red-500 font-semibold">❤️ Lives: {lives}</p>
        <p className="text-blue-400 font-semibold">📈 FPS: {fps}</p>
        <p className="text-purple-300 font-semibold">
          ⚡ Speed: {ballSpeed.toFixed(2)}
        </p>
      </div>

      <div className="relative mt-4">
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10 px-6">
            <p className="text-3xl font-extrabold text-white">🎮 Breakout</p>
            <p className="text-sm text-gray-200 mt-2 mb-4 text-center">
              For best experience, please limit your browser FPS to 60 before
              starting.
              <br />
              (Check your graphics settings, especially on gaming laptops.)
            </p>
            <button
              onClick={() => setHasStarted(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-lime-500 hover:brightness-110 text-white font-bold rounded-full transition shadow-md"
            >
              ▶️ Start
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-primary rounded-lg shadow-2xl"
        />

        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
            <p className="text-4xl font-extrabold text-white drop-shadow-lg">
              {isWin ? "🎉 You Win!" : "💥 Game Over"}
            </p>
            <button
              onClick={restartGame}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-bold rounded-full transition shadow-lg"
            >
              🔁 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakoutGame;
