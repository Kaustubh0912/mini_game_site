let words: string[] = [];
let validWords: Set<string> = new Set();
let isInitialized = false;

// Fetch the word list from the public directory
export const fetchWordList = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    const response = await fetch("/wordsList.txt");
    if (!response.ok) {
      throw new Error("Failed to fetch words list");
    }

    const text = await response.text();
    // Clean up the words by removing any extra whitespace and filtering out empty entries
    words = text
      .split(/\r?\n/) // Handle both Windows and Unix line endings
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length === 5);

    console.log(`Loaded ${words.length} words`); // Debug info

    // Create a set of valid words for quick lookup
    validWords = new Set(words);

    // Log a few words to ensure they're loaded correctly
    console.log("Sample words:", words.slice(0, 10));

    isInitialized = true;
  } catch (error) {
    console.error("Error loading word list:", error);
  }
};

// Get a random word from the list
export const getRandomWord = (): string => {
  if (!words.length) {
    return "error"; // Return an error state if words aren't loaded
  }

  return words[Math.floor(Math.random() * words.length)];
};

// Check if a word is valid
export const isValidWord = (word: string): boolean => {
  const normalizedWord = word.trim().toLowerCase();
  const result = validWords.has(normalizedWord);

  // For debugging
  if (!result) {
    console.log(`Word "${normalizedWord}" not found in dictionary`);
    console.log(`Dictionary size: ${validWords.size}`);
  }

  return result;
};
