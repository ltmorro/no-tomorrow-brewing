/**
 * Skeleton loader components with telemetry-inspired animations
 * Extends the scramble effect aesthetic to loading states
 */

import { useEffect, useState } from 'react';

// Scrambling number display for skeleton loaders
function ScrambleNumber({ decimals = 3, className = '' }: { decimals?: number; className?: string }) {
  const [value, setValue] = useState('0'.repeat(decimals ? decimals + 2 : 3));

  useEffect(() => {
    const interval = setInterval(() => {
      const randomValue = (Math.random() * 1.1).toFixed(decimals);
      setValue(randomValue);
    }, 80);
    return () => clearInterval(interval);
  }, [decimals]);

  return (
    <span className={`tabular-nums ${className}`}>
      {value}
    </span>
  );
}

// Chart skeleton with animated "data" lines
export function ChartSkeleton() {
  return (
    <div className="border border-art-deco-brass bg-deep-space">
      <div className="border-b border-art-deco-brass/25 px-4 py-3">
        <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/75">
          Fermentation Telemetry
        </h4>
      </div>
      <div className="p-4">
        {/* Chart area skeleton */}
        <div className="h-[350px] relative overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-10 bg-oxidized-copper/20 skeleton-shimmer" />
            ))}
          </div>

          {/* Chart grid */}
          <div className="absolute left-14 right-12 top-4 bottom-8">
            {/* Horizontal grid lines */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-art-deco-brass/10"
                style={{ top: `${i * 25}%` }}
              />
            ))}

            {/* Animated "data" line - gravity */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path
                className="skeleton-line-gravity"
                fill="none"
                stroke="rgba(75, 127, 120, 0.4)"
                strokeWidth="2"
                d="M0,20 Q50,25 100,35 T200,45 T300,60 T400,70"
              />
              <path
                className="skeleton-line-temp"
                fill="none"
                stroke="rgba(212, 175, 55, 0.3)"
                strokeWidth="2"
                d="M0,50 Q50,48 100,52 T200,49 T300,51 T400,50"
              />
            </svg>

            {/* Scanning line effect */}
            <div className="skeleton-scan-line" />
          </div>

          {/* Y-axis labels (right) */}
          <div className="absolute right-0 top-0 bottom-8 w-10 flex flex-col justify-between py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-8 bg-art-deco-brass/20 skeleton-shimmer" />
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-14 right-12 h-6 flex justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-12 bg-stardust/10 skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-art-deco-brass/25 px-4 py-2 flex justify-between">
        <span className="font-mono text-xs text-stardust/30">
          <ScrambleNumber decimals={0} className="text-stardust/30" /> readings
        </span>
        <span className="font-mono text-xs text-stardust/30">
          Loading data...
        </span>
      </div>
    </div>
  );
}

// Telemetry card skeleton (for fermentation stats)
export function TelemetryCardSkeleton() {
  return (
    <div className="border border-art-deco-brass/20 bg-void-black p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-oxidized-copper/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="h-3 w-16 bg-stardust/10 skeleton-shimmer mb-2" />
      <div className="font-mono text-3xl text-oxidized-copper/50">
        <ScrambleNumber decimals={3} className="text-oxidized-copper/50" />
      </div>
      <div className="h-2 w-20 bg-stardust/10 skeleton-shimmer mt-2" />
    </div>
  );
}

// Grid of telemetry cards skeleton
export function TelemetryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <TelemetryCardSkeleton />
      <TelemetryCardSkeleton />
      <TelemetryCardSkeleton />
      <TelemetryCardSkeleton />
    </div>
  );
}

// Tap card skeleton
export function TapCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="border border-art-deco-brass/30 bg-deep-space p-6 animate-fade-up relative overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Batch number watermark */}
      <span className="absolute -right-2 -top-2 font-mono text-6xl font-bold text-art-deco-brass/5 select-none">
        ##
      </span>

      {/* Header area */}
      <div className="mb-4">
        <div className="h-6 w-3/4 bg-stardust/10 skeleton-shimmer mb-2" />
        <div className="h-4 w-1/2 bg-stardust/5 skeleton-shimmer" />
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-4">
        <div className="h-4 w-16 bg-art-deco-brass/10 skeleton-shimmer" />
        <div className="h-4 w-12 bg-oxidized-copper/10 skeleton-shimmer" />
      </div>

      {/* Freshness meter */}
      <div className="h-2 w-full bg-art-deco-brass/10 skeleton-shimmer" />
    </article>
  );
}

// Full page loading skeleton with scramble effect
export function PageLoadingSkeleton({ message = 'Initializing systems...' }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative mb-8">
        {/* Scrambling numbers background */}
        <div className="font-mono text-6xl text-art-deco-brass/20 flex gap-2">
          <ScrambleNumber decimals={3} />
          <ScrambleNumber decimals={3} />
          <ScrambleNumber decimals={3} />
        </div>
      </div>
      <p className="font-mono text-sm text-stardust/50">{message}</p>
      <div className="flex items-center gap-2 mt-4">
        <div className="w-2 h-2 bg-oxidized-copper rounded-full animate-pulse" />
        <span className="font-mono text-xs text-oxidized-copper/60 uppercase tracking-wider">
          Transmitting
        </span>
      </div>
    </div>
  );
}
