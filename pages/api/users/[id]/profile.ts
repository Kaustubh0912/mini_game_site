import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  // Ensure the user can only modify their own profile
  if (session.user.id !== id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("miniGamesDB");

    if (req.method === "GET") {
      const profile = await db
        .collection("userProfiles")
        .findOne({ userId: id }, { projection: { _id: 0 } });

      return res.status(200).json(profile || {});
    }

    if (req.method === "PUT") {
      const updates = {
        userId: id,
        ...req.body,
        updatedAt: new Date(),
      };

      await db
        .collection("userProfiles")
        .updateOne({ userId: id }, { $set: updates }, { upsert: true });

      return res.status(200).json({ message: "Profile updated successfully" });
    }

    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
