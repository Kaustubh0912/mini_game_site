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

// --- State and Types ---
type Brick = { x: number; y: number; status: 1 | 0 };
type Pattern = "pyramid" | "wall" | "checkerboard" | "spaced";

const createBricks = (): Brick[][] => {
  const patterns: Pattern[] = ["pyramid", "wall", "checkerboard", "spaced"];
  // Randomly select a pattern
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

  const newBricks: Brick[][] = [];
  for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    newBricks[c] = [];
    for (let r = 0; r < BRICK_ROW_COUNT; r++) {
      let status: 1 | 0 = 0; // Default to no brick

      // --- PATTERN LOGIC ---
      switch (selectedPattern) {
        case "wall":
          status = 1; // Solid wall, every brick is active
          break;

        case "checkerboard":
          // Active if the sum of row and column is even
          if ((c + r) % 2 === 0) {
            status = 1;
          }
          break;

        case "pyramid":
          // Creates a pyramid shape
          const pyramidCenter = Math.floor(BRICK_COLUMN_COUNT / 2);
          if (c >= pyramidCenter - r && c <= pyramidCenter + r) {
            status = 1;
          }
          break;

        case "spaced":
          // Creates columns with spaces between them
          if (c % 2 === 0) {
            status = 1;
          }
          break;
      }

      newBricks[c][r] = { x: 0, y: 0, status: status };
    }
  }
  return newBricks;
};

// --- The Game Component ---
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
  const [bricks, setBricks] = useState(createBricks);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);

  // --- Game Logic ---
  const runGameLogic = useCallback(() => {
    // Ball Movement
    let nextBallX = ballX + ballDX;
    let nextBallY = ballY + ballDY;

    // Wall collision (left/right)
    if (nextBallX > CANVAS_WIDTH - BALL_RADIUS || nextBallX < BALL_RADIUS) {
      setBallDX((prev) => -prev);
    }

    // Wall collision (top)
    if (nextBallY < BALL_RADIUS) {
      setBallDY((prev) => -prev);
    }
    // Paddle & Bottom Wall Collision
    else if (nextBallY > CANVAS_HEIGHT - BALL_RADIUS) {
      if (nextBallX > paddleX && nextBallX < paddleX + PADDLE_WIDTH) {
        setBallDY((prev) => -prev);
      } else {
        setLives((prev) => {
          if (prev - 1 <= 0) {
            setIsGameOver(true);
            return 0;
          }
          // Reset ball for next life
          setBallX(CANVAS_WIDTH / 2);
          setBallY(CANVAS_HEIGHT - 30);
          setPaddleX((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
          setBallDX(INITIAL_BALL_SPEED);
          setBallDY(-INITIAL_BALL_SPEED);
          return prev - 1;
        });
      }
    }

    // Brick Collision
    let bricksLeft = 0;
    const newBricks = bricks.map((column) =>
      column.map((brick) => {
        if (brick.status === 1) {
          if (
            nextBallX > brick.x &&
            nextBallX < brick.x + BRICK_WIDTH &&
            nextBallY > brick.y &&
            nextBallY < brick.y + BRICK_HEIGHT
          ) {
            setBallDY((prev) => -prev);
            setScore((prev) => prev + 10);
            return { ...brick, status: 0 as const };
          }
          bricksLeft++;
        }
        return brick;
      })
    );
    setBricks(newBricks);
    if (bricksLeft === 0 && !isGameOver) {
      setIsWin(true);
      setIsGameOver(true);
    }

    // Update ball position
    setBallX((prev) => prev + ballDX);
    setBallY((prev) => prev + ballDY);
  }, [ballX, ballY, ballDX, ballDY, paddleX, bricks, isGameOver]);

  // --- Main Game Loop using requestAnimationFrame ---
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || isGameOver) return;

    const gameLoop = () => {
      // 1. Run the physics/game logic
      runGameLogic();

      // 2. Clear the canvas
      context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 3. Draw everything
      // Draw Bricks
      bricks.forEach((column, c) => {
        column.forEach((brick, r) => {
          if (brick.status === 1) {
            // If brick x/y hasn't been calculated, do it once
            const brickX =
              brick.x || c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY =
              brick.y || r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            // Store it back for future frames (optional optimization)
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;

            context.beginPath();
            context.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
            const gradient = context.createRadialGradient(
              brickX + BRICK_WIDTH / 2, // center x
              brickY + BRICK_HEIGHT / 2, // center y
              5, // inner radius
              brickX + BRICK_WIDTH / 2,
              brickY + BRICK_HEIGHT / 2,
              BRICK_WIDTH // outer radius
            );

            // Define gradient color stops
            gradient.addColorStop(0, "#a855f7"); // light center
            gradient.addColorStop(1, "#6d28d9"); // darker edge

            context.fillStyle = gradient;
            context.fill();
            context.closePath();
          }
        });
      });

      // Draw Paddle
      context.beginPath();
      context.rect(
        paddleX,
        CANVAS_HEIGHT - PADDLE_HEIGHT,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );
      context.fillStyle = "#a855f7";
      context.fill();
      context.closePath();
      // Draw Ball
      context.beginPath();
      context.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
      context.fillStyle = "#f87171";
      context.fill();
      context.closePath();

      // 4. Request the next frame
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    // Start the loop
    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId.current!);
    };
  }, [runGameLogic, isGameOver]); // The loop now only depends on the logic function and the game over state

  // --- Mouse Controls ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const relativeX = e.clientX - canvas.getBoundingClientRect().left;
      let newPaddleX = relativeX - PADDLE_WIDTH / 2;
      if (newPaddleX < 0) newPaddleX = 0;
      if (newPaddleX + PADDLE_WIDTH > CANVAS_WIDTH)
        newPaddleX = CANVAS_WIDTH - PADDLE_WIDTH;
      setPaddleX(newPaddleX);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // --- Score Submission `useEffect` ---
  useEffect(() => {
    // Run this effect when the game is over
    if (isGameOver && session?.user?.id) {
      const submitScore = async () => {
        // No need to check for score > 0, as you can win with 0 score (if there were no bricks)
        console.log(`Game over! Submitting score: ${score}`);
        try {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              gameSlug: "breakout",
              score: score,
            }),
          });
          console.log("Breakout score submitted!");
        } catch (error) {
          console.error("Error submitting Breakout score:", error);
        }
      };
      submitScore();
    }
  }, [isGameOver, score, session]);

  // **FIX #3: CENTER THE CANVAS ON LOAD**
  useEffect(() => {
    canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const restartGame = () => {
    setIsGameOver(false);
    setIsWin(false);
    setBallX(CANVAS_WIDTH / 2);
    setBallY(CANVAS_HEIGHT - 30);
    setPaddleX((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
    setScore(0);
    setLives(3);
    setBricks(createBricks());
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Breakout
      </h2>
      <div
        className="flex justify-between w-full px-4 py-2 rounded-md bg-white/10 backdrop-blur-sm shadow-md mb-2"
        style={{ maxWidth: `${CANVAS_WIDTH}px` }}
      >
        <p className="text-primary text-lg font-semibold">🎯 Score: {score}</p>
        <p className="text-red-500 text-lg font-semibold">❤️ Lives: {lives}</p>
      </div>

      <div className="relative mt-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-primary rounded-lg shadow-2xl"
        />

        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center rounded-lg">
            <p className="text-4xl font-extrabold text-white drop-shadow-lg">
              {isWin ? "🎉 You Win!" : "💥 Game Over"}
            </p>
            <button
              onClick={restartGame}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-full transition shadow-lg"
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
