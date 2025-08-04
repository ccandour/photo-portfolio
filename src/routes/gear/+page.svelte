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
  <title>Photography Gear</title>
  <meta name="description" content="The cameras, lenses, and gear I use for street photography." />
  <link rel="stylesheet" href="/css/gear.css">
</svelte:head>

<div class="wrapper">
  <main>
    <h1>what i shoot with</h1>
    <p class="intro">Here's the gear I actually use for street photography. Most of my shots are taken at 25mm or 56mm — the 25mm has become my go-to lately for that wider perspective and 'cause i like my 25 lens better.</p>

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
