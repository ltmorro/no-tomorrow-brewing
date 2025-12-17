import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image';
import { useRef, useCallback } from 'react';
import type { Brew, TiltReading } from '../types/brew';

interface BrewWithData {
  brew: Brew;
  readings: TiltReading[];
}

interface Props {
  brews: BrewWithData[];
}

type SortOption = 'newest' | 'oldest' | 'abv-high' | 'abv-low' | 'attenuation' | 'og-high';

export default function LibraryBrowser({ brews }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [abvRange, setAbvRange] = useState<[number, number] | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [openLabelId, setOpenLabelId] = useState<string | null>(null);

  // Extract unique styles for filter
  const uniqueStyles = useMemo(() => {
    const styles = new Map<string, number>();
    brews.forEach(({ brew }) => {
      const baseStyle = brew.style.split(' ').slice(-1)[0];
      styles.set(baseStyle, (styles.get(baseStyle) || 0) + 1);
    });
    return Array.from(styles.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [brews]);

  // ABV range presets
  const abvRanges: { label: string; range: [number, number] }[] = [
    { label: 'Session (<5%)', range: [0, 5] },
    { label: 'Standard (5-7%)', range: [5, 7] },
    { label: 'Strong (7%+)', range: [7, 20] },
  ];

  // Filter and sort brews
  const filteredBrews = useMemo(() => {
    let result = [...brews];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        ({ brew }) =>
          brew.name.toLowerCase().includes(query) ||
          brew.style.toLowerCase().includes(query) ||
          brew.hops?.toLowerCase().includes(query) ||
          brew.id.toLowerCase().includes(query)
      );
    }

    // Style filter
    if (selectedStyle) {
      result = result.filter(({ brew }) =>
        brew.style.toLowerCase().includes(selectedStyle.toLowerCase())
      );
    }

    // ABV range filter
    if (abvRange) {
      result = result.filter(
        ({ brew }) => brew.abv >= abvRange[0] && brew.abv < abvRange[1]
      );
    }

    // Sort
    result.sort((a, b) => {
      const brewA = a.brew;
      const brewB = b.brew;
      const attenuationA = brewA.og > 0 ? ((brewA.og - brewA.fg) / (brewA.og - 1)) * 100 : 0;
      const attenuationB = brewB.og > 0 ? ((brewB.og - brewB.fg) / (brewB.og - 1)) * 100 : 0;

      switch (sortBy) {
        case 'newest':
          return new Date(brewB.brew_date).getTime() - new Date(brewA.brew_date).getTime();
        case 'oldest':
          return new Date(brewA.brew_date).getTime() - new Date(brewB.brew_date).getTime();
        case 'abv-high':
          return brewB.abv - brewA.abv;
        case 'abv-low':
          return brewA.abv - brewB.abv;
        case 'attenuation':
          return attenuationB - attenuationA;
        case 'og-high':
          return brewB.og - brewA.og;
        default:
          return 0;
      }
    });

    return result;
  }, [brews, searchQuery, selectedStyle, abvRange, sortBy]);

  // Group by year for display
  const brewsByYear = useMemo(() => {
    const groups: Record<string, BrewWithData[]> = {};
    filteredBrews.forEach((item) => {
      const year = format(new Date(item.brew.brew_date), 'yyyy');
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return groups;
  }, [filteredBrews]);

  const years = Object.keys(brewsByYear).sort((a, b) => Number(b) - Number(a));

  const hasActiveFilters = searchQuery || selectedStyle || abvRange;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStyle(null);
    setAbvRange(null);
  };

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="border border-art-deco-brass/30 bg-deep-space p-6 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <label className="block font-mono text-[10px] text-stardust/40 uppercase tracking-widest mb-2">
            Search Archives
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, style, or hops..."
              className="w-full bg-void-black border-0 border-b-2 border-stardust/20 px-0 py-3 font-mono text-sm text-stardust placeholder:text-stardust/30 focus:outline-none focus:border-art-deco-brass transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-stardust/40 hover:text-stardust font-mono text-sm px-2"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Style Filter */}
          <div className="flex-1">
            <label className="block font-mono text-[10px] text-stardust/40 uppercase tracking-widest mb-3">
              Filter by Style
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueStyles.map(([style, count]) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(selectedStyle === style ? null : style)}
                  className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                    selectedStyle === style
                      ? 'border-art-deco-brass bg-art-deco-brass/20 text-art-deco-brass'
                      : 'border-stardust/20 text-stardust/60 hover:border-stardust/40 hover:text-stardust'
                  }`}
                >
                  {style}
                  <span className="ml-2 text-[10px] opacity-50">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ABV Range */}
          <div className="md:w-64">
            <label className="block font-mono text-[10px] text-stardust/40 uppercase tracking-widest mb-3">
              ABV Range
            </label>
            <div className="flex flex-wrap gap-2">
              {abvRanges.map(({ label, range }) => (
                <button
                  key={label}
                  onClick={() =>
                    setAbvRange(
                      abvRange && abvRange[0] === range[0] && abvRange[1] === range[1]
                        ? null
                        : range
                    )
                  }
                  className={`font-mono text-xs px-3 py-1.5 border transition-all ${
                    abvRange && abvRange[0] === range[0] && abvRange[1] === range[1]
                      ? 'border-art-deco-brass bg-art-deco-brass/20 text-art-deco-brass'
                      : 'border-stardust/20 text-stardust/60 hover:border-stardust/40 hover:text-stardust'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort & Results Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-stardust/10">
          <div className="flex items-center gap-4">
            <label className="font-mono text-[10px] text-stardust/40 uppercase tracking-widest">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-void-black border border-stardust/20 px-3 py-2 font-mono text-xs text-stardust focus:outline-none focus:border-art-deco-brass cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="abv-high">Highest ABV</option>
              <option value="abv-low">Lowest ABV</option>
              <option value="attenuation">Most Attenuated</option>
              <option value="og-high">Highest OG</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="font-mono text-xs text-stardust/50 hover:text-art-deco-brass transition-colors"
              >
                Clear filters
              </button>
            )}
            <span className="font-mono text-xs text-stardust/50">
              {filteredBrews.length} {filteredBrews.length === 1 ? 'batch' : 'batches'}
              {hasActiveFilters && ` of ${brews.length}`}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredBrews.length > 0 ? (
        <div className="space-y-16">
          {years.map((year) => (
            <div key={year}>
              {/* Year header */}
              <div className="flex items-center gap-6 mb-8">
                <h2 className="font-sans uppercase font-semibold text-5xl tracking-widest text-art-deco-brass/20">
                  {year}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-art-deco-brass/30 to-transparent" />
                <span className="font-mono text-xs text-stardust/40">
                  {brewsByYear[year].length}{' '}
                  {brewsByYear[year].length === 1 ? 'batch' : 'batches'}
                </span>
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brewsByYear[year].map(({ brew, readings }, index) => (
                  <ArchiveCardWithActions
                    key={brew.id}
                    brew={brew}
                    readings={readings}
                    index={index}
                    isModalOpen={openModalId === brew.id}
                    isLabelOpen={openLabelId === brew.id}
                    onOpenModal={() => setOpenModalId(brew.id)}
                    onCloseModal={() => setOpenModalId(null)}
                    onOpenLabel={() => setOpenLabelId(brew.id)}
                    onCloseLabel={() => setOpenLabelId(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* No results */
        <div className="flex flex-col items-center justify-center py-24 border border-stardust/10">
          <div className="w-16 h-16 border border-stardust/20 flex items-center justify-center mb-6">
            <span className="font-mono text-2xl text-stardust/20">?</span>
          </div>
          <h3 className="font-sans uppercase font-light text-xl tracking-widest text-stardust/40 mb-2">
            No Matches
          </h3>
          <p className="font-mono text-sm text-stardust/30 text-center max-w-sm mb-6">
            No brews match your current filters. Try adjusting your search or clearing filters.
          </p>
          <button
            onClick={clearFilters}
            className="font-mono text-xs px-4 py-2 border border-art-deco-brass/50 text-art-deco-brass hover:border-art-deco-brass hover:bg-art-deco-brass/10 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

// Archive Card with integrated actions (Modal + Label)
interface CardProps {
  brew: Brew;
  readings: TiltReading[];
  index: number;
  isModalOpen: boolean;
  isLabelOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onOpenLabel: () => void;
  onCloseLabel: () => void;
}

function ArchiveCardWithActions({
  brew,
  readings,
  index,
  isModalOpen,
  isLabelOpen,
  onOpenModal,
  onCloseModal,
  onOpenLabel,
  onCloseLabel,
}: CardProps) {
  const formattedDate = format(new Date(brew.brew_date), 'MMM d, yyyy');
  const yearBrewed = format(new Date(brew.brew_date), 'yyyy');
  const attenuation = brew.og > 0 ? Math.round(((brew.og - brew.fg) / (brew.og - 1)) * 100) : 0;

  const getColorClass = () => {
    if (brew.og >= 1.08) return 'from-amber-900/20';
    if (brew.og >= 1.06) return 'from-amber-800/15';
    if (brew.og >= 1.045) return 'from-amber-700/10';
    return 'from-amber-600/5';
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Card */}
      <article
        className="group relative border border-art-deco-brass/30 bg-deep-space overflow-hidden transition-all duration-300 hover:border-art-deco-brass h-full flex flex-col"
        style={{ animationDelay: `${index * 75}ms` }}
      >
        {/* Vintage paper texture gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getColorClass()} to-transparent pointer-events-none`}
        />

        {/* Batch number stamp */}
        <div className="absolute -right-4 -top-4 w-24 h-24 border-2 border-art-deco-brass/10 rounded-full flex items-center justify-center rotate-12 opacity-30 group-hover:opacity-50 transition-opacity">
          <span className="font-mono text-xs text-art-deco-brass">{brew.id}</span>
        </div>

        {/* Card content */}
        <div className="relative p-6 flex flex-col flex-1">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4 mb-1">
              <h3 className="font-sans uppercase font-semibold text-lg tracking-widest text-stardust group-hover:text-art-deco-brass transition-colors leading-tight line-clamp-2 min-h-[2.5rem]">
                {brew.name}
              </h3>
              <span className="font-mono text-xl text-art-deco-brass font-bold shrink-0">
                {brew.abv}%
              </span>
            </div>
            <p className="font-mono text-sm text-stardust/60">{brew.style}</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-art-deco-brass/20" />
            <div className="w-1 h-1 bg-art-deco-brass/40 rotate-45" />
            <div className="h-px flex-1 bg-art-deco-brass/20" />
          </div>

          {/* Technical specs grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-stardust/40">OG</span>
              <span className="text-oxidized-copper tabular-nums">{brew.og.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stardust/40">FG</span>
              <span className="text-oxidized-copper tabular-nums">{brew.fg.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stardust/40">IBU</span>
              <span className="text-stardust tabular-nums">{brew.ibu}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stardust/40">Atten.</span>
              <span className="text-stardust tabular-nums">{attenuation}%</span>
            </div>
          </div>

          {/* Hops section */}
          {brew.hops && (
            <div className="mb-4 p-3 bg-void-black/50 border border-stardust/10">
              <p className="font-mono text-[10px] text-art-deco-brass uppercase tracking-wider mb-1">
                Hop Bill
              </p>
              <p className="font-mono text-xs text-stardust/70 leading-relaxed">{brew.hops}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-art-deco-brass/20 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-art-deco-brass/50 rotate-45" />
              <span className="font-mono text-xs text-stardust/40">{formattedDate}</span>
            </div>
            <span className="font-mono text-[10px] text-stardust/30 uppercase tracking-wider">
              Vol. {yearBrewed}
            </span>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-art-deco-brass/20" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-art-deco-brass/20" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-art-deco-brass/20" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-art-deco-brass/20" />
      </article>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onOpenModal}
          className="flex-1 font-mono text-xs px-3 py-2 border border-stardust/30 text-stardust/70 hover:border-art-deco-brass hover:text-art-deco-brass transition-colors flex items-center justify-center gap-2"
        >
          <span>View Details</span>
          <span className="text-art-deco-brass">→</span>
        </button>
        <button
          onClick={onOpenLabel}
          className="font-mono text-xs px-3 py-2 border border-art-deco-brass/50 text-art-deco-brass/70 hover:border-art-deco-brass hover:text-art-deco-brass hover:bg-art-deco-brass/10 transition-colors"
        >
          Label
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <BrewModal brew={brew} readings={readings} onClose={onCloseModal} />
      )}

      {/* Label Modal */}
      {isLabelOpen && <LabelModal brew={brew} onClose={onCloseLabel} />}
    </div>
  );
}

// Brew Detail Modal (inlined from BrewArchiveModal)
function BrewModal({
  brew,
  readings,
  onClose,
}: {
  brew: Brew;
  readings: TiltReading[];
  onClose: () => void;
}) {
  const formattedDate = format(new Date(brew.brew_date), 'MMM d, yyyy');
  const attenuation = brew.og > 0 ? Math.round(((brew.og - brew.fg) / (brew.og - 1)) * 100) : 0;

  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const gravityData = sortedReadings.map((r) => [new Date(r.timestamp).getTime(), r.sg]);
  const tempData = sortedReadings.map((r) => [new Date(r.timestamp).getTime(), r.temp]);

  const firstReading = sortedReadings[0];
  const lastReading = sortedReadings[sortedReadings.length - 1];
  const fermentationDays =
    firstReading && lastReading
      ? Math.round(
          (new Date(lastReading.timestamp).getTime() - new Date(firstReading.timestamp).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const chartOptions: Highcharts.Options = {
    chart: { backgroundColor: '#161616', height: 300 },
    title: { text: undefined },
    credits: { enabled: false },
    legend: {
      itemStyle: { color: '#E8E6E1', fontWeight: '400' },
      itemHoverStyle: { color: '#D4AF37' },
    },
    xAxis: {
      type: 'datetime',
      lineColor: '#D4AF37',
      tickColor: '#D4AF37',
      labels: { style: { color: '#E8E6E1', fontSize: '10px' } },
      gridLineWidth: 0,
    },
    yAxis: [
      {
        title: { text: 'Gravity (SG)', style: { color: '#4B7F78' } },
        labels: { format: '{value:.3f}', style: { color: '#4B7F78' } },
        lineColor: '#4B7F78',
        lineWidth: 1,
        gridLineWidth: 0,
      },
      {
        title: { text: 'Temp (°F)', style: { color: '#D4AF37' } },
        labels: { format: '{value}°', style: { color: '#D4AF37' } },
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-void-black/90 backdrop-blur-sm" />
      <div
        className="relative bg-deep-space border border-art-deco-brass w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-deep-space border-b border-art-deco-brass/25 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="font-sans uppercase font-semibold text-2xl tracking-widest text-art-deco-brass">
              {brew.name}
            </h2>
            <p className="font-mono text-stardust/75 mt-1">{brew.style}</p>
          </div>
          <button
            onClick={onClose}
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
              <p className="font-mono text-2xl text-art-deco-brass">{brew.abv}%</p>
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
              <p className="font-mono text-2xl text-oxidized-copper">{brew.og.toFixed(3)}</p>
              <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mt-1">
                OG
              </p>
            </div>
            <div className="border border-art-deco-brass/25 p-4 text-center">
              <p className="font-mono text-2xl text-oxidized-copper">{brew.fg.toFixed(3)}</p>
              <p className="font-sans uppercase font-light text-xs tracking-widest text-stardust/50 mt-1">
                FG
              </p>
            </div>
          </div>

          {/* Brew Details */}
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
              <span className="text-stardust/50">Batch ID</span>
              <span className="text-stardust">{brew.id}</span>
            </div>
            <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
              <span className="text-stardust/50">Brew Date</span>
              <span className="text-stardust">{formattedDate}</span>
            </div>
            <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
              <span className="text-stardust/50">Attenuation</span>
              <span className="text-oxidized-copper">{attenuation}%</span>
            </div>
            {fermentationDays > 0 && (
              <div className="flex justify-between border-b border-art-deco-brass/25 pb-2">
                <span className="text-stardust/50">Fermentation</span>
                <span className="text-stardust">{fermentationDays} days</span>
              </div>
            )}
          </div>

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
                  Sonic Terroir
                </h4>
              </div>
              <div className="p-4">
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
          )}

          {/* Fermentation Chart */}
          {readings.length > 0 ? (
            <div className="border border-art-deco-brass">
              <div className="border-b border-art-deco-brass/25 px-4 py-3">
                <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/75">
                  Fermentation History
                </h4>
              </div>
              <div className="p-4">
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
              </div>
              <div className="border-t border-art-deco-brass/25 px-4 py-2 flex justify-between">
                <span className="font-mono text-xs text-stardust/50">{readings.length} readings</span>
                <span className="font-mono text-xs text-stardust/50">
                  {fermentationDays > 0 ? `${fermentationDays} day fermentation` : 'Historical data'}
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-art-deco-brass/25 p-8 text-center">
              <p className="font-mono text-stardust/50 text-sm">
                No fermentation telemetry recorded for this batch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Label Modal (inlined from LabelMaker)
function LabelModal({ brew, onClose }: { brew: Brew; onClose: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadLabel = useCallback(async () => {
    if (!labelRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(labelRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#0D0D0D',
      });
      const link = document.createElement('a');
      link.download = `${brew.id}-label.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate label:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [brew.id]);

  return (
    <div
      className="fixed inset-0 bg-void-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-deep-space border border-art-deco-brass max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="border-b border-art-deco-brass/25 px-4 py-3 flex justify-between items-center">
          <h3 className="font-sans uppercase font-light text-sm tracking-widest text-stardust">
            Label Preview
          </h3>
          <button
            onClick={onClose}
            className="text-stardust/50 hover:text-stardust text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Label Preview */}
        <div className="p-6 flex justify-center">
          <div
            ref={labelRef}
            className="bg-void-black border-2 border-art-deco-brass p-6 w-64"
            style={{ fontFamily: '"Space Mono", monospace' }}
          >
            <div className="text-center mb-4 pb-4 border-b border-art-deco-brass/50">
              <p
                className="text-art-deco-brass text-xs tracking-[0.3em] uppercase"
                style={{ fontFamily: '"Josefin Sans", sans-serif' }}
              >
                No Tomorrow
              </p>
              <p
                className="text-art-deco-brass text-xs tracking-[0.2em] uppercase"
                style={{ fontFamily: '"Josefin Sans", sans-serif' }}
              >
                Brewing Co.
              </p>
            </div>
            <div className="text-center mb-4">
              <h4
                className="text-stardust text-lg uppercase tracking-widest leading-tight"
                style={{ fontFamily: '"Josefin Sans", sans-serif' }}
              >
                {brew.name}
              </h4>
              <p className="text-stardust/50 text-xs mt-1">{brew.style}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 text-center">
              <div className="border border-art-deco-brass/25 p-2">
                <p className="text-stardust/50 text-[10px] uppercase">ABV</p>
                <p className="text-art-deco-brass text-lg">{brew.abv}%</p>
              </div>
              <div className="border border-art-deco-brass/25 p-2">
                <p className="text-stardust/50 text-[10px] uppercase">IBU</p>
                <p className="text-oxidized-copper text-lg">{brew.ibu}</p>
              </div>
            </div>
            {brew.hops && (
              <div className="text-center mb-4 py-2 border-t border-b border-art-deco-brass/25">
                <p className="text-stardust/50 text-[10px] uppercase mb-1">Hops</p>
                <p className="text-stardust text-xs">{brew.hops}</p>
              </div>
            )}
            <div className="text-center mb-4">
              <p className="text-stardust/50 text-[10px] uppercase">Brewed</p>
              <p className="text-stardust text-sm">{formatDate(brew.brew_date)}</p>
            </div>
            <div className="flex justify-center pt-2 border-t border-art-deco-brass/50">
              <Barcode
                value={brew.id}
                width={1.5}
                height={40}
                fontSize={10}
                background="#0D0D0D"
                lineColor="#E8E6E1"
                margin={0}
                displayValue={true}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="border-t border-art-deco-brass/25 px-4 py-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="font-mono text-xs px-4 py-2 border border-stardust/25 text-stardust/50 hover:text-stardust hover:border-stardust/50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={downloadLabel}
            disabled={isGenerating}
            className="font-mono text-xs px-4 py-2 border border-art-deco-brass bg-art-deco-brass text-void-black hover:bg-art-deco-brass/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Download PNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
