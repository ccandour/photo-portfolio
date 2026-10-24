<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { playerStore } from '$lib/stores/player';
  import type { DeezerTrack } from '$lib/types';
  import type { PageData } from './$types';
  
  export let data: PageData;
  // Track info (incl. a /music/preview/<id> audio URL) is resolved and cached server-side
  $: recommendations = data.recommendations;
  
  $: currentTrackId = $playerStore.currentTrackId;
  $: isPlaying = $playerStore.isPlaying;
  $: progress = $playerStore.progress;

  function togglePlay(track: DeezerTrack) {
    if (currentTrackId === track.id && isPlaying) {
      playerStore.pause();
    } else {
      playerStore.play(track.id, track.preview);
    }
  }

  onMount(() => {
    playerStore.init();
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
    <h1>what i listen to</h1>
    <p class="intro">Some of my absolute favories, check them out (whole albums ofc)</p>

    <div class="recommendations">
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
    </div>
  </main>
</div>
