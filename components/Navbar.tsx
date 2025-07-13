import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import ThemeSwitcher from "./ThemeSwitcher";
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiGrid, 
  FiUser, 
  FiLogOut,
  FiChevronDown
} from "react-icons/fi";

import { FaGamepad } from "react-icons/fa";

export default function Navbar() {
  // Get session data and status
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Refs for dropdown menus
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      // Profile dropdown
      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      
      // Mobile menu - only close if clicking outside menu and not on menu button
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-mobile-menu-toggle]')
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
  }, [isProfileDropdownOpen, isMobileMenuOpen]);

  // Nav Links with icons
  const navLinks = [
    { href: "/", label: "Home", icon: <FiHome className="mr-2" /> },
    { href: "/games", label: "Games", icon: <FiGrid className="mr-2" /> },
  ];

  // Games dropdown items
  const gameItems = [
    { href: "/games/snake", label: "Snake", emoji: "🐍" },
    { href: "/games/breakout", label: "Breakout", emoji: "🧱" },
    { href: "/games/tic-tac-toe", label: "Tic-Tac-Toe", emoji: "⭕" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg"
          : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-purple-500 transition-all">
              🎮 MiniGames
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Main Nav Links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  router.pathname === link.href
                    ? "text-white bg-gradient-to-r from-blue-600 to-purple-600"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {/* Games Dropdown */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 text-sm font-medium rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                <FaGamepad className="mr-2" />
                Quick Play
                <FiChevronDown className="ml-2 group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left scale-95 group-hover:scale-100">
                <div className="py-1">
                  {gameItems.map((game) => (
                    <Link
                      key={game.href}
                      href={game.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="mr-2">{game.emoji}</span>
                      {game.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme and Auth */}
            <div className="flex items-center pl-4 border-l border-gray-200 dark:border-gray-700 ml-2">
              <ThemeSwitcher />

              {/* Auth Section */}
              <div className="ml-4">
                {status === "loading" ? (
                  <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                ) : session ? (
                  <div className="relative" ref={profileDropdownRef}>
                    <button 
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} 
                      className="flex items-center space-x-2 focus:outline-none"
                      aria-label="Open user menu"
                    >
                      <div className="relative">
                        <Image
                          src={session.user?.image || "/default-avatar.png"}
                          alt="Profile"
                          width={36}
                          height={36}
                          className="rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden lg:block max-w-[100px] truncate">
                        {session.user?.name}
                      </span>
                    </button>

                    {/* User Dropdown */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md overflow-hidden bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium">{session.user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <FiUser className="mr-3 text-gray-500 dark:text-gray-400" />
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              signOut();
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <FiLogOut className="mr-3 text-red-500" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full shadow-sm hover:shadow transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
              data-mobile-menu-toggle="true"
            >
              {isMobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          ref={mobileMenuRef}
          className={`md:hidden fixed left-0 w-full z-40 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
            isMobileMenuOpen ? "top-16 opacity-100 visible" : "top-[-100%] opacity-0 invisible"
          }`}
          style={{ maxHeight: isMobileMenuOpen ? 'calc(100vh - 4rem)' : '0', overflowY: 'auto' }}
        >
          <div className="py-2 px-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${
                  router.pathname === link.href
                    ? "text-white bg-gradient-to-r from-blue-600 to-purple-600"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {/* Games Section in Mobile Menu */}
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-2">
                Quick Play Games
              </p>
              {gameItems.map((game) => (
                <Link
                  key={game.href}
                  href={game.href}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mb-1"
                >
                  <span className="mr-2">{game.emoji}</span>
                  {game.label}
                </Link>
              ))}
            </div>

            {/* Auth in Mobile Menu */}
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 px-3">
              {status === "loading" ? (
                <div className="px-4 py-2">
                  <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ) : session ? (
                <div className="px-2 py-2">
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Image
                      src={session.user?.image || "/default-avatar.png"}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{session.user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Link
                      href="/profile"
                      className="flex-1 flex justify-center items-center px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      <FiUser className="mr-2" /> Profile
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex-1 flex justify-center items-center px-3 py-2 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    >
                      <FiLogOut className="mr-2" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg shadow"
                  >
                    <FiUser className="mr-2" /> Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}