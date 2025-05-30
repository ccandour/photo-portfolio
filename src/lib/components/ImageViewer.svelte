<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Photo } from '$lib/types';
  
  export let photo: Photo;
  export let prevId: string | null = null;
  export let nextId: string | null = null;
  export let albumId: string | null = null;
  export let returnUrl: string = '/';
  export let albumName: string = '';
  export let currentPhotoIndex: number = 1;
  export let totalPhotos: number = 1;

  let imageElement: HTMLImageElement;
  let showDownloadMenu = false;
  let noiseCanvas: HTMLCanvasElement;
  let showMetadata = false;
  let isMobile = false;
  let isHoveringTrigger = false;
  let isHoveringDownloadMenu = false;

  const downloadSizes = [
    { label: 'Small (1024px)', width: 1024 },
    { label: 'Medium (2048px)', width: 2048 },
    { label: 'Large (3072px)', width: 3072 },
    { label: 'Original', width: null }
  ];

  // Function to extract filename from path
  function getFileName(src: string): string {
    return src.split('/').pop() || src;
  }

  // Helper function to generate URLs for different image sizes
  function getSizedImageUrl(originalUrl: string, width: number, format: string = 'jpg'): string {
    // Convert from /photos/... to /responsive/...
    const responsiveUrl = originalUrl.replace('/photos/', '/responsive/');
    
    // Extract path parts
    const urlParts = responsiveUrl.split('/');
    const filename = urlParts.pop() || '';
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Always use .jpg for progressive variants
    const sizedFilename = `${filenameWithoutExt}-${width}w.${format}`;
    return [...urlParts, sizedFilename].join('/');
  }

  onMount(() => {
    // If no explicit returnUrl was provided, use the albumId as fallback
    if (returnUrl === '/' && albumId) {
      returnUrl = `/album/${albumId}`;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.download-menu-container')) {
        showDownloadMenu = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    // Check if device is mobile
    isMobile = window.innerWidth <= 768;
    
    const handleResize = () => {
      isMobile = window.innerWidth <= 768;
    };
    
    window.addEventListener('resize', handleResize);

    // Initialize noise canvas
    if (noiseCanvas) {
      const ctx = noiseCanvas.getContext('2d');
      if (ctx) {
        noiseCanvas.width = 1024;
        noiseCanvas.height = 1024;
        
        const imageData = ctx.createImageData(noiseCanvas.width, noiseCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const value = Math.random() * 255 * 0.15;
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
          data[i + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' && prevId) {
      goto(`/photo/${prevId}`);
    } else if (event.key === 'ArrowRight' && nextId) {
      goto(`/photo/${nextId}`);
    } else if (event.key === 'Escape') {
      if (showDownloadMenu) {
        showDownloadMenu = false;
      } else {
        goto(returnUrl);
      }
    } else if (event.key === 'i' || event.key === 'I') {
      showMetadata = !showMetadata;
    }
  }

  function handleClose() {
    goto(returnUrl);
  }

  function toggleMetadata() {
    if (isMobile) {
      showMetadata = !showMetadata;
    }
  }

  async function downloadImage(width: number | null) {
    showDownloadMenu = false;
    
    try {
      // If it's original size, just download directly
      if (!width) {
        const link = document.createElement('a');
        link.href = photo.src;
        link.download = `${photo.title}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // For resized versions, we'll need to create a canvas to resize
      const img = new Image();
      img.crossOrigin = "anonymous";  // Enable CORS
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo.src;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate height maintaining aspect ratio
      const aspectRatio = img.height / img.width;
      const height = Math.round(width * aspectRatio);
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const resizedImage = canvas.toDataURL('image/jpeg', 0.95);
        
        const link = document.createElement('a');
        link.href = resizedImage;
        link.download = `${photo.title}_${width}px.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback to original size if resize fails
      const link = document.createElement('a');
      link.href = photo.src;
      link.download = `${photo.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function toggleDownloadMenu(event: MouseEvent) {
    event.stopPropagation();
    showDownloadMenu = !showDownloadMenu;
  }

  function handleMouseMove(event: MouseEvent) {
    // Only show metadata when mouse is in bottom 15% of the screen OR hovering over download menu
    if (!isMobile) {
      const windowHeight = window.innerHeight;
      const bottomThreshold = windowHeight * 0.85; // Bottom 15% of screen
      
      // Check if mouse is in bottom area OR we're hovering over download menu
      const inBottomArea = event.clientY > bottomThreshold;
      showMetadata = inBottomArea || isHoveringDownloadMenu;
    }
  }

  function handleDownloadMenuEnter() {
    isHoveringDownloadMenu = true;
    if (!isMobile) {
      showMetadata = true;
    }
  }

  function handleDownloadMenuLeave() {
    isHoveringDownloadMenu = false;
    // Let the normal mouse move handler determine if we should still show metadata
  }

  function handleTriggerMouseEnter() {
    isHoveringTrigger = true;
  }

  function handleTriggerMouseLeave() {
    isHoveringTrigger = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={handleMouseMove}/>

<div class="viewer">
  <!-- Close button - only show on desktop -->
  <button 
    class="close-button desktop-only" 
    class:hidden-on-hover={isHoveringTrigger} 
    on:click={handleClose} 
    aria-label="Close viewer"
  >
    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  </button>

  <!-- Enhanced hover trigger area -->
  <div 
    class="top-hover-trigger"
    on:mouseenter={handleTriggerMouseEnter}
    on:mouseleave={handleTriggerMouseLeave}
  >
    <!-- Updated album info overlay with integrated close button -->
    <div class="album-info-overlay">
      <div class="photo-counter-minimal">{currentPhotoIndex}/{totalPhotos}</div>
      
      <div class="expanded-info">
        <!-- Mobile layout -->
        <div class="mobile-layout">
          <!-- First row: filename/album on left, close button on right -->
          <div class="mobile-top-row">
            <div class="mobile-info-left">
              <div class="filename-row">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" class="file-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span class="filename">{getFileName(photo.src)}</span>
              </div>
              <div class="album-row">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" class="album-icon">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span class="album-name">{albumName}</span>
              </div>
            </div>
            
            <div class="mobile-close">
              <button class="integrated-close-button" on:click={handleClose} aria-label="Close viewer">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Second row: full-width progress bar -->
          <div class="mobile-progress-row">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {(currentPhotoIndex / totalPhotos) * 100}%"></div>
            </div>
          </div>
        </div>

        <!-- Desktop layout (existing) -->
        <div class="desktop-layout">
          <div class="info-section left">
            <div class="filename-row">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" class="file-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span class="filename">{getFileName(photo.src)}</span>
            </div>
            <div class="album-row">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" class="album-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <span class="album-name">{albumName}</span>
            </div>
          </div>
          
          <div class="info-section center">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {(currentPhotoIndex / totalPhotos) * 100}%"></div>
            </div>
            <div class="progress-text">{currentPhotoIndex} of {totalPhotos} photos</div>
          </div>
          
          <div class="info-section right">
            <button class="integrated-close-button" on:click={handleClose} aria-label="Close viewer">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="background">
    <div class="gradient"></div>
    <canvas bind:this={noiseCanvas} class="noise"></canvas>
  </div>

  <div class="content">
    <div 
      class="photo-container" 
      class:show-metadata={showMetadata}
      on:click={toggleMetadata}
    >
      <picture>
        <!-- WebP for modern browsers -->
        <source 
          srcset={`${getSizedImageUrl(photo.src, 800, 'webp')} 800w, 
                   ${getSizedImageUrl(photo.src, 1200, 'webp')} 1200w`}
          sizes="100vw"
          type="image/webp"
        />
        <!-- JPEG fallback -->
        <source 
          srcset={`${getSizedImageUrl(photo.src, 800, 'jpg')} 800w, 
                   ${getSizedImageUrl(photo.src, 1200, 'jpg')} 1200w,
                   ${photo.src} 2000w`}
          sizes="100vw"
          type="image/jpeg"
        />
        <!-- Fallback img -->
        <img 
          src={photo.src} 
          alt={photo.title}
          bind:this={imageElement}
          loading="eager"
        />
      </picture>
      
      <div class="info-overlay">
        <div class="metadata">
          <div class="meta-rows">
            <div class="meta-item">
              <span class="label">Camera:</span>
              <span class="value">{photo.metadata.camera}</span>
            </div>
            <div class="meta-item">
              <span class="label">Lens:</span>
              <span class="value">{photo.metadata.lens}</span>
            </div>
            <div class="meta-item">
              <span class="label">FL:</span>
              <span class="value">{photo.metadata.focalLength}</span>
            </div>
            <div class="meta-item">
              <span class="label">Aperture:</span>
              <span class="value">{photo.metadata.aperture}</span>
            </div>
            <div class="meta-item">
              <span class="label">ISO:</span>
              <span class="value">{photo.metadata.iso}</span>
            </div>
            <div class="meta-item">
              <span class="label">SS:</span>
              <span class="value">{photo.metadata.shutterSpeed}s</span>
            </div>
          </div>
        </div>

        <div class="download-menu-container">
          <button class="action-button" on:click={toggleDownloadMenu}>
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M12 3v13m0 0l-4-4m4 4l4-4M5 21h14"/>
            </svg>
            <span class="button-text">Download</span>
          </button>

          {#if showDownloadMenu}
            <div 
              class="download-menu" 
              on:click|stopPropagation
              on:mouseenter={handleDownloadMenuEnter}
              on:mouseleave={handleDownloadMenuLeave}
            >
              {#each downloadSizes as size}
                <button 
                  type="button"
                  class="download-option"
                  on:click={() => downloadImage(size.width)}
                >
                  {size.label}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      
      <div class="navigation">
        {#if prevId}
          <button class="nav-button prev" on:click|stopPropagation={() => goto(`/photo/${prevId}`)} aria-label="Previous photo">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        {:else}
          <!-- Empty placeholder to maintain layout -->
          <div></div>
        {/if}

        {#if nextId}
          <button class="nav-button next" on:click|stopPropagation={() => goto(`/photo/${nextId}`)} aria-label="Next photo">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        {:else}
          <!-- Empty placeholder to maintain layout -->
          <div></div>
        {/if}
      </div>

      {#if isMobile && !showMetadata}
        <div class="tap-hint">
          <span>Tap for more info</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .viewer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    z-index: 1000;
  }

  .content {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .photo-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  img {
    max-width: 100%;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  .info-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    box-sizing: border-box;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 10;
  }

  .photo-container.show-metadata .info-overlay {
    transform: translateY(0);
  }

  .metadata {
    flex: 1;
  }

  .meta-rows {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    white-space: nowrap;
  }

  .label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
  }

  .value {
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
  }

  .navigation {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 1rem;
    right: 1rem;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 5;
  }

  .nav-button {
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    pointer-events: auto;
  }

  .nav-button:hover {
    background: rgba(0, 0, 0, 0.6);
  }

  .nav-button svg {
    width: 24px;
    height: 24px;
  }

  .close-button {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 15;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.6);
  }

  .close-button svg {
    width: 24px;
    height: 24px;
  }

  .desktop-only {
    display: block;
  }

  @media (max-width: 768px) {
    .desktop-only {
      display: none !important;
    }
  }

  .close-button.hidden-on-hover {
    opacity: 0;
    visibility: hidden;
    transform: scale(0.8);
    pointer-events: none;
  }

  .close-button {
    transition: all 0.3s ease;
  }

  .download-menu-container {
    position: relative;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .action-button svg {
    width: 18px;
    height: 18px;
  }

  .button-text {
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
  }

  .download-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 0.75rem;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    overflow: hidden;
    min-width: 180px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    opacity: 0;
    transform: translateY(10px) scale(0.95);
    animation: menuSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    z-index: 20;
  }

  @keyframes menuSlideIn {
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .download-option {
    width: 100%;
    padding: 1rem 1.25rem;
    background: transparent;
    border: none;
    color: white;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    font-weight: 400;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    letter-spacing: 0.25px;
    padding-left: 2.5rem;
  }

  .download-option:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 1);
    padding-left: 2.75rem;
  }

  .download-option:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .download-option::before {
    content: '→';
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: all 0.2s ease;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
  }

  .download-option:hover::before {
    opacity: 1;
    left: 1.5rem;
  }

  .background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
  }

  .gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 0% 0%, #ffffff 0%, transparent 50%),
                radial-gradient(circle at 100% 0%, #888888 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, #333333 0%, transparent 50%),
                radial-gradient(circle at 0% 100%, #666666 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, #222222 0%, #000000 100%);
    background-size: 200% 200%;
    animation: gradient 60s ease infinite;
  }

  .noise {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .content::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .content:hover::after {
    opacity: 0.2;
  }

  @keyframes gradient {
    0% { background-position: 0% 0%; }
    25% { background-position: 100% 0%; }
    50% { background-position: 100% 100%; }
    75% { background-position: 0% 100%; }
    100% { background-position: 0% 0%; }
  }

  /* Top info panel */
  .top-hover-trigger {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100vw;
    height: 120px;
    z-index: 12;
    pointer-events: auto;
  }

  .top-hover-trigger:hover .photo-counter-minimal {
    opacity: 0;
    visibility: hidden;
  }

  .top-hover-trigger:hover .expanded-info {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }

  .album-info-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    color: white;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .photo-counter-minimal {
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    pointer-events: auto;
    letter-spacing: 0.3em;
    text-indent: 0.3em;
  }

  .expanded-info {
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    height: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 0.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 0 1rem;
    margin-right: 0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-section.left {
    flex: 1;
    align-items: flex-start;
  }

  .info-section.center {
    flex: 1;
    align-items: center;
    max-width: 300px;
  }

  .info-section.right {
    flex: 0 0 auto;
    align-items: flex-end;
  }

  .integrated-close-button {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    pointer-events: auto;
  }

  .integrated-close-button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .integrated-close-button svg {
    width: 24px;
    height: 24px;
  }

  .filename-row, .album-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .file-icon, .album-icon {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.6);
  }

  .filename {
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.5px;
  }

  .album-name {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .progress-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.9));
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
  }

  @media (max-width: 768px) {
    .top-hover-trigger {
      height: auto;
      position: fixed;
      pointer-events: none;
    }

    .album-info-overlay {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
      margin: 0;
      pointer-events: auto;
    }

    .photo-counter-minimal {
      display: none;
    }

    .expanded-info {
      position: static;
      opacity: 1;
      visibility: visible;
      transform: none;
      pointer-events: auto;
      margin-right: 0;
      padding: 0.75rem 1rem;
      height: auto;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      gap: 0.75rem;
    }

    .mobile-layout {
      display: flex;
    }

    .desktop-layout {
      display: none;
    }

    .mobile-progress-row .progress-bar {
      height: 4px;
      margin-bottom: 0;
    }
  }

  @media (min-width: 769px) {
    .mobile-layout {
      display: none;
    }

    .desktop-layout {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }

    .info-section.left {
      flex: 0 0 auto;
      align-items: flex-start;
      min-width: 0;
    }

    .info-section.center {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .info-section.right {
      flex: 0 0 auto;
      align-items: flex-end;
      margin-left: auto;
    }

    .desktop-layout .info-section.center .progress-bar {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .desktop-layout .info-section.center .progress-text {
      text-align: center;
      white-space: nowrap;
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .album-info-overlay {
      top: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
    }

    .expanded-info {
      margin-right: 0;
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .filename {
      font-size: 0.75rem;
    }

    .album-name {
      font-size: 0.7rem;
    }

    .integrated-close-button {
      width: 40px;
      height: 40px;
    }

    .integrated-close-button svg {
      width: 20px;
      height: 20px;
    }

    .mobile-progress-row .progress-bar {
      height: 3px;
    }
  }

  .mobile-layout {
    display: none;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .mobile-top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 1rem;
  }

  .mobile-info-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .mobile-close {
    flex: 0 0 auto;
  }

  .mobile-progress-row {
    width: 100%;
  }

  .desktop-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  @media (max-width: 768px) {
    .mobile-layout {
      display: flex;
    }

    .desktop-layout {
      display: none;
    }

    .mobile-progress-row .progress-bar {
      height: 4px;
      margin-bottom: 0;
    }
  }

  @media (max-width: 480px) {
    .mobile-top-row {
      gap: 0.5rem;
    }

    .mobile-info-left {
      gap: 0.25rem;
    }

    .mobile-progress-row .progress-bar {
      height: 3px;
    }
  }

  .tap-hint {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 1rem);
    bottom: max(env(safe-area-inset-bottom), 1rem);
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    text-align: center;
    animation: subtleFade 4s ease-in-out infinite;
    z-index: 11;
    pointer-events: none;
  }

  @keyframes subtleFade {
    0%, 20%, 80%, 100% { opacity: 0.2; }
    40%, 60% { opacity: 0.6; }
  }
</style>