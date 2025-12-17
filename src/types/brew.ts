export type BrewStatus = 'On Tap' | 'Fermenting' | 'Archive' | 'Kicked';

export interface Brew {
  id: string;
  name: string;
  style: string;
  abv: number;
  ibu: number;
  brew_date: string;
  status: BrewStatus;
  og: number;
  fg: number;
  hops: string;
  spotify_id?: string;
  tilt_color?: string;
  tilt_sheet_id?: string; // Google Sheet ID for fermentation data
}

export interface TiltReading {
  timestamp: string;
  sg: number;
  temp: number;
  color: string;
  beer_name: string;
  comment?: string;
}
