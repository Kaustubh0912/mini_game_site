import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWordList, getRandomWord, isValidWord } from "@/lib/wordlist";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { FiBarChart2, FiSettings, FiX, FiRefreshCw } from "react-icons/fi";
import Confetti from "react-confetti";

// --- Constants ---
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// --- Types ---
type TileStatus = "correct" | "present" | "absent" | "empty" | "tbd";
type GameStats = {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
};

// --- Helper Components ---
const ConfettiCelebration = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Confetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.2}
    />
  );
};

const Tile = ({ char, status }: { char: string; status: TileStatus }) => {
  const statusStyles = {
    correct: "bg-green-500 border-green-500 text-white",
    present: "bg-yellow-500 border-yellow-500 text-white",
    absent:
      "bg-gray-500 dark:bg-gray-700 border-gray-500 dark:border-gray-700 text-white",
    empty: "bg-transparent border-gray-300 dark:border-gray-600",
    tbd: "bg-transparent border-gray-500 dark:border-gray-500",
  };

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{
        rotateX: status !== "empty" && status !== "tbd" ? 360 : 0,
      }}
      transition={{ duration: 0.5 }}
      className={`w-full aspect-square border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase rounded-md ${statusStyles[status]}`}
    >
      {char}
    </motion.div>
  );
};

const Keyboard = ({
  usedKeys,
  onChar,
  onDelete,
  onEnter,
}: {
  usedKeys: { [key: string]: TileStatus };
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
}) => {
  const keyStatusStyles = {
    correct: "bg-green-500 text-white",
    present: "bg-yellow-500 text-white",
    absent: "bg-gray-500 dark:bg-gray-700 text-white",
    tbd: "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500",
  };

  const rows = [
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    ["enter", ..."zxcvbnm".split(""), "backspace"],
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-1.5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 w-full">
          {rowIndex === 1 && <div className="flex-[0.5]" />}
          {row.map((key) => {
            const isSpecialKey = key === "enter" || key === "backspace";
            const keyStyle = isSpecialKey
              ? "bg-gray-300 dark:bg-gray-500 flex-[1.5] text-xs"
              : "flex-1";

            return (
              <button
                key={key}
                onClick={() => {
                  if (key === "enter") onEnter();
                  else if (key === "backspace") onDelete();
                  else onChar(key);
                }}
                className={`h-12 rounded-md font-bold uppercase flex items-center justify-center transition-colors ${keyStyle} ${
                  !isSpecialKey
                    ? keyStatusStyles[
                        (["correct", "present", "absent", "tbd"].includes(
                          usedKeys[key]
                        )
                          ? usedKeys[key]
                          : "tbd") as "correct" | "present" | "absent" | "tbd"
                      ]
                    : ""
                }`}
              >
                {key === "backspace" ? "⌫" : key}
              </button>
            );
          })}
          {rowIndex === 1 && <div className="flex-[0.5]" />}
        </div>
      ))}
    </div>
  );
};

