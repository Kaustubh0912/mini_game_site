import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiAward,
  FiSettings,
  FiAlertCircle,
  FiClock,
  FiStar,
  FiActivity,
} from "react-icons/fi";
import { FaGamepad, FaTrophy } from "react-icons/fa";
import type { Session } from "next-auth";
import type { UserStats, Achievement } from "@/types/user";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
type TabId = "overview" | "achievements" | "settings";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// Overview Component
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
              {recentActivity.map((activity, index) => (
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

// Achievements Component
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
  const allAchievements = recentActivity.reduce<Achievement[]>((acc, game) => {
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
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={achievement.icon}
                  alt={achievement.name || "Achievement"}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            )}
            <div className="ml-4 flex-grow">
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

// Settings Component
function Settings({ session }: { session: Session }) {
  const [formData, setFormData] = useState<{
    displayName: string;
    email: string;
    bio: string;
    notifications: boolean;
    theme: "system" | "light" | "dark";
  }>({
    displayName: session.user.name || "",
    email: session.user.email || "",
    bio: "",
    notifications: true,
    theme: "system",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing settings
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/users/${session.user.id}/profile`);
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            displayName: data.displayName || session.user.name || "",
            bio: data.bio || "",
            notifications: data.settings?.notifications ?? true,
            theme: data.settings?.theme || "system",
          }));
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, [session.user.id, session.user.name]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/users/${session.user.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          bio: formData.bio,
          settings: {
            notifications: formData.notifications,
            theme: formData.theme,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error("Save error:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
          Profile Settings
        </h2>

        {saveError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {saveError}
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              className="w-full px-4 py-2 rounded-lg border dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={4}
              className="w-full px-4 py-2 rounded-lg border dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={formData.notifications}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notifications: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="notifications"
              className="ml-2 text-gray-700 dark:text-gray-300"
            >
              Enable notifications
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme Preference
            </label>
            <select
              value={formData.theme}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  theme: e.target.value as "system" | "light" | "dark",
                }))
              }
              className="w-full px-4 py-2 rounded-lg border dark:border-slate-600 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center px-6 py-2 rounded-lg ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              } text-white transition-colors`}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace({
        pathname: "/login",
        query: { callbackUrl: router.asPath },
      });
    }
  }, [status, router]);

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (session?.user?.id) {
        try {
          setError(null);
          const response = await fetch(`/api/users/${session.user.id}/stats`);

          if (!response.ok) {
            throw new Error(`Failed to fetch stats: ${response.status}`);
          }

          const data = await response.json();
          setUserStats(data);
        } catch (error) {
          console.error("Failed to fetch user stats:", error);
          setError("Failed to load user statistics. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (status === "authenticated") {
      fetchUserStats();
    }
  }, [session, status]);

  // Configuration for tabs
  const tabs: TabConfig[] = [
    { id: "overview", label: "Overview", icon: FiUser },
    { id: "achievements", label: "Achievements", icon: FiAward },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  // Show loading state while checking authentication
  if (status === "loading" || isLoading) {
    return <LoadingSkeleton />;
  }

  // Show auth required message if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to view your profile.
          </p>
          <Link
            href="/login"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden mb-8"
        >
          <div className="relative h-32 bg-gradient-to-r from-primary to-purple-600">
            <div className="absolute -bottom-12 left-8">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={96}
                  height={96}
                  className="rounded-full border-4 border-white dark:border-slate-800"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center">
                  <FiUser className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="pt-16 pb-8 px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {session?.user?.name || "User"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg mb-8">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && <Overview stats={userStats} />}
              {activeTab === "achievements" && (
                <Achievements stats={userStats} />
              )}
              {activeTab === "settings" && session && (
                <Settings session={session} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
