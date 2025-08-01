<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const categories = {
    camera: 'Cameras',
    lens: 'Lenses',
    accessory: 'Accessories'
  };
</script>

<svelte:head>
  <title>My Photography Gear</title>
  <meta name="description" content="Explore the photography gear I use for my street photography, including cameras, lenses, and accessories." />
  <link rel="stylesheet" href="/css/gear.css">
</svelte:head>

<div class="wrapper">
  <main>
    <h1>My Photography Gear</h1>
    <p class="intro">Here's the equipment I use to capture my street photography. Most of my images are therefore shot at 25 or 56mm, with the wider lens being by recent favorite.</p>

    {#each Object.entries(categories) as [type, title]}
      <section>
        <h2>{title}</h2>
        <div class="gear-grid">
          {#each data.gear.filter(item => item.type === type) as item}
            <div class="gear-card">
              <div class="gear-content">
                <h3>
                  {#if item.url}
                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>
                  {:else}
                    {item.name}
                  {/if}
                </h3>
                <p class="description">{item.description}</p>
                <ul class="specs">
                  {#each item.specs as spec}
                    <li>{spec}</li>
                  {/each}
                </ul>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </main>
</div>
