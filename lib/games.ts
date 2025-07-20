export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  category: string;
  featured?: boolean;
  isNew?: boolean;
  totalPlays?: number;
  rating?: number;
  playTime?: string;
  highScore?: number;
  progress?: number;
  createdAt: Date;
  lastPlayed?: Date; // Optional, for games that have been played
  recentAchievement?: string; // Optional, for games with achievements
}

export const sampleGames: Game[] = [
  {
    id: "1",
    slug: "tic-tac-toe",
    name: "Tic Tac Toe",
    description:
      "Classic game of X's and O's. Challenge your friends or play against the computer!",
    image: "/images/games/tic-tac-toe.png",
    difficulty: "Easy",
    category: "Strategy",
    featured: true,
    isNew: true,
    totalPlays: 1500,
    rating: 4.5,
    playTime: "5 min",
    createdAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    slug: "snake",
    name: "Snake",
    description:
      "Guide the snake to eat the food and grow longer, but don't hit the walls or yourself!",
    image: "/images/games/snake.png",
    difficulty: "Medium",
    category: "Arcade",
    featured: true,
    isNew: true,
    totalPlays: 2000,
    rating: 4.7,
    playTime: "10 min",
    createdAt: new Date("2023-01-02"),
  },
  {
    id: "3",
    slug: "breakout",
    name: "Breakout",
    description:
      "Break all the bricks with a bouncing ball. A classic arcade game reimagined!",
    image: "/images/games/breakout.png",
    difficulty: "Medium",
    category: "Arcade",
    featured: true,
    isNew: false,
    totalPlays: 1800,
    rating: 4.6,
    playTime: "15 min",
    createdAt: new Date("2023-01-03"),
  },
  {
    id: "4",
    slug: "wordle",
    name: "Wordle",
    description:
      "Guess the hidden word in 6 tries. A new puzzle is available each day!",
    image: "/images/games/wordle.png",
    difficulty: "Medium",
    category: "Puzzle",
    featured: true,
    isNew: false,
    totalPlays: 3000,
    rating: 4.8,
    playTime: "5-10 min",
    createdAt: new Date("2023-01-04"),
  },
];
