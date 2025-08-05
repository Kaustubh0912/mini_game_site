"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

// Types
interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
  row: number;
  col: number;
}

type Difficulty = "beginner" | "intermediate" | "expert" | "custom";
type GameStatus = "playing" | "won" | "lost";

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

// Desktop configurations
const DESKTOP_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
  custom: { rows: 16, cols: 16, mines: 40 }, // Default for custom
};

// Mobile-optimized configurations (beginner only)
const MOBILE_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 8, cols: 8, mines: 8 },
  intermediate: { rows: 8, cols: 8, mines: 8 }, // Same as beginner
  expert: { rows: 8, cols: 8, mines: 8 }, // Same as beginner
  custom: { rows: 8, cols: 8, mines: 8 }, // Same as beginner
};

// Utility functions
const createEmptyBoard = (rows: number, cols: number): Cell[][] => {
  return Array(rows)
    .fill(null)
    .map((_, row) =>
      Array(cols)
        .fill(null)
        .map((_, col) => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborCount: 0,
          row,
          col,
        })),
    );
};

const placeMines = (
  board: Cell[][],
  mineCount: number,
  firstClickRow: number,
  firstClickCol: number,
): Cell[][] => {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let minesPlaced = 0;

  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    // Don't place mine on first click or if already has mine
    if (
      !newBoard[row][col].isMine &&
      !(row === firstClickRow && col === firstClickCol)
    ) {
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor counts
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].neighborCount = countNeighborMines(
          newBoard,
          row,
          col,
        );
      }
    }
  }

  return newBoard;
};

const countNeighborMines = (
  board: Cell[][],
  row: number,
  col: number,
): number => {
  let count = 0;
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (
      newRow >= 0 &&
      newRow < board.length &&
      newCol >= 0 &&
      newCol < board[0].length
    ) {
      if (board[newRow][newCol].isMine) {
        count++;
      }
    }
  }

  return count;
};

const revealCell = (board: Cell[][], row: number, col: number): Cell[][] => {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const queue: [number, number][] = [[row, col]];
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  while (queue.length > 0) {
    const [currentRow, currentCol] = queue.shift()!;
    const cell = newBoard[currentRow][currentCol];

    if (cell.isRevealed || cell.isFlagged) {
      continue;
    }

    cell.isRevealed = true;

    // If cell has no neighboring mines, add all neighbors to queue
    if (cell.neighborCount === 0 && !cell.isMine) {
      for (const [dRow, dCol] of directions) {
        const newRow = currentRow + dRow;
        const newCol = currentCol + dCol;

        if (
          newRow >= 0 &&
          newRow < newBoard.length &&
          newCol >= 0 &&
          newCol < newBoard[0].length
        ) {
          const neighborCell = newBoard[newRow][newCol];
          if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
            queue.push([newRow, newCol]);
          }
        }
      }
    }
  }

  return newBoard;
};

const revealAllMines = (board: Cell[][]): Cell[][] => {
  return board.map((row) =>
    row.map((cell) => ({
      ...cell,
      isRevealed: cell.isMine ? true : cell.isRevealed,
    })),
  );
};

