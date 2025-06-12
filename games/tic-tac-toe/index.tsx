// games/tic-tac-toe/index.tsx
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

// Helper function to determine the winner (no changes needed here)
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
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// The main game component with new AI logic
export default function TicTacToeGame() {
  const { data: session } = useSession();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true); // Player 'X' always starts
  const winner = calculateWinner(board);
  const isBoardFull = board.every((square) => square !== null);

  // --- START: NEW AI LOGIC ---

  // This useEffect hook triggers the AI's turn
  useEffect(() => {
    // Conditions for AI to make a move:
    // 1. There is no winner yet.
    // 2. It is currently O's turn (!xIsNext).
    if (!winner && !xIsNext) {
      // Add a small delay to make it feel like the AI is "thinking"
      const timeoutId = setTimeout(() => {
        makeAiMove();
      }, 500); // 0.5 second delay

      // Cleanup function to prevent move if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [xIsNext, board, winner]); // Re-run whenever the turn, board, or winner changes

  const makeAiMove = () => {
    // AI's move logic based on priorities

    // Helper to find empty squares
    const emptySquares = board
      .map((sq, i) => (sq === null ? i : null))
      .filter((i) => i !== null);

    // 1. Check for a winning move for AI ('O')
    for (let i of emptySquares) {
      const newBoard = board.slice();
      newBoard[i!] = "O";
      if (calculateWinner(newBoard) === "O") {
        handleSquareClick(i!);
        return;
      }
    }

    // 2. Check to block player's ('X') winning move
    for (let i of emptySquares) {
      const newBoard = board.slice();
      newBoard[i!] = "X";
      if (calculateWinner(newBoard) === "X") {
        handleSquareClick(i!);
        return;
      }
    }

    // 3. Take the center if available
    if (emptySquares.includes(4)) {
      handleSquareClick(4);
      return;
    }

    // 4. Take a random corner if available
    const corners = [0, 2, 6, 8].filter((i) => emptySquares.includes(i));
    if (corners.length > 0) {
      const randomCorner = corners[Math.floor(Math.random() * corners.length)];
      handleSquareClick(randomCorner);
      return;
    }

    // 5. Take any remaining square
    if (emptySquares.length > 0) {
      const randomSquare =
        emptySquares[Math.floor(Math.random() * emptySquares.length)];
      handleSquareClick(randomSquare);
    }
  };

  // Renamed handleClick to handleSquareClick for clarity
  const handleSquareClick = (i: number) => {
    // Prevent action if square is filled, there's a winner, or it's not the player's turn
    if (board[i] || winner) {
      return;
    }

    const newBoard = board.slice();
    newBoard[i] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  // --- END: NEW AI LOGIC ---

  // The player's click handler now just calls the main one
  const handlePlayerClick = (i: number) => {
    // Player can only click if it's their turn
    if (xIsNext && !board[i] && !winner) {
      handleSquareClick(i);
    }
  };

  // Scoring logic (no changes needed)
  useEffect(() => {
    // Only run if there is a winner AND the user is logged in
    if (winner && session?.user?.id) {
      const submitScore = async () => {
        try {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              gameSlug: "tic-tac-toe",
              score: 100, // A win is worth 100 points
            }),
          });
          console.log("Tic-Tac-Toe score submitted!");
        } catch (error) {
          console.error("Error submitting Tic-Tac-Toe score:", error);
        }
      };
      submitScore();
    }
  }, [winner, session]);

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  // ... (status message logic is the same)
  let status;
  if (winner) {
    status = `Winner: ${winner}!`;
  } else if (isBoardFull) {
    status = "It's a draw!";
  } else {
    status = `Your turn: ${xIsNext ? "X" : "O"}`;
  }

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 max-w-md mx-auto">
      <h2 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white tracking-wide">
        🎯 Tic-Tac-Toe
      </h2>

      <div className="mb-4 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-semibold shadow-sm backdrop-blur-sm text-center text-lg">
        {status}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {board.map((_, i) => (
          <button
            key={i}
            onClick={() => handlePlayerClick(i)}
            disabled={!!winner || !xIsNext}
            className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 text-4xl font-extrabold rounded-xl flex items-center justify-center text-gray-800 dark:text-gray-100 shadow-inner transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {board[i]}
          </button>
        ))}
      </div>

      <button
        onClick={handleRestart}
        className="mt-6 px-8 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-full shadow-lg transition-all duration-200"
      >
        🔁 Restart Game
      </button>
    </div>
  );
}
