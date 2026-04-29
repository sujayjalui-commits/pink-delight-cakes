const ORDER_STATUSES = [
    "new",
    "reviewing",
    "quoted",
    "payment_pending",
    "paid",
    "scheduled",
    "completed",
    "cancelled"
];

const PRODUCT_AVAILABILITY = ["available", "limited", "unavailable"];
const FORM_KEYS = ["order", "product", "settings", "testimonials"];
const PRODUCT_IMAGE_UPLOAD_MAX_BYTES = 320 * 1024;
const PRODUCT_IMAGE_MAX_DIMENSION = 1400;
const ORDER_REPLY_TEMPLATE_OPTIONS = [
    { key: "status_update", label: "Status update", hint: "A general bakery update based on the current inquiry status." },
    { key: "quote_follow_up", label: "Quote follow-up", hint: "A follow-up for shared pricing or pending customer confirmation." },
    { key: "pickup_ready", label: "Pickup ready", hint: "A pickup-ready note with timing and collection guidance." },
    { key: "delivery_ready", label: "Delivery ready", hint: "A delivery-ready note with arrival and handoff guidance." }
];

const state = {
    session: null,
    orders: [],
    products: [],
    settings: null,
    testimonials: [],
    activeView: "orders",
    activeOrderId: null,
    activeProductId: null,
    orderFilter: "all",
    orderScope: "all",
    orderSearch: "",
    orderSort: "attention_desc",
    selectedOrderIds: [],
    activeReplyTemplate: "status_update",
    isCreatingProduct: false,
    productDraft: null,
    formMeta: {
        order: { baseline: "", savedAt: null },
        product: { baseline: "", savedAt: null },
        settings: { baseline: "", savedAt: null },
        testimonials: { baseline: "", savedAt: null }
    }
};

const body = document.body;

function isRuntimePlaceholder(value) {
    return /^__.+__$/.test(String(value || "").trim());
}

function normalizeAbsoluteUrl(value) {
    const trimmedValue = String(value || "").trim();

    if (!trimmedValue || isRuntimePlaceholder(trimmedValue)) {
        return "";
    }

    try {
        return new URL(trimmedValue).toString();
    } catch {
        return "";
    }
}

function normalizeApiBase(value) {
    const trimmedValue = String(value || "").trim();

    if (!trimmedValue || isRuntimePlaceholder(trimmedValue)) {
        return "";
    }

    if (trimmedValue.startsWith("/")) {
        return trimmedValue.replace(/\/$/, "");
    }

    return normalizeAbsoluteUrl(trimmedValue).replace(/\/$/, "");
}

const apiBase = normalizeApiBase(body.dataset.apiBase || "") || "/api";

const authScreen = document.getElementById("authScreen");
const dashboard = document.getElementById("dashboard");
const authStatus = document.getElementById("authStatus");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const sessionChip = document.getElementById("sessionChip");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarNav = document.getElementById("sidebarNav");
const overviewStats = document.getElementById("overviewStats");
const recentOrders = document.getElementById("recentOrders");
const productHealth = document.getElementById("productHealth");
const needsAttentionList = document.getElementById("needsAttentionList");
const refreshOverview = document.getElementById("refreshOverview");
const refreshOrders = document.getElementById("refreshOrders");
const refreshProducts = document.getElementById("refreshProducts");
const refreshSettings = document.getElementById("refreshSettings");
const orderFilters = document.getElementById("orderFilters");
const orderSearchInput = document.getElementById("orderSearchInput");
const orderSortSelect = document.getElementById("orderSortSelect");
const orderQuickFilters = document.getElementById("orderQuickFilters");
const orderBulkActions = document.getElementById("orderBulkActions");
const orderSelectAllVisible = document.getElementById("orderSelectAllVisible");
const orderBulkCount = document.getElementById("orderBulkCount");
const clearOrderSelectionButton = document.getElementById("clearOrderSelectionButton");
const ordersList = document.getElementById("ordersList");
const ordersCountLabel = document.getElementById("ordersCountLabel");
const orderEmptyState = document.getElementById("orderEmptyState");
const orderForm = document.getElementById("orderForm");
const orderSummary = document.getElementById("orderSummary");
const orderStatus = document.getElementById("orderStatus");
const orderQuotedAmount = document.getElementById("orderQuotedAmount");
const orderInternalNote = document.getElementById("orderInternalNote");
const orderSaveButton = document.getElementById("orderSaveButton");
const orderSaveMeta = document.getElementById("orderSaveMeta");
const orderQuickActions = document.getElementById("orderQuickActions");
const orderReplyTemplates = document.getElementById("orderReplyTemplates");
const orderReplyTemplateLabel = document.getElementById("orderReplyTemplateLabel");
const orderReplyTemplateHint = document.getElementById("orderReplyTemplateHint");
const orderReplyPreview = document.getElementById("orderReplyPreview");
const openOrderWhatsAppButton = document.getElementById("openOrderWhatsAppButton");
const copyOrderReplyButton = document.getElementById("copyOrderReplyButton");
const copyOrderSummaryButton = document.getElementById("copyOrderSummaryButton");
const productsGrid = document.getElementById("productsGrid");
const newProductButton = document.getElementById("newProductButton");
const duplicateProductButton = document.getElementById("duplicateProductButton");
const productEditorLabel = document.getElementById("productEditorLabel");
const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productSlug = document.getElementById("productSlug");
const productCategory = document.getElementById("productCategory");
const productBadge = document.getElementById("productBadge");
const productDescription = document.getElementById("productDescription");
const productStartingPrice = document.getElementById("productStartingPrice");
const productLeadTime = document.getElementById("productLeadTime");
const productAvailability = document.getElementById("productAvailability");
const productImageUrl = document.getElementById("productImageUrl");
const productImageFile = document.getElementById("productImageFile");
const productImageUploadButton = document.getElementById("productImageUploadButton");
const productImageClearButton = document.getElementById("productImageClearButton");
const productImageMeta = document.getElementById("productImageMeta");
const productFeatured = document.getElementById("productFeatured");
const productSaveButton = document.getElementById("productSaveButton");
const productSaveMeta = document.getElementById("productSaveMeta");
const productPreviewCard = document.getElementById("productPreviewCard");
const flavorList = document.getElementById("flavorList");
const flavorComposerInput = document.getElementById("flavorComposerInput");
const addFlavorButton = document.getElementById("addFlavorButton");
const sizeList = document.getElementById("sizeList");
const addonList = document.getElementById("addonList");
const addonComposerInput = document.getElementById("addonComposerInput");
const addAddonButton = document.getElementById("addAddonButton");
const settingsForm = document.getElementById("settingsForm");
const settingsBrandName = document.getElementById("settingsBrandName");
const settingsCity = document.getElementById("settingsCity");
const settingsContactPhone = document.getElementById("settingsContactPhone");
const settingsContactEmail = document.getElementById("settingsContactEmail");
const settingsAddressLine1 = document.getElementById("settingsAddressLine1");
const settingsAddressLine2 = document.getElementById("settingsAddressLine2");
const settingsStateRegion = document.getElementById("settingsStateRegion");
const settingsPostalCode = document.getElementById("settingsPostalCode");
const settingsCountryCode = document.getElementById("settingsCountryCode");
const settingsInstagramHandle = document.getElementById("settingsInstagramHandle");
const settingsInquiryChannel = document.getElementById("settingsInquiryChannel");
const settingsCurrency = document.getElementById("settingsCurrency");
const settingsPaymentMode = document.getElementById("settingsPaymentMode");
const settingsDeliveryPickupCopy = document.getElementById("settingsDeliveryPickupCopy");
const settingsNoticePeriodCopy = document.getElementById("settingsNoticePeriodCopy");
const settingsBakeryIntroTitle = document.getElementById("settingsBakeryIntroTitle");
const settingsBakeryIntroParagraph1 = document.getElementById("settingsBakeryIntroParagraph1");
const settingsBakeryIntroParagraph2 = document.getElementById("settingsBakeryIntroParagraph2");
const settingsResponseTimeCopy = document.getElementById("settingsResponseTimeCopy");
const settingsHeroProduct1 = document.getElementById("settingsHeroProduct1");
const settingsHeroProduct2 = document.getElementById("settingsHeroProduct2");
const settingsHeroProduct3 = document.getElementById("settingsHeroProduct3");
const settingsHeroProduct4 = document.getElementById("settingsHeroProduct4");
const settingsHeroSelectionMeta = document.getElementById("settingsHeroSelectionMeta");
const settingsSpotlightTitle = document.getElementById("settingsSpotlightTitle");
const settingsSpotlightDescription = document.getElementById("settingsSpotlightDescription");
const settingsSpotlightImageUrl = document.getElementById("settingsSpotlightImageUrl");
const settingsSpotlightSourceUrl = document.getElementById("settingsSpotlightSourceUrl");
const settingsSpotlightImageFile = document.getElementById("settingsSpotlightImageFile");
const settingsSpotlightUploadButton = document.getElementById("settingsSpotlightUploadButton");
const settingsSpotlightClearButton = document.getElementById("settingsSpotlightClearButton");
const settingsSpotlightImageMeta = document.getElementById("settingsSpotlightImageMeta");
const settingsWeekdayOpenTime = document.getElementById("settingsWeekdayOpenTime");
const settingsWeekdayCloseTime = document.getElementById("settingsWeekdayCloseTime");
const settingsSaturdayOpenTime = document.getElementById("settingsSaturdayOpenTime");
const settingsSaturdayCloseTime = document.getElementById("settingsSaturdayCloseTime");
const settingsSundayOpenTime = document.getElementById("settingsSundayOpenTime");
const settingsSundayCloseTime = document.getElementById("settingsSundayCloseTime");
const settingsSummary = document.getElementById("settingsSummary");
const settingsPreviewHeroTitle = document.getElementById("settingsPreviewHeroTitle");
const settingsPreviewHeroCity = document.getElementById("settingsPreviewHeroCity");
const settingsPreviewDelivery = document.getElementById("settingsPreviewDelivery");
const settingsPreviewNotice = document.getElementById("settingsPreviewNotice");
const settingsPreviewIntroTitle = document.getElementById("settingsPreviewIntroTitle");
const settingsPreviewIntroOne = document.getElementById("settingsPreviewIntroOne");
const settingsPreviewIntroTwo = document.getElementById("settingsPreviewIntroTwo");
const settingsPreviewPhone = document.getElementById("settingsPreviewPhone");
const settingsPreviewEmail = document.getElementById("settingsPreviewEmail");
const settingsPreviewLocation = document.getElementById("settingsPreviewLocation");
const settingsPreviewResponse = document.getElementById("settingsPreviewResponse");
const settingsPreviewSpotlight = document.getElementById("settingsPreviewSpotlight");
const settingsSaveButton = document.getElementById("settingsSaveButton");
const settingsSaveMeta = document.getElementById("settingsSaveMeta");
const testimonialsForm = document.getElementById("testimonialsForm");
const testimonialList = document.getElementById("testimonialList");
const testimonialsPreviewGrid = document.getElementById("testimonialsPreviewGrid");
const addTestimonialButton = document.getElementById("addTestimonialButton");
const testimonialsSaveButton = document.getElementById("testimonialsSaveButton");
const testimonialsSaveMeta = document.getElementById("testimonialsSaveMeta");
const toastStack = document.getElementById("toastStack");
const settingsHeroProductFields = [
    settingsHeroProduct1,
    settingsHeroProduct2,
    settingsHeroProduct3,
    settingsHeroProduct4
];

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function statusLabel(status) {
    return String(status || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
        return "Not quoted yet";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value));
}

