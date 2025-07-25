import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWordList, getRandomWord, isValidWord } from "@/lib/wordlist";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useSession } from "next-auth/react";
import {
  FiBarChart2,
  FiSettings,
  FiX,
  FiRefreshCw,
  FiClock,
  FiAward,
  FiList,
} from "react-icons/fi";
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
  bestTimeTrialScore: number;
  longestChain: number;
  longestStreak: number;
};

type GameMode = "classic" | "time-trial" | "scramble" | "word-chain" | "streak";

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
    absent: "bg-gray-500 dark:bg-gray-800 text-white",
    tbd: "bg-gray-200 dark:bg-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500",
  };

  const rows = [
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    ["enter", ..."zxcvbnm".split(""), "backspace"],
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-1 sm:space-y-1.5">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-center gap-1 sm:gap-1.5 w-full"
        >
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
                className={`h-12 sm:h-14 rounded-md font-bold uppercase flex items-center justify-center transition-colors ${keyStyle} ${
                  !isSpecialKey
                    ? keyStatusStyles[
                        (["correct", "present", "absent", "tbd"].includes(
                          usedKeys[key],
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
  gameMode,
  isOpen,
  onClose,
  onRestart,
  showLeaderboard,
}: {
  stats: GameStats;
  gameMode: GameMode;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  showLeaderboard: () => void;
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

        {/* Mode-specific stats */}
        {gameMode === "time-trial" && (
          <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-1">Time Trial Records</h3>
            <div className="flex justify-between">
              <span>Best Score:</span>
              <span className="font-bold">{stats.bestTimeTrialScore}</span>
            </div>
          </div>
        )}

        {gameMode === "word-chain" && (
          <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-1">Word Chain Records</h3>
            <div className="flex justify-between">
              <span>Longest Chain:</span>
              <span className="font-bold">{stats.longestChain}</span>
            </div>
          </div>
        )}

        {gameMode === "streak" && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-1">Streak Records</h3>
            <div className="flex justify-between">
              <span>Best Streak:</span>
              <span className="font-bold">{stats.longestStreak}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-2">
          <button
            onClick={() => {
              onClose();
              showLeaderboard();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <FiList /> Leaderboard
          </button>

          <button
            onClick={() => {
              onClose();
              onRestart();
            }}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FiRefreshCw /> Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SettingsModal = ({
  isOpen,
  onClose,
  gameMode,
  setGameMode,
  expertMode,
  setExpertMode,
  onStartNewGame,
}: {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  expertMode: boolean;
  setExpertMode: (mode: boolean) => void;
  onStartNewGame: () => void;
}) => {
  if (!isOpen) return null;

  const modeDescriptions = {
    classic: "Classic Wordle gameplay. 6 guesses to find the word.",
    "time-trial": "Race against the clock! Complete the puzzle in 60 seconds.",
    scramble:
      "The solution's letters are shown scrambled. Rearrange them correctly.",
    "word-chain":
      "Each solution becomes your first guess for the next puzzle. How far can you go?",
    streak:
      "Solve as many words as you can with only 3 lives. How long can you last?",
  };

  const modeIcons = {
    classic: "🎮",
    "time-trial": "⏱️",
    scramble: "🔀",
    "word-chain": "⛓️",
    streak: "🔥",
  };

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
          <h2 className="text-2xl font-bold">Game Options</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Game Mode</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {(
              [
                "classic",
                "time-trial",
                "scramble",
                "word-chain",
                "streak",
              ] as GameMode[]
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={`py-2 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                  gameMode === mode
                    ? "bg-blue-500 dark:bg-blue-600 text-white font-medium"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                }`}
              >
                <span>{modeIcons[mode]}</span>
                <span className="capitalize">{mode.replace("-", " ")}</span>
              </button>
            ))}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {modeDescriptions[gameMode]}
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <label htmlFor="expertMode" className="text-sm font-medium">
            Expert Mode
            <p className="text-xs text-gray-500 font-normal">
              Must use revealed hints in subsequent guesses
            </p>
          </label>
          <label htmlFor="expertMode" className="relative inline-flex items-center cursor-pointer">
            <input
              id="expertMode"
              type="checkbox"
              className="sr-only peer"
              checked={expertMode}
              onChange={() => setExpertMode(!expertMode)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <button
          onClick={() => {
            onClose();
            onStartNewGame();
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-colors shadow-md"
        >
          Start Game
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Leaderboard Modal ---
const LeaderboardModal = ({
  isOpen,
  onClose,
  gameMode,
}: {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameMode;
}) => {
  const [scores, setScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/scores/wordle?gameMode=${gameMode}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }
        
        const data = await response.json();
        setScores(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        setError("Failed to load leaderboard. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen, gameMode]);

  if (!isOpen) return null;

  const modeNames = {
    classic: "Classic Mode",
    "time-trial": "Time Trial Mode",
    scramble: "Scramble Mode", 
    "word-chain": "Word Chain Mode",
    streak: "Streak Mode"
  };

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Wordle Leaderboard</h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              {modeNames[gameMode]}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-12">
            <FiAward className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No scores available for this game mode yet.</p>
            <p className="text-gray-500 dark:text-gray-400">Be the first to submit a score!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {scores.map((score, index) => (
                  <tr 
                    key={index}
                    className={session?.user?.id === score.userId ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full">1</span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-400 text-white rounded-full">2</span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-700 text-white rounded-full">3</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full" src={score.image || "/default-avatar.png"} alt="" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{score.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-gray-900 dark:text-white">
                      {score.score.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(score.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main Wordle Component ---
const Wordle = () => {
  // Game State
  const [solution, setSolution] = useState("");
  const [scrambledSolution, setScrambledSolution] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [expertMode, setExpertMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeTrialScore, setTimeTrialScore] = useState(0);
  const [chainLength, setChainLength] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [livesLeft, setLivesLeft] = useState(3);
  const [previousSolution, setPreviousSolution] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hintIndex, setHintIndex] = useState(-1);

  // UI State
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [showFirstHint, setShowFirstHint] = useState(false);

  const { data: session } = useSession();

  // Stats State
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTimeTrialScore: 0,
    longestChain: 0,
    longestStreak: 0,
  });

  // Load stats from localStorage on mount or when gameMode changes
  useEffect(() => {
    const savedMode = localStorage.getItem("wordle_game_mode");
    const currentMode = (savedMode as GameMode) || "classic";
    if (!savedMode) {
      setGameMode(currentMode);
    }

    const statsKey = `wordle_stats_${currentMode}`;
    const savedStats = localStorage.getItem(statsKey);

    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      // Reset stats for the new mode if none are found
      setStats({
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0,
        maxStreak: 0,
        bestTimeTrialScore: 0,
        longestChain: 0,
        longestStreak: 0,
      });
    }

    const savedExpertMode = localStorage.getItem("wordle_expert_mode");
    if (savedExpertMode) {
      setExpertMode(JSON.parse(savedExpertMode));
    }
  }, [gameMode]);

  const showToast = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2000);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  // Generate a scrambled version of the solution
  const scrambleWord = useCallback((word: string) => {
    let scrambled = word;
    let attempts = 0;
    // Keep scrambling until it's different from the original word
    while (scrambled === word && attempts < 10) {
      const chars = word.split('');
      for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      scrambled = chars.join('');
      attempts++;
    }
    return scrambled;
  }, []);

  const resetGame = useCallback((continuingChain = false) => {
    // Get a new solution word
    const newSolution = getRandomWord();
    if (newSolution && newSolution !== "error") {
      console.log("New solution:", newSolution); // Debug info
      setSolution(newSolution);
      
      // Handle scramble mode - but only generate scrambled once
      if (gameMode === "scramble") {
        const scrambled = scrambleWord(newSolution);
        setScrambledSolution(scrambled);
      } else {
        setScrambledSolution("");
      }

      // Handle word-chain mode
      if (gameMode === "word-chain" && continuingChain && previousSolution) {
        // First guess is the previous solution
        setGuesses([previousSolution]);
        setCurrentGuess("");
      } else {
        setGuesses([]);
        setCurrentGuess("");
        
        // Reset chain if starting fresh
        if (gameMode === "word-chain" && !continuingChain) {
          setChainLength(0);
        }
      }

      // Handle streak mode
      if (gameMode === "streak" && !continuingChain) {
        setLivesLeft(3);
        setStreakCount(0);
      }
      
      // Store the solution for next round in word-chain mode
      if (gameMode === "word-chain" || continuingChain) {
        setPreviousSolution(newSolution);
      }
      
      setIsGameOver(false);
      setHasWon(false);
      setShowConfetti(false);
      setMessage("");
      setError(null);
      setTimeElapsed(0);
      
      // Reset timer for time trial
      if (gameMode === "time-trial") {
        setTimeLeft(60);
        setTimeTrialScore(0);
      }
    } else {
      setError("Could not start a new game. Please try again later.");
      setIsLoading(false);
    }
  }, [gameMode, previousSolution, scrambleWord]);

  // Initialize game
  useEffect(() => {
    const initializeGame = async () => {
      setIsLoading(true);
      try {
        await fetchWordList();
        const newSolution = getRandomWord();
        if (newSolution && newSolution !== "error") {
          console.log("New solution:", newSolution);
          setSolution(newSolution);
          
          if (gameMode === "scramble") {
            setScrambledSolution(scrambleWord(newSolution));
          }
          
          setGuesses([]);
          setCurrentGuess("");
          setIsGameOver(false);
          setHasWon(false);
          setShowConfetti(false);
          setMessage("");
          setError(null);
          setPreviousSolution(newSolution);
          
          if (gameMode === "time-trial") {
            setTimeLeft(60);
            setTimeTrialScore(0);
          }
          
          if (gameMode === "streak") {
            setLivesLeft(3);
            setStreakCount(0);
          }
          
          if (gameMode === "word-chain") {
            setChainLength(0);
          }
        } else {
          setError("Could not start a new game. Please try again later.");
        }
      } catch (err) {
        console.error("Failed to initialize game:", err);
        setError("Failed to load game. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeGame();
  }, [gameMode, scrambleWord]);

  // Show first letter hint in word-chain mode
  useEffect(() => {
    if (gameMode === "word-chain" && chainLength > 0) {
      setShowFirstHint(true);
    } else {
      setShowFirstHint(false);
    }
  }, [gameMode, chainLength]);

  // Time Trial mode timer
  useEffect(() => {
    if (gameMode !== "time-trial" || isGameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          showToast(`Time's up! The word was ${solution.toUpperCase()}`);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, isGameOver, solution, timeLeft]);

  // Track time elapsed for all games
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver]);

  // Determine color status for each letter in a guess
  const getGuessStatuses = useCallback(
    (guess: string): TileStatus[] => {
      const solutionChars = solution.split("");
      const guessChars = guess.split("");
      const statuses: TileStatus[] = Array(WORD_LENGTH).fill("absent");
      const solutionCharCount: { [key: string]: number } = {};

      solutionChars.forEach((char) => {
        solutionCharCount[char] = (solutionCharCount[char] || 0) + 1;
      });

      // First pass: Check for correct positions
      guessChars.forEach((char, index) => {
        if (char === solutionChars[index]) {
          statuses[index] = "correct";
          solutionCharCount[char]--;
        }
      });

      // Second pass: Check for present but wrong position
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
    [solution],
  );

  // Track which keys have been used and their status
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

    // Expert Mode Validation
    if (expertMode) {
      const lastGuess = guesses[guesses.length - 1];
      if (lastGuess) {
        const lastStatuses = getGuessStatuses(lastGuess);
        for (let i = 0; i < WORD_LENGTH; i++) {
          if (
            lastStatuses[i] === "correct" &&
            currentGuess[i] !== lastGuess[i]
          ) {
            showToast(
              `Letter ${i + 1} must be '${lastGuess[i].toUpperCase()}'`,
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

    if (isWin) {
      setIsGameOver(true);
      setHasWon(true);
      setShowConfetti(true);

      // Handle Time Trial scoring
      if (gameMode === "time-trial") {
        const score = timeLeft * 10 + 100;
        setTimeTrialScore(score);

        // Update best score
        if (score > stats.bestTimeTrialScore) {
          setStats((prev) => ({
            ...prev,
            bestTimeTrialScore: score,
          }));
        }

        showToast(`You won! Score: ${score}`);
      } else {
        showToast("You won!");
      }

      // Handle Word Chain mode
      if (gameMode === "word-chain") {
        const newChainLength = chainLength + 1;
        setChainLength(newChainLength);

        // Update longest chain
        if (newChainLength > stats.longestChain) {
          setStats((prev) => ({
            ...prev,
            longestChain: newChainLength,
          }));
        }

        // Continue the chain with a new word after delay
        setTimeout(() => {
          resetGame(true);
          setIsGameOver(false);
          showToast(`Chain length: ${newChainLength}`);
        }, 2000);
      }

      // Handle Streak mode
      else if (gameMode === "streak") {
        const newStreakCount = streakCount + 1;
        setStreakCount(newStreakCount);

        // Update longest streak
        if (newStreakCount > stats.longestStreak) {
          setStats((prev) => ({
            ...prev,
            longestStreak: newStreakCount,
          }));
        }

        // Continue with a new word after delay
        setTimeout(() => {
          resetGame(true);
          setIsGameOver(false);
          showToast(`Streak: ${newStreakCount} | Lives: ${livesLeft}`);
        }, 2000);
      }

      // Show confetti for a few seconds
      setTimeout(() => setShowConfetti(false), 5000);

      // For classic and scramble modes, show stats
      if (gameMode === "classic" || gameMode === "scramble") {
        setTimeout(() => {
          setIsStatsModalOpen(true);
        }, 1500);
      }
    } else if (isLoss) {
      setIsGameOver(true);
      showToast(`The word was ${solution.toUpperCase()}`);

      // Handle streak mode lives
      if (gameMode === "streak") {
        const newLives = livesLeft - 1;
        setLivesLeft(newLives);

        if (newLives > 0) {
          setTimeout(() => {
            resetGame(true);
            setIsGameOver(false);
            showToast(`Lives left: ${newLives}`);
          }, 2000);
        } else {
          showToast(`Game over! Final streak: ${streakCount}`);
          setTimeout(() => {
            setIsStatsModalOpen(true);
          }, 1500);
        }
      } else if (gameMode === "word-chain") {
        // End the chain and show stats
        showToast(`Chain broken! Final length: ${chainLength}`);
        setTimeout(() => {
          setIsStatsModalOpen(true);
        }, 1500);
      } else {
        setTimeout(() => {
          setIsStatsModalOpen(true);
        }, 1500);
      }
    }

    // Update stats for completed games
    if (
      (isWin || isLoss) &&
      (gameMode === "classic" ||
        gameMode === "scramble" ||
        (gameMode === "time-trial" && isWin) ||
        (gameMode === "word-chain" && isLoss) ||
        (gameMode === "streak" && livesLeft <= 1 && !isWin))
    ) {
      setStats((prev) => {
        const newStats = {
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          wins: isWin ? prev.wins + 1 : prev.wins,
          currentStreak: isWin ? prev.currentStreak + 1 : 0,
          maxStreak: isWin
            ? Math.max(prev.maxStreak, prev.currentStreak + 1)
            : prev.maxStreak,
          bestTimeTrialScore:
            gameMode === "time-trial" && isWin
              ? Math.max(prev.bestTimeTrialScore, timeTrialScore)
              : prev.bestTimeTrialScore,
          longestChain:
            gameMode === "word-chain"
              ? Math.max(prev.longestChain, chainLength)
              : prev.longestChain,
          longestStreak:
            gameMode === "streak"
              ? Math.max(prev.longestStreak, streakCount)
              : prev.longestStreak,
        };
        const statsKey = `wordle_stats_${gameMode}`;
        localStorage.setItem(statsKey, JSON.stringify(newStats));
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

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGameOver || isStatsModalOpen || isSettingsModalOpen || isLeaderboardModalOpen) return;
      const key = event.key.toLowerCase();

      if (key === "enter") handleGuessSubmit();
      else if (key === "backspace") handleDelete();
      else if (key.length === 1 && key >= "a" && key <= "z") handleChar(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentGuess,
    isGameOver,
    guesses,
    isStatsModalOpen,
    isSettingsModalOpen,
    isLeaderboardModalOpen,
    expertMode,
  ]);

  // Submit score for completed games
  useEffect(() => {
    if (isGameOver && session?.user?.id) {
      // Calculate appropriate score based on game mode
      let finalScore = 0;
      
      if (gameMode === "classic" || gameMode === "scramble") {
        // For classic/scramble: fewer guesses = better score, faster time = bonus
        const guessesUsed = guesses.length;
        finalScore = hasWon ? 
          (7 - guessesUsed) * 100 + (60 - Math.min(timeElapsed, 60)) :
          0; // No score for losses
      } 
      else if (gameMode === "time-trial") {
        // For time trial: time remaining = score
        finalScore = hasWon ? timeTrialScore : 0;
      } 
      else if (gameMode === "word-chain") {
        // For word chain: score based on chain length, submitted only on loss
        if (!hasWon) {
          finalScore = chainLength * 100;
        }
      }
      else if (gameMode === "streak") {
        // For streak: score based on streak count
        finalScore = streakCount * 150;
      }

      // Only submit if there's a positive score
      if (finalScore > 0) {
        fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            gameSlug: "wordle",
            score: finalScore,
            gameMode: gameMode,
            timestamp: new Date().toISOString(),
          }),
        }).catch((e) => console.error("Score submit failed", e));
      }
    }
  }, [isGameOver, hasWon, guesses.length, timeTrialScore, chainLength, streakCount, session, gameMode, timeElapsed]);

  const handleGameModeChange = (mode: GameMode) => {
    setGameMode(mode);
    localStorage.setItem("wordle_game_mode", mode);
  };

  const handleExpertModeChange = (enabled: boolean) => {
    setExpertMode(enabled);
    localStorage.setItem("wordle_expert_mode", JSON.stringify(enabled));
  };

  const startNewGame = () => {
    resetGame(false);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

  const grid = Array(MAX_GUESSES)
    .fill(0)
    .map((_, rowIndex) => (
      <motion.div
        key={rowIndex}
        className="grid grid-cols-5 gap-1 sm:gap-1.5"
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

            // Show a random letter hint for word-chain mode
            if (
              showFirstHint &&
              rowIndex === guesses.length &&
              !currentGuess
            ) {
              const hintIndex = Math.floor(Math.random() * solution.length);
              if (colIndex === hintIndex) {
                return (
                  <Tile key={colIndex} char={solution[hintIndex]} status="present" />
                );
              }
            }

            return <Tile key={colIndex} char={char} status={status} />;
          })}
      </motion.div>
    ));

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white dark:bg-gray-900 text-black dark:text-white relative rounded-lg">
      {showConfetti && <ConfettiCelebration />}

      <AnimatePresence>
        <StatsModal
          stats={stats}
          gameMode={gameMode}
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          onRestart={startNewGame}
          showLeaderboard={() => setIsLeaderboardModalOpen(true)}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          gameMode={gameMode}
          setGameMode={handleGameModeChange}
          expertMode={expertMode}
          setExpertMode={handleExpertModeChange}
          onStartNewGame={startNewGame}
        />

        <LeaderboardModal
          isOpen={isLeaderboardModalOpen}
          onClose={() => setIsLeaderboardModalOpen(false)}
          gameMode={gameMode}
        />
      </AnimatePresence>

      <header className="w-full flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
            Wordle
          </h1>
          {gameMode !== "classic" && (
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full
              ${
                gameMode === "time-trial"
                  ? "bg-blue-500"
                  : gameMode === "scramble"
                    ? "bg-purple-500"
                    : gameMode === "word-chain"
                      ? "bg-green-500"
                      : "bg-orange-500"
              }
              text-white`}
            >
              {gameMode === "time-trial"
                ? "Time Trial"
                : gameMode === "scramble"
                  ? "Scramble"
                  : gameMode === "word-chain"
                    ? "Chain"
                    : "Streak"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLeaderboardModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Leaderboard"
          >
            <FiList size={22} />
          </button>
          <button
            onClick={() => setIsStatsModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Statistics"
          >
            <FiBarChart2 size={22} />
          </button>
          <button
            onClick={startNewGame}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Start a new game"
          >
            <FiRefreshCw size={22} />
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Game Settings"
          >
            <FiSettings size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center p-1 sm:p-2 space-y-2 sm:space-y-4 overflow-hidden">
        {/* Game mode specific UI */}
        <div className="h-12 flex flex-col items-center justify-center space-y-1">
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

            {gameMode === "time-trial" && !isGameOver && (
              <div
                className={`px-4 py-1 rounded-full flex items-center gap-2 ${
                  timeLeft <= 10 ? "bg-red-500 animate-pulse" : "bg-blue-500"
                } text-white`}
              >
                <FiClock size={14} />
                <span className="text-sm font-bold">{timeLeft}s</span>
              </div>
            )}

            {gameMode === "streak" && (
              <div className="px-4 py-1 rounded-full flex items-center gap-3 bg-orange-500 text-white">
                <div className="flex items-center gap-1">
                  <FiAward size={14} />
                  <span className="text-sm font-bold">{streakCount}</span>
                </div>
                <div className="flex">
                  {Array(livesLeft)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-sm">
                        ❤️
                      </span>
                    ))}
                  {Array(3 - livesLeft)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-sm opacity-30">
                        ❤️
                      </span>
                    ))}
                </div>
              </div>
            )}

            {gameMode === "word-chain" && (
              <div className="px-4 py-1 rounded-full flex items-center gap-2 bg-green-500 text-white">
                <span className="text-sm">⛓️</span>
                <span className="text-sm font-bold">Chain: {chainLength}</span>
              </div>
            )}

            {gameMode === "scramble" && scrambledSolution && (
              <div className="px-4 py-1 rounded-full bg-purple-500 text-white">
                <span className="text-sm font-bold tracking-wider uppercase">
                  {scrambledSolution}
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-rows-6 gap-1 sm:gap-1.5 w-full max-w-sm p-1 sm:p-2">
          {grid}
        </div>
      </main>

      <footer className="w-full p-1 sm:p-2 flex-shrink-0">
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