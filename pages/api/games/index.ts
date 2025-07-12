import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "@/lib/mongodb";
import type { Game } from "@/lib/games";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db("miniGamesDB");

      const games = await db
        .collection("games")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      return res.status(500).json({ message: "Error fetching games" });
    }
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "POST") {
    try {
      const client = await clientPromise;
      const db = client.db("miniGamesDB");

      const newGame: Game = {
        ...req.body,
        createdAt: new Date(),
      };

      const result = await db.collection("games").insertOne(newGame);
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error creating game:", error);
      return res.status(500).json({ message: "Error creating game" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
