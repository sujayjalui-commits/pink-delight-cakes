export const seedCatalog = {
  businessSettings: {
    brandName: "Pink Delight Cakes",
    contactEmail: "hello@pinkdelightcakes.com",
    contactPhone: "+91 87678 12121",
    instagramHandle: "@pinkdelightcake",
    city: "Your City",
    addressLine1: "",
    addressLine2: "",
    stateRegion: "Maharashtra",
    postalCode: "",
    countryCode: "IN",
    currency: "INR",
    paymentMode: "manual_quote",
    inquiryChannel: "website",
    deliveryPickupCopy: "Pickup and local delivery across your city",
    noticePeriodCopy: "Standard celebration cakes usually need 24 to 48 hours notice",
    bakeryIntroTitle: "Baked from home, designed with care, and made for real celebrations.",
    bakeryIntroParagraph1: "Pink Delight Cakes is led by Pinky Sangoi and began as a home bakery rooted in family celebrations, soft finishes, and cakes that feel personal from the very first conversation.",
    bakeryIntroParagraph2: "Every order is handled with care, from understanding the celebration style to suggesting flavors, colors, and finishing details that make the cake feel truly made for the moment.",
    responseTimeCopy: "Send your date, number of servings, flavor preference, and inspiration photo. You'll get a quick reply with design suggestions and pricing.",
    weekdayOpenTime: "10:00",
    weekdayCloseTime: "20:00",
    saturdayOpenTime: "10:00",
    saturdayCloseTime: "20:00",
    sundayOpenTime: "",
    sundayCloseTime: ""
  },
  adminUser: {
    email: "admin@pinkdelightcakes.com",
    role: "owner"
  },
  products: [
    {
      slug: "midnight-chocolate",
      name: "Midnight Chocolate",
      category: "Birthday centerpiece",
      shortDescription: "Rich chocolate sponge layered with smooth ganache and elegant buttercream details.",
      startingPrice: 3200,
      badge: "Best seller",
      leadTimeHours: 24,
      availabilityStatus: "available",
      featured: true,
      flavors: ["Chocolate truffle", "Chocolate hazelnut", "Chocolate coffee"],
      sizes: [
        { label: "Half kg", servings: "4 to 6", price: 3200 },
        { label: "1 kg", servings: "8 to 10", price: 4200 },
        { label: "1.5 kg", servings: "12 to 15", price: 5600 }
      ],
      addOns: ["Message topper", "Candles", "Name plaque"]
    },
    {
      slug: "vintage-rose",
      name: "Vintage Rose",
      category: "Anniversary and floral design",
      shortDescription: "Soft vanilla cake styled with romantic piped roses and a gentle pastel finish.",
      startingPrice: 3600,
      badge: "Pretty pick",
      leadTimeHours: 48,
      availabilityStatus: "limited",
      featured: true,
      flavors: ["Vanilla bean", "Strawberry cream", "White chocolate raspberry"],
      sizes: [
        { label: "Half kg", servings: "4 to 6", price: 3600 },
        { label: "1 kg", servings: "8 to 10", price: 4700 },
        { label: "2 kg", servings: "16 to 20", price: 7600 }
      ],
      addOns: ["Message topper", "Fresh florals", "Gold acrylic name tag"]
    },
    {
      slug: "classic-vanilla-berry",
      name: "Classic Vanilla Berry",
      category: "Baby shower and minimal style",
      shortDescription: "Fluffy vanilla sponge with cream filling and fresh berry styling.",
      startingPrice: 3000,
      badge: "Light and classic",
      leadTimeHours: 24,
      availabilityStatus: "available",
      featured: false,
      flavors: ["Classic vanilla", "Vanilla berry", "Honey almond"],
      sizes: [
        { label: "Half kg", servings: "4 to 6", price: 3000 },
        { label: "1 kg", servings: "8 to 10", price: 3900 },
        { label: "1.5 kg", servings: "12 to 15", price: 5200 }
      ],
      addOns: ["Message topper", "Candles", "Fruit garnish"]
    }
  ]
};
