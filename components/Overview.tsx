function Overview({ stats }: { stats: UserStats | null }) {
  // Handle case where stats is null or undefined
  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No stats available
        </p>
      </div>
    );
  }

  const statItems = [
    {
      icon: FiClock,
      label: "Time Played",
      value: `${Math.round((stats.totalTimePlayed || 0) / 3600)}h`,
      color: "blue",
    },
    {
      icon: FaGamepad,
      label: "Games Played",
      value: stats.totalGamesPlayed || 0,
      color: "green",
    },
    {
      icon: FiStar,
      label: "Avg Score",
      value: Math.round(stats.averageScore || 0),
      color: "yellow",
    },
    {
      icon: FaTrophy,
      label: "Achievements",
      value: stats.achievementsUnlocked || 0,
      color: "purple",
    },
  ];

  // Ensure recentActivity exists and is an array
  const recentActivity = Array.isArray(stats.recentActivity)
    ? stats.recentActivity
    : [];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center">
              <div
                className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900 rounded-full`}
              >
                <stat.icon
                  className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString()
                    : stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No recent activity found. Start playing some games!
            </p>
          ) : (
            <div className="space-y-6">
              {Array.isArray(recentActivity) &&
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={`${activity.gameId}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                        <FiActivity className="w-5 h-5 text-primary" />
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/games/${activity.gameSlug}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors"
                        >
                          {activity.gameName}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          High Score: {activity.highScore.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.lastPlayed).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(activity.timePlayed / 60)}min played
                      </p>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
