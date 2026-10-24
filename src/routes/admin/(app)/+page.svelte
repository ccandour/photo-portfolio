<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let showCreate = false;
  $: if (form?.error) showCreate = true;

  function thumb(albumId: string, filename: string) {
    return `/responsive/${albumId}/${filename.replace(/\.[^/.]+$/, '')}-400w.jpg`;
  }
</script>

<svelte:head><title>Admin · Albums</title></svelte:head>

<div class="row">
  <h1>albums</h1>
  <span class="spacer"></span>
  <button class="btn primary" on:click={() => (showCreate = !showCreate)}>{showCreate ? 'Cancel' : '+ New album'}</button>
</div>

{#if showCreate}
  <form method="POST" action="?/create" class="panel" use:enhance>
    {#if form?.error}<div class="message error">{form.error}</div>{/if}
    <div class="grid-2">
      <div>
        <label for="location">Location (shown as album name, used in URL)</label>
        <input id="location" name="location" type="text" required value={form?.values?.location ?? ''} />
      </div>
      <div>
        <label for="date">Date (DD.MM.YYYY)</label>
        <input id="date" name="date" type="text" required pattern={'\\d{2}\\.\\d{2}\\.\\d{4}'} placeholder="24.10.2026" value={form?.values?.date ?? ''} />
      </div>
      <div>
        <label for="title">Title</label>
        <input id="title" name="title" type="text" required value={form?.values?.title ?? ''} />
      </div>
      <div>
        <label for="folder">Folder name (optional, defaults to location)</label>
        <input id="folder" name="folder" type="text" pattern="[a-z0-9][a-z0-9_\-]*" placeholder="e.g. krakow-2026" value={form?.values?.folder ?? ''} />
      </div>
    </div>
    <label for="description">Description</label>
    <textarea id="description" name="description">{form?.values?.description ?? ''}</textarea>
    <button class="btn primary" type="submit">Create album</button>
  </form>
{/if}

<div class="album-list">
  {#each data.albums as album}
    <a class="panel album-card" href={`/admin/album/${album.id}`}>
      {#if album.cover}
        <img src={thumb(album.id, album.cover)} alt="" loading="lazy"
          on:error={(e) => { const img = e.currentTarget as HTMLImageElement; if (album.cover && !img.dataset.fallback) { img.dataset.fallback = '1'; img.src = `/photos/${album.id}/${album.cover}`; } }} />
      {:else}
        <img alt="" />
      {/if}
      <div class="info">
        <div>{album.metadata.location} <span class="muted">· {album.metadata.date}</span></div>
        <div class="muted">{album.metadata.title} · {album.count} photos {album.count === 0 ? '(hidden until it has photos)' : ''}</div>
      </div>
    </a>
  {:else}
    <p class="muted">No albums yet.</p>
  {/each}
</div>
