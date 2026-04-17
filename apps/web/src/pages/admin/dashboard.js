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
    isCreatingProduct: false
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
const refreshOverview = document.getElementById("refreshOverview");
const refreshOrders = document.getElementById("refreshOrders");
const refreshProducts = document.getElementById("refreshProducts");
const refreshSettings = document.getElementById("refreshSettings");
const orderFilters = document.getElementById("orderFilters");
const ordersList = document.getElementById("ordersList");
const ordersCountLabel = document.getElementById("ordersCountLabel");
const orderEmptyState = document.getElementById("orderEmptyState");
const orderForm = document.getElementById("orderForm");
const orderSummary = document.getElementById("orderSummary");
const orderStatus = document.getElementById("orderStatus");
const orderQuotedAmount = document.getElementById("orderQuotedAmount");
const orderInternalNote = document.getElementById("orderInternalNote");
const orderSaveButton = document.getElementById("orderSaveButton");
const productsGrid = document.getElementById("productsGrid");
const newProductButton = document.getElementById("newProductButton");
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
const productFeatured = document.getElementById("productFeatured");
const flavorList = document.getElementById("flavorList");
const sizeList = document.getElementById("sizeList");
const addonList = document.getElementById("addonList");
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
const settingsWeekdayOpenTime = document.getElementById("settingsWeekdayOpenTime");
const settingsWeekdayCloseTime = document.getElementById("settingsWeekdayCloseTime");
const settingsSaturdayOpenTime = document.getElementById("settingsSaturdayOpenTime");
const settingsSaturdayCloseTime = document.getElementById("settingsSaturdayCloseTime");
const settingsSundayOpenTime = document.getElementById("settingsSundayOpenTime");
const settingsSundayCloseTime = document.getElementById("settingsSundayCloseTime");
const settingsSummary = document.getElementById("settingsSummary");
const settingsSaveButton = document.getElementById("settingsSaveButton");
const testimonialsForm = document.getElementById("testimonialsForm");
const testimonialList = document.getElementById("testimonialList");
const addTestimonialButton = document.getElementById("addTestimonialButton");
const testimonialsSaveButton = document.getElementById("testimonialsSaveButton");
const toastStack = document.getElementById("toastStack");

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

async function apiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${apiBase}${path}`, {
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
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
                        <span>${escapeHtml(order.productSnapshot?.name || "Custom request")}</span>
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
}

function getVisibleOrders() {
    if (state.orderFilter === "all") {
        return state.orders;
    }

    return state.orders.filter((order) => order.status === state.orderFilter);
}

function renderOrderFilters() {
    const filters = ["all", "new", "reviewing", "quoted", "payment_pending", "paid", "scheduled", "completed", "cancelled"];
    orderFilters.innerHTML = filters.map((filter) => `
        <button class="filter-chip ${state.orderFilter === filter ? "active" : ""}" data-order-filter="${filter}" type="button">
            ${escapeHtml(filter === "all" ? "All orders" : statusLabel(filter))}
        </button>
    `).join("");
}

function renderOrdersList() {
    const orders = getVisibleOrders();
    ordersCountLabel.textContent = `${orders.length} order${orders.length === 1 ? "" : "s"} visible`;

    if (!orders.length) {
        ordersList.innerHTML = `<div class="detail-empty"><i class="fa-regular fa-folder-open"></i><p>No orders match the current filter yet.</p></div>`;
        return;
    }

    if (!orders.some((order) => order.id === state.activeOrderId)) {
        state.activeOrderId = orders[0].id;
    }

    ordersList.innerHTML = orders.map((order) => `
        <article class="stack-item ${state.activeOrderId === order.id ? "active" : ""}" data-order-id="${order.id}">
            <header>
                <div>
                    <strong>${escapeHtml(order.customerName)}</strong>
                    <span>${escapeHtml(order.productSnapshot?.name || "Custom request")}</span>
                </div>
                <span class="status-pill ${escapeHtml(order.status)}">${escapeHtml(statusLabel(order.status))}</span>
            </header>
            <p>${escapeHtml(order.customerPhone)}</p>
            <footer>
                <span class="mini-pill">${escapeHtml(formatDate(order.eventDate))}</span>
                <span class="mini-pill">${escapeHtml(order.fulfillmentType)}</span>
                <span class="mini-pill">${escapeHtml(order.sizeLabel || "No size")}</span>
            </footer>
        </article>
    `).join("");
}

function renderOrderDetail() {
    const order = state.orders.find((item) => item.id === state.activeOrderId);

    if (!order) {
        orderEmptyState.classList.remove("hidden");
        orderForm.classList.add("hidden");
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
                <span>${escapeHtml(order.productSnapshot?.name || "Custom request")}</span>
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
        </div>
    `;

    orderStatus.innerHTML = ORDER_STATUSES.map((status) => `
        <option value="${status}" ${order.status === status ? "selected" : ""}>${escapeHtml(statusLabel(status))}</option>
    `).join("");
    orderQuotedAmount.value = order.quotedAmount ?? "";
    orderInternalNote.value = order.internalNote ?? "";
}

