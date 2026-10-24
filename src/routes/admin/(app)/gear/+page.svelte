<script lang="ts">
  import SaveBar from '$lib/admin/SaveBar.svelte';
  import { move, removeAt } from '$lib/admin/list';
  import type { GearItem } from '$lib/types';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let items: GearItem[] = structuredClone(data.content);
  let dirty = false;

  function change(next: GearItem[]) {
    items = next;
    dirty = true;
  }

  function add() {
    change([...items, { type: 'camera', name: '', description: '', specs: [] }]);
  }
</script>

<svelte:head><title>Admin · Gear</title></svelte:head>

<h1>gear</h1>
<p class="muted">Items are grouped by type on the site; order within each group follows this list.</p>

<div class="panel" on:input={() => (dirty = true)} on:change={() => (dirty = true)}>
  {#each items as item, i}
    <div class="item">
      <div class="item-head">
        <strong>{item.name || 'New item'} <span class="muted">· {item.type}</span></strong>
        <button class="btn small" disabled={i === 0} on:click={() => change(move(items, i, i - 1))}>↑</button>
        <button class="btn small" disabled={i === items.length - 1} on:click={() => change(move(items, i, i + 1))}>↓</button>
        <button class="btn small danger" on:click={() => confirm(`Remove ${item.name || 'this item'}?`) && change(removeAt(items, i))}>Remove</button>
      </div>
      <div class="grid-2">
        <div>
          <label for={`name-${i}`}>Name</label>
          <input id={`name-${i}`} type="text" bind:value={item.name} />
        </div>
        <div>
          <label for={`type-${i}`}>Type</label>
          <select id={`type-${i}`} bind:value={item.type}>
            <option value="camera">Camera</option>
            <option value="lens">Lens</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>
      </div>
      <label for={`url-${i}`}>Link (optional)</label>
      <input id={`url-${i}`} type="url" bind:value={item.url} placeholder="https://" />
      <label for={`desc-${i}`}>Description</label>
      <textarea id={`desc-${i}`} bind:value={item.description}></textarea>
      <label for={`specs-${i}`}>Specs (one per line)</label>
      <textarea id={`specs-${i}`} value={item.specs.join('\n')} on:input={(e) => (item.specs = e.currentTarget.value.split('\n'))}></textarea>
    </div>
  {/each}
  <button class="btn" on:click={add}>+ Add item</button>
</div>

<SaveBar payload={items} bind:dirty {form} />
