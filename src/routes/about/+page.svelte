<script lang="ts">
  import SocialIcon from '$lib/components/SocialIcon.svelte';

  const links = [
    {
      name: 'AniList',
      url: 'https://anilist.co/user/candour/',
      description: 'Anime and manga watchlist'
    },
    {
      name: 'Archidekt',
      url: 'https://archidekt.com/search/decks?ownerUsername=ccandour',
      description: 'My MTG Decklists'
    },
    {
      name: 'BeReal',
      url: 'https://bere.al/pzdan',
      description: 'I guess I am on it'
    },
    {
      name: 'Discord',
      url: 'https://discord.com/users/818559220462387281',
      description: 'I\'m here too'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/ccandour',
      description: 'Coding projects etc.'
    },
    {
      name: 'Goodreads',
      url: 'https://www.goodreads.com/user/show/64546424-piotr',
      description: 'Visit for book recommendations :)'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/pzdanp/',
      description: 'Please follow follow follow'
    },
    {
      name: 'Letterboxd',
      url: 'https://letterboxd.com/ccandour/',
      description: 'Movie watchlist of choice'
    },
    {
      name: 'Spotify',
      url: 'https://open.spotify.com/user/pzdanowiczp?si=8c03b1f417de42dd',
      description: 'Self-explanatory'
    },
    {
      name: 'stats.fm',
      url: 'https://stats.fm/pzdan',
      description: 'Absolute bangers I listen to'
    },
    {
      name: 'Steam',
      url: 'https://steamcommunity.com/id/ccandour/',
      description: 'If you\'re curious ig'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UChaKk3fTkJaXWNvdqZ-Pf4A',
      description: 'I have a channel'
    }
  ];
</script>

<svelte:head>
  <link rel="stylesheet" href="/css/about.css">
</svelte:head>

<div class="wrapper">
  <main>
    <h1>About Me</h1>
    <p class="intro">Hi! I'm Piotr, an 18-year-old streetphotographer from Poland. You can also find me here:</p>

    <div class="links">
      {#each links as link}
        <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-button">
          <div class="main-content">
            <span class="icon">
              <SocialIcon name={link.name} />
            </span>
            <div class="main-content-text">
              <span class="name">{link.name}</span>
              <span class="description">{link.description}</span>

            </div>
          </div>
        </a>
      {/each}
    </div>
  </main>
</div>