function createListInput(type, values = {}) {
    const row = document.createElement("div");
    row.className = `dynamic-row ${type}-row`;

    if (type === "size") {
        row.innerHTML = `
            <input type="text" data-size-label placeholder="Label" value="${escapeHtml(values.label || "")}">
            <input type="text" data-size-servings placeholder="Servings" value="${escapeHtml(values.servings || "")}">
            <input type="number" data-size-price min="1" step="1" placeholder="Price" value="${escapeHtml(values.price ?? "")}">
            <button class="icon-button" type="button" data-remove-row><i class="fa-solid fa-trash"></i></button>
        `;
    } else {
        const placeholder = type === "flavor" ? "Flavor option" : "Add-on option";
        row.innerHTML = `
            <input type="text" data-item-value placeholder="${placeholder}" value="${escapeHtml(values.value || "")}">
            <button class="icon-button" type="button" data-remove-row><i class="fa-solid fa-trash"></i></button>
        `;
    }

    return row;
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
    container.innerHTML = "";

    if (!items.length) {
        container.appendChild(createListInput(type));
        return;
    }

    items.forEach((item) => {
        if (type === "size") {
            container.appendChild(createListInput(type, item));
        } else {
            container.appendChild(createListInput(type, { value: item }));
        }
    });
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
    fillDynamicList(flavorList, "flavor", product.options?.flavors || []);
    fillDynamicList(sizeList, "size", product.options?.sizes || []);
    fillDynamicList(addonList, "addon", product.options?.addOns || []);
}

function renderProductEditor() {
    let product;

    if (state.isCreatingProduct) {
        productEditorLabel.textContent = "Creating a new product";
        product = getDefaultProductDraft();
    } else {
        product = state.products.find((item) => item.id === state.activeProductId) || state.products[0] || getDefaultProductDraft();
        state.activeProductId = product.id || null;
        productEditorLabel.textContent = product.id ? `Editing ${product.name}` : "Select a product or create a new one";
    }

    fillProductForm(product);
}

function serializeDynamicValues() {
    const flavors = Array.from(flavorList.querySelectorAll('[data-item-value]'))
        .map((input) => input.value.trim())
        .filter(Boolean);

    const addOns = Array.from(addonList.querySelectorAll('[data-item-value]'))
        .map((input) => input.value.trim())
        .filter(Boolean);

    const sizes = Array.from(sizeList.querySelectorAll('.size-row'))
        .map((row) => ({
            label: row.querySelector('[data-size-label]')?.value.trim() || "",
            servings: row.querySelector('[data-size-servings]')?.value.trim() || "",
            price: Number(row.querySelector('[data-size-price]')?.value || 0)
        }))
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
        return;
    }

    state.testimonials.forEach((testimonial) => {
        testimonialList.appendChild(createTestimonialInput(testimonial));
    });
}

