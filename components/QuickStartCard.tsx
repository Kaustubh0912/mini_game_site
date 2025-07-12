"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Game } from "@/lib/games";

type QuickStartCardProps = {
  game: Game;
};

export default function QuickStartCard({ game }: QuickStartCardProps) {
  return (
    <Link href={`/games/${game.slug}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg group"
      >
        {/* Game Image */}
        <div className="relative h-32">
          <Image
            src={game.image}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* Overlay with last played time */}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">Resume Game</span>
          </div>
        </div>

        {/* Game Info */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {game.name}
            </h3>
            {/* Last played indicator */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {game.lastPlayed
                ? new Date(game.lastPlayed).toLocaleDateString()
                : "Never played"}
            </span>
          </div>

          {/* Progress Bar */}
          {game.progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Progress
                </span>
                <span className="text-xs font-medium text-primary">
                  {game.progress}%
                </span>
              </div>
              <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${game.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          )}

          {/* Recent Achievement or Stats */}
          {game.recentAchievement && (
            <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
              <svg
                className="w-4 h-4 text-yellow-400 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 0 1 .774.37l2.434 3.166 3.874.553a1 1 0 0 1 .555 1.706l-2.802 2.73.662 3.855a1 1 0 0 1-1.452 1.054L10 13.418l-3.445 1.816a1 1 0 0 1-1.452-1.054l.662-3.855-2.802-2.73a1 1 0 0 1 .555-1.706l3.874-.553L9.226 2.37A1 1 0 0 1 10 2z"
                />
              </svg>
              <span>{game.recentAchievement}</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
