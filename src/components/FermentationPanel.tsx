import { useState, useEffect } from 'react';
import { format, differenceInHours } from 'date-fns';
import type { Brew, TiltReading } from '../types/brew';
import { fetchFermentationDataForBrew } from '../utils/googleSheets';
import { TelemetryGridSkeleton, ChartSkeleton } from './Skeletons';
import LiveGraph from './LiveGraph';
import SpotifyEmbed from './SpotifyEmbed';

interface Props {
  brew: Brew;
}

export default function FermentationPanel({ brew }: Props) {
  const [readings, setReadings] = useState<TiltReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const data = await fetchFermentationDataForBrew(brew);
        if (!cancelled) {
          setReadings(data);
          setLoading(false);

          // Dispatch latest reading for the status bar
          if (data.length > 0) {
            const latest = data[data.length - 1];
            window.dispatchEvent(
              new CustomEvent('fermentation-update', {
                detail: { timestamp: latest.timestamp, temp: latest.temp },
              })
            );
          }
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [brew.tilt_sheet_id, brew.name]);

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const oldestReading = readings.length > 0 ? readings[0] : null;
  const brewDate = new Date(brew.brew_date);
  const hoursFermenting = differenceInHours(new Date(), brewDate);
  const daysFermenting = Math.floor(hoursFermenting / 24);
  const remainingHours = hoursFermenting % 24;

  // Progress
  const totalDrop = brew.og - brew.fg;
  const currentDrop = latestReading ? brew.og - latestReading.sg : 0;
  const progressPercent = totalDrop > 0 ? Math.min(100, Math.round((currentDrop / totalDrop) * 100)) : 0;

  // Drop rate (points per day)
  const getDropRate = () => {
    if (!latestReading || !oldestReading || readings.length < 2) return '0.0';
    const sgDrop = (oldestReading.sg - latestReading.sg) * 1000;
    const hoursBetween = differenceInHours(new Date(latestReading.timestamp), new Date(oldestReading.timestamp));
    if (hoursBetween === 0) return '0.0';
    return ((sgDrop / hoursBetween) * 24).toFixed(1);
  };

  // Temp trend
  const getTempTrend = () => {
    if (readings.length < 10) return 'stable';
    const recent = readings.slice(-10);
    const older = readings.slice(-20, -10);
    if (older.length === 0) return 'stable';
    const recentAvg = recent.reduce((sum, r) => sum + r.temp, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.temp, 0) / older.length;
    if (recentAvg > olderAvg + 0.5) return 'rising';
    if (recentAvg < olderAvg - 0.5) return 'falling';
    return 'stable';
  };

  const dropRate = getDropRate();
  const tempTrend = getTempTrend();
  const currentAbv = latestReading ? ((brew.og - latestReading.sg) * 131.25).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Fermentation Card */}
      <article className="border border-oxidized-copper/50 bg-deep-space overflow-hidden">
        {/* Header bar */}
        <div className="bg-oxidized-copper/10 border-b border-oxidized-copper/30 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-oxidized-copper rounded-full animate-pulse" />
            <span className="font-mono text-xs text-oxidized-copper uppercase tracking-wider">Vessel Active</span>
          </div>
          <span className="font-mono text-xs text-stardust/40">
            {format(brewDate, 'MMM d, yyyy')} — Day {daysFermenting + 1}
          </span>
        </div>

        <div className="p-6">
          {loading ? (
            <TelemetryGridSkeleton />
          ) : error ? (
            <div className="text-center py-8 border border-nebula-red/20 mb-6">
              <p className="font-mono text-nebula-red/60 text-sm">Telemetry link lost.</p>
            </div>
          ) : latestReading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Current Gravity */}
              <div className="border border-art-deco-brass/20 bg-void-black p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-oxidized-copper/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider mb-1">Gravity</p>
                <p className="font-mono text-3xl text-oxidized-copper tabular-nums">{latestReading.sg.toFixed(3)}</p>
                <p className="font-mono text-[10px] text-stardust/30 mt-1">Target: {brew.fg.toFixed(3)}</p>
              </div>

              {/* Temperature */}
              <div className="border border-art-deco-brass/20 bg-void-black p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-art-deco-brass/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider mb-1">Temperature</p>
                <div className="flex items-baseline gap-1">
                  <p className="font-mono text-3xl text-art-deco-brass tabular-nums">{latestReading.temp.toFixed(1)}</p>
                  <span className="font-mono text-lg text-art-deco-brass/60">°F</span>
                </div>
                <p className="font-mono text-[10px] text-stardust/30 mt-1 flex items-center gap-1">
                  {tempTrend === 'rising' && <span className="text-nebula-red">↑</span>}
                  {tempTrend === 'falling' && <span className="text-oxidized-copper">↓</span>}
                  {tempTrend === 'stable' && <span className="text-stardust/50">→</span>}
                  {tempTrend}
                </p>
              </div>

              {/* Current ABV */}
              <div className="border border-art-deco-brass/20 bg-void-black p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-stardust/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider mb-1">Current ABV</p>
                <div className="flex items-baseline gap-1">
                  <p className="font-mono text-3xl text-stardust tabular-nums">{currentAbv}</p>
                  <span className="font-mono text-lg text-stardust/60">%</span>
                </div>
                <p className="font-mono text-[10px] text-stardust/30 mt-1">Est. Final: {brew.abv}%</p>
              </div>

              {/* Drop Rate */}
              <div className="border border-art-deco-brass/20 bg-void-black p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-oxidized-copper/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <p className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider mb-1">Drop Rate</p>
                <div className="flex items-baseline gap-1">
                  <p className="font-mono text-3xl text-oxidized-copper tabular-nums">{dropRate}</p>
                  <span className="font-mono text-xs text-stardust/40">pts/day</span>
                </div>
                <p className="font-mono text-[10px] text-stardust/30 mt-1">
                  {Number(dropRate) > 5 ? 'Active' : Number(dropRate) > 1 ? 'Slowing' : 'Near Complete'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-stardust/10 mb-6">
              <p className="font-mono text-stardust/40 text-sm">Awaiting telemetry data...</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider">Attenuation Progress</span>
              <span className="font-mono text-sm text-art-deco-brass">{progressPercent}%</span>
            </div>
            <div className="h-5 bg-void-black border border-art-deco-brass/20 relative overflow-hidden">
              <div className="absolute inset-0 flex pointer-events-none z-0">
                {[25, 50, 75].map((mark) => (
                  <div key={mark} className="flex-1 border-r border-stardust/10 last:border-r-0" />
                ))}
              </div>
              <div
                className="absolute bottom-0 left-0 h-full bg-gradient-to-t from-oxidized-copper via-oxidized-copper to-art-deco-brass transition-all duration-1000 liquid-fill"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="liquid-shine" />
                <div className="absolute bottom-0 left-1/4 w-1 h-1 bg-white/20 rounded-full bubble" style={{ '--duration': '2.5s', '--delay': '0s' } as React.CSSProperties} />
                <div className="absolute bottom-0 left-1/2 w-0.5 h-0.5 bg-white/15 rounded-full bubble" style={{ '--duration': '3s', '--delay': '0.8s' } as React.CSSProperties} />
                <div className="absolute bottom-0 left-3/4 w-1 h-1 bg-white/20 rounded-full bubble" style={{ '--duration': '2.8s', '--delay': '1.5s' } as React.CSSProperties} />
                <div className="absolute bottom-1 left-[15%] w-0.5 h-0.5 bg-white/10 rounded-full bubble" style={{ '--duration': '3.2s', '--delay': '0.3s' } as React.CSSProperties} />
                <div className="absolute bottom-0 left-[60%] w-1 h-1 bg-white/15 rounded-full bubble" style={{ '--duration': '2.6s', '--delay': '1.2s' } as React.CSSProperties} />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-stardust/30">OG {brew.og.toFixed(3)}</span>
              <span className="font-mono text-[10px] text-stardust/30">FG {brew.fg.toFixed(3)}</span>
            </div>
          </div>

          {/* Bottom stats row */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-art-deco-brass/20">
            <div className="text-center">
              <p className="font-mono text-[10px] text-stardust/40 uppercase">OG</p>
              <p className="font-mono text-sm text-stardust">{brew.og.toFixed(3)}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] text-stardust/40 uppercase">Target FG</p>
              <p className="font-mono text-sm text-stardust">{brew.fg.toFixed(3)}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] text-stardust/40 uppercase">Target ABV</p>
              <p className="font-mono text-sm text-stardust">{brew.abv}%</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] text-stardust/40 uppercase">Duration</p>
              <p className="font-mono text-sm text-stardust">{daysFermenting}d {remainingHours}h</p>
            </div>
          </div>

          {/* Last update timestamp */}
          {latestReading && (
            <p className="font-mono text-[10px] text-stardust/30 text-center mt-4">
              Last reading: {format(new Date(latestReading.timestamp), 'MMM d, h:mm a')}
            </p>
          )}
        </div>
      </article>

      {/* Live graph */}
      {loading ? (
        <div className="border border-art-deco-brass/20 bg-deep-space p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-oxidized-copper rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider">Live Telemetry Feed</span>
          </div>
          <ChartSkeleton />
        </div>
      ) : readings.length > 0 ? (
        <div className="border border-art-deco-brass/20 bg-deep-space p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-oxidized-copper rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-stardust/40 uppercase tracking-wider">Live Telemetry Feed</span>
          </div>
          <LiveGraph readings={readings} brewName={brew.name} />
        </div>
      ) : null}

      {/* Spotify embed */}
      {brew.spotify_id && (
        <SpotifyEmbed
          spotifyId={brew.spotify_id}
          spotifyType={brew.spotify_type ?? 'album'}
          title="Fermenting To"
        />
      )}
    </div>
  );
}
