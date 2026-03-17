import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import type { Brew, BrewStatus } from '../types/brew';
import { getDaysOld, getFreshnessLabel, getScarcityLevel } from '../utils/brewCalculations';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MASTER_LOG_URL = import.meta.env.PUBLIC_MASTER_LOG_URL;

// Sample data fallback for when no Google Sheets URL is configured
const sampleBrews: Brew[] = [
  {
    id: 'NTB-001',
    name: 'Void Stout',
    style: 'Imperial Stout',
    abv: 9.2,
    ibu: 55,
    brew_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'On Tap',
    og: 1.092,
    fg: 1.022,
    hops: 'Magnum, Fuggle',
  },
  {
    id: 'NTB-002',
    name: 'Brass Lager',
    style: 'Vienna Lager',
    abv: 5.4,
    ibu: 25,
    brew_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'On Tap',
    og: 1.052,
    fg: 1.012,
    hops: 'Saaz, Hallertau',
  },
];

async function fetchBrewsFromSheet(): Promise<Brew[]> {
  if (!MASTER_LOG_URL) {
    console.warn('No Google Sheets URL configured, using sample data');
    return sampleBrews;
  }

  try {
    const response = await fetch(MASTER_LOG_URL);
    const csvText = await response.text();

    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    return data.map((row) => ({
      id: row.id || '',
      name: row.name || '',
      style: row.style || '',
      abv: parseFloat(row.abv) || 0,
      ibu: parseInt(row.ibu) || 0,
      brew_date: row.brew_date || '',
      status: (row.status as BrewStatus) || 'Archive',
      og: parseFloat(row.og) || 0,
      fg: parseFloat(row.fg) || 0,
      hops: row.hops || '',
      spotify_id: row.spotify_id || undefined,
      tilt_color: row.tilt_color || undefined,
      tilt_sheet_id: row.tilt_sheet_id || undefined,
    }));
  } catch (error) {
    console.error('Error fetching brews:', error);
    return sampleBrews;
  }
}

interface TvTapCardProps {
  brew: Brew;
}

