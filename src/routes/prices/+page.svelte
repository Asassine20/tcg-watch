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
  let type = "card" // Default to "card" type
  let sets: { group_id: number; set_name: string }[] = []

  // Type options
  const typeOptions = [
    { value: "card", label: "Cards" },
    { value: "sealed", label: "Sealed Products" },
  ]

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
    type = urlParams.get("type") || "card"

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

      params.append("type", type)

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
    params.set("type", type)

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

<div class="container mx-auto px-4 py-6">
  <h1 class="text-3xl font-bold mb-6">Trading Card Prices</h1>

  <div class="flex flex-wrap gap-3 mb-6 items-center">
    <div class="form-control flex-1 min-w-[250px] relative pt-6">
      <!-- DaisyUI Search Input -->
      <label class="input input-bordered flex items-center gap-2 w-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="h-[1em] w-[1em] opacity-50"
          ><g stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            ><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"
            ></path></g
          ></svg
        >
        <input
          type="text"
          class="grow"
          placeholder="Search"
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
          <button class="btn btn-ghost btn-xs" on:click={clearSearch}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-4 w-4"
              ><path
                fill-rule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
              /></svg
            >
          </button>
        {/if}
      </label>
      <!-- End DaisyUI Search Input -->
    </div>

    <fieldset class="form-control">
      <legend>Type</legend>
      <select
        class="select select-bordered"
        bind:value={type}
        on:change={updateFiltersAndReload}
      >
        {#each typeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </fieldset>

    <fieldset class="form-control">
      <legend>Set</legend>
      <select
        class="select select-bordered"
        bind:value={selectedSet}
        on:change={updateFiltersAndReload}
      >
        <option value="">All Sets</option>
        {#each sets as set}
          <option value={set.group_id}>{set.set_name}</option>
        {/each}
      </select>
    </fieldset>

    <fieldset class="form-control">
      <legend>Price Range</legend>
      <select
        class="select"
        bind:value={selectedPriceRange}
        on:change={updateFiltersAndReload}
      >
        {#each priceRanges as range}
          <option value={range.value}>{range.label}</option>
        {/each}
      </select>
    </fieldset>

    <fieldset class="form-control">
      <legend>Items per page</legend>
      <select
        class="select select-bordered"
        bind:value={pageSize}
        on:change={updateFiltersAndReload}
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </fieldset>
  </div>

  {#if error}
    <div class="alert alert-error mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="overflow-x-auto mb-4">
    {#if loading}
      <div class="flex justify-center items-center p-8">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <span class="ml-2">Loading cards data...</span>
      </div>
    {:else if cards.length === 0}
      <div class="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-6 w-6 shrink-0 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>No cards found matching your filters.</span>
      </div>
    {:else}
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Image</th>
            <th
              class="cursor-pointer hover:bg-base-300"
              on:click={() => changeSort("name")}
            >
              Card Name {getSortIndicator("name")}
            </th>
            <th
              class="cursor-pointer hover:bg-base-300"
              on:click={() => changeSort("set_name")}
            >
              Set {getSortIndicator("set_name")}
            </th>
            <th
              class="cursor-pointer hover:bg-base-300"
              on:click={() => changeSort("prev_market_price")}
            >
              Prev Price {getSortIndicator("prev_market_price")}
            </th>
            <th
              class="cursor-pointer hover:bg-base-300"
              on:click={() => changeSort("market_price")}
            >
              Market Price {getSortIndicator("market_price")}
            </th>
            <th
              class="cursor-pointer hover:bg-base-300"
              on:click={() => changeSort("diff_market_price")}
            >
              % Change {getSortIndicator("diff_market_price")}
            </th>
            <th
              class="cursor-pointer hover:bg-base-300"
              on:click={() => changeSort("dollar_diff_market_price")}
            >
              $ Change {getSortIndicator("dollar_diff_market_price")}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each cards as card}
            <tr class="hover">
              <td class="w-[50px] h-[70px]">
                {#if card.image_url}
                  <img
                    src={card.image_url}
                    alt={card.name}
                    loading="lazy"
                    class="max-w-full max-h-full object-contain"
                  />
                {:else}
                  <div
                    class="w-[50px] h-[70px] flex items-center justify-center bg-base-200 text-xs text-opacity-70"
                  >
                    No Image
                  </div>
                {/if}
              </td>
              <td>
                <a
                  href={card.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link link-primary font-medium"
                >
                  {card.name}
                </a>
                {#if card.sub_type_name}
                  <span class="block text-sm text-opacity-70"
                    >{card.sub_type_name}</span
                  >
                {/if}
              </td>
              <td>{card.set_name}</td>
              <td class="font-medium"
                >{formatCurrency(card.prev_market_price)}</td
              >
              <td class="font-medium">{formatCurrency(card.market_price)}</td>
              <td
                class:text-success={card.diff_market_price > 0}
                class:text-error={card.diff_market_price < 0}
                class="font-medium"
              >
                {formatPercentage(card.diff_market_price)}
              </td>
              <td
                class:text-success={card.dollar_diff_market_price > 0}
                class:text-error={card.dollar_diff_market_price < 0}
                class="font-medium"
              >
                {formatDollarDiff(card.dollar_diff_market_price)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <div class="join flex justify-center my-6">
    <button
      class="join-item btn"
      disabled={currentPage <= 1}
      on:click={() => changePage(1)}
    >
      «
    </button>

    <button
      class="join-item btn"
      disabled={currentPage <= 1}
      on:click={() => changePage(currentPage - 1)}
    >
      Previous
    </button>

    <button class="join-item btn btn-disabled">
      {currentPage} of {totalPages}
    </button>

    <button
      class="join-item btn"
      disabled={currentPage >= totalPages}
      on:click={() => changePage(currentPage + 1)}
    >
      Next
    </button>

    <button
      class="join-item btn"
      disabled={currentPage >= totalPages}
      on:click={() => changePage(totalPages)}
    >
      »
    </button>
  </div>

  <div class="text-center text-opacity-60 text-sm">
    Showing {cards.length} of {totalItems} cards
  </div>
</div>

<style>
  /* DaisyUI and Tailwind handle most styling - we can remove almost all custom CSS */
</style>
