<script>
  import { onMount } from "svelte"

  let prices = []
  let groups = []
  let loading = true
  let error = null

  onMount(async () => {
    try {
      // Fetch prices
      const pricesResponse = await fetch("/api/prices?limit=10")
      const pricesData = await pricesResponse.json()
      prices = pricesData.data || []

      // Fetch groups
      const groupsResponse = await fetch("/api/groups?categoryId=3")
      const groupsData = await groupsResponse.json()
      groups = groupsData.data || []

      loading = false
    } catch (err) {
      error = err.message
      loading = false
    }
  })
</script>

<h1>API Test Page</h1>

{#if loading}
  <p>Loading data...</p>
{:else if error}
  <p class="error">Error: {error}</p>
{:else}
  <h2>Price History (First 10)</h2>
  {#if prices.length === 0}
    <p>No price data available</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Product ID</th>
          <th>Set</th>
          <th>Type</th>
          <th>Price</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {#each prices as price}
          <tr>
            <td>{price.product_id}</td>
            <td>{price.set_name}</td>
            <td>{price.sub_type_name}</td>
            <td>${price.prev_market_price?.toFixed(2) || "N/A"}</td>
            <td>{price.prev_date}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <h2>Card Groups</h2>
  {#if groups.length === 0}
    <p>No groups available</p>
  {:else}
    <ul>
      {#each groups as group}
        <li>
          <strong>{group.name}</strong> ({group.abbreviation || "No Abbr"}) -
          Released: {new Date(group.published_on).toLocaleDateString()}
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  .error {
    color: red;
  }

  h2 {
    margin-top: 2rem;
  }
</style>
