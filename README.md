# No Tomorrow Brewing Co.

A homebrewery web application built with Astro, React, and Tailwind CSS featuring a "Void & Brass" design system.

## Sections

- **Taproom** (`/`) - Public digital menu showing beers currently on tap
- **Mission Control** (`/mission-control`) - Real-time fermentation tracking via Tilt IoT data
- **The Library** (`/library`) - Historical archive of recipes and brew day metadata
- **TV Mode** (`/tv`) - Optimized display for bar TV screens

## Tech Stack

- **Framework**: Astro v5 with React islands for interactive components
- **Styling**: Tailwind CSS with custom "Void & Brass" theme
- **Charts**: Highcharts for fermentation graphs
- **Data Source**: Google Sheets published as CSV
- **Deployment**: Cloudflare Pages

## Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server at localhost:4321
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
```

## Environment Variables

Create a `.env` file with:

```
PUBLIC_MASTER_LOG_URL=<Google Sheet CSV URL for brew data>
PUBLIC_TILT_DATA_URL=<Google Sheet CSV URL for Tilt readings>
```

If not configured, the app falls back to sample data.

## Project Structure

```
src/
├── layouts/Layout.astro
├── components/
│   ├── Header.astro
│   ├── TapCard.astro
│   ├── ArchiveCard.astro
│   ├── FermentationCard.astro
│   ├── VibeCheck.astro / VibeCheck.tsx
│   ├── LiveGraph.tsx
│   ├── LabelMaker.tsx
│   ├── TapModal.tsx
│   ├── BrewArchiveModal.tsx
│   └── LibraryBrowser.tsx
├── pages/
│   ├── index.astro
│   ├── mission-control.astro
│   ├── library.astro
│   ├── tv.astro
│   └── 404.astro
├── types/brew.ts
├── utils/googleSheets.ts
├── data/sample.ts
└── styles/globals.css
```
