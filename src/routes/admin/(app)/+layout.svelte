<script lang="ts">
  import { page } from '$app/stores';

  const links = [
    { href: '/admin', label: 'Albums' },
    { href: '/admin/gear', label: 'Gear' },
    { href: '/admin/music', label: 'Music' },
    { href: '/admin/about', label: 'About' }
  ];

  function isActive(href: string, pathname: string) {
    return href === '/admin' ? pathname === '/admin' || pathname.startsWith('/admin/album/') : pathname.startsWith(href);
  }
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="/css/admin.css">
</svelte:head>

<nav class="admin-nav">
  <div class="links">
    {#each links as link}
      <a href={link.href} class={isActive(link.href, $page.url.pathname) ? 'active' : ''}>{link.label}</a>
    {/each}
  </div>
  <div class="links">
    <a href="/" target="_blank" rel="noopener">View site ↗</a>
    <form method="POST" action="/admin/logout">
      <button class="btn small" type="submit">Log out</button>
    </form>
  </div>
</nav>

<div class="admin">
  <slot></slot>
</div>
