"use client"; // Add this at the top

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/lib/games";
import Image from "next/image";
import Link from "next/link";

type FeaturedGameSliderProps = {
  games: Game[];
};

export default function FeaturedGameSlider({ games }: FeaturedGameSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!games || games.length === 0) {
    return null; // Or return a placeholder/loading state
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % games.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
  };

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={games[currentIndex].image}
            alt={games[currentIndex].name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="text-3xl font-bold text-white mb-2">
              {games[currentIndex].name}
            </h3>
            <p className="text-gray-200 mb-4">
              {games[currentIndex].description}
            </p>
            <Link
              href={`/games/${games[currentIndex].slug}`}
              className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-colors"
            >
              Play Now
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="absolute inset-0 flex items-center justify-between p-4">
        <button
          onClick={handlePrevious}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Previous game"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Next game"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {games.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white w-4"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
