import React from 'react';

interface SkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 10, cols = 8, className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Header row */}
      <div className="flex gap-2 mb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-700 rounded flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2 mb-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-5 bg-slate-800 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonLine({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return <div className="animate-pulse bg-slate-700 rounded" style={{ width, height }} />;
}