export default function MinesweeperGame() {
  const { data: session } = useSession();

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [customConfig, setCustomConfig] = useState<DifficultyConfig>(
    DESKTOP_CONFIGS.custom,
  );
  const [tempSize, setTempSize] = useState("16");
  const [tempMines, setTempMines] = useState("40");
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [gameStarted, setGameStarted] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const configs = isMobile ? MOBILE_CONFIGS : DESKTOP_CONFIGS;
  const config =
    difficulty === "custom" && !isMobile ? customConfig : configs[difficulty];
  const remainingFlags = Math.max(0, config.mines - flagCount);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && gameStatus === "playing" && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameStatus, startTime]);

  // Initialize board
  const initializeBoard = useCallback(() => {
    const newBoard = createEmptyBoard(config.rows, config.cols);
    setBoard(newBoard);
    setGameStatus("playing");
    setGameStarted(false);
    setFlagCount(0);
    setStartTime(null);
    setElapsedTime(0);
    setFlagMode(false);
    setScoreSubmitted(false);
  }, [config.rows, config.cols]);

  // Initialize board when difficulty changes
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // Check win condition
  useEffect(() => {
    if (board.length === 0 || !gameStarted) return;

    const totalCells = config.rows * config.cols;
    const revealedCells = board.flat().filter((cell) => cell.isRevealed).length;

    if (revealedCells === totalCells - config.mines) {
      setGameStatus("won");
    }
  }, [board, config.rows, config.cols, config.mines, gameStarted]);

  // Calculate score based on difficulty, time, and performance
  const calculateScore = useCallback(() => {
    if (gameStatus !== "won") return 0;

    const difficultyMultiplier = {
      beginner: 1,
      intermediate: 2,
      expert: 3,
      custom: Math.max(1, Math.floor((config.rows * config.cols) / 100)),
    };

    const baseScore = 1000 * difficultyMultiplier[difficulty];
    const timeBonus = Math.max(0, 500 - elapsedTime); // Bonus for fast completion
    const totalScore = baseScore + timeBonus;

    return Math.max(100, totalScore); // Minimum score of 100
  }, [gameStatus, difficulty, config.rows, config.cols, elapsedTime]);

  // Submit score when game is won
  useEffect(() => {
    if (
      gameStatus === "won" &&
      !scoreSubmitted &&
      session?.user?.id &&
      gameStarted &&
      elapsedTime > 0
    ) {
      const score = calculateScore();

      // Prevent multiple submissions
      setScoreSubmitted(true);

      fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          gameSlug: "minesweeper",
          score,
          gameMode: difficulty,
          timestamp: new Date().toISOString(),
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          console.log("Score submitted successfully");
        })
        .catch((e) => {
          console.error("Score submit failed:", e);
          // Reset scoreSubmitted on error so user can try again
          setScoreSubmitted(false);
        });
    }
  }, [gameStatus, scoreSubmitted, session?.user?.id, gameStarted, elapsedTime]);

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== "playing") return;

    const cell = board[row][col];

    // On mobile in flag mode, toggle flag
    if (isMobile && flagMode) {
      handleCellRightClick({} as React.MouseEvent<HTMLButtonElement>, row, col);
      return;
    }

    if (cell.isRevealed || cell.isFlagged) return;

    // First click - place mines
    if (!gameStarted) {
      const newBoard = placeMines(board, config.mines, row, col);
      setBoard(newBoard);
      setGameStarted(true);
      setStartTime(Date.now());

      // Reveal the clicked cell
      const revealedBoard = revealCell(newBoard, row, col);
      setBoard(revealedBoard);
    } else {
      if (cell.isMine) {
        setGameStatus("lost");
        setBoard(revealAllMines(board));
      } else {
        const newBoard = revealCell(board, row, col);
        setBoard(newBoard);
      }
    }
  };

  const handleCellRightClick = (
    e: React.MouseEvent,
    row: number,
    col: number,
  ) => {
    e.preventDefault();
    if (gameStatus !== "playing") return;

    const cell = board[row][col];
    if (cell.isRevealed) return;

    const newBoard = board.map((boardRow) =>
      boardRow.map((boardCell) => {
        if (boardCell.row === row && boardCell.col === col) {
          const newFlagged = !boardCell.isFlagged;
          setFlagCount((prev) => (newFlagged ? prev + 1 : prev - 1));
          return { ...boardCell, isFlagged: newFlagged };
        }
        return boardCell;
      }),
    );

    setBoard(newBoard);
  };

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return "🚩";
    if (!cell.isRevealed) return "";
    if (cell.isMine) return "💣";
    if (cell.neighborCount === 0) return "";
    return cell.neighborCount.toString();
  };

  const getCellClassName = (cell: Cell) => {
    const baseSize = isMobile ? "w-8 h-8 text-xs" : "w-8 h-8 text-sm";
    let className = `${baseSize} border border-gray-400 flex items-center justify-center font-bold transition-all cursor-pointer select-none touch-manipulation `;

    if (cell.isRevealed) {
      if (cell.isMine) {
        className += "bg-red-500 text-white ";
      } else {
        className += "bg-gray-200 dark:bg-gray-600 ";
        // Color based on number
        const colors = [
          "",
          "text-blue-600",
          "text-green-600",
          "text-red-600",
          "text-purple-600",
          "text-yellow-600",
          "text-pink-600",
          "text-black",
          "text-gray-600",
        ];
        className += colors[cell.neighborCount] || "";
      }
    } else {
      className +=
        "bg-gray-500 dark:bg-gray-700 hover:bg-gray-250 dark:hover:bg-gray-650 active:bg-gray-400 ";
    }

    return className;
  };

  const resetGame = () => {
    initializeBoard();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 space-y-4 sm:space-y-6 min-h-screen overflow-hidden">
      {/* Game Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Minesweeper</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Clear the field without hitting any mines!
        </p>
      </div>

      {/* Game Controls */}
      {isMobile ? (
        // Mobile Layout - Simple and compact
        <div className="flex flex-col gap-3 items-center w-full max-w-sm">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="bg-black text-green-400 px-2 py-1 font-mono text-sm min-w-[50px] text-center">
              {remainingFlags.toString().padStart(3, "0")}
            </div>

            <button
              onClick={resetGame}
              className="text-xl p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors touch-manipulation"
            >
              {gameStatus === "won"
                ? "😎"
                : gameStatus === "lost"
                  ? "😵"
                  : "🙂"}
            </button>

            <div className="bg-black text-green-400 px-2 py-1 font-mono text-sm min-w-[50px] text-center">
              {formatTime(elapsedTime)}
            </div>
          </div>

          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`w-full px-3 py-2 rounded font-medium transition-colors touch-manipulation text-sm ${
              flagMode
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white"
            }`}
          >
            🚩 {flagMode ? "Flag ON" : "Flag OFF"}
          </button>
        </div>
      ) : (
        // Desktop Layout - More spacious
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-4">
            <div className="bg-black text-green-400 px-3 py-1 font-mono text-lg min-w-[60px] text-center">
              {remainingFlags.toString().padStart(3, "0")}
            </div>

            <button
              onClick={resetGame}
              className="text-2xl p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {gameStatus === "won"
                ? "😎"
                : gameStatus === "lost"
                  ? "😵"
                  : "🙂"}
            </button>

            <div className="bg-black text-green-400 px-3 py-1 font-mono text-lg min-w-[60px] text-center">
              {formatTime(elapsedTime)}
            </div>
          </div>

          <button
            onClick={() => {
              // Initialize temp values when opening settings
              if (!showSettings) {
                setTempSize(customConfig.rows.toString());
                setTempMines(customConfig.mines.toString());
              }
              setShowSettings(!showSettings);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Settings
          </button>
        </div>
      )}

      {/* Settings Panel - Desktop Only */}
      <AnimatePresence>
        {showSettings && !isMobile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Difficulty Settings</h3>
            <div className="space-y-2">
              {Object.entries(DESKTOP_CONFIGS)
                .filter(([key]) => key !== "custom")
                .map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setDifficulty(key as Difficulty);
                      setShowSettings(false);
                    }}
                    className={`w-full text-left p-2 rounded transition-colors ${
                      difficulty === key
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="font-medium capitalize">{key}</div>
                    <div className="text-sm opacity-75">
                      {config.rows}×{config.cols} - {config.mines} mines
                    </div>
                  </button>
                ))}

              {/* Custom Settings */}
              <div
                className={`p-2 rounded border-2 ${
                  difficulty === "custom"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              >
                <div className="font-medium mb-3">Custom</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Board Size (Square)
                    </label>
                    <input
                      type="text"
                      value={tempSize}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or valid numbers
                        if (value === "" || /^\d+$/.test(value)) {
                          setTempSize(value);
                        }
                      }}
                      onBlur={() => {
                        // Apply validation when user finishes editing
                        const size =
                          tempSize === ""
                            ? 5
                            : Math.min(30, Math.max(5, parseInt(tempSize)));
                        const validSize = size.toString();
                        setTempSize(validSize);
                        setCustomConfig((prev) => ({
                          ...prev,
                          rows: size,
                          cols: size,
                          mines: Math.min(
                            prev.mines,
                            Math.floor(size * size * 0.8),
                          ),
                        }));
                        // Update temp mines if current value is too high
                        const maxMines = Math.floor(size * size * 0.8);
                        if (parseInt(tempMines) > maxMines) {
                          setTempMines(maxMines.toString());
                        }
                      }}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Board size (5-30)"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      5-30 (creates square board)
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Mines (max:{" "}
                      {Math.floor(customConfig.rows * customConfig.cols * 0.8)})
                    </label>
                    <input
                      type="text"
                      value={tempMines}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or valid numbers
                        if (value === "" || /^\d+$/.test(value)) {
                          setTempMines(value);
                        }
                      }}
                      onBlur={() => {
                        // Apply validation when user finishes editing
                        const maxMines = Math.floor(
                          customConfig.rows * customConfig.cols * 0.8,
                        );
                        const mines =
                          tempMines === ""
                            ? 1
                            : Math.min(
                                maxMines,
                                Math.max(1, parseInt(tempMines)),
                              );
                        const validMines = mines.toString();
                        setTempMines(validMines);
                        setCustomConfig((prev) => ({ ...prev, mines }));
                      }}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Number of mines"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Max:{" "}
                      {Math.floor(customConfig.rows * customConfig.cols * 0.8)}{" "}
                      (80% of board)
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Final validation before applying
                      const size = Math.min(
                        30,
                        Math.max(5, parseInt(tempSize) || 16),
                      );
                      const maxMines = Math.floor(size * size * 0.8);
                      const mines = Math.min(
                        maxMines,
                        Math.max(1, parseInt(tempMines) || 1),
                      );

                      setCustomConfig({
                        rows: size,
                        cols: size,
                        mines: mines,
                      });
                      setTempSize(size.toString());
                      setTempMines(mines.toString());
                      setDifficulty("custom");
                      setShowSettings(false);
                    }}
                    className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Apply Custom Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Status */}
      <AnimatePresence>
        {gameStatus !== "playing" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`text-center p-4 rounded-lg max-w-sm w-full ${
              gameStatus === "won"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
          >
            <div className="text-xl sm:text-2xl font-bold">
              {gameStatus === "won" ? "🎉 Congratulations!" : "💥 Game Over!"}
            </div>
            <div className="text-sm sm:text-lg">
              {gameStatus === "won" ? (
                <>
                  <div>You cleared the field in {formatTime(elapsedTime)}!</div>
                  {session?.user?.id && (
                    <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                      Score: {calculateScore().toLocaleString()} points{" "}
                      {scoreSubmitted ? "✓ Submitted" : ""}
                    </div>
                  )}
                </>
              ) : (
                "You hit a mine! Try again."
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gray-400 p-1 sm:p-2 rounded ${isMobile ? "overflow-auto" : "inline-block"}`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gap: "1px",
          ...(isMobile ? { maxWidth: "95vw" } : {}),
        }}
      >
        {board.flat().map((cell) => (
          <button
            key={`${cell.row}-${cell.col}`}
            className={getCellClassName(cell)}
            onClick={() => handleCellClick(cell.row, cell.col)}
            onContextMenu={(e) => handleCellRightClick(e, cell.row, cell.col)}
            disabled={gameStatus !== "playing"}
          >
            {getCellContent(cell)}
          </button>
        ))}
      </motion.div>

      {/* Instructions */}
      <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md px-4">
        {isMobile ? (
          <>
            <p>
              <strong>Tap</strong> to reveal a cell
            </p>
            <p>
              <strong>Use Flag Mode</strong> to flag/unflag potential mines
            </p>
            <p>Numbers show how many mines are adjacent to that cell</p>
          </>
        ) : (
          <>
            <p>
              <strong>Left click</strong> to reveal a cell
            </p>
            <p>
              <strong>Right click</strong> to flag/unflag a potential mine
            </p>
            <p>Numbers show how many mines are adjacent to that cell</p>
          </>
        )}
      </div>
    </div>
  );
}
