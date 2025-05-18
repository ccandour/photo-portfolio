import type { Photo } from '$lib/types';

export type PageData = {
  photo: Photo;
  prevId: string | null;
  nextId: string | null;
}; 