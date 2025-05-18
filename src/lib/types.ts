export interface PhotoMetadata {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  iso: string;
  shutterSpeed: string;
}

export interface Photo {
  id: string;
  src: string;
  title: string;
  albumId: string;
  metadata: PhotoMetadata;
}

export interface AlbumMetadata {
  title: string;
  location: string;
  date: string;
  description: string;
}

export interface Album {
  id: string;
  photos: Photo[];
  metadata: AlbumMetadata;
}

export interface GearItem {
  type: 'camera' | 'lens' | 'accessory';
  name: string;
  description: string;
  specs: string[];
  image?: string;
}

export interface CoverArtThumbnails {
  250: string;
  500: string;
  1200: string;
  small: string;
  large: string;
}

export interface CoverArtImage {
  types: string[];
  front: boolean;
  back: boolean;
  edit: number;
  image: string;
  comment: string;
  approved: boolean;
  id: string;
  thumbnails: CoverArtThumbnails;
}

export interface CoverArtResponse {
  images: CoverArtImage[];
  release: string;
}

export interface DeezerArtist {
  id: number;
  name: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
}

export interface DeezerAlbum {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
  duration: number;
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
      }) => any;
    };
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): {
          bind: (event: string, callback: (e: any) => void) => void;
          load: (url: string) => Promise<void>;
          play: () => void;
          pause: () => void;
        };
        Events: {
          PLAY_PROGRESS: string;
          FINISH: string;
        };
      };
    };
  }
} 