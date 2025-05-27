<script lang="ts">
  import AlbumRow from '$lib/components/AlbumRow.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<nav>
  <a href="/" class="active">Home</a>
  <a href="/gear">Gear</a>
  <a href="/music">Music</a>
  <a href="/about">About me</a>
</nav>

<div class="wrapper">
  <main>
    <h1>
      Photography is the simplest thing in the world, but it is incredibly complicated to make it really work.
    </h1>
    <p class="attribution">— <a href="https://www.martinparr.com/" target="_blank" rel="noopener noreferrer">Martin Parr</a></p>
    {#each data.albums as album}
      <AlbumRow {album} />
    {/each}
  </main>
</div>

<style>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center; /* Add vertical centering */
    gap: 2rem;
    padding: 1rem; /* Reduced padding that's more balanced */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 100;
  }

  nav a {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    padding: 0.5rem; /* Add padding to increase tap target size */
  }

  nav a:hover {
    opacity: 1;
  }

  nav a.active {
    opacity: 1;
  }

  .wrapper {
    padding: 0 4rem;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
    background: transparent;
  }

  main {
    margin-top: 6rem;
    padding: 0;
    position: relative;
    z-index: 1;
  }

  h1 {
    font-size: 1.6rem;
    font-weight: 400;
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    padding: 2rem;
    line-height: 1.2;
    max-width: 800px;
    margin: 0 auto;
  }

  .attribution {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 0.5rem;
    text-align: right;
    padding-right: 2rem;
    margin-bottom: 2rem;
  }

  .attribution a {
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .attribution a:hover {
    color: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 768px) {
    .wrapper {
      padding: 0 1.5rem;
    }

    main {
      margin-top: 5rem;
    }
  }

  @media (max-width: 480px) {
    .wrapper {
      padding: 0 1rem;
    }

    main {
      margin-top: 4rem;
    }

    nav {
      gap: 0.5rem; /* Reduce gap on small screens */
      padding: 0.75rem 0.5rem; /* Less padding on mobile */
    }
    
    nav a {
      font-size: 0.9rem; /* Slightly smaller text */
      padding: 0.5rem 0.25rem; /* Adjust padding on links */
    }
  }
</style>
