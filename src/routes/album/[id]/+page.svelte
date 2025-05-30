<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  
  let mounted = false;
  
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
</script>

<div class="wrapper">
  <main>
    <div class="album-header">
      <div class="album-info">
        <h1>{data.album.metadata.location} • {data.album.metadata.date}</h1>
        <div class="album-meta">
          <span class="photo-count">{data.album.photos.length} photos</span>
          <span class="divider">•</span>
          <span class="album-type">Street Photography</span>
        </div>
      </div>
      
      <button class="back-button" on:click={() => goto('/')}>
        <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill="none">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Back to Home
      </button>
    </div>
    
    <!-- Photo grid with staggered animation -->
    <div class="photo-grid" class:mounted>
      {#each data.album.photos as photo, index}
        <div 
          class="photo-item" 
          style="--delay: {index * 0.1}s"
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
          <div class="photo-overlay">
            <div class="photo-title">{getFileName(photo.src)}</div>
          </div>
        </div>
      {/each}
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
    align-items: flex-start;
    margin-bottom: 4rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .album-info h1 {
    font-size: 2.5rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .album-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Space Mono', monospace;
  }

  .photo-count {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  .divider {
    color: rgba(255, 255, 255, 0.3);
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 1);
    transform: translateX(-2px);
  }

  .back-button svg {
    width: 18px;
    height: 18px;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .photo-item {
    aspect-ratio: 3/2;
    overflow: hidden;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.4s ease;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
    opacity: 0;
    transform: translateY(30px);
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

  .photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .photo-item:hover img {
    transform: scale(1.05);
  }

  .photo-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    padding: 2rem 1.5rem 1.5rem;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  .photo-item:hover .photo-overlay {
    transform: translateY(0);
  }

  .photo-title {
    color: white;
    font-size: 0.8rem;
    font-weight: 400;
    font-family: 'Space Mono', monospace; /* Use monospace for filenames */
    letter-spacing: 0.5px;
  }

  @media (max-width: 768px) {
    .wrapper {
      padding: 1.5rem;
    }

    main {
      margin-top: 4rem;
      padding: 1.5rem 0;
    }

    .album-header {
      flex-direction: column;
      gap: 1.5rem;
      align-items: flex-start;
      margin-bottom: 2.5rem;
    }

    .album-info h1 {
      font-size: 1.8rem;
    }

    .album-meta {
      font-size: 0.8rem;
    }

    .photo-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .back-button {
      align-self: stretch;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .wrapper {
      padding: 1rem;
    }

    main {
      margin-top: 3rem;
      padding: 1rem 0;
    }

    .album-info h1 {
      font-size: 1.5rem;
    }

    .photo-grid {
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .photo-item {
      aspect-ratio: 1;
      border-radius: 8px;
    }

    .photo-overlay {
      padding: 1rem;
    }

    .photo-title {
      font-size: 0.7rem; /* Smaller on mobile */
    }
  }
</style>