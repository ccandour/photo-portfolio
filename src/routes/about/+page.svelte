<script lang="ts">
  import SocialIcon from '$lib/components/SocialIcon.svelte';

  const primaryLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/pzdanp/',
      description: 'My main photo feed',
      category: 'photography'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/ccandour',
      description: 'Code & projects',
      category: 'dev'
    },
    {
      name: 'stats.fm',
      url: 'https://stats.fm/pzdan',
      description: 'Music statistics',
      category: 'music'
    }
  ];

  const secondaryLinks = [
    {
      name: 'Letterboxd',
      url: 'https://letterboxd.com/ccandour/',
      description: 'Film diary & reviews',
      category: 'entertainment'
    },
    {
      name: 'AniList',
      url: 'https://anilist.co/user/candour/',
      description: 'Anime & manga tracking',
      category: 'entertainment'
    },
    {
      name: 'Goodreads',
      url: 'https://www.goodreads.com/user/show/64546424-piotr',
      description: 'Reading list & reviews',
      category: 'entertainment'
    }
  ];

  const otherLinks = [
    {
      name: 'Archidekt',
      url: 'https://archidekt.com/search/decks?ownerUsername=ccandour',
      description: 'MTG deck builds',
      category: 'gaming'
    },
    {
      name: 'Steam',
      url: 'https://steamcommunity.com/id/ccandour/',
      description: 'Gaming profile',
      category: 'gaming'
    },
    {
      name: 'Spotify',
      url: 'https://open.spotify.com/user/pzdanowiczp?si=8c03b1f417de42dd',
      description: 'Current rotation',
      category: 'music'
    },
    {
      name: 'Discord',
      url: 'https://discord.com/users/818559220462387281',
      description: 'Chat & communities',
      category: 'social'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UChaKk3fTkJaXWNvdqZ-Pf4A',
      description: 'Video content',
      category: 'content'
    },
    {
      name: 'BeReal',
      url: 'https://bere.al/pzdan',
      description: 'Authentic moments',
      category: 'social'
    }
  ];

  const interests = [
    { name: 'Street Photography', icon: '📸' },
    { name: 'Programming', icon: '💻' },
    { name: 'Magic: The Gathering', icon: '🃏' },
    { name: 'Music', icon: '🎵' },
    { name: 'Badminton', icon: '🏸' },
    { name: 'Travel', icon: '✈️' }
  ];
</script>

<svelte:head>
  <link rel="stylesheet" href="/css/about.css">
</svelte:head>

<div class="wrapper">
  <main>
    <div class="hero-section">
      <h1>About Me</h1>
      <p class="intro">
        Hi! I'm Piotr, an 18-year-old street photographer from Poland. 
        I capture life through the lens, seeking beauty in everyday moments. If you're curious where to find me, you can check out my profiles below :)
      </p>
    </div>

    <div class="content-grid">
      <!-- About Section -->
      <section class="about-section">
        <h2>What I Do</h2>
        <div class="about-content">
          <p>
            Street photography is by far my favorite style of photography — I love documenting authentic moments 
            happening in the streets and capturing the essence of everyday life in the city. I mostly shoot on holidays because I find it easier to focus on photography then, but I also try to carry my camera with me as much as possible.
          </p>
          <p>
            Beyond photography, I'm deeply into programming and do study Computer Science. 
            This portfolio itself is a reflection of that intersection between creative and 
            technical pursuits.
          </p>
        </div>
        
        <div class="interests">
          <h3>Current Interests</h3>
          <div class="interests-grid">
            {#each interests as interest}
              <div class="interest-item">
                <span class="interest-icon">{interest.icon}</span>
                <span class="interest-name">{interest.name}</span>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <!-- Links Section -->
      <section class="links-section">
        <h2>Find Me Online</h2>
        
        <div class="links-category">
          <h3>Main Profiles</h3>
          <div class="links-grid primary">
            {#each primaryLinks as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-card primary">
                <div class="link-content">
                  <div class="link-header">
                    <span class="link-icon">
                      <SocialIcon name={link.name} />
                    </span>
                    <span class="link-name">{link.name}</span>
                  </div>
                  <span class="link-description">{link.description}</span>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <div class="links-category">
          <h3>Media & Reviews</h3>
          <div class="links-grid">
            {#each secondaryLinks as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-card">
                <div class="link-content">
                  <div class="link-header">
                    <span class="link-icon">
                      <SocialIcon name={link.name} />
                    </span>
                    <span class="link-name">{link.name}</span>
                  </div>
                  <span class="link-description">{link.description}</span>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <details class="other-links">
          <summary>Other Platforms</summary>
          <div class="links-grid compact">
            {#each otherLinks as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer" class="link-card compact">
                <div class="link-content">
                  <div class="link-header">
                    <span class="link-icon">
                      <SocialIcon name={link.name} />
                    </span>
                    <span class="link-name">{link.name}</span>
                  </div>
                  <span class="link-description">{link.description}</span>
                </div>
              </a>
            {/each}
          </div>
        </details>
      </section>
    </div>

    <footer class="page-footer">
      <p>Based in Gdansk, Poland • Crafted with love</p>
    </footer>
  </main>
</div>
