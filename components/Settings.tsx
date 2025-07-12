import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { FiSave, FiAlertCircle } from "react-icons/fi";
import { motion } from "framer-motion";

interface SettingsFormData {
  displayName: string;
  email: string;
  bio: string;
  notifications: boolean;
  theme: "system" | "light" | "dark";
}

interface SettingsProps {
  session: Session;
}

function Settings({ session }: SettingsProps) {
  const [formData, setFormData] = useState<SettingsFormData>({
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
        const response = await fetch(`/api/users/${session.user.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            ...data,
            displayName: data.displayName || prev.displayName,
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
  }, [session.user.id]);

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
        throw new Error("Failed to save settings");
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error("Save error:", error);
      setSaveError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

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
          {/* Form fields */}
          <div>
            <label className="block text-sm font-medium mb-2">
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
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 rounded-lg border dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bio: e.target.value,
                }))
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
            <label htmlFor="notifications" className="ml-2">
              Enable notifications
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center px-6 py-2 rounded-lg ${
                isSaving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              } text-white transition-colors`}
            >
              <FiSave className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
