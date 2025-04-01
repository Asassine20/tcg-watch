<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/stores"
  import { goto } from "$app/navigation"
  import { formatCurrency, formatPercentage } from "$lib/utils/formatters"

  // Pagination state
  let currentPage = 1
  let pageSize = 20
  let totalItems = 0
  let totalPages = 0

  // Table data
  let cards: any[] = []
  let loading = true
  let error: string | null = null

  // Filter state
  let searchTerm = ""
  let selectedSet = ""
  let selectedPriceRange = ""
  let sets: { group_id: number; set_name: string }[] = []

  // Price range options
  const priceRanges = [
    { value: "", label: "All Prices" },
    { value: "0-5", label: "$0 - $5" },
    { value: "5-20", label: "$5 - $20" },
    { value: "20+", label: "$20+" },
  ]

  // Sorting
  let sortColumn = "market_price"
  let sortDirection: "asc" | "desc" = "desc"

  // Load initial data
  onMount(async () => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    currentPage = parseInt(urlParams.get("page") || "1")
    pageSize = parseInt(urlParams.get("pageSize") || "20")
    searchTerm = urlParams.get("search") || ""
    selectedSet = urlParams.get("set") || ""
    selectedPriceRange = urlParams.get("priceRange") || ""
    sortColumn = urlParams.get("sort") || "market_price"
    sortDirection = (urlParams.get("dir") || "desc") as "asc" | "desc"

    // Load sets for filter dropdown
    await loadSets()

    // Load card data
    await loadCards()
  })

  // Function to load available sets
  async function loadSets() {
    try {
      const response = await fetch("/api/prices/sets")
      if (!response.ok) {
        throw new Error("Failed to load sets")
      }
      const data = await response.json()
      sets = data.sets || []
    } catch (err: any) {
      console.error("Error loading sets:", err)
    }
  }

  // Function to load card data with current filters and pagination
  async function loadCards() {
    loading = true
    error = null

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        sort: sortColumn,
        dir: sortDirection,
      })

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      if (selectedSet) {
        params.append("set", selectedSet)
      }

      if (selectedPriceRange) {
        params.append("priceRange", selectedPriceRange)
      }

      // Fetch data from API
      const response = await fetch(`/api/prices/paginated?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to load card data")
      }

      const data = await response.json()
      cards = data.cards || []
      totalItems = data.totalItems || 0
      totalPages = Math.ceil(totalItems / pageSize)
    } catch (err: any) {
      error = err.message || "An error occurred while loading the data"
      console.error("Error loading cards:", err)
    } finally {
      loading = false
    }
  }

  // Update URL and reload when filters/pagination change
  function updateFiltersAndReload() {
    currentPage = 1 // Reset to first page when filters change
    updateUrlAndLoadCards()
  }

  // Handle page change
  function changePage(newPage: number) {
    if (newPage < 1 || newPage > totalPages) return
    currentPage = newPage
    updateUrlAndLoadCards()
  }

  // Update URL params and reload data
  function updateUrlAndLoadCards() {
    // Build query parameters
    const params = new URLSearchParams()
    params.set("page", currentPage.toString())
    params.set("pageSize", pageSize.toString())
    params.set("sort", sortColumn)
    params.set("dir", sortDirection)

    if (searchTerm) {
      params.set("search", searchTerm)
    }

    if (selectedSet) {
      params.set("set", selectedSet)
    }

    if (selectedPriceRange) {
      params.set("priceRange", selectedPriceRange)
    }

    // Update URL without reloading the page
    goto(`?${params.toString()}`, { replaceState: true, noScroll: true })

    // Reload data
    loadCards()
  }

  // Handle sorting change
  function changeSort(column: string) {
    if (sortColumn === column) {
      // Toggle direction if same column
      sortDirection = sortDirection === "asc" ? "desc" : "asc"
    } else {
      // Default to descending for new column
      sortColumn = column
      sortDirection = "desc"
    }

    updateUrlAndLoadCards()
  }

  // Get sort indicator
  function getSortIndicator(column: string): string {
    if (sortColumn !== column) return ""
    return sortDirection === "asc" ? "▲" : "▼"
  }

  // Format numbers for display
  function getPercentageClass(value: number | null): string {
    if (!value) return ""
    return value > 0 ? "positive" : value < 0 ? "negative" : ""
  }

  // Function to clear search text and reload
  function clearSearch() {
    searchTerm = ""
    updateFiltersAndReload()
  }

  // Format dollar difference with sign
  function formatDollarDiff(value: number | null): string {
    if (value === null || value === undefined) return "-"
    const sign = value > 0 ? "+" : ""
    return `${sign}${formatCurrency(value)}`
  }
</script>

<svelte:head>
  <title>Trading Card Prices | TCG Watch</title>
</svelte:head>

<div class="container prices-page">
  <h1>Trading Card Prices</h1>

  <div class="filters">
    <div class="search-filter">
      <input
        type="text"
        placeholder="Search cards..."
        bind:value={searchTerm}
        on:input={() => {
          if (searchTerm === "") {
            updateFiltersAndReload()
          }
        }}
        on:keypress={(e) => {
          if (e.key === "Enter") {
            updateFiltersAndReload()
          }
        }}
      />
      {#if searchTerm}
        <span
          class="clear-icon"
          on:click={clearSearch}
          aria-label="Clear search">×</span
        >
      {/if}
      <button class="search-button" on:click={updateFiltersAndReload}
        >Search</button
      >
    </div>

    <div class="set-filter">
      <select bind:value={selectedSet} on:change={updateFiltersAndReload}>
        <option value="">All Sets</option>
        {#each sets as set}
          <option value={set.group_id}>{set.set_name}</option>
        {/each}
      </select>
    </div>

    <div class="price-range-filter">
      <select
        bind:value={selectedPriceRange}
        on:change={updateFiltersAndReload}
      >
        {#each priceRanges as range}
          <option value={range.value}>{range.label}</option>
        {/each}
      </select>
    </div>

    <div class="page-size-filter">
      <label>
        Items per page:
        <select bind:value={pageSize} on:change={updateFiltersAndReload}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </label>
    </div>
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="table-container">
    {#if loading}
      <div class="loading">Loading cards data...</div>
    {:else if cards.length === 0}
      <div class="no-results">No cards found matching your filters.</div>
    {:else}
      <table class="cards-table">
        <thead>
          <tr>
            <th>Image</th>
            <th on:click={() => changeSort("name")}>
              Card Name {getSortIndicator("name")}
            </th>
            <th on:click={() => changeSort("set_name")}>
              Set {getSortIndicator("set_name")}
            </th>
            <th on:click={() => changeSort("prev_market_price")}>
              Prev Price {getSortIndicator("prev_market_price")}
            </th>
            <th on:click={() => changeSort("market_price")}>
              Market Price {getSortIndicator("market_price")}
            </th>
            <th on:click={() => changeSort("diff_market_price")}>
              % Change {getSortIndicator("diff_market_price")}
            </th>
            <th on:click={() => changeSort("dollar_diff_market_price")}>
              $ Change {getSortIndicator("dollar_diff_market_price")}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each cards as card}
            <tr>
              <td class="card-image">
                {#if card.image_url}
                  <img src={card.image_url} alt={card.name} loading="lazy" />
                {:else}
                  <div class="no-image">No Image</div>
                {/if}
              </td>
              <td class="card-name">
                <a
                  href={card.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {card.name}
                </a>
                {#if card.sub_type_name}
                  <span class="subtype">{card.sub_type_name}</span>
                {/if}
              </td>
              <td class="set-name">{card.set_name}</td>
              <td class="market-price">{formatCurrency(card.market_price)}</td>
              <td class="prev-market-price"
                >{formatCurrency(card.prev_market_price)}</td
              >
              <td
                class="price-change {getPercentageClass(
                  card.diff_market_price,
                )}"
              >
                {formatPercentage(card.diff_market_price)}
              </td>
              <td
                class="dollar-change {getPercentageClass(
                  card.dollar_diff_market_price,
                )}"
              >
                {formatDollarDiff(card.dollar_diff_market_price)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <div class="pagination">
    <button disabled={currentPage <= 1} on:click={() => changePage(1)}>
      &laquo; First
    </button>

    <button
      disabled={currentPage <= 1}
      on:click={() => changePage(currentPage - 1)}
    >
      &lt; Previous
    </button>

    <span class="page-info">
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage >= totalPages}
      on:click={() => changePage(currentPage + 1)}
    >
      Next &gt;
    </button>

    <button
      disabled={currentPage >= totalPages}
      on:click={() => changePage(totalPages)}
    >
      Last &raquo;
    </button>
  </div>

  <div class="page-summary">
    Showing {cards.length} of {totalItems} cards
  </div>
</div>

<style>
  .prices-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  h1 {
    margin-bottom: 1.5rem;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: center;
  }

  .search-filter {
    display: flex;
    flex: 1;
    min-width: 250px;
    position: relative;
  }

  .search-filter input {
    flex: 1;
    padding: 0.5rem;
    padding-right: 2rem; /* Make room for the clear icon */
    border-radius: 4px 0 0 4px;
    border: 1px solid #ccc;
  }

  .clear-icon {
    position: absolute;
    right: 4.5rem; /* Position to the left of the search button */
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .clear-icon:hover {
    opacity: 1;
    color: #666;
  }

  .search-filter button {
    padding: 0.5rem 1rem;
    background: #0077cc;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }

  .set-filter select,
  .page-size-filter select {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .price-range-filter select {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .table-container {
    overflow-x: auto;
    margin-bottom: 1rem;
  }

  .cards-table {
    width: 100%;
    border-collapse: collapse;
  }

  .cards-table th {
    background-color: #f5f5f5;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    user-select: none;
  }

  .cards-table th:hover {
    background-color: #e5e5e5;
  }

  .cards-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
  }

  .card-image {
    width: 50px;
    height: 70px;
  }

  .card-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .no-image {
    width: 50px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    font-size: 0.7rem;
    color: #666;
  }

  .card-name a {
    color: #0077cc;
    text-decoration: none;
    font-weight: 500;
  }

  .card-name a:hover {
    text-decoration: underline;
  }

  .subtype {
    display: block;
    font-size: 0.8rem;
    color: #666;
  }

  .market-price,
  .prev-market-price {
    font-weight: 500;
  }

  .price-change,
  .dollar-change {
    font-weight: 500;
  }

  .positive {
    color: #00aa00;
  }

  .negative {
    color: #dd0000;
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.5rem 0;
  }

  .pagination button {
    padding: 0.5rem 0.75rem;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination button:hover:not(:disabled) {
    background: #e5e5e5;
  }

  .page-info {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
  }

  .page-summary {
    text-align: center;
    color: #666;
  }

  .loading,
  .no-results,
  .error-message {
    padding: 2rem;
    text-align: center;
  }

  .error-message {
    color: #dd0000;
    background-color: #ffeeee;
    border-radius: 4px;
  }
</style>
