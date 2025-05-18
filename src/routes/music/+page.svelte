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
      searchQuery: 'artist:"wifiskeleton" track:"Nope Your Too Late I Already Died"',
      description: 'rip wifiskeleton.',
      mood: 'Melancholic'
    },
    {
      searchQuery: 'artist:"AERIAL LOVE FEED" track:"Raise Up"',
      description: 'kinda rocks.',
      mood: 'Atmospheric'
    },
    {
      searchQuery: 'artist:"Cocteau Twins" track:"Frou-Frou Foxes in Midsummer Fires"',
      description: 'this album is a masterpiece, go listen.',
      mood: 'Dreamy'
    },
    {
      searchQuery: 'artist:"Mazzy Star" track:"Fade Into You"',
      description: 'classic.',
      mood: 'Nostalgic'
    },
    {
      searchQuery: 'artist:"Rumskib" track:"Where Are The Flowers"',
      description: 'shoegazemaxxing.',
      mood: 'Melancholic'
    },
    {
      searchQuery: 'artist:"Alvvays" track:"Archie, Marry Me"',
      description: 'Alvvays great.',
      mood: 'Upbeat'
    },
    {
      searchQuery: 'artist:"The Smiths" track:"Cemetery Gates"',
      description: 'i love the Smiths.',
      mood: 'Poetic'
    },
    {
      searchQuery: 'track:"Baby Baby" artist:"Going Steady"',
      description: 'japanese punk rock anthem.',
      mood: 'Energetic'
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

<nav>
  <a href="/">Home</a>
  <a href="/gear">Gear</a>
  <a href="/music" class="active">Music</a>
  <a href="/about">About me</a>
</nav>

<div class="wrapper">
  <main>
    <h1>Music Picks</h1>
    <p class="intro">A collection of tracks from albums that inspire my work.</p>

    <div class="recommendations">
      {#if loading}
        <p>Loading tracks...</p>
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
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      {:else}
                        <polygon points="5 3 19 12 5 21" />
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
    padding: 2rem 0;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 400;
    margin-bottom: 1rem;
    color: #fff;
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
    margin-left: 3px;
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

  nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 100;
  }

  nav a {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  nav a:hover {
    opacity: 1;
  }

  nav a.active {
    opacity: 1;
  }
</style> 