export const entityShapes = {
  product: [
    "id",
    "slug",
    "name",
    "category",
    "shortDescription",
    "startingPrice",
    "badge",
    "leadTimeHours",
    "availabilityStatus",
    "featured"
  ],
  orderRequest: [
    "id",
    "customerName",
    "customerPhone",
    "customerEmail",
    "productId",
    "productSnapshot",
    "flavor",
    "sizeLabel",
    "servings",
    "eventDate",
    "fulfillmentType",
    "addOn",
    "notes",
    "status",
    "sourceChannel"
  ],
  paymentRecord: [
    "id",
    "orderRequestId",
    "provider",
    "providerOrderId",
    "providerPaymentId",
    "amount",
    "currency",
    "status"
  ]
};