function formatDate(value) {
    if (!value) {
        return "No date selected";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(parsed);
}

function formatDateTime(value) {
    if (!value) {
        return "Not available";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(parsed);
}

function createStarsMarkup(rating) {
    const count = Math.max(1, Math.min(5, Number(rating) || 5));
    return Array.from({ length: count }, () => '<i class="fa-solid fa-star"></i>').join("");
}

function slugLabel(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function generateSlug(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
}

function getUniqueProductSlug(baseSlug, excludedProductId = null) {
    const fallbackBase = generateSlug(baseSlug) || "cake-product";
    const normalizedExistingSlugs = new Set(
        state.products
            .filter((product) => product.id !== excludedProductId)
            .map((product) => String(product.slug || "").trim())
            .filter(Boolean)
    );

    if (!normalizedExistingSlugs.has(fallbackBase)) {
        return fallbackBase;
    }

    let suffix = 2;
    while (normalizedExistingSlugs.has(`${fallbackBase}-${suffix}`)) {
        suffix += 1;
    }

    return `${fallbackBase}-${suffix}`;
}

function normalizePhoneNumber(value) {
    const digits = String(value || "").replace(/\D+/g, "");

    if (!digits) {
        return "";
    }

    if (digits.startsWith("91")) {
        return digits;
    }

    return `91${digits}`;
}

function createWhatsAppLink(phoneNumber, message) {
    const digits = normalizePhoneNumber(phoneNumber);

    if (!digits) {
        return "";
    }

    return message
        ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
        : `https://wa.me/${digits}`;
}

function daysUntilDate(value) {
    if (!value) {
        return Number.POSITIVE_INFINITY;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(value);
    eventDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(eventDate.getTime())) {
        return Number.POSITIVE_INFINITY;
    }

    return Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function createStableSnapshot(value) {
    return JSON.stringify(value);
}

function formatSavedMessage(savedAt) {
    if (!savedAt) {
        return "No changes yet.";
    }

    const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(savedAt).getTime()) / 1000));

    if (elapsedSeconds < 60) {
        return "Saved just now.";
    }

    const elapsedMinutes = Math.round(elapsedSeconds / 60);
    return `Saved ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago.`;
}

function getHeroCityLabel(city) {
    const normalizedCity = String(city || "").trim();

    if (!normalizedCity || /^your city$/i.test(normalizedCity)) {
        return "Home bakery";
    }

    return `Home bakery in ${normalizedCity}`;
}

function getContactLocationLabel(city) {
    const normalizedCity = String(city || "").trim();

    if (!normalizedCity || /^your city$/i.test(normalizedCity)) {
        return "Pickup by pre-arranged slot, with nearby delivery available";
    }

    return `Pickup and delivery across ${normalizedCity}`;
}

function personalizeDeliveryCopy(value, city) {
    const base = String(value || "").trim();
    const normalizedCity = String(city || "").trim();

    if (!base) {
        return getContactLocationLabel(normalizedCity);
    }

    if (!normalizedCity) {
        return base
            .replace(/\byour local area\b/gi, "your area")
            .replace(/\byour city\b/gi, "your area");
    }

    return base
        .replace(/\byour local area\b/gi, normalizedCity)
        .replace(/\byour area\b/gi, normalizedCity)
        .replace(/\byour city\b/gi, normalizedCity);
}

function getNoticeHighlight(value) {
    const trimmedValue = String(value || "").trim();
    const match = trimmedValue.match(/(\d+\s*(?:to|-)\s*\d+\s*(?:hours?|days?)|\d+\s*(?:hours?|days?))/i);

    if (!match) {
        return "24 to 48 hrs";
    }

    return match[1].replace(/\s+/g, " ");
}

function getOrderAttentionMeta(order) {
    const daysUntilEvent = daysUntilDate(order.eventDate);
    const hasQuote = order.quotedAmount !== null && order.quotedAmount !== undefined && order.quotedAmount !== "";

    if (["cancelled", "completed"].includes(order.status)) {
        return {
            tone: "resolved",
            label: order.status === "completed" ? "Completed" : "Cancelled",
            priority: 0
        };
    }

    if (daysUntilEvent < 0) {
        return {
            tone: "urgent",
            label: "Past event date",
            priority: 100
        };
    }

    if (daysUntilEvent <= 2) {
        return {
            tone: "urgent",
            label: `Event in ${Math.max(daysUntilEvent, 0)} day${Math.max(daysUntilEvent, 0) === 1 ? "" : "s"}`,
            priority: 95 - Math.max(daysUntilEvent, 0)
        };
    }

    if ((order.status === "new" || order.status === "reviewing") && !hasQuote) {
        return {
            tone: "warning",
            label: "Needs quote",
            priority: order.status === "new" ? 90 : 82
        };
    }

    if (["quoted", "payment_pending", "paid"].includes(order.status)) {
        return {
            tone: "watch",
            label: "Waiting on customer",
            priority: 72
        };
    }

    if (order.status === "scheduled") {
        return {
            tone: "good",
            label: "Scheduled",
            priority: 40
        };
    }

    return {
        tone: "good",
        label: slugLabel(order.status),
        priority: 20
    };
}

function getNeedsAttentionItems() {
    const orderItems = state.orders.map((order) => {
        const attention = getOrderAttentionMeta(order);

        return {
            id: `order-${order.id}`,
            targetId: order.id,
            kind: "order",
            priority: attention.priority,
            tone: attention.tone,
            title: `${order.customerName} · ${getOrderDisplayName(order)}`,
            description: `${attention.label} · ${formatDate(order.eventDate)} · ${slugLabel(order.fulfillmentType)}`,
            actionLabel: "Open order"
        };
    }).filter((item) => item.priority >= 70);

    const productItems = state.products
        .filter((product) => !product.imageUrl || !product.shortDescription)
        .map((product) => ({
            id: `product-${product.id}`,
            targetId: product.id,
            kind: "product",
            priority: 48,
            tone: "warning",
            title: `${product.name} needs cleanup`,
            description: !product.imageUrl
                ? "Missing product image"
                : "Short description should be reviewed",
            actionLabel: "Open product"
        }));

    return [...orderItems, ...productItems]
        .sort((left, right) => right.priority - left.priority)
        .slice(0, 6);
}

function matchesOrderSearch(order, query) {
    if (!query) {
        return true;
    }

    const normalizedQuery = query.toLowerCase();
    const searchableParts = [
        order.id,
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        getOrderDisplayName(order),
        ...getOrderCartItems(order).flatMap((item) => [item.productName, item.flavor, item.sizeLabel, item.addOn, item.itemNotes]),
        order.status,
        order.eventDate
    ];

    return searchableParts.some((part) => String(part || "").toLowerCase().includes(normalizedQuery));
}

function matchesOrderScope(order, scope) {
    const attention = getOrderAttentionMeta(order);
    const daysUntilEvent = daysUntilDate(order.eventDate);
    const hasQuote = order.quotedAmount !== null && order.quotedAmount !== undefined && order.quotedAmount !== "";

    if (scope === "needs_quote") {
        return (order.status === "new" || order.status === "reviewing") && !hasQuote;
    }

    if (scope === "event_this_week") {
        return Number.isFinite(daysUntilEvent) && daysUntilEvent >= 0 && daysUntilEvent <= 7;
    }

    if (scope === "waiting_customer") {
        return attention.tone === "watch";
    }

    return true;
}

function sortOrders(orders) {
    const sortedOrders = [...orders];

    if (state.orderSort === "event_asc") {
        return sortedOrders.sort((left, right) => {
            const leftDays = daysUntilDate(left.eventDate);
            const rightDays = daysUntilDate(right.eventDate);
            return leftDays - rightDays || right.id - left.id;
        });
    }

    if (state.orderSort === "created_desc") {
        return sortedOrders.sort((left, right) => (
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        ));
    }

    return sortedOrders.sort((left, right) => {
        const leftAttention = getOrderAttentionMeta(left);
        const rightAttention = getOrderAttentionMeta(right);
        return rightAttention.priority - leftAttention.priority
            || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}

function syncSelectedOrderIds() {
    const validIds = new Set(state.orders.map((order) => Number(order.id)));
    state.selectedOrderIds = state.selectedOrderIds.filter((orderId) => validIds.has(Number(orderId)));
}

function isOrderSelected(orderId) {
    return state.selectedOrderIds.includes(Number(orderId));
}

function toggleOrderSelection(orderId, selected) {
    const normalizedId = Number(orderId);

    if (!Number.isFinite(normalizedId)) {
        return;
    }

    if (selected && !state.selectedOrderIds.includes(normalizedId)) {
        state.selectedOrderIds = [...state.selectedOrderIds, normalizedId];
        return;
    }

    if (!selected) {
        state.selectedOrderIds = state.selectedOrderIds.filter((value) => value !== normalizedId);
    }
}

function getVisibleSelectedOrderIds() {
    const visibleIds = new Set(getVisibleOrders().map((order) => Number(order.id)));
    return state.selectedOrderIds.filter((orderId) => visibleIds.has(Number(orderId)));
}

function renderOrderBulkActions() {
    syncSelectedOrderIds();
    const visibleOrders = getVisibleOrders();
    const visibleSelectedIds = getVisibleSelectedOrderIds();
    const allVisibleSelected = visibleOrders.length > 0 && visibleSelectedIds.length === visibleOrders.length;

    orderSelectAllVisible.checked = allVisibleSelected;
    orderSelectAllVisible.indeterminate = visibleSelectedIds.length > 0 && !allVisibleSelected;
    orderBulkCount.textContent = visibleSelectedIds.length
        ? `${visibleSelectedIds.length} visible order${visibleSelectedIds.length === 1 ? "" : "s"} selected`
        : "No orders selected";

    const disableBulkActions = visibleSelectedIds.length === 0;
    orderBulkActions.querySelectorAll("[data-bulk-status], #clearOrderSelectionButton").forEach((button) => {
        button.disabled = disableBulkActions;
    });
}

function getProductImagePreviewSource(value) {
    const normalizedValue = String(value || "").trim();

    if (normalizedValue) {
        if (normalizedValue.startsWith("src/")) {
            return `/${normalizedValue}`;
        }

        return normalizedValue;
    }

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#f8d8d3" />
                    <stop offset="100%" stop-color="#fff4ea" />
                </linearGradient>
            </defs>
            <rect width="640" height="480" fill="url(#bg)" />
            <circle cx="320" cy="184" r="84" fill="#fff9f4" opacity="0.92" />
            <path d="M224 296c24-54 64-82 96-82s72 28 96 82v56H224z" fill="#ffffff" opacity="0.86" />
            <text x="320" y="390" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-size="28" fill="#8d6561">Cake photo preview</text>
        </svg>
    `);
}

function getSettingsSpotlightImageMetaText(value) {
    return String(value || "").trim()
        ? "Current spotlight image is ready for the storefront. Upload a new photo or paste another image URL to replace it."
        : "No spotlight image selected yet. Upload from your device or paste a hosted image URL.";
}

function getFeaturedSpotlightDraftFromSettings(settings) {
    return {
        title: String(settings?.featuredSpotlightTitle || "").trim(),
        description: String(settings?.featuredSpotlightDescription || "").trim(),
        imageUrl: String(settings?.featuredSpotlightImageUrl || "").trim(),
        sourceUrl: String(settings?.featuredSpotlightSourceUrl || "").trim()
    };
}

function getHomepageHeroProductSlugs(settings) {
    return [
        String(settings?.heroProductSlug1 || "").trim(),
        String(settings?.heroProductSlug2 || "").trim(),
        String(settings?.heroProductSlug3 || "").trim(),
        String(settings?.heroProductSlug4 || "").trim()
    ];
}

function getHomepageHeroSelectionSummary(settings) {
    const labels = getHomepageHeroProductSlugs(settings)
        .map((slug, index) => {
            if (!slug) {
                return "";
            }

            const product = state.products.find((item) => item.slug === slug);
            return `#${index + 1} ${product?.name || slugLabel(slug)}`;
        })
        .filter(Boolean);

    return labels.length ? labels.join(" / ") : "Automatic showcase";
}

function renderHomepageHeroProductFields(settings) {
    const selectedSlugs = getHomepageHeroProductSlugs(settings);
    const products = [...state.products].sort((left, right) => (
        Number(right.featured) - Number(left.featured)
        || left.name.localeCompare(right.name)
    ));
    const optionsMarkup = [
        `<option value="">Automatic showcase</option>`,
        ...products.map((product) => {
            const suffix = product.featured ? " - Featured" : "";
            return `<option value="${escapeHtml(product.slug)}">${escapeHtml(product.name + suffix)}</option>`;
        })
    ].join("");

    settingsHeroProductFields.forEach((field, index) => {
        if (!field) {
            return;
        }

        field.innerHTML = optionsMarkup;
        field.value = products.some((product) => product.slug === selectedSlugs[index])
            ? selectedSlugs[index]
            : "";
    });
}

function renderHomepageHeroSelectionMeta(settings) {
    if (!settingsHeroSelectionMeta) {
        return;
    }

    const summary = getHomepageHeroSelectionSummary(settings);
    settingsHeroSelectionMeta.textContent = summary === "Automatic showcase"
        ? "Hero uses the automatic showcase order until you choose products here."
        : `Selected hero order: ${summary}`;
}

function hasFeaturedSpotlightContent(spotlight) {
    return Boolean(spotlight.title || spotlight.description || spotlight.imageUrl);
}

function renderProductPreview() {
    const draft = collectProductPayload();
    const previewFlavor = draft.flavors.find(Boolean) || "Flavor option";
    const previewSize = draft.sizes.find((size) => size.label)?.label || "Serving size";

    productPreviewCard.innerHTML = `
        <div class="product-preview-image">
            <img src="${escapeHtml(getProductImagePreviewSource(draft.imageUrl))}" alt="${escapeHtml(draft.name || "Cake preview")}">
            ${draft.badge ? `<span class="badge-chip">${escapeHtml(draft.badge)}</span>` : ""}
        </div>
        <div class="product-preview-content">
            <div class="product-preview-topline">
                <strong>${escapeHtml(draft.name || "New cake concept")}</strong>
                <span class="product-preview-price">${draft.startingPrice ? `From ${escapeHtml(formatCurrency(draft.startingPrice))}` : "Price not set"}</span>
            </div>
            <p>${escapeHtml(draft.shortDescription || "Write a short description to preview how this cake card will look on the storefront.")}</p>
            <div class="catalog-tags">
                <span class="mini-pill">${escapeHtml(statusLabel(draft.availabilityStatus || "available"))}</span>
                <span class="mini-pill">${escapeHtml(previewFlavor)}</span>
                <span class="mini-pill">${escapeHtml(previewSize)}</span>
            </div>
        </div>
    `;
}

function setAuthState(message, type = "info") {
    authStatus.classList.remove("error");
    authStatus.innerHTML = "";

    const icon = document.createElement("i");
    icon.className = type === "error" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-notch fa-spin";

    const text = document.createElement("span");
    text.textContent = message;

    if (type === "error") {
        authStatus.classList.add("error");
    }

    authStatus.append(icon, text);
}

function showLoginForm() {
    authScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");
    loginForm.classList.remove("hidden");
    setAuthState("Your admin session is not active. Log in to continue.");
}

function showDashboard() {
    authScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
}

function setButtonBusy(button, busy, label) {
    button.disabled = busy;
    if (label) {
        const labelNode = button.querySelector("span");
        if (labelNode) {
            labelNode.textContent = label;
        }
    }
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastStack.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3200);
}

