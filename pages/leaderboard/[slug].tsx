// pages/leaderboard/[slug].tsx
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import Image from "next/image";

// Define the shape of a single score entry from our API
type Score = {
  name: string;
  image: string;
  score: number;
  timestamp: string;
};

// --- THIS IS THE CRITICAL DATA-FETCHING LOGIC ---
// This runs on the server before rendering the page
export const getServerSideProps: GetServerSideProps<{
  scores: Score[];
  gameSlug: string;
}> = async (context) => {
  const { slug } = context.params!;

  // Build the absolute URL for the API endpoint
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = context.req.headers.host;
  const apiUrl = `${protocol}://${host}/api/scores/${slug}`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      console.error(`API call failed with status: ${res.status}`);
      return { props: { scores: [], gameSlug: slug as string } };
    }
    const scores = await res.json();
    return { props: { scores, gameSlug: slug as string } };
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return { props: { scores: [], gameSlug: slug as string } };
  }
};
// --- END OF DATA-FETCHING LOGIC ---

// This is the page component with the new styling
export default function LeaderboardPage({
  scores,
  gameSlug,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-white to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center">
        <span className="text-primary capitalize">
          {gameSlug.replace("-", " ")}
        </span>{" "}
        <span className="text-gray-800 dark:text-white">Leaderboard</span>
      </h1>

      <div className="rounded-lg overflow-hidden shadow-md bg-white/90 dark:bg-slate-800/70 backdrop-blur">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-primary text-white">
            <tr>
              <th className="px-5 py-4 text-left text-sm font-bold uppercase tracking-wider">
                Rank
              </th>
              <th className="px-5 py-4 text-left text-sm font-bold uppercase tracking-wider">
                Player
              </th>
              <th className="px-5 py-4 text-left text-sm font-bold uppercase tracking-wider">
                Score
              </th>
              <th className="px-5 py-4 text-left text-sm font-bold uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {scores && scores.length > 0 ? (
              scores.map((entry, index) => (
                <tr
                  key={`${entry.name}-${index}`}
                  className="hover:bg-primary/10 dark:hover:bg-primary/20 transition"
                >
                  <td className="px-5 py-4 font-bold text-lg text-gray-800 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <Image
                        className="w-10 h-10 rounded-full"
                        src={entry.image}
                        alt={entry.name}
                        width={40}
                        height={40}
                      />
                      <p className="ml-3 font-semibold text-gray-800 dark:text-white">
                        {entry.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800 dark:text-white">
                    {entry.score}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-slate-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-16 text-gray-500 dark:text-slate-400"
                >
                  No scores submitted yet. Be the first!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center">
        <Link
          href={`/games/${gameSlug}`}
          className="inline-block bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-full transition-shadow shadow-md"
        >
          ‹ Back to Game
        </Link>
      </div>
    </div>
  );
}
