<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Photo } from '$lib/types';
  
  export let photo: Photo;
  export let prevId: string | null = null;
  export let nextId: string | null = null;

  let imageElement: HTMLImageElement;
  let imageContainer: HTMLDivElement;
  let showDownloadMenu = false;
  let noiseCanvas: HTMLCanvasElement;

  const downloadSizes = [
    { label: 'Small (1024px)', width: 1024 },
    { label: 'Medium (2048px)', width: 2048 },
    { label: 'Large (3072px)', width: 3072 },
    { label: 'Original', width: null }
  ];

  function updateInfoBarWidth() {
    if (imageElement && imageContainer) {
      const width = imageElement.offsetWidth;
      imageContainer.style.setProperty('--image-width', `${width}px`);
    }
  }

  onMount(() => {
    const observer = new ResizeObserver(updateInfoBarWidth);
    if (imageElement) {
      observer.observe(imageElement);
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.download-menu-container')) {
        showDownloadMenu = false;
      }
    };

    document.addEventListener('click', handleClickOutside);

    // Initialize noise canvas
    if (!noiseCanvas) return;
    
    const ctx = noiseCanvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to higher resolution
    noiseCanvas.width = 1024;
    noiseCanvas.height = 1024;
    
    // Create noise texture
    const imageData = ctx.createImageData(noiseCanvas.width, noiseCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255 * 0.15; // Increase intensity to 15%
      data[i] = value;     // r
      data[i + 1] = value; // g
      data[i + 2] = value; // b
      data[i + 3] = 255;   // alpha
    }
    
    ctx.putImageData(imageData, 0, 0);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClickOutside);
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
        goto('/');
      }
    }
  }

  function handleClose() {
    goto('/');
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
</script>

<svelte:window on:keydown={handleKeydown}/>

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
    <div class="image-container" bind:this={imageContainer}>
      <div class="image-wrapper">
        <img 
          src={photo.src} 
          alt={photo.title} 
          bind:this={imageElement}
          on:load={updateInfoBarWidth}
        />
        
        <div class="navigation">
          {#if prevId}
            <button class="nav-button prev" on:click={() => goto(`/photo/${prevId}`)} aria-label="Previous photo">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          {/if}

          {#if nextId}
            <button class="nav-button next" on:click={() => goto(`/photo/${nextId}`)} aria-label="Next photo">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          {/if}
        </div>
      </div>

      <div class="info-bar">
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
    background: radial-gradient(circle at 0% 0%, #ffffff 0%, transparent 50%),
                radial-gradient(circle at 100% 0%, #888888 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, #333333 0%, transparent 50%),
                radial-gradient(circle at 0% 100%, #666666 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, #222222 0%, #000000 100%);
    background-size: 200% 200%;
    animation: gradient 60s ease infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 0%;
    }
    25% {
      background-position: 100% 0%;
    }
    50% {
      background-position: 100% 100%;
    }
    75% {
      background-position: 0% 100%;
    }
    100% {
      background-position: 0% 0%;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    padding: 5rem 2rem;
    box-sizing: border-box;
  }

  .image-container {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
  }

  .image-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(100% - 240px);
    max-width: 100%;
    max-height: calc(100vh - 240px);
    box-sizing: border-box;
  }

  img {
    max-width: 100%;
    max-height: calc(100vh - 300px);
    width: auto;
    height: auto;
    object-fit: contain;
    margin: 0;
    padding: 0;
    display: block;
    border: 0.5px solid rgba(255, 255, 255, 0.5);
  }

  .navigation {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    left: 2rem;
    right: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
  }

  .nav-button {
    width: 48px;
    height: 48px;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    pointer-events: auto;
    padding: 0;
    margin: 0;
  }

  .nav-button.prev {
    margin-right: auto;
  }

  .nav-button.next {
    margin-left: auto;
  }

  .nav-button:hover {
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .nav-button svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;
    stroke-width: 1.5;
    fill: none;
  }

  .info-bar {
    height: auto;
    min-height: 100px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    width: var(--image-width, auto);
    max-width: calc(100% - 4rem);
    min-width: min(100%, 600px);
    padding: 1.5rem;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 0 0 8px 8px;
    box-sizing: border-box;
  }

  .metadata {
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
    flex: 1;
    max-width: 800px;
    width: 100%;
    min-width: 0;
  }

  .meta-rows {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
    min-width: min(100%, 500px);
  }

  .meta-item {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    white-space: nowrap;
    min-width: fit-content;
  }

  .label {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.9rem;
  }

  .value {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
  }

  .action-button {
    height: 100%;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
  }

  .action-button:hover {
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .action-button svg {
    width: 20px;
    height: 20px;
  }

  .button-text {
    font-family: 'Space Mono', monospace;
    font-size: 0.9rem;
  }

  @media (max-width: 960px) {
    .meta-rows {
      grid-template-columns: repeat(2, minmax(140px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .content {
      padding: 4rem 1rem 1rem;
      margin-top: 2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .image-wrapper {
      width: 100%;
      max-height: calc(100vh - 200px);
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    img {
      max-height: calc(100vh - 400px);
    }

    .navigation {
      position: static;
      transform: none;
      left: auto;
      right: auto;
      padding: 0;
      margin: 0;
      gap: 0;
      width: 100%;
      justify-content: center;
      display: flex;
      flex-direction: row;
    }

    .nav-button {
      width: 100%;
      height: 64px;
      background: rgba(26, 26, 26, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 0.5px solid rgba(255, 255, 255, 0.5);
      border-radius: 0;
    }

    .nav-button svg {
      width: 28px;
      height: 28px;
    }

    .info-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 1.5rem;
      padding: 1.2rem;
      width: 100%;
      max-width: 100%;
      min-width: calc(100% - 2rem);
      margin-bottom: 0;
      border-radius: 0 0 8px 8px;
      flex: 1;
      min-height: auto;
    }

    .meta-rows {
      min-width: 100%;
    }

    .download-menu-container {
      width: 100%;
      margin-top: auto;
    }

    .action-button {
      width: 100%;
      justify-content: center;
    }

    .metadata {
      font-size: 1rem;
    }

    .label, .value {
      font-size: 1rem;
    }

    .button-text {
      font-size: 1rem;
    }

    .close-button {
      top: 1rem !important;
      right: 1rem !important;
    }
  }

  @media (max-width: 480px) {
    .content {
      padding: 3.5rem 0.5rem 0.5rem;
    }

    .image-wrapper {
      width: calc(100% - 1rem);
      gap: 0;
    }

    img {
      max-height: calc(100vh - 350px);
      margin-bottom: 0;
    }

    .info-bar {
      padding: 1rem;
    }

    .meta-rows {
      gap: 0.6rem;
    }

    .metadata {
      font-size: 1.1rem;
    }

    .label, .value {
      font-size: 1.1rem;
    }

    .button-text {
      font-size: 1.1rem;
    }

    .close-button {
      top: 0.5rem !important;
      right: 0.5rem !important;
      width: 44px;
      height: 44px;
    }

    .close-button svg {
      width: 20px;
      height: 20px;
    }
  }

  @media (max-height: 600px) {
    .content {
      padding: 3rem 1rem;
    }

    .image-wrapper {
      max-height: calc(100vh - 180px);
    }

    .info-bar {
      min-height: 80px;
      padding: 1rem;
    }

    .meta-rows {
      gap: 0.6rem;
    }

    .label, .value {
      font-size: 0.75rem;
    }
  }

  .close-button {
    position: fixed;
    top: 2rem;
    right: 2rem;
    width: 48px;
    height: 48px;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10;
    padding: 0;
  }

  .close-button:hover {
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .close-button svg {
    width: 24px;
    height: 24px;
  }

  .download-menu-container {
    position: relative;
    flex-shrink: 0;
  }

  .download-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 0.5rem;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
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
    white-space: nowrap;
  }

  .download-option:hover {
    background: rgba(26, 26, 26, 0.5);
  }

  .download-option:not(:last-child) {
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 640px) {
    .download-menu {
      right: -1rem;
    }
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

  @keyframes gradient {
    0% {
      background-position: 0% 0%;
    }
    25% {
      background-position: 100% 0%;
    }
    50% {
      background-position: 100% 100%;
    }
    75% {
      background-position: 0% 100%;
    }
    100% {
      background-position: 0% 0%;
    }
  }
</style> 