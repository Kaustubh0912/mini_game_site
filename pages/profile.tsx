// pages/profile.tsx
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // This effect will redirect unauthenticated users
  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // While loading session, show a loading message
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // If authenticated, show the profile
  return (
    session && (
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="mt-4">Welcome, {session.user?.name}!</p>
        <p>Email: {session.user?.email}</p>
        <p>User ID: {session.user?.id}</p> {/* We added this in the callback */}
      </div>
    )
  );
}