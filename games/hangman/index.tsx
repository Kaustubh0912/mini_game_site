"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { FiSettings, FiRefreshCw, FiHelpCircle, FiClock } from "react-icons/fi";

// --- Types ---
type GameDifficulty = "easy" | "medium" | "hard";
type GameCategory =
  | "animals"
  | "countries"
  | "movies"
  | "food"
  | "sports"
  | "mixed";
type GameState = "playing" | "won" | "lost";

interface GameStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
}

// --- Word Lists ---
const WORD_LISTS = {
  animals: {
    easy: [
      "cat",
      "dog",
      "cow",
      "pig",
      "hen",
      "bee",
      "ant",
      "bat",
      "rat",
      "owl",
    ],
    medium: [
      "horse",
      "sheep",
      "tiger",
      "whale",
      "eagle",
      "snake",
      "shark",
      "zebra",
    ],
    hard: [
      "elephant",
      "kangaroo",
      "butterfly",
      "crocodile",
      "rhinoceros",
      "hippopotamus",
    ],
  },
  countries: {
    easy: ["usa", "uk", "japan", "china", "italy", "spain", "brazil"],
    medium: ["france", "germany", "australia", "canada", "mexico", "russia"],
    hard: [
      "switzerland",
      "netherlands",
      "argentina",
      "bangladesh",
      "philippines",
    ],
  },
  movies: {
    easy: ["avatar", "frozen", "shrek", "cars", "up", "wall", "brave"],
    medium: ["titanic", "batman", "matrix", "pirates", "gladiator", "alien"],
    hard: [
      "inception",
      "interstellar",
      "casablanca",
      "goodfellas",
      "pulpfiction",
    ],
  },
  food: {
    easy: ["apple", "bread", "pizza", "cake", "rice", "milk", "egg", "fish"],
    medium: ["burger", "pasta", "cheese", "chicken", "banana", "orange"],
    hard: ["spaghetti", "chocolate", "sandwich", "strawberry", "pineapple"],
  },
  sports: {
    easy: ["golf", "swim", "run", "jump", "kick", "hit", "throw"],
    medium: ["soccer", "tennis", "boxing", "hockey", "rugby", "cricket"],
    hard: ["basketball", "volleyball", "badminton", "wrestling", "gymnastics"],
  },
  mixed: {
    easy: ["house", "water", "happy", "music", "money", "family", "friend"],
    medium: [
      "computer",
      "birthday",
      "vacation",
      "library",
      "kitchen",
      "garden",
    ],
    hard: ["adventure", "beautiful", "important", "different", "wonderful"],
  },
};

