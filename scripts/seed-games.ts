import { MongoClient } from "mongodb";
import { sampleGames } from "../lib/games.js";
import "dotenv/config"

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
    await client.close();
  } catch (error) {
    console.error("Error seeding games:", error);
    process.exit(1);
  }
}

seedGames();
