<script lang="ts">
  import Icon from '@iconify/svelte'; // Import Icon component
  import {
    WebsiteName,
    WebsiteBaseUrl,
    WebsiteDescription,
  } from "./../../config"

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: WebsiteName,
    url: WebsiteBaseUrl,
  }
  const jsonldScript = `<script type="application/ld+json">${
    JSON.stringify(ldJson) + "<"
  }/script>`

  const features = [
  {
    name: "Real-Time Price Tracking",
    description: "Monitor TCGPlayer market trends with daily updates on price spikes and dips.",
    icon: "flat-color-icons:bar-chart",
  },
  {
    name: "Daily Email Alerts",
    description: "Get notified when your tracked cards or sealed products have significant price changes.",
    icon: "flat-color-icons:invite",
  },
  {
    name: "User Dashboard",
    description: "Manage your tracked cards, set price alerts, and view historical price trends.",
    icon: "flat-color-icons:settings",
  },
  {
    name: "Subscription Plans",
    description: "Choose from free or premium plans to track more cards and get advanced analytics.",
    icon: "flat-color-icons:business",
  },
  {
    name: "Market Insights",
    description: "Analyze past price trends to predict the best times to buy and sell your cards.",
    icon: "flat-color-icons:pie-chart",
  },
  {
    name: "TCGPlayer Integration",
    description: "Direct links to TCGPlayer listings so you can buy or sell cards instantly.",
    icon: "flat-color-icons:shop",
  },
  {
    name: "Custom Price Alerts",
    description: "Set specific price thresholds and receive instant alerts when met.",
    icon: "flat-color-icons:alarm-clock",
  },

  {
    name: "Advanced Filtering",
    description: "Filter by card set, rarity, price range, and more for precise market tracking.",
    icon: "flat-color-icons:search",
  },
  {
    name: "Community-Driven",
    description: "Join a growing community of TCG investors and get insights from other collectors.",
    icon: "flat-color-icons:conference-call",
  },
];

</script>

<svelte:head>
  <title>{WebsiteName}</title>
  <meta name="description" content={WebsiteDescription} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html jsonldScript}
</svelte:head>

<div class="hero min-h-[60vh]">
  <div class="hero-content text-center py-12">
    <div class="max-w-xl">
      <div
        class="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 md:mb-7 pb-1"
      >
        TCG Market Tracker
      </div>

      <div
        class="text-4xl md:text-6xl font-bold px-2"
        style="line-height: 1.2;"
      >
        Stay Ahead with  
        <span
          class="decoration-secondary decoration-4 md:decoration-[6px]"
          >daily price alerts</span
        >
        <span
          class="decoration-secondary decoration-4 md:decoration-[6px]"
          >and market insights</span
        >
        <span> for TCG cards & sealed products</span>
      </div>
      <div class="mt-6 md:mt-10 text-sm md:text-lg">
        Powered by  
        <a href="https://www.tcgplayer.com" class="link font-bold" target="_blank">TCGplayer</a>,  
        and <a href="https://stripe.come" class="link font-bold" target="_blank">Stripe</a>.
      </div>
      <div
        class="mt-6 md:mt-4 flex flex-row flex-wrap gap-4 place-content-center"
      >
      <a href="https://yourtool.com/signup">
        <button class="btn btn-primary px-6">Get Started!</button>
      </a>
      <a href="https://yourtool.com/demo">
        <button class="btn btn-outline btn-primary px-6">View Live Demo</button>
      </a>
      
      </div>
    </div>
  </div>
</div>

<div class="min-h-[60vh]">
  <div class="pt-20 pb-8 px-7">
    <div class="max-w-lg mx-auto text-center">
      <div
        class="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent pb-2"
      >
        Stay Ahead of the Market
      </div>
      <div class="mt-4 text-xl font-bold">
        Track price spikes, dips, and trends with  
        <span
          class="underline decoration-secondary decoration-[3px] md:decoration-[4px]"
        >
          real-time insights and alerts.
        </span>
      </div>
    </div>

    <div
      class="flex gap-6 mt-12 max-w-[1064px] mx-auto place-content-center flex-wrap"
    >
      {#each features as feature}
        <div class="card bg-white w-[270px] min-h-[300px] flex-none shadow-xl">
          <div class="card-body items-center text-center p-[24px] pt-[32px]">
            <div>
              <svg
                width="50px"
                height="50px"
                class="mb-2 mt-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
              </svg>
            </div>
            <Icon icon={feature.icon} width="32" height="32" />

            <h2 class="card-title">
              {feature.name}
            </h2>
            <p class="text-sm">
              {feature.description}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
<div class="hero min-h-[60vh] mt-12">
  <div class="hero-content text-center pb-16 pt-4 px-4">
    <div class="max-w-lg">
      <div
        class="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mt-4 pb-2"
      >
        Track Market Trends Instantly
      </div>
      <div
        class="flex flex-col lg:flex-row mt-6 gap-6 place-content-center content-center"
      >
        <div class="hidden md:block">
          <a href="https://yourtool.com/demo" target="_blank" class="link">
            <div class="mockup-browser border">
              <div class="mockup-browser-toolbar">
                <div class="input" style="background:#eee;">
                  https://yourtool.com/demo
                </div>
              </div>
              <div class="flex justify-center">
                <img
                  alt="Screenshot of the TCG market tracker"
                  class="aspect-2044/1242"
                  src="/images/example-dashboard.png"
                />
              </div>
            </div>
          </a>
        </div>
        <div class="md:hidden">
          <a href="https://yourtool.com/demo" target="_blank" class="link">
            <div class="card shadow-xl border overflow-hidden">
              <img
                alt="Screenshot of the TCG market tracker"
                class="aspect-2044/1242"
                src="/images/example-dashboard.png"
              />
            </div></a
          >
        </div>
        <div class="min-w-[270px] lg:min-w-[420px] flex mt-6 lg:mt-0">
          <div class="my-auto">
            <div class="px-4 text-lg md:text-xl">
              <a href="https://yourtool.com/demo" class="" target="_blank"
                >This tool helps TCG investors and collectors stay ahead by  
                <span class="underline decoration-secondary decoration-[3px]">
                  tracking price spikes and dips in real time.</span
                ></a
              >
            </div>
            <div class="px-4 mt-6 text-lg md:text-xl">
              Get instant alerts and deep market insights on
              <a href="https://yourtool.com/demo" class="link font-bold" target="_blank">our demo</a
              > and never miss a key price change.
            </div>
            <div class="mt-4 text-large">
              <a href="https://yourtool.com/demo" target="_blank">
                <button class="btn btn-primary btn-wide mt-3"
                  >Try the Demo</button
                >
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
