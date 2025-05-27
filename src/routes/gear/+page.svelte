<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const categories = {
    camera: 'Cameras',
    lens: 'Lenses',
    accessory: 'Accessories'
  };
</script>

<nav>
  <a href="/">Home</a>
  <a href="/gear" class="active">Gear</a>
  <a href="/music">Music</a>
  <a href="/about">About me</a>
</nav>

<div class="wrapper">
  <main>
    <h1>My Photography Gear</h1>
    <p class="intro">Here's the equipment I use to capture my street photography. Each piece has been carefully chosen to suit my style and needs.</p>

    {#each Object.entries(categories) as [type, title]}
      <section>
        <h2>{title}</h2>
        <div class="gear-grid">
          {#each data.gear.filter(item => item.type === type) as item}
            <div class="gear-card">
              <div class="gear-content">
                <h3>{item.name}</h3>
                <p class="description">{item.description}</p>
                <ul class="specs">
                  {#each item.specs as spec}
                    <li>{spec}</li>
                  {/each}
                </ul>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </main>
</div>

<style>
  .wrapper {
    padding: 0 4rem;
    width: 100%;
    box-sizing: border-box;
  }

  main {
    margin-top: 6rem;
    max-width: 800px;
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
    max-width: 600px;
    margin-bottom: 4rem;
  }

  section {
    margin-bottom: 4rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 400;
    color: #fff;
    margin-bottom: 2rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .gear-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .gear-card {
    background: rgba(26, 26, 26, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .gear-card:hover {
    transform: translateY(-4px);
    background: rgba(26, 26, 26, 0.5);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .gear-content {
    padding: 2rem;
  }

  h3 {
    font-size: 1.2rem;
    font-weight: 400;
    margin: 0 0 1rem 0;
    color: #fff;
  }

  .description {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .specs {
    list-style: none;
    padding: 0;
    margin: 0;
    color: rgba(255, 255, 255, 0.5);
  }

  .specs li {
    margin-bottom: 0.5rem;
    padding-left: 1.2rem;
    position: relative;
  }

  .specs li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: rgba(255, 255, 255, 0.3);
  }

  nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center; /* Add vertical centering */
    gap: 2rem;
    padding: 1rem; /* Reduced padding that's more balanced */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 100;
  }

  nav a {
    color: #fff;
    text-decoration: none;
    font-size: 1rem;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    padding: 0.5rem; /* Add padding to increase tap target size */
  }

  nav a:hover {
    opacity: 1;
  }

  nav a.active {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .wrapper {
      padding: 0 1.5rem;
    }

    main {
      margin-top: 5rem;
      padding: 1.5rem 0;
    }
  }

  @media (max-width: 480px) {
    .wrapper {
      padding: 0 1rem;
    }

    main {
      margin-top: 4rem;
      padding: 1rem 0;
    }

    /* Navbar mobile styles */
    nav {
      gap: 0.5rem; /* Reduce gap on small screens */
      padding: 0.75rem 0.5rem; /* Less padding on mobile */
    }
    
    nav a {
      font-size: 0.9rem; /* Slightly smaller text */
      padding: 0.5rem 0.25rem; /* Adjust padding on links */
    }
  }
</style>