"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiUser,
  FiLogOut,
  FiHome,
  FiGrid,
  FiInfo,
  FiMail,
  FiGithub,
  FiTwitter,
} from "react-icons/fi";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Refs for dropdown menus
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // States
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const [year, setYear] = useState<number | null>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);

  // Set mounted to true on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Handle route change loading states
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setLoadingProgress(0);

      // Simulate progress
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 200);

      return () => clearInterval(interval);
    };

    const handleComplete = () => {
      setLoadingProgress(100);
      setTimeout(() => setIsLoading(false), 200);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      // Profile Menu
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      // Mobile Menu - only close if clicking outside menu and not on menu button
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest("[data-mobile-menu-button]")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isProfileMenuOpen, isMobileMenuOpen]);

  // Navigation links with icons
  const navLinks = [
    { href: "/", label: "Home", icon: <FiHome className="mr-2" /> },
    { href: "/games", label: "Games", icon: <FiGrid className="mr-2" /> },
    { href: "/profile", label: "Profile", icon: <FiUser className="mr-2" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Loading Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-700 z-50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}

      {/* Header */}
      {mounted && (
        <header
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
            isScrolled
              ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-md"
              : "bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                {mounted && (
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
                    🎮 MiniGames
                  </span>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center text-sm font-medium px-3 py-2 rounded-full transition-all ${
                      router.pathname === link.href
                        ? "text-white bg-gradient-to-r from-blue-600 to-purple-600"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Theme Toggle */}
                {mounted && (
                  <button
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label={
                      theme === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                    }
                  >
                    {theme === "dark" ? (
                      <FiSun className="text-yellow-400 hover:text-yellow-300" />
                    ) : (
                      <FiMoon className="text-blue-700 hover:text-blue-600" />
                    )}
                  </button>
                )}

                {/* User Menu */}
                {session ? (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="User Menu"
                    >
                      <div className="relative">
                        <Image
                          src={session.user?.image || "/default-avatar.png"}
                          alt="Profile"
                          width={36}
                          height={36}
                          className="rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                      </div>
                      {session.user?.name && (
                        <span className="hidden md:block text-sm font-medium truncate max-w-[100px]">
                          {session.user.name}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                          <p className="text-sm font-medium">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FiUser className="mr-3 text-gray-500 dark:text-gray-400" />
                            Your Profile
                          </Link>
                          <Link
                            href="/api/auth/signout"
                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FiLogOut className="mr-3 text-red-500" />
                            Sign Out
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full transition-all shadow-sm hover:shadow"
                  >
                    Sign In
                  </Link>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Toggle menu"
                  data-mobile-menu-button="true"
                >
                  {isMobileMenuOpen ? (
                    <FiX className="text-gray-700 dark:text-gray-300" />
                  ) : (
                    <FiMenu className="text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu - Slide Down Animation */}
          <div
            ref={mobileMenuRef}
            className={`md:hidden fixed w-full top-16 left-0 transition-all duration-300 transform origin-top ${
              isMobileMenuOpen
                ? "translate-y-0 opacity-100 visible"
                : "translate-y-[-20px] opacity-0 invisible"
            } bg-white dark:bg-slate-800 shadow-lg`}
            style={{
              maxHeight: isMobileMenuOpen ? "calc(100vh - 4rem)" : "0",
              overflowY: "auto",
            }}
          >
            <div className="p-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    router.pathname === link.href
                      ? "text-white bg-gradient-to-r from-blue-600 to-purple-600"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

              {/* User related mobile menu links */}
              {!session && (
                <Link
                  href="/login"
                  className="flex items-center px-3 py-3 rounded-lg text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <FiLogOut className="mr-2" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content with proper header spacing */}
      <main className="flex-grow pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mt-4">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                About
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                  >
                    <FiInfo className="mr-2" /> About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                  >
                    <FiMail className="mr-2" /> Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Games
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/games/snake"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    🐍 Snake
                  </Link>
                </li>
                <li>
                  <Link
                    href="/games/breakout"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    🧱 Breakout
                  </Link>
                </li>
                <li>
                  <Link
                    href="/games/tic-tac-toe"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    ⭕ Tic-Tac-Toe
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Newsletter
              </h3>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Subscribe to get the latest updates on new games and features.
              </p>
              <form className="mt-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 min-w-0 px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg transition-all"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start space-x-6">
              {/* Social Links */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="GitHub"
              >
                <FiGithub size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter size={20} />
              </a>
            </div>
            {year && (
              <p className="mt-6 md:mt-0 text-sm text-gray-500 dark:text-gray-400 text-center md:text-right">
                &copy; {new Date().getFullYear()} MiniGames. All rights
                reserved.
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
