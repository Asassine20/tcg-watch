<script lang="ts">
  import PricingModule from "./pricing_module.svelte"
</script>

<svelte:head>
  <title>Pricing - TCG Watch</title>
  <meta
    name="description"
    content="Pricing for TCG Watch - Stay ahead of Pokémon card market trends."
  />
</svelte:head>

<div class="min-h-[70vh] pb-8 pt-[5vh] px-4">
  <h1 class="text-3xl font-bold text-center">Pricing</h1>
  <h2 class="text-xl text-center text-slate-500 mt-1 pb-3">
    Track Pokémon card prices effortlessly with TCG Watch
  </h2>

  <div class="w-full my-8">
    <PricingModule callToAction="Get Started" highlightedPlanId="basic" />
  </div>

  <h1 class="text-2xl font-bold text-center mt-16">Plan Features</h1>
  <h2 class="text-xl text-center text-slate-500 mt-1 pb-3">
    Compare our plans
  </h2>

  <div class="overflow-visible mx-auto max-w-xl mt-4">
    <table class="table">
      <thead
        class="text-lg sticky top-0 bg-base-100 bg-opacity-50 z-10 backdrop-blur-sm"
      >
        <tr>
          <th></th>
          <th class="text-center">Basic</th>
          <th class="text-center text-gray-400">Pro (Coming Soon)</th>
          <th class="text-center text-gray-400">Elite (Coming Soon)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Daily Price Updates</td>
          <td class="text-center">✔</td>
          <td class="text-center text-gray-400">✔</td>
          <td class="text-center text-gray-400">✔</td>
        </tr>
        <tr>
          <td>Pricing History & Trends</td>
          <td class="text-center">✔</td>
          <td class="text-center text-gray-400">✔</td>
          <td class="text-center text-gray-400">✔</td>
        </tr>
        <tr>
          <td>Buying & Selling Recommendations</td>
          <td class="text-center">✔</td>
          <td class="text-center text-gray-400">✔</td>
          <td class="text-center text-gray-400">✔</td>
        </tr>
        <tr>
          <td>24/7 Customer Support</td>
          <td class="text-center">✔</td>
          <td class="text-center text-gray-400">✔</td>
          <td class="text-center text-gray-400">✔</td>
        </tr>
      </tbody>
    </table>
  </div>
  <h1 class="text-2xl font-bold text-center mt-24">Pricing FAQ</h1>
  <div class="flex place-content-center">
    <div class="join join-vertical max-w-xl py-6 mx-auto">
      <div class="collapse collapse-arrow join-item border border-primary">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-lg font-medium">
          Is there a free plan available?
        </div>
        <div class="collapse-content">
          <p>Yes, we have a free plan for users to look at market data.</p>
        </div>
      </div>
      <div class="collapse collapse-arrow join-item border border-primary">
        <input type="radio" name="faq-accordion" />
        <div class="collapse-title text-lg font-medium">
          What features are included?
        </div>
        <div class="collapse-content">
          <p>
            You'll get daily market updates, pricing history, buying/selling
            recommendations, and 24/7 customer support.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
