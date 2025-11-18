import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { cors } from "hono/cors";

console.log("[Backend] Server starting with forgotPassword and resetPassword routes");

const app = new Hono();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "x-session-id"],
  credentials: false,
}));

app.onError((err, c) => {
  console.error("[Hono] Server error:", err);
  console.error("[Hono] Error stack:", err.stack);
  return c.json(
    {
      error: {
        message: err.message || "Internal server error",
      },
    },
    500
  );
});

app.all("/api/trpc/*", async (c, next) => {
  console.log("[Hono] Incoming tRPC request:", c.req.method, c.req.url);
  console.log("[Hono] Request path:", c.req.path);
  await next();
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC] Error in ${path}:`, error);
      console.error(`[tRPC] Error details:`, JSON.stringify(error, null, 2));
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api/test-router", (c) => {
  const routes = Object.keys(appRouter._def.procedures);
  console.log("[Hono] Available tRPC routes:", routes);
  return c.json({ 
    status: "ok", 
    message: "Router test",
    availableRoutes: routes
  });
});

app.notFound((c) => {
  console.log("[Hono] 404 Not Found:", c.req.url);
  return c.json({ error: "Not Found" }, 404);
});

export default app;
