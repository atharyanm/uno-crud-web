'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    if (stored) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg text-warm-amber font-semibold text-sm">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 border-2 border-warm-amber border-t-transparent rounded-full animate-spin" />
        <span>Loading Sabung Win Rate...</span>
      </div>
    </div>
  );
}
