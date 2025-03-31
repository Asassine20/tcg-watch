/**
 * Format a number as currency
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return "N/A"

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value / 100) // divide by 100 since value is already a percentage

  return formattedValue
}
