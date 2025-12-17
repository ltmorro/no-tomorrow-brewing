import { useState, useEffect } from 'react';
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
import type { Brew, TiltReading } from '../types/brew';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface Props {
  brew: Brew;
  readings?: TiltReading[];
}

export default function TapModal({ brew, readings = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isKicked = brew.status === 'Kicked';

  const brewDate = parseISO(brew.brew_date);
  const formattedDate = format(brewDate, 'MMM d, yyyy');
  const daysOld = differenceInDays(new Date(), brewDate);
  const freshness = formatDistanceToNow(brewDate, { addSuffix: true });

  // Freshness label
  const getFreshnessLabel = () => {
    if (daysOld <= 7) return { label: 'PEAK FRESH', color: 'text-art-deco-brass' };
    if (daysOld <= 14) return { label: 'DRINKING WELL', color: 'text-oxidized-copper' };
    if (daysOld <= 30) return { label: 'MATURE', color: 'text-stardust' };
    return { label: 'AGED', color: 'text-stardust/50' };
  };

  // Scarcity simulation (same logic as TapCard)
  const getScarcityLevel = () => {
    if (isKicked) return 0;
    if (daysOld <= 3) return 95;
    if (daysOld <= 7) return 75;
    if (daysOld <= 14) return 50;
    if (daysOld <= 21) return 25;
    return 10;
  };

  const scarcity = getScarcityLevel();
  const freshnessInfo = getFreshnessLabel();
  const attenuation = brew.og > 0 ? Math.round(((brew.og - brew.fg) / (brew.og - 1)) * 100) : 0;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Sort readings chronologically for the chart
  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Prepare chart data
  const gravityData = sortedReadings.map((r) => [
    new Date(r.timestamp).getTime(),
    r.sg,
  ]);

  const tempData = sortedReadings.map((r) => [
    new Date(r.timestamp).getTime(),
    r.temp,
  ]);

  const chartOptions: Highcharts.Options = {
    chart: {
      backgroundColor: '#161616',
      style: {
        fontFamily: '"Space Mono", monospace',
      },
      height: 250,
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: '#E8E6E1',
        fontWeight: '400',
      },
      itemHoverStyle: {
        color: '#D4AF37',
      },
    },
    xAxis: {
      type: 'datetime',
      lineColor: '#D4AF37',
      tickColor: '#D4AF37',
      labels: {
        style: {
          color: '#E8E6E1',
          fontSize: '10px',
        },
      },
      gridLineWidth: 0,
    },
    yAxis: [
      {
        title: {
          text: 'Gravity (SG)',
          style: { color: '#4B7F78' },
        },
        labels: {
          format: '{value:.3f}',
          style: { color: '#4B7F78' },
        },
        lineColor: '#4B7F78',
        lineWidth: 1,
        gridLineWidth: 0,
      },
      {
        title: {
          text: 'Temp',
          style: { color: '#D4AF37' },
        },
        labels: {
          format: '{value}°',
          style: { color: '#D4AF37' },
        },
        opposite: true,
        lineColor: '#D4AF37',
        lineWidth: 1,
        gridLineWidth: 0,
      },
    ],
    tooltip: {
      shared: true,
      backgroundColor: '#0D0D0D',
      borderColor: '#D4AF37',
      borderWidth: 1,
      style: { color: '#E8E6E1' },
      xDateFormat: '%b %d, %H:%M',
    },
    plotOptions: {
      series: {
        marker: {
          enabled: true,
          radius: 2,
        },
      },
    },
    series: [
      {
        name: 'Gravity',
        type: 'line',
        data: gravityData,
        color: '#4B7F78',
        yAxis: 0,
        marker: { symbol: 'diamond', radius: 3 },
      },
      {
        name: 'Temperature',
        type: 'spline',
        data: tempData,
        color: '#D4AF37',
        yAxis: 1,
        marker: { enabled: false },
      },
    ],
  };

  // Calculate fermentation stats
  const firstReading = sortedReadings[0];
  const lastReading = sortedReadings[sortedReadings.length - 1];
  const fermentationDays =
    firstReading && lastReading
      ? Math.round(
          (new Date(lastReading.timestamp).getTime() -
            new Date(firstReading.timestamp).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full font-mono text-xs px-3 py-2 border border-stardust/30 text-stardust/70 hover:border-art-deco-brass hover:text-art-deco-brass transition-colors flex items-center justify-center gap-2"
      >
        <span>The Story</span>
        <span className="text-art-deco-brass">→</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-void-black/90 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative bg-deep-space border border-art-deco-brass w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-deep-space border-b border-art-deco-brass/25 p-6 flex justify-between items-start z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] text-art-deco-brass/60 tracking-wider">
                    BATCH {brew.id}
                  </span>
                  {!isKicked && (
                    <span
                      className={`font-mono text-[10px] tracking-wider px-2 py-0.5 border ${freshnessInfo.color} border-current/30`}
                    >
                      {freshnessInfo.label}
                    </span>
                  )}
                  {isKicked && (
                    <span className="font-mono text-[10px] tracking-wider px-2 py-0.5 border text-nebula-red border-nebula-red/30">
                      KICKED
                    </span>
                  )}
                </div>
                <h2 className="font-sans uppercase font-semibold text-2xl tracking-widest text-stardust">
                  {brew.name}
                </h2>
                <p className="font-mono text-stardust/75 mt-1">{brew.style}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="font-mono text-stardust/50 hover:text-art-deco-brass transition-colors p-2"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-art-deco-brass/25 p-4 text-center">
                  <p className="font-mono text-2xl text-art-deco-brass">
                    {brew.abv}%
                  </p>
                  <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mt-1">
                    ABV
                  </p>
                </div>
                <div className="border border-art-deco-brass/25 p-4 text-center">
                  <p className="font-mono text-2xl text-stardust">{brew.ibu}</p>
                  <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mt-1">
                    IBU
                  </p>
                </div>
                <div className="border border-art-deco-brass/25 p-4 text-center">
                  <p className="font-mono text-2xl text-oxidized-copper">
                    {brew.og.toFixed(3)}
                  </p>
                  <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mt-1">
                    OG
                  </p>
                </div>
                <div className="border border-art-deco-brass/25 p-4 text-center">
                  <p className="font-mono text-2xl text-oxidized-copper">
                    {brew.fg.toFixed(3)}
                  </p>
                  <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mt-1">
                    FG
                  </p>
                </div>
              </div>

              {/* Freshness & Keg Level */}
              {!isKicked && (
                <div className="border border-art-deco-brass/25 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50">
                        Keg Status
                      </p>
                      <p className="font-mono text-sm text-stardust mt-1">
                        Tapped {freshness}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl text-art-deco-brass">
                        {scarcity}%
                      </p>
                      <p className="font-mono text-[10px] text-stardust/40 uppercase">
                        Remaining
                      </p>
                    </div>
                  </div>
                  {/* Keg level bar */}
                  <div className="relative h-3 bg-void-black border border-stardust/20">
                    <div
                      className={`h-full transition-all duration-500 ${
                        scarcity <= 25
                          ? 'bg-nebula-red'
                          : 'bg-gradient-to-r from-oxidized-copper to-art-deco-brass'
                      }`}
                      style={{ width: `${scarcity}%` }}
                    />
                    {/* Markers */}
                    <div className="absolute inset-y-0 left-1/4 w-px bg-stardust/20" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-stardust/20" />
                    <div className="absolute inset-y-0 left-3/4 w-px bg-stardust/20" />
                  </div>
                  {scarcity <= 25 && (
                    <p className="font-mono text-xs text-nebula-red mt-2 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-nebula-red rounded-full animate-pulse" />
                      Running low—grab one while you can
                    </p>
                  )}
                </div>
              )}

              {/* Brew Details */}
              <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
                  <span className="text-stardust/50">Brew Date</span>
                  <span className="text-stardust">{formattedDate}</span>
                </div>
                <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
                  <span className="text-stardust/50">Age</span>
                  <span className="text-stardust">{daysOld} days</span>
                </div>
                <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
                  <span className="text-stardust/50">Attenuation</span>
                  <span className="text-oxidized-copper">{attenuation}%</span>
                </div>
                {fermentationDays > 0 && (
                  <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
                    <span className="text-stardust/50">Fermented</span>
                    <span className="text-stardust">{fermentationDays} days</span>
                  </div>
                )}
              </div>

              {/* Hop Profile */}
              {brew.hops && (
                <div className="border border-art-deco-brass/25 p-4">
                  <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mb-2">
                    Hop Profile
                  </p>
                  <p className="font-mono text-stardust">{brew.hops}</p>
                </div>
              )}

              {/* Spotify Embed */}
              {brew.spotify_id && (
                <div className="border border-art-deco-brass/25">
                  <div className="border-b border-art-deco-brass/25 px-4 py-3">
                    <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/75">
                      Brewed Listening To
                    </h4>
                  </div>
                  <div className="p-4 group">
                    <div className="grayscale transition-all duration-500 group-hover:grayscale-0">
                      <iframe
                        src={`https://open.spotify.com/embed/album/${brew.spotify_id}?utm_source=generator&theme=0`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fermentation History Chart */}
              {readings.length > 0 && (
                <div className="border border-art-deco-brass">
                  <div className="border-b border-art-deco-brass/25 px-4 py-3">
                    <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/75">
                      How It Was Born
                    </h4>
                  </div>
                  <div className="p-4">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={chartOptions}
                    />
                  </div>
                  <div className="border-t border-art-deco-brass/25 px-4 py-2 flex justify-between">
                    <span className="font-mono text-xs text-stardust/50">
                      {readings.length} readings
                    </span>
                    <span className="font-mono text-xs text-stardust/50">
                      {fermentationDays > 0
                        ? `${fermentationDays} day fermentation`
                        : 'Fermentation data'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
