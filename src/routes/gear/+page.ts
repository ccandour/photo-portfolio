import type { GearItem } from '$lib/types';
import { gear } from '$lib/data/gear';

export function load() {
  return {
    gear
  };
}

export type PageData = {
  gear: GearItem[];
}; 