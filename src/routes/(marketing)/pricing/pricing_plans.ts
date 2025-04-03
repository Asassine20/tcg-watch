export const defaultPlanId = "basic"

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    description: "Get full access to market prices",
    price: "$0",
    priceIntervalName: "per month",
    stripe_price_id: null, // Replace with actual Stripe price ID
    features: [
      "Access to all market prices",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    description: "Get full access to market insights and pricing trends.",
    price: "$10",
    priceIntervalName: "per month",
    stripe_price_id: "price_xxxxxxx", // Replace with actual Stripe price ID
    stripe_product_id: "prod_xxxxxxx", // Replace with actual Stripe product ID
    features: [
      "Daily market updates",
      "Historical price trends",
      "Buying & selling recommendations",
      "24/7 customer support",
    ],
  },
  /*
  {
    id: "pro",
    name: "Pro",
    description: "Advanced analytics and premium tools. Coming soon!",
    price: "Coming Soon",
    priceIntervalName: "",
    stripe_price_id: null,
    stripe_product_id: null,
    features: [
      "Everything in Basic",
      "Deeper market insights",
      "Exclusive alerts & signals",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    description: "Ultimate market intelligence. Coming soon!",
    price: "Coming Soon",
    priceIntervalName: "",
    stripe_price_id: null,
    stripe_product_id: null,
    features: [
      "Everything in Pro",
      "Personalized recommendations",
      "Early access to trends",
    ],
  },
  */
]
