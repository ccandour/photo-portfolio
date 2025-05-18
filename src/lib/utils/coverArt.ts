import type { CoverArtResponse } from '$lib/types';

const COVER_ART_API_BASE = 'https://coverartarchive.org';

export async function fetchAlbumArtwork(mbid: string): Promise<string | null> {
  try {
    // First try to get the front cover directly
    const frontResponse = await fetch(`${COVER_ART_API_BASE}/release/${mbid}/front-500`);
    if (frontResponse.ok) {
      return frontResponse.url;
    }

    // If that fails, try to get the full release info and find a front cover
    const response = await fetch(`${COVER_ART_API_BASE}/release/${mbid}`);
    if (!response.ok) {
      return null;
    }

    const data: CoverArtResponse = await response.json();
    const frontImage = data.images.find(img => img.front);
    
    return frontImage?.thumbnails[500] || null;
  } catch (error) {
    console.error('Error fetching album artwork:', error);
    return null;
  }
} 