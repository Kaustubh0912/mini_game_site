"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Game } from "@/lib/games";
import { easeInOut } from "framer-motion";


type GameCardProps = {
  game: Game;
  featured?: boolean;
};

export default function GameCard({ game, featured = false }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Add console log for debugging
  console.log("Rendering game:", game);

  // Animation variants
  const cardVariants = {
    hover: {
      y: -8,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
  };

  const imageVariants = {
    hover: {
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: easeInOut,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      initial="initial"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg transition-shadow ${
        featured ? "col-span-2 row-span-2" : ""
      }`}
    >
      <Link href={`/games/${game.slug}`} className="block">
        {/* Game Image */}
        <div
          className={`relative ${featured ? "aspect-[2/1]" : "aspect-[4/3]"}`}
        >
          <motion.div variants={imageVariants} className="h-full">
            <Image
              src={game.image || "/images/games/default-game.jpg"} // Add fallback image
              alt={game.name}
              fill
              className="object-cover"
              sizes={
                featured
                  ? "(max-width: 768px) 100vw, 50vw"
                  : "(max-width: 768px) 100vw, 25vw"
              }
              priority={featured}
            />
          </motion.div>

          {/* Overlay with play button */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <motion.button
              initial={{ scale: 0.5, opacity: 0 }}
              animate={
                isHovered
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0.5, opacity: 0 }
              }
              transition={{ duration: 0.2 }}
              className="px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-colors"
            >
              Play Now
            </motion.button>
          </div>

          {/* Game badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {game.difficulty && (
              <span className="px-2 py-1 text-xs font-semibold bg-black/60 text-white rounded-full backdrop-blur-sm">
                {game.difficulty}
              </span>
            )}
            {game.isNew && (
              <span className="px-2 py-1 text-xs font-semibold bg-primary text-white rounded-full">
                New!
              </span>
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                {game.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {game.description}
              </p>
            </div>

            {/* Game Rating */}
            {game.rating && (
              <div className="flex items-center bg-primary/10 px-2 py-1 rounded-full">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm font-medium text-primary">
                  {game.rating}
                </span>
              </div>
            )}
          </div>

          {/* Game Stats */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{game.playTime || "5 min"}</span>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{game.totalPlays?.toLocaleString() || "1k"} plays</span>
            </div>
          </div>

          {/* Progress Bar (if game is in progress) */}
          {game.progress !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Progress
                </span>
                <span className="text-xs font-medium text-primary">
                  {game.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${game.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-primary h-1.5 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Add to favorites"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button
              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Share game"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>

          {game.highScore && (
            <div className="flex items-center text-sm">
              <svg
                className="w-4 h-4 text-yellow-400 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 3.414V9a1 1 0 11-2 0V3.414L5.707 6.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0112 2z"
                />
              </svg>
              <span className="font-medium text-gray-600 dark:text-gray-300">
                High Score: {game.highScore.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
