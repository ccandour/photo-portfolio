import type { AboutData } from '$lib/types';
import fs from 'fs';
import path from 'path';

export function load() {
  const dataPath = path.resolve(process.env.DATA_DIR || './data', 'about.json');
  const fileContents = fs.readFileSync(dataPath, 'utf-8');
  const about: AboutData = JSON.parse(fileContents);

  return {
    about
  };
}
