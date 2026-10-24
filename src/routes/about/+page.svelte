<script lang="ts">
  import SocialIcon from '$lib/components/SocialIcon.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  $: ({ primaryLinks, secondaryLinks, otherLinks, interests } = data.about);
</script>

<svelte:head>
  <link rel="stylesheet" href="/css/about.css">
</svelte:head>

<div class="wrapper">
  <main>
    <div class="hero-section">
      <h1>{data.about.title}</h1>
      <p class="intro">{data.about.intro}</p>
    </div>

    <div class="content-grid">
      <!-- About Section -->
      <section class="about-section">
        <h2>{data.about.sectionTitle}</h2>
        <div class="about-content">
          {#each data.about.paragraphs as paragraph}
            <p>{paragraph}</p>
          {/each}
        </div>
        
        <div class="interests">
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
  </main>
</div>
