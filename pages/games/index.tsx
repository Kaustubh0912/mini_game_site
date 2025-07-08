"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/lib/games";
import GameCard from "@/components/GameCard";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import clientPromise from "@/lib/mongodb";
import { FiSearch, FiFilter, FiGrid, FiList, FiX } from "react-icons/fi";
import debounce from "lodash/debounce";

type ViewMode = "grid" | "list";
type SortOption = "popular" | "newest" | "alphabetical" | "rating";
type Difficulty = "Easy" | "Medium" | "Hard";

type FilterState = {
  search: string;
  difficulties: Difficulty[];
  categories: string[];
};

export const getServerSideProps: GetServerSideProps<{
  games: Game[];
  categories: string[];
}> = async () => {
  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");

    // Fetch games with their categories
    const games = await db
      .collection("games")
      .find({})
      .project({ _id: 0 })
      .toArray();

    // Get unique categories
    const categories = Array.from(
      new Set(games.map((game) => game.category).filter(Boolean))
    );

    return {
      props: {
        games: JSON.parse(JSON.stringify(games)),
        categories,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { games: [], categories: [] },
    };
  }
};

export default function GamesPage({
  games: initialGames,
  categories,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // States
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [filteredGames, setFilteredGames] = useState(initialGames);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    difficulties: [],
    categories: [],
  });

  // Animation variants
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
    visible: { y: 0, opacity: 1 },
  };

  // Debounced search function
  const debouncedSearch = debounce((searchTerm: string) => {
    setFilters((prev) => ({ ...prev, search: searchTerm }));
  }, 300);

  useEffect(() => {
  // Set a temporary filter state (e.g., category = "Puzzle")
  setFilters({
    search: "",
    difficulties: [],
    categories: ["Puzzle"],
  });

  // Reset to default after 100ms
  const timer = setTimeout(() => {
    setFilters({
      search: "",
      difficulties: [],
      categories: [],
    });
  }, 100);

  // Cleanup in case component unmounts before timeout completes
  return () => clearTimeout(timer);
}, []);


  // Apply filters and sorting
  useEffect(() => {
    let result = [...initialGames];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (game) =>
          game.name.toLowerCase().includes(searchLower) ||
          game.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply difficulty filter
    if (filters.difficulties.length > 0) {
      result = result.filter((game) =>
        filters.difficulties.includes(game.difficulty as Difficulty)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(
        (game) => game.category && filters.categories.includes(game.category)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "alphabetical":
          return a.name.localeCompare(b.name);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "popular":
        default:
          return (b.totalPlays || 0) - (a.totalPlays || 0);
      }
    });

    setFilteredGames(result);
  }, [filters, sortBy, initialGames]);

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white py-12 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Browse Games
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80"
          >
            Discover and play our collection of free browser games
          </motion.p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="w-full md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search games..."
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="alphabetical">A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-600 shadow"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <FiGrid />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-600 shadow"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <FiList />
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setIsFilterMenuOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <FiFilter />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {filteredGames.map((game) => (
            <motion.div key={game.id} variants={itemVariants}>
              <GameCard game={game} />
            </motion.div>
          ))}
        </motion.div>

        {filteredGames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 dark:text-gray-400">
              No games found matching your criteria.
            </p>
          </motion.div>
        )}
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsFilterMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-800 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Filters</h2>
                  <button
                    onClick={() => setIsFilterMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
                  >
                    <FiX />
                  </button>
                </div>

                {/* Difficulty Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Difficulty</h3>
                  <div className="space-y-2">
                    {["Easy", "Medium", "Hard"].map((difficulty) => (
                      <label
                        key={difficulty}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={filters.difficulties.includes(
                            difficulty as Difficulty
                          )}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              difficulties: e.target.checked
                                ? [
                                    ...prev.difficulties,
                                    difficulty as Difficulty,
                                  ]
                                : prev.difficulties.filter(
                                    (d) => d !== difficulty
                                  ),
                            }));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>{difficulty}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              categories: e.target.checked
                                ? [...prev.categories, category]
                                : prev.categories.filter((c) => c !== category),
                            }));
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setFilters({
                        search: "",
                        difficulties: [],
                        categories: [],
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterMenuOpen(false)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
