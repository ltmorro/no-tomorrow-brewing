import type Highcharts from 'highcharts';

/**
 * Design system colors for charts
 * These should match tailwind.config.mjs
 */
export const CHART_COLORS = {
  background: '#161616',      // deep-space
  pageBackground: '#0D0D0D',  // void-black
  text: '#E8E6E1',            // stardust
  accent: '#D4AF37',          // art-deco-brass
  secondary: '#4B7F78',       // oxidized-copper
  error: '#B84A4A',           // nebula-red
} as const;

/**
 * Get base Highcharts options with consistent theming
 * @param height - Chart height in pixels (default 300)
 * @returns Highcharts.Options base configuration
 */
export function getBaseChartOptions(height: number = 300): Highcharts.Options {
  return {
    chart: {
      backgroundColor: CHART_COLORS.background,
      style: {
        fontFamily: '"Space Mono", monospace',
      },
      height,
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
        color: CHART_COLORS.text,
        fontWeight: '400',
      },
      itemHoverStyle: {
        color: CHART_COLORS.accent,
      },
    },
    xAxis: {
      type: 'datetime',
      lineColor: CHART_COLORS.accent,
      tickColor: CHART_COLORS.accent,
      labels: {
        style: {
          color: CHART_COLORS.text,
          fontSize: '10px',
        },
      },
      gridLineWidth: 0,
    },
    yAxis: [
      {
        title: {
          text: 'Gravity (SG)',
          style: { color: CHART_COLORS.secondary },
        },
        labels: {
          format: '{value:.3f}',
          style: { color: CHART_COLORS.secondary },
        },
        lineColor: CHART_COLORS.secondary,
        lineWidth: 1,
        gridLineWidth: 0,
      },
      {
        title: {
          text: 'Temp (°F)',
          style: { color: CHART_COLORS.accent },
        },
        labels: {
          format: '{value}°',
          style: { color: CHART_COLORS.accent },
        },
        opposite: true,
        lineColor: CHART_COLORS.accent,
        lineWidth: 1,
        gridLineWidth: 0,
      },
    ],
    tooltip: {
      shared: true,
      backgroundColor: CHART_COLORS.pageBackground,
      borderColor: CHART_COLORS.accent,
      borderWidth: 1,
      style: { color: CHART_COLORS.text },
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
  };
}

/**
 * Get fermentation chart options with gravity and temperature series
 * @param gravityData - Array of [timestamp, sg] tuples
 * @param tempData - Array of [timestamp, temp] tuples
 * @param height - Chart height in pixels (default 300)
 * @returns Complete Highcharts.Options for fermentation chart
 */
export function getFermentationChartOptions(
  gravityData: [number, number][],
  tempData: [number, number][],
  height: number = 300
): Highcharts.Options {
  const baseOptions = getBaseChartOptions(height);

  return {
    ...baseOptions,
    series: [
      {
        name: 'Gravity',
        type: 'line',
        data: gravityData,
        color: CHART_COLORS.secondary,
        yAxis: 0,
        marker: { symbol: 'diamond', radius: 3 },
      },
      {
        name: 'Temperature',
        type: 'spline',
        data: tempData,
        color: CHART_COLORS.accent,
        yAxis: 1,
        marker: { enabled: false },
      },
    ],
  };
}
