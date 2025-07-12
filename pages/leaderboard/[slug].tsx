"use client";

import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { FiClock, FiAward, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";

// Types
type Score = {
  name: string;
  image: string;
  score: number;
  timestamp: string;
  rank?: number;
  previousRank?: number;
  userId: string;
};

type TimeFrame = "all" | "daily" | "weekly" | "monthly";

type LeaderboardStats = {
  totalPlayers: number;
  averageScore: number;
  highestScore: number;
};

// Server-side props
export const getServerSideProps: GetServerSideProps<{
  scores: Score[];
  gameSlug: string;
  stats: LeaderboardStats;
}> = async (context) => {
  const { slug } = context.params!;

  try {
    // Build the absolute URL for the API endpoint
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = context.req.headers.host;
    const apiUrl = `${protocol}://${host}/api/scores/${slug}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`API call failed with status: ${res.status}`);
    }

    const scores = await res.json();

    // Calculate stats
    const stats = {
      totalPlayers: scores.length,
      averageScore: Math.round(
        scores.reduce((acc: number, curr: Score) => acc + curr.score, 0) /
          scores.length
      ),
      highestScore: Math.max(...scores.map((s: Score) => s.score)),
    };

    return {
      props: {
        scores,
        gameSlug: slug as string,
        stats,
      },
    };
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return {
      props: {
        scores: [],
        gameSlug: slug as string,
        stats: {
          totalPlayers: 0,
          averageScore: 0,
          highestScore: 0,
        },
      },
    };
  }
};

export default function LeaderboardPage({
  scores: initialScores,
  gameSlug,
  stats,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: session } = useSession();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");
  const [scores, setScores] = useState(initialScores);
  const [isLoading, setIsLoading] = useState(false);

  // Find user's rank if they're logged in
  const userScore = session?.user?.id
    ? scores.find((score) => score.userId === session.user.id)
    : null;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Handle time frame change
  const handleTimeFrameChange = async (newTimeFrame: TimeFrame) => {
    setIsLoading(true);
    setTimeFrame(newTimeFrame);

    try {
      const res = await fetch(
        `/api/scores/${gameSlug}?timeFrame=${newTimeFrame}`
      );
      const newScores = await res.json();
      setScores(newScores);
    } catch (error) {
      console.error("Failed to fetch scores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-primary capitalize">
                {gameSlug.replace(/-/g, " ")}
              </span>{" "}
              <span className="text-gray-900 dark:text-white">Leaderboard</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Compete with players worldwide and claim your spot at the top!
            </p>
          </div>
          <Link
            href={`/games/${gameSlug}`}
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
          >
            Play Game
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FaTrophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Players
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPlayers.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FiAward className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageScore.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <FiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Highest Score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.highestScore.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Time Frame Filter */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex space-x-2">
            {(["all", "daily", "weekly", "monthly"] as TimeFrame[]).map(
              (tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeFrameChange(tf)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeFrame === tf
                      ? "bg-primary text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                <AnimatePresence>
                  {isLoading
                    ? // Loading skeleton
                      [...Array(10)].map((_, i) => (
                        <motion.tr
                          key={`skeleton-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="animate-pulse"
                        >
                          <td className="px-6 py-4">
                            <div className="h-4 w-8 bg-gray-200 dark:bg-slate-600 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-200 dark:bg-slate-600 rounded-full" />
                              <div className="ml-4 h-4 w-24 bg-gray-200 dark:bg-slate-600 rounded" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-16 bg-gray-200 dark:bg-slate-600 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-slate-600 rounded" />
                          </td>
                        </motion.tr>
                      ))
                    : scores.map((score, index) => (
                        <motion.tr
                          key={`${score.userId}-${index}`}
                          variants={itemVariants}
                          className={`${
                            session?.user?.id === score.userId
                              ? "bg-primary/5 dark:bg-primary/10"
                              : "hover:bg-gray-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {index + 1}
                              </span>
                              {score.previousRank && score.rank && (
                                <span className="ml-2">
                                  {score.previousRank > score.rank ? (
                                    <FiArrowUp className="w-4 h-4 text-green-500" />
                                  ) : score.previousRank < score.rank ? (
                                    <FiArrowDown className="w-4 h-4 text-red-500" />
                                  ) : null}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Image
                                src={score.image}
                                alt={score.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <span className="ml-4 font-medium text-gray-900 dark:text-white">
                                {score.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {score.score.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {new Date(score.timestamp).toLocaleDateString()}
                          </td>
                        </motion.tr>
                      ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* User's Position (if logged in) */}
        {session && userScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-primary text-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Image
                  src={session.user?.image ?? "/default-avatar.png"}
                  alt={session.user?.name ?? "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="ml-4">
                  <p className="text-sm opacity-90">Your Position</p>
                  <p className="text-xl font-bold">
                    #
                    {scores.findIndex((s) => s.userId === session.user?.id) + 1}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm opacity-90">Your Best Score</p>
                <p className="text-xl font-bold">
                  {userScore.score.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
