import { seedCatalog } from "../../../../packages/shared/constants/seed-catalog.js";

export function getBootstrapSummary() {
  return {
    business: {
      name: seedCatalog.businessSettings.brandName,
      inquiryFlow: "quote-first",
      paymentFlow: "hybrid-razorpay"
    },
    counts: {
      products: seedCatalog.products.length,
      settings: 1,
      adminUsers: 1
    },
    nextStep: "phase-2-public-catalog-and-inquiry-apis"
  };
}
