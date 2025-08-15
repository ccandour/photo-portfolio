<script lang="ts">
  import AlbumRow from '$lib/components/AlbumRow.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="wrapper">
  <main>
    <div class="hero-quote">
      <h1>
        "Photography is the <em>simplest</em> thing in the world, 
        but it is <em>incredibly complicated</em> to make it really work."
      </h1>
      <div class="attribution">
        <a href="https://www.martinparr.com/" target="_blank" rel="noopener noreferrer">— Martin Parr</a>
      </div>
    </div>
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
    padding: 1.5rem 0;
  }

  .hero-quote {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem 2rem 4rem;
  }

  h1 {
    font-size: 1.8rem;
    font-weight: 300;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
    margin: 0;
    position: relative;
    font-family: 'Georgia', serif;
  }

  h1 em {
    font-style: italic;
    color: rgb(255, 255, 255);
    font-weight: 400;
  }

  h1 strong {
    font-weight: 500;
    color: rgba(255, 255, 255, 1);
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  }

  .attribution {
    margin-top: 1rem;
    text-align: center;
    display: flex;
    justify-content: center;
  }

  .attribution a {
    display: inline-block;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0);
    text-decoration: none;
    transition: all 0.3s ease;
    font-style: italic;
    letter-spacing: 0.5px;
    backdrop-filter: blur(10px);
  }

  .attribution a:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    .wrapper {
      padding: 0 1.5rem;
    }

    main {
      margin-top: 7rem;
    }

    .hero-quote {
      padding: 1rem 1rem 4rem;
    }

    h1 {
      font-size: 1.5rem;
      line-height: 1.3;
    }

    .attribution {
      margin-top: 0.75rem;
    }

    .attribution a {
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
    }
  }

  @media (max-width: 480px) {
    .wrapper {
      padding: 0 1rem;
    }

    main {
      margin-top: 6rem;
    }

    .hero-quote {
      padding: 1rem 0.5rem 3rem
    }

    .hero-quote::before {
      width: 40px;
    }

    h1 {
      font-size: 1.2rem;
      line-height: 1.4;
    }

    .attribution {
      margin-top: 0.5rem;
      margin-bottom: 2rem;
    }

    .attribution a {
      font-size: 0.75rem;
      padding: 0.35rem 0.7rem;
    }
  }
</style>
