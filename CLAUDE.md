# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

No Tomorrow Brewing Co. is a homebrewery web application built with Astro and Tailwind CSS. The site has four main sections:
- **Taproom** (`/`) - Public digital menu showing beers currently on tap
- **Mission Control** (`/mission-control`) - Real-time fermentation tracking via Tilt IoT data
- **The Library** (`/library`) - Historical archive of recipes and brew day metadata
- **TV Mode** (`/tv`) - Optimized display for bar TV screens

## Commands

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
```

## Architecture

- **Framework**: Astro v5 with React islands for interactive components
- **Styling**: Tailwind CSS with custom "Void & Brass" design system
- **Charts**: Highcharts via highcharts-react-official
- **Data Source**: Google Sheets published as CSV (with sample data fallback)
- **Deployment**: Cloudflare Pages (static output)

### Directory Structure

```
src/
├── layouts/Layout.astro    # Base layout with Header, Google Fonts, meta tags
├── components/             # Reusable components
│   ├── Header.astro        # Navigation with active state
│   ├── TapCard.astro       # Beer card for taproom
│   ├── TapModal.tsx        # Detail modal for tap beers
│   ├── ArchiveCard.astro   # Detailed card for library
│   ├── BrewArchiveModal.tsx # Detail modal for archived beers
│   ├── FermentationCard.astro  # Live fermentation display
│   ├── LiveGraph.tsx       # Highcharts fermentation chart (Gravity + Temp)
│   ├── LabelMaker.tsx      # Print-ready beer labels with barcode
│   ├── LibraryBrowser.tsx  # Interactive library browser
│   ├── VibeCheck.astro     # Spotify embed (Astro version)
│   └── VibeCheck.tsx       # Spotify embed (React version)
├── pages/                  # File-based routing
│   ├── index.astro         # Taproom page
│   ├── mission-control.astro
│   ├── library.astro
│   ├── tv.astro            # TV display mode
│   └── 404.astro           # Error page
├── types/brew.ts           # TypeScript interfaces (Brew, TiltReading)
├── utils/googleSheets.ts   # Data fetching with PapaParse
├── data/sample.ts          # Sample data for development
├── styles/globals.css      # Tailwind directives and base styles
├── assets/                 # Static assets (logos, background SVG)
└── icons/                  # Icon SVGs
```

## Data Layer

### Environment Variables
Configure in `.env`:
- `PUBLIC_MASTER_LOG_URL` - Google Sheet CSV URL for brew data
- `PUBLIC_TILT_DATA_URL` - Google Sheet CSV URL for Tilt readings

If no URLs are configured, the app falls back to sample data in `src/data/sample.ts`.

### TypeScript Interfaces
Defined in `src/types/brew.ts`:
- `Brew` - Beer recipe with status (On Tap/Fermenting/Archive/Kicked)
  - Includes `tilt_sheet_id` for per-brew fermentation data sheets
- `TiltReading` - Fermentation data point (timestamp, sg, temp, color)

### Data Fetching
`src/utils/googleSheets.ts` exports:
- `fetchBrews()` - Get all brews from Google Sheets or sample data
- `fetchTiltData(color?)` - Get Tilt readings, optionally filtered by color
- `getBrewsByStatus(brews, status)` - Filter brews by status

## Design System

### Typography
- **Headlines**: `font-sans` (Josefin Sans) - MUST be uppercase with `tracking-widest`
- **Body/Technical**: `font-mono` (Space Grotesk) - sentence case

### Color Palette (defined in tailwind.config.mjs)
| Class | Hex | Usage |
|-------|-----|-------|
| `void-black` | #0D0D0D | Page background |
| `stardust` | #E8E6E1 | Body text |
| `art-deco-brass` | #D4AF37 | Accents, borders, active states |
| `oxidized-copper` | #4B7F78 | Secondary data, gravity readings |
| `nebula-red` | #B84A4A | Kicked kegs, errors |
| `deep-space` | #161616 | Card backgrounds |

### UI Guidelines
- Sharp corners only (0px radius)
- 1px solid brass borders, no shadows
- Use opacity modifiers for subtle text (e.g., `text-stardust/75`)
- Hover states transition border from brass to copper

## Components

### Astro Components
- `<TapCard />` - Beer card with name, ABV, IBU, style, freshness meter (date-fns)
- `<ArchiveCard />` - Detailed card with OG/FG, attenuation, hops, brew date
- `<FermentationCard />` - Live gravity/temp display with progress bar
- `<VibeCheck />` - Spotify album embed (grayscale until hover)
- `<Header />` - Navigation with active page highlighting

### React Components (client-side hydration)
- `<LiveGraph />` - Highcharts fermentation chart (Gravity + Temp over time)
- `<LabelMaker />` - Print-ready beer labels with barcode (html-to-image, react-barcode)
- `<TapModal />` - Detail modal for tap beers
- `<BrewArchiveModal />` - Detail modal for archived beers
- `<LibraryBrowser />` - Interactive library browser with filtering

## Data Schema (Google Sheets)

The `NTB_Master_Log` sheet columns:
- `id`, `name`, `style`, `abv`, `ibu`, `brew_date`, `status` (On Tap/Fermenting/Archive/Kicked)
- `og`, `fg`, `hops`, `spotify_id`, `tilt_color`, `tilt_sheet_id`

The `Tilt_Cloud_Data` sheet columns:
- `Timestamp`, `SG`, `Temp`, `Color`, `Beer Name`, `Comment`

## Deployment

### Cloudflare Pages
1. Connect GitHub repo to Cloudflare Pages
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Environment variables (optional):
   - `PUBLIC_MASTER_LOG_URL`
   - `PUBLIC_TILT_DATA_URL`
