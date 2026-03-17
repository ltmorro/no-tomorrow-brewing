import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { TiltReading } from '../types/brew';
import { ChartSkeleton } from './Skeletons';
import {
  filterReadingsByDays,
  sortReadingsChronologically,
  prepareChartData,
} from '../utils/brewCalculations';
import { getFermentationChartOptions } from '../utils/chartConfig';

interface Props {
  readings: TiltReading[];
  brewName: string;
  loading?: boolean;
}

export default function LiveGraph({ readings, brewName, loading = false }: Props) {
  if (loading) {
    return <ChartSkeleton />;
  }

  // Filter to last 14 days and sort chronologically using shared utilities
  const filteredReadings = sortReadingsChronologically(
    filterReadingsByDays(readings, 14)
  );

  // Prepare chart data and options using shared utilities
  const { gravityData, tempData } = prepareChartData(filteredReadings);
  const options = getFermentationChartOptions(gravityData, tempData, 350);

  if (filteredReadings.length === 0) {
    return (
      <div className="border border-art-deco-brass/25 bg-deep-space p-8 text-center">
        <p className="font-mono text-stardust/50 text-sm">
          No telemetry data available for the past 14 days.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-art-deco-brass bg-deep-space">
      <div className="border-b border-art-deco-brass/25 px-4 py-3">
        <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/75">
          Fermentation Telemetry
        </h4>
      </div>
      <div className="p-4">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </div>
      <div className="border-t border-art-deco-brass/25 px-4 py-2 flex justify-between">
        <span className="font-mono text-xs text-stardust/50">
          {filteredReadings.length} readings
        </span>
        <span className="font-mono text-xs text-stardust/50">
          Last 14 days
        </span>
      </div>
    </div>
  );
}
