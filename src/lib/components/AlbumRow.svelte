<script lang="ts">
  import { base } from '$app/paths';
  import type { Album } from '$lib/types';
  export let album: Album;
</script>

<div class="album-section">
  <div class="album-header">
    <div class="album-meta">
      <span class="location">{album.metadata.location},</span>
      <span class="date">{album.metadata.date}</span>
    </div>
  </div>

  <div class="scroll-container">
    <div class="photo-scroll">
      {#each album.photos as photo}
        <a href="{base}/photo/{photo.id}" class="photo-item">
          <div class="photo-wrapper">
            <img src={photo.src} alt={photo.title} loading="lazy" />
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  .album-section {
    margin: 4rem 0;
  }

  .album-header {
    padding: 0 0 1rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .album-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .scroll-container {
    position: relative;
    mask-image: linear-gradient(
      to right,
      black,
      black 90%,
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      black,
      black 90%,
      transparent 100%
    );
  }

  .photo-scroll {
    display: flex;
    overflow-x: auto;
    gap: 1rem;
    padding: 0rem 8rem 0rem 0;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .fade-out {
    display: none;
  }

  /* Hide scrollbar for Chrome, Safari and Opera */
  .photo-scroll::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  .photo-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .photo-item {
    flex: 0 0 auto;
    scroll-snap-align: start;
    border-radius: 4px;
    overflow: hidden;
    transition: transform 0.2s ease;
  }

  .photo-wrapper {
    height: 166px;
    overflow: hidden;
  }

  .photo-item:hover {
    transform: scale(1.02);
  }

  img {
    height: 100%;
    width: auto;
    object-fit: contain;
  }
</style> 