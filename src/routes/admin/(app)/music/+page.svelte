<script lang="ts">
  import SaveBar from '$lib/admin/SaveBar.svelte';
  import { move, removeAt } from '$lib/admin/list';
  import type { TrackRecommendation } from '$lib/types';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let tracks: TrackRecommendation[] = structuredClone(data.content);
  let dirty = false;

  function change(next: TrackRecommendation[]) {
    tracks = next;
    dirty = true;
  }
</script>

<svelte:head><title>Admin · Music</title></svelte:head>

<h1>music</h1>
<p class="muted">The search query is sent to Deezer; the first result is shown on the site. Be specific (artist + title).</p>

<div class="panel" on:input={() => (dirty = true)}>
  <button class="btn" style="margin-bottom: 1rem" on:click={() => change([{ searchQuery: '', description: '', mood: '' }, ...tracks])}>+ Add track at top</button>
  {#each tracks as track, i}
    <div class="item">
      <div class="item-head">
        <strong>{i + 1}. {track.searchQuery || 'New track'}</strong>
        <button class="btn small" disabled={i === 0} on:click={() => change(move(tracks, i, 0))} title="Move to top">⤒</button>
        <button class="btn small" disabled={i === 0} on:click={() => change(move(tracks, i, i - 1))}>↑</button>
        <button class="btn small" disabled={i === tracks.length - 1} on:click={() => change(move(tracks, i, i + 1))}>↓</button>
        <button class="btn small danger" on:click={() => confirm(`Remove "${track.searchQuery}"?`) && change(removeAt(tracks, i))}>Remove</button>
      </div>
      <div class="grid-2">
        <div>
          <label for={`q-${i}`}>Search query</label>
          <input id={`q-${i}`} type="text" bind:value={track.searchQuery} />
        </div>
        <div>
          <label for={`mood-${i}`}>Mood</label>
          <input id={`mood-${i}`} type="text" bind:value={track.mood} />
        </div>
      </div>
      <label for={`d-${i}`}>Description</label>
      <input id={`d-${i}`} type="text" bind:value={track.description} />
    </div>
  {/each}
</div>

<SaveBar payload={tracks} bind:dirty {form} />
