import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  if (session.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");
    const userProfile = await db
      .collection("userProfiles")
      .findOne({ userId: id }, { projection: { _id: 0 } });

    if (!userProfile) {
      // Create default profile if none exists
      const defaultProfile = {
        userId: id,
        displayName: session.user.name,
        bio: "",
        stats: {
          totalTimePlayed: 0,
          totalGamesPlayed: 0,
          averageScore: 0,
          achievementsUnlocked: 0,
        },
        gameStats: [],
        settings: {
          theme: "system",
          notifications: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("userProfiles").insertOne(defaultProfile);
      return res.status(200).json(defaultProfile);
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