function TvTapCard({ brew }: TvTapCardProps) {
  const isKicked = brew.status === 'Kicked';
  const daysOld = getDaysOld(brew.brew_date);
  const freshnessLabel = getFreshnessLabel(daysOld);
  const scarcity = getScarcityLevel(daysOld, isKicked);
  const isRunningLow = scarcity <= 25 && !isKicked;

  return (
    <article
      className={`relative border bg-deep-space flex flex-col overflow-hidden h-full p-6 lg:p-8 gap-3 lg:gap-4 ${
        isKicked
          ? 'border-nebula-red/50 opacity-50'
          : 'border-art-deco-brass/60'
      }`}
    >
      {/* Batch number watermark */}
      <span className="absolute -right-2 -top-4 font-mono font-bold text-7xl lg:text-9xl text-art-deco-brass/5 select-none">
        {brew.id.split('-')[1]}
      </span>

      {/* Header with name and ABV */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs lg:text-sm text-art-deco-brass/60 tracking-wider">
            BATCH {brew.id}
          </span>
          <h2
            className={`font-sans uppercase font-semibold tracking-widest leading-tight mt-1 text-xl lg:text-3xl xl:text-4xl ${
              isKicked ? 'text-nebula-red line-through decoration-2' : 'text-stardust'
            }`}
          >
            {brew.name}
          </h2>
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono text-3xl lg:text-5xl text-art-deco-brass font-bold">
            {brew.abv}
          </span>
          <span className="font-mono text-sm lg:text-lg text-stardust/50">%</span>
        </div>
      </div>

      {/* Style */}
      <p className="font-mono text-base lg:text-xl text-stardust/75">{brew.style}</p>

      {/* Stats row */}
      <div className="flex gap-4 lg:gap-6 font-mono text-sm lg:text-base">
        {brew.ibu > 0 && <span className="text-oxidized-copper">{brew.ibu} IBU</span>}
        {brew.og && <span className="text-stardust/50">OG {brew.og.toFixed(3)}</span>}
      </div>

      {/* Bottom section */}
      <div className="mt-auto border-t border-stardust/10 pt-4 lg:pt-6">
        {isKicked ? (
          <div className="flex items-center gap-3">
            <span className="inline-block w-3 h-3 lg:w-4 lg:h-4 bg-nebula-red rounded-full" />
            <span className="font-mono text-sm lg:text-lg text-nebula-red uppercase tracking-wider">
              Kicked
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`inline-block w-3 h-3 lg:w-4 lg:h-4 rounded-full ${
                  isRunningLow ? 'bg-nebula-red animate-pulse' : 'bg-oxidized-copper'
                }`}
              />
              <span
                className={`font-mono text-xs lg:text-base uppercase tracking-wider ${
                  isRunningLow ? 'text-nebula-red' : 'text-stardust/50'
                }`}
              >
                {isRunningLow ? 'Running Low' : freshnessLabel}
              </span>
            </div>
            {/* Keg level indicator */}
            <div className="flex items-center gap-3">
              <div className="w-20 lg:w-32 h-2 lg:h-3 bg-stardust/10 overflow-hidden">
                <div
                  className={`h-full ${isRunningLow ? 'bg-nebula-red' : 'bg-oxidized-copper'}`}
                  style={{ width: `${scarcity}%` }}
                />
              </div>
              <span className="font-mono text-xs lg:text-sm text-stardust/40">{scarcity}%</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

interface TvDashboardProps {
  logoUrl: string;
}

export default function TvDashboard({ logoUrl }: TvDashboardProps) {
  const [brews, setBrews] = useState<Brew[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const allBrews = await fetchBrewsFromSheet();
      const onTap = allBrews.filter((b) => b.status === 'On Tap');
      const kicked = allBrews.filter((b) => b.status === 'Kicked');
      setBrews([...onTap, ...kicked]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching brews:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval for auto-refresh
    const intervalId = setInterval(fetchData, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const pouringCount = brews.filter((b) => b.status !== 'Kicked').length;

  const getGridClasses = () => {
    const count = brews.length;
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    if (count === 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-oxidized-copper rounded-full animate-pulse" />
          <span className="font-mono text-xl text-stardust/50">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-6 lg:p-8">
      {/* Compact header */}
      <header className="flex items-center justify-between mb-6 lg:mb-8 shrink-0">
        <div className="flex items-center gap-4 lg:gap-6">
          <img
            src={logoUrl}
            alt="No Tomorrow Brewing"
            className="w-20 lg:w-24"
          />
          <div>
            <h1 className="font-sans uppercase font-semibold text-2xl lg:text-4xl tracking-widest text-stardust">
              On Tap
            </h1>
            <p className="font-mono text-xs lg:text-sm text-stardust/40 uppercase tracking-wider">
              {pouringCount} Pouring
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 lg:w-3 lg:h-3 bg-oxidized-copper rounded-full animate-pulse" />
            <span className="font-mono text-xs lg:text-sm text-stardust/50 uppercase tracking-wider hidden sm:inline">
              Live
            </span>
          </div>
        </div>
      </header>

      {/* Tap grid - maximized */}
      <div className="flex-1 min-h-0">
        {brews.length > 0 ? (
          <div className={`grid gap-4 lg:gap-6 h-full auto-rows-fr ${getGridClasses()}`}>
            {brews.map((brew) => (
              <TvTapCard key={brew.id} brew={brew} />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center border border-stardust/10">
            <p className="font-mono text-xl lg:text-2xl text-stardust/50">
              Kegs are dry. Something's brewing.
            </p>
          </div>
        )}
      </div>

      {/* Footer timestamp */}
      <footer className="shrink-0 mt-4 lg:mt-6 flex items-center justify-between text-stardust/30">
        <span className="font-mono text-xs lg:text-sm">notomorrowbrewing.co</span>
        <span className="font-mono text-xs lg:text-sm">
          Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </footer>
    </div>
  );
}
