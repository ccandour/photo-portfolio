<script lang="ts">
  import ImageViewer from '$lib/components/ImageViewer.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  
  // Calculate current photo index and total
  $: currentIndex = data.album.photos.findIndex(p => p.id === data.photo.id) + 1;
  $: totalPhotos = data.album.photos.length;
  $: albumName = `${data.album.metadata.location} • ${data.album.metadata.date}`;
</script>

{#if data.photo}
  <ImageViewer 
    photo={data.photo} 
    prevId={data.prevId} 
    nextId={data.nextId}
    albumName={albumName}
    currentPhotoIndex={currentIndex}
    totalPhotos={totalPhotos}
    albumId={data.album.id}
  />
{/if}