const StatsModal = ({
  stats,
  isOpen,
  onClose,
  onRestart,
}: {
  stats: GameStats;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
}) => {
  if (!isOpen) return null;
  const winPercentage =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Statistics</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="grid grid-cols-4 text-center gap-2 mb-6">
          <div>
            <div className="text-3xl font-bold">{stats.gamesPlayed}</div>
            <div className="text-xs">Played</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{winPercentage}</div>
            <div className="text-xs">Win %</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs">Streak</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{stats.maxStreak}</div>
            <div className="text-xs">Max Streak</div>
          </div>
        </div>
        <button
          onClick={() => {
            onClose();
            onRestart();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiRefreshCw /> Play Again
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main Wordle Component ---
const Wordle = () => {
  // Game State
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // UI State
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Settings State
  const [hardMode, setHardMode] = useState(false);

  // Stats State
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
  });

  // Load stats and settings from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem("wordle_stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
    const savedHardMode = localStorage.getItem("wordle_hard_mode");
    if (savedHardMode) {
      setHardMode(JSON.parse(savedHardMode));
    }
  }, []);

  const showToast = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2000);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const resetGame = useCallback(() => {
    const newSolution = getRandomWord();
    if (newSolution && newSolution !== "error") {
      console.log("New solution:", newSolution); // Debug info
      setSolution(newSolution);
      setGuesses([]);
      setCurrentGuess("");
      setIsGameOver(false);
      setHasWon(false);
      setShowConfetti(false);
      setMessage("");
      setError(null);
    } else {
      setError("Could not start a new game. Please try again later.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeGame = async () => {
      setIsLoading(true);
      try {
        await fetchWordList();
        resetGame();
      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError("Failed to load game. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    initializeGame();
  }, [resetGame]);

  const getGuessStatuses = useCallback(
    (guess: string): TileStatus[] => {
      const solutionChars = solution.split("");
      const guessChars = guess.split("");
      const statuses: TileStatus[] = Array(WORD_LENGTH).fill("absent");
      const solutionCharCount: { [key: string]: number } = {};

      solutionChars.forEach((char) => {
        solutionCharCount[char] = (solutionCharCount[char] || 0) + 1;
      });

      guessChars.forEach((char, index) => {
        if (char === solutionChars[index]) {
          statuses[index] = "correct";
          solutionCharCount[char]--;
        }
      });

      guessChars.forEach((char, index) => {
        if (
          statuses[index] !== "correct" &&
          solutionChars.includes(char) &&
          solutionCharCount[char] > 0
        ) {
          statuses[index] = "present";
          solutionCharCount[char]--;
        }
      });

      return statuses;
    },
    [solution]
  );

  const usedKeys = useMemo(() => {
    const keys: { [key: string]: TileStatus } = {};
    guesses.forEach((guess) => {
      const statuses = getGuessStatuses(guess);
      guess.split("").forEach((char, index) => {
        const existingStatus = keys[char];
        const newStatus = statuses[index];
        if (
          existingStatus !== "correct" &&
          (existingStatus !== "present" || newStatus === "correct")
        ) {
          keys[char] = newStatus;
        }
      });
    });
    return keys;
  }, [guesses, getGuessStatuses]);

  const handleGuessSubmit = () => {
    if (isGameOver || isLoading) return;

    if (currentGuess.length !== WORD_LENGTH) {
      showToast("Not enough letters");
      triggerShake();
      return;
    }
    if (!isValidWord(currentGuess)) {
      showToast("Not in word list");
      triggerShake();
      return;
    }

    // Hard Mode Validation
    if (hardMode) {
      const lastGuess = guesses[guesses.length - 1];
      if (lastGuess) {
        const lastStatuses = getGuessStatuses(lastGuess);
        for (let i = 0; i < WORD_LENGTH; i++) {
          if (
            lastStatuses[i] === "correct" &&
            currentGuess[i] !== lastGuess[i]
          ) {
            showToast(
              `Letter ${i + 1} must be '${lastGuess[i].toUpperCase()}'`
            );
            triggerShake();
            return;
          }
          if (
            lastStatuses[i] === "present" &&
            !currentGuess.includes(lastGuess[i])
          ) {
            showToast(`Guess must contain '${lastGuess[i].toUpperCase()}'`);
            triggerShake();
            return;
          }
        }
      }
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    const isWin = currentGuess === solution;
    const isLoss = newGuesses.length === MAX_GUESSES && !isWin;

    if (isWin || isLoss) {
      setIsGameOver(true);

      if (isWin) {
        setHasWon(true);
        setShowConfetti(true);
        // Stop confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
      }

      setTimeout(() => {
        setIsStatsModalOpen(true);
      }, 1000); // Delay to allow UI update

      setTimeout(() => {
        showToast(
          isWin ? "You won!" : `The word was ${solution.toUpperCase()}`
        );
      }, 3000);

      // Update stats
      setStats((prevStats) => {
        const newStats = {
          ...prevStats,
          gamesPlayed: prevStats.gamesPlayed + 1,
          wins: isWin ? prevStats.wins + 1 : prevStats.wins,
          currentStreak: isWin ? prevStats.currentStreak + 1 : 0,
          maxStreak: isWin
            ? Math.max(prevStats.maxStreak, prevStats.currentStreak + 1)
            : prevStats.maxStreak,
        };
        localStorage.setItem("wordle_stats", JSON.stringify(newStats));
        return newStats;
      });
    }
  };

  const handleChar = (char: string) => {
    if (currentGuess.length < WORD_LENGTH && !isGameOver) {
      setCurrentGuess((prev) => prev + char);
    }
  };

  const handleDelete = () => {
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver || isStatsModalOpen) return;
      const key = event.key.toLowerCase();

      if (key === "enter") handleGuessSubmit();
      else if (key === "backspace") handleDelete();
      else if (key.length === 1 && key >= "a" && key <= "z") handleChar(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, isGameOver, guesses, isStatsModalOpen, hardMode]);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

  const grid = Array(MAX_GUESSES)
    .fill(0)
    .map((_, rowIndex) => (
      <motion.div
        key={rowIndex}
        className="grid grid-cols-5 gap-1.5"
        animate={
          isShaking && rowIndex === guesses.length
            ? { x: [-8, 8, -8, 8, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {Array(WORD_LENGTH)
          .fill(0)
          .map((_, colIndex) => {
            const guess = guesses[rowIndex];
            const char = guess
              ? guess[colIndex]
              : rowIndex === guesses.length
              ? currentGuess[colIndex] || ""
              : "";
            const status = guess
              ? getGuessStatuses(guess)[colIndex]
              : rowIndex === guesses.length
              ? "tbd"
              : "empty";
            return <Tile key={colIndex} char={char} status={status} />;
          })}
      </motion.div>
    ));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] w-full max-w-lg mx-auto bg-white dark:bg-gray-900 text-black dark:text-white relative">
      {showConfetti && <ConfettiCelebration />}

      <AnimatePresence>
        <StatsModal
          stats={stats}
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          onRestart={resetGame}
        />
      </AnimatePresence>

      <header className="w-full flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Wordle</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatsModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiBarChart2 size={22} />
          </button>
          <button
            onClick={resetGame}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Start a new game"
          >
            <FiRefreshCw size={22} />
          </button>
          <div className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <FiSettings size={22} />
            <label
              htmlFor="hardMode"
              className="flex items-center cursor-pointer"
            >
              <span className="mr-2 text-sm font-medium">Hard Mode</span>
              <div className="relative">
                <input
                  id="hardMode"
                  type="checkbox"
                  className="sr-only"
                  checked={hardMode}
                  onChange={() => {
                    const newMode = !hardMode;
                    setHardMode(newMode);
                    localStorage.setItem(
                      "wordle_hard_mode",
                      JSON.stringify(newMode)
                    );
                  }}
                />
                <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                <div
                  className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
                    hardMode ? "transform translate-x-full bg-green-400" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center p-2 space-y-4 overflow-hidden">
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-semibold"
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-rows-6 gap-1.5 w-full max-w-xs">{grid}</div>
      </main>

      <footer className="w-full p-2 flex-shrink-0">
        <Keyboard
          usedKeys={usedKeys}
          onChar={handleChar}
          onDelete={handleDelete}
          onEnter={handleGuessSubmit}
        />
      </footer>
    </div>
  );
};

export default Wordle;
