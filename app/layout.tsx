import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DSA Tracker',
  description: 'Spaced repetition tracker for LeetCode practice',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-bg text-text font-mono min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </body>
    </html>
  );
}
