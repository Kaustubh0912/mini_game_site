import { motion } from "framer-motion";
import WordleLeaderboard from "@/components/WordleLeaderboard";
import Link from "next/link";

export default function WordleLeaderboardPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-primary">Wordle</span>{" "}
                <span className="text-gray-900 dark:text-white">Leaderboards</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Compete across multiple game modes and claim your spot at the top!
              </p>
            </div>
            <Link
              href="/games/wordle"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-colors"
            >
              Play Wordle
            </Link>
          </div>
        </motion.div>

        <WordleLeaderboard />
      </div>
    </div>
  );
}