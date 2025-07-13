"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiGithub, FiMail } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function LoginPage() {
  const router = useRouter();
  const { error: queryError } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState("");
  const { status } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = router.query.callbackUrl as string;
      router.push(callbackUrl || "/");
    }
  }, [status, router]);
  useEffect(() => {
    if (queryError) {
      if (queryError === "OAuthAccountNotLinked") {
        setError("Account linking error");
        setErrorDetails(
          "You already have an account with a different sign-in method. Please use the method you signed up with."
        );
      } else {
        setError("Authentication error");
        setErrorDetails(String(queryError));
      }
    }
  }, [queryError]);

  // Handle provider sign in
  const handleSignIn = async (provider: "github" | "google") => {
    try {
      setIsLoading(true);
      setError(null);
      setErrorDetails("");

      console.log(`Attempting to sign in with ${provider}...`);

      const result = await signIn(provider, {
        callbackUrl: (router.query.callbackUrl as string) || "/",
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setError(`Authentication failed`);
        setErrorDetails(result.error);

        // If there's an error with the GitHub config
        if (result.error.includes("Configuration")) {
          setErrorDetails(
            `Please check server configuration for ${provider} authentication`
          );
        }
      } else if (result?.url) {
        // Successful sign in with redirect URL
        router.push(result.url);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred");
      setErrorDetails(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Show loading skeleton while checking session
  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  // Don't render anything if already authenticated (will redirect via useEffect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center"
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-6"
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={64}
              height={64}
              className="rounded-xl"
            />
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2"
          >
            Welcome to MiniGames
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-600 dark:text-gray-400 mb-8"
          >
            Sign in to track your progress and compete with others!
          </motion.p>
        </motion.div>

        {/* Sign In Options */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm"
            >
              <p className="font-semibold">{error}</p>
              {errorDetails && <p className="mt-1 text-xs">{errorDetails}</p>}
            </motion.div>
          )}

          {/* GitHub Sign In */}
          <motion.button
            variants={itemVariants}
            onClick={() => handleSignIn("github")}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors relative"
          >
            <FiGithub className="w-5 h-5 absolute left-4" />
            <span>Continue with GitHub</span>
          </motion.button>

          {/* Google Sign In */}
          <motion.button
            variants={itemVariants}
            onClick={() => handleSignIn("google")}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors relative"
          >
            <FcGoogle className="w-5 h-5 absolute left-4" />
            <span>Continue with Google</span>
          </motion.button>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </motion.div>

          {/* Email Sign In (placeholder for future implementation) */}
          <motion.button
            variants={itemVariants}
            onClick={() => {
              // Implement email sign in
              setError("Email sign in coming soon!");
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors relative"
          >
            <FiMail className="w-5 h-5 absolute left-4" />
            <span>Continue with Email</span>
          </motion.button>
        </motion.div>

        {/* Terms and Privacy */}
        <motion.p
          variants={itemVariants}
          className="text-xs text-center text-gray-500 dark:text-gray-400 mt-8"
        >
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </motion.p>

        {/* Debug Information */}
        <div className="mt-8 text-center">
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-primary">
              Troubleshooting
            </summary>
            <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg text-left">
              <p className="mb-2">If you&rsquo;re having trouble logging in:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check if you&rsquo;re allowing third-party cookies</li>
                <li>Try using a different browser</li>
                <li>Clear your browser cache and cookies</li>
              </ul>
              <button
                onClick={() => {
                  console.log("Current environment:", {
                    nodeEnv: process.env.NODE_ENV,
                    hasGithubConfig: Boolean(
                      process.env.NEXT_PUBLIC_HAS_GITHUB_AUTH
                    ),
                    hasGoogleConfig: Boolean(
                      process.env.NEXT_PUBLIC_HAS_GOOGLE_AUTH
                    ),
                    nextAuthUrl: process.env.NEXT_PUBLIC_AUTH_URL || "Not set",
                  });
                }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Debug Auth Info
              </button>
            </div>
          </details>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Signing in...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