function getOrderDraftPayload() {
    const activeOrder = state.orders.find((item) => item.id === state.activeOrderId);

    if (!activeOrder) {
        return null;
    }

    return {
        id: activeOrder.id,
        status: orderStatus.value,
        quotedAmount: orderQuotedAmount.value ? Number(orderQuotedAmount.value) : null,
        internalNote: orderInternalNote.value.trim()
    };
}

function getProductDraftPayload() {
    return {
        activeProductId: state.isCreatingProduct ? null : state.activeProductId,
        isCreatingProduct: state.isCreatingProduct,
        pendingFlavorComposer: flavorComposerInput.value.trim(),
        pendingAddonComposer: addonComposerInput.value.trim(),
        payload: collectProductPayload()
    };
}

function getSettingsDraftPayload() {
    return collectSettingsPayload();
}

function getTestimonialsDraftPayload() {
    return collectTestimonialsPayload();
}

function getFormSnapshot(formKey) {
    if (formKey === "order") {
        return createStableSnapshot(getOrderDraftPayload());
    }

    if (formKey === "product") {
        return createStableSnapshot(getProductDraftPayload());
    }

    if (formKey === "settings") {
        return createStableSnapshot(getSettingsDraftPayload());
    }

    if (formKey === "testimonials") {
        return createStableSnapshot(getTestimonialsDraftPayload());
    }

    return "";
}

function getSaveMetaElement(formKey) {
    return {
        order: orderSaveMeta,
        product: productSaveMeta,
        settings: settingsSaveMeta,
        testimonials: testimonialsSaveMeta
    }[formKey] || null;
}

function getFormLabel(formKey) {
    return {
        order: "order",
        product: "product",
        settings: "settings",
        testimonials: "testimonial"
    }[formKey] || "form";
}

function isFormDirty(formKey) {
    const meta = state.formMeta[formKey];

    if (!meta || !meta.baseline) {
        return false;
    }

    return meta.baseline !== getFormSnapshot(formKey);
}

function setFormBaseline(formKey) {
    state.formMeta[formKey].baseline = getFormSnapshot(formKey);
    updateFormSaveMeta(formKey);
}

function markFormSaved(formKey) {
    state.formMeta[formKey].savedAt = new Date().toISOString();
    setFormBaseline(formKey);
}

function updateFormSaveMeta(formKey) {
    const element = getSaveMetaElement(formKey);

    if (!element) {
        return;
    }

    if (formKey === "order" && !state.activeOrderId) {
        element.textContent = "No order selected yet.";
        element.className = "save-meta";
        return;
    }

    if (formKey === "product" && !state.isCreatingProduct && !state.activeProductId && !state.products.length) {
        element.textContent = "No product changes yet.";
        element.className = "save-meta";
        return;
    }

    const dirty = isFormDirty(formKey);
    element.className = `save-meta ${dirty ? "dirty" : "saved"}`;
    element.textContent = dirty
        ? `Unsaved ${getFormLabel(formKey)} changes.`
        : formatSavedMessage(state.formMeta[formKey].savedAt);
}

function updateAllFormSaveMeta() {
    FORM_KEYS.forEach(updateFormSaveMeta);
}

function getDirtyFormLabels(formKeys = FORM_KEYS) {
    return formKeys.filter((formKey) => isFormDirty(formKey)).map(getFormLabel);
}

function confirmDiscardChanges(actionLabel = "continue", formKeys = FORM_KEYS) {
    const dirtyLabels = getDirtyFormLabels(formKeys);

    if (!dirtyLabels.length) {
        return true;
    }

    const message = dirtyLabels.length === 1
        ? `You have unsaved ${dirtyLabels[0]} changes. Leave them and ${actionLabel}?`
        : `You have unsaved ${dirtyLabels.join(" and ")} changes. Leave them and ${actionLabel}?`;

    return window.confirm(message);
}

async function copyTextToClipboard(text, successMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage, "success");
    } catch {
        showToast("Clipboard access was blocked. Please copy manually.", "error");
    }
}

