import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";

export default protectedProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await db.savePushToken(ctx.user.id, input.token);
    return { success: true };
  });
