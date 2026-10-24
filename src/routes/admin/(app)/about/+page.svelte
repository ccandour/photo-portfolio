<script lang="ts">
  import SaveBar from '$lib/admin/SaveBar.svelte';
  import { move, removeAt } from '$lib/admin/list';
  import type { AboutData, SocialLink } from '$lib/types';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let about: AboutData = structuredClone(data.content);
  let dirty = false;

  // Names SocialIcon.svelte has an icon for; other names still work, just without an icon
  const knownIcons = ['AniList', 'Archidekt', 'BeReal', 'Discord', 'GitHub', 'Goodreads', 'Instagram', 'Letterboxd', 'Spotify', 'stats.fm', 'Steam', 'YouTube'];

  const groups: { key: 'primaryLinks' | 'secondaryLinks' | 'otherLinks'; title: string }[] = [
    { key: 'primaryLinks', title: 'Main profiles' },
    { key: 'secondaryLinks', title: 'Movies, books etc' },
    { key: 'otherLinks', title: 'For the curious (collapsed)' }
  ];

  // Paragraphs are edited as one textarea, separated by blank lines
  let paragraphsText = about.paragraphs.join('\n\n');
  $: about.paragraphs = paragraphsText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  function setLinks(key: (typeof groups)[number]['key'], links: SocialLink[]) {
    about[key] = links;
    dirty = true;
  }

  function moveToGroup(from: (typeof groups)[number]['key'], index: number, to: (typeof groups)[number]['key']) {
    const link = about[from][index];
    about[from] = removeAt(about[from], index);
    about[to] = [...about[to], link];
    dirty = true;
  }
</script>

<svelte:head><title>Admin · About</title></svelte:head>

<h1>about me</h1>

<div on:input={() => (dirty = true)}>
  <div class="panel">
    <label for="title">Heading</label>
    <input id="title" type="text" bind:value={about.title} />
    <label for="intro">Intro</label>
    <textarea id="intro" bind:value={about.intro}></textarea>
    <label for="sectionTitle">Section title</label>
    <input id="sectionTitle" type="text" bind:value={about.sectionTitle} />
    <label for="paragraphs">Text (separate paragraphs with an empty line)</label>
    <textarea id="paragraphs" style="min-height: 12rem" bind:value={paragraphsText}></textarea>
  </div>

  <h2>Interests</h2>
  <div class="panel">
    {#each about.interests as interest, i}
      <div class="row" style="margin-bottom: 0.5rem">
        <input type="text" aria-label="Icon" style="width: 4rem; margin: 0" bind:value={interest.icon} />
        <input type="text" aria-label="Name" style="flex: 1; width: auto; margin: 0" bind:value={interest.name} />
        <button class="btn small" disabled={i === 0} on:click={() => { about.interests = move(about.interests, i, i - 1); dirty = true; }}>↑</button>
        <button class="btn small" disabled={i === about.interests.length - 1} on:click={() => { about.interests = move(about.interests, i, i + 1); dirty = true; }}>↓</button>
        <button class="btn small danger" on:click={() => { about.interests = removeAt(about.interests, i); dirty = true; }}>✕</button>
      </div>
    {/each}
    <button class="btn" on:click={() => { about.interests = [...about.interests, { name: '', icon: '' }]; dirty = true; }}>+ Add interest</button>
  </div>

  <datalist id="icon-names">
    {#each knownIcons as name}<option value={name}></option>{/each}
  </datalist>

  {#each groups as group}
    <h2>{group.title}</h2>
    <div class="panel">
      {#each about[group.key] as link, i}
        <div class="item">
          <div class="item-head">
            <strong>{link.name || 'New link'} {#if link.name && !knownIcons.includes(link.name)}<span class="muted">· no icon for this name</span>{/if}</strong>
            <select aria-label="Move to group" style="width: auto; margin: 0; padding: 0.25rem" value=""
              on:change={(e) => { const to = e.currentTarget.value; e.currentTarget.value = ''; if (to) moveToGroup(group.key, i, to as typeof group.key); }}>
              <option value="">Move to…</option>
              {#each groups.filter(g => g.key !== group.key) as other}<option value={other.key}>{other.title}</option>{/each}
            </select>
            <button class="btn small" disabled={i === 0} on:click={() => setLinks(group.key, move(about[group.key], i, i - 1))}>↑</button>
            <button class="btn small" disabled={i === about[group.key].length - 1} on:click={() => setLinks(group.key, move(about[group.key], i, i + 1))}>↓</button>
            <button class="btn small danger" on:click={() => confirm(`Remove ${link.name || 'this link'}?`) && setLinks(group.key, removeAt(about[group.key], i))}>Remove</button>
          </div>
          <div class="grid-2">
            <div>
              <label for={`${group.key}-name-${i}`}>Name (picks the icon)</label>
              <input id={`${group.key}-name-${i}`} type="text" list="icon-names" bind:value={link.name} />
            </div>
            <div>
              <label for={`${group.key}-url-${i}`}>URL</label>
              <input id={`${group.key}-url-${i}`} type="url" bind:value={link.url} placeholder="https://" />
            </div>
            <div>
              <label for={`${group.key}-desc-${i}`}>Description</label>
              <input id={`${group.key}-desc-${i}`} type="text" bind:value={link.description} />
            </div>
            <div>
              <label for={`${group.key}-cat-${i}`}>Category</label>
              <input id={`${group.key}-cat-${i}`} type="text" bind:value={link.category} />
            </div>
          </div>
        </div>
      {/each}
      <button class="btn" on:click={() => setLinks(group.key, [...about[group.key], { name: '', url: '', description: '', category: '' }])}>+ Add link</button>
    </div>
  {/each}
</div>

<SaveBar payload={about} bind:dirty {form} />
