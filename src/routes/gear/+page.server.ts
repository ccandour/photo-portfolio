import type { GearItem } from '$lib/types';
import fs from 'fs';
import path from 'path';

export function load() {
  const dataPath = path.resolve(process.env.DATA_DIR || './data', 'gear.json');
  const fileContents = fs.readFileSync(dataPath, 'utf-8');
  const gear = JSON.parse(fileContents);

  return {
    gear
  };
}

export type PageData = {
  gear: GearItem[];
}; 