interface SpotifyEmbedProps {
  spotifyId: string;
  spotifyType?: 'album' | 'playlist';
  title?: string;
}

/**
 * Spotify embed with consistent styling
 * Displays in grayscale until hovered
 */
export default function SpotifyEmbed({
  spotifyId,
  spotifyType = 'album',
  title = 'Brewed Listening To',
}: SpotifyEmbedProps) {
  return (
    <div className="border border-art-deco-brass/25">
      <div className="border-b border-art-deco-brass/25 px-4 py-3">
        <h4 className="font-sans uppercase font-light text-sm tracking-widest text-stardust/75">
          {title}
        </h4>
      </div>
      <div className="p-4 group">
        <div className="grayscale transition-all duration-500 group-hover:grayscale-0">
          <iframe
            src={`https://open.spotify.com/embed/${spotifyType}/${spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}