async function apiRequest(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (!["GET", "HEAD"].includes(method)) {
        headers["X-Admin-Intent"] = "mutate";
    }

    let response;

    try {
        response = await fetch(`${apiBase}${path}`, {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
            credentials: "include"
        });
    } catch {
        throw new Error("The admin API could not be reached. Check the API URL and make sure the Worker allows this frontend origin in CORS_ALLOWED_ORIGINS.");
    }

    const text = await response.text();
    let payload = null;

    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = { ok: false, error: "Invalid response payload", raw: text };
        }
    }

    if (!response.ok) {
        const error = new Error(payload?.error || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

async function checkSession() {
    try {
        const payload = await apiRequest("/admin/auth/session");
        state.session = payload.session;
        sessionChip.innerHTML = `<i class="fa-solid fa-user-shield"></i><span>${escapeHtml(payload.session.email)}</span>`;
        return true;
    } catch (error) {
        state.session = null;
        return false;
    }
}

function buildStats() {
    const counts = {
        new: 0,
        reviewing: 0,
        quoted: 0,
        activeCatalog: 0
    };

    state.orders.forEach((order) => {
        if (order.status === "new") counts.new += 1;
        if (order.status === "reviewing") counts.reviewing += 1;
        if (order.status === "quoted") counts.quoted += 1;
    });

    counts.activeCatalog = state.products.filter((product) => product.availabilityStatus !== "unavailable").length;
    return counts;
}

function getCurrentOrderDraft(order = state.orders.find((item) => item.id === state.activeOrderId)) {
    if (!order) {
        return null;
    }

    if (order.id !== state.activeOrderId) {
        return order;
    }

    return {
        ...order,
        status: orderStatus.value || order.status,
        quotedAmount: orderQuotedAmount.value ? Number(orderQuotedAmount.value) : null,
        internalNote: orderInternalNote.value.trim()
    };
}

function getOrderCartItems(order) {
    return Array.isArray(order?.cartSnapshot?.items) ? order.cartSnapshot.items : [];
}

function getOrderCartItemCount(order) {
    return Number(order?.cartItemCount) || getOrderCartItems(order).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

function getOrderDisplayName(order) {
    const itemCount = getOrderCartItemCount(order);

    if (itemCount > 0) {
        return `Cart inquiry · ${itemCount} item${itemCount === 1 ? "" : "s"}`;
    }

    return order?.productSnapshot?.name || "Custom request";
}

function buildCartSummaryLines(order) {
    const items = getOrderCartItems(order);

    if (!items.length) {
        return [];
    }

    return [
        "Cart items:",
        ...items.map((item, index) => {
            const parts = [
                `${index + 1}. ${item.productName || item.productId || "Cake"}`,
                item.quantity ? `Qty ${item.quantity}` : "",
                item.flavor ? `Flavor: ${item.flavor}` : "",
                item.sizeLabel ? `Size: ${item.sizeLabel}` : "",
                item.addOn ? `Add-on: ${item.addOn}` : "",
                item.itemNotes ? `Note: ${item.itemNotes}` : "",
                item.estimatedLineTotal ? `Starting line: ${formatCurrency(item.estimatedLineTotal)}` : ""
            ].filter(Boolean);

            return parts.join(" | ");
        })
    ];
}

function renderCartSnapshot(order) {
    const items = getOrderCartItems(order);

    if (!items.length) {
        return "";
    }

    return `
        <div class="order-cart-snapshot">
            <div class="order-cart-snapshot__heading">
                <strong>Cart inquiry details</strong>
                <span>${escapeHtml(getOrderCartItemCount(order))} item${getOrderCartItemCount(order) === 1 ? "" : "s"} requested together</span>
            </div>
            <div class="order-cart-lines">
                ${items.map((item, index) => `
                    <article class="order-cart-line">
                        <span class="mini-pill">#${index + 1}</span>
                        <div>
                            <strong>${escapeHtml(item.productName || item.productId || "Cake")}</strong>
                            <p>${escapeHtml([
                                item.quantity ? `Qty ${item.quantity}` : "",
                                item.flavor ? `Flavor: ${item.flavor}` : "",
                                item.sizeLabel ? `Size: ${item.sizeLabel}` : "",
                                item.addOn ? `Add-on: ${item.addOn}` : ""
                            ].filter(Boolean).join(" · ") || "No options shared")}</p>
                            ${item.itemNotes ? `<p class="meta-label">Note: ${escapeHtml(item.itemNotes)}</p>` : ""}
                        </div>
                        <span>${escapeHtml(item.estimatedLineTotal ? formatCurrency(item.estimatedLineTotal) : "Quote")}</span>
                    </article>
                `).join("")}
            </div>
        </div>
    `;
}

function buildOrderSummaryText(order) {
    const draft = getCurrentOrderDraft(order);

    if (!draft) {
        return "";
    }

    return [
        `Inquiry #${draft.id}`,
        `Customer: ${draft.customerName}`,
        `Phone: ${draft.customerPhone}`,
        draft.customerEmail ? `Email: ${draft.customerEmail}` : "",
        `Cake: ${getOrderDisplayName(draft)}`,
        `Status: ${slugLabel(draft.status)}`,
        `Event date: ${formatDate(draft.eventDate)}`,
        `Fulfillment: ${slugLabel(draft.fulfillmentType)}`,
        `Flavor: ${draft.flavor || "Not set"}`,
        `Size: ${draft.sizeLabel || "Not set"}`,
        ...buildCartSummaryLines(draft),
        `Quote: ${draft.quotedAmount ? formatCurrency(draft.quotedAmount) : "Not quoted yet"}`,
        `Notes: ${draft.notes || "No customer notes"}`,
        draft.internalNote ? `Internal note: ${draft.internalNote}` : ""
    ].filter(Boolean).join("\n");
}

function renderOverview() {
    const counts = buildStats();
    overviewStats.innerHTML = [
        {
            label: "New requests",
            value: counts.new,
            note: "Fresh customer inquiries waiting for review"
        },
        {
            label: "Reviewing",
            value: counts.reviewing,
            note: "Orders still being clarified or quoted"
        },
        {
            label: "Quoted",
            value: counts.quoted,
            note: "Customer-ready estimates already shared"
        },
        {
            label: "Active products",
            value: counts.activeCatalog,
            note: "Catalog items currently open for orders"
        }
    ].map((item) => `
        <article class="stats-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <p class="meta-label">${escapeHtml(item.note)}</p>
        </article>
    `).join("");

    if (!state.orders.length) {
        recentOrders.innerHTML = `<div class="detail-empty"><i class="fa-regular fa-envelope-open"></i><p>No order requests yet. Create one from the public inquiry form and it will show up here.</p></div>`;
    } else {
        recentOrders.innerHTML = state.orders.slice(0, 4).map((order) => `
            <article class="stack-item" data-open-order="${order.id}">
                <header>
                    <div>
                        <strong>${escapeHtml(order.customerName)}</strong>
                        <span>${escapeHtml(getOrderDisplayName(order))}</span>
                    </div>
                    <span class="status-pill ${escapeHtml(order.status)}">${escapeHtml(statusLabel(order.status))}</span>
                </header>
                <p>${escapeHtml(order.fulfillmentType)} • ${escapeHtml(formatDate(order.eventDate))}</p>
            </article>
        `).join("");
    }

    if (!state.products.length) {
        productHealth.innerHTML = `<div class="detail-empty"><i class="fa-solid fa-box-open"></i><p>No products loaded yet.</p></div>`;
    } else {
        productHealth.innerHTML = state.products.slice(0, 4).map((product) => `
            <article class="stack-item" data-open-product="${product.id}">
                <header>
                    <div>
                        <strong>${escapeHtml(product.name)}</strong>
                        <span>${escapeHtml(product.category)}</span>
                    </div>
                    <span class="status-pill ${escapeHtml(product.availabilityStatus)}">${escapeHtml(statusLabel(product.availabilityStatus))}</span>
                </header>
                <p>${escapeHtml(formatCurrency(product.startingPrice))} • ${escapeHtml(product.leadTimeHours)} hours lead time</p>
            </article>
        `).join("");
    }

    const attentionItems = getNeedsAttentionItems();

    if (!attentionItems.length) {
        needsAttentionList.innerHTML = `<div class="detail-empty compact-empty"><i class="fa-solid fa-bell-slash"></i><p>No urgent follow-ups right now. The bakery board is caught up.</p></div>`;
        return;
    }

    needsAttentionList.innerHTML = attentionItems.map((item) => `
        <article class="stack-item attention-card attention-${escapeHtml(item.tone)}" data-attention-kind="${item.kind}" data-attention-id="${item.targetId}">
            <header>
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.description)}</span>
                </div>
                <span class="mini-pill">${escapeHtml(item.actionLabel)}</span>
            </header>
        </article>
    `).join("");
}

function getVisibleOrders() {
    const filteredOrders = state.orders.filter((order) => {
        const statusMatch = state.orderFilter === "all" || order.status === state.orderFilter;
        return statusMatch
            && matchesOrderScope(order, state.orderScope)
            && matchesOrderSearch(order, state.orderSearch);
    });

    return sortOrders(filteredOrders);
}

function renderOrderFilters() {
    const filters = ["all", "new", "reviewing", "quoted", "payment_pending", "paid", "scheduled", "completed", "cancelled"];
    orderFilters.innerHTML = filters.map((filter) => `
        <button class="filter-chip ${state.orderFilter === filter ? "active" : ""}" data-order-filter="${filter}" type="button">
            ${escapeHtml(filter === "all" ? "All orders" : statusLabel(filter))}
        </button>
    `).join("");

    orderSearchInput.value = state.orderSearch;
    orderSortSelect.value = state.orderSort;
    orderQuickFilters.querySelectorAll("[data-order-scope]").forEach((button) => {
        button.classList.toggle("active", button.dataset.orderScope === state.orderScope);
    });

    renderOrderBulkActions();
}

function renderOrdersList() {
    syncSelectedOrderIds();
    const orders = getVisibleOrders();
    ordersCountLabel.textContent = `${orders.length} order${orders.length === 1 ? "" : "s"} visible`;

    if (!orders.length) {
        ordersList.innerHTML = `<div class="detail-empty"><i class="fa-regular fa-folder-open"></i><p>No orders match the current filter yet.</p></div>`;
        renderOrderBulkActions();
        return;
    }

    if (!orders.some((order) => order.id === state.activeOrderId)) {
        state.activeOrderId = orders[0].id;
    }

    ordersList.innerHTML = orders.map((order) => `
        <article class="stack-item order-card attention-${escapeHtml(getOrderAttentionMeta(order).tone)} ${state.activeOrderId === order.id ? "active" : ""}" data-order-id="${order.id}">
            <header class="order-card-header">
                <label class="order-select-label" aria-label="Select inquiry ${order.id}">
                    <input class="order-select-toggle" type="checkbox" data-select-order="${order.id}" ${isOrderSelected(order.id) ? "checked" : ""}>
                </label>
                <div>
                    <strong>${escapeHtml(order.customerName)}</strong>
                    <span>${escapeHtml(getOrderDisplayName(order))}</span>
                </div>
                <span class="status-pill ${escapeHtml(order.status)}">${escapeHtml(statusLabel(order.status))}</span>
            </header>
            <div class="order-card-copy">
                <p>${escapeHtml(order.customerPhone)}</p>
                <span class="attention-note attention-${escapeHtml(getOrderAttentionMeta(order).tone)}">${escapeHtml(getOrderAttentionMeta(order).label)}</span>
            </div>
            <footer>
                <span class="mini-pill">${escapeHtml(formatDate(order.eventDate))}</span>
                <span class="mini-pill">${escapeHtml(order.fulfillmentType)}</span>
                <span class="mini-pill">${escapeHtml(order.sizeLabel || "No size")}</span>
                <span class="mini-pill quote-pill ${order.quotedAmount ? "has-quote" : "missing-quote"}">${escapeHtml(order.quotedAmount ? formatCurrency(order.quotedAmount) : "No quote yet")}</span>
            </footer>
        </article>
    `).join("");

    renderOrderBulkActions();
}

function renderOrderDetail() {
    const order = state.orders.find((item) => item.id === state.activeOrderId);

    if (!order) {
        orderEmptyState.classList.remove("hidden");
        orderForm.classList.add("hidden");
        renderReplyTemplatePreview();
        return;
    }

    orderEmptyState.classList.add("hidden");
    orderForm.classList.remove("hidden");

    orderSummary.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <strong>Customer</strong>
                <span>${escapeHtml(order.customerName)} • ${escapeHtml(order.customerPhone)}</span>
            </div>
            <div class="summary-card">
                <strong>Product</strong>
                <span>${escapeHtml(getOrderDisplayName(order))}</span>
            </div>
            <div class="summary-card">
                <strong>Event date</strong>
                <span>${escapeHtml(formatDate(order.eventDate))}</span>
            </div>
            <div class="summary-card">
                <strong>Fulfillment</strong>
                <span>${escapeHtml(order.fulfillmentType)}</span>
            </div>
            <div class="summary-card">
                <strong>Selection</strong>
                <span>${escapeHtml(order.flavor || "No flavor")} • ${escapeHtml(order.sizeLabel || "No size")}</span>
            </div>
            <div class="summary-card">
                <strong>Customer notes</strong>
                <span>${escapeHtml(order.notes || "No customer notes")}</span>
            </div>
            <div class="summary-card">
                <strong>Last updated</strong>
                <span>${escapeHtml(formatDateTime(order.updatedAt || order.createdAt))}</span>
            </div>
            <div class="summary-card">
                <strong>Reply status</strong>
                <span>${escapeHtml(getOrderAttentionMeta(order).label)}</span>
            </div>
        </div>
        ${renderCartSnapshot(order)}
    `;

    orderStatus.innerHTML = ORDER_STATUSES.map((status) => `
        <option value="${status}" ${order.status === status ? "selected" : ""}>${escapeHtml(statusLabel(status))}</option>
    `).join("");
    orderQuotedAmount.value = order.quotedAmount ?? "";
    orderInternalNote.value = order.internalNote ?? "";
    state.activeReplyTemplate = getSuggestedReplyTemplate(order);
    renderReplyTemplatePreview();
    setFormBaseline("order");
}

function createListInput(type, values = {}) {
    if (type !== "size") {
        return document.createElement("div");
    }

    const row = document.createElement("div");
    row.className = "dynamic-row size-row";
    row.innerHTML = `
        <div class="size-row-fields">
            <label>
                <span>Label</span>
                <input type="text" data-size-label placeholder="1 kg" value="${escapeHtml(values.label || "")}">
            </label>
            <label>
                <span>Servings</span>
                <input type="text" data-size-servings placeholder="Serves 8-10" value="${escapeHtml(values.servings || "")}">
            </label>
            <label>
                <span>Starting price</span>
                <input type="number" data-size-price min="1" step="1" placeholder="Price" value="${escapeHtml(values.price ?? "")}">
            </label>
        </div>
        <div class="size-row-actions">
            <button class="btn btn-secondary ghost size-inline-button" type="button" data-duplicate-size>
                <i class="fa-regular fa-copy"></i>
                <span>Duplicate</span>
            </button>
            <button class="icon-button" type="button" data-remove-row aria-label="Remove size option"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    return row;
}

function parseOptionComposerValues(rawValue) {
    return String(rawValue || "")
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);
}

function dedupeOptionValues(values) {
    const seen = new Set();
    return values.filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function getOptionContainer(type) {
    return type === "flavor" ? flavorList : addonList;
}

function getOptionComposer(type) {
    return type === "flavor" ? flavorComposerInput : addonComposerInput;
}

function createOptionChip(type, value) {
    const chip = document.createElement("div");
    chip.className = `option-chip ${type}-chip`;
    chip.dataset.optionChip = type;
    chip.dataset.optionValue = value;
    chip.innerHTML = `
        <span>${escapeHtml(value)}</span>
        <button class="icon-button chip-remove-button" type="button" data-remove-chip aria-label="Remove ${escapeHtml(value)}">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    return chip;
}

function renderOptionList(type, items) {
    const container = getOptionContainer(type);
    const options = dedupeOptionValues(items);
    container.innerHTML = "";

    if (!options.length) {
        container.innerHTML = `
            <div class="empty-chip-state">
                <i class="fa-regular fa-lightbulb"></i>
                <p>${type === "flavor" ? "Add flavors customers can pick from." : "Add extras customers often request with this cake."}</p>
            </div>
        `;
        return;
    }

    options.forEach((value) => {
        container.appendChild(createOptionChip(type, value));
    });
}

function getOptionValues(type) {
    return Array.from(getOptionContainer(type).querySelectorAll("[data-option-value]"))
        .map((chip) => chip.dataset.optionValue || "")
        .filter(Boolean);
}

function applyOptionValues(type, values, { clearComposer = false, focusComposer = false } = {}) {
    renderOptionList(type, values);

    if (clearComposer) {
        const composer = getOptionComposer(type);
        if (composer) {
            composer.value = "";
        }
    }

    updateFormSaveMeta("product");
    renderProductPreview();

    if (focusComposer) {
        getOptionComposer(type)?.focus();
    }
}

function handleOptionComposerAdd(type, rawValue) {
    const parsedValues = parseOptionComposerValues(rawValue);
    if (!parsedValues.length) {
        getOptionComposer(type)?.focus();
        return;
    }

    applyOptionValues(type, [...getOptionValues(type), ...parsedValues], {
        clearComposer: true,
        focusComposer: true
    });
}

function extractSizeRowValue(row) {
    return {
        label: row.querySelector("[data-size-label]")?.value.trim() || "",
        servings: row.querySelector("[data-size-servings]")?.value.trim() || "",
        price: Number(row.querySelector("[data-size-price]")?.value || 0)
    };
}

function renderSizeList(items) {
    sizeList.innerHTML = "";

    if (!items.length) {
        sizeList.innerHTML = `
            <div class="empty-chip-state size-empty-state">
                <i class="fa-solid fa-ruler-combined"></i>
                <p>Add at least one serving option so inquiries can start from a clear size.</p>
            </div>
        `;
        return;
    }

    items.forEach((item) => {
        sizeList.appendChild(createListInput("size", item));
    });
}

function addSizeOption(values = {}, { focus = true, afterRow = null } = {}) {
    const sizeRow = createListInput("size", values);
    const emptyState = sizeList.querySelector(".size-empty-state");
    if (emptyState) {
        emptyState.remove();
    }

    if (afterRow) {
        afterRow.insertAdjacentElement("afterend", sizeRow);
    } else {
        sizeList.appendChild(sizeRow);
    }

    updateFormSaveMeta("product");
    renderProductPreview();

    if (focus) {
        sizeRow.querySelector("[data-size-label]")?.focus();
    }
}

function createTestimonialInput(values = {}) {
    const row = document.createElement("div");
    row.className = "dynamic-row testimonial-row";
    row.innerHTML = `
        <label>
            <span>Customer name</span>
            <input type="text" data-testimonial-name placeholder="Riya S." value="${escapeHtml(values.customerName || "")}">
        </label>
        <label>
            <span>Occasion label</span>
            <input type="text" data-testimonial-occasion placeholder="Birthday order" value="${escapeHtml(values.occasionLabel || "")}">
        </label>
        <label>
            <span>Rating</span>
            <select data-testimonial-rating>
                ${[5, 4, 3, 2, 1].map((rating) => `
                    <option value="${rating}" ${Number(values.rating || 5) === rating ? "selected" : ""}>${rating} star${rating === 1 ? "" : "s"}</option>
                `).join("")}
            </select>
        </label>
        <label class="testimonial-publish">
            <input type="checkbox" data-testimonial-published ${values.isPublished !== false ? "checked" : ""}>
            <span>Published</span>
        </label>
        <button class="icon-button" type="button" data-remove-testimonial><i class="fa-solid fa-trash"></i></button>
        <label class="testimonial-quote">
            <span>Quote</span>
            <textarea data-testimonial-quote rows="4" placeholder="Share the customer quote exactly as you want it on the storefront.">${escapeHtml(values.quoteText || "")}</textarea>
        </label>
    `;

    return row;
}

function fillDynamicList(container, type, items) {
    if (type === "size") {
        renderSizeList(items);
        return;
    }

    renderOptionList(type, items);
}

function getDefaultProductDraft() {
    return {
        name: "",
        slug: "",
        category: "",
        shortDescription: "",
        startingPrice: 3200,
        badge: "",
        leadTimeHours: 24,
        availabilityStatus: PRODUCT_AVAILABILITY[0],
        featured: false,
        imageUrl: "",
        options: {
            flavors: [""],
            sizes: [{ label: "", servings: "", price: "" }],
            addOns: [""]
        }
    };
}

function createDuplicateProductDraft(product) {
    const duplicatedName = `${product.name} Copy`;
    return {
        ...product,
        id: null,
        name: duplicatedName,
        slug: getUniqueProductSlug(generateSlug(duplicatedName), product.id),
        badge: product.badge || "",
        featured: false,
        options: {
            flavors: [...(product.options?.flavors || [""])],
            sizes: [...(product.options?.sizes || [{ label: "", servings: "", price: "" }])].map((size) => ({ ...size })),
            addOns: [...(product.options?.addOns || [""])]
        }
    };
}

function syncProductSlugFromName() {
    if (productSlug.dataset.userModified === "true") {
        return;
    }

    const excludedProductId = state.isCreatingProduct ? null : state.activeProductId;
    productSlug.value = getUniqueProductSlug(productName.value, excludedProductId);
}

function setProductSlugMode(product, userModified) {
    productSlug.dataset.userModified = userModified ? "true" : "false";
    productSlug.dataset.initialValue = product.slug || "";
}

function estimateDataUrlBytes(dataUrl) {
    const encoded = String(dataUrl || "").split(",", 2)[1] || "";
    return Math.floor((encoded.length * 3) / 4);
}

function loadImageElement(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The selected image could not be processed."));
        image.src = source;
    });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("The selected image could not be read."));
        reader.readAsDataURL(file);
    });
}

async function compressProductImage(file) {
    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImageElement(originalDataUrl);

    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    const longestEdge = Math.max(width, height);

    if (longestEdge > PRODUCT_IMAGE_MAX_DIMENSION) {
        const scale = PRODUCT_IMAGE_MAX_DIMENSION / longestEdge;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Image processing is not available in this browser.");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    let quality = 0.88;
    let currentWidth = width;
    let currentHeight = height;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    while (estimateDataUrlBytes(dataUrl) > PRODUCT_IMAGE_UPLOAD_MAX_BYTES && quality > 0.45) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    while (estimateDataUrlBytes(dataUrl) > PRODUCT_IMAGE_UPLOAD_MAX_BYTES && currentWidth > 720) {
        currentWidth = Math.round(currentWidth * 0.88);
        currentHeight = Math.round(currentHeight * 0.88);
        canvas.width = currentWidth;
        canvas.height = currentHeight;
        context.clearRect(0, 0, currentWidth, currentHeight);
        context.drawImage(image, 0, 0, currentWidth, currentHeight);
        dataUrl = canvas.toDataURL("image/jpeg", Math.max(quality, 0.5));
    }

    if (estimateDataUrlBytes(dataUrl) > PRODUCT_IMAGE_UPLOAD_MAX_BYTES) {
        throw new Error("This photo is still too large after compression. Try a smaller image.");
    }

    return {
        dataUrl,
        width: currentWidth,
        height: currentHeight,
        bytes: estimateDataUrlBytes(dataUrl)
    };
}

function renderProductsGrid() {
    if (!state.products.length) {
        productsGrid.innerHTML = `<div class="detail-empty"><i class="fa-solid fa-box-open"></i><p>No products available yet. Use the editor to create your first catalog item.</p></div>`;
        return;
    }

    productsGrid.innerHTML = state.products.map((product) => `
        <article class="product-card ${state.activeProductId === product.id && !state.isCreatingProduct ? "active" : ""}" data-product-id="${product.id}">
            <header>
                <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <span>${escapeHtml(product.category)}</span>
                </div>
                <span class="status-pill ${escapeHtml(product.availabilityStatus)}">${escapeHtml(statusLabel(product.availabilityStatus))}</span>
            </header>
            <p>${escapeHtml(product.shortDescription)}</p>
            <div class="catalog-tags">
                <span class="mini-pill">${escapeHtml(formatCurrency(product.startingPrice))}</span>
                <span class="mini-pill">${escapeHtml(product.leadTimeHours)} hrs</span>
                <span class="mini-pill">${product.featured ? "Featured" : "Standard"}</span>
            </div>
        </article>
    `).join("");
}

function fillProductForm(product) {
    productName.value = product.name || "";
    productSlug.value = product.slug || "";
    productCategory.value = product.category || "";
    productBadge.value = product.badge || "";
    productDescription.value = product.shortDescription || "";
    productStartingPrice.value = product.startingPrice || "";
    productLeadTime.value = product.leadTimeHours || "";
    productAvailability.value = product.availabilityStatus || PRODUCT_AVAILABILITY[0];
    productImageUrl.value = product.imageUrl || "";
    productFeatured.checked = Boolean(product.featured);
    productImageFile.value = "";
    productImageMeta.textContent = product.imageUrl
        ? "This product currently has a saved image. Uploading a new one will replace it."
        : "Photos are resized in the browser for faster loading before they are saved with the product.";
    flavorComposerInput.value = "";
    addonComposerInput.value = "";
    fillDynamicList(flavorList, "flavor", product.options?.flavors || []);
    fillDynamicList(sizeList, "size", product.options?.sizes || []);
    fillDynamicList(addonList, "addon", product.options?.addOns || []);
    renderProductPreview();
}

function renderProductEditor() {
    let product;

    if (state.isCreatingProduct) {
        product = state.productDraft || getDefaultProductDraft();
        productEditorLabel.textContent = product.name
            ? `Drafting ${product.name}`
            : "Creating a new product";
        duplicateProductButton.disabled = true;
    } else {
        product = state.products.find((item) => item.id === state.activeProductId) || state.products[0] || getDefaultProductDraft();
        state.activeProductId = product.id || null;
        productEditorLabel.textContent = product.id ? `Editing ${product.name}` : "Select a product or create a new one";
        duplicateProductButton.disabled = !product.id;
    }

    fillProductForm(product);
    setProductSlugMode(product, !state.isCreatingProduct);
    setFormBaseline("product");
}

function serializeDynamicValues() {
    const flavors = getOptionValues("flavor");
    const addOns = getOptionValues("addon");

    const sizes = Array.from(sizeList.querySelectorAll('.size-row'))
        .map((row) => extractSizeRowValue(row))
        .filter((size) => size.label || size.servings || size.price);

    return { flavors, addOns, sizes };
}

function collectProductPayload() {
    const lists = serializeDynamicValues();

    return {
        name: productName.value.trim(),
        slug: productSlug.value.trim(),
        category: productCategory.value.trim(),
        shortDescription: productDescription.value.trim(),
        startingPrice: Number(productStartingPrice.value),
        badge: productBadge.value.trim(),
        leadTimeHours: Number(productLeadTime.value),
        availabilityStatus: productAvailability.value,
        featured: productFeatured.checked,
        imageUrl: productImageUrl.value.trim(),
        flavors: lists.flavors,
        sizes: lists.sizes,
        addOns: lists.addOns
    };
}

function fillSettingsForm(settings) {
    settingsBrandName.value = settings?.brandName || "";
    settingsCity.value = settings?.city || "";
    settingsContactPhone.value = settings?.contactPhone || "";
    settingsContactEmail.value = settings?.contactEmail || "";
    settingsAddressLine1.value = settings?.addressLine1 || "";
    settingsAddressLine2.value = settings?.addressLine2 || "";
    settingsStateRegion.value = settings?.stateRegion || "";
    settingsPostalCode.value = settings?.postalCode || "";
    settingsCountryCode.value = settings?.countryCode || "IN";
    settingsInstagramHandle.value = settings?.instagramHandle || "";
    settingsInquiryChannel.value = settings?.inquiryChannel || "website";
    settingsCurrency.value = settings?.currency || "INR";
    settingsPaymentMode.value = settings?.paymentMode === "manual_quote"
        ? "Manual quote follow-up"
        : (settings?.paymentMode || "Manual quote follow-up");
    settingsDeliveryPickupCopy.value = settings?.deliveryPickupCopy || "";
    settingsNoticePeriodCopy.value = settings?.noticePeriodCopy || "";
    settingsBakeryIntroTitle.value = settings?.bakeryIntroTitle || "";
    settingsBakeryIntroParagraph1.value = settings?.bakeryIntroParagraph1 || "";
    settingsBakeryIntroParagraph2.value = settings?.bakeryIntroParagraph2 || "";
    settingsResponseTimeCopy.value = settings?.responseTimeCopy || "";
    renderHomepageHeroProductFields(settings);
    renderHomepageHeroSelectionMeta(settings);
    settingsSpotlightTitle.value = settings?.featuredSpotlightTitle || "";
    settingsSpotlightDescription.value = settings?.featuredSpotlightDescription || "";
    settingsSpotlightImageUrl.value = settings?.featuredSpotlightImageUrl || "";
    settingsSpotlightSourceUrl.value = settings?.featuredSpotlightSourceUrl || "";
    settingsSpotlightImageMeta.textContent = getSettingsSpotlightImageMetaText(settings?.featuredSpotlightImageUrl);
    settingsSpotlightImageFile.value = "";
    settingsWeekdayOpenTime.value = settings?.weekdayOpenTime || "";
    settingsWeekdayCloseTime.value = settings?.weekdayCloseTime || "";
    settingsSaturdayOpenTime.value = settings?.saturdayOpenTime || "";
    settingsSaturdayCloseTime.value = settings?.saturdayCloseTime || "";
    settingsSundayOpenTime.value = settings?.sundayOpenTime || "";
    settingsSundayCloseTime.value = settings?.sundayCloseTime || "";
}

function renderTestimonialsEditor() {
    testimonialList.innerHTML = "";

    if (!Array.isArray(state.testimonials) || !state.testimonials.length) {
        testimonialList.appendChild(createTestimonialInput());
        renderTestimonialsPreview();
        setFormBaseline("testimonials");
        return;
    }

    state.testimonials.forEach((testimonial) => {
        testimonialList.appendChild(createTestimonialInput(testimonial));
    });

    renderTestimonialsPreview();
    setFormBaseline("testimonials");
}

function renderSettingsSummary() {
    const settings = state.settings;
    const spotlight = getFeaturedSpotlightDraftFromSettings(settings);

    if (!settings) {
        settingsSummary.innerHTML = `
            <div class="summary-card">
                <strong>Settings unavailable</strong>
                <span>Unable to load business settings right now.</span>
            </div>
        `;
        return;
    }

    settingsSummary.innerHTML = [
        {
            label: "Brand",
            value: settings.brandName || "Not set"
        },
        {
            label: "Phone",
            value: settings.contactPhone || "Not set"
        },
        {
            label: "Email",
            value: settings.contactEmail || "Not set"
        },
        {
            label: "Instagram",
            value: settings.instagramHandle || "Not set"
        },
        {
            label: "City",
            value: settings.city || "Not set"
        },
        {
            label: "Address",
            value: [settings.addressLine1, settings.addressLine2, settings.city, settings.stateRegion, settings.postalCode]
                .filter(Boolean)
                .join(", ") || "Not set"
        },
        {
            label: "Country",
            value: settings.countryCode || "Not set"
        },
        {
            label: "Inquiry channel",
            value: statusLabel(settings.inquiryChannel || "website")
        },
        {
            label: "Delivery / pickup copy",
            value: settings.deliveryPickupCopy || "Not set"
        },
        {
            label: "Notice copy",
            value: settings.noticePeriodCopy || "Not set"
        },
        {
            label: "About intro",
            value: settings.bakeryIntroTitle || "Not set"
        },
        {
            label: "Response-time copy",
            value: settings.responseTimeCopy || "Not set"
        },
        {
            label: "Homepage hero",
            value: getHomepageHeroSelectionSummary(settings)
        },
        {
            label: "Featured spotlight",
            value: hasFeaturedSpotlightContent(spotlight)
                ? (spotlight.title || "Configured")
                : "Hidden"
        },
        {
            label: "Weekday hours",
            value: settings.weekdayOpenTime && settings.weekdayCloseTime
                ? `${settings.weekdayOpenTime} to ${settings.weekdayCloseTime}`
                : "Not set"
        },
        {
            label: "Saturday hours",
            value: settings.saturdayOpenTime && settings.saturdayCloseTime
                ? `${settings.saturdayOpenTime} to ${settings.saturdayCloseTime}`
                : "Closed or not set"
        },
        {
            label: "Sunday hours",
            value: settings.sundayOpenTime && settings.sundayCloseTime
                ? `${settings.sundayOpenTime} to ${settings.sundayCloseTime}`
                : "Closed or not set"
        }
    ].map((item) => `
        <div class="summary-card">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.value)}</span>
        </div>
    `).join("");
}

function renderSettingsPreview() {
    const settings = collectSettingsPayload();
    const city = String(settings.city || "").trim();
    const deliveryCopy = personalizeDeliveryCopy(settings.deliveryPickupCopy, city);
    const spotlight = getFeaturedSpotlightDraftFromSettings(settings);
    const spotlightSourceUrl = normalizeAbsoluteUrl(spotlight.sourceUrl);
    const spotlightImageUrl = getProductImagePreviewSource(spotlight.imageUrl);
    const spotlightTitle = spotlight.title || "Featured cake spotlight";
    const spotlightDescription = spotlight.description || "Add a featured cake photo and copy here to spotlight one special design above the signature cake grid.";

    renderHomepageHeroSelectionMeta(settings);
    settingsPreviewHeroTitle.textContent = settings.brandName || "Pink Delight Cakes";
    settingsPreviewHeroCity.textContent = getHeroCityLabel(city);
    settingsPreviewDelivery.textContent = deliveryCopy || "Pickup is scheduled by confirmation time, and nearby delivery can be arranged for select orders.";
    settingsPreviewNotice.textContent = getNoticeHighlight(settings.noticePeriodCopy);
    settingsPreviewIntroTitle.textContent = settings.bakeryIntroTitle || "Baked from home, designed with care, and made for real celebrations.";
    settingsPreviewIntroOne.textContent = settings.bakeryIntroParagraph1 || "Share how the bakery started and what makes it personal.";
    settingsPreviewIntroTwo.textContent = settings.bakeryIntroParagraph2 || "Share what customers can expect from your cakes and service.";
    settingsPreviewPhone.textContent = settings.contactPhone || "+91 87678 12121";
    settingsPreviewEmail.textContent = settings.contactEmail || "hello@pinkdelightcakes.com";
    settingsPreviewLocation.textContent = deliveryCopy || getContactLocationLabel(city);
    settingsPreviewResponse.textContent = settings.responseTimeCopy || "We usually reply with design options and pricing within 2 hours during bakery hours.";

    if (!hasFeaturedSpotlightContent(spotlight)) {
        settingsPreviewSpotlight.innerHTML = `
            <span class="empty-preview-label">Spotlight hidden</span>
            <strong>No featured cake spotlight is published right now.</strong>
            <p>Add a title, description, and photo to show a featured design card above the signature cakes.</p>
            <span>Leaving all spotlight fields empty keeps this section off the storefront.</span>
        `;
        settingsPreviewSpotlight.classList.add("empty-preview");
        return;
    }

    settingsPreviewSpotlight.classList.remove("empty-preview");
    settingsPreviewSpotlight.innerHTML = `
        <div class="settings-spotlight-preview-media">
            <img src="${escapeHtml(spotlightImageUrl)}" alt="${escapeHtml(spotlightTitle)}">
        </div>
        <div class="settings-spotlight-preview-content">
            <span class="eyebrow">Featured spotlight</span>
            <strong>${escapeHtml(spotlightTitle)}</strong>
            <p>${escapeHtml(spotlightDescription)}</p>
            <div class="settings-spotlight-preview-actions">
                <span class="preview-highlight">Ask about this design</span>
                ${spotlightSourceUrl ? `<a class="preview-link" href="${escapeHtml(spotlightSourceUrl)}" target="_blank" rel="noreferrer">View source link</a>` : ""}
            </div>
        </div>
    `;
}

function renderTestimonialsPreview() {
    const testimonials = collectTestimonialsPayload().filter((testimonial) => testimonial.isPublished);

    if (!testimonials.length) {
        testimonialsPreviewGrid.innerHTML = `
            <article class="testimonial-preview-card empty-preview">
                <span class="empty-preview-label">No published reviews yet</span>
                <strong>${escapeHtml(settingsBrandName.value.trim() || "Pink Delight Cakes")}</strong>
                <p>Publish verified customer feedback here when you are ready for the storefront.</p>
                <span>This preview stays neutral until a real review is marked public.</span>
            </article>
        `;
        return;
    }

    testimonialsPreviewGrid.innerHTML = testimonials.map((testimonial) => `
        <article class="testimonial-preview-card">
            <div class="stars">${createStarsMarkup(testimonial.rating)}</div>
            <p>"${escapeHtml(testimonial.quoteText || "")}"</p>
            <strong>${escapeHtml(testimonial.customerName || "Happy customer")}</strong>
            <span>${escapeHtml(testimonial.occasionLabel || "Celebration order")}</span>
        </article>
    `).join("");
}

function renderSettings() {
    fillSettingsForm(state.settings);
    renderSettingsSummary();
    renderSettingsPreview();
    setFormBaseline("settings");
    renderTestimonialsEditor();
}

function collectSettingsPayload() {
    return {
        brandName: settingsBrandName.value.trim(),
        city: settingsCity.value.trim(),
        contactPhone: settingsContactPhone.value.trim(),
        contactEmail: settingsContactEmail.value.trim(),
        addressLine1: settingsAddressLine1.value.trim(),
        addressLine2: settingsAddressLine2.value.trim(),
        stateRegion: settingsStateRegion.value.trim(),
        postalCode: settingsPostalCode.value.trim(),
        countryCode: settingsCountryCode.value.trim().toUpperCase(),
        instagramHandle: settingsInstagramHandle.value.trim(),
        inquiryChannel: settingsInquiryChannel.value,
        currency: settingsCurrency.value,
        deliveryPickupCopy: settingsDeliveryPickupCopy.value.trim(),
        noticePeriodCopy: settingsNoticePeriodCopy.value.trim(),
        bakeryIntroTitle: settingsBakeryIntroTitle.value.trim(),
        bakeryIntroParagraph1: settingsBakeryIntroParagraph1.value.trim(),
        bakeryIntroParagraph2: settingsBakeryIntroParagraph2.value.trim(),
        responseTimeCopy: settingsResponseTimeCopy.value.trim(),
        heroProductSlug1: settingsHeroProduct1.value.trim(),
        heroProductSlug2: settingsHeroProduct2.value.trim(),
        heroProductSlug3: settingsHeroProduct3.value.trim(),
        heroProductSlug4: settingsHeroProduct4.value.trim(),
        featuredSpotlightTitle: settingsSpotlightTitle.value.trim(),
        featuredSpotlightDescription: settingsSpotlightDescription.value.trim(),
        featuredSpotlightImageUrl: settingsSpotlightImageUrl.value.trim(),
        featuredSpotlightSourceUrl: settingsSpotlightSourceUrl.value.trim(),
        weekdayOpenTime: settingsWeekdayOpenTime.value,
        weekdayCloseTime: settingsWeekdayCloseTime.value,
        saturdayOpenTime: settingsSaturdayOpenTime.value,
        saturdayCloseTime: settingsSaturdayCloseTime.value,
        sundayOpenTime: settingsSundayOpenTime.value,
        sundayCloseTime: settingsSundayCloseTime.value
    };
}

function collectTestimonialsPayload() {
    return Array.from(testimonialList.querySelectorAll(".testimonial-row"))
        .map((row) => ({
            customerName: row.querySelector("[data-testimonial-name]")?.value.trim() || "",
            occasionLabel: row.querySelector("[data-testimonial-occasion]")?.value.trim() || "",
            quoteText: row.querySelector("[data-testimonial-quote]")?.value.trim() || "",
            rating: Number(row.querySelector("[data-testimonial-rating]")?.value || 5),
            isPublished: Boolean(row.querySelector("[data-testimonial-published]")?.checked)
        }))
        .filter((testimonial) => (
            testimonial.customerName ||
            testimonial.occasionLabel ||
            testimonial.quoteText
        ));
}

function renderAll() {
    renderOverview();
    renderOrderFilters();
    renderOrdersList();
    renderOrderDetail();
    renderProductsGrid();
    renderProductEditor();
    renderSettings();
    updateAllFormSaveMeta();
}

function setView(view) {
    state.activeView = view;
    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.viewPanel === view);
    });
    document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === view);
    });
    window.location.hash = view;
    sidebar.classList.remove("open");
}

async function loadOrders() {
    const payload = await apiRequest("/admin/orders");
    state.orders = payload.orders || [];
}

async function loadProducts() {
    const payload = await apiRequest("/admin/products");
    state.products = payload.products || [];
}

async function loadSettings() {
    const payload = await apiRequest("/admin/settings");
    state.settings = payload.settings || null;
}

async function loadTestimonials() {
    const payload = await apiRequest("/admin/testimonials");
    state.testimonials = payload.testimonials || [];
}

async function refreshDashboardData() {
    await Promise.all([loadOrders(), loadProducts(), loadSettings(), loadTestimonials()]);
    renderAll();
}

async function handleLogin(event) {
    event.preventDefault();

    setButtonBusy(loginButton, true, "Logging in...");

    try {
        await apiRequest("/admin/auth/login", {
            method: "POST",
            body: {
                email: loginEmail.value.trim(),
                password: loginPassword.value
            }
        });

        const sessionOk = await checkSession();

        if (!sessionOk) {
            throw new Error("Login succeeded, but the secure admin cookie did not become active. Use the same-site /admin/ dashboard and /api/ proxy path for this environment.");
        }

        await refreshDashboardData();
        showDashboard();
        setView(window.location.hash.replace("#", "") || "orders");
        showToast("Logged in to the admin dashboard.", "success");
        loginPassword.value = "";
    } catch (error) {
        setAuthState(error.message || "Unable to log in right now.", "error");
        showToast(error.message || "Login failed.", "error");
    } finally {
        setButtonBusy(loginButton, false, "Log in to dashboard");
    }
}

async function handleLogout() {
    if (!confirmDiscardChanges("log out")) {
        return;
    }

    setButtonBusy(logoutButton, true, "Logging out...");

    try {
        await apiRequest("/admin/auth/logout", { method: "POST" });
    } catch {
        // Even if logout fails, reset the local dashboard state.
    }

    state.session = null;
    state.orders = [];
    state.products = [];
    state.settings = null;
    state.activeOrderId = null;
    state.activeProductId = null;
    state.selectedOrderIds = [];
    state.isCreatingProduct = false;
    showLoginForm();
    showToast("Admin session closed.", "info");
    setButtonBusy(logoutButton, false, "Log out");
}

async function saveOrderPatch(patch, options = {}) {
    const orderId = state.activeOrderId;
    if (!orderId) {
        return;
    }

    const nextPatch = {
        status: patch.status ?? orderStatus.value,
        quotedAmount: patch.quotedAmount ?? (orderQuotedAmount.value ? Number(orderQuotedAmount.value) : null),
        internalNote: patch.internalNote ?? orderInternalNote.value.trim()
    };

    if (nextPatch.status === "quoted" && (nextPatch.quotedAmount === null || Number.isNaN(nextPatch.quotedAmount))) {
        showToast("Add the quoted amount before marking this order as quoted.", "error");
        return;
    }

    const actionButton = options.button || orderSaveButton;
    const busyLabel = options.busyLabel || "Saving update...";
    const defaultLabel = options.defaultLabel || "Save order update";
    setButtonBusy(actionButton, true, busyLabel);

    try {
        const payload = await apiRequest(`/admin/orders/${orderId}`, {
            method: "PATCH",
            body: nextPatch
        });

        state.orders = state.orders.map((order) => (order.id === orderId ? payload.order : order));
        renderOverview();
        renderOrdersList();
        renderOrderDetail();
        markFormSaved("order");
        showToast(options.successMessage || "Order updated successfully.", "success");
    } catch (error) {
        showToast(error.message || "Unable to update the order.", "error");
    } finally {
        setButtonBusy(actionButton, false, defaultLabel);
    }
}

async function handleOrderSave(event) {
    event.preventDefault();
    await saveOrderPatch({});
}

async function handleOrderQuickAction(statusValue, button) {
    await saveOrderPatch({
        status: statusValue
    }, {
        button,
        busyLabel: `${statusLabel(statusValue)}...`,
        defaultLabel: button.querySelector("span")?.textContent || statusLabel(statusValue),
        successMessage: `Order marked ${statusLabel(statusValue).toLowerCase()}.`
    });
}

async function handleBulkOrderAction(statusValue, button) {
    const selectedIds = getVisibleSelectedOrderIds();

    if (!selectedIds.length) {
        showToast("Select at least one visible order first.", "error");
        return;
    }

    if (!confirmDiscardChanges("apply a bulk order update")) {
        return;
    }

    setButtonBusy(button, true, `${statusLabel(statusValue)}...`);
    orderBulkActions.querySelectorAll("[data-bulk-status], #clearOrderSelectionButton, #orderSelectAllVisible").forEach((element) => {
        element.disabled = true;
    });

    try {
        for (const orderId of selectedIds) {
            await apiRequest(`/admin/orders/${orderId}`, {
                method: "PATCH",
                body: { status: statusValue }
            });
        }

        await loadOrders();
        state.selectedOrderIds = [];
        renderOverview();
        renderOrdersList();
        renderOrderDetail();
        showToast(`${selectedIds.length} order${selectedIds.length === 1 ? "" : "s"} marked ${statusLabel(statusValue).toLowerCase()}.`, "success");
    } catch (error) {
        showToast(error.message || "Unable to apply the bulk order update.", "error");
    } finally {
        setButtonBusy(button, false, button.dataset.defaultLabel || button.querySelector("span")?.textContent || statusLabel(statusValue));
        renderOrderBulkActions();
    }
}

function getOrderCustomerPhone(order) {
    return order?.customerPhone || "";
}

function getReplyTemplateMeta(templateKey = state.activeReplyTemplate) {
    return ORDER_REPLY_TEMPLATE_OPTIONS.find((template) => template.key === templateKey)
        || ORDER_REPLY_TEMPLATE_OPTIONS[0];
}

function getSuggestedReplyTemplate(order) {
    const draft = getCurrentOrderDraft(order);

    if (!draft) {
        return "status_update";
    }

    if (draft.status === "quoted" || draft.status === "payment_pending") {
        return "quote_follow_up";
    }

    if (draft.status === "scheduled" && draft.fulfillmentType === "pickup") {
        return "pickup_ready";
    }

    if (draft.status === "scheduled" && draft.fulfillmentType === "local_delivery") {
        return "delivery_ready";
    }

    return "status_update";
}

function buildOrderReplyMessage(order, templateKey = state.activeReplyTemplate) {
    const draft = getCurrentOrderDraft(order);

    if (!draft) {
        return "";
    }

    const productName = getOrderCartItemCount(draft) > 0 ? "your cart inquiry" : draft.productSnapshot?.name || "your custom cake";
    const eventDateLabel = formatDate(draft.eventDate);
    const quoteLabel = draft.quotedAmount !== null && draft.quotedAmount !== undefined && draft.quotedAmount !== ""
        ? formatCurrency(draft.quotedAmount)
        : null;
    const cartSummaryLines = buildCartSummaryLines(draft);
    const closingLine = "Please reply here if you need any change or have any question.";

    if (templateKey === "quote_follow_up") {
        return [
            `Hi ${draft.customerName}, this is Pink Delight Cakes.`,
            `Following up on your inquiry #${draft.id} for ${productName}.`,
            quoteLabel
                ? `Your current quote is ${quoteLabel} for the design discussed.`
                : "We are ready to share the final quote once the last cake details are confirmed.",
            ...cartSummaryLines,
            draft.eventDate ? `The planned celebration date is ${eventDateLabel}.` : "",
            "Let us know if you would like to confirm this order or if you want any change before we lock it in.",
            closingLine
        ].filter(Boolean).join("\n");
    }

    if (templateKey === "pickup_ready") {
        return [
            `Hi ${draft.customerName}, this is Pink Delight Cakes.`,
            `Your order #${draft.id} for ${productName} is almost ready for pickup.`,
            ...cartSummaryLines,
            draft.eventDate ? `Pickup is planned around ${eventDateLabel}.` : "",
            quoteLabel ? `Your current order total is ${quoteLabel}.` : "",
            "Please message us before you leave so we can keep your cake packed and ready at handoff.",
            "Carry the cake on a flat seat or floor surface and avoid direct heat during travel."
        ].filter(Boolean).join("\n");
    }

    if (templateKey === "delivery_ready") {
        return [
            `Hi ${draft.customerName}, this is Pink Delight Cakes.`,
            `Your order #${draft.id} for ${productName} is lined up for delivery.`,
            ...cartSummaryLines,
            draft.eventDate ? `Delivery is planned for ${eventDateLabel}.` : "",
            quoteLabel ? `Your current order total is ${quoteLabel}.` : "",
            "Please keep your phone reachable around the delivery window so we can coordinate the handoff smoothly.",
            "Once the cake reaches you, place it in a cool indoor spot and avoid direct sunlight."
        ].filter(Boolean).join("\n");
    }

    const lines = [
        `Hi ${draft.customerName}, this is Pink Delight Cakes.`,
        `Your inquiry #${draft.id} for ${productName} is currently marked as ${slugLabel(draft.status)}.`
    ];

    if (draft.eventDate) {
        lines.push(`Event date: ${eventDateLabel}.`);
    }

    lines.push(...cartSummaryLines);

    if (quoteLabel) {
        lines.push(`Current quote: ${quoteLabel}.`);
    }

    if (draft.status === "reviewing") {
        lines.push("We are reviewing your design details and will confirm the next step shortly.");
    } else if (draft.status === "quoted") {
        lines.push("Please let us know if you would like to go ahead with this quote or need any change.");
    } else if (draft.status === "scheduled") {
        lines.push("Your order is scheduled and we will stay in touch with the final bakery update.");
    } else if (draft.status === "completed") {
        lines.push("Thank you again for choosing Pink Delight Cakes.");
    } else {
        lines.push(closingLine);
    }

    return lines.join("\n");
}

