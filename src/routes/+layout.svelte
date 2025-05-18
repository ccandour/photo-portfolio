<script lang="ts">
  import { onMount } from 'svelte';
  
  let noiseCanvas: HTMLCanvasElement;
  
  onMount(() => {
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
  });
</script>

<div class="root">
  <div class="background">
    <div class="gradient"></div>
    <canvas bind:this={noiseCanvas} class="noise"></canvas>
  </div>
  <div class="content">
    <slot></slot>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #111;
    min-height: 100vh;
  }

  .root {
    position: relative;
    min-height: 100vh;
  }

  .background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
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

  .noise {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
    mix-blend-mode: overlay;
  }

  .content {
    position: relative;
    min-height: 100vh;
  }

  :global(nav) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 2rem;
    padding: 1.5rem;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.5);
    z-index: 100;
  }

  :global(nav a) {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
    opacity: 0.7;
    transition: all 0.2s ease;
    padding: 0.5rem 1rem;
    border-radius: 4px;
  }

  :global(nav a:hover) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  :global(nav a.active) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
</style> 