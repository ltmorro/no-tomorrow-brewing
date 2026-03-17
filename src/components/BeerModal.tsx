import { useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { Brew, TiltReading } from '../types/brew';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Modal, { ModalHeader, ModalBody } from './Modal';
import SpotifyEmbed from './SpotifyEmbed';
import ShareModal from './ShareModal';
import {
  getDaysOld,
  getFreshnessInfo,
  getScarcityLevel,
  calculateAttenuation,
  calculateFermentationDays,
  sortReadingsChronologically,
  prepareChartData,
} from '../utils/brewCalculations';
import { getFermentationChartOptions } from '../utils/chartConfig';

interface Props {
  brew: Brew;
  readings?: TiltReading[];
  /** Whether fermentation readings are currently being fetched */
  isLoadingReadings?: boolean;
  isOpen: boolean;
  onClose: () => void;
  /** Show keg status/level for on-tap beers */
  showKegStatus?: boolean;
}

export default function BeerModal({
  brew,
  readings = [],
  isLoadingReadings = false,
  isOpen,
  onClose,
  showKegStatus = false,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const isKicked = brew.status === 'Kicked';

  const brewDate = parseISO(brew.brew_date);
  const formattedDate = format(brewDate, 'MMM d, yyyy');
  const daysOld = getDaysOld(brew.brew_date);
  const freshness = formatDistanceToNow(brewDate, { addSuffix: true });
  const freshnessInfo = getFreshnessInfo(daysOld);
  const scarcity = getScarcityLevel(daysOld, isKicked);
  const attenuation = calculateAttenuation(brew.og, brew.fg);

  // Prepare chart data using shared utilities
  const sortedReadings = sortReadingsChronologically(readings);
  const { gravityData, tempData } = prepareChartData(sortedReadings);
  const chartOptions = getFermentationChartOptions(gravityData, tempData, 250);
  const fermentationDays = calculateFermentationDays(sortedReadings);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
        <ModalHeader onClose={onClose}>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] text-art-deco-brass/60 tracking-wider">
              BATCH {brew.id}
            </span>
            {showKegStatus && !isKicked && (
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
        </ModalHeader>

        <ModalBody>
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

          {/* Keg Status - Only for on-tap beers */}
          {showKegStatus && !isKicked && (
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
            <SpotifyEmbed spotifyId={brew.spotify_id} title="Brewed Listening To" />
          )}

          {/* Share Section */}
          <div className="flex gap-3">
            <button
              onClick={() => setShareOpen(true)}
              className="flex-1 font-mono text-xs py-3 border border-art-deco-brass/50 text-art-deco-brass hover:bg-art-deco-brass/10 transition-colors flex items-center justify-center gap-2"
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
              Share This Beer
            </button>
          </div>

          {/* Fermentation History Chart */}
          {isLoadingReadings ? (
            <div className="border border-art-deco-brass/25 p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-art-deco-brass border-t-transparent rounded-full animate-spin" />
                <p className="font-mono text-stardust/50 text-sm">
                  Loading fermentation data...
                </p>
              </div>
            </div>
          ) : readings.length > 0 ? (
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
                <span className="font-mono text-xs text-stardust/50">
                  {readings.length} readings
                </span>
                <span className="font-mono text-xs text-stardust/50">
                  {fermentationDays > 0
                    ? `${fermentationDays} day fermentation`
                    : 'Historical data'}
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
        </ModalBody>
      </Modal>

      <ShareModal
        brew={brew}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
