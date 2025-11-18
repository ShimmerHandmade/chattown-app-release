import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import { db } from "../db";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const sessionId = opts.req.headers.get("x-session-id") || undefined;
  const user = sessionId ? await db.getUserBySession(sessionId) : null;

  return {
    req: opts.req,
    user,
    sessionId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.sessionId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      sessionId: ctx.sessionId,
    },
  });
});
