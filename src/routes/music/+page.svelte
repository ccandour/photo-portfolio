<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { playerStore } from '$lib/stores/player';
  import type { DeezerTrack } from '$lib/types';

  interface TrackRecommendation {
    searchQuery: string;
    description: string;
    mood: string;
    track?: DeezerTrack;
  }

  const recommendations: TrackRecommendation[] = [
	{
		searchQuery: 'LovelieSCrushing Babysbreath',
		description: 'ethereal beauty.',
		mood: 'Ethereal'
	},
	{
		searchQuery: 'LSD and the Search for God Dont Care',
		description: 'layers of sound that take you places.',
		mood: 'Melancholic'
	},
  	{
		searchQuery: 'My Bloody Valentine When You Sleep',
		description: 'where it all began.',
		mood: 'Dreamy'
	},
	{
		searchQuery: 'Asobi Seksu Goodbye',
		description: 'such an underrated record.',
		mood: 'Ethereal'
	},
  {
    searchQuery: 'Myslovitz Wielki błękit',
    description: 'całkowite kino.',
    mood: 'Nostalgic'
  },
	{
		searchQuery: 'Slowdive When the Sun Hits',
		description: 'absolute perfection.',
		mood: 'Ethereal'
	},
	{
		searchQuery: 'Ozean Scenic',
		description: 'dreamy soundscapes.',
		mood: 'Ambient'
	},
	{
		searchQuery: 'wifiskeleton Nope Your Too Late I Already Died',
		description: 'rip man.',
		mood: 'Melancholic'
	},
	{
		searchQuery: 'Cocteau Twins Frou-Frou Foxes in Midsummer Fires',
		description: 'now this is a masterpiece, go listen.',
		mood: 'Dreamy'
	},
	{
		searchQuery: 'Mazzy Star Fade Into You',
		description: 'ITERATIONS.',
		mood: 'Nostalgic'
	},
	{
		searchQuery: 'Rumskib Where Are The Flowers',
		description: 'shoegazemaxxing.',
		mood: 'Melancholic'
	},
	{
		searchQuery: 'Alvvays Archie, Marry Me',
		description: 'Alvvays is so peak ong.',
		mood: 'Upbeat'
	},
	{
		searchQuery: 'The Smiths Cemetery Gates',
		description: 'i love the Smiths.',
		mood: 'Poetic'
	},
	{
		searchQuery: 'Baby Baby Going Steady',
		description: 'j-punk anthem.',
		mood: 'Energetic'
	},
	{
		searchQuery: 'The Cure Just Like Heaven',
		description: 'show-me show-me.',
		mood: 'Uplifting'
	}
  ];

  let loading = true;
  $: currentTrackId = $playerStore.currentTrackId;
  $: isPlaying = $playerStore.isPlaying;
  $: progress = $playerStore.progress;

  async function loadTracks() {
    for (const rec of recommendations) {
      try {
        // Create a unique callback name for each request
        const callbackName = `deezerCallback_${Math.random().toString(36).substring(7)}`;
        
        // Create a promise that will resolve when the JSONP callback is called
        const jsonpPromise = new Promise((resolve) => {
          (window as any)[callbackName] = (data: any) => {
            resolve(data);
            delete (window as any)[callbackName];
            script.remove();
          };
        });

        // Create and append the script tag
        const script = document.createElement('script');
        script.src = `https://api.deezer.com/search?q=${encodeURIComponent(rec.searchQuery)}&output=jsonp&callback=${callbackName}`;
        document.body.appendChild(script);

        // Wait for the data
        const data = await jsonpPromise as { data: DeezerTrack[] };
        if (data.data && data.data.length > 0) {
          rec.track = data.data[0];
        }
      } catch (error) {
        console.error('Error fetching track:', error);
      }
    }
    loading = false;
  }

  function togglePlay(track: DeezerTrack) {
    if (currentTrackId === track.id && isPlaying) {
      playerStore.pause();
    } else {
      playerStore.play(track.id, track.preview);
    }
  }

  onMount(() => {
    playerStore.init();
    loadTracks();
  });

  onDestroy(() => {
    playerStore.cleanup();
  });
