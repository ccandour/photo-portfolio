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
    { name: 'Guitar', icon: '🎸' }
  ];
</script>

<svelte:head>
  <link rel="stylesheet" href="/css/about.css">
</svelte:head>

<div class="wrapper">
  <main>
    <div class="hero-section">
      <h1>hey there 👋</h1>
      <p class="intro">
        I'm Piotr, 18, from Poland. I love taking photos of random things happening on the streets. 
        Also into coding and other random things. Here's where you can find me online if you want to check out what I'm up to.
      </p>
    </div>

    <div class="content-grid">
      <!-- About Section -->
      <section class="about-section">
        <h2>what i'm into</h2>
        <div class="about-content">
          <p>
            Street photography is pretty much my thing — I just walk around and take pictures of whatever catches my eye. 
            People doing their daily stuff, cool shadows, weird moments. I'm usually more active with my camera when I'm traveling somewhere new, 
            but I try to bring it with me around town too.
          </p>
          <p>
            I also code a bunch (studying CS) and built this whole site myself (with copilot). 
            It's kinda cool how photography and programming both involve seeing things differently and creating something out of it.
          </p>
        </div>
        
        <div class="interests">
          <h3>what i'm into rn</h3>
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
        <h2>find me online</h2>
        
        <div class="links-category">
          <h3>main profiles</h3>
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
          <h3>movies, books etc</h3>
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
          <summary>FOR THE CURIOUS</summary>
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
      <p>chilling in gdansk, poland • made with ☕ and way too much overthinking</p>
    </footer>
  </main>
</div>
