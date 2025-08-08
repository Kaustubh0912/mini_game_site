import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const sampleGames = [
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
  {
    id: "5",
    slug: "hangman",
    name: "Hangman",
    description:
      "Guess the hidden word letter by letter. Choose from different categories and difficulty levels!",
    image: "/images/games/hangman.png",
    difficulty: "Medium",
    category: "Word",
    featured: true,
    isNew: true,
    totalPlays: 850,
    rating: 4.4,
    playTime: "3-8 min",
    createdAt: new Date("2023-01-05"),
  },
  {
    id: "6",
    slug: "minesweeper",
    name: "Minesweeper",
    description:
      "Clear the minefield without detonating any mines. Use logic and deduction to win!",
    image: "/images/games/minesweeper.png",
    difficulty: "Medium",
    category: "Puzzle",
    featured: true,
    isNew: true,
    totalPlays: 0,
    rating: 4.3,
    playTime: "5-15 min",
    createdAt: new Date("2023-01-06"),
  },
  {
    id: "7",
    slug: "tetris",
    name: "Tetris",
    description:
      "Drop and arrange falling tetrominoes to clear lines. The classic block-stacking puzzle game!",
    image: "/images/games/tetris.png",
    difficulty: "Medium",
    category: "Puzzle",
    featured: true,
    isNew: true,
    totalPlays: 0,
    rating: 4.6,
    playTime: "10-30 min",
    createdAt: new Date("2023-01-07"),
  },
];

async function seedGames() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    const client = await MongoClient.connect(uri);
    const db = client.db("miniGamesDB");

    // Clear existing games
    await db.collection("games").deleteMany({});

    // Insert sample games
    await db.collection("games").insertMany(sampleGames);

    console.log("Games seeded successfully!");
    console.log(`Added ${sampleGames.length} games to the database`);
    await client.close();
  } catch (error) {
    console.error("Error seeding games:", error);
    process.exit(1);
  }
}

seedGames();
