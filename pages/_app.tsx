// pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { SessionProvider } from "next-auth/react";
import { Poppins } from "next/font/google"; // <-- Import the font
import { ThemeProvider } from "next-themes"; // <-- Import

// Configure the font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Load different weights we'll use
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <main className={poppins.className}>
        <SessionProvider session={session}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </SessionProvider>
      </main>
    </ThemeProvider>
  );
}
