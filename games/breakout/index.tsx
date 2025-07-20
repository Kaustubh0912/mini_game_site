import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

// --- Constants ---
const DEFAULT_CANVAS_WIDTH = 720;
const DEFAULT_CANVAS_HEIGHT = 480;
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
type Brick = {
  x: number;
  y: number;
  status: 1 | 0;
  color: string;
  points: number;
};
type Pattern = "pyramid" | "wall" | "checkerboard" | "spaced" | "zigzag";
type PowerupType =
  | "expand"
  | "shrink"
  | "speedUp"
  | "speedDown"
  | "extraLife"
  | null;
type Powerup = {
  x: number;
  y: number;
  dy: number;
  type: PowerupType;
  active: boolean;
};

// --- Brick Generator ---
const createBricks = (): Brick[][] => {
  const patterns: Pattern[] = [
    "pyramid",
    "wall",
    "checkerboard",
    "spaced",
    "zigzag",
  ];
  const pattern = patterns[
    Math.floor(Math.random() * patterns.length)
  ] as Pattern;

  // Color palette for bricks
  const colors = [
    { color: "#ec4899", points: 10 }, // Pink
    { color: "#8b5cf6", points: 15 }, // Purple
    { color: "#3b82f6", points: 20 }, // Blue
    { color: "#10b981", points: 30 }, // Green
    { color: "#f59e0b", points: 50 }, // Yellow
  ];

  return Array.from({ length: BRICK_COLUMN_COUNT }, (_, c) =>
    Array.from({ length: BRICK_ROW_COUNT }, (_, r) => {
      let status: 1 | 0 = 0;
      // Assign different points based on row (top rows are worth more)
      const rowColor = colors[r % colors.length];

      if (
        pattern === "wall" ||
        (pattern === "checkerboard" && (c + r) % 2 === 0) ||
        (pattern === "pyramid" &&
          c >= Math.floor(BRICK_COLUMN_COUNT / 2) - r &&
          c <= Math.floor(BRICK_COLUMN_COUNT / 2) + r) ||
        (pattern === "spaced" && c % 2 === 0) ||
        (pattern === "zigzag" && (r % 2 === 0 ? c % 2 === 0 : c % 2 === 1))
      ) {
        status = 1;
      }

      return {
        x: 0,
        y: 0,
        status,
        color: rowColor.color,
        points: rowColor.points,
      };
    })
  );
};

