<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;
</script>

<svelte:head>
  <title>Admin login</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="/css/admin.css">
</svelte:head>

<div class="admin">
  <form method="POST" class="panel login">
    <h1>admin</h1>
    {#if !data.enabled}
      <div class="message error">Admin is disabled. Set <code>ADMIN_PASSWORD</code> (min. 12 characters) and restart.</div>
    {/if}
    {#if form?.error}
      <div class="message error">{form.error}</div>
    {/if}
    <label for="password">Password</label>
    <!-- svelte-ignore a11y_autofocus -->
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
    <button class="btn primary" type="submit">Log in</button>
  </form>
</div>
