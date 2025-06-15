import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

// --- Constants ---
const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;
const GAME_SPEED = 150;

type Point = { x: number; y: number };

// --- Helper: Generate new food ---
const generateFood = (snakeBody: Point[]): Point => {
  let newFood: Point;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snakeBody.some((s) => s.x === newFood.x && s.y === newFood.y));
  return newFood;
};

// --- Main Component ---
export default function SnakeGame() {
  const { data: session } = useSession();

  // --- State ---
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>(() =>
    generateFood([{ x: 10, y: 10 }])
  );
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const directionRef = useRef(direction);
  const directionChangedRef = useRef(false);

  directionRef.current = direction;

  // --- Restart Logic ---
  const restartGame = () => {
    const initial = { x: 10, y: 10 };
    setSnake([initial]);
    setFood(generateFood([initial]));
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setIsGameOver(false);
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (directionChangedRef.current) return;

      const key = e.key.toUpperCase();
      const { x, y } = directionRef.current;

      if ((key === "W" || key === "ARROWUP") && y === 0) {
        setDirection({ x: 0, y: -1 });
        directionChangedRef.current = true;
      } else if ((key === "S" || key === "ARROWDOWN") && y === 0) {
        setDirection({ x: 0, y: 1 });
        directionChangedRef.current = true;
      } else if ((key === "A" || key === "ARROWLEFT") && x === 0) {
        setDirection({ x: -1, y: 0 });
        directionChangedRef.current = true;
      } else if ((key === "D" || key === "ARROWRIGHT") && x === 0) {
        setDirection({ x: 1, y: 0 });
        directionChangedRef.current = true;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Score Submission (on game over) ---
  useEffect(() => {
    if (!isGameOver || score <= 0 || !session?.user?.id) return;

    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        gameSlug: "snake",
        score,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Score submitted:", data))
      .catch((err) => console.error("Submit error:", err));
  }, [isGameOver]);

  // --- Game Loop ---
  useEffect(() => {
    if (isGameOver) return;

    const gameLoop = () => {
      directionChangedRef.current = false;

      const currentDirection = directionRef.current;

      setSnake((prev) => {
        const newHead = {
          x: prev[0].x + currentDirection.x,
          y: prev[0].y + currentDirection.y,
        };

        // Wall or self collision
        const hitWall =
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE;
        const hitSelf = prev.some(
          (seg) => seg.x === newHead.x && seg.y === newHead.y
        );
        if (hitWall || hitSelf) {
          setIsGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(gameLoop, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [isGameOver, food]);

  // --- Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw snake
    ctx.fillStyle = "#4ade80";
    snake.forEach((seg) =>
      ctx.fillRect(seg.x * TILE_SIZE, seg.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    );

    // Draw food
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }, [snake, food]);

  // --- Auto-scroll into view on load ---
  useEffect(() => {
    canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // --- Render ---
  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 max-w-md mx-auto">
      <h2 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white tracking-wide">
        🐍 Snake
      </h2>

      <p className="mb-4 text-lg font-semibold text-primary bg-primary/10 dark:bg-primary/20 px-4 py-1 rounded-full shadow-sm backdrop-blur-sm">
        Score: {score}
      </p>

      <div className="relative rounded-lg overflow-hidden shadow-lg">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="bg-slate-800 border-4 border-primary rounded-lg"
        />
        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center rounded-lg">
            <p className="text-4xl font-extrabold text-white drop-shadow-lg">
              💀 Game Over
            </p>
            <button
              onClick={restartGame}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-full transition shadow-md"
            >
              🔄 Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
