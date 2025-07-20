import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res
      .status(401)
      .json({ message: "You must be logged in to submit a score." });
  }

  try {
    const { gameSlug, score, gameMode, timestamp } = req.body;
    const userId = session.user.id;

    if (!userId || !gameSlug || typeof score !== "number") {
      return res.status(400).json({ message: "Missing or invalid parameters" });
    }

    const client = await clientPromise;
    const db = client.db("miniGamesDB");
    const scoresCollection = db.collection("scores");

    const newScore = {
      userId,
      gameSlug,
      score,
      gameMode,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    // Insert the new score record
    const result = await scoresCollection.insertOne(newScore);

    res.status(200).json({ message: "Score submitted successfully", result });
  } catch (error) {
    console.error("Failed to submit score:", error);
    res.status(500).json({ message: "Error submitting score" });
  }
}
