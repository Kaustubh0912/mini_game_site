// pages/games/[slug].tsx
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { Game } from '@/lib/games'; // We can reuse our Game type
import clientPromise from '@/lib/mongodb';
import { ParsedUrlQuery } from 'querystring';

// Import game components
import TicTacToeGame from '@/games/tic-tac-toe';
import SnakeGame from '@/games/snake';
import BreakoutGame from '@/games/breakout'; 

import Link from 'next/link';
// Import other games as you create them
// import SnakeGame from '@/games/snake';

// Game component registry
const gameComponents: { [key: string]: React.ComponentType } = {
  'tic-tac-toe': TicTacToeGame,
  'snake': SnakeGame,
  'breakout': BreakoutGame,
};

// Define the shape of the context params for getStaticProps
interface IParams extends ParsedUrlQuery {
    slug: string;
}

// 1. getStaticPaths: Tell Next.js which pages to build
export const getStaticPaths: GetStaticPaths = async () => {
  const client = await clientPromise;
  const db = client.db('miniGamesDB');

  // Fetch all games, but we only need the 'slug' field
  const games = await db.collection('games').find({}, { projection: { slug: 1, _id: 0 } }).toArray();

  // Create an array of paths from the slugs
  const paths = games.map((game) => ({
    params: { slug: game.slug },
  }));

  return {
    paths,
    fallback: false, // If a slug is not found, show a 404 page
  };
};

// 2. getStaticProps: Fetch data for a single page
export const getStaticProps: GetStaticProps<{ gameInfo: Game }, IParams> = async (context) => {
  const { slug } = context.params!; // The slug comes from the path
  const client = await clientPromise;
  const db = client.db('miniGamesDB');

  // Find the one game that matches the slug
  const gameInfo = await db.collection('games').findOne({ slug: slug });

  if (!gameInfo) {
    return { notFound: true }; // Return a 404 if no game is found
  }

  // Convert the MongoDB document to a plain object
  const serializedGameInfo = JSON.parse(JSON.stringify(gameInfo));
  // Make sure to remove the complex _id object
  delete serializedGameInfo._id;

  return {
    props: {
      gameInfo: serializedGameInfo,
    },
    // Optional: revalidate the data every 60 seconds
    // revalidate: 60,
  };
};


// 3. The Page Component: Receives the fetched data as props
export default function GamePage({ gameInfo }: InferGetStaticPropsType<typeof getStaticProps>) {
  const GameComponent = gameComponents[gameInfo.slug];

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-2">{gameInfo.name}</h1>
      <p className="text-lg text-gray-600 mb-6">{gameInfo.description}</p>

      <Link href={`/leaderboard/${gameInfo.slug}`} className="my-4 text-blue-600 hover:underline font-semibold">
        🏆 View Leaderboard
      </Link>
      
      <div className="w-full max-w-md flex justify-center">
        {GameComponent ? (
          <GameComponent />
        ) : (
          <div className="text-center p-10 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold">Game Not Implemented</h2>
            <p className="mt-2 text-gray-600">
              The game logic for &quot;{gameInfo.name}&quot; has not been added yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}