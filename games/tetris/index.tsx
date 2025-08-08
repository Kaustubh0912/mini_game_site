"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  RotateCcw,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Zap,
  Target,
} from "lucide-react";

// Tetromino definitions
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00f0f0", // Cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#f0f000", // Yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#a000f0", // Purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00f000", // Green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#f00000", // Red
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#0000f0", // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#f0a000", // Orange
  },
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const PREVIEW_SIZE = 4;

type TetrominoType = keyof typeof TETROMINOES;
type GameStatus = "playing" | "paused" | "gameOver";

interface Position {
  x: number;
  y: number;
}

interface Piece {
  type: TetrominoType;
  shape: number[][];
  position: Position;
  color: string;
}

interface GameStats {
  score: number;
  lines: number;
  level: number;
  pieces: number;
  combo: number;
  maxCombo: number;
}

interface PowerUp {
  type: "clearLine" | "slowDown" | "bonus";
  active: boolean;
  duration: number;
}

const INITIAL_STATS: GameStats = {
  score: 0,
  lines: 0,
  level: 1,
  pieces: 0,
  combo: 0,
  maxCombo: 0,
};

// Enhanced scoring system
const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

const COMBO_MULTIPLIER = 1.5;

// Create confetti component without external dependency
const SimpleConfetti = () => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
    }>
  >([]);

  useEffect(() => {
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1,
          }))
          .filter((particle) => particle.y < window.innerHeight + 10),
      );
    }, 16);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
          }}
        />
      ))}
    </div>
  );
};

