import { apiConfig } from "./src/config/api-config.js";
import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  handleAdminSetup,
  handleCreateAdminProduct,
  handleGetAdminOrderById,
  handleGetAdminOrders,
  handleGetAdminProductById,
  handleGetAdminProducts,
  handleGetAdminSettings,
  handleUpdateAdminOrder,
  handleUpdateAdminProduct,
  handleUpdateAdminSettings
} from "./src/controllers/admin-controller.js";
import {
  handleCreateOrderRequest,
  handleGetProductBySlug,
  handleGetProducts,
  handleGetSettings,
  handleLookupOrderRequest
} from "./src/controllers/public-controller.js";
import { adminRoutes } from "./src/routes/admin-routes.js";
import { systemRoutes } from "./src/routes/system-routes.js";
import { publicRoutes } from "./src/routes/public-routes.js";
import { getBootstrapSummary } from "./src/services/bootstrap-service.js";
import { createRequestMonitoringContext, reportMonitoringEvent } from "./src/services/monitoring-service.js";
import { createJsonResponse, createNotFoundResponse, createPreflightResponse, normalizePathname, parseRequestUrl, withCors } from "./src/utils/http.js";

function createMetaPayload() {
  return {
    service: apiConfig.serviceName,
    version: apiConfig.version,
    phase: "phase-3-admin-auth-and-management",
    modules: [
      "config",
      "database",
      "shared-schemas",
      "seed-data",
      "worker-routing",
      "public-catalog",
      "order-request-submission",
      "admin-auth",
      "admin-products",
      "admin-orders"
    ]
  };
}

export default {
  async fetch(request, env, executionCtx) {
    try {
      const { pathname: rawPathname } = parseRequestUrl(request.url);
      const pathname = normalizePathname(rawPathname);
      const method = request.method.toUpperCase();

      if (method === "OPTIONS") {
        return createPreflightResponse(request, env);
      }

      if (pathname === "/health" || pathname === systemRoutes.health) {
        return withCors(createJsonResponse({
          ok: true,
          service: apiConfig.serviceName,
          databaseBound: Boolean(env.DB)
        }), request, env);
      }

      if (pathname === systemRoutes.meta) {
        return withCors(createJsonResponse(createMetaPayload()), request, env);
      }

      if (pathname === systemRoutes.bootstrap) {
        return withCors(createJsonResponse(getBootstrapSummary()), request, env);
      }

      if (pathname === publicRoutes.products && method === "GET") {
        return withCors(await handleGetProducts(env), request, env);
      }

      if (pathname.startsWith(`${publicRoutes.products}/`) && method === "GET") {
        const slug = pathname.replace(`${publicRoutes.products}/`, "");
        return withCors(await handleGetProductBySlug(env, slug), request, env);
      }

      if (pathname === publicRoutes.settings && method === "GET") {
        return withCors(await handleGetSettings(env), request, env);
      }

      if (pathname === publicRoutes.orderRequests && method === "POST") {
        return withCors(await handleCreateOrderRequest(request, env, executionCtx), request, env);
      }

      if (pathname === publicRoutes.orderRequestLookup && method === "GET") {
        return withCors(await handleLookupOrderRequest(request, env), request, env);
      }

      if (pathname === adminRoutes.setup && method === "POST") {
        return withCors(await handleAdminSetup(request, env), request, env);
      }

      if (pathname === adminRoutes.login && method === "POST") {
        return withCors(await handleAdminLogin(request, env), request, env);
      }

      if (pathname === adminRoutes.logout && method === "POST") {
        return withCors(await handleAdminLogout(request), request, env);
      }

      if (pathname === adminRoutes.session && method === "GET") {
        return withCors(await handleAdminSession(request, env), request, env);
      }

      if (pathname === adminRoutes.products && method === "GET") {
        return withCors(await handleGetAdminProducts(request, env), request, env);
      }

      if (pathname === adminRoutes.products && method === "POST") {
        return withCors(await handleCreateAdminProduct(request, env), request, env);
      }

      if (pathname.startsWith(`${adminRoutes.products}/`) && method === "GET") {
        const productId = pathname.replace(`${adminRoutes.products}/`, "");
        return withCors(await handleGetAdminProductById(request, env, productId), request, env);
      }

      if (pathname.startsWith(`${adminRoutes.products}/`) && method === "PATCH") {
        const productId = pathname.replace(`${adminRoutes.products}/`, "");
        return withCors(await handleUpdateAdminProduct(request, env, productId), request, env);
      }

      if (pathname === adminRoutes.orders && method === "GET") {
        return withCors(await handleGetAdminOrders(request, env), request, env);
      }

      if (pathname === adminRoutes.settings && method === "GET") {
        return withCors(await handleGetAdminSettings(request, env), request, env);
      }

      if (pathname === adminRoutes.settings && method === "PATCH") {
        return withCors(await handleUpdateAdminSettings(request, env), request, env);
      }

      if (pathname.startsWith(`${adminRoutes.orders}/`) && method === "GET") {
        const orderId = pathname.replace(`${adminRoutes.orders}/`, "");
        return withCors(await handleGetAdminOrderById(request, env, orderId), request, env);
      }

      if (pathname.startsWith(`${adminRoutes.orders}/`) && method === "PATCH") {
        const orderId = pathname.replace(`${adminRoutes.orders}/`, "");
        return withCors(await handleUpdateAdminOrder(request, env, orderId), request, env);
      }

      return withCors(createNotFoundResponse(pathname), request, env);
    } catch (error) {
      reportMonitoringEvent(env, {
        level: "error",
        event: "worker.unhandled_exception",
        message: "Unhandled worker exception",
        request: createRequestMonitoringContext(request),
        error: {
          message: error instanceof Error ? error.message : String(error)
        },
        forceAlert: true
      }, executionCtx);

      return withCors(createJsonResponse(
        {
          ok: false,
          error: "Unhandled worker exception",
          details: [error instanceof Error ? error.message : String(error)]
        },
        500
      ), request, env);
    }
  }
};
