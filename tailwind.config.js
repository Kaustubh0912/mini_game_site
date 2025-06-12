// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./games/**/*.{js,ts,jsx,tsx}", // Also scan the games folder
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 8px rgba(124, 58, 237, 0.7)",
      },
      colors: {
        primary: {
          DEFAULT: "#7c3aed",
          light: "#a855f7",
          dark: "#6d28d9",
        },
      },
    },
  },
  plugins: [],
  // This should already be here from the image fix
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};
