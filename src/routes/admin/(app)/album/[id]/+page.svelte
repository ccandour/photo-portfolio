<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { move } from '$lib/admin/list';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  $: album = data.album;
  $: publicUrl = `/album/${album.metadata.location.toLowerCase()}@${album.metadata.date.replaceAll('.', '-').toLowerCase()}`;

  // --- ordering ---
  let photos: string[] = [];
  let orderDirty = false;
  let orderStatus = '';
  $: if (!orderDirty) photos = [...data.album.photos];

  let dragIndex: number | null = null;
  let overIndex: number | null = null;

  function reorder(from: number, to: number) {
    photos = move(photos, from, to);
    orderDirty = true;
    orderStatus = '';
  }

  function onDrop(index: number) {
    if (dragIndex !== null) reorder(dragIndex, index);
    dragIndex = overIndex = null;
  }

  async function saveOrder() {
    orderStatus = 'Saving…';
    const res = await fetch(`/admin/api/album/${album.id}/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: photos })
    });
    if (res.ok) {
      orderStatus = 'Order saved';
      orderDirty = false;
      await invalidateAll();
    } else {
      orderStatus = (await res.json().catch(() => null))?.message ?? `Error ${res.status}`;
    }
  }

  function resetOrder() {
    orderDirty = false;
    orderStatus = '';
  }

  // --- uploads ---
  type Upload = { name: string; status: 'queued' | 'uploading' | 'done' | 'error'; message?: string };
  let uploads: Upload[] = [];
  let overwrite = false;
  let uploading = false;
  let dropActive = false;
  let fileInput: HTMLInputElement;

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length || uploading) return;
    if (orderDirty && !confirm('You have unsaved order changes that will be lost. Continue?')) return;

    uploading = true;
    uploads = list.map(f => ({ name: f.name, status: 'queued' }));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (file.size > data.maxUploadMb * 1024 * 1024) {
        uploads[i] = { ...uploads[i], status: 'error', message: `larger than ${data.maxUploadMb} MB` };
        continue;
      }
      uploads[i] = { ...uploads[i], status: 'uploading' };
      const body = new FormData();
      body.append('file', file);
      body.append('overwrite', String(overwrite));
      try {
        const res = await fetch(`/admin/api/album/${album.id}/photos`, { method: 'POST', body });
        const json = await res.json().catch(() => null);
        uploads[i] = res.ok
          ? { ...uploads[i], status: 'done', message: json?.filename !== file.name ? `saved as ${json?.filename}` : '' }
          : { ...uploads[i], status: 'error', message: json?.message ?? `HTTP ${res.status}` };
      } catch {
        uploads[i] = { ...uploads[i], status: 'error', message: 'network error' };
      }
    }

    uploading = false;
    orderDirty = false;
    if (fileInput) fileInput.value = '';
    await invalidateAll();
  }

  function thumb(filename: string) {
    return `/responsive/${album.id}/${filename.replace(/\.[^/.]+$/, '')}-400w.jpg`;
  }

  function thumbFallback(e: Event, filename: string) {
    const img = e.currentTarget as HTMLImageElement;
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.src = `/photos/${album.id}/${filename}`;
  }

  const icons = { queued: '·', uploading: '↑', done: '✓', error: '✕' };

  let deleteConfirm = '';
</script>

<svelte:head><title>Admin · {album.metadata.location}</title></svelte:head>

<div class="row">
  <a class="btn small" href="/admin">← Albums</a>
  <h1 style="margin: 0">{album.metadata.location} <span class="muted">{album.metadata.date}</span></h1>
  <span class="spacer"></span>
  <a class="btn small" href={publicUrl} target="_blank" rel="noopener">Open public page ↗</a>
</div>
<p class="muted">Folder: <code>{album.id}</code> · {photos.length} photos</p>

{#if form?.error}<div class="message error">{form.error}</div>{/if}
{#if form && 'ok' in form && form.ok}<div class="message ok">{form.ok}</div>{/if}

<h2>Add photos</h2>
<div
  class="panel dropzone"
  class:active={dropActive}
  role="region"
  aria-label="Upload photos"
  on:dragover|preventDefault={(e) => { if (e.dataTransfer?.types.includes('Files')) dropActive = true; }}
  on:dragleave={() => (dropActive = false)}
  on:drop|preventDefault={(e) => { dropActive = false; if (e.dataTransfer?.files.length) uploadFiles(e.dataTransfer.files); }}
>
  <p>Drop JPEG / PNG / WebP files here or</p>
  <input bind:this={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading}
    on:change={(e) => e.currentTarget.files && uploadFiles(e.currentTarget.files)} />
  <p class="row" style="justify-content: center">
    <label style="margin: 0; display: flex; gap: 0.4rem; align-items: center">
      <input type="checkbox" bind:checked={overwrite} disabled={uploading} /> replace existing files with the same name
    </label>
  </p>
  <p class="muted">Filename = photo title on the site. Include "mono" in the name for black &amp; white. Responsive sizes are generated automatically.</p>
  {#if uploads.length}
    <ul class="upload-list">
      {#each uploads as u}
        <li>{icons[u.status]} {u.name} {#if u.message}<span class="muted">— {u.message}</span>{/if}</li>
      {/each}
    </ul>
  {/if}
</div>

<h2>Photos <span class="muted">— drag to reorder</span></h2>
{#if orderDirty || orderStatus}
  <div class="row" style="margin-bottom: 1rem">
    {#if orderDirty}
      <button class="btn primary" on:click={saveOrder}>Save order</button>
      <button class="btn" on:click={resetOrder}>Undo</button>
    {/if}
    <span class="muted">{orderStatus}</span>
  </div>
{/if}

<div class="photo-grid">
  {#each photos as filename, i (filename)}
    <div
      class="photo-tile"
      class:dragging={dragIndex === i}
      class:over={overIndex === i && dragIndex !== i}
      draggable="true"
      role="listitem"
      on:dragstart={() => (dragIndex = i)}
      on:dragend={() => (dragIndex = overIndex = null)}
      on:dragover|preventDefault={() => { if (dragIndex !== null) overIndex = i; }}
      on:drop|preventDefault={() => onDrop(i)}
    >
      <span class="index">{i + 1}</span>
      <img src={thumb(filename)} alt={filename} loading="lazy" on:error={(e) => thumbFallback(e, filename)} />
      <div class="caption">{filename}</div>
      <div class="tools">
        <button class="btn small" title="Move earlier" disabled={i === 0} on:click={() => reorder(i, i - 1)}>←</button>
        <button class="btn small" title="Move later" disabled={i === photos.length - 1} on:click={() => reorder(i, i + 1)}>→</button>
        <span class="spacer"></span>
        <form method="POST" action="?/deletePhoto" use:enhance={({ cancel }) => {
          if (orderDirty || !confirm(`Delete ${filename}? It will be moved to the trash folder.`)) {
            if (orderDirty) alert('Save or undo the order changes first.');
            cancel();
          }
        }}>
          <input type="hidden" name="filename" value={filename} />
          <button class="btn small danger" title="Delete">✕</button>
        </form>
      </div>
    </div>
  {:else}
    <p class="muted">No photos yet — the album stays hidden on the site until it has at least one.</p>
  {/each}
</div>

<h2>Album details</h2>
<form method="POST" action="?/metadata" class="panel" use:enhance={() => async ({ update }) => update({ reset: false })}>
  <div class="grid-2">
    <div>
      <label for="location">Location <span class="muted">(changing it or the date changes the public URL)</span></label>
      <input id="location" name="location" type="text" required value={album.metadata.location} />
    </div>
    <div>
      <label for="date">Date (DD.MM.YYYY)</label>
      <input id="date" name="date" type="text" required pattern={'\\d{2}\\.\\d{2}\\.\\d{4}'} value={album.metadata.date} />
    </div>
  </div>
  <label for="title">Title</label>
  <input id="title" name="title" type="text" required value={album.metadata.title} />
  <label for="description">Description</label>
  <textarea id="description" name="description">{album.metadata.description}</textarea>
  <button class="btn primary" type="submit">Save details</button>
</form>

<h2>Maintenance</h2>
<div class="panel">
  <form method="POST" action="?/regenerate" use:enhance class="row">
    <button class="btn" type="submit">Generate missing sizes</button>
    <span class="muted">Use after copying photos into the folder by FTP.</span>
  </form>
</div>

<h2>Danger zone</h2>
<form method="POST" action="?/deleteAlbum" class="panel" use:enhance>
  <p class="muted">Moves the whole album folder to <code>photos/.trash</code> and removes its generated sizes.</p>
  <label for="confirm">Type <code>{album.id}</code> to confirm</label>
  <input id="confirm" name="confirm" type="text" bind:value={deleteConfirm} autocomplete="off" />
  <button class="btn danger" type="submit" disabled={deleteConfirm !== album.id}>Delete album</button>
</form>
