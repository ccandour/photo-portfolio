<script lang="ts">
  import ImageViewer from '$lib/components/ImageViewer.svelte';
  import type { PageData } from './$types';
  
  export let data: PageData;
</script>

{#if data.photo}
  <ImageViewer photo={data.photo} prevId={data.prevId} nextId={data.nextId} />
{/if} 