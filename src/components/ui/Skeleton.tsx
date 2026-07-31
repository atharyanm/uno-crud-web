import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-warm-border/60 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-warm rounded-2xl p-6 border border-warm-border shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex flex-col items-center justify-center py-4">
        <Skeleton className="h-7 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-4 w-full text-center">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full mb-2" />
            <Skeleton className="h-5 w-12 mb-1" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full mb-2" />
            <Skeleton className="h-5 w-12 mb-1" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full mb-2" />
            <Skeleton className="h-5 w-12 mb-1" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-warm-border glass-warm">
      <div className="p-4 border-b border-warm-border flex justify-between items-center">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4 items-center py-2 border-b border-warm-border/40">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-5 flex-1 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
