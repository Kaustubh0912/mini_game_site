import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug, gameMode, timeFrame } = req.query;

  if (!slug) {
    return res.status(400).json({ message: "Game slug is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");

    // Create match condition based on parameters
    const matchCondition: any = {
      gameSlug: slug,
    };

    // Add gameMode filter if provided
    if (gameMode) {
      matchCondition.gameMode = gameMode;
    }

    // Add time frame filter if provided
    if (timeFrame && timeFrame !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (timeFrame === "daily") {
        startDate.setDate(now.getDate() - 1);
      } else if (timeFrame === "weekly") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeFrame === "monthly") {
        startDate.setMonth(now.getMonth() - 1);
      }

      matchCondition.timestamp = { $gte: startDate };
    }

    const pipeline = [
      // Stage 1: Filter for scores of the correct game
      {
        $match: matchCondition,
      },
      // Stage 2: Convert the string `userId` to an ObjectId
      {
        $addFields: {
          userId_obj: { $toObjectId: "$userId" },
        },
      },
      // Stage 3: Join with the `users` collection
      {
        $lookup: {
          from: "users",
          localField: "userId_obj",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      // Stage 4: Filter out scores with no matching user
      {
        $match: {
          userDetails: { $ne: [] },
        },
      },
      // Stage 5: Flatten the user details array
      {
        $unwind: "$userDetails",
      },
      // Stage 6: Sort by score to rank the players
      {
        $sort: {
          score: -1,
        },
      },
      // Stage 7: Limit to the top scores
      {
        $limit: 100,
      },
      // Stage 8: Format the data for the frontend
      {
        $project: {
          _id: 0,
          score: 1,
          timestamp: 1,
          userId: 1,
          gameMode: 1,
          name: "$userDetails.name",
          image: "$userDetails.image",
        },
      },
    ];

    const scores = await db.collection("scores").aggregate(pipeline).toArray();

    res.status(200).json(scores);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
}
