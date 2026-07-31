import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sabung Win Rate Calculator - Web Tongkrongan Official',
  description: 'Track your game statistics, win rate analytics, and leaderboard with custom player reports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-warm-bg text-warm-text min-h-screen selection:bg-warm-amber selection:text-warm-bg">
        {children}
      </body>
    </html>
  );
}