// --- Main Game Component ---
const BreakoutGame = () => {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // --- Game State ---
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_CANVAS_HEIGHT);
  const [paddleWidth, setPaddleWidth] = useState(PADDLE_WIDTH);
  const [paddleX, setPaddleX] = useState(
    (DEFAULT_CANVAS_WIDTH - PADDLE_WIDTH) / 2
  );
  const [ballX, setBallX] = useState(DEFAULT_CANVAS_WIDTH / 2);
  const [ballY, setBallY] = useState(DEFAULT_CANVAS_HEIGHT - 30);
  const [ballDX, setBallDX] = useState(INITIAL_BALL_SPEED);
  const [ballDY, setBallDY] = useState(-INITIAL_BALL_SPEED);
  const [ballSpeed, setBallSpeed] = useState(INITIAL_BALL_SPEED);
  const [scaleFactor, setScaleFactor] = useState(1);

  const [bricks, setBricks] = useState(createBricks());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [fps, setFps] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [powerup, setPowerup] = useState<Powerup | null>(null);
  const [powerupActive, setPowerupActive] = useState<PowerupType>(null);
  const [powerupTimer, setPowerupTimer] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [streakMultiplier, setStreakMultiplier] = useState(1);
  const [streak, setStreak] = useState(0);
  const [levelPaused, setLevelPaused] = useState(false);
  const [levelCompleteMessage, setLevelCompleteMessage] = useState("");

  // --- Responsive canvas sizing ---
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileDevice = window.innerWidth < 768;
      const isSmall = window.innerWidth < 500; // Extra small screens
      setIsMobile(isMobileDevice);
      setIsSmallScreen(isSmall);

      // Get container width for responsive sizing
      const containerWidth =
        containerRef.current?.clientWidth || Math.min(window.innerWidth, 720);

      let newWidth = containerWidth - (isSmall ? 20 : 40);
      const aspectRatio = DEFAULT_CANVAS_HEIGHT / DEFAULT_CANVAS_WIDTH;

      // Make sure the width doesn't exceed the original game dimensions
      newWidth = Math.min(newWidth, DEFAULT_CANVAS_WIDTH);

      // Calculate new dimensions and scaling factor
      const newHeight = Math.floor(newWidth * aspectRatio);
      const newScale = newWidth / DEFAULT_CANVAS_WIDTH;

      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setScaleFactor(newScale);

      // Adjust paddle size based on screen size
      if (isSmall) {
        setPaddleWidth(PADDLE_WIDTH * 0.8 * newScale);
      } else if (isMobileDevice) {
        setPaddleWidth(PADDLE_WIDTH * 0.9 * newScale);
      } else {
        setPaddleWidth(PADDLE_WIDTH * newScale);
      }

      // Reset paddle position when screen size changes
      setPaddleX((newWidth - (paddleWidth || PADDLE_WIDTH * newScale)) / 2);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Adjust ball size based on screen size
  const adjustedBallRadius = Math.max(BALL_RADIUS * scaleFactor, 6);

  // --- High Score Management ---
  useEffect(() => {
    const savedHighScore = localStorage.getItem("breakout-highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("breakout-highscore", score.toString());
    }
  }, [score, highScore]);

  // --- Powerup Management ---
  useEffect(() => {
    if (powerupActive && powerupTimer > 0) {
      const timer = setTimeout(() => {
        setPowerupTimer((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (powerupTimer === 0 && powerupActive) {
      // Reset powerup effects
      if (powerupActive === "expand" || powerupActive === "shrink") {
        setPaddleWidth(PADDLE_WIDTH * scaleFactor);
      } else if (powerupActive === "speedUp" || powerupActive === "speedDown") {
        // Adjust ball speed back to level-appropriate speed
        const levelSpeed = INITIAL_BALL_SPEED + (level - 1) * 0.5;
        setBallSpeed(levelSpeed);

        // Maintain direction but adjust speed
        const angle = Math.atan2(ballDY, ballDX);
        setBallDX(levelSpeed * Math.cos(angle));
        setBallDY(levelSpeed * Math.sin(angle));
      }
      setPowerupActive(null);
    }
  }, [powerupTimer, powerupActive, level, scaleFactor]);

  // --- Ball & Collision Logic ---
  const runGameLogic = useCallback(() => {
    if (isPaused) return;

    // Scale factors for calculations based on canvas size
    const widthRatio = canvasWidth / DEFAULT_CANVAS_WIDTH;
    const heightRatio = canvasHeight / DEFAULT_CANVAS_HEIGHT;

    // Update powerup position if any
    if (powerup && powerup.active) {
      const powerupSpeed = 2 * heightRatio;
      const nextPowerupY = powerup.y + powerupSpeed;

      // Check if powerup is collected
      if (
        nextPowerupY + 15 * heightRatio >=
          canvasHeight - PADDLE_HEIGHT * heightRatio &&
        nextPowerupY <= canvasHeight &&
        powerup.x >= paddleX &&
        powerup.x <= paddleX + paddleWidth
      ) {
        setPowerup((prev) => ({ ...prev!, active: false }));
        setPowerupActive(powerup.type);
        setPowerupTimer(10); // 10 second powerup duration

        // Apply powerup effects
        if (powerup.type === "expand") {
          setPaddleWidth(Math.min(paddleWidth * 1.5, canvasWidth * 0.5));
        } else if (powerup.type === "shrink") {
          setPaddleWidth(Math.max(paddleWidth * 0.7, 40 * widthRatio));
        } else if (powerup.type === "speedUp") {
          const newSpeed = ballSpeed * 1.3;
          setBallSpeed(newSpeed);

          // Maintain direction but increase speed
          const angle = Math.atan2(ballDY, ballDX);
          setBallDX(newSpeed * Math.cos(angle));
          setBallDY(newSpeed * Math.sin(angle));
        } else if (powerup.type === "speedDown") {
          const newSpeed = ballSpeed * 0.7;
          setBallSpeed(newSpeed);

          // Maintain direction but decrease speed
          const angle = Math.atan2(ballDY, ballDX);
          setBallDX(newSpeed * Math.cos(angle));
          setBallDY(newSpeed * Math.sin(angle));
        } else if (powerup.type === "extraLife") {
          setLives((prev) => prev + 1);
        }
      }
      // Check if powerup is out of bounds
      else if (nextPowerupY > canvasHeight) {
        setPowerup((prev) => ({ ...prev!, active: false }));
      }
      // Update powerup position
      else {
        setPowerup((prev) => ({ ...prev!, y: nextPowerupY }));
      }
    }

    let nextBallX = ballX + ballDX;
    let nextBallY = ballY + ballDY;

    // Wall collisions
    if (
      nextBallX < adjustedBallRadius ||
      nextBallX > canvasWidth - adjustedBallRadius
    ) {
      setBallDX((prev) => -prev);
      nextBallX = ballX - ballDX; // Reverse the movement
    }

    if (nextBallY < adjustedBallRadius) {
      setBallDY((prev) => -prev);
      nextBallY = ballY - ballDY; // Reverse the movement
    } else if (nextBallY > canvasHeight - adjustedBallRadius) {
      // Paddle collision
      if (
        nextBallY + adjustedBallRadius >=
          canvasHeight - PADDLE_HEIGHT * heightRatio &&
        nextBallX > paddleX &&
        nextBallX < paddleX + paddleWidth
      ) {
        // Calculate relative position on paddle (from -1 to 1)
        const relativeIntersectX =
          (nextBallX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
        // Calculate bounce angle (from -60° to 60°)
        const bounceAngle = relativeIntersectX * (Math.PI / 3);
        const speed = Math.hypot(ballDX, ballDY);

        setBallDX(speed * Math.sin(bounceAngle));
        setBallDY(-Math.abs(speed * Math.cos(bounceAngle)));

        // Maintain streak for successful paddle hits
        setStreak((prev) => prev + 1);
        // Update multiplier every 5 hits
        if (streak > 0 && streak % 5 === 0) {
          setStreakMultiplier((prev) => Math.min(prev + 0.5, 3));
        }
      } else {
        // Ball missed the paddle
        setLives((prev) => {
          if (prev - 1 <= 0) {
            setIsGameOver(true);
            return 0;
          }
          // Reset streak when ball is missed
          setStreak(0);
          setStreakMultiplier(1);
          resetBall();
          return prev - 1;
        });
        return;
      }
    }

    // Brick Collision
    let bricksLeft = 0;
    const newBricks = bricks.map((col, c) =>
      col.map((brick, r) => {
        if (brick.status === 1) {
          // Calculate brick position with scaling
          const brickLeft =
            c * (BRICK_WIDTH * widthRatio + BRICK_PADDING * widthRatio) +
            BRICK_OFFSET_LEFT * widthRatio;
          const brickRight = brickLeft + BRICK_WIDTH * widthRatio;
          const brickTop =
            r * (BRICK_HEIGHT * heightRatio + BRICK_PADDING * heightRatio) +
            BRICK_OFFSET_TOP * heightRatio;
          const brickBottom = brickTop + BRICK_HEIGHT * heightRatio;

          // Store calculated position in brick
          brick.x = brickLeft;
          brick.y = brickTop;

          // Check if ball is near brick
          const hit =
            nextBallX + adjustedBallRadius > brickLeft &&
            nextBallX - adjustedBallRadius < brickRight &&
            nextBallY + adjustedBallRadius > brickTop &&
            nextBallY - adjustedBallRadius < brickBottom;

          if (hit) {
            // Determine which side of the brick was hit
            const ballCenterX = nextBallX;
            const ballCenterY = nextBallY;

            // Calculate distance from ball center to brick edges
            const distLeft = Math.abs(ballCenterX - brickLeft);
            const distRight = Math.abs(ballCenterX - brickRight);
            const distTop = Math.abs(ballCenterY - brickTop);
            const distBottom = Math.abs(ballCenterY - brickBottom);

            // Find the minimum distance to determine which side was hit
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);

            if (minDist === distTop || minDist === distBottom) {
              setBallDY((prev) => -prev);
            } else {
              setBallDX((prev) => -prev);
            }

            // Add score based on brick value and streak multiplier
            setScore(
              (prev) => prev + Math.floor(brick.points * streakMultiplier)
            );

            // Maybe spawn a powerup (20% chance)
            if (Math.random() < 0.2 && !powerup?.active) {
              const powerupTypes: PowerupType[] = [
                "expand",
                "shrink",
                "speedUp",
                "speedDown",
                "extraLife",
              ];
              const randomType =
                powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

              setPowerup({
                x: brick.x + (BRICK_WIDTH * widthRatio) / 2,
                y: brick.y + (BRICK_HEIGHT * heightRatio) / 2,
                dy: 2 * heightRatio,
                type: randomType,
                active: true,
              });
            }

            return { ...brick, status: 0 as 0 | 1 };
          }
          bricksLeft++;
          return brick;
        }
        return brick;
      })
    );

    setBricks(newBricks);
    if (bricksLeft === 0) {
      setLevelPaused(true);
      setLevelCompleteMessage(`Level ${level} Complete!`);
      setIsWin(true);

      setTimeout(() => {
        setLevel((prev) => prev + 1);
        setBricks(createBricks());
        setStreak(0);
        setStreakMultiplier(1);
        resetBall(true);

        // Show "Get Ready" message
        setLevelCompleteMessage(`Get Ready for Level ${level + 1}!`);

        // Give player a few seconds to prepare for next level
        setTimeout(() => {
          setIsWin(false);
          setLevelPaused(false);
          setLevelCompleteMessage("");
        }, 3000);
      }, 2000);

      return;
    }

    setBallX(nextBallX);
    setBallY(nextBallY);
  }, [
    ballX,
    ballY,
    ballDX,
    ballDY,
    paddleX,
    paddleWidth,
    bricks,
    isPaused,
    ballSpeed,
    powerup,
    streakMultiplier,
    streak,
    canvasWidth,
    canvasHeight,
    level,
    adjustedBallRadius,
  ]);

  const resetBall = (speedUp = false) => {
    // Reset ball position
    setBallX(canvasWidth / 2);
    setBallY(canvasHeight - 30 * (canvasHeight / DEFAULT_CANVAS_HEIGHT));

    // Reset paddle position
    setPaddleX((canvasWidth - paddleWidth) / 2);

    // Calculate new speed
    let newSpeed = speedUp
      ? ballSpeed * 1.25
      : INITIAL_BALL_SPEED + (level - 1) * 0.5;
    setBallSpeed(newSpeed);

    // Scale speed based on canvas size
    newSpeed *= canvasWidth / DEFAULT_CANVAS_WIDTH;

    // Random angle between -45° and 45° (but not too horizontal)
    const angle = (Math.random() * 0.5 + 0.25) * Math.PI;
    const direction = Math.random() > 0.5 ? 1 : -1;

    // Set velocity
    setBallDX(newSpeed * Math.sin(angle) * direction);
    setBallDY(-Math.abs(newSpeed * Math.cos(angle)));
  };

  // --- Game Loop ---
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !hasStarted || isGameOver || levelPaused) return;

    const loop = () => {
      runGameLogic();
      renderGame(context);
      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [runGameLogic, isGameOver, hasStarted, levelPaused]);

  // --- Rendering Function ---
  const renderGame = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Scale factors for rendering
    const widthRatio = canvasWidth / DEFAULT_CANVAS_WIDTH;
    const heightRatio = canvasHeight / DEFAULT_CANVAS_HEIGHT;

    // Draw Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, "#0f172a");
    bgGradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid lines (scaled)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;

    const gridSize = 30 * widthRatio;
    for (let i = 0; i < canvasWidth; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }

    for (let i = 0; i < canvasHeight; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasWidth, i);
      ctx.stroke();
    }

    // Draw Bricks (scaled)
    bricks.forEach((col, c) =>
      col.forEach((brick, r) => {
        if (brick.status === 1) {
          // Calculate brick position with scaling
          const brickX =
            c * (BRICK_WIDTH * widthRatio + BRICK_PADDING * widthRatio) +
            BRICK_OFFSET_LEFT * widthRatio;
          const brickY =
            r * (BRICK_HEIGHT * heightRatio + BRICK_PADDING * heightRatio) +
            BRICK_OFFSET_TOP * heightRatio;
          const brickW = BRICK_WIDTH * widthRatio;
          const brickH = BRICK_HEIGHT * heightRatio;

          // Store calculated position in brick
          brick.x = brickX;
          brick.y = brickY;

          // Fancy gradient for each brick
          const gradient = ctx.createLinearGradient(
            brickX,
            brickY,
            brickX,
            brickY + brickH
          );

          // Parse the brick color to get its base
          const baseColor = brick.color;

          gradient.addColorStop(0, baseColor);
          gradient.addColorStop(1, adjustColor(baseColor, -20));

          ctx.fillStyle = gradient;
          roundRect(ctx, brickX, brickY, brickW, brickH, 4 * widthRatio);

          // Add highlight
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(
            brickX + 2 * widthRatio,
            brickY + 2 * heightRatio,
            brickW - 4 * widthRatio,
            2 * heightRatio
          );

          // Add shadow
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fillRect(
            brickX + 2 * widthRatio,
            brickY + brickH - 4 * heightRatio,
            brickW - 4 * widthRatio,
            2 * heightRatio
          );
        }
      })
    );

    // Draw Paddle (scaled)
    const paddleGradient = ctx.createLinearGradient(
      paddleX,
      canvasHeight - PADDLE_HEIGHT * heightRatio,
      paddleX,
      canvasHeight
    );
    paddleGradient.addColorStop(0, "#3b82f6");
    paddleGradient.addColorStop(1, "#1d4ed8");

    ctx.fillStyle = paddleGradient;
    roundRect(
      ctx,
      paddleX,
      canvasHeight - PADDLE_HEIGHT * heightRatio,
      paddleWidth,
      PADDLE_HEIGHT * heightRatio,
      4 * widthRatio
    );

    // Add paddle highlight/shadow
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(
      paddleX + 2 * widthRatio,
      canvasHeight - PADDLE_HEIGHT * heightRatio + 2 * heightRatio,
      paddleWidth - 4 * widthRatio,
      2 * heightRatio
    );

    // Draw Ball (with scaled radius)
    ctx.beginPath();

    // Ball gradient
    const ballGradient = ctx.createRadialGradient(
      ballX,
      ballY,
      0,
      ballX,
      ballY,
      adjustedBallRadius
    );
    ballGradient.addColorStop(0, "#f87171");
    ballGradient.addColorStop(0.8, "#ef4444");
    ballGradient.addColorStop(1, "#dc2626");

    ctx.fillStyle = ballGradient;
    ctx.arc(ballX, ballY, adjustedBallRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.arc(
      ballX - adjustedBallRadius * 0.3,
      ballY - adjustedBallRadius * 0.3,
      adjustedBallRadius * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw powerup if active (scaled)
    if (powerup && powerup.active) {
      let powerupColor = "";
      let powerupText = "";

      switch (powerup.type) {
        case "expand":
          powerupColor = "#22c55e";
          powerupText = "W";
          break;
        case "shrink":
          powerupColor = "#f43f5e";
          powerupText = "N";
          break;
        case "speedUp":
          powerupColor = "#3b82f6";
          powerupText = "S+";
          break;
        case "speedDown":
          powerupColor = "#8b5cf6";
          powerupText = "S-";
          break;
        case "extraLife":
          powerupColor = "#f97316";
          powerupText = "♥";
          break;
      }

      // Draw powerup capsule
      ctx.beginPath();
      ctx.fillStyle = powerupColor;
      const powerupWidth = 20 * widthRatio;
      const powerupHeight = 12 * heightRatio;
      roundRect(
        ctx,
        powerup.x - powerupWidth / 2,
        powerup.y - powerupHeight / 2,
        powerupWidth,
        powerupHeight,
        6 * widthRatio
      );

      // Draw powerup text
      ctx.fillStyle = "#ffffff";
      ctx.font = `${10 * widthRatio}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(powerupText, powerup.x, powerup.y);

      // Add glow effect
      ctx.shadowBlur = 6 * widthRatio;
      ctx.shadowColor = powerupColor;
      ctx.beginPath();
      roundRect(
        ctx,
        powerup.x - powerupWidth / 2,
        powerup.y - powerupHeight / 2,
        powerupWidth,
        powerupHeight,
        6 * widthRatio
      );
      ctx.shadowBlur = 0;
    }

    // Draw active powerup indicator
    if (powerupActive) {
      let indicatorColor = "";
      let indicatorText = "";

      switch (powerupActive) {
        case "expand":
          indicatorColor = "#22c55e";
          indicatorText = "Paddle Expanded";
          break;
        case "shrink":
          indicatorColor = "#f43f5e";
          indicatorText = "Paddle Shrunk";
          break;
        case "speedUp":
          indicatorColor = "#3b82f6";
          indicatorText = "Ball Sped Up";
          break;
        case "speedDown":
          indicatorColor = "#8b5cf6";
          indicatorText = "Ball Slowed Down";
          break;
        case "extraLife":
          indicatorColor = "#f97316";
          indicatorText = "Extra Life Added";
          break;
      }

      if (indicatorText) {
        ctx.fillStyle = indicatorColor;
        ctx.font = `${14 * Math.min(widthRatio, 1)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
          `${indicatorText} - ${powerupTimer}s`,
          canvasWidth / 2,
          10 * heightRatio
        );
      }
    }

    // Draw score multiplier if > 1
    if (streakMultiplier > 1) {
      ctx.fillStyle = "#f97316";
      ctx.font = `${16 * Math.min(widthRatio, 1)}px Arial`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(
        `${streakMultiplier.toFixed(1)}x`,
        canvasWidth - 10 * widthRatio,
        10 * heightRatio
      );

      // Draw streak counter
      ctx.fillStyle = "#94a3b8";
      ctx.font = `${12 * Math.min(widthRatio, 1)}px Arial`;
      ctx.fillText(
        `Streak: ${streak}`,
        canvasWidth - 10 * widthRatio,
        30 * heightRatio
      );
    }

    // Draw pause overlay
    if (isPaused) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.fillStyle = "#ffffff";
      ctx.font = `${30 * Math.min(widthRatio, 1)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", canvasWidth / 2, canvasHeight / 2);

      ctx.font = `${16 * Math.min(widthRatio, 1)}px Arial`;
      ctx.fillText(
        isMobile ? "Tap to resume" : "Press any key to resume",
        canvasWidth / 2,
        canvasHeight / 2 + 40 * heightRatio
      );
    }
  };

  // --- Mouse Controls ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPaused) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const relativeX = e.clientX - canvas.getBoundingClientRect().left;
      let newX = relativeX - paddleWidth / 2;

      // Keep paddle within bounds
      if (newX < 0) newX = 0;
      if (newX + paddleWidth > canvasWidth) newX = canvasWidth - paddleWidth;

      setPaddleX(newX);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [paddleWidth, isPaused, canvasWidth]);

  // --- Touch Controls ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (isPaused) return;
      e.preventDefault();

      const touch = e.touches[0];
      const relativeX = touch.clientX - canvas.getBoundingClientRect().left;

      let newX = relativeX - paddleWidth / 2;
      if (newX < 0) newX = 0;
      if (newX + paddleWidth > canvasWidth) newX = canvasWidth - paddleWidth;

      setPaddleX(newX);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;

      if (isPaused) {
        setIsPaused(false);
        return;
      }

      // Prevent scrolling when touching game area
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      touchStartXRef.current = null;
    };

    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [paddleWidth, isPaused, canvasWidth]);

  // Add swipe controls for mobile
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isMobile || !hasStarted || isGameOver || !touchStartXRef.current)
        return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;

      // Update paddle position based on swipe
      setPaddleX((prev) => {
        let newX = prev + deltaX;
        if (newX < 0) newX = 0;
        if (newX + paddleWidth > canvasWidth) newX = canvasWidth - paddleWidth;
        return newX;
      });

      // Update reference point for next move
      touchStartXRef.current = touch.clientX;
    };

    document.addEventListener("touchmove", handleTouchMove);
    return () => document.removeEventListener("touchmove", handleTouchMove);
  }, [isMobile, hasStarted, isGameOver, paddleWidth, canvasWidth]);

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) {
        setIsPaused(false);
        return;
      }

      if (e.key === " " || e.key === "Escape") {
        setIsPaused((prev) => !prev);
        return;
      }

      // Arrow key controls for the paddle
      const moveAmount = 20 * scaleFactor;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        setPaddleX((prev) => Math.max(0, prev - moveAmount));
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        setPaddleX((prev) =>
          Math.min(canvasWidth - paddleWidth, prev + moveAmount)
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, paddleWidth, canvasWidth, scaleFactor]);

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
          timestamp: new Date().toISOString(),
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
    setPaddleWidth(PADDLE_WIDTH * scaleFactor);
    resetBall();
    setScore(0);
    setLives(3);
    setLevel(1);
    setBricks(createBricks());
    setPowerupActive(null);
    setPowerupTimer(0);
    setPowerup(null);
    setStreak(0);
    setStreakMultiplier(1);
  };

  // Helper function to adjust color brightness
  const adjustColor = (color: string, amount: number) => {
    return color;
  };

  // Helper function for drawing rounded rectangles
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

  // --- UI ---
  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <h2 className="text-xl md:text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Breakout
      </h2>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-3 mb-3 w-full">
        <div className="flex flex-wrap justify-between gap-1 sm:gap-2">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-sm text-pink-600 dark:text-pink-400">🎯</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {score}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">
              (Best: {highScore})
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              🧱
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {level}
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-sm text-red-600 dark:text-red-400">❤️</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {lives}
            </span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-sm text-blue-600 dark:text-blue-400">⚡</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {ballSpeed.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-2">
        {!hasStarted && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10 px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-extrabold text-white mb-2">
                🎮 Breakout
              </p>
              <p className="text-xs sm:text-sm text-gray-200 mb-4 max-w-md">
                {isMobile
                  ? "Touch and swipe to move the paddle. Destroy all the bricks to advance levels!"
                  : "Use your mouse or arrow keys to control the paddle. Break all bricks to advance!"}
              </p>
              <button
                onClick={() => setHasStarted(true)}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-full transition shadow-md"
              >
                ▶️ Start Game
              </button>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={() => isPaused && setIsPaused(false)}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-slate-700 rounded-lg shadow-2xl mx-auto"
        />

        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
            <p className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              Game Over
            </p>
            <p className="text-lg sm:text-xl text-gray-300 mt-2 mb-4">
              Final Score: {score}
            </p>
            {score >= highScore && score > 0 && (
              <p className="text-yellow-400 font-bold mb-4">
                New High Score! 🏆
              </p>
            )}
            <button
              onClick={restartGame}
              className="mt-2 px-4 py-2 sm:px-6 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full transition shadow-lg"
            >
              🔄 Play Again
            </button>
          </div>
        )}

        {isWin && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
            <p className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              Level Complete!
            </p>
            <p className="text-base sm:text-xl text-gray-300 mt-2">
              Advancing to Level {level + 1}...
            </p>
          </div>
        )}
      </div>

      {hasStarted && !isGameOver && (
        <div className="mt-3 sm:mt-4 flex space-x-2 sm:space-x-4">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md shadow transition text-sm sm:text-base"
          >
            {isPaused ? "▶️ Resume" : "⏸️ Pause"}
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to restart the game?")) {
                restartGame();
              }
            }}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow transition text-sm sm:text-base"
          >
            🔄 Restart
          </button>
        </div>
      )}

      {isMobile && hasStarted && !isGameOver && (
        <div className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400 px-3">
          <p className="mb-1">Touch and swipe to control the paddle</p>
          <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-lg py-1 px-2 flex items-center justify-center">
            <div className="flex items-center">
              <span className="mr-1">⬅️</span>
              <div className="w-16 sm:w-24 h-1 bg-blue-500"></div>
              <span className="ml-1">➡️</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakoutGame;
