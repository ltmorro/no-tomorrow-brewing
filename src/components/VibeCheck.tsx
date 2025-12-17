import { useEffect, useState, useRef } from 'react';
import ColorThief from 'colorthief';

interface Props {
  spotifyId: string;
  showTitle?: boolean;
}

type RGB = [number, number, number];

export default function VibeCheck({ spotifyId, showTitle = true }: Props) {
  const [palette, setPalette] = useState<RGB[] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const fetchAlbumArt = async () => {
      try {
        // Spotify oEmbed API - no auth required
        const response = await fetch(
          `https://open.spotify.com/oembed?url=https://open.spotify.com/album/${spotifyId}`
        );
        const data = await response.json();

        if (data.thumbnail_url) {
          // Create image element for ColorThief
          const img = new Image();
          img.crossOrigin = 'Anonymous';

          // Use a CORS proxy for the Spotify CDN image
          // Spotify's CDN supports CORS, but we need to ensure the request is made correctly
          img.src = data.thumbnail_url;

          img.onload = () => {
            try {
              const colorThief = new ColorThief();
              // Get 5 colors from the palette
              const extractedPalette = colorThief.getPalette(img, 5) as RGB[];
              setPalette(extractedPalette);
              setIsLoaded(true);
            } catch (err) {
              console.warn('Could not extract colors:', err);
              setIsLoaded(true);
            }
          };

          img.onerror = () => {
            console.warn('Could not load album art for color extraction');
            setIsLoaded(true);
          };

          imgRef.current = img;
        } else {
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('Could not fetch album metadata:', err);
        setIsLoaded(true);
      }
    };

    fetchAlbumArt();
  }, [spotifyId]);

  // Generate gradient glow style from palette
  const getGlowStyle = (): React.CSSProperties => {
    if (!palette || palette.length < 3) {
      return {};
    }

    // Use the dominant colors for the glow
    const [primary, secondary, tertiary] = palette;
    const rgbToString = (rgb: RGB, alpha: number) =>
      `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

    return {
      boxShadow: `
        0 0 40px ${rgbToString(primary, 0.3)},
        0 0 80px ${rgbToString(secondary, 0.2)},
        0 0 120px ${rgbToString(tertiary, 0.1)}
      `,
      transition: 'box-shadow 0.5s ease-in-out',
    };
  };

  return (
    <div className="vibe-check group">
      {showTitle && (
        <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/50 mb-2">
          Sonic Terroir
        </h4>
      )}
      <div
        className={`relative transition-all duration-500 ${
          isLoaded && palette ? 'opacity-100' : 'opacity-90'
        }`}
        style={isLoaded ? getGlowStyle() : {}}
      >
        {/* Gradient background overlay for extra effect */}
        {palette && (
          <div
            className="absolute inset-0 -z-10 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
            style={{
              background: `linear-gradient(135deg,
                rgba(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]}, 0.4) 0%,
                rgba(${palette[1]?.[0] ?? 0}, ${palette[1]?.[1] ?? 0}, ${palette[1]?.[2] ?? 0}, 0.3) 50%,
                rgba(${palette[2]?.[0] ?? 0}, ${palette[2]?.[1] ?? 0}, ${palette[2]?.[2] ?? 0}, 0.2) 100%)`,
            }}
          />
        )}
        <div className="grayscale transition-all duration-500 group-hover:grayscale-0">
          <iframe
            src={`https://open.spotify.com/embed/album/${spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
