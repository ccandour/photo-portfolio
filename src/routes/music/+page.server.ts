import type { TrackRecommendation } from '$lib/types';
import fs from 'fs';
import path from 'path';

export function load() {
  const dataPath = path.resolve(process.env.DATA_DIR || './data', 'music.json');
  const fileContents = fs.readFileSync(dataPath, 'utf-8');
  const recommendations = JSON.parse(fileContents);

  return {
    recommendations
  };
}

export type PageData = {
  recommendations: TrackRecommendation[];
}; 