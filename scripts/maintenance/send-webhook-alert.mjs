const webhookUrl = String(process.env.MONITORING_WEBHOOK_URL || "").trim();

if (!webhookUrl) {
  console.log("MONITORING_WEBHOOK_URL not set; skipping webhook alert.");
  process.exit(0);
}

const title = String(process.env.MONITORING_ALERT_TITLE || "Pink Delight Cakes alert").trim();
const body = String(process.env.MONITORING_ALERT_BODY || "No alert body provided.").trim();
const severity = String(process.env.MONITORING_ALERT_SEVERITY || "error").trim().toLowerCase();
const runUrl = String(process.env.GITHUB_RUN_URL || "").trim();
const message = [
  `[${severity.toUpperCase()}] ${title}`,
  body,
  runUrl ? `Run: ${runUrl}` : ""
].filter(Boolean).join("\n");

function createWebhookPayload(url) {
  if (/discord(?:app)?\.com\/api\/webhooks/i.test(url)) {
    return {
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ content: message })
    };
  }

  if (/hooks\.slack\.com/i.test(url)) {
    return {
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ text: message })
    };
  }

  return {
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      severity,
      title,
      body,
      runUrl
    })
  };
}

const payload = createWebhookPayload(webhookUrl);
const response = await fetch(webhookUrl, {
  method: "POST",
  headers: payload.headers,
  body: payload.body
});

if (!response.ok) {
  throw new Error(`Webhook alert failed with status ${response.status}`);
}

console.log("Webhook alert sent successfully.");
