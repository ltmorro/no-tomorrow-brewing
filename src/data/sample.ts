import type { Brew, TiltReading } from '../types/brew';

// Sample brews for development/demo
export const sampleBrews: Brew[] = [
    {
    id: 'NTB-006',
    name: 'Singularity',
    style: 'Pilsner',
    abv: 4.0,
    ibu: 28,
    brew_date: '2025-02-18',
    status: 'Archive',
    og: 1.033,
    fg: 1.006,
    hops: 'Hallertau Mittelfrueh',
    tilt_sheet_id: '1G8somqe7gTT8c9foB6bju4pBtvtVAOREXHjXQwnxV1k',
  },
  {
    id: 'NTB-024',
    name: 'Event Horizon',
    style: 'Imperial Oatmeal Stout',
    abv: 9.2,
    ibu: 45,
    brew_date: '2025-12-01',
    status: 'On Tap',
    og: 1.085,
    fg: 1.020,
    hops: 'Goldings, Fuggles',
    spotify_id: '29sTacnS0qA9xri6YS8xLA',
    tilt_color: 'Red',
  },
  {
    id: 'NTB-023',
    name: 'Solar Flare',
    style: 'West Coast IPA',
    abv: 6.8,
    ibu: 65,
    brew_date: '2025-11-15',
    status: 'On Tap',
    og: 1.065,
    fg: 1.012,
    hops: 'Centennial, Simcoe, Citra',
    spotify_id: '2guirTSEqLizK7j9i1MTTZ',
  },

  {
    id: 'NTB-026',
    name: 'Gemini Hazy',
    style: 'American IPA',
    abv: 6.5,
    ibu: 22,
    brew_date: '2026-01-31',
    status: 'Fermenting',
    og: 1.060,
    fg: 1.011,
    hops: 'Citra, Mosaic, Galaxy',
    spotify_id: '2KYnOjOMzSCeQs97ZJiMe1',
    spotify_type: 'playlist',
    tilt_sheet_id: '1-yvGtlGJ_z-lLXKM1uXXYLSOyHRILkg72PggrbckkK0',
  },
  {
    id: 'NTB-021',
    name: 'Nebula Haze',
    style: 'New England IPA',
    abv: 7.2,
    ibu: 40,
    brew_date: '2025-10-01',
    status: 'Archive',
    og: 1.068,
    fg: 1.014,
    hops: 'Galaxy, Mosaic, El Dorado',
    spotify_id: '0ojQHzflxMs6SfvBBkRKt6',
  },
  {
    id: 'NTB-020',
    name: 'Supernova',
    style: 'Belgian Tripel',
    abv: 9.5,
    ibu: 25,
    brew_date: '2025-09-15',
    status: 'Archive',
    og: 1.084,
    fg: 1.010,
    hops: 'Styrian Goldings',
    spotify_id: '1ay9Z4R5ZYI2TY7WiDhNYQ'
  },
  {
    id: 'NTB-019',
    name: 'Cosmic Dust',
    style: 'Hefeweizen',
    abv: 5.2,
    ibu: 12,
    brew_date: '2025-08-20',
    status: 'Archive',
    og: 1.052,
    fg: 1.012,
    hops: 'Hallertau Mittelfrueh',
    spotify_id: '5w2X5ZmdE4u0XGkOU7BiLG'
  },
  {
    id: 'NTB-018',
    name: 'Gravity Well',
    style: 'Imperial Stout',
    abv: 10.5,
    ibu: 55,
    brew_date: '2025-07-10',
    status: 'Archive',
    og: 1.098,
    fg: 1.024,
    hops: 'Magnum, Willamette',
    spotify_id: '6dVIqQ8qmQ5GBnJ9shOYGE',
  },
];

// Generate sample Tilt readings for the fermenting beer
function generateTiltReadings(): TiltReading[] {
  const readings: TiltReading[] = [];
  const now = new Date();
  const startDate = new Date('2025-12-10');

  // Generate readings every 15 minutes from brew date to now
  let currentDate = new Date(startDate);
  let sg = 1.082; // Starting gravity
  const targetFg = 1.018;
  const totalDays = 14;

  while (currentDate <= now && currentDate <= new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000)) {
    // Simulate fermentation curve - fast at first, then slowing
    const daysSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const progress = 1 - Math.exp(-daysSinceStart / 3); // Exponential decay
    sg = 1.082 - (1.082 - targetFg) * progress;

    // Temperature fluctuates around 65°F
    const temp = 65 + Math.sin(daysSinceStart * Math.PI) * 3 + (Math.random() - 0.5) * 2;

    readings.push({
      timestamp: currentDate.toISOString(),
      sg: Math.round(sg * 1000) / 1000,
      temp: Math.round(temp * 10) / 10,
      color: 'Black',
      beer_name: 'Dark Matter',
    });

    // Advance 15 minutes
    currentDate = new Date(currentDate.getTime() + 15 * 60 * 1000);
  }

  return readings;
}

export const sampleTiltReadings: TiltReading[] = generateTiltReadings();
