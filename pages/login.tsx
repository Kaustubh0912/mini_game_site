// pages/login.tsx
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold">Sign In</h1>
      <p className="my-4 text-gray-600">
        Sign in to save your scores and see your profile.
      </p>
      <button
        onClick={() => signIn('github')}
        className="flex items-center justify-center px-6 py-3 mt-4 font-semibold text-white bg-gray-800 rounded-md hover:bg-gray-900"
      >
        {/* You can add a GitHub icon here later */}
        Sign in with GitHub
      </button>
    </div>
  );
}