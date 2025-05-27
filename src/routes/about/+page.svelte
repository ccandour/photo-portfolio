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

<div class="wrapper">
  <main>
    <h1>About Me</h1>
    <p class="intro">Hi! I'm Piotr, a street photographer capturing moments in urban environments. Here's where you can find me online:</p>

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

<style>
  .wrapper {
    padding: 0 4rem;
    width: 100%;
    box-sizing: border-box;
  }

  main {
    margin-top: 4rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    padding: 2rem 0;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 400;
    margin-bottom: 1rem;
    color: #fff;
  }

  .intro {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 3rem;
    line-height: 1.5;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .link-button {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    color: white;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .link-button:hover {
    transform: translateY(-2px);
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .link-button > div {
    flex: 1;
  }

  .main-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }

  .main-content-text {
    padding-left: 1rem;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 2rem;
  }

  .name {
    font-size: 1rem;
  }

  .description {
    display: block;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    padding-top: 0.2rem;
  }

  @media (max-width: 768px) {
    .wrapper {
      padding: 0 1.5rem;
    }

    main {
      padding: 1.5rem 0;
    }

    h1 {
      font-size: 1.8rem; /* Smaller font size for tablet */
    }
  }

  @media (max-width: 480px) {
    .wrapper {
      padding: 0 1rem;
    }

    main {
      padding: 1rem 0;
    }
  }
</style>