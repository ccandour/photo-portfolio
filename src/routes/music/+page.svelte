<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { playerStore } from '$lib/stores/player';
  import type { DeezerTrack } from '$lib/types';
  import type { PageData } from './$types';
  
  export let data: PageData;
  $: recommendations = data.recommendations;
  
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

<svelte:head>
  <title>Music Picks</title>
  <meta name="description" content="Explore my top music recommendations, featuring a mix of dreamy, melancholic, and ethereal tracks." />
  <link rel="stylesheet" href="/css/music.css">
</svelte:head>

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
