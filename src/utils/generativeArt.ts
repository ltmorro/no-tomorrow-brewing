import type { Brew } from '../types/brew';

interface ColorPalette {
  stars: string;
  nebula: string;
  accent: string;
  background: string;
  glow: string;
}

// Mulberry32 PRNG
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash string to seed
function stringToSeed(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0) ^ ((h1 >>> 0) << 1);
}

function createSeededRandom(seed: string): () => number {
  return mulberry32(stringToSeed(seed));
}

// Cosmic color palettes based on SRM
function getPaletteFromSRM(srm: number): ColorPalette {
  if (srm <= 4) {
    // Light beers - bright golden nebula
    return {
      stars: '#FFFEF0',
      nebula: '#D4AF37',
      accent: '#F5E6A3',
      background: '#0A0A12',
      glow: '#E8D56E',
    };
  } else if (srm <= 10) {
    // Amber beers - warm orange nebula
    return {
      stars: '#FFF8E7',
      nebula: '#E8A832',
      accent: '#D4AF37',
      background: '#0D0A08',
      glow: '#C4842A',
    };
  } else if (srm <= 20) {
    // Copper beers - red/copper nebula
    return {
      stars: '#FFE8DC',
      nebula: '#A85A32',
      accent: '#4B7F78',
      background: '#0A0808',
      glow: '#7D3F24',
    };
  } else if (srm <= 35) {
    // Dark beers - deep purple/blue nebula
    return {
      stars: '#E8E6F0',
      nebula: '#4B3D6B',
      accent: '#4B7F78',
      background: '#08080D',
      glow: '#6B4D8B',
    };
  } else {
    // Black beers - void with subtle copper accents
    return {
      stars: '#C8C8D0',
      nebula: '#2A1F3A',
      accent: '#4B7F78',
      background: '#050508',
      glow: '#3D2A4F',
    };
  }
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Draw deep space background with subtle gradient
function drawDeepSpace(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ColorPalette,
  random: () => number
): void {
  // Base background
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial gradient for depth
  const centerX = width * (0.3 + random() * 0.4);
  const centerY = height * (0.3 + random() * 0.4);
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, Math.max(width, height) * 0.8
  );
  gradient.addColorStop(0, palette.nebula + '15');
  gradient.addColorStop(0.5, palette.background + '00');
  gradient.addColorStop(1, palette.background);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Draw star field
function drawStarField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  density: number, // 0-1, from ABV
  sharpness: number, // 0-1, from IBU
  palette: ColorPalette,
  random: () => number
): void {
  const starCount = Math.floor(50 + density * 150);

  for (let i = 0; i < starCount; i++) {
    const x = random() * width;
    const y = random() * height;
    const brightness = 0.3 + random() * 0.7;
    const size = 0.5 + random() * (1.5 + density);

    // Star color varies slightly
    const colorChoice = random();
    let color = palette.stars;
    if (colorChoice > 0.9) color = palette.accent;
    else if (colorChoice > 0.8) color = palette.glow;

    ctx.globalAlpha = brightness * 0.8;

    if (sharpness > 0.5 && random() > 0.7) {
      // Sharp 4-point stars for high IBU
      drawSharpStar(ctx, x, y, size * 2, color);
    } else {
      // Soft glowing stars
      const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      grd.addColorStop(0, color);
      grd.addColorStop(0.3, color + 'AA');
      grd.addColorStop(1, color + '00');
      ctx.fillStyle = grd;
      ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
    }
  }

  ctx.globalAlpha = 1;
}

// Draw a sharp 4-pointed star
function drawSharpStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  // Vertical line
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  // Horizontal line
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

// Draw nebula clouds
function drawNebula(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  palette: ColorPalette,
  random: () => number
): void {
  const cloudCount = Math.floor(2 + intensity * 4);

  for (let i = 0; i < cloudCount; i++) {
    const x = random() * width;
    const y = random() * height;
    const radiusX = 40 + random() * 80 * (1 + intensity);
    const radiusY = 30 + random() * 60 * (1 + intensity);
    const rotation = random() * Math.PI * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Multiple layered elliptical gradients for nebula effect
    for (let layer = 0; layer < 3; layer++) {
      const layerScale = 1 - layer * 0.25;
      const grd = ctx.createRadialGradient(
        0, 0, 0,
        0, 0, radiusX * layerScale
      );

      const baseColor = layer === 0 ? palette.nebula : palette.glow;
      grd.addColorStop(0, baseColor + '30');
      grd.addColorStop(0.4, baseColor + '15');
      grd.addColorStop(1, baseColor + '00');

      ctx.fillStyle = grd;
      ctx.scale(1, radiusY / radiusX);
      ctx.beginPath();
      ctx.arc(0, 0, radiusX * layerScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, x, y);
      ctx.rotate(rotation);
    }

    ctx.restore();
  }
}

