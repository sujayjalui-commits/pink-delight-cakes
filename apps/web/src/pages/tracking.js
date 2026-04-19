const RUNTIME_PUBLIC_SITE_URL = "__PUBLIC_SITE_URL__";
        const RUNTIME_API_BASE_URL = "__API_BASE_URL__";
        const DEFAULT_PHONE = "+91 87678 12121";

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

        function resolveApiBaseUrl() {
            return (
                normalizeAbsoluteUrl(document.body.dataset.apiBase || "") ||
                normalizeAbsoluteUrl(RUNTIME_API_BASE_URL) ||
                normalizeAbsoluteUrl(deriveApiBaseFromLocation())
            ).replace(/\/$/, "");
        }

        function createWhatsAppLink(phone, message = "") {
            const digits = String(phone || DEFAULT_PHONE).replace(/\D/g, "");
            return message
                ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
                : `https://wa.me/${digits}`;
        }

        function isValidPhoneNumber(value) {
            const normalized = String(value || "").trim();
            const digitsOnly = normalized.replace(/\D/g, "");
            return /^[0-9+\-()\s]+$/.test(normalized) && digitsOnly.length >= 7 && digitsOnly.length <= 15;
        }

        function formatDate(value) {
            if (!value) {
                return "To be confirmed";
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
                return "Just now";
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

        function formatCurrency(value) {
            const amount = Number(value);

            if (!Number.isFinite(amount)) {
                return "";
            }

            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }).format(amount);
        }

        function formatFulfillment(value) {
            if (!value) {
                return "To be confirmed";
            }

            return value === "local_delivery" ? "Local delivery" : "Pickup";
        }

        function formatServingPlan(order) {
            return [order.sizeLabel, order.servings].filter(Boolean).join(" · ");
        }

        const SITE_URL = resolveSiteUrl();
        const apiBase = resolveApiBaseUrl();
        const trackForm = document.getElementById("trackForm");
        const referenceId = document.getElementById("referenceId");
        const phoneNumber = document.getElementById("phoneNumber");
        const trackButton = document.getElementById("trackButton");
        const lookupStatus = document.getElementById("lookupStatus");
        const recoveryPanel = document.getElementById("recoveryPanel");
        const recoveryTitle = document.getElementById("recoveryTitle");
        const recoveryMessage = document.getElementById("recoveryMessage");
        const recoveryWhatsAppLink = document.getElementById("recoveryWhatsAppLink");
        const recoveryWhatsAppLabel = document.getElementById("recoveryWhatsAppLabel");
        const statusPanel = document.getElementById("statusPanel");
        const statusReferenceLabel = document.getElementById("statusReferenceLabel");
        const statusHeading = document.getElementById("statusHeading");
        const statusMessage = document.getElementById("statusMessage");
        const statusConfidenceLabel = document.getElementById("statusConfidenceLabel");
        const statusConfidenceMessage = document.getElementById("statusConfidenceMessage");
        const statusProductName = document.getElementById("statusProductName");
        const statusEventDate = document.getElementById("statusEventDate");
        const statusTimingLabel = document.getElementById("statusTimingLabel");
        const statusFulfillment = document.getElementById("statusFulfillment");
        const statusFlavorCard = document.getElementById("statusFlavorCard");
        const statusFlavor = document.getElementById("statusFlavor");
        const statusServingCard = document.getElementById("statusServingCard");
        const statusServingPlan = document.getElementById("statusServingPlan");
        const statusAddOnCard = document.getElementById("statusAddOnCard");
        const statusAddOn = document.getElementById("statusAddOn");
        const statusUpdatedAt = document.getElementById("statusUpdatedAt");
        const statusCreatedAt = document.getElementById("statusCreatedAt");
        const statusQuotedAmountCard = document.getElementById("statusQuotedAmountCard");
        const statusQuotedAmount = document.getElementById("statusQuotedAmount");
        const nextStepTitle = document.getElementById("nextStepTitle");
        const nextStepMessage = document.getElementById("nextStepMessage");
        const customerActionTitle = document.getElementById("customerActionTitle");
        const customerActionMessage = document.getElementById("customerActionMessage");
        const bakeryActionTitle = document.getElementById("bakeryActionTitle");
        const bakeryActionMessage = document.getElementById("bakeryActionMessage");
        const followUpTitle = document.getElementById("followUpTitle");
        const followUpMessage = document.getElementById("followUpMessage");
        const timelineGrid = document.getElementById("timelineGrid");
        const whatsAppSupportLink = document.getElementById("whatsAppSupportLink");
        const statusWhatsAppLink = document.getElementById("statusWhatsAppLink");
        const statusWhatsAppLabel = document.getElementById("statusWhatsAppLabel");

        async function apiRequest(pathname) {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), 12000);

            try {
                const response = await fetch(`${apiBase}${pathname}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    signal: controller.signal
                });

                const text = await response.text();
                const payload = text ? JSON.parse(text) : null;

                if (!response.ok) {
                    throw new Error(payload?.error || `Request failed with status ${response.status}`);
                }

                return payload;
            } catch (error) {
                if (error.name === "AbortError") {
                    throw new Error("The bakery service took too long to respond.");
                }

                throw error;
            } finally {
                window.clearTimeout(timeoutId);
            }
        }

        function setLookupStatus(message, type = "info") {
            lookupStatus.textContent = message;
            lookupStatus.className = "form-status";

            if (type !== "info") {
                lookupStatus.classList.add(type);
            }
        }

        function setRecoveryState({ title, message, label, whatsappMessage }) {
            recoveryTitle.textContent = title;
            recoveryMessage.textContent = message;
            recoveryWhatsAppLabel.textContent = label;
            recoveryWhatsAppLink.href = createWhatsAppLink(DEFAULT_PHONE, whatsappMessage);
            recoveryPanel.hidden = false;
        }

        function hideRecoveryState() {
            recoveryPanel.hidden = true;
        }

        function setBusy(busy) {
            trackButton.disabled = busy;
            trackButton.innerHTML = busy
                ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Checking...'
                : '<i class="fa-solid fa-magnifying-glass"></i> Check inquiry status';
        }

        function renderTimeline(steps = []) {
            timelineGrid.innerHTML = steps.map((step) => `
                <div class="timeline-card state-${step.state}">
                    <strong>${step.title}</strong>
                    <span>${step.description}</span>
                    <div class="timeline-state">
                        <i class="fa-solid ${step.state === "completed" ? "fa-circle-check" : step.state === "current" ? "fa-hourglass-half" : step.state === "cancelled" ? "fa-circle-xmark" : "fa-circle"}"></i>
                        <span>${step.state === "completed" ? "Done" : step.state === "current" ? "Current" : step.state === "cancelled" ? "Unavailable" : "Upcoming"}</span>
                    </div>
                </div>
            `).join("");
        }

        function applyLookupResult(order) {
            hideRecoveryState();
            statusReferenceLabel.textContent = `Reference #${order.id}`;
            statusHeading.textContent = order.statusLabel;
            statusMessage.textContent = order.statusMessage;
            statusConfidenceLabel.textContent = order.confidenceLabel || "In progress";
            statusConfidenceMessage.textContent = order.confidenceMessage || "The bakery is actively working through this inquiry.";
            statusProductName.textContent = order.productName || "Custom cake request";
            statusEventDate.textContent = formatDate(order.eventDate);
            statusTimingLabel.textContent = order.timingLabel || "Date to be confirmed";
            statusFulfillment.textContent = formatFulfillment(order.fulfillmentType);
            statusUpdatedAt.textContent = formatDateTime(order.updatedAt || order.createdAt);
            statusCreatedAt.textContent = formatDateTime(order.createdAt);
            nextStepTitle.textContent = order.nextStepTitle || "Next step";
            nextStepMessage.textContent = order.nextStepMessage || "Please check back later for the next bakery update.";
            customerActionTitle.textContent = order.customerActionTitle || "What you can do now";
            customerActionMessage.textContent = order.customerActionMessage || "Keep this reference number handy in case you need to message the bakery.";
            bakeryActionTitle.textContent = order.bakeryActionTitle || "What the bakery is doing";
            bakeryActionMessage.textContent = order.bakeryActionMessage || "The bakery is still processing this inquiry.";
            followUpTitle.textContent = order.followUpTitle || "When to follow up";
            followUpMessage.textContent = order.followUpMessage || "Message the bakery if you need help or if the status looks unexpected.";
            statusPanel.className = `status-panel status-${order.statusTone || "active"}`;

            if (order.flavor) {
                statusFlavorCard.hidden = false;
                statusFlavor.textContent = order.flavor;
            } else {
                statusFlavorCard.hidden = true;
                statusFlavor.textContent = "-";
            }

            const servingPlan = formatServingPlan(order);
            if (servingPlan) {
                statusServingCard.hidden = false;
                statusServingPlan.textContent = servingPlan;
            } else {
                statusServingCard.hidden = true;
                statusServingPlan.textContent = "-";
            }

            if (order.addOn) {
                statusAddOnCard.hidden = false;
                statusAddOn.textContent = order.addOn;
            } else {
                statusAddOnCard.hidden = true;
                statusAddOn.textContent = "-";
            }

            if (order.quotedAmount !== null && order.quotedAmount !== undefined && order.quotedAmount !== "") {
                statusQuotedAmountCard.hidden = false;
                statusQuotedAmount.textContent = formatCurrency(order.quotedAmount);
            } else {
                statusQuotedAmountCard.hidden = true;
                statusQuotedAmount.textContent = "-";
            }

            renderTimeline(Array.isArray(order.timeline) ? order.timeline : []);

            const supportMessage = [
                `Hi Pink Delight Cakes, I want to ask about inquiry #${order.id}.`,
                `Current status shown: ${order.statusLabel}.`,
                order.supportIntent ? `I need help with: ${order.supportIntent}.` : "",
                order.productName ? `Cake: ${order.productName}` : "",
                order.flavor ? `Flavor: ${order.flavor}` : "",
                servingPlan ? `Size: ${servingPlan}` : "",
                order.addOn ? `Add-on: ${order.addOn}` : "",
                order.eventDate ? `Event date: ${order.eventDate}` : "",
                order.customerActionMessage ? `Help needed: ${order.customerActionMessage}` : ""
            ].filter(Boolean).join("\n");

            statusWhatsAppLabel.textContent = order.whatsAppCtaLabel || "Ask about this inquiry";
            statusWhatsAppLink.href = createWhatsAppLink(DEFAULT_PHONE, supportMessage);
            statusPanel.hidden = false;
        }

        async function handleTrackSubmit(event) {
            event.preventDefault();

            const referenceValue = referenceId.value.trim();
            const phoneValue = phoneNumber.value.trim();

            if (!/^\d+$/.test(referenceValue)) {
                setLookupStatus("Please enter a valid numeric reference number.", "error");
                statusPanel.hidden = true;
                setRecoveryState({
                    title: "Double-check the reference number",
                    message: "Reference numbers only use digits. If you still need help, message the bakery and mention the name used in the inquiry.",
                    label: "Ask for help on WhatsApp",
                    whatsappMessage: "Hi Pink Delight Cakes, I need help finding my inquiry because I may have the wrong reference number."
                });
                return;
            }

            if (!isValidPhoneNumber(phoneValue)) {
                setLookupStatus("Please enter the same phone or WhatsApp number used in your inquiry.", "error");
                statusPanel.hidden = true;
                setRecoveryState({
                    title: "Use the original phone number",
                    message: "The lookup only works with the same phone or WhatsApp number used in the original inquiry. If you changed numbers, ask the bakery to help match the request manually.",
                    label: "Message the bakery",
                    whatsappMessage: `Hi Pink Delight Cakes, I need help finding inquiry #${referenceValue} because I may be using a different phone number now.`
                });
                return;
            }

            setBusy(true);
            setLookupStatus("Checking the latest bakery update...");
            hideRecoveryState();

            try {
                const payload = await apiRequest(`/api/order-requests/lookup?referenceId=${encodeURIComponent(referenceValue)}&phone=${encodeURIComponent(phoneValue)}`);
                applyLookupResult(payload.orderRequest);
                setLookupStatus("Inquiry found successfully. The latest update is shown below.", "success");
                history.replaceState(null, "", `${SITE_URL}track/?reference=${encodeURIComponent(referenceValue)}`);
            } catch (error) {
                statusPanel.hidden = true;
                setLookupStatus(`${error.message} If you still need help, message the bakery directly on WhatsApp and mention your reference number.`, "error");

                const normalizedMessage = String(error.message || "").toLowerCase();
                if (normalizedMessage.includes("could not match")) {
                    setRecoveryState({
                        title: "We could not match those details",
                        message: "This usually means the phone number is different from the original inquiry or the reference number was typed incorrectly. If you need help quickly, message the bakery and mention the attempted reference.",
                        label: "Ask about this reference",
                        whatsappMessage: `Hi Pink Delight Cakes, I need help matching inquiry #${referenceValue}. I may have used a different phone number or copied the reference incorrectly.`
                    });
                } else if (normalizedMessage.includes("too long to respond")) {
                    setRecoveryState({
                        title: "The bakery service is taking too long",
                        message: "The tracking service did not respond in time. You can try again in a moment or message the bakery directly with your reference number.",
                        label: "Message the bakery now",
                        whatsappMessage: `Hi Pink Delight Cakes, the tracking page timed out while checking inquiry #${referenceValue}. Can you please help me with the latest update?`
                    });
                } else {
                    setRecoveryState({
                        title: "Need help with this inquiry?",
                        message: "If the tracker still does not work, message the bakery directly and include your reference number plus the phone number used in the inquiry.",
                        label: "Continue on WhatsApp",
                        whatsappMessage: `Hi Pink Delight Cakes, I need help checking inquiry #${referenceValue}. The tracking page did not work for me.`
                    });
                }
            } finally {
                setBusy(false);
            }
        }

        trackForm.addEventListener("submit", handleTrackSubmit);
        whatsAppSupportLink.href = createWhatsAppLink(DEFAULT_PHONE, "Hi Pink Delight Cakes, I need help with an existing inquiry.");
        hideRecoveryState();

        const detailCards = document.querySelectorAll(".details-grid .detail-card strong");
        if (detailCards[1]) {
            detailCards[1].textContent = "What you'll see";
        }

        const query = new URLSearchParams(window.location.search);
        const presetReference = query.get("reference");

        if (presetReference) {
            referenceId.value = presetReference;
        }
