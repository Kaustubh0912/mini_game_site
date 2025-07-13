import { useState, useEffect } from "react";

// --- Types ---
type Player = "X" | "O";
type BoardState = (Player | null)[];
type GameMode = "easy" | "hard" | "multiplayer";
type BoardSize = 3 | 4 | 5;

// --- Utility: Determine the winner ---
function calculateWinner(squares: BoardState, boardSize: BoardSize) {
  const winningLines = generateWinningLines(boardSize);

  for (const line of winningLines) {
    const firstSquare = squares[line[0]];
    if (!firstSquare) continue;

    if (line.every((index) => squares[index] === firstSquare)) {
      return { winner: firstSquare, line };
    }
  }
  return null;
}

// Generate all possible winning lines for a given board size
function generateWinningLines(size: BoardSize) {
  const lines: number[][] = [];

  // Rows
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(i * size + j);
    }
    lines.push(row);
  }

  // Columns
  for (let i = 0; i < size; i++) {
    const col: number[] = [];
    for (let j = 0; j < size; j++) {
      col.push(j * size + i);
    }
    lines.push(col);
  }

  // Diagonals
  const diag1: number[] = [];
  const diag2: number[] = [];
  for (let i = 0; i < size; i++) {
    diag1.push(i * size + i);
    diag2.push(i * size + (size - 1 - i));
  }
  lines.push(diag1);
  lines.push(diag2);

  return lines;
}

// --- Utility: Find best move (Minimax algorithm) ---
function findBestMove(
  board: BoardState,
  boardSize: BoardSize,
  difficulty: GameMode
): number {
  // For easy mode, make smarter moves with some randomness
  if (difficulty === "easy") {
    // Try to win if possible (70% chance)
    if (Math.random() < 0.7) {
      const winningMove = findWinningMove(board, boardSize, "O");
      if (winningMove !== -1) return winningMove;
    }

    // Try to block opponent from winning (60% chance)
    if (Math.random() < 0.6) {
      const blockingMove = findWinningMove(board, boardSize, "X");
      if (blockingMove !== -1) return blockingMove;
    }

    // Otherwise choose a random move
    const availableMoves = board
      .map((square, idx) => (square === null ? idx : -1))
      .filter((idx) => idx !== -1);

    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // For board sizes > 3, use a limited depth minimax to prevent slowdowns
  const maxDepth = boardSize <= 3 ? Infinity : 4;

  // For hard mode, use minimax algorithm
  return minimaxMove(board, boardSize, maxDepth);
}

// Find a winning move for the given player
function findWinningMove(
  board: BoardState,
  boardSize: BoardSize,
  player: Player
): number {
  const winningLines = generateWinningLines(boardSize);

  for (const line of winningLines) {
    const playerSquares = line.filter((index) => board[index] === player);
    const emptySquares = line.filter((index) => board[index] === null);

    if (playerSquares.length === boardSize - 1 && emptySquares.length === 1) {
      return emptySquares[0];
    }
  }

  return -1;
}

// More optimized minimax for larger boards
function minimaxMove(
  board: BoardState,
  boardSize: BoardSize,
  maxDepth: number
): number {
  let bestVal = -Infinity;
  let bestMove = -1;

  // First check if we can win in one move
  const winningMove = findWinningMove(board, boardSize, "O");
  if (winningMove !== -1) return winningMove;

  // Then check if we need to block opponent
  const blockingMove = findWinningMove(board, boardSize, "X");
  if (blockingMove !== -1) return blockingMove;

  // Check for center (on empty board)
  const center = Math.floor((boardSize * boardSize) / 2);
  if (
    board.every((cell) => cell === null) ||
    (board[center] === null && Math.random() < 0.8)
  ) {
    return center;
  }

  // Regular minimax with alpha-beta pruning
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) {
      board[i] = "O";
      const moveVal = minimax(
        board,
        boardSize,
        0,
        maxDepth,
        false,
        -Infinity,
        Infinity
      );
      board[i] = null;

      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

// Optimized minimax with alpha-beta pruning and depth limiting
function minimax(
  board: BoardState,
  boardSize: BoardSize,
  depth: number,
  maxDepth: number,
  isMax: boolean,
  alpha: number,
  beta: number
): number {
  // Check terminal states
  const result = calculateWinner(board, boardSize);

  if (result && result.winner === "O") return 100 - depth;
  if (result && result.winner === "X") return depth - 100;
  if (board.every((cell) => cell !== null) || depth >= maxDepth) return 0;

  if (isMax) {
    let maxEval = -Infinity;

    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = "O";
        const evalResult = minimax(
          board,
          boardSize,
          depth + 1,
          maxDepth,
          false,
          alpha,
          beta
        );
        board[i] = null;

        maxEval = Math.max(maxEval, evalResult);
        alpha = Math.max(alpha, evalResult);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }

    return maxEval;
  } else {
    let minEval = Infinity;

    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = "X";
        const evalResult = minimax(
          board,
          boardSize,
          depth + 1,
          maxDepth,
          true,
          alpha,
          beta
        );
        board[i] = null;

        minEval = Math.min(minEval, evalResult);
        beta = Math.min(beta, evalResult);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }

    return minEval;
  }
}