</script>

<div class="wrapper">
  <main>
    <h1>Music Picks</h1>
    <p class="intro">Some peak music, check it out.</p>

    <div class="recommendations">
      {#if loading}
        <!-- Loading placeholders -->
        {#each Array(5) as _, i}
          <div class="track-card placeholder">
            <div class="track-main">
              <div class="album-art">
                <div class="placeholder-image"></div>
                <div class="placeholder-play-button"></div>
              </div>
              <div class="track-details">
                <div class="track-header">
                  <div>
                    <div class="placeholder-text placeholder-title"></div>
                    <div class="placeholder-text placeholder-artist"></div>
                    <div class="placeholder-text placeholder-album"></div>
                  </div>
                  <div class="placeholder-text placeholder-duration"></div>
                </div>
                <div class="track-meta">
                  <div class="placeholder-mood"></div>
                </div>
                <div class="placeholder-text placeholder-description"></div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress" style="width: 0%" />
            </div>
          </div>
        {/each}
      {:else}
        {#each recommendations as rec}
          {#if rec.track}
            <div class="track-card">
              <div class="track-main">
                <div class="album-art">
                  <img src={rec.track.album.cover_medium} alt={`${rec.track.album.title} cover`} />
                  <button 
                    class="play-button" 
                    aria-label="Play {rec.track.title}"
                    on:click={() => togglePlay(rec.track!)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      {#if currentTrackId === rec.track.id && isPlaying}
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="15" y="4" width="4" height="16" rx="1"/>
                      {:else}
                        <polygon points="6 3 21 12 6 21" />
                      {/if}
                    </svg>
                  </button>
                </div>
                <div class="track-details">
                  <div class="track-header">
                    <div>
                      <h3 class="track-title">{rec.track.title}</h3>
                      <p class="track-artist">{rec.track.artist.name}</p>
                      <p class="track-album">{rec.track.album.title}</p>
                    </div>
                    <span class="duration">{Math.floor(rec.track.duration / 60)}:{(rec.track.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div class="track-meta">
                    <span class="mood">{rec.mood}</span>
                  </div>
                  <p class="description">{rec.description}</p>
                </div>
              </div>
              {#if currentTrackId === rec.track.id}
                <div class="progress-bar">
                  <div class="progress" style="width: {progress}%" />
                </div>
              {:else}
                <div class="progress-bar">
                  <div class="progress" style="width: 0%" />
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </main>
</div>

<style>
  .wrapper {
    padding: 0 4rem;
    width: 100%;
    box-sizing: border-box;
  }

  main {
    margin-top: 6rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    padding: 1.5rem 0;
  }

  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: block;
    margin-block-start: 0.67em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
  }

  .intro {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 3rem;
    line-height: 1.5;
  }

  .recommendations {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .track-card {
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .track-card:hover {
    transform: translateY(-4px);
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .track-main {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .album-art {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
  }

  .album-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .album-art:hover .play-button {
    opacity: 1;
  }

  .play-button:hover {
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
    transform: translate(-50%, -50%) scale(1.1);
  }

  .play-button svg {
    width: 24px;
    height: 24px;
  }

  .track-details {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .track-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .track-title {
    font-size: 1.2rem;
    font-weight: 400;
    margin: 0;
    color: #fff;
  }

  .track-artist {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0.3rem 0;
  }

  .track-album {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  .duration {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    font-family: 'Space Mono', monospace;
  }

  .track-meta {
    margin-bottom: 1rem;
  }

  .mood {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 4px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .description {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
    margin: 0;
    font-size: 0.9rem;
  }

  .progress-bar {
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
  }

  .progress {
    height: 100%;
    background: rgba(255, 255, 255, 0.7);
    transition: width 0.1s linear;
  }

  /* Loading placeholder styles */
  .track-card.placeholder {
    pointer-events: none;
  }

  .placeholder-image {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    animation: pulse 2s ease-in-out infinite;
  }

  .placeholder-play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    animation-delay: 0.2s;
  }

  .placeholder-text {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    animation: pulse 2s ease-in-out infinite;
  }

  .placeholder-title {
    height: 1.2rem;
    width: 60%;
    margin-bottom: 0.3rem;
    animation-delay: 0.1s;
  }

  .placeholder-artist {
    height: 0.9rem;
    width: 45%;
    margin-bottom: 0.3rem;
    animation-delay: 0.2s;
  }

  .placeholder-album {
    height: 0.8rem;
    width: 70%;
    margin-bottom: 1rem;
    animation-delay: 0.3s;
  }

  .placeholder-duration {
    height: 0.8rem;
    width: 40px;
    animation-delay: 0.4s;
  }

  .placeholder-mood {
    display: inline-block;
    height: 1.4rem;
    width: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    margin-bottom: 1rem;
    animation: pulse 2s ease-in-out infinite;
    animation-delay: 0.5s;
  }

  .placeholder-description {
    height: 0.9rem;
    width: 80%;
    animation-delay: 0.6s;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  /* Mobile placeholder adjustments */
  @media (max-width: 768px) {
    .track-card.placeholder .track-main {
      padding: 1rem;
    }

    .placeholder-play-button {
      width: 40px;
      height: 40px;
    }

    .placeholder-title {
      height: 1rem;
    }

    .placeholder-artist {
      height: 0.85rem;
    }

    .placeholder-mood,
    .placeholder-description {
      display: none;
    }

    .placeholder-album {
      margin-bottom: 0rem; /* Remove bottom margin since mood/description are hidden */
    }
  }

  @media (max-width: 480px) {
    .track-card.placeholder .track-main {
      padding: 0.75rem;
      gap: 0.75rem;
    }

    .track-card.placeholder .album-art {
      width: 60px;
      height: 60px;
    }

    .placeholder-play-button {
      width: 32px;
      height: 32px;
    }

    .placeholder-title {
      height: 0.9rem;
    }

    .placeholder-artist {
      height: 0.8rem;
    }

    .placeholder-album {
      margin-bottom: 0; /* Remove bottom margin completely on mobile */
    }
  }

  @media (max-width: 768px) {
    .wrapper {
      padding: 0 1.5rem;
    }

    main {
      margin-top: 6rem;
      padding: 1.5rem 0;
    }

    h1 {
      font-size: 1.8rem;
    }

    .track-main {
      flex-direction: row;
      gap: 1rem;
      padding: 1rem;
    }
    
    .album-art {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }
    
    .play-button {
      width: 40px;
      height: 40px;
    }
    
    .play-button svg {
      width: 20px;
      height: 20px;
    }
    
    .track-header {
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }
    
    .track-title {
      font-size: 1rem;
    }
    
    .track-artist {
      font-size: 0.85rem;
    }
    
    .description,
    .duration {
      display: none;
    }
    
    .track-meta {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .wrapper {
      padding: 0 1rem;
    }

    main {
      margin-top: 5rem;
      padding: 1rem 0;
    }
    
    .recommendations {
      gap: 1.5rem;
    }

    .track-main {
      padding: 0.75rem;
      gap: 0.75rem;
    }
    
    .album-art {
      width: 60px;
      height: 60px;
    }
    
    .play-button {
      width: 32px;
      height: 32px;
    }
    
    .play-button svg {
      width: 16px;
      height: 16px;
    }

    .track-title {
      font-size: 0.9rem;
    }

    .track-artist {
      font-size: 0.8rem;
    }
    
    .description {
      font-size: 0.75rem;
    }
  }
</style>