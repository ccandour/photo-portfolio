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

  // Helper function to generate URLs for responsive images
  function getSizedImageUrl(originalUrl: string, width: number, format: 'webp' | 'jpg'): string {
    // Convert from /photos/... to /responsive/...
    const responsiveUrl = originalUrl.replace('/photos/', '/responsive/');
    
    // Extract path parts
    const urlParts = responsiveUrl.split('/');
    const filename = urlParts.pop() || '';
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Use specified format
    const sizedFilename = `${filenameWithoutExt}-${width}w.${format}`;
    return [...urlParts, sizedFilename].join('/');
  }

  // Function to extract filename from path
  function getFileName(src: string): string {
    return src.split('/').pop() || src;
  }
</script>

<section class="album-section">
  <h2 class="album-title" on:click={goToAlbum}>
    {album.metadata.location} • {album.metadata.date}
  </h2>
  
  <div class="photos-container">
    {#each album.photos as photo}
      <div class="photo-item" on:click={() => goToPhoto(photo.id)}>
        <picture>
          <!-- Modern WebP format -->
          <source 
            srcset={`${getSizedImageUrl(photo.src, 400, 'webp')} 400w, 
                     ${getSizedImageUrl(photo.src, 800, 'webp')} 800w`}
            sizes="(max-width: 768px) 50vw, 33vw"
            type="image/webp"
          />
          <!-- JPEG fallback -->
          <source 
            srcset={`${getSizedImageUrl(photo.src, 400, 'jpg')} 400w, 
                     ${getSizedImageUrl(photo.src, 800, 'jpg')} 800w`}
            sizes="(max-width: 768px) 50vw, 33vw"
            type="image/jpeg"
          />
          <!-- Fallback img -->
          <img 
            src={getSizedImageUrl(photo.src, 400, 'jpg')} 
            alt={photo.title}
            loading="lazy"
          />
        </picture>
        
        <!-- Filename overlay -->
        <div class="filename-overlay">
          <span class="filename">{getFileName(photo.src)}</span>
        </div>
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
    text-decoration-color: rgba(255, 255, 255, 0.3);
    text-underline-offset: 4px;
    transition: all 0.2s ease;
  }

  .album-title:hover {
    color: rgba(255, 255, 255, 1);
    text-decoration-color: rgba(255, 255, 255, 0.8);
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
    width: 300px;
    height: 200px;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
  }

  .photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .photo-item:hover img {
    transform: scale(1.05);
  }

  .filename-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    padding: 1rem;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
  }

  .photo-item:hover .filename-overlay {
    opacity: 1;
    transform: translateY(0);
  }

  .filename {
    color: white;
    font-size: 0.8rem;
    font-family: 'Space Mono', monospace;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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
      width: 176px;
      height: 176px;
    }
  }

  @media (max-width: 480px) {
    .photos-container {
      gap: 0.75rem;
    }

    .photo-item {
      width: 160px;
      height: 160px;
    }
  }
</style>