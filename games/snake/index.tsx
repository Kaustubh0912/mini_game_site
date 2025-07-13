import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

// --- Constants ---
const DEFAULT_CANVAS_SIZE = 400;
const DEFAULT_GRID_SIZE = 20;
const DEFAULT_GAME_SPEED = 150;

type Point = { x: number; y: number };

// --- Helper: Generate new food ---
const generateFood = (snakeBody: Point[], gridSize: number): Point => {
  let newFood: Point;
  do {
    newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (snakeBody.some((s) => s.x === newFood.x && s.y === newFood.y));
  return newFood;
};

// --- Main Component ---
export default function SnakeGame() {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // --- State ---
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS_SIZE);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [tileSize, setTileSize] = useState(canvasSize / gridSize);
  const [gameSpeed, setGameSpeed] = useState(DEFAULT_GAME_SPEED);

  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>(() =>
    generateFood([{ x: 10, y: 10 }], gridSize)
  );
  const [bomb, setBomb] = useState<Point | null>(null);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [theme, setTheme] = useState("classic"); // classic, neon, retro

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const directionRef = useRef(direction);
  const directionChangedRef = useRef(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  directionRef.current = direction;

  // --- Device detection and responsive sizing ---
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isSmall = width < 380;

      setIsMobile(isMobileDevice);
      setIsSmallMobile(isSmall);

      // Calculate appropriate canvas size
      const containerWidth = containerRef.current?.clientWidth || width;
      let newSize;

      if (isSmall) {
        // Very small screens
        newSize = Math.min(containerWidth - 20, 280);
        setGameSpeed(DEFAULT_GAME_SPEED + 30); // Slightly slower for small screens
      } else if (isMobileDevice) {
        // Mobile screens
        newSize = Math.min(containerWidth - 32, 350);
        setGameSpeed(DEFAULT_GAME_SPEED + 15);
      } else {
        // Tablets and desktop
        newSize = Math.min(containerWidth - 40, DEFAULT_CANVAS_SIZE);
        setGameSpeed(DEFAULT_GAME_SPEED);
      }

      // Make sure we have a multiple of the grid size for clean rendering
      newSize = Math.floor(newSize / gridSize) * gridSize;

      setCanvasSize(newSize);
      setTileSize(newSize / gridSize);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [gridSize]);

  // --- High Score ---
  useEffect(() => {
    const storedHighScore = localStorage.getItem("snakeHighScore");
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("snakeHighScore", score.toString());
    }
  }, [score, highScore]);

  // --- Restart Logic ---
  const restartGame = () => {
    const initial = {
      x: Math.floor(gridSize / 2),
      y: Math.floor(gridSize / 2),
    };
    setSnake([initial]);
    setFood(generateFood([initial], gridSize));
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setIsGameOver(false);
    setHasStarted(true);
    setIsPaused(false);
    setBomb(null);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // --- Direction Control Function ---
  const changeDirection = (newDirection: Point) => {
    if (directionChangedRef.current) return;

    const { x, y } = directionRef.current;

    // Prevent 180-degree turns
    if (
      (newDirection.x !== 0 && x === -newDirection.x) ||
      (newDirection.y !== 0 && y === -newDirection.y)
    ) {
      return;
    }

    setDirection(newDirection);
    directionChangedRef.current = true;
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isGameOver || !hasStarted) return;

      if (
        [
          "ARROWUP",
          "ARROWDOWN",
          "ARROWLEFT",
          "ARROWRIGHT",
          "W",
          "A",
          "S",
          "D",
          "P",
        ].includes(e.key.toUpperCase())
      ) {
        e.preventDefault();
      }

      const key = e.key.toUpperCase();

      if (key === "P") {
        togglePause();
        return;
      }

      if (key === "W" || key === "ARROWUP") {
        changeDirection({ x: 0, y: -1 });
      } else if (key === "S" || key === "ARROWDOWN") {
        changeDirection({ x: 0, y: 1 });
      } else if (key === "A" || key === "ARROWLEFT") {
        changeDirection({ x: -1, y: 0 });
      } else if (key === "D" || key === "ARROWRIGHT") {
        changeDirection({ x: 1, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, isGameOver, hasStarted]);

  // --- Score Submission ---
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
  }, [isGameOver, score, session]);

  // --- Game Loop ---
  useEffect(() => {
    if (!hasStarted || isGameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

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
          newHead.x >= gridSize ||
          newHead.y < 0 ||
          newHead.y >= gridSize;
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
          const newFood = generateFood(newSnake, gridSize);
          setFood(newFood);

          // Maybe spawn a bomb
          if (Math.random() < 0.4) {
            let newBomb: Point;
            do {
              newBomb = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize),
              };
            } while (
              newSnake.some((s) => s.x === newBomb.x && s.y === newBomb.y) ||
              (newBomb.x === food.x && newBomb.y === food.y)
            );
            setBomb(newBomb);
          } else {
            setBomb(null);
          }
        } else {
          newSnake.pop();
        }

        // Hit bomb
        if (bomb && newHead.x === bomb.x && newHead.y === bomb.y) {
          setIsGameOver(true);
          return prev;
        }

        return newSnake;
      });
    };

    gameLoopRef.current = setInterval(gameLoop, gameSpeed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isGameOver, isPaused, food, hasStarted, gameSpeed, gridSize]);

  // --- Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle =
      theme === "neon" ? "#000" : theme === "retro" ? "#7b8c55" : "#121212";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid (subtle)
    if (theme === "classic" || theme === "retro") {
      ctx.strokeStyle = theme === "retro" ? "#9bac67" : "#1f1f1f";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvasSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(canvasSize, i * tileSize);
        ctx.stroke();
      }
    }

    // Draw snake
    snake.forEach((seg, index) => {
      let snakeColor;

      if (theme === "neon") {
        // Gradient for neon theme
        snakeColor =
          index === 0 ? "#00ff41" : `rgba(0, 255, 65, ${0.8 - index * 0.03})`;
        ctx.shadowBlur = 15 * (tileSize / 20);
        ctx.shadowColor = "#00ff41";
      } else if (theme === "retro") {
        // Dark colors for retro theme
        snakeColor = index === 0 ? "#2b2e26" : "#3b3f32";
      } else {
        // Default classic theme
        snakeColor = index === 0 ? "#4ade80" : "#3ecc70";
      }

      ctx.fillStyle = snakeColor;

      // Scale eye and segment sizes based on tile size
      const segmentPadding = 1 * (tileSize / 20);
      const eyeSize = tileSize / 5;
      const borderRadius = tileSize / 4;

      // Head is rounded rectangle, body is normal rectangle
      if (index === 0) {
        // Draw rounded rectangle for head
        roundRect(
          ctx,
          seg.x * tileSize,
          seg.y * tileSize,
          tileSize,
          tileSize,
          borderRadius
        );

        // Draw eyes
        ctx.fillStyle = theme === "neon" ? "#000" : "#fff";

        // Determine eye positions based on direction
        if (direction.x === 1) {
          // right
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.7,
            seg.y * tileSize + tileSize * 0.3,
            eyeSize,
            eyeSize
          );
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.7,
            seg.y * tileSize + tileSize * 0.6,
            eyeSize,
            eyeSize
          );
        } else if (direction.x === -1) {
          // left
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.2,
            seg.y * tileSize + tileSize * 0.3,
            eyeSize,
            eyeSize
          );
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.2,
            seg.y * tileSize + tileSize * 0.6,
            eyeSize,
            eyeSize
          );
        } else if (direction.y === -1) {
          // up
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.3,
            seg.y * tileSize + tileSize * 0.2,
            eyeSize,
            eyeSize
          );
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.6,
            seg.y * tileSize + tileSize * 0.2,
            eyeSize,
            eyeSize
          );
        } else if (direction.y === 1) {
          // down
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.3,
            seg.y * tileSize + tileSize * 0.7,
            eyeSize,
            eyeSize
          );
          ctx.fillRect(
            seg.x * tileSize + tileSize * 0.6,
            seg.y * tileSize + tileSize * 0.7,
            eyeSize,
            eyeSize
          );
        }
      } else {
        ctx.fillRect(
          seg.x * tileSize + segmentPadding,
          seg.y * tileSize + segmentPadding,
          tileSize - segmentPadding * 2,
          tileSize - segmentPadding * 2
        );
      }

      // Reset shadow blur for other elements
      ctx.shadowBlur = 0;
    });

    // Draw food
    const foodX = food.x * tileSize + tileSize / 2;
    const foodY = food.y * tileSize + tileSize / 2;
    const foodRadius = tileSize / 2 - 2;

    if (theme === "neon") {
      ctx.shadowBlur = 15 * (tileSize / 20);
      ctx.shadowColor = "#ff073a";
      ctx.fillStyle = "#ff073a";
    } else if (theme === "retro") {
      ctx.fillStyle = "#d03e19";
    } else {
      ctx.fillStyle = "#ef4444";
    }

    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add a stem to the food
    if (theme !== "neon") {
      ctx.fillStyle = theme === "retro" ? "#577245" : "#3e8e41";
      ctx.fillRect(foodX - 2, foodY - foodRadius - 3, 4, 5);
    }

    ctx.shadowBlur = 0;

    // Draw bomb
    if (bomb) {
      const centerX = bomb.x * tileSize + tileSize / 2;
      const centerY = bomb.y * tileSize + tileSize / 2;
      const radius = tileSize / 2 - 2;

      if (theme === "neon") {
        ctx.shadowBlur = 15 * (tileSize / 20);
        ctx.shadowColor = "#ff9500";

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, "#ffbb00");
        gradient.addColorStop(0.7, "#ff9500");
        gradient.addColorStop(1, "#ff5e00");

        ctx.fillStyle = gradient;
      } else if (theme === "retro") {
        ctx.fillStyle = "#3f4234";
      } else {
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
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      if (theme === "neon") {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        const fontSize = Math.max(tileSize / 2, 10);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💥", centerX, centerY);
      } else {
        ctx.fillStyle = theme === "retro" ? "#1e1f17" : "#555555";
        ctx.beginPath();
        ctx.arc(
          centerX - radius / 4,
          centerY - radius / 4,
          radius / 4,
          0,
          2 * Math.PI
        );
        ctx.fill();

        ctx.fillStyle = theme === "retro" ? "#7b8c55" : "#8B4513";
        const stemWidth = Math.max(2, tileSize / 10);
        const stemHeight = Math.max(3, tileSize / 6);
        ctx.fillRect(
          centerX - stemWidth / 2,
          centerY - radius - stemHeight,
          stemWidth,
          stemHeight
        );
      }
    }

    // Draw pause overlay
    if (isPaused && hasStarted && !isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.fillStyle = "#fff";
      ctx.font = `bold ${canvasSize / 16}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", canvasSize / 2, canvasSize / 2);
      ctx.font = `${canvasSize / 25}px Arial`;
      ctx.fillText(
        isMobile ? "Tap to resume" : "Press P to resume",
        canvasSize / 2,
        canvasSize / 2 + canvasSize / 13
      );
    }
  }, [
    snake,
    food,
    bomb,
    theme,
    direction,
    isPaused,
    hasStarted,
    isGameOver,
    canvasSize,
    tileSize,
    isMobile,
    gridSize,
  ]);

  // Helper for rounded rectangle
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  // --- Handle touch controls ---
  const handleTouchDirectionPress = (dirX: number, dirY: number) => {
    if (isPaused || isGameOver || !hasStarted) return;
    changeDirection({ x: dirX, y: dirY });
  };

  // --- Auto-scroll into view on load ---
  useEffect(() => {
    canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl mx-auto"
    >
      {/* Game Header */}
      <div className="w-full flex flex-col md:flex-row md:justify-between items-center mb-2 sm:mb-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-wide">
          🐍 Snake Adventure
        </h2>

        <div className="flex items-center space-x-1 sm:space-x-3 mt-2 md:mt-0">
          <button
            onClick={() => setTheme("classic")}
            className={`px-2 py-1 rounded-md text-xs ${
              theme === "classic"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            Classic
          </button>
          <button
            onClick={() => setTheme("neon")}
            className={`px-2 py-1 rounded-md text-xs ${
              theme === "neon"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            Neon
          </button>
          <button
            onClick={() => setTheme("retro")}
            className={`px-2 py-1 rounded-md text-xs ${
              theme === "retro"
                ? "bg-yellow-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            Retro
          </button>
        </div>
      </div>

      {/* Score Panel */}
      <div className="w-full grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-gradient-to-br from-green-900 to-green-800 p-2 sm:p-3 rounded-xl shadow-lg">
          <p className="text-xs uppercase text-green-300 tracking-wide">
            Current Score
          </p>
          <p className="text-lg sm:text-2xl font-bold text-green-400">
            {score}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-2 sm:p-3 rounded-xl shadow-lg">
          <p className="text-xs uppercase text-purple-300 tracking-wide">
            High Score
          </p>
          <p className="text-lg sm:text-2xl font-bold text-purple-400">
            {highScore}
          </p>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-lg overflow-hidden shadow-[0_0_30px_rgba(74,222,128,0.3)] mb-3 sm:mb-4">
        {/* Start screen */}
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center rounded-lg z-10 p-4 sm:p-6 text-center">
            <div className="animate-pulse mb-3">
              <span className="text-4xl sm:text-5xl">🐍</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
              Snake Adventure
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm mt-2 mb-4 max-w-xs">
              {isMobile
                ? "Use the directional buttons below to control your snake. Eat food, avoid bombs!"
                : "Use WASD or arrow keys to control your snake. Press P to pause. Collect food and avoid bombs!"}
            </p>
            <button
              onClick={() => setHasStarted(true)}
              className="mt-2 px-6 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-full transition duration-300 transform hover:scale-105 shadow-lg"
            >
              ▶️ Start Game
            </button>
          </div>
        )}

        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className={`bg-slate-900 border-2 ${
            theme === "neon"
              ? "border-[#00ff41]"
              : theme === "retro"
              ? "border-[#7b8c55]"
              : "border-green-600"
          } rounded-lg`}
          onClick={() => {
            if (isPaused && hasStarted && !isGameOver) {
              setIsPaused(false);
            }
          }}
        />

        {/* Game Over screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center rounded-lg z-10">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-red-500 drop-shadow-glow mb-2">
              Game Over
            </h3>
            <p className="text-gray-300 mb-2">Final Score: {score}</p>

            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 font-bold mb-4">
                New High Score! 🏆
              </p>
            )}

            <button
              onClick={restartGame}
              className="mt-4 px-6 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-full transition duration-300 transform hover:scale-105 shadow-lg"
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>

      {/* Game Controls */}
      {hasStarted && !isGameOver && (
        <div className="w-full flex justify-between items-center mb-3 sm:mb-4">
          <button
            onClick={togglePause}
            className={`px-3 py-1 sm:px-4 sm:py-2 ${
              isPaused
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-700 hover:bg-gray-600"
            } text-white rounded-lg shadow-md transition text-sm sm:text-base`}
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to restart?")) {
                restartGame();
              }
            }}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition text-sm sm:text-base"
          >
            🔄 Restart
          </button>
        </div>
      )}

      {/* Mobile Controls */}
      {hasStarted && !isGameOver && !isPaused && isMobile && (
        <div
          className={`mt-2 grid grid-cols-3 gap-1 sm:gap-2 ${
            isSmallMobile ? "w-36 h-36" : "w-48 h-48"
          }`}
        >
          {/* Up Button */}
          <div className="col-start-2">
            <button
              className="w-full h-full bg-green-800/80 hover:bg-green-700/80 active:bg-green-600 rounded-md flex items-center justify-center text-xl sm:text-2xl text-white"
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDirectionPress(0, -1);
              }}
            >
              ⬆️
            </button>
          </div>

          {/* Left Button */}
          <div className="col-start-1 row-start-2">
            <button
              className="w-full h-full bg-green-800/80 hover:bg-green-700/80 active:bg-green-600 rounded-md flex items-center justify-center text-xl sm:text-2xl text-white"
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDirectionPress(-1, 0);
              }}
            >
              ⬅️
            </button>
          </div>

          {/* Empty middle cell */}
          <div className="col-start-2 row-start-2 flex items-center justify-center">
            {isPaused ? (
              <button
                className={`${
                  isSmallMobile ? "w-8 h-8" : "w-12 h-12"
                } bg-green-600 rounded-full flex items-center justify-center`}
                onClick={togglePause}
              >
                ▶️
              </button>
            ) : (
              <button
                className={`${
                  isSmallMobile ? "w-8 h-8" : "w-12 h-12"
                } bg-gray-700 rounded-full flex items-center justify-center`}
                onClick={togglePause}
              >
                ⏸️
              </button>
            )}
          </div>

          {/* Right Button */}
          <div className="col-start-3 row-start-2">
            <button
              className="w-full h-full bg-green-800/80 hover:bg-green-700/80 active:bg-green-600 rounded-md flex items-center justify-center text-xl sm:text-2xl text-white"
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDirectionPress(1, 0);
              }}
            >
              ➡️
            </button>
          </div>

          {/* Down Button */}
          <div className="col-start-2 row-start-3">
            <button
              className="w-full h-full bg-green-800/80 hover:bg-green-700/80 active:bg-green-600 rounded-md flex items-center justify-center text-xl sm:text-2xl text-white"
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDirectionPress(0, 1);
              }}
            >
              ⬇️
            </button>
          </div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="mt-2 text-center">
        <p className="text-gray-400 text-xs sm:text-sm">
          {isMobile
            ? "Collect red food to grow your snake. Avoid bombs and walls!"
            : "Use WASD or arrow keys to control. Press P to pause. Collect food, avoid bombs!"}
        </p>
      </div>
    </div>
  );
}
