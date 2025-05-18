import { writable } from 'svelte/store';

interface PlayerState {
  isPlaying: boolean;
  currentTrackId: number | null;
  progress: number;
  audio: HTMLAudioElement | null;
}

const createPlayerStore = () => {
  const { subscribe, set, update } = writable<PlayerState>({
    isPlaying: false,
    currentTrackId: null,
    progress: 0,
    audio: null
  });

  let audioElement: HTMLAudioElement | null = null;
  let animationFrameId: number | null = null;

  function updateProgress() {
    if (!audioElement) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }
    update(state => ({
      ...state,
      progress: (audioElement.currentTime / audioElement.duration) * 100
    }));
    animationFrameId = requestAnimationFrame(updateProgress);
  }

  return {
    subscribe,
    init: () => {
      audioElement = new Audio();
      audioElement.addEventListener('play', () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(updateProgress);
      });
      audioElement.addEventListener('pause', () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      });
      audioElement.addEventListener('ended', () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        update(state => ({ ...state, isPlaying: false, progress: 0 }));
      });
      update(state => ({ ...state, audio: audioElement }));
    },
    play: (trackId: number, previewUrl: string) => {
      if (!audioElement) return;

      const currentTrackId = Number(audioElement.dataset.trackId);
      if (trackId === currentTrackId) {
        audioElement.play();
      } else {
        audioElement.src = previewUrl;
        audioElement.dataset.trackId = trackId.toString();
        audioElement.play();
      }
      update(state => ({ ...state, isPlaying: true, currentTrackId: trackId }));
    },
    pause: () => {
      if (!audioElement) return;
      audioElement.pause();
      update(state => ({ ...state, isPlaying: false }));
    },
    cleanup: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      set({
        isPlaying: false,
        currentTrackId: null,
        progress: 0,
        audio: null
      });
    }
  };
};

export const playerStore = createPlayerStore(); 