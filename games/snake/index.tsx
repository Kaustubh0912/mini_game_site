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
  const [bomb, setBomb] = useState<Point | null>(null);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
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
    setHasStarted(true);
    setBomb(null);
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (directionChangedRef.current) return;

      const key = e.key.toUpperCase();
      const { x, y } = directionRef.current;

      if (["ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT"].includes(key)) {
        e.preventDefault();
      }

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
    if (!hasStarted || isGameOver) return;

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
          const newFood = generateFood(newSnake);
          setFood(newFood);
          if (Math.random() < 0.4) {
            let newBomb: Point;
            do {
              newBomb = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
              };
            } while (
              newSnake.some((s) => s.x === newBomb.x && s.y === newBomb.y) ||
              (newBomb.x === food.x && newBomb.y === food.y)
            );
            setBomb(newBomb);
          } else {
            setBomb(null); // clear the previous bomb if any
          }
        } else {
          newSnake.pop();
        }

        if (bomb && newHead.x === bomb.x && newHead.y === bomb.y) {
          setIsGameOver(true);
          return prev;
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(gameLoop, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [isGameOver, food, hasStarted]);

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

    if (bomb) {
      const centerX = bomb.x * TILE_SIZE + TILE_SIZE / 2;
      const centerY = bomb.y * TILE_SIZE + TILE_SIZE / 2;
      const radius = TILE_SIZE / 2;

      const gradient = ctx.createRadialGradient(
        centerX - radius / 3,
        centerY - radius / 3,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "#333333");
      gradient.addColorStop(0.7, "#1a1a1a");
      gradient.addColorStop(1, "#000000");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#555555";
      ctx.beginPath();
      ctx.arc(
        centerX - radius / 4,
        centerY - radius / 4,
        radius / 4,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.fillStyle = "#8B4513";
      ctx.fillRect(centerX - 2, centerY - radius - 3, 4, 3);

      ctx.fillStyle = "#FFFF00";
      ctx.font = `${TILE_SIZE / 4}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("⚠", centerX, centerY + 3);
    }
  }, [snake, food, bomb]);

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
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center rounded-lg z-10">
            <p className="text-4xl font-extrabold text-white drop-shadow-lg">
              🎮 Snake Game
            </p>
            <button
              onClick={() => setHasStarted(true)}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white font-bold rounded-full transition shadow-md"
            >
              ▶️ Start
            </button>
          </div>
        )}

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
