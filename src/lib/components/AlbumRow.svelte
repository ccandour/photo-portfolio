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

  // Function to determine if image is monochrome
  function isMonochrome(photo: any): boolean {
    const filename = photo.src.toLowerCase();
    return filename.includes('mono');
  }
</script>

<section class="album-section">
  <a class="title-section" on:click={goToAlbum}>
    <h2>{album.metadata.location}</h2>
      <div class="date-badge">{album.metadata.date}</div>
  </a>
  
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
        
        <!-- Enhanced metadata overlay -->
        <div class="photo-overlay">
          <div class="photo-info">
            <div class="photo-title">{getFileName(photo.src)}</div>
            <div class="photo-meta">
              <span>{photo.metadata.camera}</span>
              <span class="meta-divider">•</span>
              <span>{photo.metadata.aperture}</span>
              <span class="meta-divider">•</span>
              <span>ISO {photo.metadata.iso.replace('ISO ', '')}</span>
            </div>
          </div>
          <div class="photo-actions">
            <button class="action-btn" title="Quick View">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .album-section {
    margin-bottom: 3rem;
  }

  .album-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .title-section {
    cursor: pointer;
    display: flex;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .title-section h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .date-badge {
    padding: 0.2rem 0.6rem;
    margin-top: 4px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Space Mono', monospace;
    align-self: center; /* Keep the date badge aligned with title baseline */
    margin-top: 0.3rem; /* Fine-tune position */
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

  /* Enhanced photo overlay */
  .photo-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0) 60%,
      rgba(0, 0, 0, 0.8) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 1rem;
    border-radius: 8px;
  }

  .photo-item:hover .photo-overlay {
    opacity: 1;
  }

  .photo-info {
    margin-top: auto;
  }

  .photo-title {
    color: white;
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 0.3rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .photo-meta {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.65rem;
    font-family: 'Space Mono', monospace;
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    align-items: center;
  }

  .meta-divider {
    opacity: 0.5;
  }

  .color-type {
    font-size: 0.6rem;
    opacity: 0.8;
    font-weight: 500;
  }

  .photo-actions {
    align-self: flex-end;
  }

  .action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .action-btn svg {
    width: 14px;
    height: 14px;
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

    .photo-meta {
      font-size: 0.6rem;
    }

    .action-btn {
      width: 24px;
      height: 24px;
    }

    .action-btn svg {
      width: 12px;
      height: 12px;
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

    .photo-title {
      font-size: 0.7rem;
    }

    .photo-meta {
      font-size: 0.55rem;
    }
  }
</style>