// --- Main Component ---
export default function TicTacToeGame() {
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [board, setBoard] = useState<BoardState>(
    Array(boardSize * boardSize).fill(null)
  );
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>("easy");
  const [gameStarted, setGameStarted] = useState(false);
  const [statistics, setStatistics] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    total: 0,
  });
  const [lastWinner, setLastWinner] = useState<Player | "draw" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameHistory, setGameHistory] = useState<
    {
      result: "win" | "loss" | "draw";
      date: string;
      boardSize: BoardSize;
      mode: GameMode;
    }[]
  >([]);
  const [windowWidth, setWindowWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Reset board when size changes
  useEffect(() => {
    setBoard(Array(boardSize * boardSize).fill(null));
  }, [boardSize]);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 640);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const winResult = calculateWinner(board, boardSize);
  const winner = winResult?.winner;
  const winLine = winResult?.line || [];
  const isDraw = !winner && board.every((cell) => cell !== null);

  // Load statistics from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem("tictactoe-stats");
    const savedHistory = localStorage.getItem("tictactoe-history");

    if (savedStats) {
      setStatistics(JSON.parse(savedStats));
    }

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Validate and filter to ensure correct types
        const validHistory = Array.isArray(parsed)
          ? parsed.filter(
              (game) =>
                (game.result === "win" ||
                  game.result === "loss" ||
                  game.result === "draw") &&
                typeof game.date === "string" &&
                (game.boardSize === 3 ||
                  game.boardSize === 4 ||
                  game.boardSize === 5) &&
                (game.mode === "easy" ||
                  game.mode === "hard" ||
                  game.mode === "multiplayer")
            )
          : [];
        setGameHistory(
          validHistory.map((game) => ({
            result: game.result as "win" | "loss" | "draw",
            date: game.date,
            boardSize: game.boardSize as BoardSize,
            mode: game.mode as GameMode,
          }))
        );
      } catch {
        setGameHistory([]);
      }
    }
  }, []);

  // Update statistics when game ends
  useEffect(() => {
    if (!gameStarted) return;

    if ((winner === "X" || winner === "O" || isDraw) && !lastWinner) {
      if (gameMode !== "multiplayer") {
        // Only track stats for games against AI
        if (winner === "X") {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);

          setStatistics((prev) => {
            const updated = {
              ...prev,
              wins: prev.wins + 1,
              total: prev.total + 1,
            };
            localStorage.setItem("tictactoe-stats", JSON.stringify(updated));
            return updated;
          });

          setGameHistory((prev) => {
            const updated = [
              ...prev,
              {
                result: "win" as "win",
                date: new Date().toISOString(),
                boardSize: boardSize as BoardSize,
                mode: gameMode as GameMode,
              },
            ];
            localStorage.setItem(
              "tictactoe-history",
              JSON.stringify(updated.slice(-10))
            );
            return updated.slice(-10); // Keep only last 10 games
          });
        } else if (winner === "O") {
          setStatistics((prev) => {
            const updated = {
              ...prev,
              losses: prev.losses + 1,
              total: prev.total + 1,
            };
            localStorage.setItem("tictactoe-stats", JSON.stringify(updated));
            return updated;
          });

          setGameHistory((prev) => {
            const updated = [
              ...prev,
              {
                result: "loss" as "loss",
                date: new Date().toISOString(),
                boardSize: boardSize as BoardSize,
                mode: gameMode as GameMode,
              },
            ];
            localStorage.setItem(
              "tictactoe-history",
              JSON.stringify(updated.slice(-10))
            );
            return updated.slice(-10);
          });
        } else if (isDraw) {
          setStatistics((prev) => {
            const updated = {
              ...prev,
              draws: prev.draws + 1,
              total: prev.total + 1,
            };
            localStorage.setItem("tictactoe-stats", JSON.stringify(updated));
            return updated;
          });

          setGameHistory((prev) => {
            const updated = [
              ...prev,
              {
                result: "draw" as "draw",
                date: new Date().toISOString(),
                boardSize: boardSize as BoardSize,
                mode: gameMode as GameMode,
              },
            ];
            localStorage.setItem(
              "tictactoe-history",
              JSON.stringify(updated.slice(-10))
            );
            return updated.slice(-10);
          });
        }
      }
      setLastWinner(winner || "draw");
    }
  }, [winner, isDraw, gameStarted, lastWinner, boardSize, gameMode]);

  // AI move
  useEffect(() => {
    if (
      !gameStarted ||
      winner ||
      isDraw ||
      xIsNext ||
      gameMode === "multiplayer"
    )
      return;

    const timer = setTimeout(() => {
      const move = findBestMove(board, boardSize, gameMode);
      if (move !== -1) {
        const boardCopy = [...board];
        boardCopy[move] = "O";
        setBoard(boardCopy);
        setXIsNext(true);
      }
    }, 600); // Slight delay for better UX

    return () => clearTimeout(timer);
  }, [xIsNext, board, winner, isDraw, gameMode, gameStarted, boardSize]);

  const handleClick = (index: number) => {
    if (!gameStarted || board[index] || winner || isDraw) return;

    // In multiplayer, always allow clicks. In AI mode, only when it's player's turn
    if (gameMode !== "multiplayer" && !xIsNext) return;

    const boardCopy = [...board];
    boardCopy[index] = xIsNext ? "X" : "O";
    setBoard(boardCopy);
    setXIsNext(!xIsNext);
  };

  const startGame = () => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setXIsNext(true);
    setLastWinner(null);
    setGameStarted(true);
  };

  const restartGame = () => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setXIsNext(true);
    setLastWinner(null);
  };

  // Helper function to get appropriate cell size based on screen size and board size
  const getCellSize = () => {
    // Very small mobile screens (< 360px)
    if (windowWidth < 360) {
      return boardSize === 3
        ? "w-14 h-14"
        : boardSize === 4
        ? "w-10 h-10"
        : "w-8 h-8";
    }
    // Small mobile screens (< 480px)
    else if (windowWidth < 480) {
      return boardSize === 3
        ? "w-16 h-16"
        : boardSize === 4
        ? "w-12 h-12"
        : "w-10 h-10";
    }
    // Medium screens (tablets)
    else if (windowWidth < 640) {
      return boardSize === 3
        ? "w-20 h-20"
        : boardSize === 4
        ? "w-14 h-14"
        : "w-12 h-12";
    }
    // Default sizes for larger screens
    else {
      return boardSize === 3
        ? "w-20 h-20 sm:w-24 sm:h-24"
        : boardSize === 4
        ? "w-16 h-16 sm:w-18 sm:h-18"
        : "w-12 h-12 sm:w-14 sm:h-14";
    }
  };

  // Helper function to get appropriate font size based on screen size and board size
  const getFontSize = () => {
    // Very small mobile screens
    if (windowWidth < 360) {
      return boardSize === 3
        ? "text-xl"
        : boardSize === 4
        ? "text-lg"
        : "text-base";
    }
    // Small mobile screens
    else if (windowWidth < 480) {
      return boardSize === 3
        ? "text-2xl"
        : boardSize === 4
        ? "text-xl"
        : "text-lg";
    }
    // Default sizes for larger screens
    else {
      return boardSize === 3
        ? "text-3xl sm:text-4xl"
        : boardSize === 4
        ? "text-2xl sm:text-3xl"
        : "text-xl sm:text-2xl";
    }
  };

  // Utility function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Game status text
  const gameStatus = winner
    ? `Winner: ${
        winner === "X"
          ? gameMode === "multiplayer"
            ? "Player 1 (X)"
            : "You!"
          : gameMode === "multiplayer"
          ? "Player 2 (O)"
          : "AI"
      }`
    : isDraw
    ? "It's a draw!"
    : gameMode === "multiplayer"
    ? `${xIsNext ? "Player 1 (X)" : "Player 2 (O)"}'s turn`
    : xIsNext
    ? "Your turn (X)"
    : "AI thinking... (O)";

  // Confetti component for wins
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(100)].map((_, i) => {
        const size = Math.random() * 10 + 5;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const delay = Math.random() * 0.5;
        const color = ["#FF5252", "#FFD740", "#64FFDA", "#448AFF", "#B388FF"][
          Math.floor(Math.random() * 5)
        ];

        return (
          <div
            key={i}
            className="absolute top-0"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: "50%",
              animation: `confetti ${animationDuration}s ease-out ${delay}s forwards`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-3 sm:p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-700 max-w-md mx-auto">
      {showConfetti && <Confetti />}

      <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-slate-800 dark:text-slate-100">
        🎮 Tic-Tac-Toe
      </h2>

      {/* Game Controls */}
      {!gameStarted ? (
        <div className="w-full mb-4">
          <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-md mb-4 border border-slate-200 dark:border-slate-600">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
              Game Options
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Board Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([3, 4, 5] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setBoardSize(size)}
                    className={`py-2 px-1 rounded-md transition-all ${
                      boardSize === size
                        ? "bg-blue-500 dark:bg-blue-600 text-white font-medium"
                        : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Game Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "hard", "multiplayer"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`py-2 rounded-md transition-all ${
                      gameMode === mode
                        ? "bg-blue-500 dark:bg-blue-600 text-white font-medium"
                        : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
                    }`}
                  >
                    {mode === "multiplayer"
                      ? isMobile
                        ? "2P"
                        : "2 Players"
                      : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={startGame}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold rounded-md transition shadow-md"
              >
                Start Game
              </button>
            </div>

            {gameMode !== "multiplayer" && statistics.total > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Your Stats vs AI
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Wins
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {statistics.wins}
                    </p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Draws
                    </p>
                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {statistics.draws}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Losses
                    </p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {statistics.losses}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-center mt-2 text-slate-600 dark:text-slate-400">
                  Win rate:{" "}
                  {statistics.total
                    ? Math.round((statistics.wins / statistics.total) * 100)
                    : 0}
                  %
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 font-semibold shadow-md flex items-center space-x-2 border border-slate-200 dark:border-slate-600">
          <span
            className={`w-3 h-3 rounded-full ${
              winner
                ? winner === "X"
                  ? "bg-green-500"
                  : "bg-red-500"
                : isDraw
                ? "bg-yellow-500"
                : xIsNext
                ? "bg-blue-500 animate-pulse"
                : "bg-purple-500 animate-pulse"
            }`}
          ></span>
          <span className="text-sm sm:text-base">{gameStatus}</span>
        </div>
      )}

      {/* Game Board */}
      <div
        className={`grid gap-1 sm:gap-2 mb-4 sm:mb-6 ${
          !gameStarted && "opacity-80 pointer-events-none"
        }`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
        }}
      >
        {board.map((value, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className={`${getCellSize()} rounded-lg flex items-center justify-center ${getFontSize()} font-extrabold shadow-md transition-all
              ${value ? "text-slate-800 dark:text-white" : "text-transparent"}
              ${
                winLine.includes(index)
                  ? "bg-blue-200 dark:bg-blue-700 border-2 border-blue-300 dark:border-blue-500"
                  : "bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
              }
              ${
                gameMode !== "multiplayer" &&
                !xIsNext &&
                !value &&
                !winner &&
                !isDraw
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }
            `}
            disabled={
              (gameMode !== "multiplayer" && !xIsNext) ||
              !!winner ||
              isDraw ||
              !!value
            }
          >
            <span
              className={`transform transition-all ${
                value ? "scale-100" : "scale-0"
              } ${
                value === "X"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {value}
            </span>
          </button>
        ))}
      </div>

      {/* Game Controls & Info */}
      {gameStarted && (
        <div className="w-full flex flex-col gap-3 sm:gap-4">
          <div className="flex justify-between">
            <button
              onClick={restartGame}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-lg shadow-md transition border border-slate-300 dark:border-slate-500 text-sm sm:text-base"
            >
              🔄 New Game
            </button>

            <button
              onClick={() => setGameStarted(false)}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-lg shadow-md transition border border-blue-200 dark:border-blue-800 text-sm sm:text-base"
            >
              ⚙️ Settings
            </button>
          </div>

          {lastWinner && (
            <div
              className={`p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm border ${
                lastWinner === "X"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  : lastWinner === "O"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
              }`}
            >
              {lastWinner === "X"
                ? gameMode === "multiplayer"
                  ? "🏆 Player 1 won the last game!"
                  : "🏆 You won the last game!"
                : lastWinner === "O"
                ? gameMode === "multiplayer"
                  ? "🏆 Player 2 won the last game!"
                  : "😢 AI won the last game"
                : "🤝 The last game ended in a draw"}
            </div>
          )}

          {gameMode !== "multiplayer" &&
            gameHistory.length > 0 &&
            !isMobile && (
              <div className="mt-1">
                <details className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                  <summary className="p-2 sm:p-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                    Game History vs AI ({gameHistory.length})
                  </summary>
                  <div className="p-2 sm:p-3 pt-0 max-h-36 sm:max-h-40 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-1 sm:py-2">Result</th>
                          <th className="py-1 sm:py-2">Size</th>
                          <th className="py-1 sm:py-2">Mode</th>
                          <th className="py-1 sm:py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameHistory.map((game, i) => (
                          <tr
                            key={i}
                            className="border-t border-slate-200 dark:border-slate-600"
                          >
                            <td className="py-1">
                              <span
                                className={
                                  game.result === "win"
                                    ? "text-green-600 dark:text-green-400"
                                    : game.result === "loss"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-yellow-600 dark:text-yellow-400"
                                }
                              >
                                {game.result === "win"
                                  ? "Victory"
                                  : game.result === "loss"
                                  ? "Defeat"
                                  : "Draw"}
                              </span>
                            </td>
                            <td className="py-1 text-slate-600 dark:text-slate-300">
                              {game.boardSize}×{game.boardSize}
                            </td>
                            <td className="py-1 text-slate-600 dark:text-slate-300 capitalize">
                              {game.mode}
                            </td>
                            <td className="py-1 text-slate-600 dark:text-slate-300">
                              {formatDate(game.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            )}

          {/* For mobile devices, show a simplified history */}
          {gameMode !== "multiplayer" && gameHistory.length > 0 && isMobile && (
            <div className="mt-1">
              <details className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <summary className="p-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                  Recent Games ({gameHistory.length})
                </summary>
                <div className="p-2 pt-0 max-h-36 overflow-y-auto">
                  {gameHistory.slice(0, 5).map((game, i) => (
                    <div
                      key={i}
                      className="text-xs border-t border-slate-200 dark:border-slate-600 py-1 flex justify-between"
                    >
                      <span
                        className={
                          game.result === "win"
                            ? "text-green-600 dark:text-green-400"
                            : game.result === "loss"
                            ? "text-red-600 dark:text-red-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }
                      >
                        {game.result === "win"
                          ? "Win"
                          : game.result === "loss"
                          ? "Loss"
                          : "Draw"}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {game.boardSize}×{game.boardSize}{" "}
                        {game.mode.substring(0, 1).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Multiplayer Instructions */}
          {gameMode === "multiplayer" && (
            <div className="mt-1 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Multiplayer Mode</p>
              <p>Take turns with a friend on the same device!</p>
              <p className="mt-1">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  Player 1: X
                </span>{" "}
                •
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {" "}
                  Player 2: O
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
