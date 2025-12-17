import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { TiltReading } from '../types/brew';

interface Props {
  readings: TiltReading[];
  brewName: string;
}

export default function LiveGraph({ readings, brewName }: Props) {
  // Filter to last 14 days and sort by timestamp ascending
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const filteredReadings = readings
    .filter((r) => new Date(r.timestamp).getTime() > fourteenDaysAgo)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Prepare series data
  const gravityData = filteredReadings.map((r) => [
    new Date(r.timestamp).getTime(),
    r.sg,
  ]);

  const tempData = filteredReadings.map((r) => [
    new Date(r.timestamp).getTime(),
    r.temp,
  ]);

  const options: Highcharts.Options = {
    chart: {
      backgroundColor: '#161616',
      style: {
        fontFamily: '"Space Mono", monospace',
      },
      height: 350,
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
        // Primary Y-axis: Gravity (left)
        title: {
          text: 'Gravity (SG)',
          style: {
            color: '#4B7F78',
          },
        },
        labels: {
          format: '{value:.3f}',
          style: {
            color: '#4B7F78',
          },
        },
        lineColor: '#4B7F78',
        lineWidth: 1,
        gridLineWidth: 0,
      },
      {
        // Secondary Y-axis: Temperature (right)
        title: {
          text: 'Temp (°F)',
          style: {
            color: '#D4AF37',
          },
        },
        labels: {
          format: '{value}°',
          style: {
            color: '#D4AF37',
          },
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
      style: {
        color: '#E8E6E1',
      },
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
        marker: {
          symbol: 'diamond',
          radius: 3,
        },
      },
      {
        name: 'Temperature',
        type: 'spline',
        data: tempData,
        color: '#D4AF37',
        yAxis: 1,
        marker: {
          enabled: false,
        },
      },
    ],
  };

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
