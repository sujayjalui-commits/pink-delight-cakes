const RUNTIME_PUBLIC_SITE_URL = "__PUBLIC_SITE_URL__";
        const RUNTIME_ADMIN_SITE_URL = "__ADMIN_SITE_URL__";
        const RUNTIME_API_BASE_URL = "__API_BASE_URL__";
        const DEFAULT_SOCIAL_IMAGE = "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80";
        const DEFAULT_OWNER_NAME = "Pinky Sangoi";
        const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/PinkDelightCake?mibextid=ZbWKwL";
        const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/pinkdelightcake/profilecard/?igsh=MWM1dmFhY2VzOGVvaw==";
        const HERO_COLLAGE_FALLBACKS = [
            "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1562777717-b6aff3afac0f?auto=format&fit=crop&w=900&q=80"
        ];
        const FOUNDER_PORTRAIT_FALLBACK = "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1100&q=80";
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
            productsStatus: "loading"
        };

        const apiBase = resolveApiBaseUrl();
        const menuGrid = document.getElementById("menuGrid");
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
        const heroMainImage = document.getElementById("heroMainImage");
        const heroDetailImageOne = document.getElementById("heroDetailImageOne");
        const heroDetailImageTwo = document.getElementById("heroDetailImageTwo");
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

        function getApiUrl(pathname) {
            return `${apiBase}${pathname}`;
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
                imageUrl: product.imageUrl || PRODUCT_IMAGE_FALLBACKS[product.slug] || PRODUCT_IMAGE_FALLBACKS.default,
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
            return state.products.find((product) => product.slug === cakeProduct.value) || state.products[0] || null;
        }

        function getSelectedSize(product) {
            return product?.sizes.find((size) => size.label === cakeSize.value) || product?.sizes[0] || null;
        }

        function formatSizeText(size) {
            if (!size) return "Custom size";
            return size.servings ? `${size.label} (${size.servings} servings)` : size.label;
        }

        function renderCatalogState(message) {
            menuGrid.innerHTML = `<div class="menu-state">${escapeHtml(message)}</div>`;
        }

        function renderProducts() {
            if (state.productsStatus === "loading") {
                renderCatalogState("Loading the live cake catalogue...");
                return;
            }

            if (state.productsStatus === "error") {
                renderCatalogState("We could not load the live catalogue right now. You can still reach us directly on WhatsApp while we retry.");
                return;
            }

            if (!state.products.length) {
                renderCatalogState("No products are published in the live catalogue yet. Please check back soon or message us directly for a custom cake.");
                return;
            }

            menuGrid.innerHTML = state.products.map((product) => `
                <article class="menu-card reveal">
                    <div class="menu-image">
                        <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.alt)}" loading="lazy">
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
                        <a class="btn btn-secondary" href="#contact" data-request-product="${escapeHtml(product.slug)}">Request this product</a>
                    </div>
                </article>
            `).join("");
        }

        function renderTestimonials() {
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
            cakeProduct.disabled = !enabled;
            cakeFlavor.disabled = !enabled;
            cakeSize.disabled = !enabled;
            addon.disabled = !enabled;
            fulfillment.disabled = !enabled;
            submitInquiryButton.disabled = !enabled;
        }

        function populateProductOptions() {
            if (!state.products.length) {
                cakeProduct.innerHTML = `<option value="">No live products available</option>`;
                cakeFlavor.innerHTML = `<option value="">Waiting for products</option>`;
                cakeSize.innerHTML = `<option value="">Waiting for products</option>`;
                addon.innerHTML = `<option value="">Waiting for products</option>`;
                setInquiryEnabled(false);
                return;
            }

            cakeProduct.innerHTML = state.products.map((product) => `
                <option value="${escapeHtml(product.slug)}">${escapeHtml(product.name)}</option>
            `).join("");
            setInquiryEnabled(true);
        }

        function syncProductFields() {
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
                return "Founder-led home bakery";
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

        function updateShowcaseImage(node, src, alt) {
            if (!node || !src) {
                return;
            }

            node.src = src;
            node.alt = alt;
        }

        function getShowcaseProducts() {
            const uniqueImages = new Set();
            const sortedProducts = [...state.products].sort((left, right) => Number(right.featured) - Number(left.featured));

            return sortedProducts.filter((product) => {
                if (!product.imageUrl || uniqueImages.has(product.imageUrl)) {
                    return false;
                }

                uniqueImages.add(product.imageUrl);
                return true;
            });
        }

        function applyHomepageMedia() {
            const showcaseProducts = getShowcaseProducts();
            const mediaItems = showcaseProducts.slice(0, 3);

            while (mediaItems.length < 3) {
                mediaItems.push({
                    imageUrl: HERO_COLLAGE_FALLBACKS[mediaItems.length] || HERO_COLLAGE_FALLBACKS[0],
                    name: state.settings.brandName || DEFAULT_SETTINGS.brandName
                });
            }

            updateShowcaseImage(
                heroMainImage,
                mediaItems[0].imageUrl || HERO_COLLAGE_FALLBACKS[0],
                `${mediaItems[0].name || state.settings.brandName} featured cake`
            );
            updateShowcaseImage(
                heroDetailImageOne,
                mediaItems[1].imageUrl || HERO_COLLAGE_FALLBACKS[1],
                `${mediaItems[1].name || state.settings.brandName} close-up`
            );
            updateShowcaseImage(
                heroDetailImageTwo,
                mediaItems[2].imageUrl || HERO_COLLAGE_FALLBACKS[2],
                `${mediaItems[2].name || state.settings.brandName} detail view`
            );

            currentHeroImage = heroMainImage?.src || DEFAULT_SOCIAL_IMAGE;

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

            if (city && !/^your city$/i.test(city)) {
                return `${brandName} | Custom Cakes in ${city}`;
            }

            return `${brandName} | Custom Cakes for Birthdays and Celebrations`;
        }

        function getSeoDescription() {
            const brandName = getSettingText("brandName");
            const city = String(state.settings.city || "").trim();
            const deliveryCopy = personalizeDeliveryCopy(getSettingText("deliveryPickupCopy"), city).toLowerCase();

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
            setMetaContent('meta[property="og:url"]', SITE_URL);
            setMetaContent('meta[property="og:image"]', currentHeroImage || DEFAULT_SOCIAL_IMAGE);
            setMetaContent('meta[name="twitter:title"]', title);
            setMetaContent('meta[name="twitter:description"]', description);
            setMetaContent('meta[name="twitter:image"]', currentHeroImage || DEFAULT_SOCIAL_IMAGE);

            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) {
                canonical.setAttribute("href", SITE_URL);
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

            heroCityLabel.textContent = getHeroCityLabel(state.settings.city || "");
            const deliveryCopy = personalizeDeliveryCopy(getSettingText("deliveryPickupCopy"), state.settings.city || "");

            heroDeliveryPickupCopy.textContent = deliveryCopy;
            noticePeriodCopy.textContent = getSettingText("noticePeriodCopy");
            heroNoticeHighlight.textContent = getNoticeHighlight(getSettingText("noticePeriodCopy"));
            contactLocationText.textContent = deliveryCopy || getContactLocationLabel(state.settings.city || "");
            footerLocationText.textContent = deliveryCopy || (state.settings.city
                ? `Local delivery and pickup in ${state.settings.city}`
                : "Local delivery and pickup available");
            bakeryIntroTitle.textContent = getSettingText("bakeryIntroTitle");
            bakeryIntroParagraph1.textContent = getSettingText("bakeryIntroParagraph1");
            bakeryIntroParagraph2.textContent = getWarmBakeryParagraph();
            founderNoteText.textContent = getFounderNote();
            responseTimeCopy.textContent = getSettingText("responseTimeCopy");
            supportResponseTimeCopy.textContent = getSettingText("responseTimeCopy");
            serviceAreaDeliveryCopy.textContent = deliveryCopy || getContactLocationLabel(state.settings.city || "");
            serviceAreaPickupCopy.textContent = getPickupAvailabilityCopy(state.settings.city || "");
            serviceAreaNoticeCopy.textContent = getSettingText("noticePeriodCopy");

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
            applySeoMetadata();
        }

        function setFormStatus(message, type = "info") {
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
            populateProductOptions();
            applyHomepageMedia();

            if (state.products.length) {
                cakeProduct.value = state.products[0].slug;
            }

            syncProductFields();
            observeRevealItems(menuGrid);
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

        orderForm.addEventListener("submit", handleInquirySubmit);

        [customerName, customerPhone, customerEmail, cakeFlavor, cakeSize, fulfillment, addon, eventDate, requestNotes].forEach((element) => {
            element.addEventListener("change", updateRequestPreview);
            element.addEventListener("input", updateRequestPreview);
        });

        cakeProduct.addEventListener("change", syncProductFields);
        updatePreviewButton.addEventListener("click", updateRequestPreview);
        menuGrid.addEventListener("click", (event) => {
            const link = event.target.closest("[data-request-product]");

            if (!link) {
                return;
            }

            cakeProduct.value = link.dataset.requestProduct;
            syncProductFields();
        });

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

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18 });

        function observeRevealItems(scope = document) {
            scope.querySelectorAll(".reveal:not(.visible)").forEach((item) => {
                revealObserver.observe(item);
            });
        }

        async function init() {
            applySettings();
            applyHomepageMedia();
            renderCatalogState("Loading the live cake catalogue...");
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
