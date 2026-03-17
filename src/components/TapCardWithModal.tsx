import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Brew, TiltReading } from '../types/brew';
import BeerModal from './BeerModal';
import {
  getDaysOld,
  getFreshnessLabel,
  getScarcityLevel,
} from '../utils/brewCalculations';

interface Props {
  brew: Brew;
  readings?: TiltReading[];
  index?: number;
}

export default function TapCardWithModal({ brew, readings = [], index = 0 }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isKicked = brew.status === 'Kicked';

  // Calculate freshness using shared utilities
  const brewDate = parseISO(brew.brew_date);
  const daysOld = getDaysOld(brew.brew_date);
  const freshness = formatDistanceToNow(brewDate, { addSuffix: true });
  const freshnessLabel = getFreshnessLabel(daysOld);
  const scarcity = getScarcityLevel(daysOld, isKicked);
  const isRunningLow = scarcity <= 25 && !isKicked;

  return (
    <>
      <article
        onClick={() => setIsOpen(true)}
        className={`group relative border bg-deep-space p-6 flex flex-col gap-4 transition-all duration-300 overflow-hidden animate-fade-up h-full cursor-pointer ${
          isKicked
            ? 'border-nebula-red/50 opacity-60'
            : 'border-art-deco-brass/60 hover:border-art-deco-brass hover:brass-glow'
        }`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Batch number watermark */}
        <span className="absolute -right-2 -top-2 font-mono text-6xl font-bold text-art-deco-brass/5 select-none">
          {brew.id.split('-')[1]}
        </span>

        {/* Header with name and ABV */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[10px] text-art-deco-brass/60 tracking-wider">
              BATCH {brew.id}
            </span>
            <h3
              className={`font-sans uppercase font-semibold text-lg tracking-widest leading-tight mt-1 line-clamp-2 min-h-[2.5rem] ${
                isKicked
                  ? 'text-nebula-red line-through decoration-1'
                  : 'text-stardust group-hover:text-art-deco-brass transition-colors'
              }`}
            >
              {brew.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <span className="font-mono text-xl text-art-deco-brass font-bold">
              {brew.abv}
            </span>
            <span className="font-mono text-xs text-stardust/50">%</span>
          </div>
        </div>

        {/* Style */}
        <p className="font-mono text-sm text-stardust/75">{brew.style}</p>

        {/* Stats row */}
        <div className="flex gap-4 text-xs font-mono">
          {brew.ibu > 0 && (
            <span className="text-oxidized-copper">{brew.ibu} IBU</span>
          )}
          {brew.og && (
            <span className="text-stardust/50">OG {brew.og.toFixed(3)}</span>
          )}
        </div>

        {/* Bottom section */}
        <div className="mt-auto pt-4 border-t border-stardust/10">
          {isKicked ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-nebula-red rounded-full" />
              <span className="font-mono text-xs text-nebula-red uppercase tracking-wider">
                Kicked
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isRunningLow ? 'bg-nebula-red animate-pulse' : 'bg-oxidized-copper'
                  }`}
                />
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider ${
                    isRunningLow ? 'text-nebula-red' : 'text-stardust/50'
                  }`}
                >
                  {isRunningLow ? 'Running Low' : freshnessLabel}
                </span>
              </div>
              {/* Keg level indicator */}
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-stardust/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isRunningLow ? 'bg-nebula-red' : 'bg-oxidized-copper'
                    }`}
                    style={{ width: `${scarcity}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-stardust/40">
                  {scarcity}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Corner accent */}
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-art-deco-brass/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </article>

      <BeerModal
        brew={brew}
        readings={readings}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        showKegStatus={true}
      />
    </>
  );
}
