// pages/api/scores/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // We only want to handle POST requests, everything else is not allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { userId, gameSlug, score } = req.body;

    // Basic validation
    if (!userId || !gameSlug || typeof score !== 'number') {
      return res.status(400).json({ message: 'Missing or invalid parameters' });
    }

    const client = await clientPromise;
    const db = client.db('miniGamesDB');

    const newScore = {
      userId, // For now, this will be "anonymous"
      gameSlug,
      score,
      timestamp: new Date(),
    };

    const result = await db.collection('scores').insertOne(newScore);

    // Send a 201 Created response
    res.status(201).json({ message: 'Score submitted successfully', scoreId: result.insertedId });
  } catch (error) {
    console.error('Failed to submit score:', error);
    res.status(500).json({ message: 'Error submitting score' });
  }
}