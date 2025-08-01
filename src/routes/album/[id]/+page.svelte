<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  
  let mounted = false;
  let selectedFilter = 'all';
  let viewMode = 'grid'; // 'grid' or 'masonry'
  let showStats = false;
  let isMobile = false; // Add this
  
  onMount(() => {
    mounted = true;
    // Check if mobile after component mounts
    isMobile = window.innerWidth < 480;
    
    // Listen for resize events to update mobile state
    const handleResize = () => {
      isMobile = window.innerWidth < 480;
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // Function to extract filename from path
  function getFileName(src: string): string {
    return src.split('/').pop() || src;
  }

  // Helper function to generate URLs for responsive images
  function getSizedImageUrl(originalUrl: string, width: number, format: 'webp' | 'jpg'): string {
    const responsiveUrl = originalUrl.replace('/photos/', '/responsive/');
    const urlParts = responsiveUrl.split('/');
    const filename = urlParts.pop() || '';
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const sizedFilename = `${filenameWithoutExt}-${width}w.${format}`;
    return [...urlParts, sizedFilename].join('/');
  }

  // Mock function to determine if image is monochrome (you can replace with real logic)
  function isMonochrome(photo: any): boolean {
    // Simple heuristic: if filename contains 'bw', 'mono', or 'black'
    const filename = photo.src.toLowerCase();
    return filename.includes('mono');
  }

  // Filter photos based on selected filter
  $: filteredPhotos = (() => {
    switch (selectedFilter) {
      case 'monochrome':
        return data.album.photos.filter(photo => isMonochrome(photo));
      case 'color':
        return data.album.photos.filter(photo => !isMonochrome(photo));
      default:
        return data.album.photos;
    }
  })();

  // Calculate filter counts
  $: monochromeCount = data.album.photos.filter(photo => isMonochrome(photo)).length;
  $: colorCount = data.album.photos.length - monochromeCount;

  // Calculate most used ISO
  $: isos = data.album.photos.map(photo => photo.metadata?.iso.replace('ISO', '').trim() || '100');
  $: averageISO = Math.round(isos.reduce((sum, iso) => sum + Number(iso), 0) / isos.length/50)*50 || 100;

  // Calculate most used shutter speed
  $: shutterSpeeds = data.album.photos.map(photo => {
    const speed = photo.metadata?.shutterSpeed || '1/125';
    const match = speed.match(/(\d+)\/(\d+)/);
    return match ? (Number(match[2])) : 1000; // Default to 1000 if no match
  });
  $: averageShutterSpeed = Math.round(shutterSpeeds.reduce((sum, speed) => sum + speed, 0) / shutterSpeeds.length/50)*50 || 1000;

  // Find most used camera and lens
  $: cameraStats = (() => {
    if (!data.album?.photos || data.album.photos.length === 0) {
      return {
        mostUsedCamera: 'Unknown Camera',
        mostUsedLens: 'Unknown Lens',
        totalShots: 0,
        averageISO: '0'
      };
    }

    const cameraCount: Record<string, number> = {};
    const lensCount: Record<string, number> = {};
    let mostUsedCamera = '';
    let mostUsedLens = '';
    let maxCameraCount = 0;
    let maxLensCount = 0;
    let totalShots = 0;
    
    data.album.photos.forEach(photo => {
      const camera = photo.metadata?.camera || 'Unknown Camera';
      const lens = photo.metadata?.lens || 'Unknown Lens';
      cameraCount[camera] = (cameraCount[camera] || 0) + 1;
      lensCount[lens] = (lensCount[lens] || 0) + 1;
      totalShots++;
    });
    
    for (const camera in cameraCount) {
      if (cameraCount[camera] > maxCameraCount) {
        maxCameraCount = cameraCount[camera];
        mostUsedCamera = camera;
      }
    }
    
    for (const lens in lensCount) {
      if (lensCount[lens] > maxLensCount) {
        maxLensCount = lensCount[lens];
        mostUsedLens = lens;
      }
    }
    
    return {
      mostUsedCamera,
      mostUsedLens,
      totalShots,
      averageISO: averageISO,
      averageShutterSpeed: averageShutterSpeed
    };
  })();


  // Filter options - now reactive to isMobile
  $: filters = [
    { 
      id: 'all', 
      label: isMobile ? 'All' : 'All Photos', 
      count: data.album?.photos?.length || 0 
    },
    { id: 'monochrome', label: 'Monochrome', count: monochromeCount },
    { id: 'color', label: 'Color', count: colorCount }
  ];

  // Function to calculate grid row span based on image aspect ratio
  function calculateRowSpan(photo: any): number {
    // If we have metadata with dimensions, use those
    if (photo.metadata?.width && photo.metadata?.height) {
      const aspectRatio = photo.metadata.width / photo.metadata.height;
      
      // Calculate span based on aspect ratio with much smaller values
      if (aspectRatio < 0.7) return 30; // Very tall/portrait
      if (aspectRatio < 1) return 25;   // Portrait
      if (aspectRatio < 1.5) return 20; // Square-ish
      if (aspectRatio < 2) return 15;   // Landscape
      return 12; // Very wide landscape
    }
    
    // Default span if no metadata
    return 20;
  }

  // Function to copy album link to clipboard
  async function copyAlbumLink() {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
      console.log('Album link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
</script>

<svelte:head>
  <title>{data.album.metadata.location} - {data.album.metadata.date}</title>
  <meta name="description" content="Explore the street photography album from {data.album.metadata.location} captured on {data.album.metadata.date}.">
  <link rel="stylesheet" href="/css/album.css">
</svelte:head>

<div class="wrapper">
  <main>
    <!-- Enhanced Album Header -->
    <div class="album-header">
      <div class="album-info">
        <div class="title-section">
          <h1>{data.album.metadata.location}</h1>
          <div class="date-badge">{data.album.metadata.date}</div>
        </div>

        <div class="album-action-row">
          <div class="album-meta">
            <span class="photo-count">{filteredPhotos.length} of {data.album.photos.length} photos</span>
            <span class="divider">•</span>
            <span class="album-type">Street Photography</span>
            <span class="divider">•</span>
            <button class="stats-toggle" on:click={() => showStats = !showStats}>
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
          <div class="header-controls">
          <button class="back-button" on:click={() => goto('/')}>
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <span>
            Back <span class="hide-mobile">to Home</span>
            </span>
          </button>
          </div>
      </div>

        <!-- Expandable Stats Panel -->
        {#if showStats}
          <div class="stats-panel">
            <div class="stat-item">
              <div class="stat-label">Camera</div>
              <div class="stat-value">{cameraStats.mostUsedCamera}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Main Lens</div>
              <div class="stat-value">{cameraStats.mostUsedLens}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Average ISO</div>
              <div class="stat-value">{cameraStats.averageISO}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Average Shutter Speed</div>
              <div class="stat-value">1/{cameraStats.averageShutterSpeed}</div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Control Bar -->
    <div class="control-bar">
      <div class="filters">
        {#each filters as filter}
          <button 
            class="filter-btn" 
            class:active={selectedFilter === filter.id}
            on:click={() => selectedFilter = filter.id}
          >
            {filter.label}
            <span class="filter-count">({filter.count})</span>
          </button>
        {/each}
      </div>

      <div class="view-controls">
        <button 
          class="view-btn" 
          class:active={viewMode === 'grid'}
          on:click={() => viewMode = 'grid'}
          title="Grid View"
          aria-label="Grid View"
        >
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        
        <button 
          class="view-btn" 
          class:active={viewMode === 'masonry'}
          on:click={() => viewMode = 'masonry'}
          title="Masonry View"
          aria-label="Masonry View"
        >
          <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
            <rect x="3" y="3" width="7" height="9"/>
            <rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/>
            <rect x="3" y="16" width="7" height="5"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Photo Grid with Dynamic Layout -->
    <div class="photo-grid {viewMode}" class:mounted>
      {#each filteredPhotos as photo, index}
        <button
          type="button"
          class="photo-item"
          class:monochrome={isMonochrome(photo)}
          style="--delay: {index * 0.05}s;"
          on:click={() => goto(`/photo/${photo.id}`)}
          aria-label="View photo"
        >
          <picture>
            <!-- Modern WebP format -->
            <source 
              srcset={`${getSizedImageUrl(photo.src, 400, 'webp')} 400w, 
                       ${getSizedImageUrl(photo.src, 800, 'webp')} 800w`}
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 320px"
              type="image/webp"
            />
            <!-- JPEG fallback -->
            <source 
              srcset={`${getSizedImageUrl(photo.src, 400, 'jpg')} 400w, 
                       ${getSizedImageUrl(photo.src, 800, 'jpg')} 800w`}
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 320px"
              type="image/jpeg"
            />
            <!-- Fallback img -->
            <img 
              src={getSizedImageUrl(photo.src, 400, 'jpg')} 
              alt={photo.title} 
              loading="lazy" 
            />
          </picture>
          
          <!-- Enhanced overlay with more info -->
          <div class="photo-overlay">
            <div class="photo-info">
              <div class="photo-title">{getFileName(photo.src)}</div>
              <div class="photo-meta">
                <span>{photo.metadata.camera}</span>
                <span class="meta-divider">•</span>
                <span>{photo.metadata.aperture}</span>
                <span class="meta-divider">•</span>
                <span>ISO {photo.metadata.iso.replace('ISO ', '')}</span>
                <span class="meta-divider">•</span>
                <span class="color-type">{isMonochrome(photo) ? 'B&W' : 'Color'}</span>
              </div>
            </div>
            <div class="photo-actions">
              <span class="action-btn" title="Quick View" aria-label="Quick View" tabindex="0" role="button">
                <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </span>
            </div>
          </div>
        </button>
      {/each}
    </div>

    <!-- Show message when no photos match filter -->
    {#if filteredPhotos.length === 0}
      <div class="no-results">
        <p>No {selectedFilter} photos found in this album.</p>
        <button class="reset-filter" on:click={() => selectedFilter = 'all'}>
          Show All Photos
        </button>
      </div>
    {/if}

    <!-- Album Footer -->
    <div class="album-footer">
      <div class="footer-content">
        <div class="location-info">
          <h3>About this location</h3>
          <p>Street photography captured in {data.album.metadata.location}, showcasing the urban landscape and daily life of the city. This collection includes both monochrome and color photographs.</p>
        </div>
        
        <div class="sharing-options">
          <h3>Share Album</h3>
          <div class="share-buttons">
            <button class="share-btn" on:click={copyAlbumLink}>
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
