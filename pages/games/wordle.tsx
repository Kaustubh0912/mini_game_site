import { useState } from "react";
import dynamic from "next/dynamic";
import WordleLeaderboard from "@/components/WordleLeaderboard";

// Dynamically import the Wordle game to avoid SSR issues
const WordleGame = dynamic(() => import("@/games/wordle"), {
  ssr: false,
});

export default function WordlePage() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Game Column */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-6">Wordle</h1>
          <WordleGame />
          
          {/* Mobile toggle for leaderboard */}
          <div className="lg:hidden mt-8">
            <button 
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-full py-3 bg-primary text-white font-bold rounded-lg"
            >
              {showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
            </button>
          </div>
        </div>
        
        {/* Leaderboard Column */}
        <div className={`lg:w-96 ${showLeaderboard || 'hidden lg:block'}`}>
          <WordleLeaderboard />
        </div>
      </div>
    </div>
  );
}