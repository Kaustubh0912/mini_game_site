import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

// --- Utility: Determine the winner ---
function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// --- Utility: Unbeatable AI with Minimax ---
function findBestMove(board: (string | null)[]): number {
  let bestVal = -Infinity;
  let move = -1;

  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = "O";
      const moveVal = minimax(board, 0, false);
      board[i] = null;

      if (moveVal > bestVal) {
        bestVal = moveVal;
        move = i;
      }
    }
  }

  return move;
}

function minimax(
  board: (string | null)[],
  depth: number,
  isMax: boolean,
): number {
  const winner = calculateWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (board.every((cell) => cell !== null)) return 0;

  const scores: number[] = [];

  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax ? "O" : "X";
      scores.push(minimax(board, depth + 1, !isMax));
      board[i] = null;
    }
  }

  return isMax ? Math.max(...scores) : Math.min(...scores);
}

// --- Main Component ---
export default function TicTacToeGame() {
  const { data: session } = useSession();
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const nextStarterRef = useRef(true); // true = X starts, false = O (AI) starts

  const winner = calculateWinner(board);
  const isDraw = board.every((cell) => cell !== null) && !winner;

  // AI Turn Logic
  useEffect(() => {
    if (!winner && !xIsNext) {
      const timeout = setTimeout(() => {
        const move = findBestMove(board);
        if (move !== -1) handleMove(move);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [xIsNext, board, winner]);

  // Score Submission
  useEffect(() => {
    if (winner && session?.user?.id) {
      const submitScore = async () => {
        try {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              gameSlug: "tic-tac-toe",
              score: 100,
            }),
          });
          console.log("Score submitted");
        } catch (err) {
          console.error("Score submit error:", err);
        }
      };
      submitScore();
    }
  }, [winner, session]);

  const handleMove = (index: number) => {
    if (board[index] || winner) return;

    const updated = [...board];
    updated[index] = xIsNext ? "X" : "O";
    setBoard(updated);
    setXIsNext(!xIsNext);
  };

  const handlePlayerClick = (index: number) => {
    if (xIsNext && !board[index] && !winner) {
      handleMove(index);
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    nextStarterRef.current = !nextStarterRef.current;
    setXIsNext(nextStarterRef.current);
  };

  const status = winner
    ? `Winner: ${winner}!`
    : isDraw
      ? "It's a draw!"
      : xIsNext
        ? "Your turn: X"
        : "AI is thinking...";

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-gray-900 dark:text-white tracking-wide">
        🎯 Tic-Tac-Toe
      </h2>

      <div className="mb-4 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-semibold shadow-sm backdrop-blur-sm text-center text-base sm:text-lg">
        {status}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {board.map((val, i) => (
          <button
            key={i}
            onClick={() => handlePlayerClick(i)}
            disabled={!!winner || !xIsNext}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 text-3xl sm:text-4xl font-extrabold rounded-xl flex items-center justify-center text-gray-800 dark:text-gray-100 shadow-inner transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {val}
          </button>
        ))}
      </div>

      <button
        onClick={handleRestart}
        className="mt-4 sm:mt-6 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-full shadow-lg transition-all duration-200"
      >
        🔁 Restart Game
      </button>
    </div>
  );
}
