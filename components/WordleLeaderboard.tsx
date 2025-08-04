import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FiChevronDown, FiFilter, FiAward } from "react-icons/fi";
import { useSession } from "next-auth/react";

type WordleScore = {
  userId: string;
  name: string;
  image: string;
  score: number;
  gameMode: string;
  timestamp: string;
};

type GameMode = "classic" | "time-trial" | "scramble" | "word-chain" | "streak";
type TimeFrame = "all" | "daily" | "weekly" | "monthly";

export default function WordleLeaderboard() {
  const { data: session } = useSession();
  const [scores, setScores] = useState<WordleScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");
  const [showFilters, setShowFilters] = useState(false);

  const gameModes: { value: GameMode; label: string }[] = [
    { value: "classic", label: "Classic" },
    { value: "time-trial", label: "Time Trial" },
    { value: "scramble", label: "Scramble" },
    { value: "word-chain", label: "Word Chain" },
    { value: "streak", label: "Streak" },
  ];

  const timeFrames: { value: TimeFrame; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "monthly", label: "This Month" },
    { value: "weekly", label: "This Week" },
    { value: "daily", label: "Today" },
  ];

  // Mode-specific score descriptions
  const scoreDescriptions: Record<GameMode, string> = {
    classic: "Points based on fewer guesses and faster completion",
    "time-trial": "Points based on time remaining and correct guess",
    scramble: "Points based on solving scrambled letters quickly",
    "word-chain": "Points based on chain length",
    streak: "Points based on consecutive words solved",
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/scores/wordle?gameMode=${selectedMode}&timeFrame=${timeFrame}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }

        const data = await response.json();
        setScores(data);
      } catch (error) {
        setError("Failed to load leaderboard. Please try again.");
        console.error("Leaderboard error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedMode, timeFrame]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Wordle Leaderboard</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <FiFilter className="text-gray-500 dark:text-gray-400" />
          Filters
          <FiChevronDown
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-6 overflow-hidden"
        >
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Game Mode
              </label>
              <div className="flex flex-wrap gap-2">
                {gameModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedMode === mode.value
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Time Period
              </label>
              <div className="flex flex-wrap gap-2">
                {timeFrames.map((frame) => (
                  <button
                    key={frame.value}
                    onClick={() => setTimeFrame(frame.value)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      timeFrame === frame.value
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500"
                    }`}
                  >
                    {frame.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Description of scoring */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
        <p>{scoreDescriptions[selectedMode]}</p>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-slate-700 px-6 py-3">
              <div className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="px-6 py-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                    <div className="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : scores.length === 0 ? (
          <div className="py-8 text-center">
            <FiAward className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No scores found for this game mode and time period.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {scores.map((score, index) => (
                <tr
                  key={`${score.userId}-${index}`}
                  className={
                    session?.user?.id === score.userId
                      ? "bg-primary/5 dark:bg-primary/10"
                      : ""
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index === 0 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-400 text-white rounded-full text-lg font-bold">
                        1
                      </span>
                    ) : index === 1 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-300 text-white rounded-full text-lg font-bold">
                        2
                      </span>
                    ) : index === 2 ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-600 text-white rounded-full text-lg font-bold">
                        3
                      </span>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">
                        {index + 1}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <Image
                          src={score.image || "/default-avatar.png"}
                          alt={score.name}
                          className="rounded-full object-cover"
                          fill
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {score.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {score.score.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(score.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
