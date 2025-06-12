// pages/games/index.tsx
import GameCard from '@/components/GameCard';
import { Game } from '@/lib/games';
import clientPromise from '@/lib/mongodb';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';

// This function runs on the server for every request to this page
export const getServerSideProps: GetServerSideProps<{
  games: Game[];
}> = async () => {
  try {
    const client = await clientPromise;
    const db = client.db('miniGamesDB'); // Use your database name

    const games = await db
      .collection('games')
      .find({})
      .project({ _id: 0 }) // Exclude the default _id field
      .toArray();

    return {
      props: { games: JSON.parse(JSON.stringify(games)) }, // Serialize data
    };
  } catch (e) {
    console.error(e);
    return {
      props: { games: [] }, // Return empty array on error
    };
  }
};

// The page component now receives 'games' as a prop
export default function BrowseGamesPage({
  games,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Browse All Games</h1>
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      ) : (
        <p>Could not load games. Please try again later.</p>
      )}
    </div>
  );
}