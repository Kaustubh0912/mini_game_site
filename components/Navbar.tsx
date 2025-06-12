// components/Navbar.tsx
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react'; // Import hooks
import ThemeSwitcher from './ThemeSwitcher'; // <-- Import

export default function Navbar() {
  // Get session data and status
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
  <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-800 dark:text-gray-100 p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
    <div className="container mx-auto flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-primary dark:text-primary-light">
        🎮 MiniGames
      </Link>
      <div className="flex items-center space-x-6">
        <Link href="/" className="font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light">Home</Link>
        <Link href="/games" className="font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light">Browse Games</Link>
        <ThemeSwitcher />
        {/* Auth Buttons */}
        <div className="w-48 text-right">
          {status === 'loading' ? (
            <div className="text-sm text-gray-400 dark:text-gray-500">Loading...</div>
          ) : session ? (
            <div className="flex items-center justify-end space-x-3">
              {/* ... (user avatar and name link) ... */}
              <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => signIn('github')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
  );
}