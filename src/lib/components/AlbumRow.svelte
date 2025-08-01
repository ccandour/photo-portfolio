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

<svelte:head>
  <link rel=stylesheet href="/css/albumrow.css">
</svelte:head>

<section class="album-section">
  <a
    class="title-section"
    href={`/album/${album.metadata.location.toLowerCase()}@${album.metadata.date.replaceAll('.', '-').toLowerCase()}`}
  >
    <h2>{album.metadata.location}</h2>
    <div class="date-badge">{album.metadata.date}</div>
  </a>
  
  <div class="photos-container">
    {#each album.photos as photo}
      <div
        class="photo-item"
        role="button"
        tabindex="0"
        aria-label={`View photo ${getFileName(photo.src)}`}
        on:click={() => goToPhoto(photo.id)}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { goToPhoto(photo.id); } }}
      >
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
            loading="lazy"
            alt={getFileName(photo.src)}
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
            <button class="action-btn" title="Quick View" aria-label="Quick View">
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
