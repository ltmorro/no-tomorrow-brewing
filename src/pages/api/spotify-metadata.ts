import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const spotifyId = url.searchParams.get('id');

  if (!spotifyId) {
    return new Response(JSON.stringify({ error: 'No Spotify ID provided' }), {
      status: 400,
    });
  }

  try {
    // FIX: Use the official Spotify URL format
    const spotifyUrl = `https://open.spotify.com/album/${spotifyId}`;
    
    // Call the official oEmbed endpoint
    const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;
    
    const response = await fetch(oEmbedUrl);
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Spotify metadata fetch failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch metadata' }), {
      status: 500,
    });
  }
};