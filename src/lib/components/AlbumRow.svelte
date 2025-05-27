<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Album } from '$lib/types';

  export let album: Album;

  function goToAlbum() {
    const albumId = album.metadata.location.toLowerCase()+'@'+album.metadata.date.replaceAll('.', '-').toLowerCase();
    goto(`/album/${albumId}`);
  }

  function goToPhoto(photoId: string) {
    goto(`/photo/${photoId}`);
  }
</script>

<section class="album-section">
  <h2 class="album-title" on:click={goToAlbum}>
    {album.metadata.location} • {album.metadata.date}
  </h2>
  
  <div class="photos-container">
    {#each album.photos as photo}
      <div class="photo-item" on:click={() => goToPhoto(photo.id)}>
        <img src={photo.src} alt={photo.title} loading="lazy" />
      </div>
    {/each}
  </div>
</section>

<style>
  .album-section {
    margin-bottom: 3rem;
  }

  .album-title {
    font-size: 1rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1.5rem;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: rgba(255, 255, 255, 0.3); /* Subtle initial underline */
    text-underline-offset: 4px;
    transition: all 0.2s ease;
  }

  .album-title:hover {
    color: rgba(255, 255, 255, 1);
    text-decoration-color: rgba(255, 255, 255, 0.8); /* Brighter on hover */
  }

  .photos-container {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 1rem;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .photo-item {
    flex: none;
    width: 200px; /* Fixed width for homepage */
    height: 133px; /* Fixed height to maintain 3:2 aspect ratio */
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
  }

  .photo-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .photo-item:hover img {
    transform: scale(1.05);
  }

  .photos-container::-webkit-scrollbar {
    height: 6px;
  }

  .photos-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .photos-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .photos-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    .photo-item {
      width: 160px; /* Smaller on tablet */
      height: 107px;
    }
  }

  @media (max-width: 480px) {
    .photos-container {
      gap: 0.75rem;
    }

    .photo-item {
      width: 140px; /* Even smaller on mobile */
      height: 93px;
    }
  }
</style>