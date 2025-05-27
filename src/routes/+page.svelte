<script lang="ts">
  import AlbumRow from '$lib/components/AlbumRow.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

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
  }
</style>