function renderReplyTemplatePreview() {
    const order = state.orders.find((item) => item.id === state.activeOrderId);
    const template = getReplyTemplateMeta();

    orderReplyTemplateLabel.textContent = template.label;
    orderReplyTemplateHint.textContent = template.hint;

    orderReplyTemplates.querySelectorAll("[data-reply-template]").forEach((button) => {
        button.classList.toggle("active", button.dataset.replyTemplate === state.activeReplyTemplate);
    });

    orderReplyPreview.textContent = order
        ? buildOrderReplyMessage(order, state.activeReplyTemplate)
        : "Select an order to preview a customer reply.";
}

function openOrderWhatsAppReply() {
    const order = state.orders.find((item) => item.id === state.activeOrderId);

    if (!order) {
        return;
    }

    const link = createWhatsAppLink(getOrderCustomerPhone(order), buildOrderReplyMessage(order));

    if (!link) {
        showToast("No usable phone number was found for this inquiry.", "error");
        return;
    }

    window.open(link, "_blank", "noopener,noreferrer");
}

async function handleCopyOrderReply() {
    const order = state.orders.find((item) => item.id === state.activeOrderId);

    if (!order) {
        return;
    }

    await copyTextToClipboard(buildOrderReplyMessage(order), "Reply text copied.");
}

