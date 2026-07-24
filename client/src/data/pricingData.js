export const audienceOptions = [
  {
    id: "individuals",
    label: "For Individuals",
    shortLabel: "Individuals",
    description: "Freelancers, creators and solopreneurs",
  },
  {
    id: "organizations",
    label: "For Organizations",
    shortLabel: "Organizations",
    description: "Teams, startups and established businesses",
  },
];

export const individualPricing = {
  basePrice: 99,
  baseIncludes: [
    "Your private EkSaha workspace",
    "Quarterly growth planning session",
    "Plain-language monthly reporting",
    "Cancel or change services anytime",
  ],
  services: [
    {
      id: "seo",
      name: "SEO Accelerator",
      shortName: "SEO",
      price: 149,
      description: "Technical fixes, keyword direction and a focused monthly content brief.",
    },
    {
      id: "web",
      name: "Website Care",
      shortName: "Web",
      price: 199,
      description: "Ongoing design, development and performance improvements for your site.",
    },
    {
      id: "ads",
      name: "Ads Launchpad",
      shortName: "Ads",
      price: 179,
      description: "Campaign setup, optimization and reporting. Advertising spend is separate.",
    },
    {
      id: "it-support",
      name: "IT Essentials",
      shortName: "IT",
      price: 99,
      description: "Practical help with devices, accounts, cloud tools and everyday IT issues.",
    },
  ],
  discounts: {
    2: 0.1,
    3: 0.15,
    4: 0.2,
  },
  guides: [
    {
      name: "Solo",
      price: "From $198/mo",
      serviceIds: ["it-support"],
      description: "One focused service for the priority that matters most right now.",
      features: ["1 service module", "Monthly delivery cycle", "Quarterly planning", "Cancel anytime"],
    },
    {
      name: "Pro",
      price: "From $322/mo",
      serviceIds: ["seo", "web"],
      popular: true,
      description: "Two connected services that work together to grow your independent business.",
      features: ["Any 2 service modules", "10% module saving", "Shared growth roadmap", "Priority support"],
    },
    {
      name: "Custom",
      price: "Built around you",
      serviceIds: ["seo", "web", "ads", "it-support"],
      description: "A broader support mix for creators and freelancers with more moving parts.",
      features: ["3–4 service modules", "Up to 20% module saving", "Flexible priorities", "Custom onboarding"],
    },
  ],
};

export const organizationComparison = [
  { label: "Service coverage", values: ["1 core service", "Any 3 services", "All 4 services"] },
  { label: "Request model", values: ["15 requests / month", "Unlimited request queue", "Unlimited priority queue"] },
  { label: "Strategy cadence", values: ["Monthly", "Every 2 weeks", "Weekly"] },
  { label: "Response target", values: ["Within 48 hours", "Within 24 hours", "Within 4 hours"] },
  { label: "Reporting", values: ["Performance dashboard", "Advanced analytics", "Custom executive reporting"] },
  { label: "Dedicated support", values: ["Client success team", "Dedicated strategist", "Dedicated account team"] },
];

export const pricingFaqs = [
  {
    question: "What does the $99 individual base include?",
    answer: "It covers your EkSaha workspace, planning, reporting and account support. Service modules are added on top, so you only pay for the specialist help you choose.",
  },
  {
    question: "Can I change services later?",
    answer: "Yes. Individuals can add or remove modules, and organizations can change tiers as priorities evolve. There are no long-term contracts.",
  },
  {
    question: "Does the Ads module include advertising spend?",
    answer: "No. Your media budget is paid directly to the advertising platform, keeping spend transparent and fully under your control.",
  },
  {
    question: "What does unlimited requests mean?",
    answer: "You can add as many requests as you need to your queue. We work through them in priority order based on the capacity and response target of your plan.",
  },
];
