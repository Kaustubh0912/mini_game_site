function Achievements({ stats }: { stats: UserStats | null }) {
  // Handle case where stats is null or undefined
  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No achievements data available
        </p>
      </div>
    );
  }

  // Make sure recentActivity exists and is an array
  const recentActivity = Array.isArray(stats.recentActivity)
    ? stats.recentActivity
    : [];

  // Safely get all achievements
  const allAchievements = recentActivity.reduce((acc, game) => {
    if (Array.isArray(game.achievements)) {
      return [...acc, ...game.achievements];
    }
    return acc;
  }, []);

  if (allAchievements.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <FiAward className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No Achievements Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start playing games to unlock achievements!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {allAchievements.map((achievement, index) => (
        <motion.div
          key={`${achievement.id}-${index}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center">
            {achievement.icon && (
              <Image
                src={achievement.icon}
                alt={achievement.name || "Achievement"}
                width={48}
                height={48}
                className="rounded-lg"
              />
            )}
            <div className="ml-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {achievement.name || "Unnamed Achievement"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {achievement.description || "No description available"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Unlocked:{" "}
                {achievement.unlockedAt
                  ? new Date(achievement.unlockedAt).toLocaleDateString()
                  : "Date unknown"}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
