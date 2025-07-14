export interface UserStats {
  totalTimePlayed: number;
  totalGamesPlayed: number;
  averageScore: number;
  achievementsUnlocked: number;
  recentActivity?: GameActivity[];
}

export interface GameActivity {
  gameId: string;
  gameName: string;
  gameSlug: string;
  lastPlayed: string;
  timePlayed: number;
  highScore: number;
  totalGames: number;
  achievements?: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  unlockedAt?: Date;
}

export interface UserStats {
  totalTimePlayed: number;
  totalGamesPlayed: number;
  averageScore: number;
  achievementsUnlocked: number;
  recentActivity?: GameActivity[];
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  bio?: string;
  stats: UserStats;
  gameStats: GameActivity[];
  settings: {
    theme: "system" | "light" | "dark";
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
