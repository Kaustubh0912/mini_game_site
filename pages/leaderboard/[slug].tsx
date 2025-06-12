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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
        <span className="text-primary capitalize">
          {gameSlug.replace("-", " ")}
        </span>
        <span className="text-white"> Leaderboard</span>
      </h1>

      <div className="rounded-lg overflow-hidden bg-slate-800/50">
        <table className="min-w-full">
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
          <tbody>
            {scores && scores.length > 0 ? (
              scores.map((entry, index) => (
                <tr
                  key={`${entry.name}-${index}`}
                  className="border-b border-slate-700 last:border-b-0"
                >
                  <td className="px-5 py-4 font-bold text-lg text-white">
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
                      <p className="ml-3 font-semibold text-white">
                        {entry.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">
                    {entry.score}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-16 text-slate-400">
                  No scores submitted yet. Be the first!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <Link
          href={`/games/${gameSlug}`}
          className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          ‹ Back to Game
        </Link>
      </div>
    </div>
  );
}
