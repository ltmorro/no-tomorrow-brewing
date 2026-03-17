import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import type { Brew, TiltReading } from '../types/brew';
import BeerModal from './BeerModal';
import ShareModal from './ShareModal';
import { calculateAttenuation } from '../utils/brewCalculations';
import { generateBackground } from '../utils/generativeArt';
import { fetchFermentationDataForBrew } from '../utils/googleSheets';

interface Props {
  brews: Brew[];
}

// Cache for fetched readings to avoid re-fetching on modal reopen
type ReadingsCache = Record<string, { readings: TiltReading[]; loading: boolean }>;

type SortOption = 'newest' | 'oldest' | 'abv-high' | 'abv-low' | 'attenuation' | 'og-high';

export default function LibraryBrowser({ brews }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [abvRange, setAbvRange] = useState<[number, number] | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [openLabelId, setOpenLabelId] = useState<string | null>(null);
  const [openShareId, setOpenShareId] = useState<string | null>(null);

  // Cache for lazily-loaded fermentation readings
  const [readingsCache, setReadingsCache] = useState<ReadingsCache>({});

  // Fetch fermentation data when a modal is opened
  const handleOpenModal = useCallback(async (brew: Brew) => {
    setOpenModalId(brew.id);

    // Skip if already cached or currently loading
    if (readingsCache[brew.id]) return;

    // Mark as loading
    setReadingsCache((prev) => ({
      ...prev,
      [brew.id]: { readings: [], loading: true },
    }));

    // Fetch the data
    const readings = await fetchFermentationDataForBrew(brew);

    // Cache the result
    setReadingsCache((prev) => ({
      ...prev,
      [brew.id]: { readings, loading: false },
    }));
  }, [readingsCache]);

  // Extract unique styles for filter
  const uniqueStyles = useMemo(() => {
    const styles = new Map<string, number>();
    brews.forEach((brew) => {
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
        (brew) =>
          brew.name.toLowerCase().includes(query) ||
          brew.style.toLowerCase().includes(query) ||
          brew.hops?.toLowerCase().includes(query) ||
          brew.id.toLowerCase().includes(query)
      );
    }

    // Style filter
    if (selectedStyle) {
      result = result.filter((brew) =>
        brew.style.toLowerCase().includes(selectedStyle.toLowerCase())
      );
    }

    // ABV range filter
    if (abvRange) {
      result = result.filter(
        (brew) => brew.abv >= abvRange[0] && brew.abv < abvRange[1]
      );
    }

    // Sort
    result.sort((a, b) => {
      const attenuationA = calculateAttenuation(a.og, a.fg);
      const attenuationB = calculateAttenuation(b.og, b.fg);

      switch (sortBy) {
        case 'newest':
          return new Date(b.brew_date).getTime() - new Date(a.brew_date).getTime();
        case 'oldest':
          return new Date(a.brew_date).getTime() - new Date(b.brew_date).getTime();
        case 'abv-high':
          return b.abv - a.abv;
        case 'abv-low':
          return a.abv - b.abv;
        case 'attenuation':
          return attenuationB - attenuationA;
        case 'og-high':
          return b.og - a.og;
        default:
          return 0;
      }
    });

    return result;
  }, [brews, searchQuery, selectedStyle, abvRange, sortBy]);

  // Group by year for display
  const brewsByYear = useMemo(() => {
    const groups: Record<string, Brew[]> = {};
    filteredBrews.forEach((brew) => {
      const year = format(new Date(brew.brew_date), 'yyyy');
      if (!groups[year]) groups[year] = [];
      groups[year].push(brew);
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
                {brewsByYear[year].map((brew, index) => (
                  <ArchiveCardWithActions
                    key={brew.id}
                    brew={brew}
                    readings={readingsCache[brew.id]?.readings || []}
                    isLoadingReadings={readingsCache[brew.id]?.loading || false}
                    index={index}
                    isModalOpen={openModalId === brew.id}
                    isLabelOpen={openLabelId === brew.id}
                    isShareOpen={openShareId === brew.id}
                    onOpenModal={() => handleOpenModal(brew)}
                    onCloseModal={() => setOpenModalId(null)}
                    onOpenLabel={() => setOpenLabelId(brew.id)}
                    onCloseLabel={() => setOpenLabelId(null)}
                    onOpenShare={() => setOpenShareId(brew.id)}
                    onCloseShare={() => setOpenShareId(null)}
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

// Archive Card with integrated actions (Modal + Label + Share)
interface CardProps {
  brew: Brew;
  readings: TiltReading[];
  isLoadingReadings: boolean;
  index: number;
  isModalOpen: boolean;
  isLabelOpen: boolean;
  isShareOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onOpenLabel: () => void;
  onCloseLabel: () => void;
  onOpenShare: () => void;
  onCloseShare: () => void;
}

function ArchiveCardWithActions({
  brew,
  readings,
  isLoadingReadings,
  index,
  isModalOpen,
  isLabelOpen,
  isShareOpen,
  onOpenModal,
  onCloseModal,
  onOpenLabel,
  onCloseLabel,
  onOpenShare,
  onCloseShare,
}: CardProps) {
  const formattedDate = format(new Date(brew.brew_date), 'MMM d, yyyy');
  const yearBrewed = format(new Date(brew.brew_date), 'yyyy');
  const attenuation = calculateAttenuation(brew.og, brew.fg);

  const getColorClass = () => {
    if (brew.og >= 1.08) return 'from-amber-900/20';
    if (brew.og >= 1.06) return 'from-amber-800/15';
    if (brew.og >= 1.045) return 'from-amber-700/10';
    return 'from-amber-600/5';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on action buttons
    if ((e.target as HTMLElement).closest('.action-buttons')) {
      return;
    }
    onOpenModal();
  };

  return (
    <div className="relative">
      {/* Card - now clickable */}
      <article
        onClick={handleCardClick}
        className="group relative border border-art-deco-brass/30 bg-deep-space overflow-hidden transition-all duration-300 hover:border-art-deco-brass hover:brass-glow h-full flex flex-col cursor-pointer"
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

          {/* Footer with actions */}
          <div className="flex items-center justify-between pt-4 border-t border-art-deco-brass/20 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-art-deco-brass/50 rotate-45" />
              <span className="font-mono text-xs text-stardust/40">{formattedDate}</span>
            </div>
            {/* Action buttons in footer */}
            <div className="action-buttons flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenShare();
                }}
                className="p-1.5 text-stardust/40 hover:text-art-deco-brass transition-colors"
                title="Share this beer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLabel();
                }}
                className="font-mono text-[10px] px-2 py-1 border border-art-deco-brass/30 text-art-deco-brass/60 hover:border-art-deco-brass hover:text-art-deco-brass transition-colors uppercase tracking-wider"
                title="Print label"
              >
                Label
              </button>
            </div>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-art-deco-brass/20" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-art-deco-brass/20" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-art-deco-brass/20" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-art-deco-brass/20" />
      </article>

      {/* Modal */}
      <BeerModal
        brew={brew}
        readings={readings}
        isLoadingReadings={isLoadingReadings}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        showKegStatus={false}
      />

      {/* Share Modal */}
      <ShareModal brew={brew} isOpen={isShareOpen} onClose={onCloseShare} />

      {/* Label Modal */}
      {isLabelOpen && <LabelModal brew={brew} onClose={onCloseLabel} />}
    </div>
  );
}

// Label Modal with Generative Art Background
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 384;
const EXPORT_SCALE = 3;

function LabelModal({ brew, onClose }: { brew: Brew; onClose: () => void }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate background art when modal opens
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        generateBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, brew);
      }
    }
  }, [brew]);

  const downloadLabel = useCallback(async () => {
    if (!canvasRef.current || !overlayRef.current) return;
    setIsGenerating(true);
    try {
      // Create high-res export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_WIDTH * EXPORT_SCALE;
      exportCanvas.height = CANVAS_HEIGHT * EXPORT_SCALE;
      const exportCtx = exportCanvas.getContext('2d');

      if (!exportCtx) throw new Error('Failed to get export canvas context');

      // Scale and draw the generative background
      exportCtx.scale(EXPORT_SCALE, EXPORT_SCALE);
      generateBackground(exportCtx, CANVAS_WIDTH, CANVAS_HEIGHT, brew);
      exportCtx.setTransform(1, 0, 0, 1, 0, 0);

      // Draw text overlay
      const overlayDataUrl = await toPng(overlayRef.current, {
        quality: 1,
        pixelRatio: EXPORT_SCALE,
        backgroundColor: 'transparent',
      });

      const overlayImg = new Image();
      await new Promise<void>((resolve, reject) => {
        overlayImg.onload = () => resolve();
        overlayImg.onerror = reject;
        overlayImg.src = overlayDataUrl;
      });

      exportCtx.drawImage(overlayImg, 0, 0);

      const link = document.createElement('a');
      link.download = `${brew.id}-label.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate label:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [brew]);

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
            className="relative border-2 border-art-deco-brass"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            {/* Generative Background Canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute inset-0"
            />

            {/* Text Overlay */}
            <div
              ref={overlayRef}
              className="absolute inset-0 flex flex-col p-4"
              style={{ fontFamily: '"Space Mono", monospace' }}
            >
              {/* Brewery Name */}
              <div className="text-center mb-3 pb-3 border-b border-art-deco-brass/50 bg-void-black/60 -mx-4 -mt-4 px-4 pt-4">
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

              {/* Beer Name */}
              <div className="text-center mb-3 bg-void-black/70 py-2 -mx-4 px-4">
                <h4
                  className="text-stardust text-base uppercase tracking-widest leading-tight"
                  style={{ fontFamily: '"Josefin Sans", sans-serif' }}
                >
                  {brew.name}
                </h4>
                <p className="text-stardust/60 text-xs mt-1">{brew.style}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-center">
                <div className="border border-art-deco-brass/40 p-2 bg-void-black/70">
                  <p className="text-stardust/60 text-[9px] uppercase">ABV</p>
                  <p className="text-art-deco-brass text-sm font-bold">{brew.abv}%</p>
                </div>
                <div className="border border-art-deco-brass/40 p-2 bg-void-black/70">
                  <p className="text-stardust/60 text-[9px] uppercase">IBU</p>
                  <p className="text-oxidized-copper text-sm font-bold">{brew.ibu}</p>
                </div>
              </div>

              {/* Hops */}
              {brew.hops && (
                <div className="text-center mb-2 py-2 border-t border-b border-art-deco-brass/30 bg-void-black/60 -mx-4 px-4">
                  <p className="text-stardust/60 text-[9px] uppercase mb-1">Hops</p>
                  <p className="text-stardust text-[10px]">{brew.hops}</p>
                </div>
              )}

              {/* Brew Date */}
              <div className="text-center mb-2">
                <p className="text-stardust/60 text-[9px] uppercase">Brewed</p>
                <p className="text-stardust text-xs">{formatDate(brew.brew_date)}</p>
              </div>

              {/* Spacer */}
              <div className="flex-grow" />

              {/* QR Code */}
              <div className="flex justify-center mb-2">
                <div className="p-1.5 bg-stardust">
                  <QRCodeSVG
                    value={`https://notomorrowbrewing.com/beer/${brew.id}`}
                    size={48}
                    bgColor="#E8E6E1"
                    fgColor="#0D0D0D"
                    level="M"
                  />
                </div>
              </div>
              <p className="text-center text-stardust/50 text-[8px] mb-2">
                Scan for details
              </p>

              {/* Barcode */}
              <div className="flex justify-center pt-2 border-t border-art-deco-brass/50 bg-void-black/70 -mx-4 -mb-4 px-4 pb-3">
                <Barcode
                  value={brew.id}
                  width={1.2}
                  height={30}
                  fontSize={8}
                  background="transparent"
                  lineColor="#E8E6E1"
                  margin={0}
                  displayValue={true}
                />
              </div>
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
