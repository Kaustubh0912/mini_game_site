// components/Layout.tsx
import Navbar from './Navbar';
import React from 'react';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 md:p-8">{children}</main>
    </div>
  );
}