"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";

// Component imports
import FeaturedGameSlider from "@/components/FeaturedGameSlider";
import QuickStartCard from "@/components/QuickStartCard";
import NewsCard from "@/components/NewsCard";

import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import type { Game } from "@/lib/games";

interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc: string;
  alt: string;
  priority?: boolean;
}
const ImageWithFallback = ({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  fill,
  priority,
  ...props
}: ImageWithFallbackProps & {
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
}) => {
  const [imgSrc, setImgSrc] = useState(src);

  // Only pass allowed props to Next.js Image
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      priority={priority}
      onError={() => setImgSrc(fallbackSrc)}
      {...props}
    />
  );
};

// Types
type HomePageProps = {
  featuredGames?: Game[];
  popularGames?: Game[];
  recentNews?: {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    image: string;
  }[];
};

const LoadingSkeleton = () => {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="h-[80vh] bg-gray-200 dark:bg-gray-700" />

      {/* Featured Games Skeleton */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </section>

      {/* Popular Games Skeleton */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-700 rounded-xl aspect-video"
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-4">{message}</p>
        <Link
          href="/games"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Browse All Games
        </Link>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");

    // Fetch featured games
    const featuredGames = await db
      .collection("games")
      .find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Fetch popular games
    const popularGames = await db
      .collection("games")
      .find({})
      .sort({ totalPlays: -1 })
      .limit(8)
      .toArray();

    return {
      props: {
        featuredGames: JSON.parse(JSON.stringify(featuredGames)),
        popularGames: JSON.parse(JSON.stringify(popularGames)),
        recentNews: [], // Add news data when ready
      },
    };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    return {
      props: {
        featuredGames: [],
        popularGames: [],
        recentNews: [],
      },
    };
  }
};
export default function HomePage({
  featuredGames = [],
  popularGames = [],
  recentNews = [],
}: HomePageProps) {
  const { data: session } = useSession();
  const [recentlyPlayed, setRecentlyPlayed] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  useEffect(() => {
    // Small delay to ensure smooth loading transition
    const timer = setTimeout(() => {
      // Load recently played games if user is logged in
      if (session) {
        // You can implement this logic to fetch recently played games
        // For now, we'll just set it to empty array
        setRecentlyPlayed([]);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [session]);

  if (isLoading || (!featuredGames && !popularGames)) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] -mt-24 flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback
            src="/images/hero-bg.png"
            fallbackSrc="/images/default-hero.jpg"
            alt="Gaming Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Play, Compete, <br />
              <span className="text-primary">Have Fun!</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of players in our collection of free browser games.
              Challenge yourself and climb the leaderboards!
            </p>
            <div className="flex space-x-4">
              <Link
                href="/games"
                className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-full transition-colors"
              >
                Browse Games
              </Link>
              {!session && (
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-colors backdrop-blur-sm"
                >
                  Sign Up Free
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Games Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold mb-6"
          >
            Featured Games
          </motion.h2>
          {featuredGames.length > 0 ? (
            <FeaturedGameSlider games={featuredGames} isLoading={isLoading} />
          ) : (
            <EmptyState message="No featured games available at the moment." />
          )}
        </motion.div>
      </section>

      {/* Quick Start Section */}
      {session && recentlyPlayed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="text-2xl font-bold mb-6"
            >
              Quick Start
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyPlayed.slice(0, 4).map((game) => (
                <motion.div key={game.slug} variants={itemVariants}>
                  <QuickStartCard game={game} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Popular Games Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <motion.h2 variants={itemVariants} className="text-2xl font-bold">
              Popular Games
            </motion.h2>
            <motion.div variants={itemVariants}>
              <Link
                href="/games"
                className="text-primary hover:text-primary-dark font-semibold"
              >
                View All →
              </Link>
            </motion.div>
          </div>
          {popularGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularGames.map((game) => (
                <motion.div key={game.slug} variants={itemVariants}>
                  <GameCard game={game} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState message="No popular games available at the moment." />
          )}
        </motion.div>
      </section>

      {/* News & Updates */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h2
            variants={itemVariants}
            className="text-2xl font-bold mb-6"
          >
            Latest News & Updates
          </motion.h2>
          {recentNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentNews.map((news) => (
                <motion.div key={news.id} variants={itemVariants}>
                  <NewsCard news={news} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState message="No recent news available at the moment." />
          )}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-white/80">Players</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-white/80">Games</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-white/80">Games Played</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">100K+</div>
              <div className="text-white/80">Daily Active Users</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
