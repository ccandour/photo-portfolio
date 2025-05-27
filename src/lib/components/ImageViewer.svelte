<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Photo } from '$lib/types';
  
  export let photo: Photo;
  export let prevId: string | null = null;
  export let nextId: string | null = null;
  export let albumId: string | null = null;
  export let returnUrl: string = '/'; // Add explicit return URL prop

  let imageElement: HTMLImageElement;
  let showDownloadMenu = false;
  let noiseCanvas: HTMLCanvasElement;
  let showMetadata = false;
  let isMobile = false;

  const downloadSizes = [
    { label: 'Small (1024px)', width: 1024 },
    { label: 'Medium (2048px)', width: 2048 },
    { label: 'Large (3072px)', width: 3072 },
    { label: 'Original', width: null }
  ];

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
    // Only show metadata when mouse is in bottom 15% of the screen
    if (!isMobile) {
      const windowHeight = window.innerHeight;
      const bottomThreshold = windowHeight * 0.85; // Bottom 15% of screen
      showMetadata = event.clientY > bottomThreshold;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:mousemove={handleMouseMove}/>

<div class="viewer">
  <button class="close-button" on:click={handleClose} aria-label="Close viewer">
    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  </button>

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
      <img 
        src={photo.src} 
        alt={photo.title}
        bind:this={imageElement}
      />
      
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
            <div class="download-menu" on:click|stopPropagation>
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
    gap: 1.5rem; /* Increased gap for better separation between vertically stacked items */
  }

  .meta-item {
    display: flex;
    flex-direction: column; /* Stack label above value on desktop too */
    align-items: flex-start;
    gap: 0.2rem;
    white-space: nowrap;
  }

  .label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem; /* Slightly smaller font for labels */
  }

  .value {
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem; /* Consistent font size for values */
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
    transition: all 0.2s ease;
    z-index: 15;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.6);
  }

  .close-button svg {
    width: 24px;
    height: 24px;
  }

  .download-menu-container {
    position: relative;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .action-button svg {
    width: 18px;
    height: 18px;
  }

  .button-text {
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
  }

  .download-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
    min-width: 160px;
  }

  .download-option {
    width: 100%;
    padding: 0.8rem 1rem;
    background: transparent;
    border: none;
    color: white;
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .download-option:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .download-option:not(:last-child) {
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
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

  @media (max-width: 768px) {
    .info-overlay {
      position: fixed; /* Change from absolute to fixed */
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      padding: 1rem;
      /* Remove transform since we want it always at bottom */
      transform: translateY(0);
      /* Show/hide with opacity instead */
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .photo-container.show-metadata .info-overlay {
      opacity: 1;
      visibility: visible;
      transform: translateY(0); /* Keep at bottom */
    }
    
    .meta-rows {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem 1rem;
      margin-bottom: 1rem;
      width: 100%;
    }
    
    .meta-item {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }
    
    .label {
      font-size: 0.8rem;
    }
    
    .value {
      font-size: 0.9rem;
    }
    
    .download-menu-container {
      width: 100%;
    }
    
    .action-button {
      width: 100%;
      justify-content: center;
    }
    
    .navigation {
      top: 50%;
      transform: translateY(-50%);
      left: 0;
      right: 0;
      width: 100%;
      padding: 0;
    }
    
    .nav-button {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      margin: 0;
      position: absolute;
    }
    
    .nav-button.prev {
      left: 1rem;
    }
    
    .nav-button.next {
      right: 1rem;
    }
    
    /* Make tap hint sticky to bottom */
    .tap-hint {
      bottom: calc(env(safe-area-inset-bottom) + 1.5rem); /* Add extra space above safe area */
      font-size: 0.7rem;
      padding: 0.4rem 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .close-button {
      top: 1rem;
      right: 1rem;
      width: 48px;
      height: 48px;
    }
    
    .close-button svg {
      width: 24px;
      height: 24px;
    }
    
    /* Adjust tap hint for smaller screens */
    .tap-hint {
      bottom: calc(env(safe-area-inset-bottom) + 1.25rem);
      font-size: 0.65rem;
      padding: 0.35rem 0.7rem;
    }
  }

  .tap-hint {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 1rem); /* Respect safe area */
    bottom: max(env(safe-area-inset-bottom), 1rem); /* Use whichever is larger */
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