async function handleCopyOrderSummary() {
    const order = state.orders.find((item) => item.id === state.activeOrderId);

    if (!order) {
        return;
    }

    await copyTextToClipboard(buildOrderSummaryText(order), "Inquiry summary copied.");
}

function handleDuplicateProduct() {
    const sourceProduct = state.products.find((item) => item.id === state.activeProductId);

    if (!sourceProduct) {
        showToast("Select a product before duplicating it.", "error");
        return;
    }

    state.isCreatingProduct = true;
    state.activeProductId = null;
    state.productDraft = createDuplicateProductDraft(sourceProduct);
    renderProductsGrid();
    renderProductEditor();
    showToast("Product duplicated into a new draft. Review it, then save when ready.", "success");
}

async function handleProductImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showToast("Please choose an image file.", "error");
        return;
    }

    setButtonBusy(productImageUploadButton, true, "Processing photo...");

    try {
        const result = await compressProductImage(file);
        productImageUrl.value = result.dataUrl;
        productImageMeta.textContent = `Uploaded from device and resized to ${result.width}x${result.height} (${Math.round(result.bytes / 1024)} KB).`;
        renderProductPreview();
        updateFormSaveMeta("product");
        showToast("Cake photo added to the product draft.", "success");
    } catch (error) {
        showToast(error.message || "Unable to process that photo.", "error");
    } finally {
        setButtonBusy(productImageUploadButton, false, "Upload photo");
        productImageFile.value = "";
    }
}

