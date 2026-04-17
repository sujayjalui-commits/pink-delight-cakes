function isRuntimePlaceholder(value) {
  return /^__.+__$/.test(String(value || "").trim());
}

function getProxyTarget(env) {
  const rawValue = String(env.API_PROXY_TARGET || "").trim();

  if (!rawValue || isRuntimePlaceholder(rawValue)) {
    return "";
  }

  try {
    return new URL(rawValue).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function createJsonResponse(payload, status) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function buildUpstreamHeaders(request) {
  const headers = new Headers(request.headers);
  const requestUrl = new URL(request.url);

  headers.delete("host");
  headers.delete("origin");
  headers.set("x-forwarded-host", requestUrl.host);
  headers.set("x-forwarded-proto", requestUrl.protocol.replace(":", ""));

  return headers;
}

function buildUpstreamUrl(requestUrl, proxyTarget) {
  const incomingUrl = new URL(requestUrl);
  const upstreamUrl = new URL(proxyTarget);

  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;

  return upstreamUrl.toString();
}

export async function onRequest(context) {
  const proxyTarget = getProxyTarget(context.env);

  if (!proxyTarget) {
    return createJsonResponse({
      ok: false,
      error: "API proxy target is not configured"
    }, 500);
  }

  const upstreamUrl = buildUpstreamUrl(context.request.url, proxyTarget);
  const requestMethod = context.request.method.toUpperCase();

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: requestMethod,
      headers: buildUpstreamHeaders(context.request),
      body: requestMethod === "GET" || requestMethod === "HEAD" ? undefined : context.request.body,
      redirect: "manual"
    });
  } catch {
    return createJsonResponse({
      ok: false,
      error: "The upstream API could not be reached"
    }, 502);
  }

  const headers = new Headers(upstreamResponse.headers);

  headers.delete("access-control-allow-origin");
  headers.delete("access-control-allow-credentials");
  headers.delete("access-control-allow-headers");
  headers.delete("access-control-allow-methods");
  headers.delete("access-control-max-age");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers
  });
}
