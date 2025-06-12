// pages/api/scores/[slug].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// This code is already perfect and does not need to be changed.
// It correctly reads the high scores and prepares them for the leaderboard.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ message: 'Game slug is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('miniGamesDB');

    const pipeline = [
      // Stage 1: Filter for scores of the correct game
      {
        $match: {
          gameSlug: slug,
        },
      },
      // Stage 2: Convert the string `userId` to an ObjectId
      {
        $addFields: {
          userId_obj: { $toObjectId: '$userId' },
        },
      },
      // Stage 3: Join with the `users` collection
      {
        $lookup: {
          from: 'users',
          localField: 'userId_obj',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      // Stage 4: Filter out scores with no matching user
      {
        $unwind: '$userDetails',
      },
      // Stage 5: Sort by score to rank the players
      {
        $sort: {
          score: -1,
        },
      },
      // Stage 6: Limit to the top 10
      {
        $limit: 10,
      },
      // Stage 7: Format the data for the frontend
      {
        $project: {
          _id: 0,
          score: 1,
          timestamp: 1,
          name: '$userDetails.name',
          image: '$userDetails.image',
        },
      },
    ];

    const scores = await db.collection('scores').aggregate(pipeline).toArray();

    res.status(200).json(scores);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
}