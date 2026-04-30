import * as Sentry from "@sentry/cloudflare";

function scrubUrl(value) {
  const input = String(value || "").trim();

  if (!input) {
    return "";
  }

  try {
    const parsed = new URL(input);
    parsed.search = "";
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return input.split("?")[0];
  }
}

function scrubBreadcrumbs(breadcrumbs = []) {
  return breadcrumbs.slice(0, 20).map((breadcrumb) => ({
    ...breadcrumb,
    message: typeof breadcrumb?.message === "string"
      ? breadcrumb.message.slice(0, 240)
      : breadcrumb?.message,
    data: undefined
  }));
}

function scrubEvent(event) {
  if (!event) {
    return event;
  }

  if (event.request) {
    event.request = {
      method: event.request.method,
      url: scrubUrl(event.request.url)
    };
  }

  delete event.user;

  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = scrubBreadcrumbs(event.breadcrumbs);
  }

  return event;
}

function applyMonitoringScope(scope, payload = {}) {
  scope.setTag("service", "pink-delight-cakes-api");

  if (payload.event) {
    scope.setTag("event", payload.event);
  }

  if (payload.level) {
    scope.setLevel(payload.level);
  }

  if (payload.request) {
    scope.setContext("request", payload.request);
  }

  if (payload.inquiry) {
    scope.setContext("inquiry", payload.inquiry);
  }

  if (payload.details !== undefined) {
    scope.setContext("details", Array.isArray(payload.details) ? {
      items: payload.details.slice(0, 8)
    } : payload.details);
  }

  if (payload.error?.message) {
    scope.setContext("reported_error", {
      message: payload.error.message
    });
  }

  if (payload.message) {
    scope.setExtra("monitoring_message", payload.message);
  }
}

function scheduleFlush(executionCtx) {
  if (!executionCtx?.waitUntil) {
    return;
  }

  executionCtx.waitUntil(Sentry.flush(2000).catch(() => false));
}

export function isSentryEnabled(env) {
  return Boolean(String(env?.SENTRY_DSN || "").trim());
}

export function createSentryOptions(env) {
  const dsn = String(env?.SENTRY_DSN || "").trim();

  return {
    enabled: Boolean(dsn),
    dsn,
    environment: String(env?.MONITORING_ENVIRONMENT || "production"),
    release: String(env?.SENTRY_RELEASE || "pink-delight-cakes-api@0.1.0"),
    sampleRate: 1.0,
    attachStacktrace: true,
    sendDefaultPii: false,
    beforeSend(event) {
      return scrubEvent(event);
    }
  };
}

export function captureMonitoringException(env, error, payload = {}, executionCtx) {
  if (!isSentryEnabled(env) || !error) {
    return;
  }

  Sentry.withScope((scope) => {
    applyMonitoringScope(scope, payload);
    Sentry.captureException(error);
  });

  scheduleFlush(executionCtx);
}

export function captureMonitoringMessage(env, payload = {}, executionCtx) {
  if (!isSentryEnabled(env)) {
    return;
  }

  Sentry.withScope((scope) => {
    applyMonitoringScope(scope, payload);
    Sentry.captureMessage(payload.message || payload.event || "Monitoring event");
  });

  scheduleFlush(executionCtx);
}
