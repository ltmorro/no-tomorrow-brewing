import { differenceInDays, parseISO } from 'date-fns';
import type { TiltReading } from '../types/brew';

/**
 * Freshness status for beers on tap
 */
export interface FreshnessInfo {
  label: string;
  color: string;
}

/**
 * Calculate apparent attenuation percentage
 * @param og - Original gravity
 * @param fg - Final gravity
 * @returns Attenuation percentage (0 if invalid inputs)
 */
export function calculateAttenuation(og: number, fg: number): number {
  if (og <= 1 || og <= fg) return 0;
  return Math.round(((og - fg) / (og - 1)) * 100);
}

/**
 * Get freshness label based on days since brew date
 * @param daysOld - Number of days since brew date
 * @returns Freshness label string
 */
export function getFreshnessLabel(daysOld: number): string {
  if (daysOld <= 7) return 'PEAK FRESH';
  if (daysOld <= 14) return 'DRINKING WELL';
  if (daysOld <= 30) return 'MATURE';
  return 'AGED';
}

/**
 * Get freshness info with color class for styling
 * @param daysOld - Number of days since brew date
 * @returns Object with label and tailwind color class
 */
export function getFreshnessInfo(daysOld: number): FreshnessInfo {
  if (daysOld <= 7) return { label: 'PEAK FRESH', color: 'text-art-deco-brass' };
  if (daysOld <= 14) return { label: 'DRINKING WELL', color: 'text-oxidized-copper' };
  if (daysOld <= 30) return { label: 'MATURE', color: 'text-stardust' };
  return { label: 'AGED', color: 'text-stardust/50' };
}

/**
 * Calculate simulated keg scarcity level based on age
 * In production, this would come from actual keg sensors
 * @param daysOld - Number of days since brew date
 * @param isKicked - Whether the keg is kicked
 * @returns Percentage remaining (0-100)
 */
export function getScarcityLevel(daysOld: number, isKicked: boolean = false): number {
  if (isKicked) return 0;
  if (daysOld <= 3) return 95;
  if (daysOld <= 7) return 75;
  if (daysOld <= 14) return 50;
  if (daysOld <= 21) return 25;
  return 10;
}

/**
 * Calculate days old from brew date string
 * @param brewDate - ISO date string or Date object
 * @returns Number of days since brew date
 */
export function getDaysOld(brewDate: string | Date): number {
  const date = typeof brewDate === 'string' ? parseISO(brewDate) : brewDate;
  return differenceInDays(new Date(), date);
}

/**
 * Calculate fermentation duration from Tilt readings
 * @param readings - Array of TiltReading objects (should be sorted chronologically)
 * @returns Number of days between first and last reading, or 0 if insufficient data
 */
export function calculateFermentationDays(readings: TiltReading[]): number {
  if (readings.length < 2) return 0;

  const firstReading = readings[0];
  const lastReading = readings[readings.length - 1];

  const firstTime = new Date(firstReading.timestamp).getTime();
  const lastTime = new Date(lastReading.timestamp).getTime();

  return Math.round((lastTime - firstTime) / (1000 * 60 * 60 * 24));
}

/**
 * Sort Tilt readings chronologically (ascending)
 * @param readings - Array of TiltReading objects
 * @returns New sorted array
 */
export function sortReadingsChronologically(readings: TiltReading[]): TiltReading[] {
  return [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Prepare chart data from Tilt readings
 * @param readings - Array of TiltReading objects (should be sorted chronologically)
 * @returns Object with gravityData and tempData arrays for Highcharts
 */
export function prepareChartData(readings: TiltReading[]): {
  gravityData: [number, number][];
  tempData: [number, number][];
} {
  const gravityData = readings.map((r): [number, number] => [
    new Date(r.timestamp).getTime(),
    r.sg,
  ]);

  const tempData = readings.map((r): [number, number] => [
    new Date(r.timestamp).getTime(),
    r.temp,
  ]);

  return { gravityData, tempData };
}

/**
 * Filter readings to last N days
 * @param readings - Array of TiltReading objects
 * @param days - Number of days to include (default 14)
 * @returns Filtered array of readings
 */
export function filterReadingsByDays(readings: TiltReading[], days: number = 14): TiltReading[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return readings.filter((r) => new Date(r.timestamp).getTime() > cutoff);
}
