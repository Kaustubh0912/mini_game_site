import { GetStaticPaths, GetStaticProps } from "next";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Game } from "@/lib/games";
import dynamic from "next/dynamic";
import clientPromise from "@/lib/mongodb";

// Define available games
const AVAILABLE_GAMES = ["tic-tac-toe", "snake", "breakout", "wordle"];

// Dynamically import game components
const gameComponents = {
  "tic-tac-toe": dynamic(() => import("@/games/tic-tac-toe")),
  snake: dynamic(() => import("@/games/snake")),
  breakout: dynamic(() => import("@/games/breakout")),
  wordle: dynamic(() => import("@/games/wordle")),
};

// Types
type GamePageProps = {
  gameInfo: Game;
};

// Get static paths - this tells Next.js which pages to generate at build time
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");

    // Get all game slugs from the database
    const games = await db
      .collection("games")
      .find({})
      .project({ slug: 1, _id: 0 })
      .toArray();

    // Create paths for each game
    const paths = games.map((game) => ({
      params: { slug: game.slug },
    }));

    return {
      paths,
      fallback: false, // Return 404 if path is not found
    };
  } catch (error) {
    console.error("Error getting static paths:", error);
    // If there's an error, return just the known game paths
    return {
      paths: AVAILABLE_GAMES.map((slug) => ({ params: { slug } })),
      fallback: false,
    };
  }
};

// Get static props - this gets the data for each page
export const getStaticProps: GetStaticProps<GamePageProps> = async ({
  params,
}) => {
  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");

    const gameSlug = params?.slug as string;

    // Get game info from database
    const gameInfo = await db
      .collection("games")
      .findOne({ slug: gameSlug }, { projection: { _id: 0 } });

    // If game not found, return 404
    if (!gameInfo) {
      return {
        notFound: true,
      };
    }

    // Return the game info as props
    return {
      props: {
        gameInfo: JSON.parse(JSON.stringify(gameInfo)),
      },
      revalidate: 60 * 60, // Revalidate every hour
    };
  } catch (error) {
    console.error("Error getting static props:", error);
    return {
      notFound: true,
    };
  }
};

// Main component
export default function GamePage({ gameInfo }: GamePageProps) {
  // Get the game component
  const GameComponent =
    gameComponents[gameInfo.slug as keyof typeof gameComponents];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Game Header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Game Image */}
        <div className="w-full md:w-1/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative aspect-video rounded-xl overflow-hidden shadow-xl"
          >
            <Image
              src={gameInfo.image}
              alt={gameInfo.name}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </div>

        {/* Game Info */}
        <div className="w-full md:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold mb-4">{gameInfo.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {gameInfo.description}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-colors">
                Play Now
              </button>
              {gameInfo.slug !== "tic-tac-toe" &&
                gameInfo.slug !== "wordle" && (
                  <Link
                    href={`/leaderboard/${gameInfo.slug}`}
                    className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    View Leaderboard
                  </Link>
                )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Game Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-2 sm:p-4 md:p-6"
      >
        {GameComponent ? (
          <GameComponent />
        ) : (
          <div className="text-center p-12">
            <h2 className="text-2xl font-semibold mb-4">Game Not Available</h2>
            <p className="text-gray-600 dark:text-gray-300">
              This game is currently under maintenance. Please check back later.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
