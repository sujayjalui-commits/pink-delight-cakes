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

        const SITE_URL = resolveSiteUrl();
        const apiBase = resolveApiBaseUrl();
        const trackForm = document.getElementById("trackForm");
        const referenceId = document.getElementById("referenceId");
        const phoneNumber = document.getElementById("phoneNumber");
        const trackButton = document.getElementById("trackButton");
        const lookupStatus = document.getElementById("lookupStatus");
        const statusPanel = document.getElementById("statusPanel");
        const statusReferenceLabel = document.getElementById("statusReferenceLabel");
        const statusHeading = document.getElementById("statusHeading");
        const statusMessage = document.getElementById("statusMessage");
        const statusProductName = document.getElementById("statusProductName");
        const statusEventDate = document.getElementById("statusEventDate");
        const statusFulfillment = document.getElementById("statusFulfillment");
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
            statusReferenceLabel.textContent = `Reference #${order.id}`;
            statusHeading.textContent = order.statusLabel;
            statusMessage.textContent = order.statusMessage;
            statusProductName.textContent = order.productName || "Custom cake request";
            statusEventDate.textContent = formatDate(order.eventDate);
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
                order.productName ? `Cake: ${order.productName}` : "",
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
                return;
            }

            if (!isValidPhoneNumber(phoneValue)) {
                setLookupStatus("Please enter the same phone or WhatsApp number used in your inquiry.", "error");
                statusPanel.hidden = true;
                return;
            }

            setBusy(true);
            setLookupStatus("Checking the latest bakery update...");

            try {
                const payload = await apiRequest(`/api/order-requests/lookup?referenceId=${encodeURIComponent(referenceValue)}&phone=${encodeURIComponent(phoneValue)}`);
                applyLookupResult(payload.orderRequest);
                setLookupStatus("Inquiry found successfully. The latest update is shown below.", "success");
                history.replaceState(null, "", `${SITE_URL}track/?reference=${encodeURIComponent(referenceValue)}`);
            } catch (error) {
                statusPanel.hidden = true;
                setLookupStatus(`${error.message} If you still need help, message the bakery directly on WhatsApp and mention your reference number.`, "error");
            } finally {
                setBusy(false);
            }
        }

        trackForm.addEventListener("submit", handleTrackSubmit);
        whatsAppSupportLink.href = createWhatsAppLink(DEFAULT_PHONE, "Hi Pink Delight Cakes, I need help with an existing inquiry.");

        const detailCards = document.querySelectorAll(".details-grid .detail-card strong");
        if (detailCards[1]) {
            detailCards[1].textContent = "What you'll see";
        }

        const query = new URLSearchParams(window.location.search);
        const presetReference = query.get("reference");

        if (presetReference) {
            referenceId.value = presetReference;
        }