function handleProductImageClear() {
    productImageUrl.value = "";
    productImageFile.value = "";
    productImageMeta.textContent = "No image selected. You can paste a hosted URL or upload a photo from this device.";
    renderProductPreview();
    updateFormSaveMeta("product");
}

async function handleSettingsSpotlightImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showToast("Please choose an image file.", "error");
        return;
    }

    setButtonBusy(settingsSpotlightUploadButton, true, "Processing photo...");

    try {
        const result = await compressProductImage(file);
        settingsSpotlightImageUrl.value = result.dataUrl;
        settingsSpotlightImageMeta.textContent = `Uploaded from device and resized to ${result.width}x${result.height} (${Math.round(result.bytes / 1024)} KB).`;
        renderSettingsPreview();
        updateFormSaveMeta("settings");
        showToast("Featured spotlight photo updated in the settings draft.", "success");
    } catch (error) {
        showToast(error.message || "Unable to process that photo.", "error");
    } finally {
        setButtonBusy(settingsSpotlightUploadButton, false, "Upload spotlight photo");
        settingsSpotlightImageFile.value = "";
    }
}

function handleSettingsSpotlightImageClear() {
    settingsSpotlightImageUrl.value = "";
    settingsSpotlightImageFile.value = "";
    settingsSpotlightImageMeta.textContent = getSettingsSpotlightImageMetaText("");
    renderSettingsPreview();
    updateFormSaveMeta("settings");
}

async function handleProductSave(event) {
    event.preventDefault();

    setButtonBusy(productSaveButton, true, state.isCreatingProduct ? "Creating product..." : "Saving product...");

    try {
        const payload = collectProductPayload();
        const response = state.isCreatingProduct
            ? await apiRequest("/admin/products", { method: "POST", body: payload })
            : await apiRequest(`/admin/products/${state.activeProductId}`, { method: "PATCH", body: payload });

        if (state.isCreatingProduct) {
            state.products.unshift(response.product);
            state.activeProductId = response.product.id;
            state.isCreatingProduct = false;
            state.productDraft = null;
            showToast("Product created successfully.", "success");
        } else {
            state.products = state.products.map((product) => (product.id === response.product.id ? response.product : product));
            state.activeProductId = response.product.id;
            showToast("Product updated successfully.", "success");
        }

        renderOverview();
        renderProductsGrid();
        renderProductEditor();
        markFormSaved("product");
    } catch (error) {
        showToast(error.message || "Unable to save the product.", "error");
    } finally {
        setButtonBusy(productSaveButton, false, "Save product");
    }
}

async function handleSettingsSave(event) {
    event.preventDefault();

    setButtonBusy(settingsSaveButton, true, "Saving settings...");

    try {
        const payload = await apiRequest("/admin/settings", {
            method: "PATCH",
            body: collectSettingsPayload()
        });

        state.settings = payload.settings;
        renderSettings();
        markFormSaved("settings");
        showToast("Business settings updated successfully.", "success");
    } catch (error) {
        showToast(error.message || "Unable to save business settings.", "error");
    } finally {
        setButtonBusy(settingsSaveButton, false, "Save settings");
    }
}

async function handleTestimonialsSave(event) {
    event.preventDefault();

    setButtonBusy(testimonialsSaveButton, true, "Saving testimonials...");

    try {
        const payload = await apiRequest("/admin/testimonials", {
            method: "PATCH",
            body: {
                testimonials: collectTestimonialsPayload()
            }
        });

        state.testimonials = payload.testimonials || [];
        renderTestimonialsEditor();
        markFormSaved("testimonials");
        showToast("Testimonials updated successfully.", "success");
    } catch (error) {
        showToast(error.message || "Unable to save testimonials.", "error");
    } finally {
        setButtonBusy(testimonialsSaveButton, false, "Save testimonials");
    }
}