export default function TetrisGame() {
  const [isMobile, setIsMobile] = useState(false);
  const [board, setBoard] = useState<number[][]>([]);
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dropTime, setDropTime] = useState(1000);
  const [lastDrop, setLastDrop] = useState(Date.now());
  const [touchStart, setTouchStart] = useState<Position | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [ghostPiece, setGhostPiece] = useState<Piece | null>(null);
  const [comboText, setComboText] = useState<string | null>(null);
  const [lineFlash, setLineFlash] = useState<number[]>([]);
  const [shakeBoard, setShakeBoard] = useState(false);
  const [pieceBag, setPieceBag] = useState<TetrominoType[]>([]);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [needsPiecePlacement, setNeedsPiecePlacement] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize empty board
  const createEmptyBoard = useCallback((): number[][] => {
    return Array(BOARD_HEIGHT)
      .fill(0)
      .map(() => Array(BOARD_WIDTH).fill(0));
  }, []);

  // Get random tetromino with bag system for better distribution
  const getRandomTetromino = useCallback((): Piece => {
    let currentBag = [...pieceBag];

    if (currentBag.length === 0) {
      // Refill the bag with all pieces
      currentBag = Object.keys(TETROMINOES) as TetrominoType[];
      // Shuffle the bag
      for (let i = currentBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentBag[i], currentBag[j]] = [currentBag[j], currentBag[i]];
      }
    }

    const type = currentBag.pop()!;
    setPieceBag(currentBag);

    const tetromino = TETROMINOES[type];

    return {
      type,
      shape: tetromino.shape.map((row) => [...row]),
      position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
      color: tetromino.color,
    };
  }, [pieceBag]);

  // Rotate piece 90 degrees clockwise
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map((row) => row[index]).reverse(),
    );
    return { ...piece, shape: rotated };
  }, []);

  // Check if piece position is valid
  const isValidPosition = useCallback(
    (piece: Piece, board: number[][]): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.position.x + x;
            const newY = piece.position.y + y;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return false;
            }

            if (newY >= 0 && board[newY][newX]) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [],
  );

  // Place piece on board
  const placePiece = useCallback(
    (piece: Piece, board: number[][]): number[][] => {
      const newBoard = board.map((row) => [...row]);

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardY = piece.position.y + y;
            const boardX = piece.position.x + x;

            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              newBoard[boardY][boardX] = 1;
            }
          }
        }
      }

      return newBoard;
    },
    [],
  );

  // Calculate ghost piece position
  const calculateGhostPiece = useCallback(
    (piece: Piece): Piece => {
      let ghostY = piece.position.y;
      const ghostPiece = {
        ...piece,
        position: { ...piece.position, y: ghostY },
      };

      while (
        isValidPosition(
          {
            ...ghostPiece,
            position: { ...ghostPiece.position, y: ghostY + 1 },
          },
          board,
        )
      ) {
        ghostY++;
      }

      return { ...ghostPiece, position: { ...ghostPiece.position, y: ghostY } };
    },
    [board, isValidPosition],
  );

  // Clear completed lines with animation
  const clearLines = useCallback(
    (
      board: number[][],
    ): {
      newBoard: number[][];
      clearedLines: number;
      clearedLinePositions: number[];
    } => {
      const completedLines: number[] = [];

      for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (board[y].every((cell) => cell === 1)) {
          completedLines.push(y);
        }
      }

      if (completedLines.length === 0) {
        return { newBoard: board, clearedLines: 0, clearedLinePositions: [] };
      }

      // Flash effect for cleared lines
      setLineFlash(completedLines);
      setTimeout(() => setLineFlash([]), 300);

      const newBoard = board.filter(
        (_, index) => !completedLines.includes(index),
      );

      // Add new empty lines at the top
      for (let i = 0; i < completedLines.length; i++) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
      }

      return {
        newBoard,
        clearedLines: completedLines.length,
        clearedLinePositions: completedLines,
      };
    },
    [],
  );

  // Move piece
  const movePiece = useCallback(
    (direction: "left" | "right" | "down"): boolean => {
      if (!currentPiece || gameStatus !== "playing") return false;

      const deltaX = direction === "left" ? -1 : direction === "right" ? 1 : 0;
      const deltaY = direction === "down" ? 1 : 0;

      const newPiece = {
        ...currentPiece,
        position: {
          x: currentPiece.position.x + deltaX,
          y: currentPiece.position.y + deltaY,
        },
      };

      if (isValidPosition(newPiece, board)) {
        setCurrentPiece(newPiece);
        return true;
      } else if (direction === "down") {
        // Piece can't move down anymore, mark for placement
        setNeedsPiecePlacement(true);
      }

      return false;
    },
    [currentPiece, board, gameStatus, isValidPosition],
  );

  // Handle piece landing and line clearing
  const handlePieceLanding = useCallback(() => {
    if (!currentPiece || !nextPiece) return;

    const newBoard = placePiece(currentPiece, board);
    const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);

    setBoard(clearedBoard);

    if (clearedLines > 0) {
      const baseScore =
        LINE_SCORES[clearedLines as keyof typeof LINE_SCORES] || 0;
      const levelBonus = stats.level;
      const comboBonus =
        stats.combo > 0 ? Math.pow(COMBO_MULTIPLIER, stats.combo) : 1;
      const totalScore = Math.floor(baseScore * levelBonus * comboBonus);

      // Update combo
      const newCombo = stats.combo + 1;
      const newMaxCombo = Math.max(stats.maxCombo, newCombo);

      setStats((prev) => ({
        ...prev,
        score: prev.score + totalScore,
        lines: prev.lines + clearedLines,
        level: Math.floor((prev.lines + clearedLines) / 10) + 1,
        combo: newCombo,
        maxCombo: newMaxCombo,
      }));

      // Show combo text
      if (newCombo > 1) {
        setComboText(`${newCombo}x COMBO!`);
        setTimeout(() => setComboText(null), 2000);
      }

      // Special effects
      if (clearedLines === 4) {
        setShowConfetti(true);
        setShakeBoard(true);
        setTimeout(() => {
          setShowConfetti(false);
          setShakeBoard(false);
        }, 3000);
      } else if (clearedLines > 1) {
        setShakeBoard(true);
        setTimeout(() => setShakeBoard(false), 500);
      }

      // Chance to spawn power-up
      if (Math.random() < 0.1 && clearedLines >= 2) {
        const powerUpTypes: PowerUp["type"][] = [
          "clearLine",
          "slowDown",
          "bonus",
        ];
        const powerUpType = powerUpTypes[Math.floor(Math.random() * 3)];
        setPowerUps((prev) => [
          ...prev,
          { type: powerUpType, active: true, duration: 10000 },
        ]);
      }
    } else {
      // Reset combo if no lines cleared
      setStats((prev) => ({ ...prev, combo: 0 }));
    }

    setStats((prev) => ({ ...prev, pieces: prev.pieces + 1 }));

    // Check game over before spawning next piece
    if (!isValidPosition(nextPiece, clearedBoard)) {
      setGameStatus("gameOver");
      return;
    }

    // Spawn next piece
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomTetromino());
    setNeedsPiecePlacement(false);
  }, [
    currentPiece,
    nextPiece,
    board,
    stats,
    placePiece,
    clearLines,
    isValidPosition,
    getRandomTetromino,
  ]);

  // Handle piece placement when needed
  useEffect(() => {
    if (needsPiecePlacement) {
      handlePieceLanding();
    }
  }, [needsPiecePlacement, handlePieceLanding]);

  // Rotate current piece with wall kicks
  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || gameStatus !== "playing") return;

    const rotated = rotatePiece(currentPiece);

    // Try basic rotation first
    if (isValidPosition(rotated, board)) {
      setCurrentPiece(rotated);
      return;
    }

    // Try wall kicks
    const wallKicks = [
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 }, // Right
      { x: 0, y: -1 }, // Up
      { x: -2, y: 0 }, // Far left
      { x: 2, y: 0 }, // Far right
    ];

    for (const kick of wallKicks) {
      const kickedPiece = {
        ...rotated,
        position: {
          x: rotated.position.x + kick.x,
          y: rotated.position.y + kick.y,
        },
      };

      if (isValidPosition(kickedPiece, board)) {
        setCurrentPiece(kickedPiece);
        return;
      }
    }
  }, [currentPiece, board, gameStatus, rotatePiece, isValidPosition]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameStatus !== "playing") return;

    let dropDistance = 0;
    let testPiece = { ...currentPiece };

    while (isValidPosition(testPiece, board)) {
      dropDistance++;
      testPiece = {
        ...testPiece,
        position: { ...testPiece.position, y: testPiece.position.y + 1 },
      };
    }

    dropDistance--; // Back up one step

    if (dropDistance > 0) {
      const droppedPiece = {
        ...currentPiece,
        position: {
          ...currentPiece.position,
          y: currentPiece.position.y + dropDistance,
        },
      };

      setCurrentPiece(droppedPiece);

      // Add score for hard drop
      setStats((prev) => ({
        ...prev,
        score: prev.score + dropDistance * 2,
      }));

      // Trigger immediate placement
      setTimeout(() => {
        setNeedsPiecePlacement(true);
      }, 50);
    }
  }, [currentPiece, board, gameStatus, isValidPosition]);

  // Update ghost piece when current piece changes
  useEffect(() => {
    if (currentPiece && gameStatus === "playing") {
      setGhostPiece(calculateGhostPiece(currentPiece));
    } else {
      setGhostPiece(null);
    }
  }, [currentPiece, board, gameStatus, calculateGhostPiece]);

  // Game loop
  useEffect(() => {
    if (gameStatus !== "playing" || needsPiecePlacement) {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      if (now - lastDrop > dropTime) {
        movePiece("down");
        setLastDrop(now);
      }
      gameLoopRef.current = setTimeout(gameLoop, 50);
    };

    gameLoopRef.current = setTimeout(gameLoop, 50);

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameStatus, lastDrop, dropTime, movePiece, needsPiecePlacement]);

  // Update drop time based on level
  useEffect(() => {
    setDropTime(Math.max(100, 1000 - (stats.level - 1) * 40));
  }, [stats.level]);

  // Power-up timer
  useEffect(() => {
    const interval = setInterval(() => {
      setPowerUps((prev) =>
        prev
          .map((powerUp) => ({
            ...powerUp,
            duration: powerUp.duration - 100,
          }))
          .filter((powerUp) => powerUp.duration > 0),
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setPieceBag([]);

    // Create initial pieces
    const firstPiece = getRandomTetromino();
    const secondPiece = getRandomTetromino();

    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setStats(INITIAL_STATS);
    setGameStatus("playing");
    setGameStarted(true);
    setShowConfetti(false);
    setPowerUps([]);
    setGhostPiece(null);
    setComboText(null);
    setLineFlash([]);
    setShakeBoard(false);
    setLastDrop(Date.now());
    setNeedsPiecePlacement(false);
  }, [createEmptyBoard, getRandomTetromino]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (gameStatus === "playing") movePiece("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          if (gameStatus === "playing") movePiece("right");
          break;
        case "ArrowDown":
          e.preventDefault();
          if (gameStatus === "playing" && movePiece("down")) {
            setStats((prev) => ({ ...prev, score: prev.score + 1 }));
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (gameStatus === "playing") rotatePieceHandler();
          break;
        case "p":
        case "P":
          e.preventDefault();
          if (gameStatus === "paused") {
            setGameStatus("playing");
            setLastDrop(Date.now());
          } else if (gameStatus === "playing") {
            setGameStatus("paused");
          }
          break;
        case " ":
          e.preventDefault();
          if (gameStatus === "playing") hardDrop();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameStatus, gameStarted, movePiece, rotatePieceHandler, hardDrop]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Tap to rotate
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      rotatePieceHandler();
      setTouchStart(null);
      return;
    }

    // Swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          movePiece("right");
        } else {
          movePiece("left");
        }
      }
    } else if (deltaY > 50) {
      if (movePiece("down")) {
        setStats((prev) => ({ ...prev, score: prev.score + 1 }));
      }
    }

    setTouchStart(null);
  };

  // Render board with current piece and ghost piece
  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);

    // Add ghost piece to display board
    if (
      ghostPiece &&
      currentPiece &&
      ghostPiece.position.y !== currentPiece.position.y
    ) {
      for (let y = 0; y < ghostPiece.shape.length; y++) {
        for (let x = 0; x < ghostPiece.shape[y].length; x++) {
          if (ghostPiece.shape[y][x]) {
            const boardY = ghostPiece.position.y + y;
            const boardX = ghostPiece.position.x + x;

            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH &&
              displayBoard[boardY][boardX] === 0
            ) {
              displayBoard[boardY][boardX] = 3; // Ghost piece marker
            }
          }
        }
      }
    }

    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;

            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = 2; // Current piece marker
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`${y}-${x}`}
          className={`
            aspect-square border border-gray-300 dark:border-gray-600 transition-all duration-200
            ${cell === 0 ? "bg-gray-50 dark:bg-gray-800" : ""}
            ${cell === 1 ? "bg-gray-400 dark:bg-gray-500 shadow-inner" : ""}
            ${cell === 2 ? "shadow-glow animate-pulse" : ""}
            ${cell === 3 ? "bg-gray-200 dark:bg-gray-700 opacity-50" : ""}
            ${lineFlash.includes(y) ? "bg-white animate-pulse" : ""}
          `}
          style={{
            backgroundColor:
              cell === 2 && currentPiece
                ? currentPiece.color
                : cell === 3 && currentPiece
                  ? currentPiece.color
                  : undefined,
            opacity: cell === 3 ? 0.3 : undefined,
          }}
        />
      )),
    );
  };

  // Toggle pause
  const togglePause = () => {
    if (gameStatus === "playing") {
      setGameStatus("paused");
    } else if (gameStatus === "paused") {
      setGameStatus("playing");
      setLastDrop(Date.now());
    }
  };

  // Render next piece preview
  const renderNextPiece = () => {
    if (!nextPiece) return null;

    const previewGrid = Array(PREVIEW_SIZE)
      .fill(0)
      .map(() => Array(PREVIEW_SIZE).fill(0));

    const offsetX = Math.floor((PREVIEW_SIZE - nextPiece.shape[0].length) / 2);
    const offsetY = Math.floor((PREVIEW_SIZE - nextPiece.shape.length) / 2);

    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          const previewY = offsetY + y;
          const previewX = offsetX + x;
          if (
            previewY >= 0 &&
            previewY < PREVIEW_SIZE &&
            previewX >= 0 &&
            previewX < PREVIEW_SIZE
          ) {
            previewGrid[previewY][previewX] = 1;
          }
        }
      }
    }

    return previewGrid.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`preview-${y}-${x}`}
          className={`
            aspect-square border border-gray-200 dark:border-gray-700
            ${cell ? "shadow-sm" : "bg-gray-50 dark:bg-gray-800"}
          `}
          style={{
            backgroundColor: cell ? nextPiece.color : undefined,
          }}
        />
      )),
    );
  };

  if (!gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-bold mb-8 text-gray-800 dark:text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Enhanced Tetris
          </motion.h1>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={initializeGame}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform"
          >
            Start Game
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      {showConfetti && <SimpleConfetti />}

      <div className={`max-w-6xl mx-auto ${isMobile ? "px-2" : "px-4"}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Tetris
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button
              onClick={togglePause}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
            >
              {gameStatus === "playing" ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={initializeGame}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        {/* Combo Text */}
        <AnimatePresence>
          {comboText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="text-center mb-4"
            >
              <div className="text-2xl font-bold text-yellow-500 bg-black/20 rounded-lg px-4 py-2 inline-block">
                {comboText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}
        >
          {/* Game Board */}
          <div
            className={`${isMobile ? "order-2" : "col-span-2"} flex justify-center`}
          >
            <div className="relative">
              <div
                ref={boardRef}
                className={`
                  grid grid-cols-10 gap-0.5 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-transform duration-200
                  ${isMobile ? "max-w-sm" : "w-80"}
                  ${shakeBoard ? "animate-bounce" : ""}
                `}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                  gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
                }}
              >
                {renderBoard()}
              </div>

              {/* Game Over Overlay */}
              <AnimatePresence>
                {gameStatus === "gameOver" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg"
                  >
                    <div className="text-center text-white">
                      <motion.h2
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold mb-4"
                      >
                        Game Over!
                      </motion.h2>
                      <p className="mb-2">
                        Score: {stats.score.toLocaleString()}
                      </p>
                      <p className="mb-2">Lines: {stats.lines}</p>
                      <p className="mb-4">Max Combo: {stats.maxCombo}x</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={initializeGame}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all duration-200"
                      >
                        Play Again
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paused Overlay */}
              <AnimatePresence>
                {gameStatus === "paused" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg cursor-pointer"
                    onClick={togglePause}
                  >
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold mb-2">PAUSED</div>
                      <div className="text-sm opacity-75">Click to resume</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Side Panel */}
          <div className={`${isMobile ? "order-1" : ""} space-y-4`}>
            {/* Stats */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
            >
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <Target className="text-blue-500" size={20} />
                Statistics
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className="font-semibold text-blue-600">
                    {stats.score.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lines:</span>
                  <span className="font-semibold">{stats.lines}</span>
                </div>
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span className="font-semibold text-purple-600">
                    {stats.level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pieces:</span>
                  <span className="font-semibold">{stats.pieces}</span>
                </div>
                <div className="flex justify-between">
                  <span>Combo:</span>
                  <span className="font-semibold text-yellow-600">
                    {stats.combo}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Best Combo:</span>
                  <span className="font-semibold text-green-600">
                    {stats.maxCombo}x
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Next Piece */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
            >
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">
                Next Piece
              </h3>
              <div
                className="grid grid-cols-4 gap-0.5 mx-auto"
                style={{ width: "fit-content" }}
              >
                {renderNextPiece()}
              </div>
            </motion.div>

            {/* Power-ups */}
            {powerUps.length > 0 && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
              >
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Zap className="text-yellow-500" size={20} />
                  Power-ups
                </h3>
                <div className="space-y-2">
                  {powerUps.map((powerUp, index) => (
                    <motion.button
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const currentPowerUp = powerUps[index];
                        if (!currentPowerUp) return;

                        switch (currentPowerUp.type) {
                          case "clearLine":
                            setBoard((prev) => {
                              const newBoard = [...prev];
                              newBoard.pop();
                              newBoard.unshift(Array(BOARD_WIDTH).fill(0));
                              return newBoard;
                            });
                            setStats((prev) => ({
                              ...prev,
                              score: prev.score + 500,
                            }));
                            break;
                          case "slowDown":
                            const originalDropTime = dropTime;
                            setDropTime((prev) => prev * 2);
                            setTimeout(
                              () => setDropTime(originalDropTime),
                              10000,
                            );
                            break;
                          case "bonus":
                            setStats((prev) => ({
                              ...prev,
                              score: prev.score + 1000,
                            }));
                            break;
                        }

                        setPowerUps((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      className="w-full p-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {powerUp.type === "clearLine" && "🧹 Clear Line"}
                      {powerUp.type === "slowDown" && "⏰ Slow Time"}
                      {powerUp.type === "bonus" && "💰 Bonus Points"}
                      <div className="text-xs opacity-75">
                        {Math.ceil(powerUp.duration / 1000)}s
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Controls */}
            {!isMobile && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4"
              >
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">
                  Controls
                </h3>
                <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <div>← → Move horizontally</div>
                  <div>↑ Rotate piece</div>
                  <div>↓ Soft drop (+1 point)</div>
                  <div>Space Hard drop</div>
                  <div>P Pause game</div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                      Features:
                    </div>
                    <div>• Ghost piece preview</div>
                    <div>• Combo system</div>
                    <div>• Power-ups</div>
                    <div>• Wall kicks</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile Controls */}
        {isMobile && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent"
          >
            <div className="flex justify-between items-end max-w-sm mx-auto">
              {/* Left Controls */}
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    movePiece("left");
                  }}
                  className="w-16 h-16 bg-black/30 text-white rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl font-bold active:bg-black/50 transition-colors"
                >
                  ←
                </motion.button>
              </div>

              {/* Center Controls */}
              <div className="flex flex-col gap-2 items-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    rotatePieceHandler();
                  }}
                  className="w-14 h-14 bg-black/30 text-white rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl font-bold active:bg-black/50 transition-colors"
                >
                  ↻
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (movePiece("down")) {
                      setStats((prev) => ({ ...prev, score: prev.score + 1 }));
                    }
                  }}
                  className="w-14 h-14 bg-black/30 text-white rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl font-bold active:bg-black/50 transition-colors"
                >
                  ↓
                </motion.button>
              </div>

              {/* Right Controls */}
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    movePiece("right");
                  }}
                  className="w-16 h-16 bg-black/30 text-white rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl font-bold active:bg-black/50 transition-colors"
                >
                  →
                </motion.button>
              </div>
            </div>

            <div className="text-center mt-2 text-white/60 text-sm">
              Tap board to rotate • Swipe to move
            </div>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .shadow-glow {
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          40%,
          43% {
            transform: translate3d(0, -4px, 0);
          }
          70% {
            transform: translate3d(0, -2px, 0);
          }
          90% {
            transform: translate3d(0, -1px, 0);
          }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}
