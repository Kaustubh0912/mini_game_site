import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  displayName: { type: String },
  bio: { type: String },
  stats: {
    totalTimePlayed: { type: Number, default: 0 },
    totalGamesPlayed: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    achievementsUnlocked: { type: Number, default: 0 },
  },
  gameStats: [
    {
      gameId: String,
      gameName: String,
      gameSlug: String,
      lastPlayed: Date,
      timePlayed: Number,
      highScore: Number,
      totalGames: Number,
      achievements: [
        {
          id: String,
          name: String,
          description: String,
          icon: String,
          unlockedAt: Date,
        },
      ],
    },
  ],
  settings: {
    theme: { type: String, default: "system" },
    notifications: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserProfile ||
  mongoose.model("UserProfile", UserProfileSchema);