function renderSettingsSummary() {
    const settings = state.settings;

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

function renderSettings() {
    fillSettingsForm(state.settings);
    renderSettingsSummary();
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
    state.isCreatingProduct = false;
    showLoginForm();
    showToast("Admin session closed.", "info");
    setButtonBusy(logoutButton, false, "Log out");
}

async function handleOrderSave(event) {
    event.preventDefault();

    const orderId = state.activeOrderId;
    if (!orderId) {
        return;
    }

    setButtonBusy(orderSaveButton, true, "Saving update...");

    try {
        const payload = await apiRequest(`/admin/orders/${orderId}`, {
            method: "PATCH",
            body: {
                status: orderStatus.value,
                quotedAmount: orderQuotedAmount.value ? Number(orderQuotedAmount.value) : null,
                internalNote: orderInternalNote.value.trim()
            }
        });

        state.orders = state.orders.map((order) => (order.id === orderId ? payload.order : order));
        renderOverview();
        renderOrdersList();
        renderOrderDetail();
        showToast("Order updated successfully.", "success");
    } catch (error) {
        showToast(error.message || "Unable to update the order.", "error");
    } finally {
        setButtonBusy(orderSaveButton, false, "Save order update");
    }
}

async function handleProductSave(event) {
    event.preventDefault();

    setButtonBusy(document.getElementById("productSaveButton"), true, state.isCreatingProduct ? "Creating product..." : "Saving product...");

    try {
        const payload = collectProductPayload();
        const response = state.isCreatingProduct
            ? await apiRequest("/admin/products", { method: "POST", body: payload })
            : await apiRequest(`/admin/products/${state.activeProductId}`, { method: "PATCH", body: payload });

        if (state.isCreatingProduct) {
            state.products.unshift(response.product);
            state.activeProductId = response.product.id;
            state.isCreatingProduct = false;
            showToast("Product created successfully.", "success");
        } else {
            state.products = state.products.map((product) => (product.id === response.product.id ? response.product : product));
            state.activeProductId = response.product.id;
            showToast("Product updated successfully.", "success");
        }

        renderOverview();
        renderProductsGrid();
        renderProductEditor();
    } catch (error) {
        showToast(error.message || "Unable to save the product.", "error");
    } finally {
        setButtonBusy(document.getElementById("productSaveButton"), false, "Save product");
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
                flavorList.appendChild(createListInput("flavor"));
            }

            if (type === "size") {
                sizeList.appendChild(createListInput("size"));
            }

            if (type === "addon") {
                addonList.appendChild(createListInput("addon"));
            }
        });
    });

    [flavorList, sizeList, addonList].forEach((container) => {
        container.addEventListener("click", (event) => {
            const button = event.target.closest("[data-remove-row]");
            if (!button) {
                return;
            }

            const row = button.closest(".dynamic-row");
            row?.remove();
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
        await refreshDashboardData();
        showToast("Dashboard data refreshed.", "info");
    });

    refreshOrders.addEventListener("click", async () => {
        await loadOrders();
        renderOverview();
        renderOrdersList();
        renderOrderDetail();
        showToast("Orders refreshed.", "info");
    });

    refreshProducts.addEventListener("click", async () => {
        await loadProducts();
        renderOverview();
        renderProductsGrid();
        renderProductEditor();
        showToast("Products refreshed.", "info");
    });

    refreshSettings.addEventListener("click", async () => {
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

    ordersList.addEventListener("click", (event) => {
        const item = event.target.closest("[data-order-id]");
        if (!item) {
            return;
        }

        state.activeOrderId = Number(item.dataset.orderId);
        renderOrdersList();
        renderOrderDetail();
    });

    productsGrid.addEventListener("click", (event) => {
        const item = event.target.closest("[data-product-id]");
        if (!item) {
            return;
        }

        state.activeProductId = Number(item.dataset.productId);
        state.isCreatingProduct = false;
        renderProductsGrid();
        renderProductEditor();
        setView("products");
    });

    recentOrders.addEventListener("click", (event) => {
        const item = event.target.closest("[data-open-order]");
        if (!item) {
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

        state.activeProductId = Number(item.dataset.openProduct);
        state.isCreatingProduct = false;
        setView("products");
        renderProductsGrid();
        renderProductEditor();
    });

    newProductButton.addEventListener("click", () => {
        state.isCreatingProduct = true;
        state.activeProductId = null;
        renderProductsGrid();
        renderProductEditor();
    });

    addTestimonialButton.addEventListener("click", () => {
        testimonialList.appendChild(createTestimonialInput());
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
    });

    window.addEventListener("hashchange", () => {
        const nextView = window.location.hash.replace("#", "");
        if (["overview", "orders", "products", "settings"].includes(nextView)) {
            setView(nextView);
        }
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
