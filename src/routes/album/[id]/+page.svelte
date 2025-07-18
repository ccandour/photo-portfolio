<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  
  let mounted = false;
  let selectedFilter = 'all';
  let viewMode = 'grid'; // 'grid' or 'masonry'
  let showStats = false;
  
  onMount(() => {
    mounted = true;
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
  $: topISO = isos.sort((a, b) => isos.filter(v => v === a).length - isos.filter(v => v === b).length)[0] || '100';

  // Calculate most used shutter speed
  $: shutterSpeeds = data.album.photos.map(photo => {
    const speed = photo.metadata?.shutterSpeed || '1/125';
    const match = speed.match(/(\d+)\/(\d+)/);
    return match ? (Number(match[2])) : 1000; // Default to 1000 if no match
  });
  $: topShutterSpeed = '1/' + shutterSpeeds.sort((a, b) => shutterSpeeds.filter(v => v === a).length - shutterSpeeds.filter(v => v === b).length)[0] || '1/125';

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
      topISO: topISO,
      topShutterSpeed: topShutterSpeed
    };
  })();


  // Updated filter options
  $: filters = [
    { id: 'all', label: 'All Photos', count: data.album?.photos?.length || 0 },
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
            Back to Home
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
              <div class="stat-label">Top ISO</div>
              <div class="stat-value">{cameraStats.topISO}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Top Shutter Speed</div>
              <div class="stat-value">{cameraStats.topShutterSpeed}</div>
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
        <div 
          class="photo-item" 
          class:monochrome={isMonochrome(photo)}
          style="--delay: {index * 0.05}s;"
          on:click={() => goto(`/photo/${photo.id}`)}
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

<style>
  .wrapper {
    padding: 0 4rem;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  main {
    margin-top: 5rem;
    padding: 2rem 0;
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
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .album-info {
    width: 100%;  
  }

  .album-info h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .date-badge {
    padding: 0.3rem 0.8rem;
    margin-top: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Space Mono', monospace;
    align-self: center; /* Keep the date badge aligned with title baseline */
    margin-top: 0.3rem; /* Fine-tune position */
  }

  .album-action-row {
    display: flex;
    justify-content: space-between;
    align-items: end;
    width: 100%;
  }

  .album-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Space Mono', monospace;
    margin-bottom: 1rem;
  }

  .stats-toggle {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;
    transition: color 0.2s ease;
  }

  .stats-toggle:hover {
    color: rgba(255, 255, 255, 1);
  }

  .stats-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stat-item {
    text-align: center;
  }

  .stat-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    font-family: 'Space Mono', monospace;
    font-weight: 500;
  }

  .control-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .filters {
    display: flex;
    gap: 0.5rem;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-btn.active {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }

  .filter-count {
    opacity: 0.6;
    font-size: 0.75rem;
  }

  .view-controls {
    display: flex;
    gap: 0.5rem;
  }

  .view-btn {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-btn.active {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }

  .view-btn svg {
    width: 16px;
    height: 16px;
  }

  .photo-grid {
    margin-bottom: 4rem;
  }

  .photo-grid.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
  }

  .photo-grid.masonry {
    column-count: 3;
    column-gap: 2rem;
    column-fill: balance;
  }

  .photo-item {
    overflow: hidden;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.4s ease;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
    opacity: 0;
    transform: translateY(30px);
  }

  .photo-grid.grid .photo-item {
    aspect-ratio: 3/2;
  }

  .photo-grid.masonry .photo-item {
    break-inside: avoid;
    margin-bottom: 2rem;
    display: block;
    width: 100%;
  }

  .photo-grid.masonry .photo-item picture {
    display: block;
    width: 100%;
  }


  .photo-grid.masonry .photo-item img {
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: transform 0.4s ease;
    border-radius: 12px;
    display: block; /* Remove inline spacing */
    vertical-align: top; /* Remove baseline spacing */
  }

  .photo-grid.grid .photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .photo-grid.mounted .photo-item {
    animation: fadeInUp 0.6s ease-out forwards;
    animation-delay: var(--delay);
  }

  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .photo-item:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  .photo-item:hover img {
    transform: scale(1.05);
  }

  /* Photo overlay styles */
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
    border-radius: 12px;
  }

  .photo-item:hover .photo-overlay {
    opacity: 1;
  }

  .photo-info {
    margin-top: auto;
  }

  .photo-title {
    color: white;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .photo-meta {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.75rem;
    font-family: 'Space Mono', monospace;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: center;
  }

  .meta-divider {
    opacity: 0.5;
  }

  .photo-actions {
    align-self: flex-end;
  }

  .action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
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
    width: 16px;
    height: 16px;
  }

  /* Responsive columns for masonry */
  @media (max-width: 1200px) {
    .photo-grid.masonry {
      column-count: 2;
    }
  }

  @media (max-width: 768px) {
    .photo-grid.masonry {
      column-count: 1;
    }
    
    .photo-grid.grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  /* Keep all the existing styles for other elements */
  .photo-count {
    font-weight: 500;
  }

  /* Hide photo count on small screens */
  @media (max-width: 600px) {
    .photo-count {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .divider {
      display: none;
    }
  }

  .color-type {
    font-size: 0.65rem;
    opacity: 0.8;
    font-weight: 500;
  }

  .photo-item.monochrome {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .photo-item.monochrome::before {
    content: 'B&W';
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.6rem;
    font-family: 'Space Mono', monospace;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .photo-item.monochrome:hover::before {
    opacity: 1;
  }

  .no-results {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .no-results p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .reset-filter {
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }

  .reset-filter:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    margin-bottom: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px; /* Add border radius */
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    text-decoration: none;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }

  .back-button svg {
    width: 18px; /* Reduce from default size */
    height: 18px; /* Reduce from default size */
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .back-button {
      padding: 0.5rem 1rem;
    }
  }

  /* Album Footer Styles */
  .album-footer {
    margin-top: 4rem;
    padding: 3rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
    align-items: start;
  }

  .location-info h3 {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 1rem 0;
    font-weight: 500;
  }

  .location-info p {
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
    margin: 0;
    font-size: 0.95rem;
  }

  .sharing-options h3 {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 1rem 0;
    font-weight: 500;
  }

  .share-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .share-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
    text-decoration: none;
    justify-content: center;
  }

  .share-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
  }

  .share-btn svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* Responsive footer */
  @media (max-width: 768px) {
    .wrapper {
      padding: 1.5rem;
    }

    .album-header {
      flex-direction: column;
      gap: 1.5rem;
    }

    .control-bar {
      flex-direction: column;
      gap: 1rem;
    }

    .footer-content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .album-footer {
      margin-top: 3rem;
      padding: 2rem 0;
    }
  }
</style>