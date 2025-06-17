// components/GameCard.tsx
import Link from "next/link";
import Image from 'next/image';
import { Game } from "@/lib/games"; // Import our Game type

type GameCardProps = {
  game: Game;
};

export default function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/games/${game.slug}`} className="block group">
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-md overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-primary">
        <div className="relative w-full h-40 bg-gray-200 dark:bg-gray-800">
          <Image
            src={game.imageUrl}
            alt={game.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {game.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {game.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
