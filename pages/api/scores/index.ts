// pages/api/scores/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'You must be logged in to submit a score.' });
  }

  try {
    const { gameSlug, score } = req.body;
    const userId = session.user.id;

    if (!userId || !gameSlug || typeof score !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid parameters' });
    }

    const client = await clientPromise;
    const db = client.db('miniGamesDB');
    const scoresCollection = db.collection('scores');

    const filter = {
      userId: userId,
      gameSlug: gameSlug,
    };

    // --- THIS IS THE CORRECTED UPDATE OBJECT ---
    const update = {
      // Use $max to set the score. This works for both updates and inserts.
      $max: { score: score },
      // Always update the timestamp
      $set: { timestamp: new Date() },
      // On insert, set the fields that don't change
      $setOnInsert: {
        userId: userId,
        gameSlug: gameSlug,
      },
    };
    // --- END OF CORRECTION ---

    const options = {
      upsert: true,
    };

    const result = await scoresCollection.updateOne(filter, update, options);

    res.status(200).json({ message: 'Score processed successfully', result });
  } catch (error) {
    // If you check your terminal, you would see the "Updating the path 'score' would create a conflict" error here.
    console.error('Failed to process score:', error);
    res.status(500).json({ message: 'Error processing score' });
  }
}