// Draw orbital rings / time circles
function drawOrbitalRings(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number, // from OG
  palette: ColorPalette,
  random: () => number
): void {
  const ringGroups = Math.floor(1 + scale * 3);

  for (let g = 0; g < ringGroups; g++) {
    const centerX = random() * width;
    const centerY = random() * height;
    const ringCount = Math.floor(2 + random() * 3);
    const maxRadius = 30 + scale * 50 + random() * 40;
    const rotation = random() * Math.PI;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    // Elliptical perspective
    ctx.scale(1, 0.3 + random() * 0.3);

    for (let r = 0; r < ringCount; r++) {
      const radius = maxRadius * ((r + 1) / ringCount);
      const dashLength = 3 + random() * 10;

      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 0.5 + random() * 0.5;
      ctx.globalAlpha = 0.15 + random() * 0.2;
      ctx.setLineDash([dashLength, dashLength * (1 + random())]);

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// Draw time spiral / vortex
function drawTimeSpiral(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  palette: ColorPalette,
  random: () => number
): void {
  if (random() > 0.6) return; // Only sometimes show spiral

  const centerX = width * (0.2 + random() * 0.6);
  const centerY = height * (0.2 + random() * 0.6);
  const maxRadius = 40 + intensity * 60;
  const turns = 2 + intensity * 3;

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.2;

  ctx.beginPath();
  for (let i = 0; i <= turns * 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    const radius = (i / (turns * 100)) * maxRadius;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// Draw cosmic dust particles
function drawCosmicDust(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  density: number,
  palette: ColorPalette,
  random: () => number
): void {
  const particleCount = Math.floor(30 + density * 100);

  for (let i = 0; i < particleCount; i++) {
    const x = random() * width;
    const y = random() * height;
    const size = 0.3 + random() * 1.5;

    ctx.globalAlpha = 0.1 + random() * 0.2;
    ctx.fillStyle = random() > 0.5 ? palette.nebula : palette.glow;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// Draw constellation lines connecting bright stars
function drawConstellations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  complexity: number,
  palette: ColorPalette,
  random: () => number
): void {
  const constellationCount = Math.floor(1 + complexity * 2);

  for (let c = 0; c < constellationCount; c++) {
    const starCount = Math.floor(3 + random() * 4);
    const stars: { x: number; y: number }[] = [];

    // Generate star positions for this constellation
    const baseX = random() * width * 0.6 + width * 0.2;
    const baseY = random() * height * 0.6 + height * 0.2;

    for (let s = 0; s < starCount; s++) {
      stars.push({
        x: baseX + (random() - 0.5) * 80,
        y: baseY + (random() - 0.5) * 80,
      });
    }

    // Draw connecting lines
    ctx.strokeStyle = palette.stars;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.15;

    ctx.beginPath();
    for (let s = 0; s < stars.length - 1; s++) {
      ctx.moveTo(stars[s].x, stars[s].y);
      ctx.lineTo(stars[s + 1].x, stars[s + 1].y);
    }
    ctx.stroke();

    // Draw stars at vertices
    ctx.globalAlpha = 0.6;
    for (const star of stars) {
      ctx.fillStyle = palette.stars;
      ctx.beginPath();
      ctx.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

// Draw subtle clock/time markers at edges
function drawTimeMarkers(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ColorPalette,
  random: () => number
): void {
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.25;

  // Corner tick marks like clock indices
  const cornerSize = 20 + random() * 15;
  const tickCount = 3;

  // Top-left corner
  for (let i = 0; i < tickCount; i++) {
    const offset = (i + 1) * (cornerSize / tickCount);
    // Horizontal ticks
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(5 + random() * 5, offset);
    ctx.stroke();
    // Vertical ticks
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, 5 + random() * 5);
    ctx.stroke();
  }

  // Bottom-right corner
  for (let i = 0; i < tickCount; i++) {
    const offset = (i + 1) * (cornerSize / tickCount);
    ctx.beginPath();
    ctx.moveTo(width, height - offset);
    ctx.lineTo(width - 5 - random() * 5, height - offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - offset, height);
    ctx.lineTo(width - offset, height - 5 - random() * 5);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Main generation function
export function generateBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brew: Brew
): void {
  const seedString = `${brew.id}-${brew.abv}-${brew.ibu}-${brew.og}-${brew.style}`;
  const random = createSeededRandom(seedString);

  const complexity = normalize(brew.abv, 2, 15);
  const sharpness = normalize(brew.ibu, 0, 100);
  const scale = normalize(brew.og, 1.03, 1.12);
  const srm = brew.srm ?? estimateSRMFromStyle(brew.style);

  const palette = getPaletteFromSRM(srm);

  // Layer 1: Deep space background
  drawDeepSpace(ctx, width, height, palette, random);

  // Layer 2: Nebula clouds
  drawNebula(ctx, width, height, complexity, palette, random);

  // Layer 3: Cosmic dust
  drawCosmicDust(ctx, width, height, complexity, palette, random);

  // Layer 4: Star field
  drawStarField(ctx, width, height, complexity, sharpness, palette, random);

  // Layer 5: Constellations
  drawConstellations(ctx, width, height, complexity, palette, random);

  // Layer 6: Orbital rings (time/motion)
  drawOrbitalRings(ctx, width, height, scale, palette, random);

  // Layer 7: Time spiral/vortex
  drawTimeSpiral(ctx, width, height, complexity, palette, random);

  // Layer 8: Time markers
  drawTimeMarkers(ctx, width, height, palette, random);
}

function estimateSRMFromStyle(style: string): number {
  const s = style.toLowerCase();

  if (s.includes('imperial stout') || s.includes('russian imperial')) return 40;
  if (s.includes('stout') || s.includes('porter')) return 30;
  if (s.includes('brown') || s.includes('dunkel')) return 18;
  if (s.includes('amber') || s.includes('red') || s.includes('märzen')) return 14;
  if (s.includes('ipa') || s.includes('pale ale')) return 8;
  if (s.includes('wheat') || s.includes('hefeweizen')) return 4;
  if (s.includes('pilsner') || s.includes('lager') || s.includes('kölsch')) return 3;
  if (s.includes('tripel') || s.includes('belgian')) return 5;

  return 10;
}

export { getPaletteFromSRM, createSeededRandom };
