<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Photo } from '$lib/types';
  
  export let photo: Photo;
  export let photos: Photo[] = [];
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
  let currentImageSrc = '';
  let currentLoadingPhotoId = '';
  let currentAbortController: AbortController | null = null; // Add abort controller

  // Find current photo index and adjacent photos
  $: currentIndex = photos.findIndex(p => p.id === photo.id);
  $: prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  $: nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  const downloadSizes = [
    { label: 'S (1024px)', width: 1024 },
    { label: 'M (2048px)', width: 2048 },
    { label: 'L (3072px)', width: 3072 },
    { label: 'Original', width: null }
  ];

  // Function to extract filename from path
  function getFileName(src: string): string {
    return src.split('/').pop() || src;
  }

  // Generate responsive image URLs - corrected to use /responsive directory
  function getResponsiveUrl(originalUrl: string, size: number): string {
    // originalUrl is like: /photos/gdansk/GDG-001.jpg
    // We want: /responsive/gdansk/GDG-001-800w.jpg
    
    const parts = originalUrl.split('/');
    const filename = parts.pop() || ''; // GDG-001.jpg
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // GDG-001
    
    // Get the album name (gdansk, luzern, etc.)
    const albumName = parts[parts.length - 1]; // gdansk
    
    return `/responsive/${albumName}/${filenameWithoutExt}-${size}w.jpg`;
  }

  // Get the best initial size based on screen
  function getInitialSize(): number {
    if (typeof window === 'undefined') return 1200;
    
    const screenWidth = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;
    const effectiveWidth = screenWidth * dpr;
    
    if (effectiveWidth <= 400) return 400;
    if (effectiveWidth <= 800) return 800;
    return 1200;
  }

  // Progressive loading class with abort support
  class ProgressiveImageLoader {
    private cache = new Map<string, HTMLImageElement>();
    private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

    async loadImage(src: string, signal?: AbortSignal): Promise<HTMLImageElement> {
      if (this.cache.has(src)) {
        return this.cache.get(src)!;
      }

      if (this.loadingPromises.has(src)) {
        return this.loadingPromises.get(src)!;
      }

      const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        
        // Handle abort signal
        if (signal) {
          signal.addEventListener('abort', () => {
            img.src = ''; // Stop loading
            this.loadingPromises.delete(src);
            reject(new Error('Aborted'));
          });
        }
        
        img.onload = () => {
          if (signal?.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          this.cache.set(src, img);
          this.loadingPromises.delete(src);
          resolve(img);
        };

        img.onerror = () => {
          this.loadingPromises.delete(src);
          reject(new Error(`Failed to load: ${src}`));
        };

        img.src = src;
      });

      this.loadingPromises.set(src, promise);
      return promise;
    }

    isLoaded(src: string): boolean {
      return this.cache.has(src);
    }

    // Preload at low priority (won't block main image)
    preloadLowPriority(src: string): void {
      if (!this.cache.has(src) && !this.loadingPromises.has(src)) {
        // Use setTimeout to ensure it runs after main image loading
        setTimeout(() => {
          this.loadImage(src).catch(() => {
            // Silently fail for preload
          });
        }, 100);
      }
    }
  }

  const imageLoader = new ProgressiveImageLoader();

  // Load image progressively with proper cancellation
  async function loadImageProgressively(targetPhoto: Photo) {
    // Cancel any previous loading
    if (currentAbortController) {
      currentAbortController.abort();
    }
    
    const loadingPhotoId = targetPhoto.id;
    currentLoadingPhotoId = loadingPhotoId;
    
    // Create new abort controller for this loading session
    const abortController = new AbortController();
    currentAbortController = abortController;
    const signal = abortController.signal;
    
    const initialSize = getInitialSize();
    const responsiveUrl = getResponsiveUrl(targetPhoto.src, initialSize);
    
    try {
      // Check if aborted before starting
      if (signal.aborted) return;
      
      // Step 1: Load responsive version immediately
      console.log(`Loading responsive: ${responsiveUrl}`);
      const responsiveImg = await imageLoader.loadImage(responsiveUrl, signal);
      
      // Frequent cancellation checks
      if (signal.aborted || currentLoadingPhotoId !== loadingPhotoId || targetPhoto.id !== photo.id) {
        console.log(`Abandoned responsive load for ${loadingPhotoId} - user navigated away`);
        return;
      }
      
      // Update image immediately with responsive version
      if (imageElement && !signal.aborted) {
        imageElement.style.transition = 'none';
        imageElement.src = responsiveImg.src;
        currentImageSrc = responsiveImg.src;
        
        // Force reflow to ensure image dimensions are calculated
        void imageElement.offsetHeight;
        
        // Re-enable transitions
        requestAnimationFrame(() => {
          if (!signal.aborted) {
            imageElement.style.transition = '';
          }
        });
      }
      
      // Check again before proceeding to full resolution
      if (signal.aborted || currentLoadingPhotoId !== loadingPhotoId || targetPhoto.id !== photo.id) {
        return;
      }
      
      // Step 2: Load full resolution in background

      // If screen is smaller than 1200px, skip full resolution
      if (initialSize < 1200) {
        console.log(`Skipping full resolution for small screen: ${initialSize}px`);
        return;
      }
      console.log(`Upgrading to full resolution: ${targetPhoto.src}`);
      
      const fullImg = await imageLoader.loadImage(targetPhoto.src, signal);
      
      // Check again after full image loads
      if (signal.aborted || currentLoadingPhotoId !== loadingPhotoId || targetPhoto.id !== photo.id) {
        console.log(`Abandoned full resolution load for ${loadingPhotoId} - user navigated away`);
        return;
      }
      
      // Step 3: Seamless upgrade
      if (imageElement && !signal.aborted) {
        try {
          const tempImg = new Image();
          tempImg.src = fullImg.src;
          
          // Check before decode
          if (signal.aborted) return;
          
          await tempImg.decode();
          
          // Final check before applying
          if (signal.aborted || currentLoadingPhotoId !== loadingPhotoId || targetPhoto.id !== photo.id) {
            console.log(`Abandoned final upgrade for ${loadingPhotoId} - user navigated away`);
            return;
          }
          
          // Disable transitions during upgrade to prevent flicker
          imageElement.style.transition = 'none';
          imageElement.src = fullImg.src;
          currentImageSrc = fullImg.src;
          
          // Force reflow and re-enable transitions
          void imageElement.offsetHeight;
          requestAnimationFrame(() => {
            if (!signal.aborted) {
              imageElement.style.transition = '';
            }
          });
          
        } catch (decodeError) {
          // Fallback for older browsers
          if (!signal.aborted && currentLoadingPhotoId === loadingPhotoId && targetPhoto.id === photo.id) {
            imageElement.src = fullImg.src;
            currentImageSrc = fullImg.src;
          }
        }
      }
      
      console.log(`✓ Upgraded to full resolution for ${loadingPhotoId}`);
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted') {
        console.log(`Loading aborted for ${loadingPhotoId}`);
        return;
      }
      
      console.error('Error loading image:', error);
      
      // Only fallback if we're still loading the same photo and not aborted
      if (!signal.aborted && currentLoadingPhotoId === loadingPhotoId && targetPhoto.id === photo.id && imageElement) {
        imageElement.src = targetPhoto.src;
        currentImageSrc = targetPhoto.src;
      }
    }
  }

  // Smart preloading: only responsive versions of adjacent images
  function preloadAdjacentResponsive() {
    if (photos.length === 0) return;
    
    const size = getInitialSize();
    
    // Preload responsive versions of adjacent images only
    [prevPhoto, nextPhoto].forEach(adjacentPhoto => {
      if (adjacentPhoto) {
        const responsiveUrl = getResponsiveUrl(adjacentPhoto.src, size);
        imageLoader.preloadLowPriority(responsiveUrl);
      }
    });
  }

  // Load new image when photo changes
  $: if (photo) {
    loadImageProgressively(photo);
    // Start preloading adjacent responsive images after main image starts loading
    setTimeout(() => preloadAdjacentResponsive(), 200);
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

<!-- Remove the heavy preload links, we'll handle this in JS -->
<svelte:head>
  <!-- Only preload current image at responsive size -->
  <link rel="preload" as="image" href={getResponsiveUrl(photo.src, getInitialSize())} />
  <link rel="stylesheet" href="/css/viewer.css" />
</svelte:head>

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
    role="banner"
    on:mouseenter={handleTriggerMouseEnter}
    on:mouseleave={handleTriggerMouseLeave}
  >
    <!-- Updated album info overlay with integrated close button -->
    <div class="album-info-overlay">
      <div class="photo-counter-minimal">{currentPhotoIndex} / {totalPhotos}</div>
      
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
      on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? toggleMetadata() : null}
      role="button"
      tabindex="0"
      aria-label="Toggle photo metadata"
    >
      <!-- Progressive loading image - removed upgrading classes -->
      <img 
        bind:this={imageElement}
        src={currentImageSrc || photo.src}
        alt={photo.title}
        loading="eager"
        class="main-image"
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
            <div class="meta-item larger-only">
              <span class="label">FL:</span>
              <span class="value">{photo.metadata.focalLength}</span>
            </div>
            <div class="meta-item">
              <span class="label">Aperture:</span>
              <span class="value">{photo.metadata.aperture}</span>
            </div>
            <div class="meta-item">
              <span class="label">ISO:</span>
              <span class="value">{photo.metadata.iso.replace('ISO', '')}</span>
            </div>
            <div class="meta-item">
              <span class="label">SS:</span>
              <span class="value">{photo.metadata.shutterSpeed}s</span>
            </div>
          </div>
        </div>

        <div class="download-menu-container">
          <button class="action-button" aria-label="Toggle download menu" on:click={toggleDownloadMenu}>
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M12 3v13m0 0l-4-4m4 4l4-4M5 21h14"/>
            </svg>
          </button>
          {#if showDownloadMenu}
            <div 
              class="download-menu" 
              on:click|stopPropagation
              on:keydown={(e) => e.key === 'Escape' ? (showDownloadMenu = false) : null}
              on:mouseenter={handleDownloadMenuEnter}
              on:mouseleave={handleDownloadMenuLeave}
              role="menu"
              aria-label="Download options"
              tabindex="-1"
            >
              {#each downloadSizes as size}
                <button 
                  type="button"
                  class="download-option"
                  role="menuitem"
                  on:click={() => downloadImage(size.width)}
                >
                  {@html size.label.replace(/^(S|M|L)/, '<b style="font-size: medium">$1</b>')}
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
