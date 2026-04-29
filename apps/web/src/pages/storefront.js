        document.documentElement.classList.add("motion-ready");

        const RUNTIME_PUBLIC_SITE_URL = "__PUBLIC_SITE_URL__";
        const RUNTIME_ADMIN_SITE_URL = "__ADMIN_SITE_URL__";
        const RUNTIME_API_BASE_URL = "__API_BASE_URL__";
        const DEFAULT_SOCIAL_IMAGE = "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80";
        const DEFAULT_OWNER_NAME = "Pinky Sangoi";
        const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/PinkDelightCake?mibextid=ZbWKwL";
        const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/pinkdelightcake/profilecard/?igsh=MWM1dmFhY2VzOGVvaw==";
        const CART_STORAGE_KEY = "pinkDelightCakes.inquiryBag.v1";
        const MAX_CART_ITEMS = 12;
        const MAX_CART_QUANTITY = 20;
        const HERO_COLLAGE_FALLBACKS = [
            "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1562777717-b6aff3afac0f?auto=format&fit=crop&w=900&q=80"
        ];
        const FOUNDER_PORTRAIT_FALLBACK = "/src/assets/baat-pakki-engagement-cake.webp";
        const DEFAULT_WARM_FOUNDER_PARAGRAPH = "Pink Delight Cakes is led by Pinky Sangoi and grew from small family celebrations into a warm home bakery focused on soft finishes, homemade flavor, and cakes that feel truly personal.";
        const DEFAULT_FOUNDER_NOTE = "Pinky Sangoi handles each inquiry like a real conversation, not a rushed checkout. The goal is simple: make the cake feel personal, taste homemade, and arrive as part of the celebration instead of just another order.";
        const DEFAULT_SETTINGS = {
            brandName: "Pink Delight Cakes",
            contactEmail: "hello@pinkdelightcakes.com",
            contactPhone: "+91 87678 12121",
            instagramHandle: "@pinkdelightcake",
            city: "",
            addressLine1: "",
            addressLine2: "",
            stateRegion: "Maharashtra",
            postalCode: "",
            countryCode: "IN",
            currency: "INR",
            inquiryChannel: "website",
            deliveryPickupCopy: "Pickup is scheduled by confirmation time, and nearby delivery can be arranged for select orders.",
            noticePeriodCopy: "Standard celebration cakes usually need 24 to 48 hours notice",
            bakeryIntroTitle: "Baked from home, designed with care, and made for real celebrations.",
            bakeryIntroParagraph1: "Pink Delight Cakes is led by Pinky Sangoi and began as a home bakery rooted in family celebrations, soft finishes, and cakes that feel personal from the very first conversation.",
            bakeryIntroParagraph2: DEFAULT_WARM_FOUNDER_PARAGRAPH,
            responseTimeCopy: "Share your date, servings, flavor preference, and inspiration photo. We usually reply with design options and pricing within 2 hours during bakery hours.",
            featuredSpotlightTitle: "",
            featuredSpotlightDescription: "",
            featuredSpotlightImageUrl: "",
            featuredSpotlightSourceUrl: "",
            weekdayOpenTime: "10:00",
            weekdayCloseTime: "20:00",
            saturdayOpenTime: "10:00",
            saturdayCloseTime: "20:00",
            sundayOpenTime: "",
            sundayCloseTime: ""
        };
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

        function buildUrlFromLocation(pathname) {
            return new URL(pathname, window.location.origin).toString();
        }

        function deriveApiBaseFromLocation() {
            const { protocol, hostname, port } = window.location;
            const portSuffix = port ? `:${port}` : "";

            if (hostname.startsWith("admin.")) {
                return `${protocol}//api.${hostname.slice("admin.".length)}${portSuffix}`;
            }

            if (hostname.startsWith("www.")) {
                return `${protocol}//api.${hostname.slice("www.".length)}${portSuffix}`;
            }

            if (hostname.includes(".") && !hostname.endsWith(".pages.dev")) {
                return `${protocol}//api.${hostname}${portSuffix}`;
            }

            return "";
        }

        function resolveSiteUrl() {
            return normalizeAbsoluteUrl(RUNTIME_PUBLIC_SITE_URL) || buildUrlFromLocation("/");
        }

        function resolveAdminUrl() {
            return normalizeAbsoluteUrl(RUNTIME_ADMIN_SITE_URL) || buildUrlFromLocation("/admin/");
        }

        function resolveApiBaseUrl() {
            return (
                normalizeAbsoluteUrl(document.body.dataset.apiBase || "") ||
                normalizeAbsoluteUrl(RUNTIME_API_BASE_URL) ||
                normalizeAbsoluteUrl(deriveApiBaseFromLocation())
            ).replace(/\/$/, "");
        }

        const SITE_URL = resolveSiteUrl();
        const ADMIN_URL = resolveAdminUrl();
        const PRODUCT_IMAGE_FALLBACKS = {
            "midnight-chocolate": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80",
            "vintage-rose": "https://images.unsplash.com/photo-1562777717-b6aff3afac0f?auto=format&fit=crop&w=900&q=80",
            "classic-vanilla-berry": "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80",
            default: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=900&q=80"
        };

        const state = {
            settings: { ...DEFAULT_SETTINGS },
            testimonials: [],
            products: [],
            productsStatus: "loading",
            settingsResolved: false,
            activeMenuCategory: "all",
            cartItems: [],
            cartSubmitted: false
        };

        const apiBase = resolveApiBaseUrl();
        const menuGrid = document.getElementById("menuGrid");
        const menuCategoryFilters = document.getElementById("menuCategoryFilters");
        const signatureGrid = document.getElementById("signatureGrid");
        const orderForm = document.getElementById("orderForm");
        const customerName = document.getElementById("customerName");
        const customerPhone = document.getElementById("customerPhone");
        const customerEmail = document.getElementById("customerEmail");
        const inquiryWebsite = document.getElementById("inquiryWebsite");
        const cakeProduct = document.getElementById("cakeProduct");
        const cakeFlavor = document.getElementById("cakeFlavor");
        const cakeSize = document.getElementById("cakeSize");
        const fulfillment = document.getElementById("fulfillment");
        const addon = document.getElementById("addon");
        const eventDate = document.getElementById("eventDate");
        const requestNotes = document.getElementById("requestNotes");
        const requestPreview = document.getElementById("requestPreview");
        const formStatus = document.getElementById("formStatus");
        const submitInquiryButton = document.getElementById("submitInquiryButton");
        const whatsAppOrderLink = document.getElementById("whatsAppOrderLink");
        const updatePreviewButton = document.getElementById("updatePreviewButton");
        const heroCityLabel = document.getElementById("heroCityLabel");
        const heroDeliveryPickupCopy = document.getElementById("heroDeliveryPickupCopy");
        const homeHeroTitle = document.getElementById("homeHeroTitle");
        const homeHeroDescription = document.getElementById("homeHeroDescription");
        const homeHeroPrimaryCta = document.getElementById("homeHeroPrimaryCta");
        const homeHeroPrimaryCtaLabel = homeHeroPrimaryCta?.querySelector("span") || null;
        const heroCarousel = document.querySelector(".hero-carousel");
        const heroTrack = document.getElementById("heroTrack");
        const heroDots = document.getElementById("heroDots");
        const heroNextButton = document.getElementById("heroNextButton");
        const heroNoticeHighlight = document.getElementById("heroNoticeHighlight");
        const noticePeriodCopy = document.getElementById("noticePeriodCopy");
        const contactLocationText = document.getElementById("contactLocationText");
        const footerLocationText = document.getElementById("footerLocationText");
        const bakeryIntroTitle = document.getElementById("bakeryIntroTitle");
        const bakeryIntroParagraph1 = document.getElementById("bakeryIntroParagraph1");
        const bakeryIntroParagraph2 = document.getElementById("bakeryIntroParagraph2");
        const founderNoteText = document.getElementById("founderNoteText");
        const founderPortraitImage = document.getElementById("founderPortraitImage");
        const responseTimeCopy = document.getElementById("responseTimeCopy");
        const supportResponseTimeCopy = document.getElementById("supportResponseTimeCopy");
        const reviewGrid = document.getElementById("reviewGrid");
        const serviceAreaDeliveryCopy = document.getElementById("serviceAreaDeliveryCopy");
        const serviceAreaPickupCopy = document.getElementById("serviceAreaPickupCopy");
        const serviceAreaNoticeCopy = document.getElementById("serviceAreaNoticeCopy");
        const referenceCard = document.getElementById("referenceCard");
        const trackReferenceLink = document.getElementById("trackReferenceLink");
        const catalogNote = document.getElementById("catalogNote");
        const featuredSpotlight = document.getElementById("featuredSpotlight");
        const featuredSpotlightImage = document.getElementById("featuredSpotlightImage");
        const featuredSpotlightEyebrow = document.getElementById("featuredSpotlightEyebrow");
        const featuredSpotlightTitle = document.getElementById("featuredSpotlightTitle");
        const featuredSpotlightDescription = document.getElementById("featuredSpotlightDescription");
        const featuredSpotlightInquiryLink = document.getElementById("featuredSpotlightInquiryLink");
        const featuredSpotlightSourceLink = document.getElementById("featuredSpotlightSourceLink");
        const cartCountBadges = document.querySelectorAll("[data-cart-count]");
        const cartItemsList = document.getElementById("cartItemsList");
        const cartEmptyState = document.getElementById("cartEmptyState");
        const cartSummaryPanel = document.getElementById("cartSummaryPanel");
        const clearCartButton = document.getElementById("clearCartButton");
        const cartEstimatedTotal = document.getElementById("cartEstimatedTotal");
        const cartInquiryForm = document.getElementById("cartInquiryForm");
        const cartCustomerName = document.getElementById("cartCustomerName");
        const cartCustomerPhone = document.getElementById("cartCustomerPhone");
        const cartCustomerEmail = document.getElementById("cartCustomerEmail");
        const cartEventDate = document.getElementById("cartEventDate");
        const cartFulfillment = document.getElementById("cartFulfillment");
        const cartNotes = document.getElementById("cartNotes");
        const cartWebsite = document.getElementById("cartWebsite");
        const cartWhatsAppLink = document.getElementById("cartWhatsAppLink");
        const cartFormStatus = document.getElementById("cartFormStatus");
        const submitCartInquiryButton = document.getElementById("submitCartInquiryButton");
        const cartReferenceCard = document.getElementById("cartReferenceCard");
        const cartTrackReferenceLink = document.getElementById("cartTrackReferenceLink");
        const homepageHero = document.querySelector(".hero");
        const heroCopy = document.querySelector(".hero-copy");
        const finePointerQuery = window.matchMedia("(pointer: fine)");
        const cursorMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        function getStructuredDataScript() {
            let script = document.getElementById("structuredDataScript");

            if (!script) {
                script = document.createElement("script");
                script.id = "structuredDataScript";
                script.type = "application/ld+json";
                document.head.appendChild(script);
            }

            return script;
        }

        const structuredDataScript = getStructuredDataScript();
        let currentHeroImage = DEFAULT_SOCIAL_IMAGE;
        let activeHomeHeroSlideIndex = 0;
        let homeHeroSlides = [];
        let homeHeroAutoplayTimer = null;
        const HOME_HERO_AUTOPLAY_DELAY = 5500;
        const HOME_HERO_RESUME_DELAY = 2600;
        const homeHeroPauseReasons = new Set();

        function initBakeryCursor() {
            if (!document.body.classList.contains("home-page") || !finePointerQuery.matches || cursorMotionQuery.matches) {
                return;
            }

            if (document.querySelector(".bakery-cursor")) {
                return;
            }

            const cursor = document.createElement("div");
            const cursorDot = document.createElement("div");
            cursor.className = "bakery-cursor";
            cursorDot.className = "bakery-cursor-dot";
            document.body.append(cursor, cursorDot);
            document.body.classList.add("has-bakery-cursor");

            const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const current = { x: target.x, y: target.y };
            let rafId = 0;

            function renderCursor() {
                current.x += (target.x - current.x) * 0.18;
                current.y += (target.y - current.y) * 0.18;

                cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0)`;
                cursorDot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate3d(-50%, -50%, 0)`;
                rafId = window.requestAnimationFrame(renderCursor);
            }

            function setInteractiveState(event) {
                const isInteractive = Boolean(event.target.closest("a, button, .signature-grid > *, .promise-card, .cta-card, .hero-carousel"));
                document.body.classList.toggle("cursor-interactive", isInteractive);
            }

            window.addEventListener("pointermove", (event) => {
                target.x = event.clientX;
                target.y = event.clientY;
                document.body.classList.add("cursor-ready");
                setInteractiveState(event);

                if (!rafId) {
                    renderCursor();
                }
            }, { passive: true });

            window.addEventListener("pointerdown", () => {
                document.body.classList.add("cursor-pressed");
            });

            window.addEventListener("pointerup", () => {
                document.body.classList.remove("cursor-pressed");
            });

            document.addEventListener("pointerleave", () => {
                document.body.classList.remove("cursor-ready");
            });

            document.addEventListener("pointerenter", () => {
                document.body.classList.add("cursor-ready");
            });
        }

        initBakeryCursor();

        function escapeHtml(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        function formatCurrency(value, currency = state.settings.currency || "INR") {
            const amount = Number(value);

            if (!Number.isFinite(amount)) {
                return "Price on request";
            }

            try {
                return new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0
                }).format(amount);
            } catch {
                return `INR ${amount}`;
            }
        }

        function formatLeadTime(hours) {
            const numericHours = Number(hours);
            return Number.isFinite(numericHours) && numericHours > 0
                ? `${numericHours} hour${numericHours === 1 ? "" : "s"}`
                : "Flexible lead time";
        }

        function formatAvailability(status) {
            if (status === "limited") return "Limited availability";
            if (status === "unavailable") return "Currently unavailable";
            return "Available to order";
        }

        function formatFulfillmentLabel(value) {
            return value === "local_delivery" ? "Local delivery" : "Pickup";
        }

        function createStarsMarkup(rating) {
            const count = Math.max(1, Math.min(5, Number(rating) || 5));
            return Array.from({ length: count }, () => '<i class="fa-solid fa-star"></i>').join(" ");
        }

        function isValidInquiryPhone(value) {
            const normalized = String(value || "").trim();
            const digitsOnly = normalized.replace(/\D/g, "");

            return /^[0-9+\-()\s]+$/.test(normalized) && digitsOnly.length >= 7 && digitsOnly.length <= 15;
        }

        function isValidInquiryEmail(value) {
            const normalized = String(value || "").trim();

            if (!normalized) {
                return true;
            }

            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
        }

        function getWhatsAppNumber(phone) {
            return String(phone || DEFAULT_SETTINGS.contactPhone).replace(/\D/g, "") || "918767812121";
        }

        function createWhatsAppLink(phone, message = "") {
            const number = getWhatsAppNumber(phone);
            return message
                ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
                : `https://wa.me/${number}`;
        }

        function createInstagramLink(handle) {
            const normalizedValue = String(handle || "").trim();

            if (/^https?:\/\//i.test(normalizedValue)) {
                return normalizedValue;
            }

            const slug = normalizedValue.replace(/^@/, "");
            return slug ? `https://instagram.com/${slug}` : "https://instagram.com";
        }

        function createTrackLink(referenceId = "") {
            const trackUrl = new URL("track/", SITE_URL);

            if (referenceId) {
                trackUrl.searchParams.set("reference", referenceId);
            }

            return trackUrl.toString();
        }

        function createSitePageLink(pathname) {
            return new URL(pathname, SITE_URL).toString();
        }

        function getCurrentCanonicalUrl() {
            return new URL(window.location.pathname || "/", SITE_URL).toString();
        }

        function getApiUrl(pathname) {
            return `${apiBase}${pathname}`;
        }

        function normalizeSpotlightImageUrl(value) {
            const trimmedValue = String(value || "").trim();

            if (!trimmedValue) {
                return "";
            }

            if (trimmedValue.startsWith("data:image/") || trimmedValue.startsWith("/") || trimmedValue.startsWith("src/")) {
                return trimmedValue;
            }

            return normalizeAbsoluteUrl(trimmedValue);
        }

        async function apiRequest(pathname, options = {}) {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 12000);
            let response;

            try {
                response = await fetch(getApiUrl(pathname), {
                    method: options.method || "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(options.headers || {})
                    },
                    body: options.body ? JSON.stringify(options.body) : undefined,
                    signal: controller.signal
                });
            } catch (error) {
                throw new Error(error.name === "AbortError"
                    ? "The bakery service took too long to respond."
                    : "The bakery service could not be reached right now.");
            } finally {
                window.clearTimeout(timeoutId);
            }

            const text = await response.text();
            let payload = null;

            if (text) {
                try {
                    payload = JSON.parse(text);
                } catch {
                    payload = null;
                }
            }

            if (!response.ok) {
                const details = Array.isArray(payload?.details) && payload.details.length
                    ? ` ${payload.details.join(", ")}`
                    : "";
                throw new Error((payload?.error || `Request failed with status ${response.status}`) + details);
            }

            return payload;
        }

        function mapProduct(product) {
            const ownerImageUrl = product.imageUrl || "";
            const options = product?.options || {};
            const sizes = Array.isArray(options.sizes) && options.sizes.length
                ? options.sizes.map((size) => ({
                    label: size.label || "Custom size",
                    servings: size.servings || "",
                    price: Number(size.price)
                }))
                : [{ label: "Custom size", servings: "", price: Number(product.startingPrice) || 0 }];

            return {
                slug: product.slug,
                name: product.name,
                badge: product.badge || "",
                imageUrl: ownerImageUrl || PRODUCT_IMAGE_FALLBACKS[product.slug] || PRODUCT_IMAGE_FALLBACKS.default,
                ownerImageUrl,
                hasOwnerImage: Boolean(String(ownerImageUrl).trim()),
                alt: `${product.name} cake by ${state.settings.brandName}`,
                startingPrice: product.startingPrice,
                shortDescription: product.shortDescription || "Freshly baked to order for special celebrations.",
                category: product.category || "Custom celebration cakes",
                leadTimeHours: product.leadTimeHours,
                availabilityStatus: product.availabilityStatus || "available",
                featured: Boolean(product.featured),
                flavors: Array.isArray(options.flavors) && options.flavors.length ? options.flavors : ["Bakery special"],
                sizes,
                addOns: Array.isArray(options.addOns) && options.addOns.length ? options.addOns : ["None"]
            };
        }

        function getSelectedProduct() {
            const selectableProducts = getPublicProducts();

            if (!cakeProduct) {
                return selectableProducts[0] || null;
            }

            return selectableProducts.find((product) => product.slug === cakeProduct.value) || selectableProducts[0] || null;
        }

        function getSelectedSize(product) {
            if (!cakeSize) {
                return product?.sizes[0] || null;
            }

            return product?.sizes.find((size) => size.label === cakeSize.value) || product?.sizes[0] || null;
        }

        function formatSizeText(size) {
            if (!size) return "Custom size";
            return size.servings ? `${size.label} (${size.servings} servings)` : size.label;
        }

        function renderCatalogState(message) {
            if (!menuGrid) {
                return;
            }

            menuGrid.innerHTML = `<div class="menu-state">${escapeHtml(message)}</div>`;

            if (catalogNote) {
                catalogNote.textContent = "More cake options can still be shared and customized during inquiry.";
            }
        }

        function isPublicProduct(product) {
            return product?.availabilityStatus !== "unavailable";
        }

        function getPublicProducts() {
            return state.products.filter(isPublicProduct);
        }

        function getSignatureProducts() {
            return getPublicProducts().filter((product) => product.featured).slice(0, 3);
        }

        function getProductBySlug(slug) {
            return getPublicProducts().find((product) => product.slug === slug)
                || state.products.find((product) => product.slug === slug)
                || null;
        }

        function getProductImageSource(product) {
            const imageUrl = String(product?.ownerImageUrl || "").trim();

            if (!imageUrl) {
                return "";
            }

            return imageUrl.startsWith("src/") ? `/${imageUrl}` : imageUrl;
        }

        function renderCakePhoto(product, className = "") {
            const imageUrl = getProductImageSource(product);

            if (!imageUrl) {
                return `
                    <div class="cake-photo-placeholder ${escapeHtml(className)}">
                        <i class="fa-solid fa-camera"></i>
                        <span>Photo coming soon</span>
                    </div>
                `;
            }

            return `<img class="${escapeHtml(className)}" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.alt)}" loading="lazy">`;
        }

        function clampNumber(value, min, max) {
            const numericValue = Number(value);

            if (!Number.isFinite(numericValue)) {
                return min;
            }

            return Math.min(max, Math.max(min, Math.trunc(numericValue)));
        }

        function createCartItemId() {
            return `bag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        }

        function normalizeCartItem(rawItem) {
            if (!rawItem || !rawItem.productSlug) {
                return null;
            }

            return {
                id: String(rawItem.id || createCartItemId()),
                productSlug: String(rawItem.productSlug || ""),
                productName: String(rawItem.productName || "Custom cake"),
                category: String(rawItem.category || "Custom celebration cakes"),
                imageUrl: String(rawItem.imageUrl || ""),
                startingPrice: Number(rawItem.startingPrice) || 0,
                flavor: String(rawItem.flavor || ""),
                sizeLabel: String(rawItem.sizeLabel || ""),
                servings: String(rawItem.servings || ""),
                sizePrice: Number(rawItem.sizePrice) || Number(rawItem.startingPrice) || 0,
                addOn: String(rawItem.addOn || ""),
                quantity: clampNumber(rawItem.quantity, 1, MAX_CART_QUANTITY),
                notes: String(rawItem.notes || "").slice(0, 240)
            };
        }

        function readStoredCartItems() {
            try {
                const parsedItems = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
                return Array.isArray(parsedItems)
                    ? parsedItems.map(normalizeCartItem).filter(Boolean).slice(0, MAX_CART_ITEMS)
                    : [];
            } catch {
                return [];
            }
        }

        function writeStoredCartItems() {
            try {
                window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cartItems));
            } catch {
                // A private browser mode can block storage; keep the current in-memory bag usable.
            }
        }

        function getCartQuantity() {
            return state.cartItems.reduce((total, item) => total + clampNumber(item.quantity, 1, MAX_CART_QUANTITY), 0);
        }

        function updateCartCount() {
            const quantity = getCartQuantity();
            cartCountBadges.forEach((badge) => {
                badge.textContent = String(quantity);
                badge.setAttribute("aria-label", `${quantity} item${quantity === 1 ? "" : "s"} in bag`);
            });
        }

        function saveCartAndRender() {
            writeStoredCartItems();
            updateCartCount();
            renderCartPage();
        }

        function getDefaultCartItem(product) {
            const size = product.sizes[0] || {};
            const addOn = product.addOns.find((item) => item && item !== "None") || "";

            return {
                id: createCartItemId(),
                productSlug: product.slug,
                productName: product.name,
                category: product.category,
                imageUrl: getProductImageSource(product),
                startingPrice: Number(product.startingPrice) || 0,
                flavor: product.flavors[0] || "",
                sizeLabel: size.label || "",
                servings: size.servings || "",
                sizePrice: Number(size.price) || Number(product.startingPrice) || 0,
                addOn,
                quantity: 1,
                notes: ""
            };
        }

        function calculateCartItemLineTotal(item) {
            const price = Number(item.sizePrice || item.startingPrice);
            const quantity = clampNumber(item.quantity, 1, MAX_CART_QUANTITY);
            return Number.isFinite(price) && price > 0 ? price * quantity : null;
        }

        function calculateCartEstimate() {
            const totals = state.cartItems.map(calculateCartItemLineTotal).filter((value) => Number.isFinite(value));
            return totals.length ? totals.reduce((sum, value) => sum + value, 0) : null;
        }

        function renderOptions(options, selectedValue, formatter = (item) => item) {
            const normalizedOptions = options.length ? options : [selectedValue || "Will confirm"];
            return normalizedOptions.map((option) => {
                const value = typeof option === "string" ? option : option.label;
                const label = typeof option === "string" ? option : formatter(option);
                return `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
            }).join("");
        }

        function renderCartItem(item) {
            const product = getProductBySlug(item.productSlug);
            const flavors = product?.flavors?.length ? product.flavors : [item.flavor || "Will confirm"];
            const sizes = product?.sizes?.length
                ? product.sizes
                : [{ label: item.sizeLabel || "Will confirm", servings: item.servings, price: item.sizePrice }];
            const addOns = product?.addOns?.length ? [...product.addOns, "None"] : [item.addOn || "None"];
            const lineTotal = calculateCartItemLineTotal(item);
            const imageMarkup = product
                ? renderCakePhoto(product)
                : item.imageUrl
                    ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.productName)}" loading="lazy">`
                    : `<div class="cake-photo-placeholder"><i class="fa-solid fa-camera"></i><span>Photo coming soon</span></div>`;

            return `
                <article class="cart-item-card" data-cart-item-id="${escapeHtml(item.id)}">
                    <div class="cart-item-image">
                        ${imageMarkup}
                    </div>
                    <div class="cart-item-content">
                        <div class="cart-item-topline">
                            <div>
                                <span class="cart-panel-kicker">${escapeHtml(product?.category || item.category)}</span>
                                <h3>${escapeHtml(product?.name || item.productName)}</h3>
                            </div>
                            <span class="cart-line-total">${escapeHtml(lineTotal ? formatCurrency(lineTotal) : "Price on request")}</span>
                        </div>
                        <div class="cart-item-fields">
                            <label>Flavor
                                <select data-cart-field="flavor">${renderOptions(flavors, item.flavor)}</select>
                            </label>
                            <label>Size
                                <select data-cart-field="sizeLabel">${renderOptions(sizes, item.sizeLabel, formatSizeText)}</select>
                            </label>
                            <label>Add-on
                                <select data-cart-field="addOn">${renderOptions(Array.from(new Set(addOns)), item.addOn || "None")}</select>
                            </label>
                            <label>Quantity
                                <span class="quantity-control">
                                    <button type="button" data-quantity-step="-1" aria-label="Decrease quantity">-</button>
                                    <input data-cart-field="quantity" type="number" min="1" max="${MAX_CART_QUANTITY}" value="${escapeHtml(item.quantity)}">
                                    <button type="button" data-quantity-step="1" aria-label="Increase quantity">+</button>
                                </span>
                            </label>
                        </div>
                        <div class="cart-note-field">
                            <label>Item notes
                                <textarea data-cart-field="notes" placeholder="Optional styling, message, or delivery note for this cake.">${escapeHtml(item.notes)}</textarea>
                            </label>
                        </div>
                        <button class="btn btn-secondary btn-small" type="button" data-remove-cart-item><i class="fa-regular fa-trash-can"></i> Remove item</button>
                    </div>
                </article>
            `;
        }

        function createCartItemsPayload() {
            return state.cartItems.slice(0, MAX_CART_ITEMS).map((item) => {
                const product = getProductBySlug(item.productSlug);
                const lineTotal = calculateCartItemLineTotal(item);
                return {
                    productId: item.productSlug,
                    productName: product?.name || item.productName,
                    flavor: item.flavor,
                    sizeLabel: item.sizeLabel,
                    servings: item.servings,
                    addOn: item.addOn === "None" ? "" : item.addOn,
                    quantity: clampNumber(item.quantity, 1, MAX_CART_QUANTITY),
                    itemNotes: item.notes,
                    startingPrice: Number(item.sizePrice || item.startingPrice) || null,
                    estimatedLineTotal: lineTotal
                };
            });
        }

        function buildCartInquiryPayload() {
            const cartItems = createCartItemsPayload();
            const primaryItem = cartItems[0] || {};

            return {
                customerName: cartCustomerName?.value.trim() || "",
                customerPhone: cartCustomerPhone?.value.trim() || "",
                customerEmail: cartCustomerEmail?.value.trim() || "",
                website: cartWebsite?.value.trim() || "",
                productId: primaryItem.productId || "",
                flavor: primaryItem.flavor || "",
                sizeLabel: primaryItem.sizeLabel || "",
                servings: primaryItem.servings || "",
                eventDate: cartEventDate?.value || "",
                fulfillmentType: cartFulfillment?.value || "pickup",
                addOn: primaryItem.addOn || "",
                notes: cartNotes?.value.trim() || "",
                cartItems
            };
        }

        function createCartWhatsAppMessage(payload = buildCartInquiryPayload()) {
            const lines = [
                `Hi ${state.settings.brandName}, I would like to request a quote for my inquiry bag.`,
                "",
                `Name: ${payload.customerName || "Not shared yet"}`,
                `Phone: ${payload.customerPhone || "Not shared yet"}`,
                payload.customerEmail ? `Email: ${payload.customerEmail}` : "",
                `Event date: ${payload.eventDate || "Not selected yet"}`,
                `Fulfillment: ${formatFulfillmentLabel(payload.fulfillmentType)}`,
                "",
                "Bag items:",
                ...payload.cartItems.map((item, index) => {
                    const parts = [
                        `${index + 1}. ${item.productName || item.productId || "Cake"}`,
                        item.quantity ? `Qty ${item.quantity}` : "",
                        item.flavor ? `Flavor: ${item.flavor}` : "",
                        item.sizeLabel ? `Size: ${item.sizeLabel}` : "",
                        item.addOn ? `Add-on: ${item.addOn}` : "",
                        item.itemNotes ? `Note: ${item.itemNotes}` : ""
                    ].filter(Boolean);
                    return parts.join(" | ");
                }),
                "",
                `Overall notes: ${payload.notes || "No extra notes yet"}`,
                `Estimated starting total: ${calculateCartEstimate() ? formatCurrency(calculateCartEstimate()) : "Price on request"}`
            ];

            return lines.filter(Boolean).join("\n");
        }

        function updateCartWhatsAppLink() {
            if (!cartWhatsAppLink) {
                return;
            }

            cartWhatsAppLink.href = createWhatsAppLink(
                state.settings.contactPhone,
                createCartWhatsAppMessage(buildCartInquiryPayload())
            );
        }

        function setCartFormStatus(message, type = "") {
            if (!cartFormStatus) {
                return;
            }

            cartFormStatus.textContent = message;
            cartFormStatus.classList.toggle("error", type === "error");
            cartFormStatus.classList.toggle("success", type === "success");
        }

        function setCartSubmitBusy(isBusy) {
            if (!submitCartInquiryButton) {
                return;
            }

            submitCartInquiryButton.disabled = isBusy || state.cartItems.length === 0;
            submitCartInquiryButton.innerHTML = isBusy
                ? `<i class="fa-solid fa-spinner fa-spin"></i> Sending inquiry...`
                : `<i class="fa-solid fa-paper-plane"></i> Send cart inquiry`;
        }

        function renderCartPage() {
            if (!cartItemsList) {
                return;
            }

            const hasItems = state.cartItems.length > 0;

            cartItemsList.innerHTML = hasItems ? state.cartItems.map(renderCartItem).join("") : "";
            cartEmptyState.hidden = hasItems;

            if (!hasItems && cartEmptyState) {
                const emptyHeading = cartEmptyState.querySelector("h2");
                const emptyCopy = cartEmptyState.querySelector("p");

                if (emptyHeading) {
                    emptyHeading.textContent = state.cartSubmitted
                        ? "Your cart inquiry was sent."
                        : "Your inquiry bag is empty.";
                }

                if (emptyCopy) {
                    emptyCopy.textContent = state.cartSubmitted
                        ? "Your request was saved for Pink Delight Cakes to review and quote."
                        : "Add cakes from the menu, then come back here to adjust flavor, size, quantity, and notes before sending one request.";
                }
            }

            cartSummaryPanel.hidden = !hasItems;
            clearCartButton.disabled = !hasItems;
            submitCartInquiryButton.disabled = !hasItems;
            cartEstimatedTotal.textContent = calculateCartEstimate()
                ? formatCurrency(calculateCartEstimate())
                : "Price on request";
            updateCartWhatsAppLink();
            observeRevealItems(cartItemsList);
        }

        function addProductToCart(productSlug) {
            const product = getProductBySlug(productSlug);

            if (!product) {
                return false;
            }

            state.cartSubmitted = false;
            const nextItem = getDefaultCartItem(product);
            const matchingItem = state.cartItems.find((item) => (
                item.productSlug === nextItem.productSlug
                && item.flavor === nextItem.flavor
                && item.sizeLabel === nextItem.sizeLabel
                && item.addOn === nextItem.addOn
                && !item.notes
            ));

            if (matchingItem) {
                matchingItem.quantity = clampNumber(matchingItem.quantity + 1, 1, MAX_CART_QUANTITY);
            } else if (state.cartItems.length < MAX_CART_ITEMS) {
                state.cartItems.push(nextItem);
            } else {
                return false;
            }

            saveCartAndRender();
            return true;
        }

        function updateCartItem(itemId, updates) {
            const item = state.cartItems.find((cartItem) => cartItem.id === itemId);

            if (!item) {
                return;
            }

            Object.assign(item, updates);
            saveCartAndRender();
        }

        function removeCartItem(itemId) {
            state.cartItems = state.cartItems.filter((item) => item.id !== itemId);
            saveCartAndRender();
        }

        function clearCart() {
            state.cartSubmitted = false;
            state.cartItems = [];
            saveCartAndRender();
        }

        function getCartItemElement(target) {
            return target.closest("[data-cart-item-id]");
        }

        function updateCartItemField(itemId, fieldName, value) {
            const item = state.cartItems.find((cartItem) => cartItem.id === itemId);

            if (!item) {
                return;
            }

            if (fieldName === "quantity") {
                updateCartItem(itemId, { quantity: clampNumber(value, 1, MAX_CART_QUANTITY) });
                return;
            }

            if (fieldName === "sizeLabel") {
                const product = getProductBySlug(item.productSlug);
                const size = product?.sizes.find((sizeOption) => sizeOption.label === value);
                updateCartItem(itemId, {
                    sizeLabel: value,
                    servings: size?.servings || item.servings,
                    sizePrice: Number(size?.price) || item.sizePrice || item.startingPrice
                });
                return;
            }

            if (fieldName === "addOn") {
                updateCartItem(itemId, { addOn: value === "None" ? "" : value });
                return;
            }

            updateCartItem(itemId, {
                [fieldName]: String(value || "").slice(0, fieldName === "notes" ? 240 : 120)
            });
        }

        function renderSignaturePlaceholder(index) {
            return `
                <article class="signature-card signature-card--placeholder reveal">
                    <div class="signature-image">
                        <div class="cake-photo-placeholder">
                            <i class="fa-solid fa-cake-candles"></i>
                            <span>Signature slot ${index}</span>
                        </div>
                    </div>
                    <div class="signature-content">
                        <span class="signature-kicker">Admin managed</span>
                        <h3>Feature a cake here</h3>
                        <p>Mark any available product as featured in the admin dashboard to fill this homepage slot.</p>
                    </div>
                </article>
            `;
        }

        function renderSignatureCard(product) {
            return `
                <article class="signature-card reveal">
                    <div class="signature-image">
                        ${renderCakePhoto(product)}
                        ${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : ""}
                    </div>
                    <div class="signature-content">
                        <span class="signature-kicker">${escapeHtml(product.category)}</span>
                        <h3>${escapeHtml(product.name)}</h3>
                        <p>${escapeHtml(product.shortDescription)}</p>
                        <div class="signature-meta">
                            <span>From ${escapeHtml(formatCurrency(product.startingPrice))}</span>
                            <span>${escapeHtml(formatLeadTime(product.leadTimeHours))}</span>
                        </div>
                        <a class="btn btn-secondary" href="${escapeHtml(createSitePageLink(`inquiry-model/?product=${encodeURIComponent(product.slug)}#contact`))}" data-request-product="${escapeHtml(product.slug)}">Ask about this cake</a>
                    </div>
                </article>
            `;
        }

        function renderSignatureProducts() {
            if (!signatureGrid) {
                return;
            }

            const signatureProducts = getSignatureProducts();
            const cards = signatureProducts.map(renderSignatureCard);

            while (cards.length < 3) {
                cards.push(renderSignaturePlaceholder(cards.length + 1));
            }

            signatureGrid.innerHTML = cards.slice(0, 3).join("");
            observeRevealItems(signatureGrid);
        }

        function getMenuProducts() {
            const products = getPublicProducts();

            if (state.activeMenuCategory === "all") {
                return products;
            }

            return products.filter((product) => product.category === state.activeMenuCategory);
        }

        function getMenuCategories(products) {
            return Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
        }

        function renderMenuCategoryFilters(products) {
            if (!menuCategoryFilters) {
                return;
            }

            const categories = getMenuCategories(products);

            if (categories.length <= 1) {
                menuCategoryFilters.hidden = true;
                menuCategoryFilters.innerHTML = "";
                return;
            }

            if (state.activeMenuCategory !== "all" && !categories.includes(state.activeMenuCategory)) {
                state.activeMenuCategory = "all";
            }

            menuCategoryFilters.hidden = false;
            menuCategoryFilters.innerHTML = [
                { label: "All cakes", value: "all" },
                ...categories.map((category) => ({ label: category, value: category }))
            ].map((category) => `
                <button class="menu-filter-chip${state.activeMenuCategory === category.value ? " active" : ""}" type="button" data-menu-category="${escapeHtml(category.value)}">
                    ${escapeHtml(category.label)}
                </button>
            `).join("");
        }

        function renderCatalogNote(menuProducts) {
            if (!catalogNote) {
                return;
            }

            const visibleCount = menuProducts.length;

            if (!visibleCount) {
                catalogNote.textContent = "More cake options can still be shared and customized during inquiry.";
                return;
            }

            if (state.activeMenuCategory !== "all") {
                catalogNote.textContent = `${visibleCount} ${state.activeMenuCategory.toLowerCase()} option${visibleCount === 1 ? "" : "s"} shown. Switch back to all cakes to browse the complete menu.`;
                return;
            }

            catalogNote.textContent = `${visibleCount} cake option${visibleCount === 1 ? "" : "s"} are available to browse. Final design, servings, and add-ons are still confirmed personally after inquiry.`;
        }

        function getFeaturedSpotlightSettings() {
            return {
                title: String(state.settings.featuredSpotlightTitle || "").trim(),
                description: String(state.settings.featuredSpotlightDescription || "").trim(),
                imageUrl: normalizeSpotlightImageUrl(state.settings.featuredSpotlightImageUrl),
                sourceUrl: normalizeAbsoluteUrl(state.settings.featuredSpotlightSourceUrl || "")
            };
        }

        function renderFeaturedSpotlight() {
            if (!featuredSpotlight) {
                return;
            }

            const spotlight = getFeaturedSpotlightSettings();
            const hasContent = Boolean(spotlight.title || spotlight.description || spotlight.imageUrl);

            if (!hasContent && !state.settingsResolved) {
                return;
            }

            featuredSpotlight.hidden = !hasContent;

            if (!hasContent) {
                return;
            }

            const title = spotlight.title || "Featured cake spotlight";
            const description = spotlight.description || "Ask about this featured design for your next celebration.";
            const imageUrl = spotlight.imageUrl || "src/assets/baat-pakki-engagement-cake.webp";
            const sourceLabel = /instagram\.com/i.test(spotlight.sourceUrl) ? "View Instagram post" : "View source link";

            featuredSpotlightEyebrow.textContent = "Latest featured cake";
            featuredSpotlightTitle.textContent = title;
            featuredSpotlightDescription.textContent = description;
            featuredSpotlightImage.src = imageUrl;
            featuredSpotlightImage.alt = `${title} by ${state.settings.brandName || DEFAULT_SETTINGS.brandName}`;
            featuredSpotlightInquiryLink.setAttribute("href", createSitePageLink("inquiry-model/#contact"));

            if (spotlight.sourceUrl) {
                featuredSpotlightSourceLink.hidden = false;
                featuredSpotlightSourceLink.setAttribute("href", spotlight.sourceUrl);
                featuredSpotlightSourceLink.innerHTML = `<i class="fa-brands fa-instagram"></i> ${escapeHtml(sourceLabel)}`;
            } else {
                featuredSpotlightSourceLink.hidden = true;
                featuredSpotlightSourceLink.removeAttribute("href");
            }
        }

        function renderProducts() {
            renderSignatureProducts();

            if (!menuGrid) {
                return;
            }

            if (state.productsStatus === "loading") {
                renderCatalogState("Loading the live cake catalogue...");
                return;
            }

            if (state.productsStatus === "error") {
                renderCatalogState("We could not load the live catalogue right now. You can still reach us directly on WhatsApp while we retry.");
                return;
            }

            const publicProducts = getPublicProducts();

            if (!publicProducts.length) {
                renderCatalogState("No products are published in the live catalogue yet. Please check back soon or message us directly for a custom cake.");
                return;
            }

            renderMenuCategoryFilters(publicProducts);

            const menuProducts = getMenuProducts();
            renderCatalogNote(menuProducts);

            menuGrid.innerHTML = menuProducts.map((product) => `
                <article class="menu-card reveal">
                    <div class="menu-image">
                        ${renderCakePhoto(product)}
                        ${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : ""}
                    </div>
                    <div class="menu-content">
                        <div class="menu-topline">
                            <h3>${escapeHtml(product.name)}</h3>
                            <span class="price">From ${escapeHtml(formatCurrency(product.startingPrice))}</span>
                        </div>
                        <p>${escapeHtml(product.shortDescription)}</p>
                        <div class="menu-tags">
                            <span>${escapeHtml(product.category)}</span>
                            <span>${escapeHtml(formatLeadTime(product.leadTimeHours))} lead time</span>
                        </div>
                        <div class="menu-specs">
                            <div class="spec-row">
                                <strong>Flavor options</strong>
                                <span>${escapeHtml(product.flavors.join(", "))}</span>
                            </div>
                            <div class="spec-row">
                                <strong>Size options</strong>
                                <span>${escapeHtml(product.sizes.map((size) => formatSizeText(size)).join(", "))}</span>
                            </div>
                            <div class="spec-row">
                                <strong>Add-ons</strong>
                                <span>${escapeHtml(product.addOns.join(", "))}</span>
                            </div>
                        </div>
                        <span class="availability-pill"><i class="fa-solid fa-circle"></i> ${escapeHtml(formatAvailability(product.availabilityStatus))}</span>
                        <div class="menu-actions">
                            <button class="btn btn-bag" type="button" data-add-to-cart="${escapeHtml(product.slug)}"><i class="fa-solid fa-bag-shopping"></i> Add to bag</button>
                            <a class="btn btn-secondary" href="${escapeHtml(createSitePageLink(`inquiry-model/?product=${encodeURIComponent(product.slug)}#contact`))}" data-request-product="${escapeHtml(product.slug)}">Request this product</a>
                        </div>
                    </div>
                </article>
            `).join("");
        }

        function renderTestimonials() {
            if (!reviewGrid) {
                return;
            }

            const testimonials = Array.isArray(state.testimonials) ? state.testimonials : [];

            if (!testimonials.length) {
                reviewGrid.classList.add("review-grid--empty");
                reviewGrid.innerHTML = `
                    <article class="review-empty-state reveal" aria-live="polite">
                        <span class="review-empty-state__eyebrow">Reviews not published yet</span>
                        <h3>Customer reviews will appear here once Pink Delight Cakes is ready to publish them.</h3>
                        <p>This section stays empty until real feedback is approved for the storefront.</p>
                    </article>
                `;
                observeRevealItems(reviewGrid);
                return;
            }

            reviewGrid.classList.remove("review-grid--empty");
            reviewGrid.innerHTML = testimonials.map((testimonial) => `
                <article class="testimonial-card reveal">
                    <div class="stars">${createStarsMarkup(testimonial.rating)}</div>
                    <p>"${escapeHtml(testimonial.quoteText || "")}"</p>
                    <strong>${escapeHtml(testimonial.customerName || "Happy customer")}</strong>
                    <span>${escapeHtml(testimonial.occasionLabel || "Celebration order")}</span>
                </article>
            `).join("");

            observeRevealItems(reviewGrid);
        }

        function setInquiryEnabled(enabled) {
            if (!orderForm) {
                return;
            }

            cakeProduct.disabled = !enabled;
            cakeFlavor.disabled = !enabled;
            cakeSize.disabled = !enabled;
            addon.disabled = !enabled;
            fulfillment.disabled = !enabled;
            submitInquiryButton.disabled = !enabled;
        }

        function populateProductOptions() {
            if (!cakeProduct || !cakeFlavor || !cakeSize || !addon) {
                return;
            }

            const selectableProducts = getPublicProducts();

            if (!selectableProducts.length) {
                cakeProduct.innerHTML = `<option value="">No live products available</option>`;
                cakeFlavor.innerHTML = `<option value="">Waiting for products</option>`;
                cakeSize.innerHTML = `<option value="">Waiting for products</option>`;
                addon.innerHTML = `<option value="">Waiting for products</option>`;
                setInquiryEnabled(false);
                return;
            }

            cakeProduct.innerHTML = selectableProducts.map((product) => `
                <option value="${escapeHtml(product.slug)}">${escapeHtml(product.name)}</option>
            `).join("");
            setInquiryEnabled(true);
        }

        function syncProductFields() {
            if (!cakeProduct || !cakeFlavor || !cakeSize || !addon) {
                return;
            }

            const product = getSelectedProduct();

            if (!product) {
                updateRequestPreview();
                return;
            }

            cakeFlavor.innerHTML = product.flavors.map((flavor) => `
                <option value="${escapeHtml(flavor)}">${escapeHtml(flavor)}</option>
            `).join("");

            cakeSize.innerHTML = product.sizes.map((size) => `
                <option value="${escapeHtml(size.label)}">${escapeHtml(formatSizeText(size))}</option>
            `).join("");

            addon.innerHTML = [...product.addOns, "None"].map((item) => `
                <option value="${escapeHtml(item)}">${escapeHtml(item)}</option>
            `).join("");

            updateRequestPreview();
        }

        function buildRequestPayload() {
            if (!orderForm) {
                return {};
            }

            const product = getSelectedProduct();
            const size = getSelectedSize(product);

            return {
                customerName: customerName.value.trim(),
                customerPhone: customerPhone.value.trim(),
                customerEmail: customerEmail.value.trim(),
                website: inquiryWebsite.value.trim(),
                productId: product?.slug || "",
                flavor: cakeFlavor.value || "",
                sizeLabel: size?.label || "",
                servings: size?.servings || "",
                eventDate: eventDate.value || "",
                fulfillmentType: fulfillment.value,
                addOn: addon.value === "None" ? "" : addon.value,
                notes: requestNotes.value.trim()
            };
        }

        function createWhatsAppMessage(payload, product, size) {
            const lines = [
                `Hi ${state.settings.brandName}, I would like to request a cake.`,
                "",
                `Name: ${payload.customerName || "Not shared yet"}`,
                `Phone: ${payload.customerPhone || "Not shared yet"}`,
                `Product: ${product?.name || "Custom request"}`,
                `Flavor: ${payload.flavor || "Will confirm"}`,
                `Size: ${size ? formatSizeText(size) : "Will confirm"}`,
                `Event date: ${payload.eventDate || "Not selected yet"}`,
                `Fulfillment: ${formatFulfillmentLabel(payload.fulfillmentType)}`,
                `Add-on: ${payload.addOn || "None"}`,
                `Notes: ${payload.notes || "No extra notes yet"}`
            ];

            if (payload.customerEmail) {
                lines.splice(4, 0, `Email: ${payload.customerEmail}`);
            }

            return lines.join("\n");
        }

        function updateRequestPreview() {
            if (!orderForm || !requestPreview || !whatsAppOrderLink) {
                return;
            }

            const product = getSelectedProduct();

            if (!product) {
                requestPreview.textContent = "Live catalogue unavailable right now. You can still contact the bakery directly on WhatsApp.";
                whatsAppOrderLink.href = createWhatsAppLink(state.settings.contactPhone);
                return;
            }

            const payload = buildRequestPayload();
            const size = getSelectedSize(product);

            requestPreview.textContent = JSON.stringify({
                customerName: payload.customerName || "Required before submitting",
                customerPhone: payload.customerPhone || "Required before submitting",
                customerEmail: payload.customerEmail || null,
                productId: payload.productId,
                flavor: payload.flavor || null,
                sizeLabel: payload.sizeLabel || null,
                servings: payload.servings || null,
                eventDate: payload.eventDate || null,
                fulfillmentType: payload.fulfillmentType,
                addOn: payload.addOn || null,
                notes: payload.notes || null
            }, null, 2);

            whatsAppOrderLink.href = createWhatsAppLink(
                state.settings.contactPhone,
                createWhatsAppMessage(payload, product, size)
            );
        }

        const navToggle = document.getElementById("navToggle");
        const siteNav = document.getElementById("siteNav");

        function getHeroCityLabel(city) {
            if (!city || /^your city$/i.test(city.trim())) {
                return "Home bakery";
            }

            return `Home bakery in ${city}`;
        }

        function getContactLocationLabel(city) {
            if (!city || /^your city$/i.test(city.trim())) {
                return "Pickup by pre-arranged slot, with nearby delivery available";
            }

            return `Pickup and delivery across ${city}`;
        }

        function getWarmBakeryParagraph() {
            const paragraph = String(getSettingText("bakeryIntroParagraph2") || "").trim();

            if (!paragraph || /If you are a home baker/i.test(paragraph)) {
                return DEFAULT_WARM_FOUNDER_PARAGRAPH;
            }

            return paragraph;
        }

        function getFounderNote() {
            const paragraph = getWarmBakeryParagraph();
            return paragraph.length > 220 ? DEFAULT_FOUNDER_NOTE : paragraph;
        }

        function getPickupAvailabilityCopy(city) {
            if (!city || /^your city$/i.test(String(city).trim())) {
                return "Pickup slots are shared after your design and preferred timing are confirmed.";
            }

            return `Pickup is available by pre-arranged time once your ${city} order is confirmed.`;
        }

        function getNoticeHighlight(value) {
            const trimmedValue = String(value || "").trim();
            const match = trimmedValue.match(/(\d+\s*(?:to|-)\s*\d+\s*(?:hours?|days?)|\d+\s*(?:hours?|days?))/i);

            if (!match) {
                return "24 to 48 hrs";
            }

            return match[0]
                .replace(/\bhours?\b/i, "hrs")
                .replace(/\bdays?\b/i, "days");
        }

        function getShowcaseProducts() {
            const uniqueImages = new Set();
            const sortedProducts = [...getPublicProducts()].sort((left, right) => Number(right.featured) - Number(left.featured));

            return sortedProducts.reduce((products, product) => {
                const imageUrl = getProductImageSource(product);

                if (!imageUrl || uniqueImages.has(imageUrl)) {
                    return products;
                }

                uniqueImages.add(imageUrl);
                products.push({
                    ...product,
                    imageUrl
                });

                return products;
            }, []);
        }

        function getHomepageHeroSlides() {
            const slides = getShowcaseProducts().slice(0, 4).map((product) => ({
                id: product.slug,
                title: product.name || state.settings.brandName || DEFAULT_SETTINGS.brandName,
                description: product.shortDescription || "Freshly baked to order for special celebrations.",
                imageUrl: product.imageUrl || HERO_COLLAGE_FALLBACKS[0],
                alt: `${product.name || state.settings.brandName} cake by ${state.settings.brandName || DEFAULT_SETTINGS.brandName}`,
                ctaHref: createSitePageLink(`inquiry-model/?product=${encodeURIComponent(product.slug)}#contact`),
                ctaLabel: `Ask About ${product.name || "This Cake"}`
            }));

            while (slides.length < 4) {
                const fallbackIndex = slides.length % HERO_COLLAGE_FALLBACKS.length;
                slides.push({
                    id: `fallback-${slides.length}`,
                    title: state.settings.brandName || DEFAULT_SETTINGS.brandName,
                    description: getWarmBakeryParagraph(),
                    imageUrl: HERO_COLLAGE_FALLBACKS[fallbackIndex] || HERO_COLLAGE_FALLBACKS[0],
                    alt: `${state.settings.brandName || DEFAULT_SETTINGS.brandName} featured cake`,
                    ctaHref: createSitePageLink("inquiry-model/#contact"),
                    ctaLabel: "Ask About This Cake"
                });
            }

            return slides;
        }

        function stopHomeHeroAutoplay() {
            if (homeHeroAutoplayTimer) {
                clearTimeout(homeHeroAutoplayTimer);
                homeHeroAutoplayTimer = null;
            }
        }

        function canHomeHeroAutoplay() {
            return !reduceMotionQuery.matches && homeHeroPauseReasons.size === 0 && !document.hidden;
        }

        function scheduleHomeHeroAutoplay(delay = HOME_HERO_AUTOPLAY_DELAY) {
            stopHomeHeroAutoplay();

            if (!heroTrack || homeHeroSlides.length < 2 || !canHomeHeroAutoplay()) {
                return;
            }

            homeHeroAutoplayTimer = window.setTimeout(() => {
                setActiveHomeHeroSlide(activeHomeHeroSlideIndex + 1, { fromAutoplay: true });
                scheduleHomeHeroAutoplay();
            }, delay);
        }

        function pauseHomeHeroAutoplay(reason) {
            homeHeroPauseReasons.add(reason);
            if (homepageHero) {
                homepageHero.classList.add("is-paused");
            }
            stopHomeHeroAutoplay();
        }

        function resumeHomeHeroAutoplay(reason, delay = HOME_HERO_RESUME_DELAY) {
            homeHeroPauseReasons.delete(reason);
            if (homepageHero && homeHeroPauseReasons.size === 0) {
                homepageHero.classList.remove("is-paused");
            }
            scheduleHomeHeroAutoplay(delay);
        }

        function setActiveHomeHeroSlide(index, options = {}) {
            if (!heroTrack || !homeHeroSlides.length) {
                return;
            }

            activeHomeHeroSlideIndex = (index + homeHeroSlides.length) % homeHeroSlides.length;
            const slide = homeHeroSlides[activeHomeHeroSlideIndex];

            if (homepageHero) {
                homepageHero.style.setProperty("--active-slide", activeHomeHeroSlideIndex);
                homepageHero.classList.add("is-sliding");
            }
            if (heroCopy) {
                heroCopy.classList.add("is-changing");
            }

            heroTrack.style.transform = `translate3d(${activeHomeHeroSlideIndex * -100}%, 0, 0)`;
            heroTrack.querySelectorAll(".hero-slide").forEach((item, itemIndex) => {
                item.setAttribute("aria-hidden", itemIndex === activeHomeHeroSlideIndex ? "false" : "true");
            });

            if (homeHeroTitle) {
                homeHeroTitle.textContent = slide.title;
            }

            if (homeHeroDescription) {
                homeHeroDescription.textContent = slide.description;
            }

            if (homeHeroPrimaryCta) {
                homeHeroPrimaryCta.setAttribute("href", slide.ctaHref);
            }

            if (homeHeroPrimaryCtaLabel) {
                homeHeroPrimaryCtaLabel.textContent = slide.ctaLabel || "Ask About This Cake";
            }

            if (heroDots) {
                heroDots.querySelectorAll(".dot").forEach((dot, dotIndex) => {
                    const isActive = dotIndex === activeHomeHeroSlideIndex;
                    dot.classList.toggle("active", isActive);
                    if (isActive) {
                        dot.setAttribute("aria-current", "true");
                    } else {
                        dot.removeAttribute("aria-current");
                    }
                });
            }

            currentHeroImage = slide.imageUrl || DEFAULT_SOCIAL_IMAGE;

            if (!options.skipSeoRefresh) {
                applySeoMetadata();
            }

            window.setTimeout(() => {
                if (heroCopy) {
                    heroCopy.classList.remove("is-changing");
                }
                if (homepageHero) {
                    homepageHero.classList.remove("is-sliding");
                }
            }, 240);

            if (!options.fromAutoplay) {
                scheduleHomeHeroAutoplay(options.delay || HOME_HERO_RESUME_DELAY);
            }
        }

        function renderHomepageHeroCarousel() {
            if (!heroTrack) {
                return;
            }

            homeHeroSlides = getHomepageHeroSlides();

            heroTrack.innerHTML = homeHeroSlides.map((slide) => `
                <article class="hero-slide" aria-hidden="true">
                    <img src="${escapeHtml(slide.imageUrl)}" alt="${escapeHtml(slide.alt)}" loading="eager">
                </article>
            `).join("");

            if (heroDots) {
                heroDots.innerHTML = homeHeroSlides.map((slide, index) => `
                    <button
                        class="dot${index === activeHomeHeroSlideIndex ? " active" : ""}"
                        type="button"
                        data-hero-slide="${index}"
                        aria-label="Show ${escapeHtml(slide.title)}"
                        ${index === activeHomeHeroSlideIndex ? 'aria-current="true"' : ""}
                    ></button>
                `).join("");

                heroDots.querySelectorAll("[data-hero-slide]").forEach((dot) => {
                    dot.addEventListener("click", () => {
                        setActiveHomeHeroSlide(Number(dot.dataset.heroSlide), { delay: HOME_HERO_AUTOPLAY_DELAY });
                    });
                });
            }

            setActiveHomeHeroSlide(0, { skipSeoRefresh: true });
        }

        function applyHomepageMedia() {
            renderHomepageHeroCarousel();

            if (founderPortraitImage) {
                founderPortraitImage.src = FOUNDER_PORTRAIT_FALLBACK;
                founderPortraitImage.alt = `${DEFAULT_OWNER_NAME}, founder of ${state.settings.brandName || DEFAULT_SETTINGS.brandName}`;
            }
        }

        function personalizeDeliveryCopy(value, city) {
            const base = String(value || "").trim();

            if (!base) {
                return getContactLocationLabel(city);
            }

            if (!city) {
                return base
                    .replace(/\byour local area\b/gi, "your area")
                    .replace(/\byour city\b/gi, "your area");
            }

            return base
                .replace(/\byour local area\b/gi, city)
                .replace(/\byour area\b/gi, city)
                .replace(/\byour city\b/gi, city);
        }

        function getSettingText(key) {
            return state.settings[key] || DEFAULT_SETTINGS[key] || "";
        }

        function getSeoTitle() {
            const brandName = getSettingText("brandName");
            const city = String(state.settings.city || "").trim();
            const pathname = window.location.pathname || "/";

            if (pathname.startsWith("/menu")) {
                return `Menu | ${brandName}`;
            }

            if (pathname.startsWith("/inquiry-model")) {
                return `Inquiry Model Beta | ${brandName}`;
            }

            if (pathname.startsWith("/how-it-works")) {
                return `How It Works | ${brandName}`;
            }

            if (pathname.startsWith("/about")) {
                return `About | ${brandName}`;
            }

            if (pathname.startsWith("/reviews")) {
                return `Reviews | ${brandName}`;
            }

            if (pathname.startsWith("/cart")) {
                return `Inquiry Bag | ${brandName}`;
            }

            if (city && !/^your city$/i.test(city)) {
                return `${brandName} | Custom Cakes in ${city}`;
            }

            return `${brandName} | Custom Cakes for Birthdays and Celebrations`;
        }

        function getSeoDescription() {
            const brandName = getSettingText("brandName");
            const city = String(state.settings.city || "").trim();
            const deliveryCopy = personalizeDeliveryCopy(getSettingText("deliveryPickupCopy"), city).toLowerCase();
            const pathname = window.location.pathname || "/";

            if (pathname.startsWith("/menu")) {
                return `Browse featured and signature cakes from ${brandName}, then send an inquiry for flavor, size, and custom styling.`;
            }

            if (pathname.startsWith("/inquiry-model")) {
                return `Send a cake inquiry through the ${brandName} beta inquiry model, then receive manual pricing, availability, and pickup or delivery guidance.`;
            }

            if (pathname.startsWith("/how-it-works")) {
                return `Learn how ${brandName} handles custom cake inquiries, quotes, confirmation, pickup, and local delivery.`;
            }

            if (pathname.startsWith("/about")) {
                return `Meet ${brandName}, a founder-led home bakery by ${DEFAULT_OWNER_NAME} for custom celebration cakes.`;
            }

            if (pathname.startsWith("/reviews")) {
                return `Read published customer reviews for ${brandName} and custom celebration cake orders.`;
            }

            if (pathname.startsWith("/cart")) {
                return `Review cakes in your ${brandName} inquiry bag and send one combined quote request with no online payment.`;
            }

            if (city && !/^your city$/i.test(city)) {
                return `Order custom birthday, anniversary, baby shower, and celebration cakes from ${brandName} in ${city}. Inquiry-first home bakery with ${deliveryCopy}.`;
            }

            return `Order custom birthday, anniversary, baby shower, and celebration cakes from ${brandName}. Inquiry-first home bakery with pickup and local delivery.`;
        }

        function setMetaContent(selector, content) {
            const node = document.querySelector(selector);

            if (node && content) {
                node.setAttribute("content", content);
            }
        }

        function createOpeningHoursSpecification(days, opens, closes) {
            if (!opens || !closes) {
                return null;
            }

            return {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: days,
                opens,
                closes
            };
        }

        function applyStructuredData() {
            if (!structuredDataScript) {
                return;
            }

            const brandName = getSettingText("brandName");
            const phone = getSettingText("contactPhone");
            const email = getSettingText("contactEmail");
            const instagramHandle = getSettingText("instagramHandle");
            const city = String(state.settings.city || "").trim();
            const addressLine1 = String(state.settings.addressLine1 || "").trim();
            const addressLine2 = String(state.settings.addressLine2 || "").trim();
            const stateRegion = String(state.settings.stateRegion || "").trim();
            const postalCode = String(state.settings.postalCode || "").trim();
            const countryCode = String(state.settings.countryCode || "").trim() || "IN";
            const description = getSeoDescription();
            const sameAs = [];
            const openingHoursSpecification = [
                createOpeningHoursSpecification(
                    [
                        "https://schema.org/Monday",
                        "https://schema.org/Tuesday",
                        "https://schema.org/Wednesday",
                        "https://schema.org/Thursday",
                        "https://schema.org/Friday"
                    ],
                    state.settings.weekdayOpenTime || "",
                    state.settings.weekdayCloseTime || ""
                ),
                createOpeningHoursSpecification(
                    ["https://schema.org/Saturday"],
                    state.settings.saturdayOpenTime || "",
                    state.settings.saturdayCloseTime || ""
                ),
                createOpeningHoursSpecification(
                    ["https://schema.org/Sunday"],
                    state.settings.sundayOpenTime || "",
                    state.settings.sundayCloseTime || ""
                )
            ].filter(Boolean);

            if (instagramHandle) {
                sameAs.push(createInstagramLink(instagramHandle));
            }

            if (DEFAULT_FACEBOOK_URL) {
                sameAs.push(DEFAULT_FACEBOOK_URL);
            }

            const bakeryEntity = {
                "@type": "Bakery",
                "@id": `${SITE_URL}#bakery`,
                name: brandName,
                url: SITE_URL,
                description,
                image: currentHeroImage || DEFAULT_SOCIAL_IMAGE,
                telephone: phone,
                email,
                sameAs,
                areaServed: city && !/^your city$/i.test(city)
                    ? city
                    : (stateRegion || "India")
            };

            if (openingHoursSpecification.length) {
                bakeryEntity.openingHoursSpecification = openingHoursSpecification;
            }

            if (addressLine1 || addressLine2 || (city && !/^your city$/i.test(city)) || stateRegion || postalCode) {
                bakeryEntity.address = {
                    "@type": "PostalAddress",
                    streetAddress: [addressLine1, addressLine2].filter(Boolean).join(", ") || undefined,
                    addressLocality: city && !/^your city$/i.test(city) ? city : undefined,
                    addressRegion: stateRegion || undefined,
                    postalCode: postalCode || undefined,
                    addressCountry: countryCode
                };
            }

            structuredDataScript.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "WebSite",
                        "@id": `${SITE_URL}#website`,
                        url: SITE_URL,
                        name: brandName
                    },
                    bakeryEntity
                ]
            }, null, 2);
        }

        function applySeoMetadata() {
            const title = getSeoTitle();
            const description = getSeoDescription();

            document.title = title;
            setMetaContent('meta[name="description"]', description);
            setMetaContent('meta[property="og:title"]', title);
            setMetaContent('meta[property="og:description"]', description);
            setMetaContent('meta[property="og:url"]', getCurrentCanonicalUrl());
            setMetaContent('meta[property="og:image"]', currentHeroImage || DEFAULT_SOCIAL_IMAGE);
            setMetaContent('meta[name="twitter:title"]', title);
            setMetaContent('meta[name="twitter:description"]', description);
            setMetaContent('meta[name="twitter:image"]', currentHeroImage || DEFAULT_SOCIAL_IMAGE);

            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.setAttribute("href", getCurrentCanonicalUrl());
            }

            applyStructuredData();
        }

        function applySettings() {
            document.querySelectorAll("[data-brand-name]").forEach((node) => {
                node.textContent = state.settings.brandName || DEFAULT_SETTINGS.brandName;
            });

            document.querySelectorAll("[data-contact-phone]").forEach((node) => {
                node.textContent = state.settings.contactPhone || DEFAULT_SETTINGS.contactPhone;
            });

            document.querySelectorAll("[data-contact-email]").forEach((node) => {
                node.textContent = state.settings.contactEmail || DEFAULT_SETTINGS.contactEmail;
            });

            document.querySelectorAll("[data-instagram-handle]").forEach((node) => {
                node.textContent = state.settings.instagramHandle || DEFAULT_SETTINGS.instagramHandle;
            });

            if (heroCityLabel) {
                heroCityLabel.textContent = getHeroCityLabel(state.settings.city || "");
            }

            const deliveryCopy = personalizeDeliveryCopy(getSettingText("deliveryPickupCopy"), state.settings.city || "");

            if (heroDeliveryPickupCopy) {
                heroDeliveryPickupCopy.textContent = deliveryCopy;
            }

            if (noticePeriodCopy) {
                noticePeriodCopy.textContent = getSettingText("noticePeriodCopy");
            }

            if (heroNoticeHighlight) {
                heroNoticeHighlight.textContent = getNoticeHighlight(getSettingText("noticePeriodCopy"));
            }

            if (contactLocationText) {
                contactLocationText.textContent = deliveryCopy || getContactLocationLabel(state.settings.city || "");
            }

            if (footerLocationText) {
                footerLocationText.textContent = deliveryCopy || (state.settings.city
                    ? `Local delivery and pickup in ${state.settings.city}`
                    : "Local delivery and pickup available");
            }

            if (bakeryIntroTitle) {
                bakeryIntroTitle.textContent = getSettingText("bakeryIntroTitle");
            }

            if (bakeryIntroParagraph1) {
                bakeryIntroParagraph1.textContent = getSettingText("bakeryIntroParagraph1");
            }

            if (bakeryIntroParagraph2) {
                bakeryIntroParagraph2.textContent = getWarmBakeryParagraph();
            }

            if (founderNoteText) {
                founderNoteText.textContent = getFounderNote();
            }

            if (responseTimeCopy) {
                responseTimeCopy.textContent = getSettingText("responseTimeCopy");
            }

            if (supportResponseTimeCopy) {
                supportResponseTimeCopy.textContent = getSettingText("responseTimeCopy");
            }

            if (serviceAreaDeliveryCopy) {
                serviceAreaDeliveryCopy.textContent = deliveryCopy || getContactLocationLabel(state.settings.city || "");
            }

            if (serviceAreaPickupCopy) {
                serviceAreaPickupCopy.textContent = getPickupAvailabilityCopy(state.settings.city || "");
            }

            if (serviceAreaNoticeCopy) {
                serviceAreaNoticeCopy.textContent = getSettingText("noticePeriodCopy");
            }

            document.querySelectorAll("[data-whatsapp-link], a[href^='https://wa.me/']").forEach((link) => {
                link.setAttribute("href", createWhatsAppLink(state.settings.contactPhone));
            });

            document.querySelectorAll("[data-instagram-link], a[href^='https://instagram.com']").forEach((link) => {
                link.setAttribute("href", createInstagramLink(state.settings.instagramHandle || DEFAULT_INSTAGRAM_URL));
            });

            document.querySelectorAll("[data-facebook-link]").forEach((link) => {
                link.setAttribute("href", DEFAULT_FACEBOOK_URL);
            });

            document.querySelectorAll("[data-email-link], a[href^='mailto:']").forEach((link) => {
                link.setAttribute("href", `mailto:${state.settings.contactEmail || DEFAULT_SETTINGS.contactEmail}`);
            });

            document.querySelectorAll("[data-track-link]").forEach((link) => {
                link.setAttribute("href", createTrackLink());
            });

            applyHomepageMedia();
            renderFeaturedSpotlight();
            applySeoMetadata();
            updateCartWhatsAppLink();
        }

        function setFormStatus(message, type = "info") {
            if (!formStatus) {
                return;
            }

            formStatus.textContent = message;
            formStatus.className = "form-status";

            if (type !== "info") {
                formStatus.classList.add(type);
            }

            if (type !== "success" && referenceCard) {
                referenceCard.hidden = true;
            }
        }

        function setSubmitBusy(busy) {
            if (!submitInquiryButton) {
                return;
            }

            submitInquiryButton.disabled = busy || !state.products.length;
            submitInquiryButton.innerHTML = busy
                ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending inquiry...'
                : '<i class="fa-solid fa-paper-plane"></i> Send inquiry';
        }

        async function loadSettings() {
            try {
                const payload = await apiRequest("/api/settings/public");
                state.settings = {
                    ...DEFAULT_SETTINGS,
                    ...(payload?.settings || {})
                };
                state.settingsResolved = true;
            } catch (error) {
                console.warn("Settings fallback in use:", error.message);
            }

            applySettings();
            updateRequestPreview();
        }

        async function loadProducts() {
            state.productsStatus = "loading";
            renderProducts();

            try {
                const payload = await apiRequest("/api/products");
                state.products = Array.isArray(payload?.products) ? payload.products.map(mapProduct) : [];
                state.productsStatus = "ready";
            } catch (error) {
                console.error("Product load failed:", error);
                state.products = [];
                state.productsStatus = "error";
            }

            renderProducts();
            renderCartPage();
            populateProductOptions();
            applyHomepageMedia();

            const selectableProducts = getPublicProducts();

            if (selectableProducts.length && cakeProduct) {
                cakeProduct.value = selectableProducts[0].slug;
            }

            applyRequestedProductFromUrl();
            syncProductFields();
            observeRevealItems(menuGrid || document);
        }

        async function loadTestimonials() {
            try {
                const payload = await apiRequest("/api/testimonials");
                state.testimonials = Array.isArray(payload?.testimonials) && payload.testimonials.length
                    ? payload.testimonials
                    : [];
            } catch (error) {
                console.warn("Testimonials fallback in use:", error.message);
                state.testimonials = [];
            }

            renderTestimonials();
        }

        async function handleInquirySubmit(event) {
            event.preventDefault();

            if (!state.products.length) {
                setFormStatus("The live catalogue is not ready yet. Please try again in a moment or continue on WhatsApp.", "error");
                return;
            }

            const payload = buildRequestPayload();

            if (!payload.customerName || !payload.customerPhone || !payload.productId) {
                setFormStatus("Please add your name, phone number, and selected cake before sending the inquiry.", "error");
                return;
            }

            if (!isValidInquiryPhone(payload.customerPhone)) {
                setFormStatus("Please enter a valid phone or WhatsApp number.", "error");
                return;
            }

            if (!isValidInquiryEmail(payload.customerEmail)) {
                setFormStatus("Please enter a valid email address or leave it blank.", "error");
                return;
            }

            if (payload.website) {
                setFormStatus("Inquiry could not be submitted. Please refresh and try again.", "error");
                return;
            }

            setSubmitBusy(true);
            setFormStatus("Saving your inquiry to the bakery dashboard...");

            try {
                const response = await apiRequest("/api/order-requests", {
                    method: "POST",
                    body: payload
                });

                const referenceId = response?.orderRequest?.id;

                setFormStatus(
                    referenceId
                        ? `Inquiry sent successfully. Reference #${referenceId} was received, and we will follow up with pricing, availability, and pickup or delivery details.`
                        : "Inquiry sent successfully. We will review your details and follow up with pricing and next steps.",
                    "success"
                );

                if (referenceCard && referenceId) {
                    referenceCard.hidden = false;
                    trackReferenceLink.href = createTrackLink(referenceId);
                }

                requestPreview.textContent = JSON.stringify({
                    ok: true,
                    orderRequestId: referenceId || null,
                    persistence: response?.persistence || "database",
                    submittedPayload: payload
                }, null, 2);
            } catch (error) {
                setFormStatus(`${error.message} You can still continue on WhatsApp while we sort it out.`, "error");
                updateRequestPreview();
            } finally {
                setSubmitBusy(false);
            }
        }

        async function handleCartInquirySubmit(event) {
            event.preventDefault();

            const payload = buildCartInquiryPayload();

            if (!payload.cartItems.length) {
                setCartFormStatus("Add at least one cake to your bag before sending a cart inquiry.", "error");
                return;
            }

            if (!payload.customerName || !payload.customerPhone || !payload.productId) {
                setCartFormStatus("Please add your name, phone number, and at least one cake before sending the inquiry.", "error");
                return;
            }

            if (!isValidInquiryPhone(payload.customerPhone)) {
                setCartFormStatus("Please enter a valid phone or WhatsApp number.", "error");
                return;
            }

            if (!isValidInquiryEmail(payload.customerEmail)) {
                setCartFormStatus("Please enter a valid email address or leave it blank.", "error");
                return;
            }

            if (payload.website) {
                setCartFormStatus("Inquiry could not be submitted. Please refresh and try again.", "error");
                return;
            }

            setCartSubmitBusy(true);
            setCartFormStatus("Saving your cart inquiry to the bakery dashboard...");

            try {
                const response = await apiRequest("/api/order-requests", {
                    method: "POST",
                    body: payload
                });

                const referenceId = response?.orderRequest?.id;
                state.cartItems = [];
                state.cartSubmitted = true;
                writeStoredCartItems();
                updateCartCount();

                if (cartItemsList) {
                    cartItemsList.innerHTML = "";
                }

                if (cartEmptyState) {
                    cartEmptyState.hidden = false;
                    const emptyHeading = cartEmptyState.querySelector("h2");
                    const emptyCopy = cartEmptyState.querySelector("p");

                    if (emptyHeading) {
                        emptyHeading.textContent = "Your cart inquiry was sent.";
                    }

                    if (emptyCopy) {
                        emptyCopy.textContent = referenceId
                            ? `Reference #${referenceId} was saved for Pink Delight Cakes to review and quote.`
                            : "Your request was saved for Pink Delight Cakes to review and quote.";
                    }
                }

                if (cartEstimatedTotal) {
                    cartEstimatedTotal.textContent = "Inquiry sent";
                }

                if (clearCartButton) {
                    clearCartButton.disabled = true;
                }

                setCartFormStatus(
                    referenceId
                        ? `Cart inquiry sent successfully. Reference #${referenceId} was received, and we will follow up with final pricing and next steps.`
                        : "Cart inquiry sent successfully. We will review your bag and follow up with final pricing and next steps.",
                    "success"
                );

                if (cartReferenceCard && referenceId) {
                    cartReferenceCard.hidden = false;
                    cartTrackReferenceLink.href = createTrackLink(referenceId);
                }
            } catch (error) {
                setCartFormStatus(`${error.message} You can still continue on WhatsApp while we sort it out.`, "error");
                updateCartWhatsAppLink();
            } finally {
                setCartSubmitBusy(false);
            }
        }

        function applyRequestedProductFromUrl() {
            if (!cakeProduct) {
                return;
            }

            const requestedProduct = new URLSearchParams(window.location.search).get("product");

            if (!requestedProduct) {
                return;
            }

            const matchingProduct = getPublicProducts().find((product) => product.slug === requestedProduct);

            if (!matchingProduct) {
                return;
            }

            cakeProduct.value = matchingProduct.slug;
            syncProductFields();
        }

        if (orderForm) {
            orderForm.addEventListener("submit", handleInquirySubmit);
        }

        [customerName, customerPhone, customerEmail, cakeFlavor, cakeSize, fulfillment, addon, eventDate, requestNotes]
            .filter(Boolean)
            .forEach((element) => {
                element.addEventListener("change", updateRequestPreview);
                element.addEventListener("input", updateRequestPreview);
            });

        if (cakeProduct) {
            cakeProduct.addEventListener("change", syncProductFields);
        }

        if (updatePreviewButton) {
            updatePreviewButton.addEventListener("click", updateRequestPreview);
        }

        if (menuGrid) {
            menuGrid.addEventListener("click", (event) => {
                const addButton = event.target.closest("[data-add-to-cart]");

                if (addButton) {
                    const originalLabel = addButton.innerHTML;
                    const added = addProductToCart(addButton.dataset.addToCart);
                    addButton.innerHTML = added
                        ? `<i class="fa-solid fa-check"></i> Added to bag`
                        : `<i class="fa-solid fa-triangle-exclamation"></i> Bag is full`;
                    window.setTimeout(() => {
                        addButton.innerHTML = originalLabel;
                    }, 1400);
                    return;
                }

                const link = event.target.closest("[data-request-product]");

                if (!link || !cakeProduct) {
                    return;
                }

                cakeProduct.value = link.dataset.requestProduct;
                syncProductFields();
            });
        }

        if (cartItemsList) {
            cartItemsList.addEventListener("click", (event) => {
                const itemElement = getCartItemElement(event.target);

                if (!itemElement) {
                    return;
                }

                if (event.target.closest("[data-remove-cart-item]")) {
                    removeCartItem(itemElement.dataset.cartItemId);
                    return;
                }

                const quantityButton = event.target.closest("[data-quantity-step]");

                if (quantityButton) {
                    const item = state.cartItems.find((cartItem) => cartItem.id === itemElement.dataset.cartItemId);
                    const step = Number(quantityButton.dataset.quantityStep) || 0;
                    updateCartItemField(itemElement.dataset.cartItemId, "quantity", (Number(item?.quantity) || 1) + step);
                }
            });

            cartItemsList.addEventListener("change", (event) => {
                const field = event.target.closest("[data-cart-field]");
                const itemElement = getCartItemElement(event.target);

                if (!field || !itemElement) {
                    return;
                }

                updateCartItemField(itemElement.dataset.cartItemId, field.dataset.cartField, field.value);
            });
        }

        if (clearCartButton) {
            clearCartButton.addEventListener("click", clearCart);
        }

        if (cartInquiryForm) {
            cartInquiryForm.addEventListener("submit", handleCartInquirySubmit);
        }

        [cartCustomerName, cartCustomerPhone, cartCustomerEmail, cartEventDate, cartFulfillment, cartNotes]
            .filter(Boolean)
            .forEach((element) => {
                element.addEventListener("change", updateCartWhatsAppLink);
                element.addEventListener("input", updateCartWhatsAppLink);
            });

        if (menuCategoryFilters) {
            menuCategoryFilters.addEventListener("click", (event) => {
                const button = event.target.closest("[data-menu-category]");

                if (!button) {
                    return;
                }

                state.activeMenuCategory = button.dataset.menuCategory || "all";
                renderProducts();
                observeRevealItems(menuGrid);
            });
        }

        if (navToggle && siteNav) {
            navToggle.addEventListener("click", () => {
                const isOpen = siteNav.classList.toggle("active");
                navToggle.setAttribute("aria-expanded", String(isOpen));
            });

            siteNav.querySelectorAll("a").forEach((link) => {
                link.addEventListener("click", () => {
                    siteNav.classList.remove("active");
                    navToggle.setAttribute("aria-expanded", "false");
                });
            });
        }

        if (heroNextButton) {
            heroNextButton.addEventListener("click", () => {
                setActiveHomeHeroSlide(activeHomeHeroSlideIndex + 1);
            });
        }

        if (heroCarousel) {
            heroCarousel.addEventListener("pointerenter", () => pauseHomeHeroAutoplay("hover"));
            heroCarousel.addEventListener("pointerleave", () => {
                resumeHomeHeroAutoplay("hover");
            });
            heroCarousel.addEventListener("focusin", () => pauseHomeHeroAutoplay("focus"));
            heroCarousel.addEventListener("focusout", (event) => {
                if (heroCarousel.contains(event.relatedTarget)) {
                    return;
                }

                resumeHomeHeroAutoplay("focus");
            });
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                pauseHomeHeroAutoplay("hidden");
            } else {
                resumeHomeHeroAutoplay("hidden");
            }
        });

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18 });

        function observeRevealItems(scope = document) {
            if (!scope) {
                return;
            }

            scope.querySelectorAll(".reveal:not(.visible)").forEach((item) => {
                revealObserver.observe(item);
            });
        }

        async function init() {
            state.cartItems = readStoredCartItems();
            updateCartCount();
            applySettings();
            applyHomepageMedia();
            renderCatalogState("Loading the live cake catalogue...");
            renderCartPage();
            renderTestimonials();
            updateRequestPreview();
            observeRevealItems(document);

            await Promise.allSettled([
                loadSettings(),
                loadProducts(),
                loadTestimonials()
            ]);
        }

        init().catch((error) => {
            console.error("Public storefront boot failed:", error);
            state.productsStatus = "error";
            renderProducts();
            setFormStatus("The storefront could not finish loading. Please use the direct contact links for now.", "error");
        });