// --- Hangman Drawing ---
const HangmanDrawing = ({ wrongGuesses }: { wrongGuesses: number }) => {
  return (
    <div className="flex justify-center items-center h-64 w-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Gallows */}
        <line
          x1="20"
          y1="180"
          x2="80"
          y2="180"
          stroke="#8B4513"
          strokeWidth="4"
        />
        <line
          x1="50"
          y1="180"
          x2="50"
          y2="20"
          stroke="#8B4513"
          strokeWidth="4"
        />
        <line
          x1="50"
          y1="20"
          x2="120"
          y2="20"
          stroke="#8B4513"
          strokeWidth="4"
        />
        <line
          x1="120"
          y1="20"
          x2="120"
          y2="40"
          stroke="#8B4513"
          strokeWidth="4"
        />

        {/* Head */}
        {wrongGuesses >= 1 && (
          <motion.circle
            cx="120"
            cy="50"
            r="10"
            stroke="#333"
            strokeWidth="2"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Body */}
        {wrongGuesses >= 2 && (
          <motion.line
            x1="120"
            y1="60"
            x2="120"
            y2="120"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Left Arm */}
        {wrongGuesses >= 3 && (
          <motion.line
            x1="120"
            y1="80"
            x2="100"
            y2="100"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Right Arm */}
        {wrongGuesses >= 4 && (
          <motion.line
            x1="120"
            y1="80"
            x2="140"
            y2="100"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Left Leg */}
        {wrongGuesses >= 5 && (
          <motion.line
            x1="120"
            y1="120"
            x2="100"
            y2="150"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Right Leg */}
        {wrongGuesses >= 6 && (
          <motion.line
            x1="120"
            y1="120"
            x2="140"
            y2="150"
            stroke="#333"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </svg>
    </div>
  );
};

// --- Main Game Component ---
export default function HangmanGame() {
  // Game State
  const [currentWord, setCurrentWord] = useState("");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [hint, setHint] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showConfetti, setShowConfetti] = useState(false);

  // Settings
  const [difficulty, setDifficulty] = useState<GameDifficulty>("medium");
  const [category, setCategory] = useState<GameCategory>("mixed");
  const [timedMode, setTimedMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Stats
  const [gameStats, setGameStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalScore: 0,
  });

  const MAX_WRONG_GUESSES = 6;
  const TIMER_DURATION = useMemo(
    () => ({
      easy: 180, // 3 minutes
      medium: 120, // 2 minutes
      hard: 90, // 1.5 minutes
    }),
    [],
  );

  // Initialize game
  const initializeGame = useCallback(() => {
    const wordList = WORD_LISTS[category][difficulty];
    const randomWord =
      wordList[Math.floor(Math.random() * wordList.length)].toLowerCase();

    setCurrentWord(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameState("playing");
    setHint(getHint(randomWord, category));

    if (timedMode) {
      setTimeLeft(TIMER_DURATION[difficulty]);
    } else {
      setTimeLeft(0);
    }
  }, [difficulty, category, timedMode, TIMER_DURATION]);

  // Get hint for word
  const getHint = (word: string, cat: GameCategory): string => {
    const hints = {
      animals: "This is an animal you might find in nature",
      countries: "This is a country or nation",
      movies: "This is a popular movie title",
      food: "This is something you can eat",
      sports: "This is related to sports or physical activity",
      mixed: "This is a common English word",
    };
    return hints[cat];
  };

  // Handle letter guess
  const guessLetter = useCallback(
    (letter: string) => {
      if (gameState !== "playing" || guessedLetters.includes(letter)) {
        return;
      }

      const newGuessedLetters = [...guessedLetters, letter];
      setGuessedLetters(newGuessedLetters);

      if (!currentWord.includes(letter)) {
        setWrongGuesses((prev) => prev + 1);
      }
    },
    [gameState, guessedLetters, currentWord],
  );

  // Check game end conditions
  useEffect(() => {
    if (gameState !== "playing") return;

    // Check if word is complete
    const isWordComplete = currentWord
      .split("")
      .every((letter) => guessedLetters.includes(letter));

    if (isWordComplete) {
      setGameState("won");
      setShowConfetti(true);

      // Calculate score
      const timeBonus = timedMode ? Math.max(0, timeLeft * 2) : 0;
      const difficultyMultiplier = { easy: 1, medium: 2, hard: 3 }[difficulty];
      const wrongGuessDeduction = wrongGuesses * 5;
      const finalScore = Math.max(
        0,
        100 * difficultyMultiplier + timeBonus - wrongGuessDeduction,
      );

      setScore(finalScore);

      // Update stats
      setGameStats((prev) => ({
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + 1,
        currentStreak: prev.currentStreak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        totalScore: prev.totalScore + finalScore,
      }));

      setTimeout(() => setShowConfetti(false), 5000);
    } else if (wrongGuesses >= MAX_WRONG_GUESSES) {
      setGameState("lost");

      // Update stats
      setGameStats((prev) => ({
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins,
        currentStreak: 0,
        maxStreak: prev.maxStreak,
        totalScore: prev.totalScore,
      }));
    }
  }, [
    currentWord,
    guessedLetters,
    wrongGuesses,
    gameState,
    timeLeft,
    timedMode,
    difficulty,
  ]);

  // Timer effect
  useEffect(() => {
    if (!timedMode || gameState !== "playing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timedMode, gameState, timeLeft]);

  // Keyboard input
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const letter = event.key.toLowerCase();
      if (/^[a-z]$/.test(letter)) {
        guessLetter(letter);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [guessLetter]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Display word with guessed letters
  const displayWord = currentWord
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  // Get alphabet for virtual keyboard
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            🎯 Hangman
          </h1>

          <div className="flex items-center gap-2">
            {timedMode && gameState === "playing" && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full">
                <FiClock className="text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300 font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowHelp(true)}
              className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <FiHelpCircle />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiSettings />
            </button>

            <button
              onClick={initializeGame}
              className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {gameStats.wins}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Wins
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {gameStats.currentStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Streak
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {gameStats.totalScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Score
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hangman Drawing */}
            <div className="flex flex-col items-center">
              <HangmanDrawing wrongGuesses={wrongGuesses} />

              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Wrong Guesses: {wrongGuesses} / {MAX_WRONG_GUESSES}
                </div>
                <div className="flex gap-1 mt-2 justify-center">
                  {Array.from({ length: MAX_WRONG_GUESSES }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${
                        i < wrongGuesses
                          ? "bg-red-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Word and Game Controls */}
            <div className="flex flex-col justify-center">
              {/* Category and Difficulty */}
              <div className="flex justify-center gap-4 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
              </div>

              {/* Current Word */}
              <div className="text-center mb-6">
                <div className="text-4xl font-mono font-bold text-gray-800 dark:text-white tracking-wider mb-2">
                  {displayWord}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {hint}
                </div>
              </div>

              {/* Game Status */}
              <AnimatePresence>
                {gameState === "won" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-4"
                  >
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                      🎉 Congratulations!
                    </div>
                    <div className="text-lg text-gray-700 dark:text-gray-300">
                      You guessed &quot;{currentWord}&quot; correctly!
                    </div>
                    <div className="text-sm text-primary font-semibold">
                      Score: {score} points
                    </div>
                  </motion.div>
                )}

                {gameState === "lost" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center mb-4"
                  >
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                      💀 Game Over
                    </div>
                    <div className="text-lg text-gray-700 dark:text-gray-300">
                      The word was &quot;{currentWord}&quot;
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Virtual Keyboard */}
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {alphabet.map((letter) => {
                  const isGuessed = guessedLetters.includes(letter);
                  const isCorrect = isGuessed && currentWord.includes(letter);
                  const isWrong = isGuessed && !currentWord.includes(letter);

                  return (
                    <motion.button
                      key={letter}
                      onClick={() => guessLetter(letter)}
                      disabled={isGuessed || gameState !== "playing"}
                      whileHover={{
                        scale: gameState === "playing" && !isGuessed ? 1.05 : 1,
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        aspect-square rounded-lg font-bold text-sm transition-all
                        ${isCorrect ? "bg-green-500 text-white" : ""}
                        ${isWrong ? "bg-red-500 text-white" : ""}
                        ${!isGuessed && gameState === "playing" ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600" : ""}
                        ${!isGuessed && gameState !== "playing" ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600" : ""}
                        disabled:cursor-not-allowed
                      `}
                    >
                      {letter.toUpperCase()}
                    </motion.button>
                  );
                })}
              </div>

              {/* New Game Button */}
              {gameState !== "playing" && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={initializeGame}
                  className="mt-6 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors mx-auto"
                >
                  Play Again
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Settings
              </h2>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as GameDifficulty[]).map(
                    (diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          difficulty === diff
                            ? "bg-primary text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(WORD_LISTS) as GameCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        category === cat
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timed Mode */}
              <div className="mb-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={timedMode}
                    onChange={(e) => setTimedMode(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timed Mode
                  </span>
                </label>
                {timedMode && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Time limit: {formatTime(TIMER_DURATION[difficulty])}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    initializeGame();
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Apply & New Game
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                How to Play
              </h2>

              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Objective
                  </h3>
                  <p>
                    Guess the hidden word by selecting letters. You have 6 wrong
                    guesses before the hangman is complete!
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    How to Play
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Click on letters or use your keyboard to guess</li>
                    <li>Correct letters will appear in the word</li>
                    <li>
                      Wrong letters will be marked red and add to the hangman
                    </li>
                    <li>Guess the complete word before making 6 mistakes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Scoring
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Base points: Easy (100), Medium (200), Hard (300)</li>
                    <li>
                      Time bonus: +2 points per second remaining (timed mode)
                    </li>
                    <li>Wrong guess penalty: -5 points each</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Categories
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Animals:</strong> Creatures from nature
                    </li>
                    <li>
                      <strong>Countries:</strong> Nations around the world
                    </li>
                    <li>
                      <strong>Movies:</strong> Popular film titles
                    </li>
                    <li>
                      <strong>Food:</strong> Things you can eat
                    </li>
                    <li>
                      <strong>Sports:</strong> Athletic activities
                    </li>
                    <li>
                      <strong>Mixed:</strong> Common English words
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
