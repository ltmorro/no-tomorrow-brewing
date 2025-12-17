import Papa from 'papaparse';
import type { Brew, TiltReading } from '../types/brew';

const MASTER_LOG_URL = import.meta.env.PUBLIC_MASTER_LOG_URL;
const TILT_DATA_URL = import.meta.env.PUBLIC_TILT_DATA_URL;

/**
 * Build a Google Sheets CSV export URL
 * @param sheetId - The Google Sheet ID (from the URL)
 * @param tabName - The sheet tab name (defaults to "Data")
 */
function buildSheetUrl(sheetId: string, tabName: string = 'Data'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

export async function fetchBrews(): Promise<Brew[]> {
  if (!MASTER_LOG_URL) {
    console.warn('No Google Sheets URL configured, using sample data');
    const { sampleBrews } = await import('../data/sample');
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
      status: (row.status as Brew['status']) || 'Archive',
      og: parseFloat(row.og) || 0,
      fg: parseFloat(row.fg) || 0,
      hops: row.hops || '',
      spotify_id: row.spotify_id || undefined,
      tilt_color: row.tilt_color || undefined,
      tilt_sheet_id: row.tilt_sheet_id || undefined,
    }));
  } catch (error) {
    console.error('Error fetching brews:', error);
    const { sampleBrews } = await import('../data/sample');
    return sampleBrews;
  }
}

export async function fetchTiltData(color?: string): Promise<TiltReading[]> {
  if (!TILT_DATA_URL) {
    console.warn('No Tilt data URL configured, using sample data');
    const { sampleTiltReadings } = await import('../data/sample');
    return color
      ? sampleTiltReadings.filter(r => r.color.toLowerCase() === color.toLowerCase())
      : sampleTiltReadings;
  }

  try {
    const response = await fetch(TILT_DATA_URL);
    const csvText = await response.text();

    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    let readings = data.map((row) => ({
      timestamp: row.Timestamp || row.timestamp || '',
      sg: parseFloat(row.SG || row.sg) || 0,
      temp: parseFloat(row.Temp || row.temp) || 0,
      color: row.Color || row.color || '',
      beer_name: row['Beer Name'] || row.beer_name || '',
      comment: row.Comment || row.comment || undefined,
    }));

    if (color) {
      readings = readings.filter(r => r.color.toLowerCase() === color.toLowerCase());
    }

    // Sort by timestamp descending and limit to last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    return readings
      .filter(r => new Date(r.timestamp) >= fourteenDaysAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching Tilt data:', error);
    const { sampleTiltReadings } = await import('../data/sample');
    return color
      ? sampleTiltReadings.filter(r => r.color.toLowerCase() === color.toLowerCase())
      : sampleTiltReadings;
  }
}

export function getBrewsByStatus(brews: Brew[], status: Brew['status']): Brew[] {
  return brews.filter(b => b.status === status);
}

export async function fetchHistoricalTiltData(beerName: string): Promise<TiltReading[]> {
  if (!TILT_DATA_URL) {
    console.warn('No Tilt data URL configured, using sample data');
    const { sampleTiltReadings } = await import('../data/sample');
    return sampleTiltReadings.filter(r =>
      r.beer_name.toLowerCase() === beerName.toLowerCase()
    );
  }

  try {
    const response = await fetch(TILT_DATA_URL);
    const csvText = await response.text();

    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const readings = data
      .map((row) => ({
        timestamp: row.Timestamp || row.timestamp || '',
        sg: parseFloat(row.SG || row.sg) || 0,
        temp: parseFloat(row.Temp || row.temp) || 0,
        color: row.Color || row.color || '',
        beer_name: row['Beer Name'] || row.beer_name || '',
        comment: row.Comment || row.comment || undefined,
      }))
      .filter(r => r.beer_name.toLowerCase() === beerName.toLowerCase());

    // Sort by timestamp ascending for chronological display
    return readings.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching historical Tilt data:', error);
    const { sampleTiltReadings } = await import('../data/sample');
    return sampleTiltReadings.filter(r =>
      r.beer_name.toLowerCase() === beerName.toLowerCase()
    );
  }
}

/**
 * Fetch fermentation data from a beer-specific Google Sheet.
 * The sheet should have a "Data" tab with columns: Timestamp, Timepoint, SG, Temp, Color, Beer, Comment
 *
 * @param sheetId - The Google Sheet ID (from the URL, e.g., "1ABC123...")
 * @param tabName - The sheet tab name (defaults to "Data")
 * @returns Array of TiltReading objects sorted chronologically
 */
export async function fetchFermentationDataBySheetId(
  sheetId: string,
  tabName: string = 'Data'
): Promise<TiltReading[]> {
  if (!sheetId) {
    console.warn('No sheet ID provided, using sample data');
    const { sampleTiltReadings } = await import('../data/sample');
    return sampleTiltReadings;
  }

  try {
    const url = buildSheetUrl(sheetId, tabName);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const readings: TiltReading[] = data.map((row: Record<string, string>) => ({
      timestamp: row.Timestamp || row.timestamp || '',
      sg: parseFloat(row.SG || row.sg) || 0,
      temp: parseFloat(row.Temp || row.temp) || 0,
      color: (row.Color || row.color || '').toUpperCase(),
      beer_name: row.Beer || row['Beer Name'] || row.beer_name || '',
      comment: row.Comment || row.comment || undefined,
    }));

    // Sort by timestamp ascending for chronological display
    return readings.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error) {
    console.error('Error fetching fermentation data from sheet:', error);
    const { sampleTiltReadings } = await import('../data/sample');
    return sampleTiltReadings;
  }
}