function bindDynamicListButtons() {
    document.querySelectorAll("[data-add-list]").forEach((button) => {
        button.addEventListener("click", () => {
            const type = button.dataset.addList;

            if (type === "flavor") {
                handleOptionComposerAdd("flavor", flavorComposerInput.value);
            }

            if (type === "size") {
                addSizeOption();
            }

            if (type === "addon") {
                handleOptionComposerAdd("addon", addonComposerInput.value);
            }
        });
    });

    [flavorList, addonList].forEach((container) => {
        container.addEventListener("click", (event) => {
            const button = event.target.closest("[data-remove-chip]");
            if (!button) {
                return;
            }

            const chip = button.closest("[data-option-value]");
            if (!chip) {
                return;
            }

            const type = chip.dataset.optionChip;
            const value = chip.dataset.optionValue || "";
            applyOptionValues(type, getOptionValues(type).filter((item) => item !== value), {
                focusComposer: true
            });
        });
    });

    sizeList.addEventListener("click", (event) => {
        const duplicateButton = event.target.closest("[data-duplicate-size]");
        if (duplicateButton) {
            const row = duplicateButton.closest(".size-row");
            if (!row) {
                return;
            }

            addSizeOption(extractSizeRowValue(row), {
                focus: false,
                afterRow: row
            });
            return;
        }

        const removeButton = event.target.closest("[data-remove-row]");
        if (!removeButton) {
            return;
        }

        const row = removeButton.closest(".size-row");
        row?.remove();
        if (!sizeList.querySelector(".size-row")) {
            renderSizeList([]);
        }
        updateFormSaveMeta("product");
        renderProductPreview();
    });

    [flavorComposerInput, addonComposerInput].forEach((input) => {
        input.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();
            handleOptionComposerAdd(input === flavorComposerInput ? "flavor" : "addon", input.value);
        });
    });

    addFlavorButton.addEventListener("click", () => {
        handleOptionComposerAdd("flavor", flavorComposerInput.value);
    });

    addAddonButton.addEventListener("click", () => {
        handleOptionComposerAdd("addon", addonComposerInput.value);
    });

    document.querySelectorAll("[data-add-option-preset]").forEach((button) => {
        button.addEventListener("click", () => {
            handleOptionComposerAdd(button.dataset.optionType, button.dataset.addOptionPreset || "");
        });
    });

    document.querySelectorAll("[data-add-size-preset]").forEach((button) => {
        button.addEventListener("click", () => {
            addSizeOption({
                label: button.dataset.sizeLabel || "",
                servings: button.dataset.sizeServings || "",
                price: ""
            });
        });
    });

    [flavorComposerInput, addonComposerInput].forEach((input) => {
        input.addEventListener("input", () => {
            updateFormSaveMeta("product");
        });
    });
}

function bindInteractions() {
    loginForm.addEventListener("submit", handleLogin);
    logoutButton.addEventListener("click", handleLogout);
    orderForm.addEventListener("submit", handleOrderSave);
    productForm.addEventListener("submit", handleProductSave);
    settingsForm.addEventListener("submit", handleSettingsSave);
    testimonialsForm.addEventListener("submit", handleTestimonialsSave);
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    sidebarNav.addEventListener("click", (event) => {
        const button = event.target.closest("[data-view]");
        if (!button) {
            return;
        }

        setView(button.dataset.view);
    });

    refreshOverview.addEventListener("click", async () => {
        if (!confirmDiscardChanges("refresh the dashboard")) {
            return;
        }

        await refreshDashboardData();
        showToast("Dashboard data refreshed.", "info");
    });

    refreshOrders.addEventListener("click", async () => {
        if (!confirmDiscardChanges("refresh orders", ["order"])) {
            return;
        }

        await loadOrders();
        renderOverview();
        renderOrdersList();
        renderOrderDetail();
        showToast("Orders refreshed.", "info");
    });

    refreshProducts.addEventListener("click", async () => {
        if (!confirmDiscardChanges("refresh products", ["product"])) {
            return;
        }

        await loadProducts();
        state.productDraft = null;
        renderOverview();
        renderProductsGrid();
        renderProductEditor();
        showToast("Products refreshed.", "info");
    });

    refreshSettings.addEventListener("click", async () => {
        if (!confirmDiscardChanges("refresh settings", ["settings", "testimonials"])) {
            return;
        }

        await Promise.all([loadSettings(), loadTestimonials()]);
        renderSettings();
        showToast("Business settings and testimonials refreshed.", "info");
    });

    orderFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-order-filter]");
        if (!button) {
            return;
        }

        state.orderFilter = button.dataset.orderFilter;
        renderOrderFilters();
        renderOrdersList();
        renderOrderDetail();
    });

    orderQuickFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-order-scope]");
        if (!button) {
            return;
        }

        state.orderScope = button.dataset.orderScope;
        renderOrderFilters();
        renderOrdersList();
        renderOrderDetail();
    });

    orderSearchInput.addEventListener("input", () => {
        state.orderSearch = orderSearchInput.value.trim();
        renderOrdersList();
        renderOrderDetail();
    });

    orderSortSelect.addEventListener("change", () => {
        state.orderSort = orderSortSelect.value;
        renderOrdersList();
        renderOrderDetail();
    });

    orderSelectAllVisible.addEventListener("change", () => {
        const visibleOrderIds = getVisibleOrders().map((order) => Number(order.id));
        const checked = orderSelectAllVisible.checked;

        visibleOrderIds.forEach((orderId) => {
            toggleOrderSelection(orderId, checked);
        });

        renderOrdersList();
    });

    clearOrderSelectionButton.addEventListener("click", () => {
        state.selectedOrderIds = [];
        renderOrdersList();
    });

    orderBulkActions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-bulk-status]");

        if (!button) {
            return;
        }

        button.dataset.defaultLabel = button.dataset.defaultLabel || button.querySelector("span")?.textContent || "";
        handleBulkOrderAction(button.dataset.bulkStatus, button);
    });

    ordersList.addEventListener("click", (event) => {
        if (event.target.closest("[data-select-order]")) {
            return;
        }

        const item = event.target.closest("[data-order-id]");
        if (!item) {
            return;
        }

        if (Number(item.dataset.orderId) !== state.activeOrderId && !confirmDiscardChanges("open another order", ["order"])) {
            return;
        }

        state.activeOrderId = Number(item.dataset.orderId);
        renderOrdersList();
        renderOrderDetail();
    });

    ordersList.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-select-order]");

        if (!checkbox) {
            return;
        }

        toggleOrderSelection(checkbox.dataset.selectOrder, checkbox.checked);
        renderOrderBulkActions();
    });

    productsGrid.addEventListener("click", (event) => {
        const item = event.target.closest("[data-product-id]");
        if (!item) {
            return;
        }

        if (Number(item.dataset.productId) !== state.activeProductId && !confirmDiscardChanges("open another product", ["product"])) {
            return;
        }

        state.activeProductId = Number(item.dataset.productId);
        state.isCreatingProduct = false;
        state.productDraft = null;
        renderProductsGrid();
        renderProductEditor();
        setView("products");
    });

    recentOrders.addEventListener("click", (event) => {
        const item = event.target.closest("[data-open-order]");
        if (!item) {
            return;
        }

        if (!confirmDiscardChanges("open that order", ["order"])) {
            return;
        }

        state.activeOrderId = Number(item.dataset.openOrder);
        setView("orders");
        renderOrdersList();
        renderOrderDetail();
    });

    productHealth.addEventListener("click", (event) => {
        const item = event.target.closest("[data-open-product]");
        if (!item) {
            return;
        }

        if (!confirmDiscardChanges("open that product", ["product"])) {
            return;
        }

        state.activeProductId = Number(item.dataset.openProduct);
        state.isCreatingProduct = false;
        state.productDraft = null;
        setView("products");
        renderProductsGrid();
        renderProductEditor();
    });

    newProductButton.addEventListener("click", () => {
        if (!confirmDiscardChanges("start a new product", ["product"])) {
            return;
        }

        state.isCreatingProduct = true;
        state.activeProductId = null;
        state.productDraft = null;
        renderProductsGrid();
        renderProductEditor();
    });

    duplicateProductButton.addEventListener("click", () => {
        if (!confirmDiscardChanges("duplicate this product into a draft", ["product"])) {
            return;
        }

        handleDuplicateProduct();
    });

    productImageUploadButton.addEventListener("click", () => {
        productImageFile.click();
    });

    productImageFile.addEventListener("change", handleProductImageUpload);
    productImageClearButton.addEventListener("click", handleProductImageClear);
    settingsSpotlightUploadButton.addEventListener("click", () => {
        settingsSpotlightImageFile.click();
    });
    settingsSpotlightImageFile.addEventListener("change", handleSettingsSpotlightImageUpload);
    settingsSpotlightClearButton.addEventListener("click", handleSettingsSpotlightImageClear);
    [settingsSpotlightImageUrl].forEach((field) => {
        field.addEventListener("input", () => {
            settingsSpotlightImageMeta.textContent = String(settingsSpotlightImageUrl.value || "").trim()
                ? "Using the pasted image URL for the featured spotlight."
                : getSettingsSpotlightImageMetaText("");
        });
        field.addEventListener("change", () => {
            settingsSpotlightImageMeta.textContent = String(settingsSpotlightImageUrl.value || "").trim()
                ? "Using the pasted image URL for the featured spotlight."
                : getSettingsSpotlightImageMetaText("");
        });
    });

    addTestimonialButton.addEventListener("click", () => {
        testimonialList.appendChild(createTestimonialInput());
        updateFormSaveMeta("testimonials");
        renderTestimonialsPreview();
    });

    testimonialList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-remove-testimonial]");
        if (!button) {
            return;
        }

        button.closest(".testimonial-row")?.remove();

        if (!testimonialList.querySelector(".testimonial-row")) {
            testimonialList.appendChild(createTestimonialInput());
        }

        updateFormSaveMeta("testimonials");
        renderTestimonialsPreview();
    });

    window.addEventListener("hashchange", () => {
        const nextView = window.location.hash.replace("#", "");
        if (["overview", "orders", "products", "settings"].includes(nextView)) {
            setView(nextView);
        }
    });

    window.addEventListener("beforeunload", (event) => {
        if (!getDirtyFormLabels().length) {
            return;
        }

        event.preventDefault();
        event.returnValue = "";
    });

    orderQuickActions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-quick-status]");

        if (!button) {
            return;
        }

        handleOrderQuickAction(button.dataset.quickStatus, button);
    });

    orderReplyTemplates.addEventListener("click", (event) => {
        const button = event.target.closest("[data-reply-template]");

        if (!button) {
            return;
        }

        state.activeReplyTemplate = button.dataset.replyTemplate;
        renderReplyTemplatePreview();
    });

    openOrderWhatsAppButton.addEventListener("click", openOrderWhatsAppReply);
    copyOrderReplyButton.addEventListener("click", handleCopyOrderReply);
    copyOrderSummaryButton.addEventListener("click", handleCopyOrderSummary);

    needsAttentionList.addEventListener("click", (event) => {
        const item = event.target.closest("[data-attention-kind]");

        if (!item) {
            return;
        }

        if (item.dataset.attentionKind === "order") {
            if (!confirmDiscardChanges("open that order", ["order"])) {
                return;
            }

            state.activeOrderId = Number(item.dataset.attentionId);
            setView("orders");
            renderOrdersList();
            renderOrderDetail();
            return;
        }

        if (!confirmDiscardChanges("open that product", ["product"])) {
            return;
        }

        state.activeProductId = Number(item.dataset.attentionId);
        state.isCreatingProduct = false;
        setView("products");
        renderProductsGrid();
        renderProductEditor();
    });

    [orderStatus, orderQuotedAmount, orderInternalNote].forEach((field) => {
        field.addEventListener("input", () => {
            updateFormSaveMeta("order");
            renderReplyTemplatePreview();
        });
        field.addEventListener("change", () => {
            updateFormSaveMeta("order");
            renderReplyTemplatePreview();
        });
    });

    productName.addEventListener("input", () => {
        syncProductSlugFromName();
        renderProductPreview();
    });

    productSlug.addEventListener("input", () => {
        const generatedSlug = getUniqueProductSlug(productName.value, state.isCreatingProduct ? null : state.activeProductId);
        productSlug.dataset.userModified = productSlug.value.trim() !== generatedSlug && productSlug.value.trim() !== "";
        renderProductPreview();
    });

    [
        productCategory,
        productBadge,
        productDescription,
        productStartingPrice,
        productLeadTime,
        productAvailability,
        productImageUrl,
        productFeatured
    ].forEach((field) => {
        field.addEventListener("input", renderProductPreview);
        field.addEventListener("change", renderProductPreview);
    });

    productForm.addEventListener("input", () => {
        updateFormSaveMeta("product");
        renderProductPreview();
    });
    productForm.addEventListener("change", () => {
        updateFormSaveMeta("product");
        renderProductPreview();
    });
    settingsForm.addEventListener("input", () => {
        updateFormSaveMeta("settings");
        renderSettingsPreview();
        renderTestimonialsPreview();
    });
    settingsForm.addEventListener("change", () => {
        updateFormSaveMeta("settings");
        renderSettingsPreview();
        renderTestimonialsPreview();
    });
    testimonialsForm.addEventListener("input", () => {
        updateFormSaveMeta("testimonials");
        renderTestimonialsPreview();
    });
    testimonialsForm.addEventListener("change", () => {
        updateFormSaveMeta("testimonials");
        renderTestimonialsPreview();
    });

    bindDynamicListButtons();
}

async function init() {
    bindInteractions();
    setAuthState("Checking your admin session...");

    const sessionOk = await checkSession();

    if (!sessionOk) {
        showLoginForm();
        return;
    }

    await refreshDashboardData();
    showDashboard();

    const requestedView = window.location.hash.replace("#", "");
    setView(["overview", "orders", "products", "settings"].includes(requestedView) ? requestedView : "orders");
}

init().catch((error) => {
    console.error(error);
    showLoginForm();
    setAuthState("Unable to start the dashboard right now.", "error");
    showToast("Dashboard boot failed. Check the browser console and API origin.", "error");
});
