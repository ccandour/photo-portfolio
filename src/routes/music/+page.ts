import type { TrackRecommendation } from '$lib/types';
import { recommendations } from '$lib/data/music';

export function load() {
  return {
    recommendations
  };
}

export type PageData = {
  recommendations: TrackRecommendation[];
}; 